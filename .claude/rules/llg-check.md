---
description: Enforce LL-G knowledge base check before writing code
paths:
  - ".claude/**"
  - "scripts/**"
  - "src/**"
  - "lib/**"
  - "app/**"
  - "worker/**"
  - "api/**"
  - "middleware.*"
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

# RULE 1 Enforcement: Check LL-G Before Writing Code

Before writing or editing any file matching the paths above, you MUST consult the LL-G knowledge base to avoid known failure patterns.

## Required Steps

1. **Fetch the master index:**
   ```
   WebFetch https://raw.githubusercontent.com/BoardPandas/LL-G/main/llms.txt
   ```

2. **Identify relevant technologies** from the file you're about to write (e.g., Next.js, TypeScript, Better Auth, Tailwind, etc.).

   When the file is under `.claude/` or is a hook script, the technology is **`claude-code`** (and `bash` for `.sh` files). That shelf documents the silent-failure modes of this very configuration -- dead hook matchers, ignored frontmatter keys, blocking hooks with no stderr.

3. **Fetch each relevant tech index:**
   ```
   WebFetch https://raw.githubusercontent.com/BoardPandas/LL-G/main/kb/<tech>/llms.txt
   ```

4. **Read ALL HIGH-severity entries** for matched technologies.

5. **Read MEDIUM entries** whose title matches the specific task.

## Do NOT skip this check

- Even for small edits — HIGH-severity gotchas cause silent wrong output.
- If you already checked LL-G earlier in this conversation for the same tech, you do not need to re-fetch.
- If no entries are relevant, proceed — but you must have looked first.
