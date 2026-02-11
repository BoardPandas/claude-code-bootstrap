---
name: setup-stack
description: Configure the bootstrap for your specific tech stack (one-time setup)
disable-model-invocation: true
allowed-tools:
  - Read
  - Edit
  - Glob
  - Grep
---

# Setup Stack - Configure Bootstrap for Your Project

This is a one-time setup command that configures the Claude Code Bootstrap for your specific technology stack.

## Instructions

Ask the user the following questions, then configure the project accordingly.

### Step 1: Gather Stack Information

Ask the user:

1. **Backend language/framework**: What backend language and framework are you using?
   - Examples: Node.js/Express, Python/FastAPI, Python/Django, Go/Chi, Rust/Axum, C#/.NET, Java/Spring Boot, Ruby/Rails
   - Or: "None - this is a frontend-only project"

2. **Frontend framework** (if any): What frontend framework are you using?
   - Examples: React, Next.js, Vue, Svelte, Angular, HTMX
   - Or: "None - this is a backend-only/CLI project"

3. **Test framework**: What test framework(s) are you using?
   - Examples: Jest, Vitest, pytest, Go testing, Rust cargo test, xUnit, JUnit
   - Or: "Not sure yet - recommend one"

4. **Database** (if any): What database are you using?
   - Examples: PostgreSQL, MySQL, SQLite, MongoDB, Redis
   - Or: "None"

5. **Package manager / build tool**: What package manager or build tool do you use?
   - Examples: npm, pnpm, yarn, pip/poetry, go modules, cargo, maven, gradle

### Step 2: Update CLAUDE.md

Update the project's `CLAUDE.md` file with the stack information gathered above. Add or update these sections:

```markdown
## Tech Stack
- **Backend**: [language/framework]
- **Frontend**: [framework or "None"]
- **Database**: [database or "None"]
- **Testing**: [test framework]
- **Package Manager**: [package manager]

## Common Commands
- **Build**: [appropriate build command]
- **Test**: [appropriate test command]
- **Dev Server**: [appropriate dev command]
- **Lint/Typecheck**: [appropriate lint command]
```

### Step 3: Configure Stack Skills

Check `.claude/skills/` for stack-specific skill directories (e.g., `node-express/`, `python-fastapi/`, `go-gin/`, `react-nextjs/`, `tdd-jest/`, `tdd-pytest/`, `tdd-go/`).

1. For skills matching the user's stack, edit their `SKILL.md` frontmatter to remove `disable-model-invocation: true` (enabling auto-activation)
2. Optionally remove skill directories for stacks the user is NOT using
3. If there are no stack-specific skill directories, skip this step

### Step 5: Confirm Setup

Provide a summary to the user:

```markdown
## Stack Configuration Complete

### Your Stack
- Backend: [value]
- Frontend: [value]
- Database: [value]
- Testing: [value]
- Build: [command]

### Files Updated
- CLAUDE.md - Added tech stack and common commands
- [Any other files modified]

### Files Removed
- [Any irrelevant stack files removed, or "None"]

### Next Steps
1. Review CLAUDE.md to make sure everything looks correct
2. Run your build command to verify the project compiles
3. Run your test command to verify tests pass
4. Start building!
```

## Notes

- This command is designed to be run once when first setting up the bootstrap
- If you change your stack later, you can run this again
- The command only modifies configuration files, not your application code
- If unsure about any answer, the user can always update CLAUDE.md manually later
