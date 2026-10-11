#!/usr/bin/env node
//
// new-project.test.mjs -- assert the new-project reset fires on a fresh copy of the
// template and nowhere else.
//
// The script rewrites CHANGELOG.md and package.json and deletes files, so the cases
// that matter most are the refusals: the template repo itself, a clone still pointing
// at it, and a project that already has its own history must all come through
// untouched. Each case runs the real script against a throwaway copy.
//
// Node built-ins only. Run with: npm test

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(HERE, "new-project.mjs");
const WORKFLOW = join(HERE, "..", ".github/workflows/template-cleanup.yml");
const SELF = ["scripts/new-project.mjs", "scripts/new-project.test.mjs", ".github/workflows/template-cleanup.yml"];

const TEMPLATE_PKG = {
  name: "claude-code-bootstrap",
  version: "0.21.8",
  private: true,
  description: "Claude Code starter template",
  scripts: { "check:claude": "node scripts/check-claude-wiring.mjs", test: 'node --test "scripts/**/*.test.mjs"' },
  engines: { node: ">=24" },
};
const TEMPLATE_CHANGELOG = "# Changelog\n\n## [0.21.8] - 2026-10-11\n\n### Removed\n- The AI code review workflow.\n";

const write = (root, p, s) => {
  mkdirSync(join(root, dirname(p)), { recursive: true });
  writeFileSync(join(root, p), s);
};
const read = (root, p) => readFileSync(join(root, p), "utf8");

function fixture(pkg = TEMPLATE_PKG) {
  const dir = mkdtempSync(join(tmpdir(), "new-project-"));
  write(dir, "package.json", JSON.stringify(pkg, null, 2) + "\n");
  write(dir, "CHANGELOG.md", TEMPLATE_CHANGELOG);
  mkdirSync(join(dir, "scripts"), { recursive: true });
  copyFileSync(SCRIPT, join(dir, "scripts/new-project.mjs"));
  write(dir, "scripts/new-project.test.mjs", "// stand-in\n");
  write(dir, ".github/workflows/template-cleanup.yml", "name: stand-in\n");
  return dir;
}

// The template's own CI sets GITHUB_REPOSITORY to the template, which the script
// refuses; each case states the repo it simulates instead of inheriting that.
function run(dir, { repo, args = [] } = {}) {
  const env = { ...process.env };
  delete env.GITHUB_REPOSITORY;
  if (repo) env.GITHUB_REPOSITORY = repo;
  return spawnSync(process.execPath, [join(dir, "scripts/new-project.mjs"), ...args], {
    cwd: dir,
    env,
    encoding: "utf8",
  });
}

function assertUntouched(dir, pkg = TEMPLATE_PKG) {
  assert.deepEqual(JSON.parse(read(dir, "package.json")), pkg);
  assert.equal(read(dir, "CHANGELOG.md"), TEMPLATE_CHANGELOG);
  for (const p of SELF) assert.ok(existsSync(join(dir, p)), `${p} should still exist`);
}

test("a fresh copy is reset to 0.0.1 and the one-shot files are removed", () => {
  const dir = fixture();
  const r = run(dir, { repo: "acme/widget-api" });
  assert.equal(r.status, 0, r.stderr);

  const pkg = JSON.parse(read(dir, "package.json"));
  assert.deepEqual(pkg, { ...TEMPLATE_PKG, name: "widget-api", version: "0.0.1", description: "" });
  assert.deepEqual(Object.keys(pkg), Object.keys(TEMPLATE_PKG), "key order is preserved");

  const changelog = read(dir, "CHANGELOG.md");
  assert.match(changelog, /^# Changelog\n/);
  assert.match(changelog, /\n## \[0\.0\.1\] - \d{4}-\d{2}-\d{2}\n/);
  assert.doesNotMatch(changelog, /0\.21\.8|AI code review/, "no template history survives");
  assert.equal(changelog.match(/^## \[/gm).length, 1, "exactly one release");

  for (const p of SELF) assert.ok(!existsSync(join(dir, p)), `${p} should be deleted`);
});

test("--name wins and is normalised to a valid npm name", () => {
  const dir = fixture();
  const r = run(dir, { repo: "acme/widget-api", args: ["--name", "My Cool_Project!"] });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(JSON.parse(read(dir, "package.json")).name, "my-cool_project");
});

test("outside Actions the name comes from the directory", () => {
  const dir = fixture();
  const r = run(dir);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(JSON.parse(read(dir, "package.json")).name, basename(dir).toLowerCase());
});

test("a project with its own package.json is left alone", () => {
  const own = { ...TEMPLATE_PKG, name: "widget-api", version: "1.4.2" };
  const dir = fixture(own);
  const r = run(dir, { repo: "acme/widget-api" });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /Nothing to reset/);
  assertUntouched(dir, own);
});

test("refuses to run in the template repo itself", () => {
  const dir = fixture();
  const r = run(dir, { repo: "BoardPandas/claude-code-bootstrap" });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /template repo/);
  assertUntouched(dir);
});

test("refuses a clone whose origin is still the template", () => {
  const dir = fixture();
  const git = (...a) => spawnSync("git", a, { cwd: dir, encoding: "utf8" });
  assert.equal(git("init", "-q").status, 0);
  assert.equal(git("remote", "add", "origin", "https://github.com/BoardPandas/claude-code-bootstrap.git").status, 0);
  const r = run(dir);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /rm -rf \.git && git init/);
  assertUntouched(dir);
});

test("refuses a name that would still be the template's", () => {
  const dir = fixture();
  const r = run(dir, { args: ["--name", "claude-code-bootstrap"] });
  assert.equal(r.status, 1);
  assertUntouched(dir);
});

// The workflow and the script each carry their own copy of the template's name. If
// one is renamed without the other, the workflow would reset the template itself.
test("the cleanup workflow guards on the same template repo as the script", { skip: !existsSync(WORKFLOW) }, () => {
  const repo = readFileSync(SCRIPT, "utf8").match(/const TEMPLATE_REPO = "([^"]+)"/)[1];
  assert.match(readFileSync(WORKFLOW, "utf8"), new RegExp(`github\\.repository != '${repo}'`));
});
