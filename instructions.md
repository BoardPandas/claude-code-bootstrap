# Claude Code Starter Template -- Instructions

## What This Template Is

This repository provides a pre-configured `.claude/` folder that gives Claude Code a set of skills, agents, and settings aligned with current best practices. It works in two modes:

1. **Clone for new projects** -- Start a new repo with Claude Code already configured.
2. **Copy into existing projects** -- Drop the `.claude/` folder (plus CLAUDE.md and agents.md) into any existing repo to add Claude Code capabilities.

## Folder Structure

```
.claude/
  agents/                  # Custom agent definitions
    architect.md           # System design and planning
    reviewer.md            # Code review agent
    security.md            # Security analysis agent
    performance.md         # Performance analysis agent
  skills/                  # Executable skill definitions
    init-repo/SKILL.md     # Repository initialization
    update-practices/SKILL.md  # Best practice updates
    code-review/SKILL.md   # Code review
    security-scan/SKILL.md # Security scanning
    performance-review/SKILL.md  # Performance analysis
    dependency-audit/SKILL.md    # Dependency checking
    test-scaffold/SKILL.md      # Test generation
    doc-sync/SKILL.md           # Documentation sync
  references/
    source-urls.md         # URL registry for fetching best practices
  settings.json            # Project-level Claude Code settings
CLAUDE.md                  # Master project rules for Claude Code
agents.md                  # Agent registry
instructions.md            # This file
README.md                  # GitHub-facing README
```

---

## Skills Reference

### init-repo

- **Trigger:** "initialize repo", "init repo", "set up claude code"
- **What it does:** Reads the current repo state, fetches best practices from the source URL registry, analyzes gaps in the `.claude/` folder, and builds or updates all configuration files. When used in an existing repo, it merges non-destructively -- it adds what's missing and updates what's outdated without overwriting custom settings.
- **When to use:** After cloning this template, after copying `.claude/` into an existing project, or when you want to rebuild your Claude Code setup from scratch.
- **Output:** A summary of all files created or modified.

### update-practices

- **Trigger:** "update practices", "refresh best practices", "update claude config"
- **What it does:** Fetches all URLs from the source registry, compares findings against the current config, and implements changes. It identifies new features to adopt, outdated patterns to replace, and deprecated features to remove.
- **When to use:** Periodically (monthly or after Claude Code updates) to keep your config current.
- **Output:** A diff-style summary showing what changed and why.
- **Safe to repeat:** Running it twice in a row produces no changes the second time.

### code-review

- **Trigger:** "code review", "review code", "full code review"
- **What it does:** Scans the codebase for code quality issues across 9 categories: correctness, naming, DRY violations, error handling, type safety, test coverage, dead code, TODO/FIXME/HACK comments, and consistency. Produces a severity-ranked report and offers to fix issues.
- **When to use:** Before merging PRs, after completing features, or as a periodic quality check.
- **Scope:** Optionally pass a file or directory path to limit the review.
- **Output:** Structured report with CRITICAL, WARNING, and SUGGESTION findings.

### security-scan

- **Trigger:** "security scan", "security audit", "check security"
- **What it does:** Scans for leaked secrets, OWASP Top 10 vulnerabilities, dependency CVEs, and input validation gaps. Checks .env files, CI/CD configs, and dependency manifests.
- **When to use:** Before releases, after adding auth logic, or when handling user input.
- **Scope:** Optionally pass a file or directory path to limit the scan.
- **Output:** Severity-ranked report with remediation steps. Secret values are always redacted.

### performance-review

- **Trigger:** "performance review", "perf review", "check performance"
- **What it does:** Analyzes for N+1 queries, memory leaks, bundle size issues, missing caching, inefficient algorithms, and build optimization opportunities.
- **When to use:** When investigating slowness, before scaling, or after adding resource-intensive features.
- **Scope:** Optionally pass a file or directory path to limit the analysis.
- **Output:** Impact-ranked report with specific fix recommendations.

### dependency-audit

- **Trigger:** "dependency audit", "audit dependencies", "check deps"
- **What it does:** Identifies outdated packages, known vulnerabilities, and unused dependencies across all detected package managers (npm, pip, cargo, go, etc.).
- **When to use:** Before releases, periodically, or when you suspect dependency issues.
- **Output:** Report with vulnerabilities, outdated packages (by severity), and potentially unused dependencies.

### test-scaffold

- **Trigger:** "scaffold tests", "generate tests", "add test coverage"
- **What it does:** Detects your test framework, identifies untested modules, and generates test file stubs matching your project's existing test patterns.
- **When to use:** When starting a testing effort or after adding new modules without tests.
- **Scope:** Optionally pass a file or directory to generate tests for specific code.
- **Output:** Test files created with test cases for happy path, edge cases, and error cases.

### doc-sync

