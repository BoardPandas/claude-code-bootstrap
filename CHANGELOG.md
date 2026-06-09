# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.2.0] - 2026-06-09

### Added
- **Per-skill and per-agent `effort:` frontmatter.** All 15 skills and all 6 agents now pin an effort level matched to their workload: `low` for mechanical step-by-step skills (add-lesson, add-practice, mermaid-diagram), `medium` for analysis and guided-edit skills and the sonnet agents (reviewer, performance, explorer, ux-reviewer), and `high` for orchestration, planning, and high-stakes analysis (init-repo, plan-repo, update-practices, spec-developer, security-scan, architect, security). Lightweight skill invocations no longer inherit session-level effort they do not need.
- **`disable-model-invocation: true` on the `merge-worktrees` skill.** The skill force-deletes branches and worktrees, so it should never auto-trigger; it now runs only when explicitly invoked with `/merge-worktrees`.

### Changed
- **`doc-sync` allowed-tools now declares `Agent`** instead of the pre-rename `Task` tool, completing the cleanup that 0.1.2 applied to the other skills.
- **`agents.md` documents each agent's effort level** alongside its model.

## [0.1.2] - 2026-06-09

### Fixed
- **Commit hook scripts now self-filter on the actual command instead of trusting the `if` rule.** Discovered live after 0.1.1 made the hooks active: the `if: "Bash(git commit*)"` rule fires conservatively on commands containing opaque command substitutions (verified: a `gh api ... -f content="$(base64 ...)"` upload with no git commit in it was blocked by the changelog gate). All four hook scripts now read the hook input JSON and exit 0 unless the command actually contains a git commit invocation, treating `if` as an optimization rather than the guard. Both gotchas from this work were contributed to the LL-G knowledge base under the new `claude-code` technology.

## [0.1.1] - 2026-06-09

### Fixed
- **The git-commit hooks never fired.** All four commit hooks in `.claude/settings.json` used `"matcher": "Bash(git commit*)"`, but hook matchers only match tool names (verified against the official hooks reference and confirmed empirically: a `git commit` with nothing staged ran unblocked). Changed each group to `"matcher": "Bash"` with `"if": "Bash(git commit*)"` on every handler, the documented way to filter on tool arguments. The here-string guard, both changelog gates, and the post-commit knowledge-base prompt are now live.
- **The changelog staged-check no longer falsely blocks compound commands.** `check-changelog-staged.sh` runs before the command executes, so `git add CHANGELOG.md ... && git commit ...` was blocked because the changelog was not staged yet at hook time. The script now reads the hook input and allows any command that stages `CHANGELOG.md` itself.
- **`disable-model-invocation` was spelled with underscores and silently ignored.** The `mermaid-diagram` and `spec-developer` skills used `disable_model_invocation: true`, which Claude Code does not recognize, so both skills remained auto-invocable despite the manual-only intent. Corrected to the hyphenated key (both skills now disappear from the model-invocable list) and fixed the two `instructions.md` passages teaching the underscore spelling.
- **The pre-commit changelog reminder still described the retired 4-segment version scheme.** `pre-commit-changelog-reminder.sh` told Claude to bump `Major.Minor.Patch.Build` with "Build: every commit," contradicting the 3-segment SemVer rule adopted in 0.0.1. The hook text now matches `.claude/rules/commit-changelog.md`.
- **`.gitignore` no longer ignores `Cargo.lock`** (lockfiles should be committed), and the GOPATH-era `bin/` and `pkg/` entries plus the duplicate `build/` under Java/Kotlin were removed so projects' real `bin/`, `pkg/`, and `build/` directories are not silently excluded.

### Changed
- **`instructions.md` caught up with the template's current contents.** Added the `ux-review` and `merge-worktrees` skills, the `ux-reviewer` agent, and `references/ux-laws.md` to the folder structure and reference sections.
- **Skill `allowed-tools` lists now use the current `Agent` tool name.** `performance-review`, `security-scan`, `test-scaffold`, and `ux-review` still listed the pre-rename `Task` tool; all skills now consistently declare `Agent`.

## [0.1.0] - 2026-06-05

