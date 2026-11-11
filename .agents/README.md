# Antigravity configuration (generated)

Everything under `.agents/` and the root `AGENTS.md` is generated from `CLAUDE.md` and `.claude/`
by `scripts/sync-codex.mjs`. Edit the Claude source, never these files, then run:

```bash
npm run sync:codex
npm run check:claude   # fails if any generated file is stale, missing, or unexpected
```

| Claude Code source | Antigravity output |
|---|---|
| `CLAUDE.md`, always-on rules, deny list | `AGENTS.md` (capped at 24000 B) |
| `.claude/skills/<name>/**` | `.agents/skills/<name>/**` (`SKILL.md` capped at 24000 B) |
| `.claude/agents/<name>.md` | `.agents/agents/<name>.md` |
| `.claude/rules/*.md` (with `paths:`) | `.agents/rules/*.md` (`trigger: glob`) |
| `.claude/settings.json` hooks | `.agents/hooks.json` via `.claude/scripts/_antigravity-hook.sh` |

Current output: 18 skills, 8 agents, 2 glob rules, 9 hook handlers, AGENTS.md 23005 B.

## How the Antigravity bridge works

- **Models.** Claude tiers map to Antigravity tiers: `opus` -> `pro`, `sonnet` -> `pro`, `haiku` -> `flash`.
- **Command sandbox.** Agents without `Bash` get `commandExecutionPolicy: "off"`; agents with `Bash` get `commandExecutionPolicy: sandbox`.
- **Hooks adapter (`_antigravity-hook.sh`).** Antigravity runs hooks with `.agents/` as cwd, sends camelCase JSON (`toolCall.args.CommandLine`, `TargetFile`, `Cwd`), and treats non-zero exits as fail-open errors. The adapter anchors at the git root, converts `exit 2` + stderr into `{"decision":"deny","reason":"..."}` (exit 0), emits `SessionStart` text as `systemMessage`, and queues `PreToolUse`/`PostToolUse` `additionalContext` per `conversationId` so `PreInvocation` injects it as `ephemeralMessage` on the next step.

## Not carried over to Antigravity

- PreToolUse [EnterPlanMode|ExitPlanMode]: bash "$CLAUDE_PROJECT_DIR"/.claude/scripts/pre-plan-kb-check.sh -- Antigravity has no hookable EnterPlanMode/ExitPlanMode tool.
- Stop/Notification terminal bell -- Antigravity hooks require JSON on stdout.
