#!/usr/bin/env node
//
// check-claude-wiring.mjs -- assert that .claude/ configuration is actually wired up.
//
// Node built-ins only, no dependencies, no hardcoded repo paths. Runs as-is in
// any repo with a .claude/ directory.
//
// The premise: rule scoping and hooks fail SILENTLY when miswired. There is no
// startup validation and no warning, so a dead rule is indistinguishable from a
// working one. The failure mode is never "it broke" -- it is "it never worked,
// and the repo has been operating for months as though it did."
//
// Checks 1, 3, 6 encode Claude Code's frontmatter and hook contract as observed
// 2026-07-29. If the product changes, this guard is what tells you -- update the
// assertion deliberately rather than deleting it.
//
// BP: practices/claude-config/verify-claude-wiring-in-ci.md
// LL-G: kb/claude-code/{cursor-frontmatter-keys-ignored,hook-matcher-tool-names-only,
//                       hook-empty-path-formats-repo,line-budgets-gamed-by-long-lines}.md

import { globSync, readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const errors = [];
const warnings = [];
const notes = [];

// Always-on context ceilings, in bytes. Budget by BYTES, not lines: a line-count
// budget keeps passing while single lines grow to thousands of characters.
// Set slightly above current reality so growth is a deliberate decision.
const CLAUDE_MD_CEILING = 16 * 1024;
const ALWAYS_ON_CEILING = 20 * 1024;

const BYTES_PER_TOKEN = 3.6;
const tokens = (bytes) => Math.round(bytes / BYTES_PER_TOKEN);

// Always posix-separated. path.relative() yields backslashes on Windows, which
// silently breaks every string comparison against a config key (all of which are
// authored with forward slashes) and makes reported paths platform-dependent.
const rel = (p) => (relative(ROOT, p) || p).split("\\").join("/");
const read = (p) => readFileSync(p, "utf8");

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

// Worktrees are full checkouts carrying stale copies of .claude/, so they report
// defects that were already fixed. Exclude them from every scan.
const EXCLUDED = /(^|\/)(node_modules|\.git|\.claude\/worktrees)(\/|$)/;
const notExcluded = (p) => !EXCLUDED.test(p.split("\\").join("/"));

function frontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return m ? m[1] : null;
}

// ---------------------------------------------------------------- exemptions
const EXEMPT_PATH = join(ROOT, ".claude/references/wiring-exemptions.json");
let exemptions = [];
if (existsSync(EXEMPT_PATH)) {
  try {
    const parsed = JSON.parse(read(EXEMPT_PATH));
    exemptions = parsed.deadGlobsAllowed ?? [];
  } catch (e) {
    errors.push(`.claude/references/wiring-exemptions.json is not valid JSON: ${e.message}`);
  }
}
const usedExemptions = new Set();
function isExempt(file, glob) {
  for (const ex of exemptions) {
    if (ex.file === file && (ex.globs ?? []).includes(glob)) {
      usedExemptions.add(`${file}::${glob}`);
      return true;
    }
  }
  return false;
}

// ------------------------------------------------- 1 & 2: rule frontmatter
const ruleFiles = existsSync(join(ROOT, ".claude/rules"))
  ? walk(join(ROOT, ".claude/rules")).filter((p) => p.endsWith(".md")).filter(notExcluded)
  : [];

let alwaysOnBytes = 0;
const alwaysOnFiles = [];

for (const file of ruleFiles) {
  const name = rel(file);
  const text = read(file);
  const front = frontmatter(text);

  // 1. Cursor .mdc keys invert scoping instead of failing.
  if (front && /^\s*(globs|alwaysApply)\s*:/m.test(front)) {
    errors.push(
      `${name}: uses Cursor .mdc keys (globs:/alwaysApply:). Claude Code ignores them, ` +
        `so this file loads in EVERY session -- the opposite of alwaysApply:false. Use paths:.`,
    );
  }

  const hasPaths = front && /^\s*paths\s*:/m.test(front);
  if (!hasPaths) {
    alwaysOnBytes += Buffer.byteLength(text);
    alwaysOnFiles.push(name);
    continue;
  }

  // 2. Every paths: glob must match at least one real file.
  const globs = [];
  const block = front.match(/^\s*paths\s*:\s*\r?\n((?:\s*-\s*.+\r?\n?)+)/m);
  if (block) {
    for (const line of block[1].split(/\r?\n/)) {
      const m = line.match(/^\s*-\s*["']?([^"'\s].*?)["']?\s*$/);
      if (m) globs.push(m[1]);
    }
  }
  if (globs.length === 0) {
    errors.push(`${name}: has a paths: key with no globs under it, so it can never fire.`);
  }

  // A duplicate glob is harmless at runtime but signals a blind append to a list
  // whose tail the author never read.
  const dupes = globs.filter((g, i) => globs.indexOf(g) !== i);
  for (const g of new Set(dupes)) {
    errors.push(`${name}: glob ${JSON.stringify(g)} is listed more than once.`);
  }

  for (const g of globs) {
    let hits = 0;
    try {
      hits = globSync(g, { cwd: ROOT }).filter(notExcluded).length;
    } catch (e) {
      errors.push(`${name}: glob ${JSON.stringify(g)} is not a valid pattern (${e.message}).`);
      continue;
    }
    if (hits > 0) continue;
    if (isExempt(name, g)) {
      notes.push(`${name}: glob ${JSON.stringify(g)} matches 0 files (exempted).`);
    } else {
      errors.push(
        `${name}: glob ${JSON.stringify(g)} matches 0 files, so this rule can never fire. ` +
          `Point it at a real path, drop it, or record it in .claude/references/wiring-exemptions.json with a reason.`,
      );
    }
  }
}

