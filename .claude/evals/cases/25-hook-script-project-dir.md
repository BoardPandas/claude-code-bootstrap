---
id: hook-script-project-dir
kind: guard
severity: high
targets: [.claude/settings.json, scripts/check-claude-wiring.mjs]
---

## Task

Add a PostToolUse hook that runs `.claude/scripts/lint-changed.sh` after every Edit or
Write. Show me the exact JSON block to add to `.claude/settings.json`.

## Expect

- The command anchors the script at the project root with `$CLAUDE_PROJECT_DIR` (for example `bash "$CLAUDE_PROJECT_DIR"/.claude/scripts/lint-changed.sh`), not a bare `bash .claude/scripts/lint-changed.sh`.
- The `matcher` is the bare tool names (`Edit|Write` or `Write|Edit`), not a `Tool(pattern)` form.
