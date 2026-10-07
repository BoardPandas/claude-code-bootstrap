# Claude Code Starter Template -- Instructions

## What This Template Is

This repository provides a pre-configured `.claude/` folder that gives Claude Code a set of skills, agents, and settings aligned with current best practices. It works in two modes:

1. **Clone for new projects** -- Start a new repo with Claude Code already configured.
2. **Copy into existing projects** -- Drop the `.claude/` folder (plus CLAUDE.md) into any existing repo to add Claude Code capabilities. Add `scripts/sync-codex.mjs` and run `npm run sync:codex` to give Codex the same configuration.

## Folder Structure

```
.claude/
  agents/                  # Custom agent definitions
    architect.md           # Phase-based planning and system design
    reviewer.md            # Code review agent
    security.md            # Security analysis agent
    performance.md         # Performance analysis agent
    explorer.md            # Codebase exploration and research agent
    ux-reviewer.md         # UX review against Laws of UX and Gestalt principles
    builder.md             # Implementation engineer for parallel team work
    tester.md              # Test runner and failure analyst
  agent-memory/            # Persistent cross-session knowledge
    README.md              # Conventions and usage guide
    patterns.md            # Recurring patterns and conventions
    decisions.md           # Technical decisions with rationale
    debugging.md           # Failed approaches and dead ends
    builder/               # Per-agent memory (MEMORY.md + topic files)
  rules/                   # Conditional instructions (paths: frontmatter)
    llg-check.md           # LL-G knowledge base check before code changes
    bp-check.md            # BP best practices check before config changes
    commit-changelog.md    # Changelog and version bump enforcement
  scripts/                 # Hook scripts
  skills/                  # Executable skill definitions
    capture-intent/SKILL.md   # Capture an idea as intent.md (stage 1)
    plan-repo/SKILL.md     # Pre-init project planning
    init-repo/SKILL.md     # Repository initialization
    update-practices/SKILL.md  # Best practice updates
    spec-developer/SKILL.md   # Intent -> spec.md + plan.md
    security-scan/SKILL.md # Security scanning
    repo-review/SKILL.md   # General code health review
    performance-review/SKILL.md  # Performance analysis
    dependency-audit/SKILL.md    # Dependency checking
    test-scaffold/SKILL.md      # Test generation
    doc-sync/SKILL.md           # Documentation sync
    mermaid-diagram/SKILL.md    # Diagram generation
    add-lesson/SKILL.md         # Add gotcha to LL-G knowledge base
    add-practice/SKILL.md       # Add best practice to BP knowledge base
    apply-practice/SKILL.md     # Apply BP practice to a target repo
    ux-review/SKILL.md          # UX review against Laws of UX
    merge-worktrees/SKILL.md    # Merge worktrees/branches into main, clean up
    triage-issues/SKILL.md      # Fix open GitHub issues via builder subagents
  references/
    source-urls.md         # URL registry for fetching best practices
    infrastructure.md      # Cloudflare and Railway profiles (do not modify)
    tools.md               # CLI tools reference (auto-populated per stack)
    ux-laws.md             # Laws of UX / Gestalt reference for ux-review
    hooks-and-settings.md  # Canonical hook/settings catalog
    managed-settings.example.json  # Org-policy tier example (deployed via MDM, not read from .claude/)
    design-guardrails.md   # UI/design SLA (generated for frontend projects)
    template-sync-ignore.md    # Template files this project deliberately removed (update-practices skips them)
    template-sync-state.json   # Last-synced template commit + dead-URL strikes (written by update-practices)
  settings.json            # Project-level Claude Code settings
  settings.local.json.example  # Template for personal (git-ignored) overrides
CLAUDE.md                  # Master project rules for Claude Code
REVIEW.md                  # Review policy: passes, severity bar, nit cap, exclusions
AGENTS.md                  # GENERATED Codex instructions (from CLAUDE.md + .claude/rules)
instructions.md            # This file
README.md                  # GitHub-facing README
.agents/skills/            # GENERATED Codex copies of .claude/skills
.codex/                    # GENERATED Codex agents, hooks, config (see .codex/README.md)
scripts/
  check-claude-wiring.mjs  # Wiring guard (npm run check:claude)
  sync-codex.mjs           # Codex mirror generator (npm run sync:codex; --check runs in check:claude)
  *.test.mjs               # Self-tests asserting each check still fires
intent/<slug>/             # intent.md + spec.md (created on first use)
tasks/                     # Saved plans (created on first use)
```