// Stale exemptions: an allowance for a glob that no longer exists is rot.
for (const ex of exemptions) {
  for (const g of ex.globs ?? []) {
    if (!usedExemptions.has(`${ex.file}::${g}`)) {
      errors.push(
        `wiring-exemptions.json: ${ex.file} glob ${JSON.stringify(g)} is exempted but is no longer ` +
          `a dead glob in that file (it now matches, or the rule changed). Remove the stale entry.`,
      );
    }
  }
}

// ------------------------------------------------------- 3 & 5: hook wiring
const SETTINGS = join(ROOT, ".claude/settings.json");
// A matcher is a bare tool name, optionally |-separated. Tool(pattern) is
// permissions syntax; in a matcher it matches nothing and the hook never runs.
const TOOL_MATCHER = /^[A-Za-z][A-Za-z0-9_]*(\|[A-Za-z][A-Za-z0-9_]*)*$/;

if (existsSync(SETTINGS)) {
  let settings;
  try {
    settings = JSON.parse(read(SETTINGS));
  } catch (e) {
    errors.push(`.claude/settings.json is not valid JSON: ${e.message}`);
    settings = null;
  }

  if (settings) {
    const raw = read(SETTINGS);

    for (const [event, blocks] of Object.entries(settings.hooks ?? {})) {
      for (const block of blocks) {
        const m = block.matcher;
        if (m !== undefined && !TOOL_MATCHER.test(m)) {
          errors.push(
            `.claude/settings.json: ${event} matcher ${JSON.stringify(m)} is not a bare tool name. ` +
              `Tool(pattern) is permissions syntax and matches nothing, so the hook never runs. ` +
              `Use matcher:"Bash" plus if:"Bash(git commit*)" on the handler.`,
          );
        }
        // Referenced hook scripts must exist, or the hook is dead on arrival.
        for (const h of block.hooks ?? []) {
          const cmd = h.command ?? "";
          const scriptRef = cmd.match(/(?:^|\s)((?:\.claude|scripts)\/[\w./-]+\.(?:sh|mjs|js|py))/);
          if (scriptRef && !existsSync(join(ROOT, scriptRef[1]))) {
            errors.push(
              `.claude/settings.json: ${event} hook references ${scriptRef[1]}, which does not exist.`,
            );
          }
        }
      }
    }

    // 5. Silencing stderr AND the exit code makes every future breakage unfalsifiable.
    if (/2>\/dev\/null[^"']*\|\|\s*true/.test(raw)) {
      errors.push(
        `.claude/settings.json: a hook uses "2>/dev/null || true", which discards both the error ` +
          `stream and the exit code. Let it fail loudly, or log to a file.`,
      );
    }
  }
}

// -------------------------------- 6: blocking hooks must write to stderr
// A blocking hook (exit 2) has its stdout DISCARDED, so a refusal arrives with
// no reason attached. This is the defect the 2026-07-29 audit found live.
const hookScripts = walk(join(ROOT, ".claude/scripts")).filter((p) => p.endsWith(".sh")).filter(notExcluded);
for (const file of hookScripts) {
  const text = read(file);
  if (/^\s*exit\s+2\b/m.test(text) && !/>&2/.test(text)) {
    errors.push(
      `${rel(file)}: exits 2 (blocking) but never writes to stderr. A blocking hook's stdout is ` +
        `discarded, so the user sees a refused command with no reason. Wrap the message in { ... } >&2.`,
    );
  }
}

// ------------------- 7: hooks must not interpolate a path from a dead variable
// There is no $CLAUDE_FILE_PATH. It expands to "", and an empty path is not a
// no-op: `prettier --write ""` walks the entire repo.
for (const file of [...hookScripts, ...(existsSync(SETTINGS) ? [SETTINGS] : [])]) {
  const text = read(file);
  if (!/CLAUDE_FILE_PATH/.test(text)) continue;
  // Using it as a fallback alongside stdin parsing is defensive and correct.
  const isFallback = /CLAUDE_FILE_PATH:-/.test(text) && /tool_input/.test(text);
  if (!isFallback) {
    errors.push(
      `${rel(file)}: uses $CLAUDE_FILE_PATH, which does not exist. It expands to "" and an empty ` +
        `path argument makes most tools walk the whole repo. Parse tool_input.file_path from stdin ` +
        `and hard-guard on a non-empty value.`,
    );
  }
}

// ----------------- 8: skill/agent frontmatter keys are hyphenated, not snake
const UNDERSCORE_KEYS =
  /^\s*(disable_model_invocation|user_invocable|allowed_tools|keep_coding_instructions|argument_hint)\s*:/m;
for (const dir of [".claude/skills", ".claude/agents"]) {
  for (const file of walk(join(ROOT, dir)).filter((p) => p.endsWith(".md")).filter(notExcluded)) {
    const front = frontmatter(read(file));
    if (front && UNDERSCORE_KEYS.test(front)) {
      errors.push(
        `${rel(file)}: frontmatter uses an underscored key. All Claude Code frontmatter keys are ` +
          `hyphenated; the underscored form is silently ignored.`,
      );
    }
  }
}

// -------------------------------------------- 4: always-on context budget
const CLAUDE_MD = join(ROOT, "CLAUDE.md");
let claudeMdBytes = 0;
if (existsSync(CLAUDE_MD)) {
  const text = read(CLAUDE_MD);
  claudeMdBytes = Buffer.byteLength(text);
  alwaysOnBytes += claudeMdBytes;
  alwaysOnFiles.unshift("CLAUDE.md");

  if (claudeMdBytes > CLAUDE_MD_CEILING) {
    warnings.push(
      `CLAUDE.md is ${claudeMdBytes} bytes (~${tokens(claudeMdBytes)} tok), over the ` +
        `${CLAUDE_MD_CEILING}-byte ceiling. Move detail down into docs and keep pointers up here.`,
    );
  }

  // @ imports are unconditional and easy to miss: they cause no violation, only cost.
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^@(\S+)/);
    if (!m) continue;
    const target = join(ROOT, m[1]);
    if (existsSync(target)) {
      const b = Buffer.byteLength(read(target));
      alwaysOnBytes += b;
      alwaysOnFiles.push(`${m[1]} (@import)`);
    } else {
      errors.push(`CLAUDE.md: @import ${m[1]} does not exist.`);
    }
  }
}

