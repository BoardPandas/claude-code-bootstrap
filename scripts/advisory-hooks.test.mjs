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
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
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
//
// When Roundtable's `rt` has its own SessionStart hook for the client running it,
// rt prints the digest or this same reminder, so this hook prints only a two-line
// note in place of the full reminder. Every case runs in its own HOME, config dirs
// and repo, with no GIT_* variables: the real ~/.claude, ~/.codex,
// ~/.config/roundtable and ~/.gitconfig on the machine must never decide a result.
describe("session-start-kb-check.sh (SessionStart)", () => {
  const SESSION = "00000000-0000-4000-8000-000000000001";

  // undefined drops a variable from the child's environment.
  const NO_GIT = Object.fromEntries(Object.keys(process.env).filter((k) => k.startsWith("GIT_")).map((k) => [k, undefined]));

  function makeSandbox() {
    const root = mkdtempSync(join(tmpdir(), "kb-session-"));
    const s = {
      home: join(root, "home"),
      xdg: join(root, "xdg"),
      claude: join(root, "claude-config"),
      codex: join(root, "codex-home"),
      repo: join(root, "repo"),
      bin: join(root, "bin"),
    };
    for (const dir of Object.values(s)) mkdirSync(dir, { recursive: true });
    const init = spawnSync("git", ["init", "-q", s.repo], {
      encoding: "utf8",
      env: { ...process.env, ...NO_GIT, HOME: s.home, XDG_CONFIG_HOME: s.xdg },
    });
    if (init.status !== 0) throw new Error(`git init: ${init.stderr}`);
    s.rt = join(s.bin, "rt");
    writeFileSync(s.rt, "#!/bin/sh\n# rt: Roundtable's command-line client (test stand-in)\nexit 0\n");
    chmodSync(s.rt, 0o755);
    s.envFile = join(s.home, ".config", "roundtable", "env");
    // A real RT_CONFIG, CLAUDE_PROJECT_DIR or CLAUDE_CODE_ENTRYPOINT (this suite may
    // itself run under the Agent SDK) must not leak in.
    s.env = {
      ...NO_GIT,
      HOME: s.home,
      XDG_CONFIG_HOME: s.xdg,
      CLAUDE_CONFIG_DIR: s.claude,
      CODEX_HOME: s.codex,
      RT_CONFIG: undefined,
      CLAUDE_PROJECT_DIR: undefined,
      CLAUDE_CODE_ENTRYPOINT: undefined,
    };
    s.cleanup = () => rmSync(root, { recursive: true, force: true });
    return s;
  }

  function sandbox(body) {
    const s = makeSandbox();
    try {
      body(s);
    } finally {
      s.cleanup();
    }
  }

  // Payload shapes from Roundtable's captured fixtures (docs/spikes.md S5).
  const claudePayload = (s) => ({
    session_id: SESSION,
    transcript_path: join(s.claude, "projects", "-repo", `${SESSION}.jsonl`),
    cwd: s.repo,
    hook_event_name: "SessionStart",
    source: "startup",
  });
  const codexPayload = (s) => ({
    session_id: SESSION,
    transcript_path: join(s.codex, "sessions", "2026", "10", "15", `rollout-2026-10-15T00-41-38-${SESSION}.jsonl`),
    cwd: s.repo,
    hook_event_name: "SessionStart",
    model: "gpt-6-astra",
    permission_mode: "bypassPermissions",
    source: "startup",
  });

  const runClaude = (s, env = {}) =>
    runHook("session-start-kb-check.sh", claudePayload(s), { env: { ...s.env, CLAUDE_PROJECT_DIR: s.repo, ...env } });
  const runCodex = (s, env = {}) => runHook("session-start-kb-check.sh", codexPayload(s), { env: { ...s.env, ...env } });

  function writeEnvFile(path) {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, "RT_API_URL=https://roundtable.example\n");
  }

  // rt's SessionStart handler as `rt install <client> --write` writes it, after an
  // unrelated group, so rt's handler sits at group 1 as it would in a real file.
  function installRt(s, client, { matcher, command, file } = {}) {
    const handler = { type: "command", command: command ?? `'${s.rt}' hook ${client} session_start`, timeout: 5 };
    const group = { ...(matcher !== undefined && { matcher }), hooks: [handler] };
    const other = { hooks: [{ type: "command", command: "bash .claude/scripts/other.sh" }] };
    const path = file ?? (client === "claude" ? join(s.claude, "settings.json") : join(s.codex, "hooks.json"));
    writeFileSync(path, JSON.stringify({ hooks: { SessionStart: [other, group] } }, null, 2));
    return { path, group, handler };
  }

  // Codex's hook hash, written independently of the script's jq: sorted-key
  // compact JSON of the hook as Codex normalises it, as Roundtable's harness does.
  function canonical(v) {
    if (Array.isArray(v)) return `[${v.map(canonical).join(",")}]`;
    if (v && typeof v === "object") {
      return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canonical(v[k])}`).join(",")}}`;
    }
    return JSON.stringify(v);
  }
  function codexHash({ group, handler }) {
    const identity = {
      event_name: "session_start",
      ...(typeof group.matcher === "string" && { matcher: group.matcher }),
      hooks: [{ type: "command", command: handler.command, timeout: Math.max(handler.timeout ?? 600, 1), async: false }],
    };
    return `sha256:${createHash("sha256").update(canonical(identity)).digest("hex")}`;
  }
  function trustCodex(s, installed, { hash = codexHash(installed), enabled = true } = {}) {
    const key = `${installed.path}:session_start:1:0`;
    writeFileSync(join(s.codex, "config.toml"), `[hooks.state."${key}"]\nenabled = ${enabled}\ntrusted_hash = "${hash}"\n`);
  }

  const LLG = "https://raw.githubusercontent.com/BoardPandas/LL-G/main/llms.txt";
  const BP = "https://raw.githubusercontent.com/BoardPandas/BP/main/llms.txt";

  function reminds(r, why = "expected the full reminder") {
    assert.equal(r.status, 0, "the hook is advisory and must always exit 0");
    assert.match(r.stdout, /^=== KNOWLEDGE BASE CHECK \(RULE 1 \+ RULE 3\) ===\n/, why);
    assert.match(r.stdout, /WebFetch https:\/\/raw\.githubusercontent\.com\/BoardPandas\/LL-G\/main\/llms\.txt/, why);
  }
  // Not silent: rt can still print nothing (killed at its hook timeout), so the
  // mandate and both indexes stay in view in two lines.
  function defers(r) {
    assert.equal(r.status, 0, "the hook is advisory and must always exit 0");
    const lines = r.stdout.split("\n").filter(Boolean);
    assert.equal(lines.length, 2, `expected the two-line note, got:\n${r.stdout}`);
    assert.match(lines[0], /^=== KNOWLEDGE BASE: Roundtable's digest lists the LL-G \/ BP lessons for this repo; RULE 1 and RULE 3 still apply\. ===$/);
    assert.ok(lines[1].includes(LLG) && lines[1].includes(BP), "the note names both llms.txt indexes");
    assert.doesNotMatch(r.stdout, /WebFetch/, "the full reminder is replaced, not appended to");
  }

  test("prints its reminder as plain text, which SessionStart shows to Claude", () => {
    sandbox((s) => {
      const r = runHook("session-start-kb-check.sh", { hook_event_name: "SessionStart", source: "startup" }, { env: s.env });
      reminds(r);
    });
  });

  test("reminds a Claude Code or Codex session with no Roundtable set up", () => {
    sandbox((s) => {
      reminds(runClaude(s));
      reminds(runCodex(s));
    });
  });

  test("defers in Claude Code when rt's SessionStart hook and its credentials file exist", () => {
    sandbox((s) => {
      writeEnvFile(s.envFile);
      installRt(s, "claude");
      defers(runClaude(s));
    });
  });

  test("defers in Codex when rt's SessionStart hook is installed, trusted, and has credentials", () => {
    sandbox((s) => {
      writeEnvFile(s.envFile);
      trustCodex(s, installRt(s, "codex"));
      defers(runCodex(s));
      // The transcript decides the client, not a CLAUDE_* variable in Codex's environment.
      defers(runCodex(s, { CLAUDE_PROJECT_DIR: s.repo }));
    });
  });

  test("follows RT_CONFIG, as rt does, and ignores XDG_CONFIG_HOME, as rt does", () => {
    sandbox((s) => {
      installRt(s, "claude");
      const custom = join(s.home, "elsewhere", "rt.env");
      writeEnvFile(custom);
      defers(runClaude(s, { RT_CONFIG: custom }));
      writeEnvFile(join(s.xdg, "roundtable", "env"));
      reminds(runClaude(s));
    });
  });

  test("reminds when only the credentials file exists", () => {
    sandbox((s) => {
      writeEnvFile(s.envFile);
      reminds(runClaude(s));
      reminds(runCodex(s));
    });
  });

  test("reminds when only rt's hook exists", () => {
    sandbox((s) => {
      installRt(s, "claude");
      reminds(runClaude(s));
      trustCodex(s, installRt(s, "codex"));
      reminds(runCodex(s));
    });
  });

  test("reminds when rt's hook is installed for the other client only", () => {
    sandbox((s) => {
      writeEnvFile(s.envFile);
      trustCodex(s, installRt(s, "codex"));
      reminds(runClaude(s), "a Codex install says nothing about Claude Code");
    });
    sandbox((s) => {
      writeEnvFile(s.envFile);
      installRt(s, "claude");
      reminds(runCodex(s), "a Claude Code install says nothing about Codex");
    });
    sandbox((s) => {
      writeEnvFile(s.envFile);
      installRt(s, "codex", { file: join(s.claude, "settings.json") });
      reminds(runClaude(s), "the handler in Claude's file must name claude");
    });
  });

  test("reminds when the hooks file is malformed", () => {
    sandbox((s) => {
      writeEnvFile(s.envFile);
      const handler = `'${s.rt}' hook claude session_start`;
      // Truncated: the outermost closing brace is missing.
      writeFileSync(join(s.claude, "settings.json"), `{"hooks":{"SessionStart":[{"hooks":[{"type":"command","command":"${handler}"}]}]}`);
      reminds(runClaude(s));
      writeFileSync(join(s.claude, "settings.json"), JSON.stringify({ hooks: { SessionStart: { hooks: [] } } }));
      reminds(runClaude(s));
      // A good install followed by more JSON is no longer one document, so the client
      // refuses the whole file and rt's hook never runs.
      const installed = installRt(s, "claude");
      const good = JSON.stringify({ hooks: { SessionStart: [installed.group] } });
      writeFileSync(installed.path, `${good}\n{`);
      reminds(runClaude(s), "trailing garbage");
      writeFileSync(installed.path, `${good}\n${good}\n`);
      reminds(runClaude(s), "two documents");
      writeFileSync(join(s.codex, "hooks.json"), "not json\n");
      reminds(runCodex(s));
    });
  });

  test("reminds in Codex when rt's hook is untrusted, changed since trusted, or turned off", () => {
    sandbox((s) => {
      writeEnvFile(s.envFile);
      const installed = installRt(s, "codex");
      reminds(runCodex(s), "never trusted");
      trustCodex(s, installed, { hash: `sha256:${"0".repeat(64)}` });
      reminds(runCodex(s), "changed since it was trusted");
      trustCodex(s, installed, { enabled: false });
      reminds(runCodex(s), "turned off in /hooks");
    });
  });

  test("reminds when rt's hook runs an rt that is missing or not Roundtable's, or sits in a scoped group", () => {
    sandbox((s) => {
      writeEnvFile(s.envFile);
      installRt(s, "claude", { command: `'${join(s.bin, "gone", "rt")}' hook claude session_start` });
      reminds(runClaude(s), "missing rt");
      const foreign = join(s.bin, "other", "rt");
      mkdirSync(dirname(foreign), { recursive: true });
      writeFileSync(foreign, "#!/bin/sh\n# rt: Request Tracker command-line interface\nexit 0\n");
      chmodSync(foreign, 0o755);
      installRt(s, "claude", { command: `'${foreign}' hook claude session_start` });
      reminds(runClaude(s), "an executable named rt that is not Roundtable's");
      const unrunnable = join(s.bin, "noexec", "rt");
      mkdirSync(dirname(unrunnable), { recursive: true });
      writeFileSync(unrunnable, "#!/bin/sh\n# rt: Roundtable's command-line client (test stand-in)\nexit 0\n");
      chmodSync(unrunnable, 0o644);
      installRt(s, "claude", { command: `'${unrunnable}' hook claude session_start` });
      reminds(runClaude(s), "Roundtable's rt without the execute bit");
      installRt(s, "claude", { matcher: "startup" });
      reminds(runClaude(s), "scoped group");
    });
  });

  // An Agent SDK run can load project settings without user settings, so rt's
  // user-level hook may never run however complete the install looks.
  test("prints the full reminder in an Agent SDK session, even with rt installed", () => {
    sandbox((s) => {
      writeEnvFile(s.envFile);
      installRt(s, "claude");
      trustCodex(s, installRt(s, "codex"));
      reminds(runClaude(s, { CLAUDE_CODE_ENTRYPOINT: "sdk-ts" }), "sdk-ts");
      reminds(runClaude(s, { CLAUDE_CODE_ENTRYPOINT: "sdk-py" }), "sdk-py");
      reminds(runCodex(s, { CLAUDE_CODE_ENTRYPOINT: "sdk-cli" }), "sdk-cli");
      defers(runClaude(s, { CLAUDE_CODE_ENTRYPOINT: "cli" }));
    });
  });

  test("reminds when the client cannot be told apart", () => {
    sandbox((s) => {
      writeEnvFile(s.envFile);
      installRt(s, "claude");
      trustCodex(s, installRt(s, "codex"));
      reminds(runHook("session-start-kb-check.sh", claudePayload(s), { env: s.env }), "Claude Code always sets CLAUDE_PROJECT_DIR");
      const elsewhere = { ...claudePayload(s), transcript_path: join(s.home, "transcript.jsonl") };
      reminds(runHook("session-start-kb-check.sh", elsewhere, { env: { ...s.env, CLAUDE_PROJECT_DIR: s.repo } }));
      reminds(runHook("session-start-kb-check.sh", "not json", { env: { ...s.env, CLAUDE_PROJECT_DIR: s.repo } }));
      reminds(runHook("session-start-kb-check.sh", "", { env: { ...s.env, CLAUDE_PROJECT_DIR: s.repo } }));
    });
  });

  test("reminds outside a git repository, where rt says nothing", () => {
    sandbox((s) => {
      writeEnvFile(s.envFile);
      installRt(s, "claude");
      const outside = { ...claudePayload(s), cwd: s.home };
      reminds(runHook("session-start-kb-check.sh", outside, { env: { ...s.env, CLAUDE_PROJECT_DIR: s.home } }));
    });
  });

  // A jq that resolves but never runs is the Windows Store stub case
  // (LL-G bash/command-v-finds-nonexecuting-stub).
  test("reminds when jq does not run", () => {
    sandbox((s) => {
      writeEnvFile(s.envFile);
      installRt(s, "claude");
      const stub = join(s.home, "stub-bin");
      mkdirSync(stub, { recursive: true });
      writeFileSync(join(stub, "jq"), "#!/bin/sh\nexit 49\n");
      chmodSync(join(stub, "jq"), 0o755);
      reminds(runClaude(s, { PATH: `${stub}:${process.env.PATH}` }));
    });
  });

  test("does not wait on a stdin pipe that is never closed", async () => {
    const s = makeSandbox();
    try {
      const child = spawn("bash", [join(SCRIPTS, "session-start-kb-check.sh")], {
        env: { ...process.env, ...s.env, CLAUDE_PROJECT_DIR: s.repo },
        stdio: ["pipe", "pipe", "pipe"],
      });
      let stdout = "";
      child.stdout.on("data", (d) => (stdout += d));
      child.stdin.on("error", () => {});
      child.stdin.write(JSON.stringify(claudePayload(s)));
      const started = Date.now();
      const status = await new Promise((resolve) => {
        const timer = setTimeout(() => {
          child.kill("SIGKILL");
          resolve("still running after 8 s");
        }, 8000);
        child.on("close", (code) => {
          clearTimeout(timer);
          resolve(code);
        });
      });
      const elapsed = Date.now() - started;
      assert.equal(status, 0);
      assert.ok(elapsed < 6000, `took ${elapsed} ms`);
      reminds({ status, stdout });
    } finally {
      s.cleanup();
    }
  });
});