---

## Core Workflow

### 1. Plan → Init → Build → Update

```
plan repo  →  initialize repo  →  build features  →  update practices
```

- **plan-repo** plans the stack, generates README, creates design guardrails and tools reference.
- **init-repo** reads the plan and configures everything.
- **spec-developer** plans individual features.
- **update-practices** keeps the config current.

### 2. Plan in One Session, Execute in Another

For any non-trivial work: plan in one session, then start a fresh session to execute. This keeps context clean and prevents contamination from planning artifacts.

### 3. Phase-Based Planning (Not Timeline-Based)

All planning uses phases, never dates or time estimates:

| Phase | Focus | Exit Criteria |
|-------|-------|---------------|
| Foundation | Project setup, core architecture, tooling | Builds, tests run, deploys |
| Core | Primary features, data models, integrations | All primary flows work E2E |
| Polish | Error handling, edge cases, accessibility | 80%+ coverage, no critical bugs |
| Ship | Deployment, monitoring, documentation | Production-ready |

### 4. The Artifact Chain

Each stage commits an artifact the next stage reads. One artifact, one owner, one approval.

```
/capture-intent → intent.md → [product owner approves] → /spec-developer → spec.md + plan.md → diff
```

| Artifact | Location | Answers | Owner | Approved by |
|---|---|---|---|---|
| `intent.md` | `intent/<slug>/` | Why | Originator | Product owner |
| `spec.md` | `intent/<slug>/` | What | Product owner | Product owner |
| `plan.md` | `tasks/` | How | Engineer | Engineer |
| diff | git branch | The change | Author | Code owner, per `REVIEW.md` |

Why the split matters:

- **Intent before spec** gives a non-engineer a way to put a problem into the system without
  knowing how anything works, and gives the organisation a cheap place to say no.
- **Spec separate from plan** lets a product owner approve *what* is built without being
  asked to approve *how*, and makes "did the diff match the plan?" an answerable question.
- **Open questions stay open.** A question answered with a plausible guess becomes a
  fabricated constraint that nobody re-checks.

Work larger than a single file should not skip straight to a diff.

---

## Review Policy (`REVIEW.md`)

`REVIEW.md` at the repo root is version-controlled review policy, read by the `reviewer`
agent, `/repo-review`, `/code-review`, and human reviewers alike. Four sections are
required and checked by `npm run check:claude`:

| Section | Answers |
|---|---|
| `## Passes` | What review covers, in order |
| `## What "Important" means here` | The bar for blocking a merge |
| `## Cap the nits` | How many style notes are allowed (default: three) |
| `## Do not report` | What must never appear in a review |

The severity bar is deliberately narrow. **Important** means exactly one of: the code is
wrong, it fails silently, or it is a security/data-loss risk. Everything else is a nit,
however strongly the reviewer feels. Every Important finding must carry a concrete failure
scenario; if one cannot be written, it is not Important.

The nit cap is a correctness measure, not a politeness measure — reviews that bury two real
defects under twenty style notes get skimmed, and the defects ship.

Tune it monthly against what actually shipped broken: passes that never caught a real
defect come out, and defect classes that reached main become a pass or a guard check.

---

## Skills Reference

### plan-repo

- **Trigger:** "plan repo", "plan project", "plan stack", "recommend stack"
- **What it does:** Interviews you about the project requirements (what it does, how it is delivered -- web, desktop, or both -- scale, constraints) -- but does NOT ask you to pick a stack or a hosting platform. Instead, it spins up research subagents in waves to compare current options (Cloudflare vs Railway, Go vs Rust vs TS, Tauri vs Electron vs Flutter, shadcn vs MUI vs Mantine, Drizzle vs Prisma, etc.) as of today's date, then recommends the best stack for your specific project with trade-offs. You approve or override, then it generates README, design guardrails, and tools reference.
- **When to use:** Before init-repo on new projects, or when evaluating a stack change.
- **Output:** Infrastructure profile decision (or "local-only, no infrastructure"), stack recommendation with trade-offs, plan file (`tasks/plan-repo.md`), README draft, design guardrails (if UI), tools reference.
- **Key concept:** It recommends, you decide. Every recommendation is backed by current research, not cached opinions.

