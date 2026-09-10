#!/usr/bin/env node
//
// check-line-endings.mjs -- assert LF is pinned, and that nothing is stored CRLF.
//
// Two checks, both guarding a failure that is silent from every angle:
//
//   1. .gitattributes still contains `* text=auto eol=lf`. The rule is one line and
//      deleting it breaks nothing visibly, so nothing else would ever tell you.
//   2. No tracked text file is stored with CRLF (or mixed) endings in the index.
//
// Why (2) earns a build step rather than trust. A CRLF working tree plus a later
// LF-only rewrite by any tool that treats a lone CR as a line terminator emits one
// line per CR, so every CR becomes a REAL blank line and the file's line count
// becomes exactly old-lines + old-CRs. Each cycle roughly doubles the file. A
// knowledge-base index went 257 -> 768 -> 1537 -> 3071 lines that way while its
// actual content stayed at ~173, and changing a single number in it produced a
// 768-insertion/257-deletion diff that destroyed `git blame` for the file and made
// every concurrent edit a conflict.
//
// Nothing about it looks wrong while it happens: `git status` is clean, the content
// is all present and correctly ordered, and Markdown renders N blank lines exactly
// like one, so no consumer ever complains. Only the diff shows it, and only if you
// look. Full write-up: LL-G kb/git/crlf-expansion-doubles-file.md
//
// `eol=lf` is the half that matters. `text=auto` alone normalizes what is COMMITTED
// but leaves the CHECKOUT to core.autocrlf, which Git for Windows sets to true by
// default -- so the CRs come straight back on the next clone.
//
// Deliberately NOT checked here: a "blank lines outnumber content lines" heuristic.
// Legitimate files sit near a 1:1 blank-to-content ratio (changelogs, run logs,
// vendored manuals), so that test false-positives on healthy files, while the CR
// check catches the actual cause before any expansion can occur.
//
// Files marked `-text` are exempt by design -- the attribute IS the opt-out, for
// vendored payloads kept byte-for-byte so a future upstream drop can be diffed.
//
// Node built-ins only. Exit 0 = clean, 1 = problems. Run with: npm run check:eol

import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";

const REQUIRED_RULE = /^\*\s+text=auto\s+eol=lf\s*$/m;
const errors = [];

if (!existsSync(".gitattributes")) {
	errors.push(
		".gitattributes is missing. Every text file is then at the mercy of core.autocrlf, which Git for Windows sets to true by default.",
	);
} else if (!REQUIRED_RULE.test(readFileSync(".gitattributes", "utf8"))) {
	errors.push(
		".gitattributes no longer contains the `* text=auto eol=lf` rule. eol=lf is the half that pins the CHECKOUT; text=auto alone only normalizes what is committed, so a Windows clone re-adds the CRs.",
	);
}

// "i/<eol>  w/<eol>  attr/<attrs>\t<path>" -- i/ is how the blob is stored, which is
// what every consumer fetches. w/ is a local checkout artifact and deliberately ignored:
// on Windows it reads crlf for every file until the tree is re-checked-out, which would
// make this check fail for everyone locally while passing in CI.
let rows;
try {
	rows = execFileSync("git", ["ls-files", "--eol"], { encoding: "utf8" }).split("\n").filter(Boolean);
} catch {
	console.error("check-line-endings: `git ls-files --eol` failed. Run this from inside a git work tree.");
	process.exit(1);
}

let checked = 0;
let exempt = 0;
for (const row of rows) {
	const m = /^i\/(\S*)\s+w\/(\S*)\s+attr\/(.*?)\s*\t(.*)$/.exec(row);
	if (!m) {
		// Never skip a row we cannot read. A guard that silently ignores unparseable
		// input reports success on exactly the case it exists to catch -- this check
		// did that once, when an empty `w/` field (a file absent from the worktree)
		// made the pattern fail and a CRLF blob sailed through counted as "exempt".
		errors.push(`git ls-files --eol produced a row this check cannot parse, so it was not verified: ${JSON.stringify(row)}`);
		continue;
	}
	const [, index, , attr, path] = m;
	if (/(^|\s)-text(\s|$)/.test(attr)) { exempt++; continue; } // explicitly opted out
	if (index === "none" || index === "-text") { exempt++; continue; } // empty or binary
	checked++;
	if (index === "crlf" || index === "mixed") {
		errors.push(
			`${path}: stored as ${index} in the index. Run \`git add --renormalize .\` -- and when stripping CRs by hand, DELETE them rather than translating each CR into a newline, which performs another expansion cycle.`,
		);
	}
}

console.log(`check-line-endings: ${checked} tracked text files checked, ${exempt} exempt (binary or -text)`);
if (!errors.length) {
	console.log("check-line-endings OK: LF pinned in .gitattributes, no CRLF in the index.");
	process.exit(0);
}
console.error(`\ncheck-line-endings FAILED: ${errors.length} problem(s):`);
for (const e of errors) console.error(`  - ${e}`);
process.exit(1);
