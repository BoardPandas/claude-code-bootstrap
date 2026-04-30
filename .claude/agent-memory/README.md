# Agent Memory

This directory stores persistent, version-controlled knowledge that agents accumulate during work. Unlike conversation context (ephemeral) or CLAUDE.md (static rules), agent memory captures evolving patterns, decisions, and debugging insights.

## Files

| File | Purpose |
|------|---------|
| `patterns.md` | Recurring code patterns, conventions, and architectural choices observed in this project |
| `decisions.md` | Key technical decisions with rationale, so future sessions understand "why" without re-deriving |
| `debugging.md` | Failed approaches and dead ends, so agents avoid repeating them in new sessions |

## Conventions

- **Append, don't overwrite.** Add new entries at the top of each file.
- **Date each entry.** Use `## YYYY-MM-DD: Title` format.
- **Keep entries concise.** A few sentences per entry. Link to files or commits for detail.
- **Prune periodically.** Remove entries that are no longer relevant (e.g., patterns for deleted code).
- **Never store secrets.** No API keys, tokens, or credentials.

## How Agents Use This

Agents with `memory: project` in their frontmatter will read this directory on startup. Any agent can write here to share knowledge with future sessions.

**Curate explicitly.** Agents reliably maintain memory only when prompts say so directly: "Before starting, review your memory. After completing, update it." Passive accumulation degrades quality over time.

**Partition when files grow.** When any file approaches ~200 lines, split by topic into sibling files (e.g., `patterns-frontend.md`, `patterns-backend.md`) rather than letting it grow unbounded.

## Scopes

- **Project scope** (this directory): `.claude/agent-memory/` -- version-controlled, shared across the team.
- **User scope**: `~/.claude/agent-memory/<agent-name>/` -- personal, cross-project.
- **Local scope**: `.claude/agent-memory-local/<agent-name>/` -- personal, project-specific (git-ignored).
