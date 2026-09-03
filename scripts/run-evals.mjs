#!/usr/bin/env node
//
// run-evals.mjs -- regression-test the agent configuration itself.
//
// The wiring guard proves .claude/ config is WIRED. It cannot prove the config
// still WORKS: a skill whose body was replaced wholesale by a template sync, a
// CLAUDE.md rule pruned one line too far, or a hook whose message no longer
// lands all pass `check:claude` while behaving completely differently.
//
// update-practices is explicitly authorised to "replace the body wholesale with
// the template version" (.claude/skills/update-practices/SKILL.md). That is the
// single most likely way this repo silently loses a behaviour, and nothing else
// in CI would notice.
//
// Two modes, because they have different costs and different audiences:
//
//   --validate   Structural only. No API calls, no CLI, no cost. Every case must
//                parse, name real targets, and state at least one expectation.
//                Runs on every push. Catches a corpus that has rotted into
//                unrunnable shape -- which is how eval suites usually die.
//
//   (default)    Behavioural. Runs each case through `claude -p` in read-only
//                mode, then judges the transcript against the case's Expect
//                bullets. Needs the claude CLI and costs tokens.
//
// A case that cannot be run is a FAILURE, never a skip. An eval suite that
// quietly degrades to zero cases is indistinguishable from one that passes, and
// that is the exact failure mode this repo exists to prevent.
//
// Node built-ins only, matching check-claude-wiring.mjs.
//
// BP: practices/claude-config/verify-claude-wiring-in-ci.md

import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const CASE_DIR = join(ROOT, ".claude/evals/cases");
const VALIDATE_ONLY = process.argv.includes("--validate");
const ONLY = process.argv.find((a) => a.startsWith("--only="))?.slice("--only=".length);

// The playbook's floor. Below this the suite stops being a regression net and
// starts being decoration, so shrinking the corpus has to be deliberate.
const MIN_CASES = 20;

const KINDS = new Set(["guard", "skill", "agent", "hook", "policy"]);
const SEVERITIES = new Set(["high", "medium"]);

const errors = [];
const rel = (p) => (relative(ROOT, p) || p).split("\\").join("/");

