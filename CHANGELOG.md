# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

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
