#!/usr/bin/env node
//
// check-changelog-gate.test.mjs -- assert the commit gate blocks and allows correctly.
//
// A blocking hook has two failure directions and they are not symmetric. A
// too-strict gate announces itself within seconds, because it refuses work
// someone is trying to do. A too-permissive one never announces itself at all --
// it exits 0, looks healthy, and the thing it exists to prevent ships anyway.
// So every case here asserts an exit code in BOTH directions.
//
// This suite exists because the gate it covers shipped an intent-based check
// (`grep 'git add ... CHANGELOG.md'`) that was satisfied by a command doing
// nothing. That bug was invisible for months.
// (LL-G kb/claude-code/hook-validates-text-not-state.md)
//
// Run with: npm test

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync, mkdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const SCRIPTS = join(dirname(fileURLToPath(import.meta.url)), "..", ".claude", "scripts");
const GATE = join(SCRIPTS, "check-changelog-staged.sh");

// The hook parses tool_input.command, so a case is just a command string.
// Assembled from parts so the literal verb never appears in a command this
// session might run against the live hook.
const GIT = "git";
const COMMIT = "commit";
const commitCmd = (rest = "-m x") => `${GIT} ${COMMIT} ${rest}`;

function git(cwd, ...args) {
  const r = spawnSync("git", args, { cwd, encoding: "utf8" });
  if (r.status !== 0 && !args.includes("--verify")) {
    throw new Error(`git ${args.join(" ")} failed: ${r.stderr}`);
  }
  return r.stdout.trim();
}

// Builds a throwaway repo with one commit already in history.
function makeRepo({ withPackageJson = true, version = "1.0.0" } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "changelog-gate-"));
  git(dir, "init", "-q", ".");
  git(dir, "config", "user.email", "t@example.com");
  git(dir, "config", "user.name", "t");
  if (withPackageJson) {
    writeFileSync(join(dir, "package.json"), `{\n  "version": "${version}"\n}\n`);
  }
  writeFileSync(join(dir, "CHANGELOG.md"), `# Changelog\n\n## [${version}] - 2026-01-01\n- initial\n`);
  git(dir, "add", "-A");
  // -c core.hooksPath=/dev/null so a developer's own git hooks cannot interfere.
  git(dir, "-c", "core.hooksPath=/dev/null", "commit", "-qm", "init");
  return dir;
}

// Runs the gate against `dir` with the given command string. Returns its exit code.
function runGate(dir, command, { env = {}, cwd = dir } = {}) {
  const r = spawnSync("bash", [GATE], {
    cwd,
    input: JSON.stringify({ tool_input: { command } }),
    encoding: "utf8",
    env: { ...process.env, ...env },
  });
  return { code: r.status, stderr: r.stderr };
}

const ALLOW = 0;
const BLOCK = 2;

