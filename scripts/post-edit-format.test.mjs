#!/usr/bin/env node
//
// post-edit-format.test.mjs -- assert the format hook finds Go and Rust modules
// wherever they live in the repo, and only inside it.
//
// The hook used to look for go.mod and Cargo.toml at the repo root only. In a
// monorepo the module sits below the root (services/api/go.mod), so gofmt and
// rustfmt never ran on a single file, and a formatter that never runs reports
// nothing. Both directions are asserted: a file inside a module below the root is
// formatted, and a file under no module -- or under one OUTSIDE the repo -- is
// left byte-for-byte alone.
//
// Each formatter's cases skip when that formatter is not installed, since the
// hook itself treats a missing formatter as "do nothing".
//
// Run with: npm test

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const HOOK = join(dirname(fileURLToPath(import.meta.url)), "..", ".claude", "scripts", "post-edit-format.sh");

const runs = (cmd) => spawnSync(cmd, ["--help"], { encoding: "utf8" }).error === undefined;
const noGofmt = runs("gofmt") ? false : "gofmt is not installed";
const noRustfmt = spawnSync("rustfmt", ["--version"], { encoding: "utf8" }).status === 0 ? false : "rustfmt is not installed";

const UGLY_GO = "package pkg\nfunc  F( ) {  }\n";
const GOFMT_GO = "package pkg\n\nfunc F() {}\n";
const UGLY_RS = "fn  main( ) {  }\n";
const RUSTFMT_RS = "fn main() {}\n";

// A git repo inside `parent`, so a marker can also be planted outside the repo.
function makeRepo() {
  const parent = mkdtempSync(join(tmpdir(), "post-edit-format-"));
  const repo = join(parent, "repo");
  mkdirSync(repo);
  spawnSync("git", ["init", "-q", "."], { cwd: repo });
  return { parent, repo };
}

function put(root, rel, text) {
  mkdirSync(dirname(join(root, rel)), { recursive: true });
  writeFileSync(join(root, rel), text);
}

function format(repo, rel) {
  const r = spawnSync("bash", [HOOK], {
    cwd: repo,
    input: JSON.stringify({ tool_name: "Edit", tool_input: { file_path: join(repo, rel) } }),
    encoding: "utf8",
  });
  assert.equal(r.status, 0, "the format hook must never block");
  return readFileSync(join(repo, rel), "utf8");
}

describe("Go", { skip: noGofmt }, () => {
  test("formats a file in a module below the repo root", () => {
    const { parent, repo } = makeRepo();
    try {
      put(repo, "services/api/go.mod", "module example.com/api\n\ngo 1.22\n");
      put(repo, "services/api/internal/pkg/a.go", UGLY_GO);
      assert.equal(format(repo, "services/api/internal/pkg/a.go"), GOFMT_GO);
    } finally {
      rmSync(parent, { recursive: true, force: true });
    }
  });

  test("still formats with go.mod at the repo root", () => {
    const { parent, repo } = makeRepo();
    try {
      put(repo, "go.mod", "module example.com/x\n\ngo 1.22\n");
      put(repo, "pkg/a.go", UGLY_GO);
      assert.equal(format(repo, "pkg/a.go"), GOFMT_GO);
    } finally {
      rmSync(parent, { recursive: true, force: true });
    }
  });

  test("leaves a file under no go.mod alone", () => {
    const { parent, repo } = makeRepo();
    try {
      put(repo, "tools/gen/a.go", UGLY_GO);
      assert.equal(format(repo, "tools/gen/a.go"), UGLY_GO);
    } finally {
      rmSync(parent, { recursive: true, force: true });
    }
  });

  // The walk stops at the repo root. A go.mod above it belongs to some other
  // checkout and says nothing about whether this repo wants gofmt.
  test("does not count a go.mod outside the repo", () => {
    const { parent, repo } = makeRepo();
    try {
      put(parent, "go.mod", "module example.com/outer\n\ngo 1.22\n");
      put(repo, "a.go", UGLY_GO);
      assert.equal(format(repo, "a.go"), UGLY_GO);
    } finally {
      rmSync(parent, { recursive: true, force: true });
    }
  });
});

describe("Rust", { skip: noRustfmt }, () => {
  test("formats a file in a crate below the repo root", () => {
    const { parent, repo } = makeRepo();
    try {
      put(repo, "crates/core/Cargo.toml", '[package]\nname = "core"\nversion = "0.1.0"\nedition = "2021"\n');
      put(repo, "crates/core/src/main.rs", UGLY_RS);
      assert.equal(format(repo, "crates/core/src/main.rs"), RUSTFMT_RS);
    } finally {
      rmSync(parent, { recursive: true, force: true });
    }
  });

  test("leaves a file under no Cargo.toml alone", () => {
    const { parent, repo } = makeRepo();
    try {
      put(repo, "scratch/main.rs", UGLY_RS);
      assert.equal(format(repo, "scratch/main.rs"), UGLY_RS);
    } finally {
      rmSync(parent, { recursive: true, force: true });
    }
  });
});