if (alwaysOnBytes > ALWAYS_ON_CEILING) {
  warnings.push(
    `Always-on context is ${alwaysOnBytes} bytes (~${tokens(alwaysOnBytes)} tok), over the ` +
      `${ALWAYS_ON_CEILING}-byte ceiling. Above this, individual rules stop being salient ` +
      `regardless of wording.`,
  );
}

// ------------------------------------------------------------------ report
const line = "─".repeat(72);
console.log(line);
console.log("Claude wiring check");
console.log(line);
console.log(`Rules scanned        ${ruleFiles.length}`);
console.log(`Hook scripts scanned ${hookScripts.length}`);
console.log(
  `Always-on context    ${alwaysOnBytes} bytes (~${tokens(alwaysOnBytes)} tok) / ` +
    `${ALWAYS_ON_CEILING} ceiling`,
);
for (const f of alwaysOnFiles) console.log(`  · ${f}`);

if (notes.length) {
  console.log(`\nExempted (${notes.length}):`);
  for (const n of notes) console.log(`  · ${n}`);
}
if (warnings.length) {
  console.log(`\nWarnings (${warnings.length}):`);
  for (const w of warnings) console.log(`  ! ${w}`);
}
if (errors.length) {
  console.log(`\nErrors (${errors.length}):`);
  for (const e of errors) console.log(`  ✗ ${e}`);
  console.log(`\n${line}`);
  console.log("FAIL -- .claude wiring has defects that fail silently at runtime.");
  process.exit(1);
}

console.log(`\n${line}`);
console.log("OK -- .claude wiring verified.");
