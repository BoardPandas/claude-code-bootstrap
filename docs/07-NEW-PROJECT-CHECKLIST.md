# New Project Initialization Checklist

Step-by-step guide to bootstrap a new project with all lessons learned from Wellforce Platform.

## Pre-Flight Check

Before starting:
- [ ] Node.js 18+ installed
- [ ] Git initialized
- [ ] Package.json created
- [ ] Basic project structure decided
- [ ] Claude Code installed

## Phase 1: Core Setup (30 minutes)

### Step 1: Create Directory Structure

```bash
mkdir -p .claude/{agents,skills,commands,hooks/utils,dev-docs}
mkdir -p docs
mkdir -p src
mkdir -p test
```

### Step 2: Copy Claude Code Configuration

From wellforce-platform or templates:

```bash
# Core config
cp templates/CLAUDE.md .claude/CLAUDE.md
cp templates/README.md .claude/README.md
cp templates/skill-rules.json .claude/skill-rules.json

# Skills
cp templates/skills/*.md .claude/skills/

# Agents
cp templates/agents/*.md .claude/agents/

# Commands
cp templates/commands/*.md .claude/commands/

# Hooks
cp templates/hooks/*.{ts,sh,bat} .claude/hooks/
cp templates/hooks/utils/*.ts .claude/hooks/utils/
```

### Step 3: Configure Hooks

Create `.claude/settings.local.json`:

```json
{
  "hooks": {
    "userPromptSubmit": ".claude/hooks/user-prompt-submit.ts",
    "stop": ".claude/hooks/stop.sh"
  }
}
```

Make executable:
```bash
chmod +x .claude/hooks/stop.sh
```

### Step 4: Install Dependencies

```bash
npm install --save-dev \
  typescript \
  prettier \
  @types/node \
  ts-node \
  glob
```

### Step 5: Create MVP Principles Doc

```bash
cp templates/MVP_PRINCIPLES.md docs/MVP_PRINCIPLES.md
```

### Step 6: Create UIC Master List

```bash
cp templates/UIC_MASTER_LIST.md docs/UIC_MASTER_LIST.md
```

## Phase 2: Project-Specific Customization (15 minutes)

### Step 7: Customize CLAUDE.md

Edit `.claude/CLAUDE.md`:

```markdown
# [Your Project Name] - Claude Code Configuration

## 🚨 CRITICAL: MVP/PROTOTYPE MINDSET

[Keep MVP section as-is]

## 📋 Tech Stack

### Backend
- **Runtime**: [Node.js/Python/Go/etc.]
- **Framework**: [Express/FastAPI/etc.]
- **Database**: [PostgreSQL/MongoDB/etc.]

### Frontend
- **Framework**: [React/Vue/etc.]
- **UI Library**: [Material UI/Tailwind/etc.]

## 🎯 Development Workflow

[Keep workflow section, customize commands]

## 🗂️ Project Structure

```
your-project/
├── src/           # [Your structure]
├── docs/          # Documentation
└── .claude/       # Claude Code config
```

## Key Patterns

[Document your specific patterns]

## Environment Variables

[List your env vars]
```

### Step 8: Customize Skills

Edit `.claude/skills/` files to match your stack:

**Example**: If using Python instead of TypeScript:

```markdown
# Backend Dev Guidelines

## Core Principles
- Use FastAPI for APIs
- Direct SQL with psycopg2 (no ORM)
- Type hints for all functions
- Pydantic for validation

[Customize examples]
```

### Step 9: Customize skill-rules.json

Update triggers to match your file patterns:

```json
{
  "backend-dev-guidelines": {
    "fileTriggers": {
      "pathPatterns": [
        "src/**/*.py",  # Changed from *.ts
        "api/**/*.py"
      ],
      "contentPatterns": [
        "from fastapi",  # Changed from Express
        "async def"
      ]
    }
  }
}
```

### Step 10: Update Agents for Your Stack

Edit `.claude/agents/*.md` to reference your patterns:

```markdown
# Build Error Resolver

## Your Process

### Step 1: Run Build
- TypeScript: npm run build
- Python: mypy src/
- Go: go build ./...

[Customize for your stack]
```

## Phase 3: MVP Development Principles (5 minutes)

### Step 11: Team Education

Share with team:
- `docs/MVP_PRINCIPLES.md` - Read this first
- `.claude/README.md` - How to use Claude Code setup
- Quick Start guide - 5-minute walkthrough

### Step 12: Set Team Standards

Create `docs/CODING_STANDARDS.md`:

```markdown
# Coding Standards

## Non-Negotiable
1. Follow MVP principles (see MVP_PRINCIPLES.md)
2. Use TDD (tests first, then code)
3. Add UICs to all components
4. Run /build-and-fix before committing
5. Keep files under 500 lines

## Code Style
[Your preferences]

## Review Checklist
- [ ] Tests pass
- [ ] Build succeeds
- [ ] UICs added
- [ ] Follows MVP principles
- [ ] No over-engineering
```

## Phase 4: UIC System Setup (10 minutes)

### Step 13: Define Your UICs

Edit `docs/UIC_MASTER_LIST.md`:

