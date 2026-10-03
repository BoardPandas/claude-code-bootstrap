#!/usr/bin/env node
//
// sync-codex.test.mjs -- assert that the Codex mirror generator still catches drift.
//
// `sync-codex.mjs --check` is what keeps AGENTS.md, .agents/skills/ and .codex/ honest.
// A check that has quietly stopped comparing something prints "OK" forever, which is
// exactly how the hand-maintained mirrors in sibling repos rotted. So: build a fixture,
// generate, confirm --check passes, then break one thing at a time and assert --check
// exits 1 and names it.
//
// Node built-ins only, matching the generator. Run with: npm test

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const SYNC = join(dirname(fileURLToPath(import.meta.url)), "sync-codex.mjs");

let base;

const write = (root, p, s) => {
  mkdirSync(join(root, dirname(p)), { recursive: true });
  writeFileSync(join(root, p), s);
};
const read = (root, p) => readFileSync(join(root, p), "utf8");
const run = (cwd, ...args) => spawnSync(process.execPath, [SYNC, ...args], { cwd, encoding: "utf8" });

function fixture() {
  const dir = mkdtempSync(join(tmpdir(), "sync-codex-"));
  cpSync(base, dir, { recursive: true });
  return dir;
}

function generated() {
  const dir = fixture();
  const r = run(dir);
  assert.equal(r.status, 0, r.stderr);
  return dir;
}

function assertCheckFails(dir, pattern) {
  const r = run(dir, "--check");
  assert.equal(r.status, 1, `expected --check to fail\n${r.stdout}${r.stderr}`);
  assert.match(r.stderr, pattern);
}

before(() => {
  base = mkdtempSync(join(tmpdir(), "sync-codex-base-"));
  const w = (p, s) => write(base, p, s);
  w("CLAUDE.md", "# Fixture\n\nProject rules.\n");
  w(".claude/rules/always.md", "---\ndescription: always on\n---\n\n# Always\n\n```md\n## [1.0.0]\n```\n");
  w(".claude/rules/scoped.md", '---\ndescription: scoped\npaths:\n  - "src/**"\n---\n\nScoped body.\n');
  w(
    ".claude/settings.json",
    JSON.stringify(
      {
        permissions: { deny: ["Read(**/.env)", "Edit(**/dist/**)", "Bash(git clone ext::*)"] },
        hooks: {
          SessionStart: [{ hooks: [{ type: "command", command: "bash .claude/scripts/start.sh" }] }],
          PreToolUse: [
            {
              matcher: "Bash",
              hooks: [
                {
                  type: "command",
                  if: "Bash(git commit*)",
                  command: "bash .claude/scripts/gate.sh",
                  statusMessage: "Gating...",
                },
              ],
            },
            { matcher: "EnterPlanMode|ExitPlanMode", hooks: [{ type: "command", command: "bash .claude/scripts/plan.sh" }] },
            { matcher: "Write|Edit", hooks: [{ type: "command", command: "bash .claude/scripts/edit.sh" }] },
          ],
          Stop: [{ hooks: [{ type: "command", command: "printf '\\a'" }] }],
          Notification: [{ hooks: [{ type: "command", command: "printf '\\a'" }] }],
        },
        plansDirectory: "tasks",
      },
      null,
      2,
    ),
  );
  for (const s of ["start", "gate", "plan", "edit"]) w(`.claude/scripts/${s}.sh`, "#!/usr/bin/env bash\nexit 0\n");
  w(
    ".claude/agents/reader.md",
    "---\nname: reader\ndescription: Reads things.\nmodel: sonnet\neffort: high\nmemory: project\ntools:\n  - Read\n  - Grep\n---\n\nRead only.\n",
  );
  w(
    ".claude/agents/writer.md",
    '---\nname: writer\ndescription: "Writes \\"things\\"."\nmodel: opus\nisolation: worktree\ntools: Read, Edit, Bash\n---\n\nUses a backslash \\ and """ quotes.\n',
  );
  w(
    ".claude/skills/auto/SKILL.md",
    "---\nname: auto\ndescription: Apply <slug> to a repo.\nmodel: sonnet\n---\n\nSee ${CLAUDE_SKILL_DIR}/references/ref.md with $ARGUMENTS.\n",
  );
  w(".claude/skills/auto/references/ref.md", "Ref in ${CLAUDE_SKILL_DIR}.\n");
  w(
    ".claude/skills/manual/SKILL.md",
    "---\nname: manual\ndescription: >\n  Folded description\n  over two lines.\ndisable-model-invocation: true\nagent: writer\n---\n\nManual.\n",
  );
});

after(() => rmSync(base, { recursive: true, force: true }));

test("a fresh generation passes --check", () => {
  const dir = generated();
  const r = run(dir, "--check");
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /OK -- Codex mirror current \(2 skills, 2 agents, 2 hooks/);
});