### init-repo

- **Trigger:** "initialize repo", "init repo", "set up claude code"
- **What it does:** Reads the plan (if available), detects the stack, fetches best practices, and builds or updates all configuration files. Generates hierarchical CLAUDE.md files and stack-specific design guardrails. Non-destructive merge with existing config.
- **When to use:** After plan-repo, after copying `.claude/` into an existing project, or to rebuild from scratch.
- **Changelog reset:** A project cloned from this template inherits the template's `CHANGELOG.md` and version. Init detects that inherited history and resets it to a clean `0.0.1` baseline. A changelog holding your project's own entries is classified as project-owned and left untouched, so re-running init never wipes real release history.
- **Output:** Summary of all files created or modified.

### update-practices

- **Trigger:** "update practices", "refresh best practices", "update claude config"
- **What it does:** Checks today's date, fetches all sources, compares against current config, implements changes. Prunes CLAUDE.md files of stale advice. Updates tools.md and design guardrails.
- **When to use:** Periodically or after Claude Code updates.
- **Safe to repeat:** Running it twice in a row produces no changes the second time.

### capture-intent

- **Trigger:** `/capture-intent` (slash only)
- **What it does:** Interviews the originator about the *problem*, never the solution, and writes `intent/<slug>/intent.md`: problem, proposed outcome, affected users and systems, constraints, out of scope, open questions.
- **When to use:** Whenever someone has a need but not a solution. It is the first artifact in the chain and requires no engineering knowledge.
- **Key concept:** An intent carries no technology choices, no file structure, no estimates. Unanswered questions stay recorded as unanswered rather than filled with plausible guesses.
- **Gate:** The intent is `Status: Draft` until a product owner approves it. `/spec-developer` refuses a draft unless explicitly overridden -- that gap is the cheapest place to decide an idea is not worth pursuing.

### spec-developer

- **Trigger:** `/spec-developer <path to intent.md, or a feature description>` (slash only)
- **What it does:** Explores the codebase with parallel subagents, loads the project's policy references (design guardrails, UX laws, infrastructure profile, `REVIEW.md`, recorded decisions), asks scoped clarifying questions, then produces two artifacts.
- **Outputs:** `intent/<slug>/spec.md` (requirements, design, acceptance criteria, flagged concerns -- product-owner-owned) and `tasks/<date>-<slug>-plan.md` (implementation order, test plan, rollback -- engineer-owned).
- **When to use:** For any feature larger than a single file change.
- **Key concept:** Policy is applied *while the spec is written*, not audited afterwards. Conflicts land in a **Flagged Concerns** table naming who resolves each. Splitting spec from plan is what makes "did the diff match the plan?" answerable.
- **Variant:** If retrying after a failed implementation, it documents previous attempts to avoid dead ends.

### security-scan

- **Trigger:** "security scan", "security audit", "check security"
- **What it does:** Leaked secrets, OWASP Top 10, dependency CVEs, input validation gaps.
- **Scope:** Optionally pass a file or directory path.

### repo-review

- **Trigger:** "repo review", "code health review", "review the repo"
- **What it does:** Whole-repo code health -- correctness risks, error handling gaps, dead code, duplication, oversized files, repo hygiene -- with fix recommendations and pointers into the specialised scan skills for deep dives.
- **Scope:** Optionally pass a file or directory path.

### performance-review

- **Trigger:** "performance review", "perf review", "check performance"
- **What it does:** N+1 queries, memory leaks, bundle size, caching, algorithms, build optimization.
- **Scope:** Optionally pass a file or directory path.

### dependency-audit

- **Trigger:** "dependency audit", "audit dependencies", "check deps"
- **What it does:** Outdated packages, known vulnerabilities, unused dependencies across all detected package managers.

### test-scaffold

