# Project Rules

This repository is a Claude Code starter template. It provides a ready-to-use `.claude/` configuration folder that can be cloned for new projects or copied into existing ones.

## Commands

```bash
npm run check:claude   # wiring guard: rule scoping, hook matchers, frontmatter, context budgets, Codex drift
npm run sync:codex     # regenerate AGENTS.md, .agents/skills/, .codex/ after any CLAUDE.md or .claude/ change
npm test               # asserts every guard check still fires, plus the commit gate's refusal paths
npm run evals          # behavioural evals for skills, agents, hooks (needs the claude CLI)
npm run evals -- --validate   # structure-only eval check, no API calls
```

## Verifying your work

A change to this repo is **not done** until both of these are green:

```bash
npm run check:claude
npm test
```

Healthy output ends with:

```
OK -- .claude wiring verified.
```

and, from `npm test`, `# fail 0`. Never skip, delete, or narrow a failing check to make it
pass — the checks exist because these defects are otherwise silent. If a check is genuinely
wrong, change it deliberately and say so in the changelog.

Changes touching `CLAUDE.md`, `.claude/skills/**`, `.claude/agents/**`, `.claude/scripts/**`,
or `.claude/settings.json` must also pass `npm run evals` before merging. See
`.claude/evals/README.md`.

## Workflow: Plan First, Then Init

1. Run **`/plan-repo`** to choose stack, generate README, create design guardrails.
2. Say **"initialize repo"** to configure Claude Code using the plan.
3. Say **"update practices"** periodically to stay current.

Skills marked `/command` in the table below set `disable-model-invocation: true`, so a plain-English phrase will not start them -- type the slash command.

## Artifact Chain

Each stage commits an artifact the next stage reads. One artifact, one owner, one approval.

| Artifact | Location | Produced by | Approved by |
|---|---|---|---|
| `intent.md` | `intent/<slug>/intent.md` | `/capture-intent` | Product owner |
| `spec.md` | `intent/<slug>/spec.md` | `/spec-developer` | Product owner |
| `plan.md` | `tasks/<slug>-plan.md` | plan mode / `/spec-developer` | Engineer |
| diff | git branch | `builder` / session | Code owner, per `REVIEW.md` |
| lesson | LL-G / BP | `/add-lesson`, `/add-practice` | Author + KB review |

Intent captures the problem in the originator's own words and needs no engineering
knowledge. Spec turns it into requirements and design with policy already applied. Plan is
the implementation order. Never skip straight to a diff for work larger than a single file.

## Review Policy

`REVIEW.md` at the repo root defines what review covers, what "Important" means here, the
nit cap, and what must never be reported. Read it before reviewing anything, and before
acting on review feedback. It is version-controlled policy, not a suggestion.

## Coding Standards

- Handle errors explicitly -- never swallow exceptions silently.
- Validate inputs at system boundaries (user input, API responses, file I/O).
- Avoid premature abstraction. Three similar lines are better than a forced helper.
- Do not add comments for self-explanatory code. Add comments only when the "why" is non-obvious.
- Files over 500 lines should be split. Large files consume excessive context.

## Things Claude Gets Wrong

Corrections that have been needed twice. Add to this list when a mistake repeats; move the
generalisable version to LL-G via `/add-lesson`.

- **Folding the changelog edit into the commit command.** The gate is a `PreToolUse` hook, so it runs *before* the command. `edit && git commit` cannot satisfy it. Stage first, commit second.
- **Writing `Tool(pattern)` as a hook `matcher:`.** That is permissions syntax; in a matcher it matches nothing and the hook silently never runs. Use `matcher: "Bash"` plus `if: "Bash(git *)"` on the handler.
- **Reaching for `$CLAUDE_FILE_PATH` in a hook.** It does not exist, expands to `""`, and an empty path argument makes most tools walk the entire repo. Parse `tool_input.file_path` from stdin and hard-guard on non-empty.
- **Selecting a JSON parser with `command -v python3`.** On Windows that finds the WindowsApps stub: the lookup succeeds, every field comes back empty, and the hook quietly does nothing. Probe by running a candidate against a known payload.
- **Adding a `paths:` glob that matches nothing.** A rule scoped to a path that does not exist never fires and says nothing. `npm run check:claude` fails on it; record deliberate exceptions in `wiring-exemptions.json`.
- **Using Cursor's `globs:` / `alwaysApply:` in a rule.** Claude Code reads neither. The rule then loads in *every* session — the inverse of the intent.
- **Assuming a worktree agent sees uncommitted work.** It branches from a commit, so it reads stale files, finds them already consistent, and reports success. Orient with `git status --short` first.
- **Budgeting context by line count.** A line budget keeps passing while single lines grow to thousands of characters. Budget by bytes.