- **Trigger:** "sync docs", "update docs", "fix documentation"
- **What it does:** Cross-references all documentation files against the codebase. Finds stale references, incorrect examples, missing docs, outdated versions, and broken links.
- **When to use:** After significant code changes, before releases, or when docs feel out of date.
- **Output:** Report of changes made and documentation gaps remaining.

---

## Agents Reference

### architect

- **File:** `.claude/agents/architect.md`
- **Model:** opus
- **Mode:** plan (presents options for approval before acting)
- **Purpose:** High-level planning, tech stack evaluation, file structure design, and system architecture decisions.
- **Activates when:** Starting new features, restructuring code, evaluating technology choices.

### reviewer

- **File:** `.claude/agents/reviewer.md`
- **Model:** sonnet
- **Mode:** plan
- **Purpose:** Code review focused on correctness, naming, DRY, error handling, type safety, and project standard compliance.
- **Activates when:** Used by the code-review skill. Also activates proactively during code changes when quality patterns are detected.

### security

- **File:** `.claude/agents/security.md`
- **Model:** opus
- **Mode:** plan
- **Purpose:** Security analysis covering OWASP Top 10, secrets detection, dependency vulnerabilities, and input validation.
- **Activates when:** Used by the security-scan skill. Also activates proactively when security-sensitive code patterns are detected.

### performance

- **File:** `.claude/agents/performance.md`
- **Model:** sonnet
- **Mode:** plan
- **Purpose:** Performance analysis covering queries, memory, I/O, frontend rendering, algorithms, and build optimization.
- **Activates when:** Used by the performance-review skill. Also activates proactively when performance-sensitive patterns are detected.

---

## Hooks

The template includes a minimal hook configuration in `.claude/settings.json`:

- **PreToolUse (git commit):** Logs a notification when commits are made. Customize this hook for pre-commit validation checks relevant to your project (linting, formatting, test runs).

To add custom hooks, edit `.claude/settings.json` and add entries to the `hooks` object. Supported hook events:

- `PreToolUse` / `PostToolUse` -- Before/after tool execution
- `SessionStart` / `SessionEnd` -- Session lifecycle
- `Stop` / `SubagentStop` -- Task completion
- `Notification` -- System notifications
- `PreCompact` -- Before context compaction
- `UserPromptSubmit` -- Before user prompt processing

Each hook entry has:
- `matcher` -- Pattern to match (e.g., `Bash(git commit*)`)
- `hooks` -- Array of hook definitions with `type`, `command`, and optional `timeout`

---

## Customizing for Your Project

### Editing CLAUDE.md

The root `CLAUDE.md` file controls how Claude Code behaves in your repo. Update it with:

- Your project's tech stack and conventions
- Specific coding standards (naming, formatting, patterns)
- Testing requirements
- Commit message format
- File organization rules

Keep it under 150 lines for reliable adherence. Reference external docs for details.

### Adding New Skills

1. Create a folder in `.claude/skills/` with your skill name.
2. Create `SKILL.md` inside that folder.
3. Add YAML frontmatter with at least `name`, `description`, and `user-invocable: true`.
4. Write step-by-step instructions in the markdown body.
5. Update the skill table in CLAUDE.md and this instructions.md file.

Example:

```yaml
---
name: my-skill
description: What this skill does
user-invocable: true
allowed-tools:
  - Read
  - Glob
  - Grep
---

# My Skill

Instructions for Claude Code to follow when this skill is triggered.
```

### Adding New Agents

1. Create a markdown file in `.claude/agents/` named after the agent.
2. Add YAML frontmatter with `name`, `description`, `model`, and optionally `tools`, `permissionMode`, `maxTurns`.
3. Write the agent's role, focus areas, and behavior in the markdown body.
4. Register the agent in `agents.md`.
5. Update CLAUDE.md.

### Updating the Source URL Registry

The file `.claude/references/source-urls.md` contains all URLs that `init-repo` and `update-practices` fetch. To add a new source:

1. Open `.claude/references/source-urls.md`.
2. Add the URL under the appropriate section (Official, Community, or Changelog).
3. The next time you run `update-practices`, it will include the new source.

### Personal Settings Overrides

Create `.claude/settings.local.json` for personal settings that should not be committed to version control. This file is git-ignored and overrides values in `.claude/settings.json`.

---

## Troubleshooting

- **Skill not triggering:** Check that `user-invocable: true` is in the SKILL.md frontmatter.
- **Agent not found:** Ensure the agent file is in `.claude/agents/` and has valid YAML frontmatter.
- **Settings not applied:** Check the settings hierarchy: CLI flags override settings.local.json, which overrides settings.json, which overrides global settings.
- **Hooks not running:** Verify the hook event name and matcher pattern in settings.json. Run `/doctor` for diagnostics.
