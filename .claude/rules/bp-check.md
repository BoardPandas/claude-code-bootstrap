---
description: Enforce BP best practices check before starting new work
paths:
  - "CLAUDE.md"
  - ".claude/**"
  - ".github/**"
  - "package.json"
  - "Dockerfile*"
  - "docker-compose*"
  - "biome.*"
  - "turbo.json"
  - "pnpm-workspace.yaml"
  - "vitest.config.*"
  - "playwright.config.*"
  - "jest.config.*"
---

<!--
  SCOPE THESE GLOBS TO THE ADOPTING REPO. The list above is the template's
  best guess at a generic layout, and in most real repos several of these
  entries match zero files.

  That is not harmless. `scripts/check-claude-wiring.mjs` (shipped alongside
  this rule, and wired as the first CI job) treats a glob matching zero files
  as an ERROR, because a rule scoped to a path that does not exist never fires
  and nothing says so. So a freshly scaffolded repo gets a RED build until the
  globs are corrected -- which is the guard working, not a bug, but it is
  confusing if you do not know it is coming.

  Concrete example: a Next.js app with everything under src/ has no top-level
  lib/, app/, worker/, api/ or middleware.*, and no root CLAUDE.md if it keeps
  its instructions at .claude/CLAUDE.md. One repo hit 13 dead globs across the
  two rule files on its first sync.

  On adoption, and after every template sync:
    1. Run `npm run check:claude` (or `node scripts/check-claude-wiring.mjs`).
    2. Delete any glob it reports as matching zero files.
    3. Add the paths this repo actually uses.

  Re-check after every sync: this file is overwritten wholesale, so local
  rescoping does not survive on its own.
-->

# RULE 3 Enforcement: Check BP Before Configuration Work

Before creating or modifying infrastructure, tooling, or configuration files matching the paths above, you MUST consult the BP knowledge base to follow proven patterns.

## Required Steps

1. **Fetch the master index:**
   ```
   WebFetch https://raw.githubusercontent.com/BoardPandas/BP/main/llms.txt
   ```

2. **Identify relevant concerns** from the file you're about to write (e.g., testing config -> testing, Dockerfile -> deployment, CLAUDE.md -> claude-config).

3. **Fetch each relevant concern index:**
   ```
   WebFetch https://raw.githubusercontent.com/BoardPandas/BP/main/practices/<concern>/llms.txt
   ```

4. **Read ALL FOUNDATIONAL entries** for matched concerns.

5. **Read RECOMMENDED entries** whose tech tags match this project's stack.

## When to check

- Setting up new tooling (linters, formatters, test runners)
- Creating or modifying Dockerfiles
- Configuring CI/CD pipelines
- Structuring `.claude/` configuration
- Setting up monorepo workspaces
- Adding versioning or changelog automation
- Configuring environment/secrets management

## Do NOT skip this check

- If you already checked BP earlier in this conversation for the same concern, you do not need to re-fetch.
- If no entries are relevant, proceed -- but you must have looked first.