## Hierarchical CLAUDE.md Architecture

CLAUDE.md files load top-down: root user level, then project level, then subfolder level. Only relevant files load -- a frontend task never loads the backend CLAUDE.md.

- Root `CLAUDE.md` — Project-wide rules, stack, global conventions (this file).
- Subfolder `CLAUDE.md` — Only when a subfolder has distinct conventions.
- `.claude/rules/*.md` — Conditional instructions with `paths:` frontmatter. `paths:` is the only scoping key Claude Code reads, and a rule with no `paths:` loads in **every** session.
- Nested `.claude/` directories are first-class: `subdir/.claude/skills|agents|workflows/` load automatically; the closest one wins on name collision (disambiguated as `<dir>:<name>`).
- Keep each file focused. Prune after every model update -- remove what the model handles natively.
- Do NOT bloat CLAUDE.md with generic advice the model already knows.

## Subagent Usage

Always and aggressively offload to subagents: online research, doc fetching, log analysis, codebase exploration. This keeps the main context narrow.

- **Always include a "why"** in every subagent prompt. "How auth works for rate limiting because we're improving rate limiting" beats "how auth works."
- **Parallel exploration:** When torn between approaches, spin up parallel Explore subagents for each, pass results back, let the main session decide.
- **Subagents are resumable**, run in the background by default, and can nest up to 5 levels deep.

## Frontmatter

The full catalog of skill and agent frontmatter fields lives in `instructions.md` (Skill Frontmatter, Adding New Agents). Two rules are enforced, not advisory:

- **Every skill must resolve to a model:** declare `model:` directly, **or** bind `agent:` and inherit that agent's. Doing neither leaves the skill on whatever the session happens to be using; `npm run check:claude` fails on it.
- **All frontmatter keys are hyphenated.** The underscored form (`disable_model_invocation`, `allowed_tools`) is silently ignored.

## Infrastructure Profiles

Anything server-side deploys onto one of two profiles, picked whole rather than mixed:
**Cloudflare** or **Railway**. Fixed on both: Cloudflare R2, Resend, Better Auth. Plan-repo
researches the two and recommends one; a local-only desktop project gets neither. Full
profile definitions in `.claude/references/infrastructure.md` -- read it, do not edit it.

## File Organization

- Keep the `.claude/` folder self-contained. No absolute paths, no references outside the repo except CLAUDE.md, AGENTS.md, README.md, REVIEW.md, and instructions.md.
- Skills live in `.claude/skills/<skill-name>/SKILL.md`; agents in `.claude/agents/<agent-name>.md`.
- Hook scripts live in `.claude/scripts/*.sh`. settings.json calls them by relative path, so the scripts folder must travel with settings.json.
- Path-scoped rules live in `.claude/rules/*.md` (conditional on `paths:` frontmatter).
- Agent memory lives in `.claude/agent-memory/` (version-controlled, team-shared).
- Evals live in `.claude/evals/` (`cases/*.md` corpus + `README.md`); the runner is `scripts/run-evals.mjs`.
- Intent and spec artifacts live in `intent/<slug>/`; plans in `tasks/`.
- Source URLs for best-practice fetches live in `.claude/references/source-urls.md`.
- Template sync state lives in `.claude/references/template-sync-state.json`, deliberate removals in `template-sync-ignore.md`.
- Codex reads a generated mirror: `AGENTS.md`, `.agents/skills/`, `.codex/`, built by `scripts/sync-codex.mjs`. Never hand-edit it; `.codex/README.md` has the mapping.
- The wiring guard is `scripts/check-claude-wiring.mjs`. Every check is an error -- there is no warning tier, because an advisory check is read once and never again. Intentionally-dead globs are recorded with a reason in `.claude/references/wiring-exemptions.json`; a stale exemption fails the guard. `npm test` asserts each check still fires.
- Infrastructure profiles: `.claude/references/infrastructure.md`. CLI tools: `.claude/references/tools.md`. Design guardrails (UI projects, generated by plan-repo): `.claude/references/design-guardrails.md`.
- Project settings go in `.claude/settings.json`. Personal overrides go in `.claude/settings.local.json` (git-ignored). Org-mandated policy goes in managed settings -- see `.claude/references/managed-settings.example.json`.

## Hooks and Settings

**Read `.claude/references/hooks-and-settings.md` before editing hooks or settings.** It is the canonical catalog: all 30 hook events, every optional settings key, and the gotchas. Do not work from memory -- several keys are silently ignored when misspelled. Hook types: `command`, `http`, `prompt`, `agent`, `mcp_tool`. The `matcher:` gotcha is in "Things Claude Gets Wrong" above.

## Planning

