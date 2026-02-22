# Agent Registry

All custom agents for this project. Each agent is defined in `.claude/agents/` as a markdown file with YAML frontmatter.

## Registered Agents

### architect

- **File:** `.claude/agents/architect.md`
- **Purpose:** High-level planning, tech stack decisions, file structure design, and architectural review.
- **When to use:** Starting a new feature, restructuring a codebase, evaluating technology choices, or designing system architecture.
- **Model:** opus

### reviewer

- **File:** `.claude/agents/reviewer.md`
- **Purpose:** Code review focused on correctness, maintainability, naming, DRY violations, and adherence to project standards.
- **When to use:** Before merging PRs, after completing a feature, or when requesting a second opinion on code quality.
- **Model:** sonnet

### security

- **File:** `.claude/agents/security.md`
- **Purpose:** Security-focused analysis covering OWASP Top 10, secrets detection, dependency vulnerabilities, and input validation gaps.
- **When to use:** Before releases, after adding authentication or authorization logic, or when handling user input or external data.
- **Model:** opus

### performance

- **File:** `.claude/agents/performance.md`
- **Purpose:** Performance-focused analysis covering query optimization, memory leaks, bundle size, caching, and algorithmic efficiency.
- **When to use:** When response times degrade, before scaling, or when optimizing resource-intensive operations.
- **Model:** sonnet
