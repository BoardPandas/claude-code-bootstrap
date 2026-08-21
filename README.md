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
cp path/to/claude-code-bootstrap/agents.md your-repo/agents.md
```

Then open Claude Code in your repo and say: **"initialize repo"** to merge the template with your existing setup.

## Workflow

```
/plan-repo  →  initialize repo  →  (build features)  →  update practices
    ↑                                     |
    |              /spec-developer  ←─────┘
    |              (plan in one session, execute in another)
    └───────────────────────────────────────────────────────┘
```

1. **Plan first:** `/plan-repo` researches current options and recommends the best stack for your project, then generates README, design guardrails, and tools reference.
2. **Initialize:** say "initialize repo" -- it reads the plan and configures `.claude/` with skills, agents, settings, and hierarchical CLAUDE.md files.
3. **Build features:** Use `/spec-developer` for big features -- it interviews you, explores the codebase, and generates a detailed plan saved to `/tasks`. Execute in a fresh session.
4. **Stay current:** say "update practices" to fetch latest best practices and update your config. Safe to run anytime.

## What's Included

### Skills

| Skill | Trigger | Description |
|-------|---------|-------------|
| plan-repo | `/plan-repo` | Research and recommend best tech stack, generate README, design guardrails, tools reference |
| init-repo | "initialize repo" | Build or rebuild the .claude/ folder with best practices |
| update-practices | "update practices" | Fetch latest best practices and update config |
| spec-developer | `/spec-developer` | Interview-driven feature spec saved to /tasks |
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

See [agents.md](agents.md) for the full agent registry.

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

## Keeping Up to Date

Say **"update practices"** in Claude Code. The skill fetches the latest best practices from official and community sources, then updates your config. Safe to run anytime.

## Checks

```bash
npm run check:claude   # rule scoping, hook matchers, frontmatter, context budgets
npm test               # asserts every one of those checks still fires
```

Both run in CI on every push and pull request.

## Full Documentation

See [instructions.md](instructions.md) for complete documentation on every skill, agent, and configuration option.

## License

MIT