test("--check writes nothing and reports every missing file", () => {
  const dir = fixture();
  assertCheckFails(dir, /AGENTS\.md: missing/);
  assert.equal(existsSync(join(dir, "AGENTS.md")), false);
  assert.equal(existsSync(join(dir, ".codex")), false);
});

test("a hand-edited generated file is stale", () => {
  const dir = generated();
  write(dir, ".agents/skills/auto/SKILL.md", `${read(dir, ".agents/skills/auto/SKILL.md")}\nhand edit\n`);
  assertCheckFails(dir, /\.agents\/skills\/auto\/SKILL\.md: stale/);
});

test("a Claude source edit makes the mirror stale", () => {
  const dir = generated();
  write(dir, "CLAUDE.md", "# Fixture\n\nChanged.\n");
  assertCheckFails(dir, /AGENTS\.md: stale/);
});

test("a file in an owned directory with no source is unexpected, and sync removes it", () => {
  const dir = generated();
  write(dir, ".agents/skills/orphan/SKILL.md", "---\nname: orphan\ndescription: x\n---\n");
  write(dir, ".codex/agents/ghost.toml", 'name = "ghost"\n');
  assertCheckFails(dir, /\.agents\/skills\/orphan\/SKILL\.md: unexpected/);
  assertCheckFails(dir, /\.codex\/agents\/ghost\.toml: unexpected/);
  assert.equal(run(dir).status, 0);
  assert.equal(existsSync(join(dir, ".agents/skills/orphan")), false);
  assert.equal(existsSync(join(dir, ".codex/agents/ghost.toml")), false);
});

test("CRLF line endings are not drift", () => {
  const dir = generated();
  write(dir, "AGENTS.md", read(dir, "AGENTS.md").replace(/\n/g, "\r\n"));
  assert.equal(run(dir, "--check").status, 0);
});

test("a lowercase agents.md is refused: it collides with AGENTS.md off Linux", () => {
  const dir = fixture();
  write(dir, "agents.md", "# Agent Registry\n");
  assertCheckFails(dir, /agents\.md: collides with the generated AGENTS\.md/);
});

test("AGENTS.md over Codex's 32 KiB read limit fails", () => {
  const dir = fixture();
  write(dir, "CLAUDE.md", `# Big\n\n${"x".repeat(33 * 1024)}\n`);
  const r = run(dir);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /Codex stops reading at 32768 B/);
});

test("an unmapped hook matcher tool fails instead of being guessed", () => {
  const dir = fixture();
  const settings = JSON.parse(read(dir, ".claude/settings.json"));
  settings.hooks.PreToolUse.push({ matcher: "Skill", hooks: [{ type: "command", command: "true" }] });
  write(dir, ".claude/settings.json", JSON.stringify(settings));
  const r = run(dir);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /matcher token "Skill" has no Codex mapping/);
});

test("a skill whose name does not match its directory fails", () => {
  const dir = fixture();
  write(dir, ".claude/skills/auto/SKILL.md", "---\nname: other\ndescription: x\n---\n\nBody.\n");
  const r = run(dir);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /name "other" must match its directory "auto"/);
});

test("skills: frontmatter reduced to name + description, Claude-only paths expanded", () => {
  const dir = generated();
  const auto = read(dir, ".agents/skills/auto/SKILL.md");
  assert.match(auto, /^---\nname: auto\ndescription: "Apply slug to a repo\."\n---\n/);
  assert.doesNotMatch(auto, /model:|CLAUDE_SKILL_DIR/);
  assert.match(auto, /See \.agents\/skills\/auto\/references\/ref\.md/);
  assert.match(auto, /`\$ARGUMENTS` is the text the user supplied/);
  assert.equal(read(dir, ".agents/skills/auto/references/ref.md"), "Ref in .agents/skills/auto.\n");
  assert.equal(existsSync(join(dir, ".agents/skills/auto/agents/openai.yaml")), false);

  const manual = read(dir, ".agents/skills/manual/SKILL.md");
  assert.match(manual, /description: "Folded description over two lines\."/);
  assert.match(manual, /spawn the `writer` custom agent/);
  assert.match(read(dir, ".agents/skills/manual/agents/openai.yaml"), /allow_implicit_invocation: false/);
});

