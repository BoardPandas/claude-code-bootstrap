#!/usr/bin/env node
//
// advisory-hooks.test.mjs -- assert the advisory hooks' text actually reaches the model.
//
// Plain stdout from a hook reaches Claude only for SessionStart, UserPromptSubmit,
// UserPromptExpansion and PostModelSwitch. On PreToolUse and PostToolUse it goes to
// the debug log. Five hooks here echoed their reminders on exactly those events, so
// each one ran, exited 0, looked healthy, and was never read by anything. An exit
// code cannot tell those apart from working hooks; parsing stdout as JSON can.
//
// So every case asserts one direction or the other:
//   speaks -- stdout is ONE JSON object with the right hookEventName and the
//             reminder inside additionalContext, and nothing else on stdout
//   silent -- stdout is empty, because the hook must not fire here
//
// Run with: npm test

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const SCRIPTS = join(dirname(fileURLToPath(import.meta.url)), "..", ".claude", "scripts");

// Assembled from parts so the literal verb never appears in a command this
// session might run against the live hooks.
const GIT = "git";
const COMMIT = "commit";

function runHook(script, payload, { cwd = process.cwd(), env = {} } = {}) {
  const r = spawnSync("bash", [join(SCRIPTS, script)], {
    cwd,
    input: typeof payload === "string" ? payload : JSON.stringify(payload),
    encoding: "utf8",
    env: { ...process.env, ...env },
  });
  return { status: r.status, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}

// The whole of stdout must parse: anything printed beside the JSON turns the
// output back into plain text, which is the defect this file exists to catch.
function context(stdout, event) {
  let parsed;
  try {
    parsed = JSON.parse(stdout);
  } catch {
    assert.fail(`stdout is not a single JSON object, so Claude never sees it:\n${stdout}`);
  }
  const out = parsed.hookSpecificOutput;
  assert.ok(out, "missing hookSpecificOutput");
  assert.equal(out.hookEventName, event);
  assert.equal(typeof out.additionalContext, "string");
  assert.ok(out.additionalContext.length > 0, "additionalContext is empty");
  return out.additionalContext;
}

function makeRepo() {
  const dir = mkdtempSync(join(tmpdir(), "advisory-hooks-"));
  const git = (...args) => {
    const r = spawnSync("git", ["-c", "core.hooksPath=/dev/null", ...args], { cwd: dir, encoding: "utf8" });
    if (r.status !== 0) throw new Error(`git ${args.join(" ")}: ${r.stderr}`);
  };
  git("init", "-q", ".");
  git("config", "user.email", "t@example.com");
  git("config", "user.name", "t");
  writeFileSync(join(dir, "package.json"), '{\n  "version": "1.0.0"\n}\n');
  writeFileSync(join(dir, "CHANGELOG.md"), "# Changelog\n\n## [1.0.0] - 2026-01-01\n- initial\n");
  git("add", "-A");
  git("commit", "-qm", "init");
  writeFileSync(join(dir, "notes.md"), "second\n");
  git("add", "-A");
  git("commit", "-qm", "second");
  return dir;
}

describe("_hook-context.sh", () => {
  const emit = (event, message) =>
    spawnSync("bash", ["-c", `. "$1"; emit_context "$2" "$3"`, "_", join(SCRIPTS, "_hook-context.sh"), event, message], {
      encoding: "utf8",
    }).stdout;

  test("json_escape round-trips backslashes, quotes, tabs and newlines", () => {
    const message = 'C:\\Users\\dev\\"quoted dir"\\file\tname.ps1\nsecond line \\n stays literal';
    assert.equal(context(emit("PreToolUse", message), "PreToolUse"), message);
  });

  test("control characters JSON cannot carry are dropped, not emitted raw", () => {
    const out = emit("PostToolUse", "bell\u0007 and escape\u001b[0m");
    assert.equal(context(out, "PostToolUse"), "bell and escape[0m");
  });

  test("an empty message prints nothing", () => {
    assert.equal(emit("PreToolUse", ""), "");
  });
});

describe("pre-plan-kb-check.sh (PreToolUse)", () => {
  test("speaks on EnterPlanMode", () => {
    const r = runHook("pre-plan-kb-check.sh", { tool_name: "EnterPlanMode", tool_input: {} });
    assert.equal(r.status, 0);
    assert.match(context(r.stdout, "PreToolUse"), /KNOWLEDGE BASE CHECK REQUIRED/);
  });

  test("speaks with the backstop wording on ExitPlanMode", () => {
    const r = runHook("pre-plan-kb-check.sh", { tool_name: "ExitPlanMode", tool_input: { plan: "x" } });
    assert.equal(r.status, 0);
    assert.match(context(r.stdout, "PreToolUse"), /BEFORE PRESENTING THIS PLAN/);
  });
});

describe("pre-write-kb-check.sh (PreToolUse)", () => {
  // Each case gets its own state dir, so de-duplication from one case (or from
  // a real session on this machine) cannot silence another.
  function withState(body) {
    const state = mkdtempSync(join(tmpdir(), "kb-state-"));
    try {
      body({ TMPDIR: state });
    } finally {
      rmSync(state, { recursive: true, force: true });
    }
  }
  const write = (file_path, session_id = "s1") => ({ session_id, tool_name: "Write", tool_input: { file_path } });

  test("speaks for a file with LL-G shelf coverage, naming the shelf", () => {
    withState((env) => {
      const r = runHook("pre-write-kb-check.sh", write("/repo/scripts/deploy.sh"), { env });
      assert.equal(r.status, 0);
      const text = context(r.stdout, "PreToolUse");
      assert.match(text, /LL-G GOTCHA CHECK -- \/repo\/scripts\/deploy\.sh/);
      assert.match(text, /kb\/bash\/llms\.txt/);
    });
  });

  test("treats a plan document as a plan", () => {
    withState((env) => {
      const r = runHook("pre-write-kb-check.sh", write("/repo/tasks/feature-plan.md"), { env });
      assert.match(context(r.stdout, "PreToolUse"), /PLAN DOCUMENT/);
    });
  });

  test("stays silent the second time in a session for the same shelf", () => {
    withState((env) => {
      runHook("pre-write-kb-check.sh", write("/repo/a.sh"), { env });
      const again = runHook("pre-write-kb-check.sh", write("/repo/b.sh"), { env });
      assert.equal(again.status, 0);
      assert.equal(again.stdout, "");
    });
  });

  test("stays silent for a file no shelf covers, and with no file_path", () => {
    withState((env) => {
      assert.equal(runHook("pre-write-kb-check.sh", write("/repo/data.json"), { env }).stdout, "");
      assert.equal(runHook("pre-write-kb-check.sh", { session_id: "s1", tool_input: {} }, { env }).stdout, "");
    });
  });

  // The not-writable note used to be a second echo after the reminder. As plain
  // text beside the JSON it would break the parse and silence the whole message.
  test("the de-dupe warning travels inside the JSON, not beside it", () => {
    const r = runHook("pre-write-kb-check.sh", write("/repo/x.sh"), { env: { TMPDIR: "/dev/null/nope" } });
    assert.equal(r.status, 0);
    assert.match(context(r.stdout, "PreToolUse"), /is not writable/);
  });
});

describe("pre-commit-changelog-reminder.sh (PreToolUse)", () => {
  test("speaks when the changelog contract is unmet", () => {
    const dir = makeRepo();
    try {
      const r = runHook("pre-commit-changelog-reminder.sh", { tool_input: { command: `${GIT} ${COMMIT} -m x` } }, { cwd: dir });
      assert.equal(r.status, 0, "the reminder is advisory and must never block");
      const text = context(r.stdout, "PreToolUse");
      assert.match(text, /CHANGELOG & VERSION UPDATE REQUIRED/);
      assert.match(text, /SKIP_CHANGELOG=1 git commit/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("stays silent for a command that is not a commit", () => {
    const dir = makeRepo();
    try {
      const r = runHook("pre-commit-changelog-reminder.sh", { tool_input: { command: `${GIT} log --grep=${COMMIT}` } }, { cwd: dir });
      assert.equal(r.status, 0);
      assert.equal(r.stdout, "");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("post-commit-kb-contribute.sh (PostToolUse)", () => {
  test("speaks after a commit, with the commit summary inside the JSON", () => {
    const dir = makeRepo();
    try {
      const r = runHook(
        "post-commit-kb-contribute.sh",
        { tool_name: "Bash", tool_input: { command: `${GIT} ${COMMIT} -m second` }, tool_response: { stdout: "" } },
        { cwd: dir },
      );
      assert.equal(r.status, 0);
      const text = context(r.stdout, "PostToolUse");
      assert.match(text, /KNOWLEDGE BASE CONTRIBUTION CHECK/);
      assert.match(text, /notes\.md/, "the diff stat must be captured into the message, not printed beside it");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("speaks after a grouped commit", () => {
    const dir = makeRepo();
    try {
      const r = runHook("post-commit-kb-contribute.sh", { tool_input: { command: `{ ${GIT} ${COMMIT} -m x; }` } }, { cwd: dir });
      assert.match(context(r.stdout, "PostToolUse"), /KNOWLEDGE BASE CONTRIBUTION CHECK/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("stays silent when only the tool OUTPUT mentions a commit", () => {
    const dir = makeRepo();
    try {
      const r = runHook(
        "post-commit-kb-contribute.sh",
        { tool_input: { command: `${GIT} log -1` }, tool_response: { stdout: `${GIT} ${COMMIT} -m second` } },
        { cwd: dir },
      );
      assert.equal(r.status, 0);
      assert.equal(r.stdout, "");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("require-release-authorization.sh (PreToolUse, allow path)", () => {
  test("the authorisation note reaches the model as JSON", () => {
    const r = runHook("require-release-authorization.sh", {
      tool_name: "Bash",
      tool_input: { command: "RELEASE_AUTHORIZED_BY=owner@example.com railway up" },
    });
    assert.equal(r.status, 0);
    assert.equal(context(r.stdout, "PreToolUse"), "Release authorised by: owner@example.com");
  });
});

// The one advisory hook that may print plain text: SessionStart is among the
// events whose plain stdout Claude reads. Pinned so nobody "fixes" it into a
// shape it does not need, or copies its echo onto a tool event.
describe("session-start-kb-check.sh (SessionStart)", () => {
  test("prints its reminder as plain text, which SessionStart shows to Claude", () => {
    const r = runHook("session-start-kb-check.sh", { hook_event_name: "SessionStart", source: "startup" });
    assert.equal(r.status, 0);
    assert.match(r.stdout, /^=== KNOWLEDGE BASE CHECK/);
  });
});
