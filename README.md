# Claude Code Starter Template

A ready-to-use `.claude/` configuration folder for any repository. Ships with skills, agents, and settings aligned to Claude Code best practices (v2.1.50, Feb 2026).

## Quick Start

### New Project

```bash
git clone https://github.com/your-org/claude-code-bootstrap.git my-project
cd my-project
rm -rf .git && git init
```

Then open Claude Code and say: **"initialize repo"** to customize the template for your project.

### Existing Project

```bash
# Copy the .claude/ folder into your repo
cp -r path/to/claude-code-bootstrap/.claude/ your-repo/.claude/
cp path/to/claude-code-bootstrap/CLAUDE.md your-repo/CLAUDE.md
cp path/to/claude-code-bootstrap/agents.md your-repo/agents.md
```

Then open Claude Code in your repo and say: **"initialize repo"** to merge the template with your existing setup.

## What's Included

### Skills

| Skill | Trigger | Description |
|-------|---------|-------------|
| init-repo | "initialize repo" | Build or rebuild the .claude/ folder with best practices |
| update-practices | "update practices" | Fetch latest best practices and update config |
| code-review | "code review" | Full codebase review with severity-ranked findings |
| security-scan | "security scan" | OWASP Top 10, secrets detection, dependency audit |
| performance-review | "performance review" | Bottleneck analysis with impact-ranked fixes |
| dependency-audit | "dependency audit" | Outdated, vulnerable, and unused dependency detection |
| test-scaffold | "scaffold tests" | Generate test files for untested modules |
| doc-sync | "sync docs" | Align documentation with current code |

### Agents

| Agent | Purpose |
|-------|---------|
| architect | System design, tech stack decisions, file structure |
| reviewer | Code review for correctness and maintainability |
| security | Vulnerability detection and security analysis |
| performance | Bottleneck identification and optimization |

## Keeping Up to Date

Say **"update practices"** in Claude Code. The skill fetches the latest best practices from official and community sources, then updates your config. Safe to run anytime.

## Full Documentation

See [instructions.md](instructions.md) for complete documentation on every skill, agent, and configuration option.

## License

MIT