- **Trigger:** "scaffold tests", "generate tests", "add test coverage"
- **What it does:** Detects test framework, finds untested modules, generates test stubs matching existing patterns.
- **Scope:** Optionally pass a file or directory.

### doc-sync

- **Trigger:** "sync docs", "update docs", "fix documentation"
- **What it does:** Cross-references documentation against code. Finds stale references, incorrect examples, missing docs.

### mermaid-diagram

- **Trigger:** "mermaid diagram", "generate diagram", "visualize data flow"
- **What it does:** Explores the codebase and generates Mermaid diagrams (data flow, architecture, sequence, state machine, ER). Saves to `docs/diagrams/`.
- **When to use:** For debugging user-reported issues without reading code, for documentation, or for understanding complex systems.

### add-lesson

- **Trigger:** "add lesson", "add gotcha", "add to LL-G"
- **What it does:** Adds a gotcha or lesson learned to the LL-G knowledge base (`BoardPandas/LL-G` repo) via GitHub API. No local clone needed.
- **When to use:** After discovering a non-obvious failure pattern during implementation.

### add-practice

- **Trigger:** "add practice", "add best practice", "add to BP"
- **What it does:** Adds a new best practice entry to the BP knowledge base (`BoardPandas/BP` repo) via GitHub API.
- **When to use:** When establishing a proven pattern that should apply across repos.

### apply-practice

- **Trigger:** "apply practice", "apply BP"
- **What it does:** Applies a specific best practice from the BP knowledge base to the current or a target repository.
- **When to use:** When onboarding a repo or setting up tooling that should follow established patterns.

### ux-review

- **Trigger:** "ux review", "review UX", "usability review"
- **What it does:** Reviews UI code against Laws of UX and Gestalt principles (via the ux-reviewer agent and `.claude/references/ux-laws.md`). Produces severity-ranked findings with specific improvement recommendations.
- **Scope:** Optionally pass a file, directory, or component name.

### merge-worktrees

- **Trigger:** "merge worktrees", "merge and clean up branches"
- **What it does:** Inventories every worktree and local branch, shows a plan and asks for confirmation, commits pending work, merges every branch into main with `--no-ff`, pushes, then removes the worktrees and deletes the merged branches. Merge conflicts are hard stops; nothing is deleted until the merge is pushed.
- **When to use:** To consolidate all outstanding work into main and tear down the leftovers.

### triage-issues

- **Trigger:** `/triage-issues` (slash command only -- it commits and pushes autonomously, so a plain-English phrase will not start it)
- **What it does:** Reads the open GitHub issues, groups duplicates that share a root cause, and dispatches one worktree-isolated `builder` subagent per unit to implement and verify the fix. The main session then merges each finished branch one at a time, re-verifies on the merged tree, updates CHANGELOG/version, commits, pushes to the main branch, and closes the issues. Anything a subagent could not resolve comes back as a blocker with a concrete recommendation and gets a `claude-blocked` label so the next default run skips it.
- **Scope:** Blank for every open issue, specific numbers (`284 290`), or `all` to retry previously blocked issues.
- **Hard stops:** a dirty working tree, a protected main branch, a merge conflict, a failed verification, or a rejected push. It never force-pushes and never closes an issue before the fix is pushed.

---

## Agents Reference

All agents are registered in [agent-registry.md](.claude/references/agent-registry.md). Claude Code discovers agents from `.claude/agents/` itself; the registry is the human-readable index of what each one is for.

### architect

- **File:** `.claude/agents/architect.md`
- **Model:** opus
- **Mode:** plan
- **Purpose:** Phase-based planning, tech stack evaluation, file structure design. Always uses phases (Foundation, Core, Polish, Ship), never timelines.

### reviewer

- **File:** `.claude/agents/reviewer.md`
- **Model:** sonnet
- **Mode:** plan
- **Purpose:** Code review for correctness, naming, DRY, error handling, type safety, and standards compliance.

### security

- **File:** `.claude/agents/security.md`
- **Model:** opus
- **Mode:** plan
- **Purpose:** OWASP Top 10, secrets detection, dependency vulnerabilities, input validation.

### performance

