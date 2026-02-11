# Claude Code Bootstrap

**Universal system for 10x faster development with Claude Code.**

Battle-tested on real production applications. Framework-agnostic. Copy and customize for any stack.

---

## Quick Start

1. **Use this template** to create a new repository (or clone it)
2. **Copy `.claude/` folder** to your project
3. **Run `/setup-stack`** to configure for your tech stack
4. **Fill in `CLAUDE.md`** from the template with your project details
5. **Start shipping 10x faster!**

## What's Included

### Core Skills (6 universal principles)
- **backend-dev-guidelines** - Direct SQL, simple APIs, MVP-first development
- **frontend-dev-guidelines** - Simple components, direct API calls, minimal state
- **production-principles** - YAGNI, Rule of Three, Simple > Complex
- **tdd-workflow** - Red-Green-Refactor, tests first
- **security-practices** - Authentication, SQL injection prevention, password hashing
- **skill-developer** - Guide for creating custom skills

### Stack Packs (pick your stack)
- **node-express** - Node.js + Express + PostgreSQL examples
- **react-nextjs** - React + Next.js + Material UI examples
- **tdd-jest** - Jest + Supertest testing patterns
- **python-fastapi** - Python + FastAPI + asyncpg examples
- **tdd-pytest** - pytest testing patterns
- **go-gin** - Go + Gin + pgx examples
- **tdd-go** - Go testing patterns (httptest, table-driven tests)

### Optional Skills (domain-specific)
- **UIC_Guidelines** - Universal ID Convention for debugging (React)
- **go-desktop-agent-guidelines** - Go + Wails desktop development
- **openai-api-expert** - LLM integration and best practices
- **prompt-engineering-expert** - AI prompt design and optimization
- **rest-api-expert** - REST API design patterns

### Agents (4 automation workers)
- **strategic-plan-architect** - Create detailed implementation plans
- **build-error-resolver** - Fix compilation/build errors systematically
- **code-architecture-reviewer** - Review code against best practices
- **production-principles-enforcer** - Prevent over-engineering before it starts

### Commands (workflow shortcuts)
- `/dev-docs` - Create strategic implementation plan
- `/dev-docs-update` - Update plan with progress
- `/build-and-fix` - Run build and fix all errors
- `/code-review` - Architecture review
- `/test-api` - Test API endpoints
- `/setup-stack` - Configure bootstrap for your tech stack

### Hooks (automation)
- **pre-tool-use.js** - Tool validation and safety checks
- **session-start.js** - Session initialization
- **stop.js** - Auto-format, build check, error detection
- **utils/** - Build checker, error pattern detection, file tracking

### Documentation (10 guides)
- **00-QUICK-START.md** - 5-minute setup
- **01-CLAUDE-CODE-SETUP.md** - Complete configuration guide
- **02-UIC-SYSTEM.md** - Universal ID Convention (optional, for web UI projects)
- **03-MVP-PRINCIPLES.md** - Development philosophy
- **04-SKILLS-SYSTEM.md** - Auto-activating guidelines
- **05-AGENTS-SYSTEM.md** - Specialized AI workers
- **06-HOOKS-AUTOMATION.md** - Automation system
- **07-NEW-PROJECT-CHECKLIST.md** - Step-by-step setup
- **10-COMPLETE-EXAMPLE.md** - Real-world walkthrough (Node.js stack)

## Installation

### Option 1: Use GitHub Template (Recommended)

1. Click **"Use this template"** button (if this is a template repo)
2. Create your new repository
3. Clone to your machine
4. Follow the setup guide in `docs/00-QUICK-START.md`

### Option 2: Manual Copy

```bash
# Clone this repository
git clone https://github.com/your-username/claude-code-bootstrap.git

# Copy to your project
cp -r claude-code-bootstrap/.claude /path/to/your/project/
cp -r claude-code-bootstrap/docs /path/to/your/project/

# Follow setup guide
# See docs/00-QUICK-START.md
```

### Option 3: Direct Download

1. Download ZIP from GitHub
2. Extract to temporary location
3. Copy `.claude/` and `docs/` folders to your project
4. Follow `docs/00-QUICK-START.md` for configuration

## Documentation

Start here based on your goal:

### "I Want to Ship Fast" (30 minutes)
1. Read `docs/00-QUICK-START.md`
2. Copy `.claude` folder
3. Run `/setup-stack` to configure for your stack
4. Start building!

### "I Want to Understand Everything" (3 hours)
1. Read all documentation in `docs/` folder
2. Run `/setup-stack` to configure for your stack
3. Follow `docs/07-NEW-PROJECT-CHECKLIST.md`

### "Show Me Results First" (15 minutes)
1. Read `docs/10-COMPLETE-EXAMPLE.md` - See 1 hour vs 4 days
2. Read `docs/03-MVP-PRINCIPLES.md` - Understand philosophy
3. Read `docs/00-QUICK-START.md` - Get started

## Customization

### Stack Configuration

Run `/setup-stack` to interactively configure your project. This will:
1. Ask which stack you're using (Node.js, Python, Go, etc.)
2. Enable the relevant stack-specific skills
3. Enable any optional skills you need
4. Update CLAUDE.md with your stack details

### Manual Configuration

Core skills in `.claude/skills/` contain **universal principles** -- no stack-specific code. Stack-specific skills are disabled by default (`disable-model-invocation: true`) and enabled when you run `/setup-stack`:

- **Node.js/Express**: `node-express/`, `react-nextjs/`, `tdd-jest/`
- **Python/FastAPI**: `python-fastapi/`, `tdd-pytest/`
- **Go/Gin**: `go-gin/`, `tdd-go/`
- **Other stacks**: Core skills still apply; create your own skill directory using existing ones as templates

Remove skill directories you don't need to keep Claude focused on your tech stack.

## Key Features

### 1. Skills Auto-Activation
Skills activate automatically based on your prompts:
- Type "backend" -> Backend guidelines activate
- Type "component" -> Frontend guidelines activate
- Type "refactor" -> MVP principles enforce simplicity

### 2. MVP Principles
Ship faster by avoiding over-engineering:
- YAGNI (You Aren't Gonna Need It)
- Rule of Three (extract after 3rd duplicate)
- Simple > Complex (always)

### 3. TDD Workflow
Higher quality with fewer bugs:
- Red-Green-Refactor cycle
- Tests first, implementation second
- Near-zero production bugs

### 4. Hooks Automation
Zero manual cleanup:
- Code formatted automatically (detects your formatter)
- Build checked after changes (detects your build tool)
- Errors detected before commit

### 5. Strategic Planning
Right the first time:
- Plan before code
- Break into phases
- Identify risks upfront

## Contributing

This is a battle-tested template from real production development. If you have improvements:

1. Fork this repository
2. Make your changes
3. Submit a pull request
4. Share your learnings!

## License

MIT License - See [LICENSE](LICENSE) for details.

## Resources

- **Full Documentation**: See `docs/` folder
- **Quick Start**: `docs/00-QUICK-START.md`
- **Complete Example**: `docs/10-COMPLETE-EXAMPLE.md`
- **New Project Setup**: `docs/07-NEW-PROJECT-CHECKLIST.md`

## Philosophy

1. **Plan before code** - Use /dev-docs for complex tasks
2. **MVP first** - Simple over complex, always
3. **TDD required** - Tests before implementation
4. **Ship fast** - Working code over perfect code
5. **Automate quality** - Hooks catch issues automatically

---

**Time to first value**: 5 minutes
**Time to mastery**: 1 week
**ROI**: 10x faster development with fewer bugs
