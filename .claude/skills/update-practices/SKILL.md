---
name: update-practices
description: Fetch latest Claude Code best practices and update the .claude/ folder configuration. Safe to run repeatedly.
user-invocable: true
argument-hint: (no arguments needed)
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - WebFetch
  - Task
---

# Update Best Practices

You have been asked to update this repository's Claude Code configuration to the latest best practices. Follow these steps exactly.

## Step 1: Read Current Configuration

1. Read `.claude/references/source-urls.md` to get the list of URLs to fetch.
2. Read `CLAUDE.md` in the repo root. Note its contents and version references.
3. Read `agents.md` in the repo root. Note registered agents.
4. Scan `.claude/skills/` using Glob. List all existing skills.
5. Scan `.claude/agents/` using Glob. List all existing agents.
6. Read `.claude/settings.json`. Note current settings.

## Step 2: Fetch Latest Practices

1. Fetch every URL from the source registry using WebFetch.
2. For each URL, extract:
   - The current Claude Code version number
   - New features since the last known version
   - Deprecated features or patterns
   - New recommended settings, skills, agents, or hooks
   - Changes to folder structure conventions
3. Log failed fetches and continue. Do not halt.

## Step 3: Compare and Identify Changes

Categorize findings as:

- **NEW:** Features or patterns not yet reflected in the current config.
- **UPDATED:** Patterns that exist but need modification to match current best practices.
- **DEPRECATED:** Patterns in use that are no longer recommended.
- **CURRENT:** Patterns that already match best practices (no action needed).

## Step 4: Implement Changes

For each NEW or UPDATED item:

1. Determine which file(s) need to change.
2. Make the change. Follow the non-destructive merge rules:
   - Never remove custom project-specific content.
   - Append new sections rather than replacing existing ones.
   - For JSON files, deep-merge -- preserve existing keys.
3. For DEPRECATED items: update the pattern to the recommended alternative. Add a comment explaining the change if the old pattern was non-obvious.

Ensure these skills still exist and are current:
- code-review
- security-scan
- performance-review
- dependency-audit
- test-scaffold
- doc-sync

Ensure these agents still exist and are current:
- architect
- reviewer
- security
- performance

## Step 5: Update Documentation

1. Update `CLAUDE.md` if skill or agent inventory changed.
2. Update `agents.md` if agent inventory changed.
3. Update `instructions.md` if usage patterns changed.

## Step 6: Report

Print a diff-style summary:

```
CHANGES APPLIED:
  [NEW] Added skill: <name> -- <reason>
  [UPDATED] Modified .claude/settings.json -- <what changed>
  [DEPRECATED] Replaced <old pattern> with <new pattern> in <file>
  [CURRENT] No changes needed for: <list>

CLAUDE CODE VERSION: <version found>
SOURCES CHECKED: <count> of <total> fetched successfully
```

## Idempotency

Running this skill twice in a row must produce no changes the second time. Every change must be conditional -- only apply if the current state differs from the target state.