- **File:** `.claude/agents/performance.md`
- **Model:** sonnet
- **Mode:** plan
- **Purpose:** Query optimization, memory leaks, I/O, frontend rendering, algorithms, build optimization.

### explorer

- **File:** `.claude/agents/explorer.md`
- **Model:** sonnet
- **Mode:** plan
- **Purpose:** Codebase exploration, online research, doc fetching, context gathering. Always include a "why" when spawning.

### ux-reviewer

- **File:** `.claude/agents/ux-reviewer.md`
- **Model:** sonnet
- **Mode:** plan
- **Purpose:** UX review of UI code against Laws of UX and Gestalt principles, producing severity-ranked findings.

### builder

- **File:** `.claude/agents/builder.md`
- **Model:** sonnet
- **Mode:** acceptEdits
- **Purpose:** Implementation engineer. Turns a plan, spec, or task into working, tested code matching existing conventions. Spawn one builder per independent file set to avoid edit conflicts.

### tester

- **File:** `.claude/agents/tester.md`
- **Model:** sonnet
- **Purpose:** Detects the project's test runner, executes the relevant suite, and reports pass/fail with actionable failure detail. Verifies behavior; does not implement fixes.

---

## Hierarchical CLAUDE.md Architecture

CLAUDE.md files are loaded top-down: root user level → project level → subfolder level. Only relevant files load.

### Rules

1. **Root CLAUDE.md** contains project-wide rules, stack info, global conventions.
2. **Subfolder CLAUDE.md** files only exist where subfolder-specific rules differ from root (e.g., `frontend/CLAUDE.md` for UI conventions).
3. **`.claude/rules/*.md`** files with `paths:` frontmatter provide conditional instructions that only load when working with matching file paths. Use these instead of subfolder CLAUDE.md files for fine-grained scoping. Rules without `paths:` load every session.
4. **Nested `.claude/` directories** are natively supported: `subdir/.claude/skills/`, `agents/`, and `workflows/` load automatically when working in that subfolder. The closest directory wins on a name collision, disambiguated as `<dir>:<name>`.
5. A landing page task never loads your backend CLAUDE.md. Context stays narrow.
6. Keep each file focused and under 200 lines.
7. Prune after every model update -- remove what the model handles natively.
8. Do NOT bloat CLAUDE.md with generic advice the model already knows.

### When to Create Subfolder CLAUDE.md

- The subfolder has a different language or framework than the root
- The subfolder has distinct naming conventions, file structure, or testing patterns
- The subfolder is a separate deployable (e.g., monorepo package)

### When NOT to Create Subfolder CLAUDE.md

- The subfolder follows the same conventions as root
- The rules would just repeat or slightly extend root rules
- The subfolder is a simple utility folder

---

## Subagent Best Practices

### Always Offload to Subagents

- Online research and doc fetching
- Codebase exploration and pattern discovery
- Log analysis and debugging
- Context gathering before implementation

### Always Include a "Why"

Every subagent prompt should explain WHY you need the information:

- **Bad:** "How does auth work?"
- **Good:** "How does auth work, because we're adding rate limiting and need to know where to hook into the auth middleware."

The "why" dramatically reduces noisy and overlapping results from parallel subagents.

### Parallel Exploration

When torn between implementation approaches, spin up parallel Explorer subagents for each approach. Pass all results back to the main session and let it decide.

### Subagents Are Resumable

You can resume a specific subagent to continue its research. Use this to drill deeper without starting over.

### Background by Default

Subagents run in the background by default (v2.1.198+): the main session keeps working and is notified on completion. Subagents can spawn nested subagents up to 5 levels deep. To restrict which subagents an agent may spawn, list `Agent(agent_type)` entries in its `tools:` allowlist instead of allowing the whole Agent tool.

---

## Skill Frontmatter

Skills support optional fields for model and invocation control:

```yaml
---
name: my-skill
description: What this skill does
user-invocable: true
disable-model-invocation: true   # Only manual /skillname invocation
model: haiku                      # Which model runs this skill
context: fork                     # Run in isolated subagent context
allowed-tools:
  - Read
  - Glob
---
```

