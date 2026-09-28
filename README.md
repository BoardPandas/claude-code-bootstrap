# Claude Code Starter Template

A ready-to-use `.claude/` configuration folder for any repository. Ships with skills, agents, and settings aligned to Claude Code best practices, last synced **2026-08-21**. Run `update practices` to refresh both the config and that date.

## Quick Start

### New Project

```bash
git clone https://github.com/BoardPandas/claude-code-bootstrap.git my-project
cd my-project
rm -rf .git && git init
```

Then open Claude Code, type **`/plan-repo`** to plan your stack, and say **"initialize repo"** to configure.

> Skills shown below with a `/command` trigger set `disable-model-invocation: true`. A plain-English phrase will **not** start them — type the slash command. Skills shown with a quoted phrase work either way.

### Existing Project

```bash
# Copy the .claude/ folder into your repo
cp -r path/to/claude-code-bootstrap/.claude/ your-repo/.claude/
cp path/to/claude-code-bootstrap/CLAUDE.md your-repo/CLAUDE.md
cp path/to/claude-code-bootstrap/REVIEW.md your-repo/REVIEW.md
cp -r path/to/claude-code-bootstrap/scripts/ your-repo/scripts/
```

`REVIEW.md` and `scripts/` are not optional: `npm run check:claude` fails without the
review policy, and the guard and eval runner both live in `scripts/`.

For Codex, generate its mirror of the same configuration (`AGENTS.md`, `.agents/skills/`,
`.codex/`) instead of copying it, then keep it current with the same command:

```bash
node scripts/sync-codex.mjs
```

Then open Claude Code in your repo and say: **"initialize repo"** to merge the template with your existing setup.

## Workflow

```
/plan-repo  →  initialize repo  →  (build features)  →  update practices
    ↑                                     |
    |   /capture-intent → /spec-developer ┘
    |   intent.md  →  spec.md + plan.md
    |              (plan in one session, execute in another)
    └───────────────────────────────────────────────────────┘
```

1. **Plan first:** `/plan-repo` researches current options and recommends the best stack for your project, then generates README, design guardrails, and tools reference.
2. **Initialize:** say "initialize repo" -- it reads the plan and configures `.claude/` with skills, agents, settings, hierarchical CLAUDE.md files, `REVIEW.md`, and an eval corpus.
3. **Capture intent:** `/capture-intent` turns an idea into `intent/<slug>/intent.md` -- the problem in the originator's own words, no engineering knowledge required. A product owner approves it before anything else happens.
4. **Spec it:** `/spec-developer intent/<slug>/intent.md` applies design, UX and security policy while writing, then produces `spec.md` (what, product-owner-owned) and `plan.md` (how, engineer-owned) as separate artifacts. Execute in a fresh session.
5. **Stay current:** say "update practices" to fetch latest best practices and update your config. Safe to run anytime.

### The artifact chain

| Artifact | Location | Produced by | Approved by |
|---|---|---|---|
| `intent.md` | `intent/<slug>/` | `/capture-intent` | Product owner |
| `spec.md` | `intent/<slug>/` | `/spec-developer` | Product owner |
| `plan.md` | `tasks/` | plan mode / `/spec-developer` | Engineer |
| diff | git branch | `builder` / session | Code owner, per `REVIEW.md` |

## What's Included

### Skills

