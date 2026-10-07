#!/usr/bin/env node
//
// commit-gate-grouping.test.mjs -- assert the commit gate sees a commit wherever
// the shell would run it: inside a brace group, behind if/then/else/do, after !,
// and behind the time/command/exec/nohup/env wrappers.
//
// Each case asserts both directions. A prefix that is not modelled means a
// commit nobody gates; a prefix modelled too eagerly turns quoted text into a
// commit and refuses work. The fixtures are shared with check-changelog-gate.test.mjs.
//
// Run with: npm test

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { rmSync } from "node:fs";
import { join } from "node:path";
import {
  SCRIPTS,
  GIT,
  COMMIT,
  commitCmd,
  makeRepo,
  runGate,
  withPair,
  reminderText,
  ALLOW,
  BLOCK,
} from "./changelog-gate-fixtures.mjs";

// Shell grouping, keywords and precommand wrappers leave the next word at a
// command position. None of the walkers knew that, so `{ git commit -m x; }` was
// not a commit at all and the gate silently never fired -- the unsafe direction.
// All three walkers (is it a commit, which repo, is it opted out) now share one
// predicate, so each case below is asserted against all three readings.
describe("grouped, keyword and wrapper commits", () => {
  const c = commitCmd();
  const fires = [
    ["a brace group", `{ ${c}; }`],
    ["an if condition", `if ${c}; then echo ok; fi`],
    ["a then branch", `if true; then ${c}; fi`],
    ["an else branch", `if false; then :; else ${c}; fi`],
    ["a while condition", `while ${c}; do break; done`],
    ["a do body", `for f in a; do ${c}; done`],
    ["negation", `! ${c}`],
    ["time", `time ${c}`],
    ["command", `command ${c}`],
    ["exec", `exec ${c}`],
    ["nohup", `nohup ${c}`],
    ["env with an assignment", `env FOO=1 ${c}`],
    ["nested prefixes", `{ time env FOO=1 ${c}; }`],
  ];

  for (const [name, command] of fires) {
    test(`fires on ${name}`, () => {
      const dir = makeRepo();
      try {
        const { code, stderr } = runGate(dir, command);
        assert.equal(code, BLOCK, `${command} is a commit and must be gated`);
        assert.match(stderr, /BLOCKED:/);
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });
  }

  // The permissive direction: a prefix only moves the command position, it does
  // not turn quoted text or a different git subcommand into a commit.
  const quiet = [
    ["quoted text inside a group", `{ echo "${GIT} ${COMMIT} -m x"; }`],
    ["commit-tree inside a group", `{ ${GIT} ${COMMIT}-tree HEAD^{tree} -m x; }`],
    ["another subcommand after a keyword", `if ${GIT} log --grep=${COMMIT}; then :; fi`],
    ["a wrapper around a non-git command", `time grep -r '${GIT} ${COMMIT}' docs/`],
  ];

  for (const [name, command] of quiet) {
    test(`stays out of ${name}`, () => {
      const dir = makeRepo();
      try {
        assert.equal(runGate(dir, command).code, ALLOW, `${command} is not a commit`);
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });
  }

  const optedOut = [
    ["inside a brace group", `{ SKIP_CHANGELOG=1 ${c}; }`],
    ["inside an if condition", `if SKIP_CHANGELOG=1 ${c}; then :; fi`],
    ["after time", `time SKIP_CHANGELOG=1 ${c}`],
    ["after env", `env SKIP_CHANGELOG=1 ${c}`],
  ];

  for (const [name, command] of optedOut) {
    test(`SKIP_CHANGELOG=1 still opts out ${name}`, () => {
      const dir = makeRepo();
      try {
        assert.equal(runGate(dir, command).code, ALLOW, `${command} carries the opt-out at a command position`);
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });
  }

  test("SKIP_CHANGELOG=1 quoted inside a group is still not an opt-out", () => {
    const dir = makeRepo();
    try {
      assert.equal(runGate(dir, `{ ${commitCmd('-m "SKIP_CHANGELOG=1"')}; }`).code, BLOCK);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  // The repo-resolving walker must read the group the same way, or the gate
  // fires and then judges the session's repo instead of the one the cd targets.

  test("a cd inside a group retargets the commit: allows a compliant target", () => {
    withPair(false, true, (session, target) => {
      const { code, stderr } = runGate(session, `{ cd ${target} && ${c}; }`);
      assert.equal(code, ALLOW, `the target repo is compliant but was blocked:\n${stderr}`);
    });
  });

  test("a cd inside a group retargets the commit: blocks a non-compliant target", () => {
    withPair(true, false, (session, target) => {
      assert.equal(runGate(session, `{ cd ${target} && ${c}; }`).code, BLOCK);
      assert.equal(runGate(session, `if cd ${target}; then ${c}; fi`).code, BLOCK);
    });
  });

  // Unlike a subshell, a brace group runs in the current shell, so its cd lasts.
  test("a cd in a closed brace group still applies to a later commit", () => {
    withPair(true, false, (session, target) => {
      assert.equal(runGate(session, `{ cd ${target}; } && ${c}`).code, BLOCK);
    });
  });

  test("the advisory reminder speaks for a grouped commit too", () => {
    const dir = makeRepo();
    try {
      const r = spawnSync("bash", [join(SCRIPTS, "pre-commit-changelog-reminder.sh")], {
        cwd: dir,
        input: JSON.stringify({ tool_input: { command: `{ ${c}; }` } }),
        encoding: "utf8",
      });
      assert.equal(r.status, 0);
      assert.match(reminderText(r.stdout), /CHANGELOG & VERSION UPDATE REQUIRED/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