- Planning is **phase-based**, not timeline-based. Phases: Foundation, Core, Polish, Ship.
- Always plan in one session, execute in another. Clear context between planning and implementation.
- Save every plan to `tasks/`. This lets you selectively undo a feature later.
- For big features, use the **spec-developer** skill.
- Every plan MUST end with a **Lessons Learned / Gotchas** section. After implementation, route discoveries to LL-G via `/add-lesson` -- not to local debugging.md files -- and add a regression case to `.claude/evals/cases/` when the lesson concerns this configuration.

## Context Management

- Keep this file under 16 KB and all always-on context under 20 KB (`wc -c`). Budget by bytes, not lines. `npm run check:claude` fails the build on either ceiling; raise the constants deliberately rather than drifting into them.
- Break tasks small enough to complete in under 50% context usage.
- Use `/compact` proactively around 50% context.
- Start fresh conversations for unrelated topics.
- Begin complex tasks in plan mode before implementation.
- **Preserve the prompt cache:** Lock the MCP/tool list and model at session start. Adding tools or switching models mid-session invalidates the cached prefix and inflates cost.
- **Code bias fix:** If stuck in bad patterns, build the feature in isolation in a fresh folder, then port it in.
- **Document failed attempts:** Write failed fixes to `.claude/agent-memory/debugging.md` before starting new sessions.
- **Handoff docs:** Use `/handoff` to create a summary before ending a session.

## Date Awareness

Best practices must reflect the current date. Always check the current date -- do not assume. When fetching best practices, verify versions and recommendations are current as of today.

## Available Skills and Agents

Skills are auto-discovered from `.claude/skills/`; their own `description:` fields are what
trigger them, so they are not re-listed here. The full tables live in `README.md` and
`instructions.md`, and the agent registry in
`.claude/references/agent-registry.md`.

Two things the descriptions do not tell you:

- These set `disable-model-invocation: true` and start **only** by slash command:
  `/capture-intent`, `/plan-repo`, `/spec-developer`, `/mermaid-diagram`, `/merge-worktrees`,
  `/triage-issues`. A plain-English phrase will not start them.
- The pipeline order is `/capture-intent` → `/plan-repo` → "initialize repo" →
  `/spec-developer` → build → "update practices".

## Workflow

1. Use the source URL registry at `.claude/references/source-urls.md` when fetching best practices -- never hardcode URLs in skills.
2. Check `.claude/references/tools.md` for available CLI tools before running commands. Offer to install missing tools.

## RULE 0: Read-Only First (MANDATORY)

**Gather information before taking action. Read-only commands first. Modifications only with user approval.**

- Always safe: diagnostics and read-only operations (`Get-*`, `Test-*`, queries, list/read API calls).
- Requires user approval: state-changing commands (`Set-*`, `Remove-*`, `Stop-*`, writes to shared systems).
- Never without explicit request: destructive operations (recursive deletions, credential resets, formatting).

Production systems (M365 tenants, shared infrastructure) face hard-to-reverse damage from accidental modifications. Validate intent before any state change. (From BP `safety/read-only-first-rule`.)

## RULE 1 -- Check LL-G Before Scripting (MANDATORY)

**At the start of any session involving scripting, API calls, or automation -- before writing a single line -- fetch `https://raw.githubusercontent.com/BoardPandas/LL-G/main/llms.txt`, then `kb/<tech>/llms.txt` for each technology you will use. Read ALL HIGH-severity entries, plus any MEDIUM entry matching your task.**

Technologies currently in LL-G: **claude-code**, PowerShell, Graph API, NinjaOne, Next.js, Tailwind CSS, TypeScript, Godot/GDScript, Better Auth, Bash.

Work touching `.claude/` itself loads `kb/claude-code/` -- it documents this configuration's silent-failure modes (dead hook matchers, ignored frontmatter keys, blocking hooks with no stderr).

This applies to every session, every technician, every developer. Not optional. Full procedure in `.claude/rules/llg-check.md`.

### Contributing back

After implementation, route new discoveries to LL-G, not to local agent-memory alone: run `/add-lesson` (uses the GitHub API, no clone needed). Lessons stored locally stay local.

## RULE 3 -- Check BP Before Starting New Work

**When onboarding a repo, starting a new feature, or setting up tooling -- fetch `https://raw.githubusercontent.com/BoardPandas/BP/main/llms.txt`, then `practices/<concern>/llms.txt` for each relevant concern. Load ALL FOUNDATIONAL entries, plus RECOMMENDED entries whose tech tags match this project.**

BP is the complement to LL-G: where LL-G tracks what NOT to do, BP tracks what TO do. Use `/add-dir C:\Github\BP` to bring BP into context locally. Full procedure in `.claude/rules/bp-check.md`.
