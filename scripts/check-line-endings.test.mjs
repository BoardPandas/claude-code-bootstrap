#!/usr/bin/env node
//
// check-line-endings.test.mjs -- assert that the line-ending guard still fires.
//
// The guard protects against a defect that is silent from every angle, so a guard
// that has quietly stopped checking looks exactly like a clean repo. Worse, this
// particular check has already failed OPEN once: an unparseable `git ls-files --eol`
// row (empty `w/` field, for a file absent from the worktree) made its pattern miss,
// and a CRLF blob sailed through counted as "exempt" while the guard printed OK.
// That case is asserted below.
//
// Method, matching check-claude-wiring.test.mjs: build a minimal fixture repo that
// PASSES, then mutate one thing at a time and assert the guard exits 1 and names the
// defect. Asserting on the message, not just the exit code, is what catches a
// mutation that happens to trip a different check.
//
// Node built-ins only, matching the guard itself. Run with: npm test

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const GUARD = join(dirname(fileURLToPath(import.meta.url)), "check-line-endings.mjs");
const RULE = "* text=auto eol=lf\n";

const git = (cwd, ...args) => {
	const r = spawnSync("git", args, { cwd, encoding: "utf8" });
	if (r.status !== 0) throw new Error(`git ${args.join(" ")} failed: ${r.stderr}`);
	return r.stdout.trim();
};

const runGuard = (cwd) => {
	const r = spawnSync(process.execPath, [GUARD], { cwd, encoding: "utf8" });
	return { code: r.status, out: `${r.stdout}${r.stderr}` };
};

/** A fixture repo that satisfies both checks. `mutate` breaks exactly one thing. */
function fixture(mutate) {
	const dir = mkdtempSync(join(tmpdir(), "eol-"));
	git(dir, "init", "-q");
	writeFileSync(join(dir, ".gitattributes"), RULE);
	writeFileSync(join(dir, "README.md"), "hello\nworld\n");
	git(dir, "add", "-A");
	if (mutate) mutate(dir);
	return dir;
}

/** Put a CRLF blob into the index, bypassing the clean filter the rule would apply. */
function stageCrlfBlob(dir, path) {
	const tmp = join(dir, "_crlf.tmp");
	writeFileSync(tmp, "a\r\nb\r\n");
	const sha = git(dir, "hash-object", "-w", "--no-filters", tmp);
	git(dir, "update-index", "--add", "--cacheinfo", `100644,${sha},${path}`);
	rmSync(tmp);
}

test("a clean repo passes", () => {
	const dir = fixture();
	const { code, out } = runGuard(dir);
	assert.equal(code, 0, out);
	assert.match(out, /LF pinned in \.gitattributes, no CRLF in the index/);
	rmSync(dir, { recursive: true, force: true });
});

test("a missing .gitattributes is refused", () => {
	const dir = fixture((d) => rmSync(join(d, ".gitattributes")));
	const { code, out } = runGuard(dir);
	assert.equal(code, 1, out);
	assert.match(out, /\.gitattributes is missing/);
	rmSync(dir, { recursive: true, force: true });
});

test("a .gitattributes without the eol=lf rule is refused", () => {
	// text=auto alone is the trap: it normalizes what is committed but leaves the
	// checkout to core.autocrlf, so the CRs return on the next clone.
	const dir = fixture((d) => writeFileSync(join(d, ".gitattributes"), "* text=auto\n"));
	const { code, out } = runGuard(dir);
	assert.equal(code, 1, out);
	assert.match(out, /no longer contains the `\* text=auto eol=lf` rule/);
	rmSync(dir, { recursive: true, force: true });
});

test("a CRLF blob in the index is refused, and named", () => {
	const dir = fixture((d) => stageCrlfBlob(d, "notes.md"));
	const { code, out } = runGuard(dir);
	assert.equal(code, 1, out);
	assert.match(out, /notes\.md: stored as crlf in the index/);
	rmSync(dir, { recursive: true, force: true });
});

test("a CRLF blob is still caught when the file is absent from the worktree", () => {
	// The regression case. `git ls-files --eol` prints an empty `w/` field for a file
	// that is staged but not checked out; a pattern demanding a non-empty value fails
	// to match, and the row used to be skipped and counted as exempt -- the guard
	// printed OK on exactly the input it exists to catch. Unparseable rows now fail.
	const dir = fixture((d) => stageCrlfBlob(d, "ghost.md"));
	assert.match(git(dir, "ls-files", "--eol", "ghost.md"), /^i\/crlf\s+w\/\s/, "fixture must have an empty w/ field");
	const { code, out } = runGuard(dir);
	assert.equal(code, 1, out);
	assert.match(out, /ghost\.md/);
	rmSync(dir, { recursive: true, force: true });
});

test("a path marked -text is exempt, because the attribute is the opt-out", () => {
	const dir = fixture((d) => {
		writeFileSync(join(d, ".gitattributes"), `${RULE}vendor/** -text\n`);
		git(d, "add", ".gitattributes");
		stageCrlfBlob(d, "vendor/upstream.txt");
	});
	const { code, out } = runGuard(dir);
	assert.equal(code, 0, out);
	assert.match(out, /1 exempt/);
	rmSync(dir, { recursive: true, force: true });
});