**Model selection guidelines:**
- `haiku` — Well-defined step-by-step skills (localization, release, formatting)
- `sonnet` — Analysis and research skills (code review, exploration)
- `opus` — Orchestration and planning skills (spec developer, architect)

**Additional frontmatter fields:**
- `user-invocable: false` — Hide the skill from the / menu while keeping it as background knowledge Claude can still draw on (distinct from `disable-model-invocation`, which blocks auto-triggering but keeps manual invocation)
- `context: fork` — Run skill in an isolated subagent, preventing context contamination
- `agent: <name>` — Which subagent runs the skill. It takes effect only with `context: fork`; without the fork it is silently ignored and the skill runs on the session model, which `npm run check:claude` rejects
- `effort: low|medium|high|xhigh|max` — Override reasoning effort level. `xhigh` (Opus 4.7+) typically beats `max` on cost/quality
- `keep-coding-instructions: true` — Preserve coding-style instructions when the skill switches output styles
- `${CLAUDE_SKILL_DIR}` — Reference the skill's own directory for relative file paths
- Skills in nested `.claude/skills/` subdirectories are auto-discovered
- Put the most important trigger phrases in the first 250 characters of `description` — recent releases truncate skill descriptions around that length in some surfaces
- Boolean fields also accept `yes`/`no`/`on`/`off`/`1`/`0` (v2.1.218)
- **The name `verify` is reserved in effect.** Since v2.1.286, when a project or user skill is named `verify`, Claude runs it right before every commit except docs-only and tests-only ones. Use that name only for a skill you want run on every commit.

---

## Context Management Tips

### Prevent Context Contamination

- **Plan/execute separation:** Plan in one session, execute in another.
- **Code bias fix:** If Claude is stuck in bad existing patterns, build the feature in isolation in a fresh empty folder, then port it into the main project.
- **`/rewind`:** Instead of arguing with Claude after a wrong turn, rewind to the last good point and re-guide.
- **Document failed attempts:** For stubborn bugs, have Claude write a document of all attempted fixes before starting a new session. The new session loads the document and avoids dead ends.
- **`/handoff`:** Create a handoff document (goal, progress, what worked, what failed, next steps) before ending a session. Load it in the fresh session as sole context.
- **Modularize aggressively:** Files over 500 lines consume massive context. Regularly break them apart.

### Context Window Management

- Keep CLAUDE.md under 200 lines
- Use `/compact` proactively around 50% context (disable auto-compact in `/config` for manual control)
- Start fresh conversations for unrelated topics
- Break tasks small enough to complete in under 50% context usage
- System prompt + tools consume ~10% of context. Enable `ENABLE_TOOL_SEARCH: "true"` in settings to lazy-load MCP tools and save tokens.
- Preserve the prompt cache: lock the MCP/tool list and model at the start of a session. Adding tools or switching models mid-session invalidates the cached prefix and inflates cost.
- For long-running sessions, set `ENABLE_PROMPT_CACHING_1H` to extend the prompt-cache TTL from 5 minutes to 1 hour.

---

## Tools Reference

The file `.claude/references/tools.md` lists all CLI tools the project uses. Claude Code reads this before running commands. If a tool is missing, Claude checks tools.md for the install command and offers to install it.

The file is populated by `plan-repo` and `init-repo` based on the detected stack. You can also add entries manually.

---

## Design Guardrails (UI Projects)

For projects with a frontend, `init-repo` generates `.claude/references/design-guardrails.md` with stack-specific UI/design SLA guidelines. These are sourced from current best practices as of the init date and enforced via the CLAUDE.md.

Guardrails cover: component patterns, styling conventions, accessibility requirements, performance budgets, and consistency rules.

---

## Hooks

The template includes hooks in `.claude/settings.json`:

- **SessionStart:** Surfaces the LL-G / BP knowledge-base reminder once per session.
- **PreToolUse (git commit):** Blocks PowerShell here-string syntax, reminds about the changelog/version bump, and blocks commits that do not stage `CHANGELOG.md` (merge commits and `SKIP_CHANGELOG=1` are exempt).
- **PreToolUse (EnterPlanMode):** Prompts a knowledge-base check before planning.
- **PreToolUse (Write|Edit):** Surfaces the LL-G shelf for the file's technology, once per session per shelf.
- **PostToolUse (git commit):** Prompts evaluation of whether the committed work should be contributed back to LL-G or BP.
- **PostToolUse (Write|Edit):** Formats the edited file with whatever formatter the *project* declares (biome, prettier, ruff, black, rustfmt, gofmt, shfmt). Non-blocking by design: a formatter that refuses an edit turns every unformattable file into a wall. This is why `REVIEW.md` forbids reporting formatting in review -- a hook owns it.
- **Stop:** Bell sound when Claude finishes a task (useful with multiple sessions).
- **Notification:** Bell sound when Claude needs attention.

To add custom hooks, edit `.claude/settings.json`. Supported hook events:

- `PreToolUse` / `PostToolUse` / `PostToolUseFailure` -- Before/after/on-failure tool execution
- `PostToolBatch` -- After a parallel tool batch resolves
- `SessionStart` / `SessionEnd` -- Session lifecycle
- `Stop` / `StopFailure` -- Turn completion (success / API error)
- `SubagentStart` / `SubagentStop` -- Subagent lifecycle
- `Notification` -- System notifications, including background-agent events (`agent_needs_input`, `agent_completed`)
- `MessageDisplay` -- As assistant message text is displayed (transform or hide output, redact secrets)
- `PreCompact` / `PostCompact` -- Before/after context compaction
- `UserPromptSubmit` -- Before user prompt processing
- `UserPromptExpansion` -- When a slash command expands
- `InstructionsLoaded` -- When CLAUDE.md or `.claude/rules/*.md` files load
- `ConfigChange` -- When configuration files change during session
- `WorktreeCreate` / `WorktreeRemove` -- Git worktree operations
- `PermissionRequest` / `PermissionDenied` -- Permission lifecycle
- `TeammateIdle` / `TaskCompleted` / `TaskCreated` -- Agent team and task events
- `CwdChanged` / `FileChanged` -- Working directory and file change events
- `Elicitation` / `ElicitationResult` -- MCP structured input request events
- `Setup` -- Triggered via `--init`, `--init-only`, or `--maintenance` flags

Hook types: `command` (shell), `http` (POST JSON to URL), `prompt` (single-turn LLM), `agent` (multi-turn subagent), `mcp_tool` (direct MCP tool invocation).

Each hook entry accepts an optional `if:` field using permission-rule syntax (e.g., `Bash(git *)`) to filter when the hook fires. Reduces overhead on unrelated tool calls. Matchers can also target tool input parameters with `Tool(param:value)` syntax (e.g., `Agent(model:opus)`).

Hooks can return structured output beyond allow/block: `PostToolUse` can rewrite any tool's output (`hookSpecificOutput.updatedToolOutput`), `Stop`/`SubagentStop` can feed text back and continue the turn (`hookSpecificOutput.additionalContext`), and `SessionStart` can rescan skill directories (`reloadSkills: true`) or set the session title. See `.claude/references/hooks-and-settings.md` for the full catalog, including a `PermissionRequest` prompt-hook pattern that auto-approves known-safe operations.

---

## Agent Memory

The `.claude/agent-memory/` directory stores persistent, version-controlled knowledge that agents accumulate:

| File | Purpose |
|------|---------|
| `README.md` | Conventions and usage guide |
| `patterns.md` | Recurring code patterns and conventions |
| `decisions.md` | Key technical decisions with rationale |
| `debugging.md` | Failed approaches and dead ends |

Agents with `memory: project` read this directory on startup. Any agent can write here to share knowledge across sessions. See `.claude/agent-memory/README.md` for conventions.

---

## Power User Tips

