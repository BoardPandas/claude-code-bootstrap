---
description: Update changelog and version before committing
---

# Pre-Commit: Changelog & Version Update

Every commit ships a CHANGELOG.md section and a matching version bump. This is
enforced by `.claude/scripts/check-changelog-staged.sh`, which blocks the commit
otherwise -- the steps below are the contract it checks, not advice.

## 1. Add a new CHANGELOG.md section

There is no `[Unreleased]` staging area. Each commit adds its own section at the
top of the file, newest first:

```markdown
## [0.9.1] - 2026-08-21

### Added
- New capability, described from the user's perspective.
```

Categorise with [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) headings:
**Added**, **Changed**, **Fixed**, **Removed**, **Security**. Review `git diff --cached`
to see what actually changed, and write entries as effects on the user, not as
implementation notes.

## 2. Bump the version in package.json to match

Version format: **Major.Minor.Patch** (SemVer). The version in package.json and
the version in the new CHANGELOG.md heading must be identical.

| Segment | When to increment | Resets | Example |
|---|---|---|---|
| **Major** (1st) | Breaking changes — API contract changes, schema migrations that break compatibility, auth flow changes, removal of public endpoints | Minor, Patch → 0 | 1.2.3 → 2.0.0 |
| **Minor** (2nd) | New features or enhancements — new pages, endpoints, integrations, worker jobs | Patch → 0 | 1.2.3 → 1.3.0 |
| **Patch** (3rd) | Everything else — bug fixes, security patches, performance, dependencies, docs, refactors, config, chores | Nothing | 1.2.3 → 1.2.4 |

- Every commit bumps at least **Patch**, no exceptions.
- A higher segment incrementing resets all lower segments to 0.
- A commit with both a feature and a fix takes the **highest** applicable bump.
- **NEVER bump Major autonomously.** Ask the user first, even when the change
  looks breaking. The user decides when Major moves.
- If unsure between Minor and Patch, ask.

## 3. Make the edits their own step, then commit

```bash
git add CHANGELOG.md package.json
```

The gate is a PreToolUse hook, so it runs **before** your command. It cannot see
files that the very command it is checking has not written yet — folding the edit
into `... && git commit` does not satisfy it. Edit and stage first, commit second.

## Exemptions

Merge commits, `--amend`, and the initial commit are exempt automatically. For a
genuinely trivial commit, `SKIP_CHANGELOG=1` bypasses the gate.
