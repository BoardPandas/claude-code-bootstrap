# Codex configuration (generated)

Everything here, plus the root `AGENTS.md` and `.agents/skills/`, is generated from the Claude Code
configuration by `scripts/sync-codex.mjs`. Edit the Claude source, never these files, then run:

```bash
npm run sync:codex
npm run check:claude   # fails if any generated file is stale, missing, or unexpected
```

| Claude Code source | Codex output |
|---|---|
| `CLAUDE.md`, `.claude/rules/*.md`, permission deny rules | `AGENTS.md` |
| `.claude/skills/<name>/**` | `.agents/skills/<name>/**`; `agents/openai.yaml` for explicit-only skills |
| `.claude/agents/<name>.md` | `.codex/agents/<name>.toml` |
| `.claude/settings.json` hooks | `.codex/hooks.json` (runs `.claude/scripts/` in place) |

Current output: 18 skills, 8 agents, 6 hook handlers, AGENTS.md 21056 B.

## How the mapping works

- **Models.** Claude tiers map to Codex tiers: `opus` -> `gpt-6-sol`, `sonnet` -> `gpt-6-luna`, `haiku` -> `gpt-6-luna`. Update `MODEL_MAP` in the generator when Codex models change; an unmapped model is omitted so the agent inherits the session's.
- **Sandbox.** Agents whose Claude tool list cannot write or run commands get `sandbox_mode = "read-only"`. The rest inherit the session's sandbox; the generator never widens it.
- **Hooks.** Codex has no handler-level `if`, so every mirrored script must filter its own input (the commit hooks do, via `_git-commit-filter.sh`). Paths are anchored at the git root, with a cwd-relative `commandWindows` fallback.
- **Edit hooks.** Codex edits files with `apply_patch`, whose input is a patch in `tool_input.command`, not `tool_input.file_path`. An `Edit|Write` hook is mirrored only once its script mentions `apply_patch`.
- **Trust.** Codex loads `.codex/` only for trusted projects and runs each hook only after it is approved in `/hooks`. Re-approve after `hooks.json` changes.

## Not carried over

- PreToolUse [EnterPlanMode|ExitPlanMode]: bash "$CLAUDE_PROJECT_DIR"/.claude/scripts/pre-plan-kb-check.sh -- Codex has no hookable EnterPlanMode/ExitPlanMode tool.
- PreToolUse [Write|Edit]: bash "$CLAUDE_PROJECT_DIR"/.claude/scripts/pre-write-kb-check.sh -- Codex edits arrive as apply_patch, which this script does not parse.
- PostToolUse [Write|Edit]: bash "$CLAUDE_PROJECT_DIR"/.claude/scripts/post-edit-format.sh -- Codex edits arrive as apply_patch, which this script does not parse.
- Stop/Notification terminal bell -- replaced by [tui] notifications in .codex/config.toml.
