#!/usr/bin/env node
//
// new-project.mjs -- give a repo created from this template its own release history.
//
// A repo made from claude-code-bootstrap (by `git clone` or GitHub's "Use this
// template") arrives with the template's CHANGELOG.md and package.json, so it starts
// life claiming a version and a release log it never had. This resets both to a 0.0.1
// baseline, then deletes itself, its test, and the template-cleanup workflow, which
// have nothing left to do.
//
// It only acts on a fresh copy: a package.json whose name is no longer the template's
// means the reset already happened, or this is someone's own project, so it exits
// without touching anything. It refuses to run in the template repo itself.
//
//   node scripts/new-project.mjs [--name <package-name>]
//
// The name defaults to the GitHub repo name in Actions, else the directory name.
// Run from the repo root. Node built-ins only.

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

const TEMPLATE_NAME = "claude-code-bootstrap";
const TEMPLATE_REPO = "BoardPandas/claude-code-bootstrap";
const SELF = ["scripts/new-project.mjs", "scripts/new-project.test.mjs", ".github/workflows/template-cleanup.yml"];

const root = process.cwd();

// Thrown for every refusal, so main() ends normally and sets the exit code; a bare
// process.exit() can drop output still buffered on a pipe.
class Refusal extends Error {}
const fail = (msg) => {
  throw new Refusal(msg);
};

function originUrl() {
  try {
    return execFileSync("git", ["remote", "get-url", "origin"], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    // Not a git repo, or no origin: exactly the state after `rm -rf .git && git init`.
    return "";
  }
}

// npm names: lowercase, URL-safe, no leading dot or underscore, at most 214 chars.
function packageName(raw) {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9._~-]+/g, "-")
    .replace(/^[._-]+|-+$/g, "")
    .slice(0, 214);
}

function today() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function main() {
  const args = process.argv.slice(2);
  const nameFlag = args.indexOf("--name");
  if (nameFlag !== -1 && !args[nameFlag + 1]) fail("--name needs a value.");

  if (process.env.GITHUB_REPOSITORY === TEMPLATE_REPO) {
    fail(`refusing to run in the template repo (${TEMPLATE_REPO}) itself.`);
  }
  if (new RegExp(`[/:]${TEMPLATE_REPO}(\\.git)?/?$`, "i").test(originUrl())) {
    fail(
      `origin still points at ${TEMPLATE_REPO}, so this is a clone of the template, not a new project. ` +
        "Detach it first: rm -rf .git && git init",
    );
  }

  const pkgPath = join(root, "package.json");
  if (!existsSync(pkgPath)) fail("no package.json here. Run this from the repo root.");

  let pkg;
  try {
    pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  } catch (err) {
    fail(`package.json is not valid JSON: ${err.message}`);
  }

  if (pkg.name !== TEMPLATE_NAME) {
    console.log(`new-project: package.json is "${pkg.name}", not the template's. Nothing to reset.`);
    return;
  }

  const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1];
  const name = packageName(nameFlag !== -1 ? args[nameFlag + 1] : repoName || basename(root));
  if (!name) fail("could not derive a package name. Pass one with --name.");
  if (name === TEMPLATE_NAME) fail(`the new project needs a name other than "${TEMPLATE_NAME}". Pass one with --name.`);

  // Spread keeps key order and everything the project still needs (scripts for CI and
  // the guard, engines); only the identity of the package changes.
  writeFileSync(pkgPath, JSON.stringify({ ...pkg, name, version: "0.0.1", description: "" }, null, 2) + "\n");

  const changelogPath = join(root, "CHANGELOG.md");
  writeFileSync(
    changelogPath,
    [
      "# Changelog",
      "",
      "All notable changes to this project will be documented in this file.",
      "",
      "The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).",
      "",
      `## [0.0.1] - ${today()}`,
      "",
      "### Added",
      "- Initial project setup and Claude Code configuration.",
      "",
    ].join("\n"),
  );

  // A write that silently did nothing would leave the template's history in place and
  // still report success, so read both files back before deleting anything.
  const written = JSON.parse(readFileSync(pkgPath, "utf8"));
  if (written.version !== "0.0.1" || written.name !== name) fail("package.json did not take the reset.");
  if (!readFileSync(changelogPath, "utf8").includes("## [0.0.1] - ")) fail("CHANGELOG.md did not take the reset.");

  for (const p of SELF) rmSync(join(root, p), { force: true });

  console.log(`new-project: "${name}" now starts at 0.0.1 with a fresh CHANGELOG.md.`);
  console.log(`new-project: removed ${SELF.join(", ")}.`);
}

try {
  main();
} catch (err) {
  if (!(err instanceof Refusal)) throw err;
  console.error(`new-project: ${err.message}`);
  process.exitCode = 1;
}
