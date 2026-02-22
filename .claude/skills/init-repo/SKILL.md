---
name: init-repo
description: Build or rebuild the .claude/ folder with best practices. Use when setting up Claude Code in a new or existing repository.
user-invocable: true
argument-hint: (no arguments needed)
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - WebFetch
  - Task
---

# Initialize Repository for Claude Code

You have been asked to initialize or upgrade this repository's Claude Code configuration. Follow these steps exactly.

## Step 1: Read Current State

1. Read `CLAUDE.md` in the repo root (if it exists). Note its contents.
2. Read `agents.md` in the repo root (if it exists). Note its contents.
3. Read `README.md` in the repo root (if it exists). Identify the project's tech stack, purpose, and conventions.
4. Scan the `.claude/` folder (if it exists) using Glob. List all existing files.
5. Read `.claude/settings.json` (if it exists). Note current settings.

## Step 2: Fetch Best Practices

1. Read the source URL registry at `.claude/references/source-urls.md`.
2. Fetch every URL listed in that file using WebFetch. For each URL, extract:
   - Current Claude Code version and features
   - Recommended folder structure and file conventions
   - Skills, agents, hooks, and settings patterns
   - Any new features or deprecations
3. For URLs that fail to fetch, log the failure and continue. Do not halt.

## Step 3: Analyze Gaps

Compare the current `.claude/` folder against the best practices you fetched. Identify:

- Missing configuration files (settings.json, agents, skills)
- Outdated patterns or deprecated features in use
- Skills that should exist but do not (at minimum: code-review, security-scan, performance-review)
- Agent definitions that are missing or incomplete
- Settings that should be updated

## Step 4: Build or Update

For each gap identified, create or update the file. Follow these rules:

- **Non-destructive:** Never overwrite custom project-specific settings. Merge with existing config.
- **Skills:** Ensure these skills exist in `.claude/skills/`: init-repo, update-practices, code-review, security-scan, performance-review, dependency-audit, test-scaffold, doc-sync. If additional skills are relevant to the detected tech stack, add them.
- **Agents:** Ensure these agents exist in `.claude/agents/`: architect, reviewer, security, performance. Add others if relevant to the project.
- **Settings:** Update `.claude/settings.json` with recommended permissions and hooks. Preserve any existing custom entries.
- **CLAUDE.md:** Update the root CLAUDE.md to reflect the current skill and agent inventory. Preserve project-specific content.
- **agents.md:** Update the root agents.md to register all agents. Preserve project-specific content.
- **README.md:** If a README exists, add or update the "Claude Code" section describing the available skills and agents. Do not alter other sections.

## Step 5: Create instructions.md

Create or update `instructions.md` in the repo root with:

- What the `.claude/` folder contains
- How to use each skill (trigger phrase and description)
- How to customize the setup for this specific project
- How to add new skills or agents

## Step 6: Report

Print a summary listing:

- Files created (with paths)
- Files updated (with what changed)
- Skills available
- Agents registered
- Any warnings or issues encountered

## Non-Destructive Merge Rules

When merging with existing configuration:

1. For JSON files: deep-merge objects. Existing keys are preserved unless the new value is strictly better (e.g., adding a missing permission).
2. For markdown files: append new sections. Do not remove existing sections.
3. For skills: if a skill already exists with custom content, do not overwrite. Only update if the existing skill references deprecated features.
4. For agents: same rule as skills.
