#!/usr/bin/env node
//
// check-claude-wiring.test.mjs -- assert that the wiring guard still fires.
//
// The guard exists because miswired .claude/ config fails silently. A guard whose
// checks have been narrowed to match nothing fails the same way: it prints
// "OK -- .claude wiring verified" forever and nobody looks again. This file is
// what stops that, so every check in the guard needs a case here.
//
// Method: build a minimal fixture repo that PASSES, then mutate one thing at a
// time and assert the guard exits 1 and names the defect. Asserting on the
// message (not just the exit code) is what catches a mutation that happens to
// trip a *different* check.
//
// Node built-ins only, matching the guard itself. Run with: npm test

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, cpSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const GUARD = join(dirname(fileURLToPath(import.meta.url)), "check-claude-wiring.mjs");

let base;

// A fixture that satisfies every check. Each test copies this, breaks one thing,
// and asserts the guard notices.
before(() => {
  base = mkdtempSync(join(tmpdir(), "wiring-base-"));
  const w = (p, s) => {
    mkdirSync(join(base, dirname(p)), { recursive: true });
    writeFileSync(join(base, p), s);
  };

  w("CLAUDE.md", "# Fixture\n\nSmall enough to sit under both byte ceilings.\n");
  w(
    ".claude/rules/scoped.md",
    '---\ndescription: scoped rule\npaths:\n  - "CLAUDE.md"\n---\n\nBody.\n',
  );
  w(
    ".claude/settings.json",
    JSON.stringify(
      {
        hooks: {
          PreToolUse: [
            {
              matcher: "Bash",
              hooks: [{ type: "command", command: 'bash "$CLAUDE_PROJECT_DIR"/.claude/scripts/gate.sh' }],
            },
          ],
        },
      },
      null,
      2,
    ),
  );
  w(".claude/scripts/gate.sh", '#!/usr/bin/env bash\necho "blocked" >&2\nexit 2\n');
  w(".claude/agents/reviewer.md", "---\nname: reviewer\nmodel: sonnet\n---\n\nAgent.\n");
  w(".claude/skills/direct/SKILL.md", "---\nname: direct\nmodel: haiku\n---\n\nSkill.\n");
  w(".claude/skills/bound/SKILL.md", "---\nname: bound\ncontext: fork\nagent: reviewer\n---\n\nSkill.\n");
  w(
    "REVIEW.md",
    "# Review Policy\n\n## Passes\n\n- Correctness\n\n" +
      '## What "Important" means here\n\nIt is wrong.\n\n' +
      "## Cap the nits\n\nThree.\n\n## Do not report\n\nFormatting.\n",
  );
});

after(() => rmSync(base, { recursive: true, force: true }));

