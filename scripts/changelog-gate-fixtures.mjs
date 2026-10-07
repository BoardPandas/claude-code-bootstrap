//
// changelog-gate-fixtures.mjs -- shared fixtures for the commit-gate test suites
// (check-changelog-gate.test.mjs, commit-gate-grouping.test.mjs). Not a test file
// itself: npm test runs *.test.mjs only.

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

export const SCRIPTS = join(dirname(fileURLToPath(import.meta.url)), "..", ".claude", "scripts");
export const GATE = join(SCRIPTS, "check-changelog-staged.sh");

// The hook parses tool_input.command, so a case is just a command string.
// Assembled from parts so the literal verb never appears in a command this
// session might run against the live hook.
export const GIT = "git";
export const COMMIT = "commit";
export const commitCmd = (rest = "-m x") => `${GIT} ${COMMIT} ${rest}`;

export function git(cwd, ...args) {
  const r = spawnSync("git", args, { cwd, encoding: "utf8" });
  if (r.status !== 0 && !args.includes("--verify")) {
    throw new Error(`git ${args.join(" ")} failed: ${r.stderr}`);
  }
  return r.stdout.trim();
}

// Builds a throwaway repo with one commit already in history.
export function makeRepo({ withPackageJson = true, version = "1.0.0", prefix = "changelog-gate-" } = {}) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
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
//
// `payloadCwd` is the cwd the harness reports in the hook payload, i.e. where the
// command is about to run. Left out by default so the common cases keep covering
// the fallback to the hook process's own cwd.
export function runGate(dir, command, { env = {}, cwd = dir, payloadCwd } = {}) {
  const payload = { tool_input: { command } };
  if (payloadCwd) payload.cwd = payloadCwd;
  const r = spawnSync("bash", [GATE], {
    cwd,
    input: JSON.stringify(payload),
    encoding: "utf8",
    env: { ...process.env, ...env },
  });
  return { code: r.status, stderr: r.stderr };
}

// Brings a repo built by makeRepo into compliance: a bumped version and a
// changelog section naming it.
export function satisfyContract(dir) {
  writeFileSync(
    join(dir, "CHANGELOG.md"),
    "# Changelog\n\n## [1.0.1] - 2026-08-23\n- real entry\n\n## [1.0.0] - 2026-01-01\n- initial\n",
  );
  writeFileSync(join(dir, "package.json"), '{\n  "version": "1.0.1"\n}\n');
}

export const ALLOW = 0;
export const BLOCK = 2;

// Builds a session repo and a target repo, each satisfying the contract or not,
// and cleans both up. Callers make the session the OPPOSITE of the target, so a
// gate that reads the wrong tree cannot accidentally return the right answer.
export function withPair(sessionSatisfied, targetSatisfied, body) {
  const session = makeRepo();
  const target = makeRepo();
  try {
    if (sessionSatisfied) satisfyContract(session);
    if (targetSatisfied) satisfyContract(target);
    body(session, target);
  } finally {
    rmSync(session, { recursive: true, force: true });
    rmSync(target, { recursive: true, force: true });
  }
}

// The reminder's text reaches Claude only as additionalContext JSON; plain
// PreToolUse stdout goes to the debug log. Parsing it is the assertion that it
// is visible at all.
export function reminderText(stdout) {
  const out = JSON.parse(stdout).hookSpecificOutput;
  assert.equal(out.hookEventName, "PreToolUse");
  return out.additionalContext;
}