- **`/add-dir`** -- Add a second project directory to copy proven implementations between projects.
- **Verbose mode** (`/config` -> verbose -> true) -- Shows token count and reasoning trace. Read the trace to learn Claude's terminology, then use it in prompts.
- **`/statusline`** -- Shows model name, context battery, git branch, unstaged changes. Essential with multiple sessions.
- **`/rewind`** (or `/undo`) -- Return to last good point instead of arguing about a wrong turn.
- **`/fork`** -- Branch current session within conversation. Use `--fork-session` with `--continue` to fork from recent sessions.
- **`/handoff`** -- Create a summary document before ending a session for seamless continuation.
- **`/recap`** -- Get a context summary when returning to a session. Configurable in `/config`.
- **`/release-notes`** -- View latest changes in the current Claude Code version.
- **`/team-onboarding`** -- Generate a teammate ramp-up guide from your local Claude Code usage.
- **`--worktree` / `-w`** -- Start Claude Code in an isolated git worktree for parallel work.
- **`--bare`** -- Skip hooks, LSP, and plugin sync for scripted/CI calls.
- **`-n` / `--name`** -- Set a display name for the session at startup.
- **`--from-pr`** -- Resume sessions linked to a GitHub PR.
- **`claude agents`** -- List all configured agents from the CLI.

---

## Customizing for Your Project

### Editing CLAUDE.md

Update root CLAUDE.md with your project's stack, conventions, and standards. Keep under 200 lines. Create subfolder CLAUDE.md files only where distinct rules apply.

### Adding New Skills

1. Create a folder in `.claude/skills/` with your skill name.
2. Create `SKILL.md` inside with YAML frontmatter (`name`, `description`, `user-invocable: true`).
3. Add optional frontmatter: `disable-model-invocation`, `model`, `agent` (only with `context: fork`), `effort`, `context: fork`.
4. Write step-by-step instructions in the markdown body.
5. Update the skill table in CLAUDE.md and this instructions.md file.

### Adding New Agents

1. Create a markdown file in `.claude/agents/` named after the agent.
2. Add YAML frontmatter: `name`, `description`, `model`, and optionally `tools`, `permissionMode`, `maxTurns`, `skills`, `memory`, `isolation`, `background`, `disallowedTools`.
3. Write the agent's role, focus areas, and behavior.
4. Register the agent in [agent-registry.md](.claude/references/agent-registry.md).
5. Update CLAUDE.md.

**Advanced agent fields:**
- `skills:` — Preload specific skills into the agent for progressive disclosure
- `memory:` — Persistent memory scope (`user`, `project`, or `local`; local lives in git-ignored `.claude/agent-memory-local/<agent-name>/`)
- `context:` — Additional instructions injected into the agent's system prompt
- `isolation: worktree` — Run in a temporary git worktree
- `background: true` — Run asynchronously without blocking
- `disallowedTools:` — Remove specific tools from inherited tool lists
- `effort:` — Override reasoning effort (`low`, `medium`, `high`, `xhigh`, `max`)
- `initialPrompt:` — First message sent to the agent on startup
- `omitClaudeMd: true` — Run without user, project and local CLAUDE.md files; managed policy files still load (v2.1.271). Suits narrow agents that do not need project conventions
- `experimental.cacheTtl:` — Per-agent prompt-cache TTL, `"5m"` or `"1h"`, used when no subagent TTL setting is configured (v2.1.248)
- The Agent tool takes an `effort` parameter (v2.1.292), so a caller can set effort per spawn without changing the agent's frontmatter
- `Agent(agent_type)` in `tools:` — Restrict which specific subagents this agent may spawn

### Updating the Source URL Registry

Add URLs to `.claude/references/source-urls.md`. The next `update-practices` run will include them.

### Personal Settings Overrides

Create `.claude/settings.local.json` for personal settings (git-ignored). Overrides `.claude/settings.json`.

---

## Troubleshooting

- **Skill not triggering:** Check `user-invocable: true` in SKILL.md frontmatter.
- **Agent not found:** Ensure the agent file is in `.claude/agents/` and registered in [agent-registry.md](.claude/references/agent-registry.md).
- **Settings not applied:** Precedence (highest wins): managed-settings.json (org policy) → CLI flags → `.claude/settings.local.json` → `.claude/settings.json` → `~/.claude/settings.local.json` → `~/.claude/settings.json`. Deny rules always win regardless of tier.
- **Hooks not running:** Verify hook event name and matcher in settings.json. Run `/doctor`.
- **Stale practices:** Run "update practices" -- it checks today's date and fetches current recommendations.
- **Context overload:** Use `/compact`, break into smaller tasks, or start a fresh session.