// Copies the passing fixture, applies `mutate`, and runs the guard against it.
function run(mutate) {
  const dir = mkdtempSync(join(tmpdir(), "wiring-case-"));
  try {
    cpSync(base, dir, { recursive: true });
    mutate({
      write: (p, s) => {
        mkdirSync(join(dir, dirname(p)), { recursive: true });
        writeFileSync(join(dir, p), s);
      },
      remove: (p) => rmSync(join(dir, p), { force: true }),
    });
    const r = spawnSync(process.execPath, [GUARD], { cwd: dir, encoding: "utf8" });
    return { code: r.status, out: `${r.stdout}${r.stderr}` };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// A mutation that "passes" tells you nothing about the check -- it means the
// fixture was already broken, or the check never ran. Assert the baseline first.
test("baseline fixture passes", () => {
  const { code, out } = run(() => {});
  assert.equal(code, 0, `fixture should pass but did not:\n${out}`);
  assert.match(out, /OK -- \.claude wiring verified/);
});

const matcherSettings = (matcher) =>
  JSON.stringify({
    hooks: {
      PreToolUse: [
        { matcher, hooks: [{ type: "command", command: 'bash "$CLAUDE_PROJECT_DIR"/.claude/scripts/gate.sh' }] },
      ],
    },
  });

const cases = [
  {
    name: "1. Cursor .mdc keys in a rule",
    mutate: ({ write }) =>
      write(".claude/rules/bad.md", '---\nglobs:\n  - "**/*"\nalwaysApply: false\n---\n\nBody.\n'),
    expect: /Cursor \.mdc keys/,
  },
  {
    name: "2. paths: glob matching zero files",
    mutate: ({ write }) =>
      write(".claude/rules/bad.md", '---\npaths:\n  - "no-such-dir/**"\n---\n\nBody.\n'),
    expect: /matches 0 files/,
  },
  {
    name: "2b. paths: key with no globs under it",
    mutate: ({ write }) => write(".claude/rules/bad.md", "---\npaths:\n---\n\nBody.\n"),
    expect: /no globs under it/,
  },
  {
    name: "2c. duplicate glob in one rule",
    mutate: ({ write }) =>
      write(".claude/rules/bad.md", '---\npaths:\n  - "CLAUDE.md"\n  - "CLAUDE.md"\n---\n\nBody.\n'),
    expect: /listed more than once/,
  },
  {
    name: "3. hook matcher using permissions syntax",
    mutate: ({ write }) =>
      write(
        ".claude/settings.json",
        JSON.stringify({
          hooks: {
            PreToolUse: [
              {
                matcher: "Bash(git commit*)",
                hooks: [{ type: "command", command: 'bash "$CLAUDE_PROJECT_DIR"/.claude/scripts/gate.sh' }],
              },
            ],
          },
        }),
      ),
    expect: /uses permission-rule syntax/,
  },
  {
    name: "3. permission syntax hidden in a |-alternation",
    mutate: ({ write }) => write(".claude/settings.json", matcherSettings("Edit|Bash(rm -rf*)")),
    expect: /uses permission-rule syntax/,
  },
  {
    name: "3. matcher that is not a valid regex",
    mutate: ({ write }) => write(".claude/settings.json", matcherSettings("mcp__[")),
    expect: /is not a valid regular expression/,
  },
  {
    name: "3b. hook referencing a script that does not exist",
    mutate: ({ write }) =>
      write(
        ".claude/settings.json",
        JSON.stringify({
          hooks: {
            PreToolUse: [
              {
                matcher: "Bash",
                hooks: [{ type: "command", command: 'bash "$CLAUDE_PROJECT_DIR"/.claude/scripts/ghost.sh' }],
              },
            ],
          },
        }),
      ),
    expect: /which does not exist/,
  },
  {
    name: "3c. settings.json that is not valid JSON",
    mutate: ({ write }) => write(".claude/settings.json", "{ not json"),
    expect: /not valid JSON/,
  },
  {
    name: "3d. hook calling its script by a cwd-relative path",
    mutate: ({ write }) =>
      write(
        ".claude/settings.json",
        JSON.stringify({
          hooks: {
            PreToolUse: [
              {
                matcher: "Bash",
                hooks: [{ type: "command", command: "bash .claude/scripts/gate.sh" }],
              },
            ],
          },
        }),
      ),
    expect: /cwd-relative path/,
  },
  {
    name: "5. hook silencing both stderr and exit code",
    mutate: ({ write }) =>
      write(
        ".claude/settings.json",
        JSON.stringify({
          hooks: {
            PreToolUse: [
              {
                matcher: "Bash",
                hooks: [
                  { type: "command", command: 'bash "$CLAUDE_PROJECT_DIR"/.claude/scripts/gate.sh 2>/dev/null || true' },
                ],
              },
            ],
          },
        }),
      ),
    expect: /discards both the error/,
  },
  {
    name: "6. blocking hook that never writes to stderr",
    mutate: ({ write }) =>
      write(".claude/scripts/gate.sh", '#!/usr/bin/env bash\necho "blocked"\nexit 2\n'),
    expect: /never writes to stderr/,
  },
  {
    name: "7. hook interpolating the nonexistent $CLAUDE_FILE_PATH",
    mutate: ({ write }) =>
      write(".claude/scripts/fmt.sh", '#!/usr/bin/env bash\nprettier --write "$CLAUDE_FILE_PATH"\n'),
    expect: /does not exist/,
  },
  {
    name: "8. underscored frontmatter key on a skill",
    mutate: ({ write }) =>
      write(
        ".claude/skills/direct/SKILL.md",
        "---\nname: direct\nmodel: haiku\ndisable_model_invocation: true\n---\n\nSkill.\n",
      ),
    expect: /underscored key/,
  },
  {
    name: "8b. underscored frontmatter key on an agent",
    mutate: ({ write }) =>
      write(
        ".claude/agents/reviewer.md",
        "---\nname: reviewer\nmodel: sonnet\nallowed_tools: [Read]\n---\n\nAgent.\n",
      ),
    expect: /underscored key/,
  },
  {
    name: "9. skill with neither model: nor agent:",
    mutate: ({ write }) => write(".claude/skills/direct/SKILL.md", "---\nname: direct\n---\n\nSkill.\n"),
    expect: /declares no model: and binds no agent:/,
  },
  {
    name: "9b. skill bound to an agent that does not exist",
    mutate: ({ write }) =>
      write(".claude/skills/bound/SKILL.md", "---\nname: bound\ncontext: fork\nagent: ghost\n---\n\nSkill.\n"),
    expect: /which does not exist in \.claude\/agents/,
  },
  {
    name: "9c. skill inheriting from an agent that declares no model",
    mutate: ({ write }) => write(".claude/agents/reviewer.md", "---\nname: reviewer\n---\n\nAgent.\n"),
    expect: /that agent declares no model/,
  },
  {
    name: "9d. skill binding agent: without context: fork",
    mutate: ({ write }) =>
      write(".claude/skills/bound/SKILL.md", "---\nname: bound\nagent: reviewer\n---\n\nSkill.\n"),
    expect: /without context: fork/,
  },
  {
    name: "4. CLAUDE.md over its byte ceiling",
    mutate: ({ write }) => write("CLAUDE.md", `# Fixture\n\n${"x".repeat(17 * 1024)}\n`),
    expect: /over the 16384-byte ceiling/,
  },
  {
    name: "4b. always-on context over its ceiling",
    // Each rule is under the CLAUDE.md ceiling on its own; unscoped, they sum.
    mutate: ({ write }) => {
      for (const n of [1, 2, 3]) {
        write(`.claude/rules/bulk${n}.md`, `---\ndescription: unscoped\n---\n\n${"x".repeat(8 * 1024)}\n`);
      }
    },
    expect: /Always-on context is \d+ bytes .* over the 20480-byte ceiling/,
  },
  {
    name: "4c. CLAUDE.md @import pointing at a missing file",
    mutate: ({ write }) => write("CLAUDE.md", "# Fixture\n\n@docs/missing.md\n"),
    expect: /@import docs\/missing\.md does not exist/,
  },
  {
    name: "stale entry in wiring-exemptions.json",
    // The rule's glob resolves, so the exemption is unused -- that is the defect.
    mutate: ({ write }) =>
      write(
        ".claude/references/wiring-exemptions.json",
        JSON.stringify({
          deadGlobsAllowed: [
            { file: ".claude/rules/scoped.md", globs: ["CLAUDE.md"], reason: "stale" },
          ],
        }),
      ),
    expect: /Remove the stale entry/,
  },
  {
    name: "10. REVIEW.md missing entirely",
    mutate: ({ remove }) => remove("REVIEW.md"),
    expect: /REVIEW\.md is missing\./,
  },
  {
    // An empty stub satisfies a bare existsSync and provides nothing, so the
    // check has to look at the sections, not the file.
    name: "10b. REVIEW.md present but missing a required section",
    mutate: ({ write }) =>
      write("REVIEW.md", "# Review Policy\n\n## Passes\n\n- Correctness\n"),
    expect: /REVIEW\.md is missing the section "## What "?Important"? means here/,
  },
  {
    // --allowed-tools only pre-approves. Under bypassPermissions this "read-only"
    // reviewer keeps Edit, Bash and every MCP connector.
    name: "11. claude -p restricted by --allowed-tools alone",
    mutate: ({ write }) =>
      write(".github/workflows/review.yml", 'jobs:\n  r:\n    steps:\n      - run: claude -p "$P" --allowed-tools Read,Glob,Grep\n'),
    expect: /review\.yml: restricts claude with --allowed-tools but not --tools, --strict-mcp-config, --permission-mode/,
  },
  {
    name: "11b. confined in part: --tools without --strict-mcp-config",
    mutate: ({ write }) =>
      write("scripts/agent.mjs", 'spawnSync("claude", ["-p", p, "--tools", "Read", "--permission-mode", "default", "--allowed-tools", "Read"]);\n'),
    expect: /agent\.mjs: restricts claude with --allowed-tools but not --strict-mcp-config\./,
  },
];

for (const c of cases) {
  test(`fires: ${c.name}`, () => {
    const { code, out } = run(c.mutate);
    assert.equal(code, 1, `guard should have failed but exited ${code}:\n${out}`);
    assert.match(out, c.expect, `guard failed, but not for the expected reason:\n${out}`);
  });
}

// Exact-name lists, comma lists, hyphenated agent types, match-all and real
// regexes are all valid matchers; check 3 must not tax any of them.
test("valid matcher forms pass check 3", () => {
  for (const m of ["Bash", "Write|Edit", "Edit, Write", "code-reviewer", "*", "", "mcp__memory__.*", "^Edit$"]) {
    const { code, out } = run(({ write }) => write(".claude/settings.json", matcherSettings(m)));
    assert.equal(code, 0, `matcher ${JSON.stringify(m)} should pass:\n${out}`);
  }
});

// The confinement check must not fire on a fully confined call, or on the flags
// being named in a comment.
test("a fully confined claude -p passes check 11", () => {
  const { code, out } = run(({ write }) =>
    write(
      ".github/workflows/review.yml",
      "jobs:\n  r:\n    steps:\n      - run: |\n          # --allowed-tools alone is not enough\n" +
        '          claude -p "$P" --tools Read --strict-mcp-config --permission-mode default --allowed-tools Read\n',
    ),
  );
  assert.equal(code, 0, out);
});

// The exemption mechanism has to keep working, or the fix for a false positive is
// to delete the check.
test("a genuinely dead glob is silenced by an exemption", () => {
  const { code, out } = run(({ write }) => {
    write(".claude/rules/tmpl.md", '---\npaths:\n  - "src/**"\n---\n\nBody.\n');
    write(
      ".claude/references/wiring-exemptions.json",
      JSON.stringify({
        deadGlobsAllowed: [
          { file: ".claude/rules/tmpl.md", globs: ["src/**"], reason: "template payload" },
        ],
      }),
    );
  });
  assert.equal(code, 0, `exempted glob should pass:\n${out}`);
  assert.match(out, /matches 0 files \(exempted\)/);
});

// Regression guard for the reason this file exists: budgets were advisory, so
// CLAUDE.md drifted to 95% of its ceiling with CI green the whole time.
test("no check is advisory -- the guard has no warning tier", () => {
  const { out } = run(({ write }) => write("CLAUDE.md", `# F\n\n${"x".repeat(17 * 1024)}\n`));
  assert.doesNotMatch(out, /Warnings \(/, "a budget overrun must fail, not warn");
});
