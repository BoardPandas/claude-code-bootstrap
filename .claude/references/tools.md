# CLI Tools Reference

Claude Code reads this file to know which CLI tools are available and how to use them. When a command fails because a tool is missing, check this file for the install command and offer to install it.

## How This File Works

- **init-repo** and **plan-repo** populate this file based on the detected/chosen stack.
- Each tool entry includes: install command, version check, and common usage.
- Claude Code should check `<tool> --version` before assuming a tool is available.
- If a tool is missing and needed, ask the user before installing.

## Universal Tools

### Git
- **Check:** `git --version`
- **Usage:** Version control. Always available.

### Node.js / npm (if JS/TS project)
- **Check:** `node --version && npm --version`
- **Install:** https://nodejs.org or `nvm install --lts`
- **Usage:** `npm install`, `npm run <script>`, `npx <command>`

### Bun (alternative JS runtime)
- **Check:** `bun --version`
- **Install:** `curl -fsSL https://bun.sh/install | bash`
- **Usage:** `bun install`, `bun run <script>`, `bunx <command>`

### Python / pip (if Python project)
- **Check:** `python3 --version && pip3 --version`
- **Install:** https://python.org or system package manager
- **Usage:** `pip install -r requirements.txt`, `python3 -m <module>`

## Stack-Specific Tools

This section is populated by plan-repo or init-repo based on the project's stack. Below are common examples.

### Package Managers
| Tool | Check | Install | Use When |
|------|-------|---------|----------|
| pnpm | `pnpm --version` | `npm i -g pnpm` | Monorepos, disk-efficient deps |
| yarn | `yarn --version` | `npm i -g yarn` | Projects using yarn.lock |
| uv | `uv --version` | `pip install uv` | Fast Python package management |
| cargo | `cargo --version` | https://rustup.rs | Rust projects |
| go | `go version` | https://go.dev/dl | Go projects |

### Linters & Formatters
| Tool | Check | Install | Use When |
|------|-------|---------|----------|
| eslint | `npx eslint --version` | `npm i -D eslint` | JS/TS linting |
| prettier | `npx prettier --version` | `npm i -D prettier` | JS/TS/CSS/MD formatting |
| biome | `npx biome --version` | `npm i -D @biomejs/biome` | Fast JS/TS lint + format |
| ruff | `ruff --version` | `pip install ruff` | Fast Python lint + format |
| rustfmt | `rustfmt --version` | Included with rustup | Rust formatting |

### Test Runners
| Tool | Check | Install | Use When |
|------|-------|---------|----------|
| vitest | `npx vitest --version` | `npm i -D vitest` | Vite-based JS/TS projects |
| jest | `npx jest --version` | `npm i -D jest` | JS/TS testing |
| pytest | `pytest --version` | `pip install pytest` | Python testing |
| playwright | `npx playwright --version` | `npm i -D @playwright/test` | E2E browser testing |

### Build Tools
| Tool | Check | Install | Use When |
|------|-------|---------|----------|
| vite | `npx vite --version` | `npm i -D vite` | Frontend builds |
| turbo | `npx turbo --version` | `npm i -D turbo` | Monorepo builds |
| esbuild | `npx esbuild --version` | `npm i -D esbuild` | Fast JS bundling |
| tsc | `npx tsc --version` | `npm i -D typescript` | TypeScript compilation |

### Database Tools
| Tool | Check | Install | Use When |
|------|-------|---------|----------|
| prisma | `npx prisma --version` | `npm i -D prisma` | Prisma ORM |
| drizzle-kit | `npx drizzle-kit --version` | `npm i -D drizzle-kit` | Drizzle ORM |
| psql | `psql --version` | System package manager | PostgreSQL CLI |

### Deployment Tools
| Tool | Check | Install | Use When |
|------|-------|---------|----------|
| vercel | `vercel --version` | `npm i -g vercel` | Vercel deployment |
| wrangler | `npx wrangler --version` | `npm i -D wrangler` | Cloudflare Workers |
| fly | `fly version` | https://fly.io/docs/hands-on/install-flyctl | Fly.io deployment |
| docker | `docker --version` | https://docs.docker.com/get-docker | Container builds |

## Project-Specific Tools

<!-- init-repo and plan-repo append project-specific entries here -->
<!-- Format: ### Tool Name -->
<!-- - **Check:** `command --version` -->
<!-- - **Install:** `install command` -->
<!-- - **Usage:** Common commands for this project -->
