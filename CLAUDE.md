# Project Rules

This repository is a Claude Code starter template. It provides a ready-to-use `.claude/` configuration folder that can be cloned for new projects or copied into existing ones.

## Coding Standards

- Write clear, concise code. Prefer readability over cleverness.
- Use descriptive names for variables, functions, and files.
- Keep functions small and focused on a single responsibility.
- Handle errors explicitly -- never swallow exceptions silently.
- Validate inputs at system boundaries (user input, API responses, file I/O).
- Avoid premature abstraction. Three similar lines are better than a forced helper.
- Do not add comments for self-explanatory code. Add comments only when the "why" is non-obvious.

## File Organization

- Keep the `.claude/` folder self-contained. No absolute paths, no references outside the repo except CLAUDE.md, agents.md, and README.md.
- Skills live in `.claude/skills/<skill-name>/SKILL.md`.
- Agents live in `.claude/agents/<agent-name>.md`.
- Source URLs for fetching best practices live in `.claude/references/source-urls.md`.
- Project settings go in `.claude/settings.json` (version-controlled). Personal overrides go in `.claude/settings.local.json` (git-ignored).

## Testing

- Write tests before implementation when practical.
- Verify tests fail before writing the implementation.
- Run tests after every change. Do not commit code that breaks existing tests.
- Prefer integration tests for behavior, unit tests for logic.

## Commit Messages

- Use imperative mood: "Add feature" not "Added feature" or "Adds feature".
- First line under 72 characters.
- Reference issue numbers when applicable.
- One logical change per commit.

## Context Management

- Keep this file under 150 lines for reliable adherence.
- Break tasks small enough to complete in under 50% context usage.
- Use `/compact` proactively around 50% context.
- Start fresh conversations for unrelated topics.
- Begin complex tasks in plan mode before implementation.

## Available Skills

The following skills are available via slash command or natural language trigger:

| Skill | Trigger | Purpose |
|-------|---------|---------|
| init-repo | "initialize repo" | Build or rebuild the .claude/ folder with best practices |
| update-practices | "update practices" | Fetch latest best practices and update config |
| code-review | "code review" | Full codebase review with severity levels |
| security-scan | "security scan" | OWASP-style security audit |
| performance-review | "performance review" | Performance analysis with fix recommendations |
| dependency-audit | "dependency audit" | Check dependencies for updates and vulnerabilities |
| test-scaffold | "scaffold tests" | Generate test files for untested modules |
| doc-sync | "sync docs" | Align documentation with current code |

## Available Agents

See `agents.md` in the repo root for the full agent registry. Key agents:

- **architect** -- high-level planning, tech stack decisions, file structure design
- **reviewer** -- code review focused on correctness and maintainability
- **security** -- security-focused analysis and vulnerability detection
- **performance** -- performance-focused analysis and optimization

## Workflow

1. Read existing code before proposing changes.
2. Prefer editing existing files over creating new ones.
3. Do not over-engineer. Only make changes that are directly requested or clearly necessary.
4. Use the source URL registry at `.claude/references/source-urls.md` when fetching best practices -- never hardcode URLs in skills.