| Skill | Trigger | Description |
|-------|---------|-------------|
| capture-intent | `/capture-intent` | Capture an idea as `intent.md` before any spec or code exists |
| plan-repo | `/plan-repo` | Research and recommend best tech stack for a web or desktop target, pick the infra profile (Cloudflare or Railway), generate README, design guardrails, tools reference |
| init-repo | "initialize repo" | Build or rebuild the .claude/ folder with best practices |
| update-practices | "update practices" | Fetch latest best practices and update config |
| spec-developer | `/spec-developer` | Turn an approved intent into `spec.md` + `plan.md` |
| security-scan | "security scan" | OWASP Top 10, secrets detection, dependency audit |
| repo-review | "repo review" | General code health review of the whole repo with fix recommendations |
| performance-review | "performance review" | Bottleneck analysis with impact-ranked fixes |
| dependency-audit | "dependency audit" | Outdated, vulnerable, and unused dependency detection |
| test-scaffold | "scaffold tests" | Generate test files for untested modules |
| doc-sync | "sync docs" | Align documentation with current code |
| ux-review | "ux review" | Review UI/UX against Laws of UX and Gestalt principles |
| mermaid-diagram | `/mermaid-diagram` | Generate data flow / architecture diagrams |
| add-lesson | "add lesson" | Add a gotcha or lesson learned to the LL-G knowledge base |
| add-practice | "add practice" | Add a best practice entry to the BP knowledge base |
| apply-practice | "apply practice" | Apply a BP best practice to a target repository |
| merge-worktrees | `/merge-worktrees` | Merge all worktrees and branches into main, push, then clean up |
| triage-issues | `/triage-issues` | Fix open GitHub issues via worktree-isolated builder subagents |

### Agents

See [agent-registry.md](.claude/references/agent-registry.md) for the full agent registry.

| Agent | Purpose |
|-------|---------|
| architect | Phase-based planning, tech stack decisions, file structure |
| builder | Implementation engineer; turns a plan into working, tested code |
| reviewer | Code review for correctness and maintainability |
| tester | Runs the project's tests and reports actionable pass/fail results |
| security | Vulnerability detection and security analysis |
| performance | Bottleneck identification and optimization |
| explorer | Codebase exploration, research, and context gathering |
| ux-reviewer | UX review against Laws of UX and Gestalt principles |

### Key Concepts

- **Phase-based planning:** Foundation → Core → Polish → Ship. No timelines.
- **Hierarchical CLAUDE.md:** Root → subfolder, loaded top-down. Only relevant files load.
- **Subagent-first:** Always offload research, exploration, and log analysis to subagents. Include a "why" in every subagent prompt.
- **Plan/execute separation:** Plan in one session, execute in another. Save plans to `/tasks`.
- **Date-aware practices:** Always checks the current date when fetching best practices.
- **Tools reference:** `.claude/references/tools.md` lists all CLI tools so Claude can detect and install missing ones.
- **Design guardrails:** `.claude/references/design-guardrails.md` enforces UI/design SLA for frontend projects. Generated by `/plan-repo`; not present in this template.
- **Verified wiring:** `npm run check:claude` fails the build on miswired rules, hooks, and frontmatter — the failure modes that are otherwise silent. `npm test` asserts the guard itself still catches them.
- **Configuration evals:** `.claude/evals/` regression-tests what the guard cannot — whether the config still *behaves*. The guard proves it is wired; the evals prove it works.
- **Review policy as code:** `REVIEW.md` defines the passes, the severity bar, the nit cap, and the exclusions. Version-controlled, and checked by the guard.
- **Managed settings:** `.claude/references/managed-settings.example.json` is a lift-and-adapt example of the non-negotiable tier — credential denies, sandbox egress allowlist, approval gates, minimum version.

## Keeping Up to Date

Say **"update practices"** in Claude Code. The skill fetches the latest best practices from official and community sources, then updates your config. Safe to run anytime.

## Checks

```bash
npm run check:claude          # rule scoping, hook matchers, frontmatter, context budgets, review policy
npm test                      # asserts every one of those checks still fires
npm run evals -- --validate   # eval corpus structure: no API calls, no cost
npm run evals                 # behavioural evals: needs the claude CLI
```

The first three run in CI on every push and pull request. The behavioural evals run on
changes to `CLAUDE.md`, `REVIEW.md`, `.claude/**` or `scripts/**`, plus weekly, and need
`ANTHROPIC_API_KEY` in repository secrets. A weekly `security-scan` workflow audits
dependencies and checks for tracked credential files.

## Full Documentation

See [instructions.md](instructions.md) for complete documentation on every skill, agent, and configuration option.

## License

MIT