### Added
- **New `merge-worktrees` skill** (triggered by "merge worktrees"). Consolidates outstanding work into the repository's main branch and tears down the leftovers: it inventories every worktree and local branch, detects the real main branch (no `main` assumption), shows a plan and asks for confirmation, commits pending work in each worktree, merges every branch into main with `--no-ff`, pushes, then removes the worktrees and force-deletes the merged branches (locally and, with confirmation, on the remote). Merge conflicts and non-fast-forward pulls are hard stops, not auto-resolved, and nothing is deleted until the merge is committed and pushed. Registered in the CLAUDE.md skills index.

## [0.0.3] - 2026-06-05

### Removed
- **Deleted the completed `tasks/peaceful-whistling-dolphin.md` plan file.** The Learning Lessons / Gotchas (LL-G) system it described has been implemented, so the plan is no longer needed.

## [0.0.2] - 2026-06-03

### Fixed
- **`doc-sync` skill no longer assumes the docs folder is capital-D `Docs/`.** On Windows and macOS the filesystem is case-insensitive, so a pre-existing lowercase `docs/` folder satisfied the old hardcoded `Docs/` existence check while the skill kept writing to and citing `Docs/`, creating confusion (and a second, divergent folder on case-sensitive Linux/CI/git). The skill now resolves the docs root once, case-insensitively, preferring the casing git actually tracks (`git ls-files`), reuses that exact name for the whole run, and only defaults to `Docs/` when no docs folder exists.

## [0.0.1] - 2026-06-01

### Changed
- **Switched versioning from 4-segment `Major.Minor.Patch.Build` to 3-segment SemVer `Major.Minor.Patch` and reset the version to `0.0.1`.** Updated the scheme table and rules in `.claude/rules/commit-changelog.md` (the Build segment is removed; the Patch segment now also covers docs, refactors, config, and chores). Prior `1.x.x.x` entries below are retained as historical record.

