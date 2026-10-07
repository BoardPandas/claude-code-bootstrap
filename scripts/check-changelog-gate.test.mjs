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
// Shared fixtures live in changelog-gate-fixtures.mjs; grouped and keyword-
// prefixed commits are covered in commit-gate-grouping.test.mjs.
//
// Run with: npm test

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync, mkdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { tmpdir } from "node:os";

import {
  SCRIPTS,
  GIT,
  COMMIT,
  commitCmd,
  git,
  makeRepo,
  runGate,
  satisfyContract,
  withPair,
  reminderText,
  ALLOW,
  BLOCK,
} from "./changelog-gate-fixtures.mjs";

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

// The hook process runs in the SESSION's repo; the command it is judging may
// target a different one. Both failure directions are live here, and they are the
// ones that make a gate get ripped out: a compliant cross-repo commit refused
// because the session's changelog is stale, and a non-compliant one waved through
// because the session's happens to be current.
// (LL-G kb/claude-code/hook-cwd-is-not-the-commit-target-repo.md)
describe("judges the repo the command targets, not the session's", () => {
  // withPair makes the session repo the OPPOSITE of the target on every case, so
  // a gate that reads the wrong tree cannot accidentally return the right answer.

  test("cd into another repo: allows when THAT repo satisfies the contract", () => {
    withPair(false, true, (session, target) => {
      const { code, stderr } = runGate(session, `cd ${target} && ${commitCmd()}`);
      assert.equal(code, ALLOW, `the target repo is compliant but was blocked:\n${stderr}`);
    });
  });

  test("cd into another repo: blocks when THAT repo does not, however clean the session's is", () => {
    withPair(true, false, (session, target) => {
      const { code, stderr } = runGate(session, `cd ${target} && ${commitCmd()}`);
      assert.equal(code, BLOCK, "a compliant session repo must not vouch for another repo");
      assert.match(stderr, /CHANGELOG\.md is unchanged from HEAD/);
    });
  });

  test("-C into another repo: allows when THAT repo satisfies the contract", () => {
    withPair(false, true, (session, target) => {
      const { code, stderr } = runGate(session, `${GIT} -C ${target} ${COMMIT} -m x`);
      assert.equal(code, ALLOW, `the target repo is compliant but was blocked:\n${stderr}`);
    });
  });

  test("-C into another repo: blocks when THAT repo does not", () => {
    withPair(true, false, (session, target) => {
      assert.equal(runGate(session, `${GIT} -C ${target} ${COMMIT} -m x`).code, BLOCK);
    });
  });

  // git itself resolves these left to right, so -C wins over an earlier cd.
  test("the last redirection wins, as it does for git", () => {
    withPair(false, true, (session, target) => {
      assert.equal(runGate(session, `cd ${target} && ${GIT} -C ${session} ${COMMIT} -m x`).code, BLOCK);
      assert.equal(runGate(target, `cd ${session} && ${GIT} -C ${target} ${COMMIT} -m x`).code, ALLOW);
    });
  });

  test("a quoted path keeps its spaces", () => {
    const session = makeRepo();
    const target = makeRepo({ prefix: "changelog gate spaced-" });
    try {
      satisfyContract(target);
      const { code, stderr } = runGate(session, `cd "${target}" && ${commitCmd()}`);
      assert.equal(code, ALLOW, `a path with a space must still resolve:\n${stderr}`);
    } finally {
      rmSync(session, { recursive: true, force: true });
      rmSync(target, { recursive: true, force: true });
    }
  });

  // A relative path is meaningless without a base, and the base is the payload's
  // cwd -- where the command runs -- not wherever the hook process happens to sit.
  test("a relative cd resolves against the payload's cwd", () => {
    withPair(false, true, (session, target) => {
      const { code, stderr } = runGate(session, `cd ${relative(session, target)} && ${commitCmd()}`, {
        cwd: tmpdir(),
        payloadCwd: session,
      });
      assert.equal(code, ALLOW, `relative target should have resolved:\n${stderr}`);

      // The other direction, or "resolved nothing and gave up" scores as a pass.
      assert.equal(
        runGate(target, `cd ${relative(target, session)} && ${commitCmd()}`, {
          cwd: tmpdir(),
          payloadCwd: target,
        }).code,
        BLOCK,
      );
    });
  });

  // Refusing what it cannot see is how a gate gets bypassed wholesale, taking the
  // changelog check with it. An unresolvable target is the one case where the
  // permissive direction is the right one.
  test("an unresolvable target allows rather than blocking a repo it cannot see", () => {
    withPair(false, false, (session) => {
      assert.equal(runGate(session, `cd $ELSEWHERE && ${commitCmd()}`).code, ALLOW);
      assert.equal(runGate(session, `cd ./no-such-dir && ${commitCmd()}`).code, ALLOW);
    });
  });

  test("a subshell's cd does not outlive it", () => {
    withPair(false, true, (session, target) => {
      assert.equal(runGate(session, `(cd ${target}) && ${commitCmd()}`).code, BLOCK);
      // ...but one that wraps the commit itself still applies to it.
      assert.equal(runGate(session, `(cd ${target} && ${commitCmd()})`).code, ALLOW);
    });
  });
});

describe("exemptions", () => {
  const exempt = [
    ["--amend rewrites a commit that already carried its entry", () => ({}), commitCmd("--amend -m x")],
    ["SKIP_CHANGELOG=1 in the hook's own environment opts out", () => ({ env: { SKIP_CHANGELOG: "1" } }), commitCmd()],
    // The bypass as a user actually types it. The harness spawns the hook itself,
    // so a variable set on the Bash tool's command line never reaches the hook
    // process -- reading only $SKIP_CHANGELOG made the documented escape hatch
    // unreachable while the block message went on advertising it.
    ["SKIP_CHANGELOG=1 as a command prefix opts out", () => ({}), `SKIP_CHANGELOG=1 ${commitCmd()}`],
    ["export SKIP_CHANGELOG=1 earlier in the command opts out", () => ({}),
      `export SKIP_CHANGELOG=1 && ${commitCmd()}`],
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

  // The permissive direction of the same check: an opt-out is only an opt-out at a
  // command position, or every commit message that discusses the bypass gets one.
  test("merely mentioning the opt-out in a commit message does not exempt", () => {
    const dir = makeRepo();
    try {
      const { code } = runGate(dir, commitCmd(`-m "explain SKIP_CHANGELOG=1 in the docs"`));
      assert.equal(code, BLOCK, "text inside a quoted message is not a command");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  // The block message names the escape hatch; if the two ever disagree, the user
  // is told to do something that does not work. That is exactly what shipped.
  test("the escape hatch the block message names is the one that works", () => {
    const dir = makeRepo();
    try {
      const { stderr } = runGate(dir, commitCmd());
      const advertised = stderr.match(/SKIP_CHANGELOG=1[^\n]*/);
      assert.ok(advertised, "the block message must name the bypass");
      assert.match(
        advertised[0],
        new RegExp(`SKIP_CHANGELOG=1 ${GIT} ${COMMIT}`),
        "the message must show the bypass as a command prefix, the only form the hook can see",
      );
      assert.equal(runGate(dir, `SKIP_CHANGELOG=1 ${commitCmd()}`).code, ALLOW);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

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
    assert.match(reminderText(speak.stdout), /CHANGELOG & VERSION UPDATE REQUIRED/);

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