```markdown
# UIC Master List

## Page Codes
- HOM = /home
- [Your pages]

## Element Codes
[Standard codes from template]

## Frontend UICs

### Home Page (HOM)
- HOMBUT0001: [Description]
- [Your UICs]

## Backend UICs

### API Endpoints
- API0001: POST /api/[resource] - [Description]
- [Your APIs]

### Database Tables
- TBL0001: [table_name] - [Description]
- [Your tables]
```

### Step 14: Create UIC Helper Script

```bash
cp templates/scripts/next-uic.ts scripts/next-uic.ts
```

Test:
```bash
node scripts/next-uic.ts HOMBUT
# Output: HOMBUT0001
```

## Phase 5: Validation (10 minutes)

### Step 15: Test Skills Activation

```bash
# Start Claude Code session
# Type: "Create an API endpoint"
# Should see: [Skills] backend-dev-guidelines, tdd-workflow
```

### Step 16: Test Hooks

```bash
# Make a code change
# Let Claude respond
# Should see:
#   ✅ Formatted code
#   ✅ Build passed
#   ✅ No error patterns
```

### Step 17: Test Commands

```bash
/dev-docs
# Should create:
#   .claude/dev-docs/[task]-plan.md
#   .claude/dev-docs/[task]-context.md
#   .claude/dev-docs/[task]-tasks.md
```

### Step 18: Test Agents

```
"Use the mvp-enforcer agent to review this design"
# Should get MVP analysis
```

## Phase 6: First Feature (30 minutes)

### Step 19: Plan with /dev-docs

```
"I want to add [feature]"
Claude: "Should I use strategic-plan-architect to plan this?"
You: "Yes"
```

Review plan, approve.

### Step 20: Implement with TDD

```
1. Write failing test
2. Implement to pass
3. Refactor if needed
4. Add UICs
5. Run /build-and-fix
```

### Step 21: Verify Quality

```
/code-review
# Should get architecture review
# Fix any issues found
```

### Step 22: Ship It

```bash
git add .
git commit -m "Add [feature]

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"
git push
```

## Phase 7: Documentation (10 minutes)

### Step 23: Create README

```markdown
# [Project Name]

## Quick Start

[Setup instructions]

## Development

We use Claude Code with:
- MVP-first principles
- TDD workflow
- Universal ID Convention (UIC)
- Auto-formatting hooks

See `.claude/README.md` for details.

## Commands

- `/dev-docs` - Plan features
- `/build-and-fix` - Fix errors
- `/code-review` - Review quality
```

### Step 24: Create CONTRIBUTING

```markdown
# Contributing

## Setup

1. Install dependencies: npm install
2. Configure hooks: [instructions]
3. Read MVP_PRINCIPLES.md

## Workflow

1. Plan with `/dev-docs`
2. Write tests first (TDD)
3. Implement simply (MVP)
4. Add UICs
5. Run `/build-and-fix`
6. Submit PR

## Standards

See `docs/CODING_STANDARDS.md`
```

### Step 25: Create CHANGELOG

```markdown
# Changelog

## [Unreleased]

### Added
- Initial project setup with Claude Code
- MVP principles documentation
- UIC system
- TDD workflow

[Keep updated]
```

## Success Criteria

You're ready to ship when:
- [ ] Skills auto-activate
- [ ] Hooks run automatically
- [ ] Commands work
- [ ] Agents can be invoked
- [ ] First feature shipped using TDD
- [ ] Team understands MVP principles
- [ ] UIC system in place
- [ ] Documentation complete

## Common Gotchas

### Hook Permissions
```bash
# If hooks don't run:
chmod +x .claude/hooks/stop.sh
```

### TypeScript Config
```json
// tsconfig.json needs:
{
  "include": ["src/**/*", ".claude/hooks/**/*"],
  "exclude": ["node_modules"]
}
```

### Prettier Config
```json
// .prettierrc
{
  "singleQuote": true,
  "trailingComma": "es5",
  "tabWidth": 2,
  "semi": true
}
```

### Git Hooks (Optional)
```bash
# Add pre-commit hook
cp .claude/hooks/stop.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

## Customization Examples

### Python Project

Changes needed:
1. Update `backend-dev-guidelines.md` for FastAPI/Flask
2. Change build checker to run `mypy` instead of `tsc`
3. Update file patterns in `skill-rules.json` to `*.py`
4. Adjust formatting to use `black` instead of `prettier`

### Go Project

Changes needed:
1. Create `go-backend-guidelines.md` skill
2. Change build checker to run `go build`
3. Update patterns to `*.go`
4. Use `gofmt` for formatting

### Mobile App (React Native)

Changes needed:
1. Update `frontend-dev-guidelines.md` for React Native
2. Add `mobile-dev-guidelines.md` skill
3. Update build checker for mobile builds
4. Add platform-specific patterns

## Next Steps

After initial setup:

1. **Week 1**: Ship first MVP feature using the system
2. **Week 2**: Refine skills based on actual usage
3. **Week 3**: Add custom agents for your domain
4. **Month 2**: Iterate on patterns, update docs
5. **Month 3**: Measure velocity improvement

## Support

- Read the full documentation in `test/` folder
- Review Wellforce Platform as reference
- Ask team members who've used the system
- Iterate and improve based on learnings

---

**Total Setup Time**: 2 hours
**Time to First Feature**: 4 hours
**ROI**: 10x within first week

Follow this checklist exactly on your first project. After that, you'll know what to customize for each new project.