test("agents: model tier, effort, and a sandbox that is only ever narrowed", () => {
  const dir = generated();
  const reader = read(dir, ".codex/agents/reader.toml");
  assert.match(reader, /^model = "gpt-6-luna"$/m);
  assert.match(reader, /^model_reasoning_effort = "high"$/m);
  assert.match(reader, /^sandbox_mode = "read-only"$/m);
  assert.match(reader, /\.claude\/agent-memory\/reader\/MEMORY\.md/);

  const writer = read(dir, ".codex/agents/writer.toml");
  assert.match(writer, /^model = "gpt-6-sol"$/m);
  assert.match(writer, /^description = "Writes \\"things\\"\."$/m);
  assert.doesNotMatch(writer, /sandbox_mode/);
  assert.match(writer, /isolated git worktree\. Codex does not/);
  // TOML multiline basic strings: backslashes and triple quotes must be escaped.
  assert.match(writer, /backslash \\\\ and ""\\" quotes/);
});

test("hooks: git-root paths, `if` dropped, unsupported hooks reported not dropped", () => {
  const dir = generated();
  const hooks = JSON.parse(read(dir, ".codex/hooks.json")).hooks;
  const gate = hooks.PreToolUse[0];
  assert.equal(gate.matcher, "Bash");
  assert.equal(gate.hooks[0].command, 'bash "$(git rev-parse --show-toplevel)/.claude/scripts/gate.sh"');
  assert.equal(gate.hooks[0].commandWindows, "bash .claude/scripts/gate.sh");
  assert.equal(gate.hooks[0].statusMessage, "Gating...");
  assert.equal("if" in gate.hooks[0], false);
  assert.equal(hooks.PreToolUse.length, 1, "plan-mode and non-apply_patch edit hooks are not mirrored");
  assert.equal(hooks.Stop, undefined);
  assert.equal(hooks.Notification, undefined);

  assert.match(read(dir, ".codex/config.toml"), /\[tui\]\nnotifications = true/);
  const agentsMd = read(dir, "AGENTS.md");
  assert.match(agentsMd, /EnterPlanMode\|ExitPlanMode.*no hookable/);
  assert.match(agentsMd, /edit\.sh -- Codex edits arrive as apply_patch/);
});

test("hooks: a $CLAUDE_PROJECT_DIR anchor maps to the git root, Windows keeps the relative form", () => {
  const dir = fixture();
  const settings = JSON.parse(read(dir, ".claude/settings.json"));
  settings.hooks.PreToolUse[0].hooks[0].command = 'bash "$CLAUDE_PROJECT_DIR"/.claude/scripts/gate.sh';
  write(dir, ".claude/settings.json", JSON.stringify(settings, null, 2));
  const r = run(dir);
  assert.equal(r.status, 0, r.stderr);
  const gate = JSON.parse(read(dir, ".codex/hooks.json")).hooks.PreToolUse[0].hooks[0];
  assert.equal(gate.command, 'bash "$(git rev-parse --show-toplevel)"/.claude/scripts/gate.sh');
  assert.equal(gate.commandWindows, "bash .claude/scripts/gate.sh");
});

test("an Edit|Write hook is mirrored once its script handles apply_patch", () => {
  const dir = fixture();
  write(dir, ".claude/scripts/edit.sh", "#!/usr/bin/env bash\n# parses apply_patch input\nexit 0\n");
  assert.equal(run(dir).status, 0);
  const hooks = JSON.parse(read(dir, ".codex/hooks.json")).hooks;
  assert.ok(hooks.PreToolUse.some((g) => g.matcher === "Write|Edit"));
});

test("AGENTS.md: CLAUDE.md, deny rules, scoped index, always-on rules with fences intact", () => {
  const dir = generated();
  const md = read(dir, "AGENTS.md");
  assert.match(md, /^<!-- GENERATED by scripts\/sync-codex\.mjs/);
  assert.match(md, /# Fixture\n\nProject rules\./);
  assert.match(md, /Never read: `\*\*\/\.env`/);
  assert.match(md, /Never edit: `\*\*\/dist\/\*\*`/);
  assert.match(md, /Never run: `git clone ext::\*`/);
  assert.match(md, /`\.claude\/rules\/scoped\.md` -- scoped\. Paths: `src\/\*\*`/);
  assert.match(md, /#### Always\n/);
  assert.match(md, /```md\n## \[1\.0\.0\]\n```/, "headings inside code fences must not be demoted");
  assert.match(md, /Explicit-only skills .*`\$manual`/);
});

test("gitignored skill scaffolding is not mirrored", () => {
  const dir = fixture();
  const git = (...a) => spawnSync("git", a, { cwd: dir, encoding: "utf8" });
  if (git("init", "-q").status !== 0) return; // no git on this runner
  write(dir, ".claude/skills/auto-workspace/SKILL.md", "---\nname: nope\n---\n");
  write(dir, ".claude/skills/auto/.DS_Store", "\0binary");
  write(dir, ".gitignore", ".claude/skills/*-workspace/\n.DS_Store\n");
  assert.equal(run(dir).status, 0);
  assert.equal(existsSync(join(dir, ".agents/skills/auto-workspace")), false);
  assert.equal(existsSync(join(dir, ".agents/skills/auto/.DS_Store")), false);
  assert.equal(run(dir, "--check").status, 0);
});