### Fixed
- **Path-scoped rules were using Cursor's frontmatter dialect and silently not scoping.** `.claude/rules/llg-check.md`, `bp-check.md`, and `commit-changelog.md` used `globs:` and `alwaysApply:`, which are Cursor `.mdc` keys that Claude Code ignores (verified against the official memory docs). Because a rule with no recognized `paths:` field loads unconditionally, the LL-G and BP rules were loading on every file instead of only their intended code/config paths. Converted all three to the official `paths:` YAML-list frontmatter; `commit-changelog.md` now correctly loads unconditionally with no `paths` field.
- **The Stop and Notification bell hooks printed a literal `\a` instead of ringing.** `.claude/settings.json` used `echo '\a'`, which emits the two characters `\` and `a` in most shells. Switched both to `printf '\a'` so the terminal bell actually fires.
- **The shipped baseline `.claude/settings.json` had an empty `permissions.deny` list** despite the init-repo skill documenting a secrets deny-list as "always configure." Added the documented deny entries (`~/.ssh`, `~/.aws`, `~/.azure`, `~/.kube`, `~/.docker/config.json`, `~/.npmrc`, `~/.git-credentials`, `~/.config/gh`, and shell rc files) so every repo cloned from the template starts with secret-file protection.

### Added
- **`SessionStart` hook** wired in `.claude/settings.json` plus a new `.claude/scripts/session-start-kb-check.sh` that surfaces the RULE 1 (LL-G) / RULE 3 (BP) knowledge-base mandate once per session. Previously the KB check only fired on `EnterPlanMode`, so sessions that never entered plan mode got no nudge.
- **`.claude/settings.local.json.example`** showing common git-ignored personal overrides (`disableAllHooks`, `alwaysThinkingEnabled`, `language`), as the init-repo skill recommends.
- **Changelog gate escape hatches.** `check-changelog-staged.sh` and `pre-commit-changelog-reminder.sh` now exempt merge commits (when `MERGE_HEAD` exists) and honor `SKIP_CHANGELOG=1` for genuinely trivial commits, instead of hard-blocking every commit without a staged `CHANGELOG.md`.

### Changed
- **Documented hook event count corrected from 28 to 30.** Added `UserPromptExpansion` (fires when a slash command expands) and `PostToolBatch` (fires after a parallel tool batch resolves), both confirmed in the official hooks reference. Updated `CLAUDE.md`, the init-repo skill hook table, the update-practices skill list (and refreshed its version reference to v2.1.159), and `instructions.md`.
- **`instructions.md` hook descriptions corrected** to reflect the hooks the template actually ships (the git-commit PreToolUse chain, the EnterPlanMode KB check, the PostToolUse KB-contribute prompt, and the new SessionStart reminder) rather than the previous inaccurate "logs a notification" summary.

## [1.8.1.3] - 2026-06-01

### Changed
- Repointed the LL-G and BP knowledge-base references from the `wellforce-brandon` GitHub org to `BoardPandas` after both repos moved. Updated the RULE 1 / RULE 3 fetch URLs in `CLAUDE.md`, the `llg-check` and `bp-check` path-scoped rules, the `add-lesson`, `add-practice`, `apply-practice`, and `init-repo` skills (repo headers, raw URL bases, `gh api` paths, and WebFetch URLs), the `pre-plan-kb-check` and `post-commit-kb-contribute` hook scripts, and `instructions.md`

## [1.8.1.2] - 2026-05-29

### Added
- `MessageDisplay` hook event (introduced in Claude Code v2.1.152) documented in the init-repo skill hook table, the update-practices skill hook list, `CLAUDE.md`, and `instructions.md`. It fires as assistant message text is displayed, letting hooks transform or hide output (for example, redacting secrets). Hook event count moves from 27 to 28

### Changed
- Refreshed the Claude Code version reference in the update-practices skill from v2.1.144 to v2.1.156 (the latest at time of update, verified against the official changelog)

### Removed
- Dropped the phantom `code-review` skill from the documented skill inventory. No `.claude/skills/code-review/SKILL.md` ever existed; the name would shadow the built-in `/code-review` command that the repo already recommends, and the full-codebase-audit niche is covered by `security-scan`, `performance-review`, and `ux-review`. Removed its references from `CLAUDE.md`, `README.md`, `instructions.md` (file tree and skill section), and the update-practices skill checklist. Code review is still available via the `reviewer` agent and the built-in `/code-review` command

## [1.8.1.1] - 2026-05-29

### Changed
- Swapped locked infrastructure defaults in the plan-repo skill and supporting references: frontend hosting moves from Cloudflare Pages to Northflank containers (SPA static-served or SSR, decided per project from the chosen framework), email locks to Resend only (AWS SES dropped), and the CDN is now Cloudflare's orange-cloud proxy in front of the Northflank frontend, with Northflank's built-in Fastly CDN as a no-WAF fallback
- Added a "CDN Setup Notes (Locked)" section to `.claude/references/infrastructure.md` covering Full (Strict) TLS, the ACME-challenge vs Cloudflare-proxy ordering, SSR cache-rule requirements, and zero-cost edge-to-R2 egress
- Updated `.claude/references/tools.md` so `wrangler` is scoped to Cloudflare R2 and DNS/CDN (not Pages) and `northflank` covers frontend deploys as well as backend

## [1.8.1.0] - 2026-05-23

### Fixed
- The update-practices skill now diffs the actual text content of template skills/agents/rules instead of relying on file existence. A skill that was rewritten upstream (e.g. `add-lesson`) is now detected as `TEMPLATE-REWRITTEN` and its body is replaced wholesale with the canonical version (re-applying only genuinely project-specific bits), rather than the old merge-only strategy that silently kept the stale local copy

## [1.8.0.0] - 2026-05-19

### Added
- `reviewer` and `architect` agents now use `memory: project`, reading `.claude/agent-memory/` on startup so they review and plan against accumulated project patterns and decisions
- `worktree.bgIsolation` and `worktree.baseRef` settings documented in the init-repo skill, CLAUDE.md, and update-practices skill (new in Claude Code v2.1.144)
- Prompt-cache preservation guidance (lock the MCP/tool list and model at session start) in CLAUDE.md and instructions.md

### Changed
- Refreshed the hook event reference in the init-repo and update-practices skills to the full 27 events as of Claude Code v2.1.144 (was 18). Added the missing `StopFailure`, `PostCompact`, `PermissionDenied`, `TaskCreated`, `CwdChanged`, `FileChanged`, `Elicitation`, `ElicitationResult`, and `Setup` events
- Added the `mcp_tool` hook type and the conditional `if:` field to the init-repo skill's hook reference, matching the documentation already in CLAUDE.md and instructions.md
- Corrected the init-repo skill's "Recommended agent enhancements" guidance: `background` and `isolation: worktree` are no longer suggested for read-only analysis agents, and `memory: project` guidance now covers `reviewer` and `architect`

## [1.7.1.0] - 2026-05-19

### Fixed
- `add-lesson`, `add-practice`, and `apply-practice` skills no longer hang and time out. They depended on a GitHub MCP server (`mcp__github__*`) that is not configured; invoking those nonexistent tools caused an unresolved tool search to loop until the turn hit its time limit. All three now use the `gh` CLI instead -- `gh api` for reads and writes in add-lesson/add-practice, `WebFetch` on raw URLs for the read-only apply-practice

## [1.7.0.0] - 2026-05-19

### Added
- Pre-commit hook (`check-commit-herestring.sh`) that blocks `git commit` commands using PowerShell here-string syntax (`@'...'@`). In the Bash tool that is not a here-string, so the `@` characters leak into the commit message as a stray `@` line. The hook points to writing the message to a file and using `git commit -F` instead

## [1.6.0.1] - 2026-04-29

### Added
- Documented `mcp_tool` hook type and the conditional `if:` filter syntax for hooks (CLAUDE.md, instructions.md)
- Documented `xhigh` effort tier and `keep-coding-instructions` skill frontmatter field (CLAUDE.md, instructions.md)
- Agent-memory README guidance on explicit memory curation framing and topic partitioning when files grow
- `Cost / token efficiency` audit section in the update-practices skill (effort tuning, model routing, cache preservation, input-format swaps, subagent delegation)
- ProductCompass "stop hitting Claude Code limits" entry to the source URL registry

## [1.6.0.0] - 2026-04-16

### Changed
- Rewrote `doc-sync` skill into a TOC-driven documentation builder that produces a categorized `Docs/` wiki (core, api, features, operations, etc.), modeled on the supportforge platform docs layout but with stable PAGE_ID and AUTOGEN markers for safe incremental updates
- `doc-sync` now operates in three modes: `init` (full generation), `update` (incremental git-diff regeneration), and `audit` (legacy report-only)

### Added
- `Docs/_toc.yaml` schema as the single source of truth for pages, sections, source-file mappings, and diagram requirements
- Reference files: `page-template.md`, `citation-policy.md`, `mermaid-policy.md`, `toc-schema.md`, `doc-categories.md`, `incremental-update.md`, `readme-template.md`
- Page templates: `overview.md`, `architecture.md`, `api-reference.md`, `feature.md`, `database-schema.md`, `module.md`, `data-flow.md`, `runbook.md`, `getting-started.md`, `configuration.md`, `glossary.md`, `_toc.yaml.template`
- Evidence-based citation rules with line numbers and parenthesized inline format
- Mermaid diagram policy (graph TD only, quoted node labels, no shorthand activation) and a 3-attempt repair budget
- AUTOGEN marker contract for safe regeneration that preserves manual notes
- `Docs/_meta/GENERATION.md` and `Docs/_meta/SUMMARY.md` outputs for generation metadata and coverage reporting

## [1.5.0.0] - 2026-04-14

### Added
- UX Review skill (`/ux-review`) for reviewing UI code against Laws of UX and Gestalt principles
- UX Reviewer agent (`ux-reviewer`) with severity-ranked finding output format
- UX Laws reference doc (`.claude/references/ux-laws.md`) covering all 30 laws from lawsofux.com with code-level indicators

## [1.4.0.0] - 2026-03-25

### Added
- Bootstrap template sync step in update-practices skill (Step 2b) to pull new/updated files from upstream template repo
- Bootstrap Template source URLs for GitHub API tree and raw content access
- Template sync report section in update-practices output summary

## [1.3.0.0] - 2026-03-24

### Added
- Add Practice skill wired to `wellforce-brandon/BP` via GitHub API
- Apply Practice skill wired to `wellforce-brandon/BP` via GitHub API
- Pre-plan hook to check LL-G and BP knowledge bases before creating plans
- Post-commit hook to evaluate if work should be contributed back to LL-G or BP
- Pre-commit changelog reminder hook with condensed update instructions

### Changed
- Commit-changelog rule set to `alwaysApply: true` so version bump instructions are always in context
- Pre-commit changelog enforcement hook status message clarified
