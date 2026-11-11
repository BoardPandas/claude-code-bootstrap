# Antigravity Compatibility & Mirror Generation

User-approved scope: make Google Antigravity (`agy` / T3 Code Antigravity harness) a first-class generated target alongside Claude Code and Codex from the single canonical `.claude/` configuration, without standalone Gemini CLI files.

## Foundation
- Trim `.claude/skills/{init-repo,plan-repo,update-practices}/SKILL.md` below Antigravity's 24,000-byte skill ceiling by moving static templates and reference tables into each skill's `references/` folder.
- Wire `REVIEW.md` into `.claude/agents/reviewer.md` (`[IMPORTANT|NIT]` + 3-nit cap) and `.claude/skills/repo-review/SKILL.md` so review policy matches `scripts/check-claude-wiring.mjs` check 10.
- Lower `AGENTS.md` ceiling to 24,000 bytes so neither Codex (32 KiB) nor Antigravity (24,000 B) truncates always-on rules at the tail.

## Core
- Add `.claude/scripts/_antigravity-hook.sh` pure-bash adapter translating Antigravity's camelCase payloads (`toolCall.args.CommandLine`, `TargetFile`, `Cwd`, `conversationId`) and exit-0 JSON contract (`decision: "allow"|"deny"`, `SessionStart` `systemMessage`, and per-conversation `PreInvocation` `ephemeralMessage` queue for advisory `PreToolUse`/`PostToolUse` context) around existing `.claude/scripts/*.sh`.
- Split Antigravity emission into `scripts/sync-antigravity.mjs` imported by `scripts/sync-codex.mjs` (keeping both modules under 500 lines) to generate `.agents/agents/*.md`, `.agents/rules/*.md` (`trigger: glob`), `.agents/hooks.json`, `.agents/README.md`, explicit-only skill description guards, and a unified Codex + Antigravity runtime section in `AGENTS.md`.

## Polish
- Update `CLAUDE.md`, `README.md`, `instructions.md`, and `package.json` (`sync:agents` / `check:agents` aliases alongside `sync:codex` / `check:codex`) while keeping `CLAUDE.md` under 16 KiB and always-on context under 20 KiB.
- Expand `scripts/sync-codex.test.mjs` and add `scripts/antigravity-hooks.test.mjs` covering hook translation, `exit 2` -> `decision: "deny"`, advisory queueing into `PreInvocation`, formatter `PostToolUse`, 24 KB ceilings, and drift detection.

## Ship
- Regenerate mirrors via `npm run sync:codex` and verify `npm run check:claude`, `npm run check:eol`, `bash -n .claude/scripts/*.sh`, `npm test`, `agy agents`, and `agy plugin validate --strict`.

## Lessons Learned / Gotchas
- `antigravity-cli/antigravity-hooks-invocationnum-restarts-each-turn-posttooluse-never-fires`: `SessionStart` `ephemeralMessage` lasts only one model call (use `systemMessage`), `invocationNum` resets per user turn, and `PreToolUse`/`PostToolUse` cannot inject context directly — queue advisory context by `conversationId` and flush on `PreInvocation`.
- Antigravity executes hooks with `.agents/` as `cwd` and treats any non-zero hook exit code (including `exit 2`) as a fail-open error; hooks must anchor paths via `git rev-parse --show-toplevel`, resolve payload `cwd` cleanly, and always exit `0` with single-object JSON on stdout.
- `bash/command-v-finds-nonexecuting-stub`: never select `python3`/`node` via bare `command -v`; source `_json-parser.sh` and `_hook-context.sh`.
- Antigravity truncates `AGENTS.md` and warns on `SKILL.md` files above 24,000 bytes, and requires `trigger:` frontmatter on every `.agents/rules/*.md` file.
- `agy plugin validate --strict` (v1.5.5) expects `hooks.json` at the plugin/`.agents/` root (not `hooks/hooks.json`), and accepts `.agents/README.md` plus `.agents/skills/*/agents/openai.yaml` with zero warnings.
- Relative `toolCall.args.Cwd` values (e.g. `"."`) in Antigravity hook payloads must be resolved against `REPO_ROOT`, not `$PWD` (`.agents/`), and `conversationId` queue filenames should strip `.` (`tr -cd 'A-Za-z0-9_-'`) so `..` never appears in filenames.