describe("refuses commits that break the contract", () => {
  test("nothing changed at all", () => {
    const dir = makeRepo();
    try {
      const { code, stderr } = runGate(dir, commitCmd());
      assert.equal(code, BLOCK);
      assert.match(stderr, /CHANGELOG\.md is unchanged from HEAD/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("changelog edited but version not bumped", () => {
    const dir = makeRepo();
    try {
      writeFileSync(join(dir, "CHANGELOG.md"), "# Changelog\n\n## [1.0.0] - 2026-01-01\n- edited\n");
      const { code, stderr } = runGate(dir, commitCmd());
      assert.equal(code, BLOCK);
      assert.match(stderr, /version in package\.json is unchanged/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("version bumped but changelog has no section naming it", () => {
    const dir = makeRepo();
    try {
      writeFileSync(join(dir, "CHANGELOG.md"), "# Changelog\n\n## [1.0.0] - 2026-01-01\n- edited\n");
      writeFileSync(join(dir, "package.json"), '{\n  "version": "1.0.1"\n}\n');
      const { code, stderr } = runGate(dir, commitCmd());
      assert.equal(code, BLOCK);
      assert.match(stderr, /no '## \[1\.0\.1\]' section/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  // The regression this whole rewrite is for: the old gate accepted any command
  // whose TEXT mentioned staging the changelog, and `git add` on an unmodified
  // file stages nothing.
  test("a command that only mentions staging the changelog no longer passes", () => {
    const dir = makeRepo();
    try {
      const { code } = runGate(dir, `${GIT} add CHANGELOG.md && ${commitCmd()}`);
      assert.equal(code, BLOCK, "intent must not satisfy a state check");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("blocks identically when invoked from a subdirectory", () => {
    const dir = makeRepo();
    try {
      const sub = join(dir, "nested", "deep");
      mkdirSync(sub, { recursive: true });
      assert.equal(runGate(dir, commitCmd(), { cwd: sub }).code, BLOCK);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("allows commits that satisfy it", () => {
  test("changelog edited, version bumped, section names the version", () => {
    const dir = makeRepo();
    try {
      writeFileSync(
        join(dir, "CHANGELOG.md"),
        "# Changelog\n\n## [1.0.1] - 2026-08-21\n- real entry\n\n## [1.0.0] - 2026-01-01\n- initial\n",
      );
      writeFileSync(join(dir, "package.json"), '{\n  "version": "1.0.1"\n}\n');
      const { code, stderr } = runGate(dir, commitCmd());
      assert.equal(code, ALLOW, `should allow but blocked:\n${stderr}`);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("allows when the edit is staged rather than merely written", () => {
    const dir = makeRepo();
    try {
      writeFileSync(
        join(dir, "CHANGELOG.md"),
        "# Changelog\n\n## [1.0.1] - 2026-08-21\n- real entry\n",
      );
      writeFileSync(join(dir, "package.json"), '{\n  "version": "1.0.1"\n}\n');
      git(dir, "add", "CHANGELOG.md", "package.json");
      assert.equal(runGate(dir, commitCmd()).code, ALLOW);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("exemptions", () => {
  const exempt = [
    ["--amend rewrites a commit that already carried its entry", () => ({}), commitCmd("--amend -m x")],
    ["SKIP_CHANGELOG=1 opts out", () => ({ env: { SKIP_CHANGELOG: "1" } }), commitCmd()],
    ["a non-commit command is none of the hook's business", () => ({}), `${GIT} log --grep=commit`],
  ];

  for (const [name, opts, command] of exempt) {
    test(name, () => {
      const dir = makeRepo();
      try {
        assert.equal(runGate(dir, command, opts()).code, ALLOW);
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });
  }

  test("a merge in progress is exempt", () => {
    const dir = makeRepo();
    try {
      // MERGE_HEAD must hold a bare SHA; git rev-parse --verify rejects anything else.
      writeFileSync(join(dir, ".git", "MERGE_HEAD"), `${git(dir, "rev-parse", "HEAD")}\n`);
      assert.equal(runGate(dir, commitCmd()).code, ALLOW);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("the initial commit has no HEAD to diff against", () => {
    const dir = mkdtempSync(join(tmpdir(), "changelog-gate-init-"));
    try {
      git(dir, "init", "-q", ".");
      writeFileSync(join(dir, "package.json"), '{"version":"0.1.0"}');
      assert.equal(runGate(dir, commitCmd("-m init")).code, ALLOW);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

// The template is cloned into repos that have no package.json. A gate that
// blocks every commit there is a gate that gets deleted, taking the changelog
// check with it.
describe("degrades in a repo with no package.json", () => {
  test("still blocks an unchanged changelog", () => {
    const dir = makeRepo({ withPackageJson: false });
    try {
      assert.equal(runGate(dir, commitCmd()).code, BLOCK);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("allows once the changelog is edited, without demanding a version", () => {
    const dir = makeRepo({ withPackageJson: false });
    try {
      writeFileSync(join(dir, "CHANGELOG.md"), "# Changelog\n\n- a new entry\n");
      const { code, stderr } = runGate(dir, commitCmd());
      assert.equal(code, ALLOW, `should allow but blocked:\n${stderr}`);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

// Every refusal must carry its reason on stderr. exit 2 discards stdout, so a
// message printed to stdout arrives as a bare refusal with no explanation.
test("every refusal explains itself on stderr", () => {
  const dir = makeRepo();
  try {
    const { code, stderr } = runGate(dir, commitCmd());
    assert.equal(code, BLOCK);
    assert.ok(stderr.trim().length > 0, "a blocking hook must write to stderr");
    assert.match(stderr, /BLOCKED:/);
    assert.match(stderr, /separate step/, "the message must state the workflow implication");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// The reminder hook is advisory and must agree with the blocker, or it goes
// quiet for exactly the commits that are about to be refused.
test("the advisory reminder agrees with the blocker", () => {
  const dir = makeRepo();
  const reminder = join(SCRIPTS, "pre-commit-changelog-reminder.sh");
  try {
    const speak = spawnSync("bash", [reminder], {
      cwd: dir,
      input: JSON.stringify({ tool_input: { command: commitCmd() } }),
      encoding: "utf8",
    });
    assert.equal(speak.status, 0, "the reminder is advisory and must never block");
    assert.match(speak.stdout, /CHANGELOG & VERSION UPDATE REQUIRED/);

    writeFileSync(
      join(dir, "CHANGELOG.md"),
      "# Changelog\n\n## [1.0.1] - 2026-08-21\n- real entry\n",
    );
    writeFileSync(join(dir, "package.json"), '{\n  "version": "1.0.1"\n}\n');
    const quiet = spawnSync("bash", [reminder], {
      cwd: dir,
      input: JSON.stringify({ tool_input: { command: commitCmd() } }),
      encoding: "utf8",
    });
    assert.equal(quiet.stdout.trim(), "", "must stay quiet once the contract is satisfied");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// Guards the helper both hooks share: a drifted copy is what motivated
// extracting it in the first place.
test("both commit hooks source the shared filter rather than reimplementing it", () => {
  for (const f of ["check-changelog-staged.sh", "pre-commit-changelog-reminder.sh"]) {
    const text = readFileSync(join(SCRIPTS, f), "utf8");
    assert.match(text, /_git-commit-filter\.sh/, `${f} must source the shared filter`);
  }
});