// ---------------------------------------------------------------- parsing
// Deliberately not a YAML dependency: this repo ships with zero dependencies and
// the frontmatter here is a flat scalar/list subset. A real parser would be more
// permissive than the format we actually want to enforce.
function parseCase(file) {
  const text = readFileSync(file, "utf8");
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!m) return { error: "no YAML frontmatter block" };

  const front = {};
  for (const line of m[1].split(/\r?\n/)) {
    if (!line.trim() || /^\s*#/.test(line)) continue;
    const kv = line.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/);
    if (!kv) return { error: `unparsable frontmatter line: ${JSON.stringify(line)}` };
    const [, key, rawVal] = kv;
    const val = rawVal.trim();
    front[key] =
      val.startsWith("[") && val.endsWith("]")
        ? val
            .slice(1, -1)
            .split(",")
            .map((s) => s.trim().replace(/^["']|["']$/g, ""))
            .filter(Boolean)
        : val.replace(/^["']|["']$/g, "");
  }

  const body = m[2];
  const section = (name) => {
    const re = new RegExp(`^##\\s+${name}\\s*$([\\s\\S]*?)(?=^##\\s|\\s*$(?![\\s\\S]))`, "im");
    return body.match(re)?.[1]?.trim() ?? "";
  };

  return { front, task: section("Task"), expect: section("Expect") };
}

// Expectations are bullets so the judge gets discrete, checkable claims rather
// than a paragraph it can partially satisfy and call a pass.
const bullets = (s) =>
  s
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*[-*]\s+/, "").trim())
    .filter((l) => l && !/^[-*]?\s*$/.test(l));

// -------------------------------------------------------------- discovery
if (!existsSync(CASE_DIR) || !statSync(CASE_DIR).isDirectory()) {
  console.error(`FAIL -- eval corpus directory ${rel(CASE_DIR)} does not exist.`);
  process.exit(1);
}

let files = readdirSync(CASE_DIR)
  .filter((f) => f.endsWith(".md"))
  .sort()
  .map((f) => join(CASE_DIR, f));

if (files.length < MIN_CASES) {
  errors.push(
    `corpus has ${files.length} cases, below the ${MIN_CASES}-case floor. A suite this small ` +
      `stops catching regressions. Add cases, or lower MIN_CASES deliberately with a reason.`,
  );
}

const cases = [];
const seenIds = new Set();

for (const file of files) {
  const parsed = parseCase(file);
  if (parsed.error) {
    errors.push(`${rel(file)}: ${parsed.error}`);
    continue;
  }
  const { front, task, expect } = parsed;

  for (const key of ["id", "kind", "severity"]) {
    if (!front[key]) errors.push(`${rel(file)}: frontmatter is missing required key "${key}".`);
  }
  if (front.kind && !KINDS.has(front.kind)) {
    errors.push(`${rel(file)}: kind "${front.kind}" is not one of ${[...KINDS].join(", ")}.`);
  }
  if (front.severity && !SEVERITIES.has(front.severity)) {
    errors.push(`${rel(file)}: severity "${front.severity}" is not one of ${[...SEVERITIES].join(", ")}.`);
  }
  if (front.id) {
    if (seenIds.has(front.id)) errors.push(`${rel(file)}: duplicate id "${front.id}".`);
    seenIds.add(front.id);
  }

  // A case pointing at a file that no longer exists is testing nothing. This is
  // the eval-corpus equivalent of the guard's dead-glob check.
  for (const t of [].concat(front.targets ?? [])) {
    if (!existsSync(join(ROOT, t))) {
      errors.push(`${rel(file)}: targets "${t}", which does not exist. Retarget or delete the case.`);
    }
  }

  if (!task) errors.push(`${rel(file)}: has no "## Task" section, so there is nothing to run.`);
  if (!bullets(expect).length) {
    errors.push(`${rel(file)}: has no "## Expect" bullets. An expectation-free case always passes.`);
  }

  cases.push({ file, id: front.id, kind: front.kind, severity: front.severity, task, expect });
}

if (errors.length) {
  console.log("Eval corpus validation");
  console.log("─".repeat(72));
  for (const e of errors) console.log(`  ✗ ${e}`);
  console.log(`\nFAIL -- ${errors.length} corpus defect(s).`);
  process.exit(1);
}

console.log(`Eval corpus: ${cases.length} cases, all structurally valid.`);

if (VALIDATE_ONLY) {
  console.log("OK -- structure only (--validate); no behavioural run.");
  process.exit(0);
}

// ----------------------------------------------------------- behavioural run
// Read-only by construction. The agent under test gets no Write, Edit or Bash,
// so a misbehaving case cannot mutate the repo it is measuring.
const AGENT_TOOLS = "Read,Glob,Grep";

function claude(prompt, extraArgs = []) {
  const r = spawnSync(
    "claude",
    ["-p", prompt, "--permission-mode", "plan", "--allowed-tools", AGENT_TOOLS, ...extraArgs],
    { cwd: ROOT, encoding: "utf8", maxBuffer: 32 * 1024 * 1024, timeout: 10 * 60 * 1000 },
  );
  if (r.error) return { ok: false, text: `${r.error.message}` };
  if (r.status !== 0) return { ok: false, text: `exit ${r.status}: ${(r.stderr || "").slice(0, 800)}` };
  return { ok: true, text: r.stdout };
}

const probe = spawnSync("claude", ["--version"], { encoding: "utf8" });
if (probe.error || probe.status !== 0) {
  console.error(
    "\nFAIL -- the `claude` CLI is not available, so the behavioural pass cannot run.\n" +
      "        This is a failure, not a skip: a suite that silently runs zero cases is\n" +
      "        indistinguishable from one that passes. Use --validate for structure-only.",
  );
  process.exit(1);
}

const selected = ONLY ? cases.filter((c) => c.id === ONLY) : cases;
if (ONLY && !selected.length) {
  console.error(`FAIL -- --only=${ONLY} matched no case.`);
  process.exit(1);
}

const results = [];
for (const c of selected) {
  process.stdout.write(`  · ${c.id} ... `);

  const run = claude(c.task);
  if (!run.ok) {
    console.log("ERROR");
    results.push({ ...c, pass: false, reason: `run failed: ${run.text}` });
    continue;
  }

  const judgePrompt = [
    "You are grading one response against explicit expectations. Answer only with JSON.",
    "",
    "EXPECTATIONS (every one must hold):",
    ...bullets(c.expect).map((b, i) => `${i + 1}. ${b}`),
    "",
    "RESPONSE UNDER TEST:",
    "<<<RESPONSE",
    run.text.slice(0, 40000),
    "RESPONSE",
    "",
    'Reply with exactly: {"pass": true|false, "reason": "<= 30 words"}',
    "Mark pass=false if any expectation is unmet, contradicted, or simply not addressed.",
  ].join("\n");

  const judged = claude(judgePrompt);
  if (!judged.ok) {
    console.log("ERROR");
    results.push({ ...c, pass: false, reason: `judge failed: ${judged.text}` });
    continue;
  }

  const json = judged.text.match(/\{[\s\S]*?"pass"[\s\S]*?\}/);
  if (!json) {
    console.log("ERROR");
    results.push({ ...c, pass: false, reason: "judge returned no parsable JSON verdict" });
    continue;
  }

  let verdict;
  try {
    verdict = JSON.parse(json[0]);
  } catch (e) {
    console.log("ERROR");
    results.push({ ...c, pass: false, reason: `unparsable judge verdict: ${e.message}` });
    continue;
  }

  console.log(verdict.pass ? "pass" : "FAIL");
  results.push({ ...c, pass: Boolean(verdict.pass), reason: verdict.reason ?? "" });
}

// ------------------------------------------------------------------ report
const failed = results.filter((r) => !r.pass);
const line = "─".repeat(72);
console.log(`\n${line}`);
console.log(`Evals: ${results.length - failed.length}/${results.length} passed`);

if (failed.length) {
  console.log(`\nFailures (${failed.length}):`);
  for (const f of failed) {
    console.log(`  ✗ [${f.severity}] ${f.id} (${rel(f.file)})`);
    console.log(`      ${f.reason}`);
  }
  console.log(`\n${line}`);
  console.log("FAIL -- the configuration no longer behaves as its cases require.");
  process.exit(1);
}

console.log(`\n${line}`);
console.log("OK -- configuration behaves as specified.");
