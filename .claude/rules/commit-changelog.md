---
description: Update changelog and version before committing
---

# Pre-Commit: Changelog & Version Update

Every commit ships a CHANGELOG.md section and a matching version bump. This is
enforced by `.claude/scripts/check-changelog-staged.sh`, which blocks the commit
otherwise -- the steps below are the contract it checks, not advice.

## 1. Add a new CHANGELOG.md section

Nothing is staged under `[Unreleased]`. That heading stays at the top, empty, and
each commit adds its own section directly below it, newest first:

```markdown
## [Unreleased]

## [0.9.1] - 2026-08-21

### Added
- New capability, described from the user's perspective.
```

Categorise with [Keep a Changelog](https://keepachangelog.com/en/2.0.0/) headings:
**Added**, **Changed**, **Deprecated**, **Removed**, **Fixed**, **Security**. Use only
those six, each once per version, in that order: no `### Notes` or dated variants.
Review `git diff --cached` to see what actually changed, and write entries as effects
on the user, not as implementation notes.

- Heading format: `## [X.Y.Z] - YYYY-MM-DD`, one heading per version.
- Add a link for the new version at the bottom of CHANGELOG.md, copying the existing
  pattern (`[X.Y.Z]: .../compare/vPREV...vX.Y.Z`), and point `[Unreleased]` at
  `compare/vX.Y.Z...HEAD`. `.github/workflows/tag-versions.yml` creates the `vX.Y.Z`
  tag when the commit reaches `main`; do not tag by hand. Without that workflow, link
  only versions that already have a tag.
- Over 100 KB: move releases older than 30 days, with their links, into `CHANGELOG-archive.md` (newest first), keeping at least the 10 newest releases in CHANGELOG.md. Archive only what is old enough that it won't need editing (Keep a Changelog 2.0.0).

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

Stage both files (plus `CHANGELOG-archive.md` if you archived):

```bash
git add CHANGELOG.md package.json
```

The gate is a PreToolUse hook, so it runs **before** your command. It cannot see
files that the very command it is checking has not written yet — folding the edit
into `... && git commit` does not satisfy it. Edit and stage first, commit second.

## Exemptions

Merge commits, `--amend`, and the initial commit are exempt automatically. For a
genuinely trivial commit, prefix the command itself -- `SKIP_CHANGELOG=1 git commit
-m "..."`. The hook reads the assignment out of the command text, so exporting the
variable in an earlier command does not reach it.

The gate judges the repo the command targets, `cd otherrepo && ...` and `git -C
otherrepo ...` included -- not whichever repo the session started in.
