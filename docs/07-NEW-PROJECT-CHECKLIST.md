# New Project Initialization Checklist

Step-by-step guide to bootstrap a new project with battle-tested best practices.

## Pre-Flight Check

Before starting:
- [ ] Your project's language/framework installed
- [ ] Git initialized
- [ ] Basic project structure decided
- [ ] Claude Code installed

## Phase 1: Core Setup (15 minutes)

### Step 1: Copy Claude Code Configuration

```bash
# Copy .claude folder from bootstrap
cp -r /path/to/claude-code-bootstrap/.claude /path/to/your/project/

# Copy docs (optional)
cp -r /path/to/claude-code-bootstrap/docs /path/to/your/project/
```

### Step 2: Configure for Your Stack

Run `/setup-stack` in Claude Code to interactively configure, or manually:

**Keep stack files matching your project:**

| Your Stack | Keep in `skills/stacks/` |
|---|---|
| Node.js + Express | `node-express.md`, `tdd-jest.md` |
| React + Next.js | `react-nextjs.md` |
| Python + FastAPI | `python-fastapi.md`, `tdd-pytest.md` |
| Go + Gin | `go-gin.md`, `tdd-go.md` |

Remove stack files you don't use.

### Step 3: Configure Hooks

Copy and rename settings template:
```bash
cp .claude/settings.local.json.template .claude/settings.local.json
```

Make executable (Linux/Mac):
```bash
chmod +x .claude/hooks/stop.sh
```

### Step 4: Customize CLAUDE.md

```bash
cp CLAUDE.md.template .claude/CLAUDE.md
```

Edit `.claude/CLAUDE.md` and replace all placeholders:

```
{{PROJECT_NAME}}          -> Your project name
{{TECH_STACK}}            -> Your tech stack
{{BACKEND_LANGUAGE}}      -> Node.js, Python, Go, etc.
{{BACKEND_FRAMEWORK}}     -> Express, FastAPI, Gin, etc.
{{DATABASE}}              -> PostgreSQL, MySQL, etc.
{{FRONTEND_FRAMEWORK}}    -> Next.js, React, Vue, etc.
{{UI_LIBRARY}}            -> Material UI, Tailwind, etc.
```

## Phase 2: Project-Specific Customization (15 minutes)

### Step 5: Customize skill-rules.json (Optional)

Update triggers to match your file patterns:

```json
{
  "backend-dev-guidelines": {
    "fileTriggers": {
      "pathPatterns": [
        "src/**/*.py",
        "api/**/*.py"
      ]
    }
  }
}
```

### Step 6: Enable Optional Skills

Check `skills/optional/` for domain-specific skills:
- `UIC_Guidelines.md` - Universal ID Convention (for web UI projects)
- `go-desktop-agent-guidelines.md` - Go desktop apps
- `openai-api-expert.md` - LLM integration
- `rest-api-expert.md` - REST API design

### Step 7: Set Team Standards

Create `docs/CODING_STANDARDS.md`:

```markdown
# Coding Standards

## Non-Negotiable
1. Follow MVP principles (simple > complex)
2. Use TDD (tests first, then code)
3. Run /build-and-fix before committing
4. Keep files under 500 lines

## Code Style
[Your preferences]

## Review Checklist
- [ ] Tests pass
- [ ] Build succeeds
- [ ] Follows MVP principles
- [ ] No over-engineering
```

## Phase 3: Validation (10 minutes)

### Step 8: Test Skills Activation

```
# Start Claude Code session
# Type: "Create an API endpoint"
# Should see: [Skills] backend-dev-guidelines, tdd-workflow
```

### Step 9: Test Hooks

```
# Make a code change
# Let Claude respond
# Should see:
#   Formatted code
#   Build passed
#   No error patterns
```

### Step 10: Test Commands

```
/dev-docs
# Should create planning documents
```

## Phase 4: First Feature (30 minutes)

### Step 11: Plan with /dev-docs

```
"I want to add [feature]"
Claude: "Should I use strategic-plan-architect to plan this?"
You: "Yes"
```

### Step 12: Implement with TDD

1. Write failing test
2. Implement to pass
3. Refactor if needed
4. Run /build-and-fix

### Step 13: Ship It

```bash
git add .
git commit -m "Add [feature]"
git push
```

## Success Criteria

You're ready to ship when:
- [ ] Skills auto-activate
- [ ] Hooks run automatically
- [ ] Commands work
- [ ] Agents can be invoked
- [ ] First feature shipped using TDD
- [ ] Team understands MVP principles

## Common Gotchas

### Hook Permissions
```bash
# If hooks don't run (Linux/Mac):
chmod +x .claude/hooks/stop.sh
```

### Hooks Need settings.local.json
Make sure you copied the template:
```bash
cp .claude/settings.local.json.template .claude/settings.local.json
```

## Next Steps

After initial setup:

1. **Week 1**: Ship first MVP feature using the system
2. **Week 2**: Refine skills based on actual usage
3. **Week 3**: Add custom agents for your domain
4. **Month 2**: Iterate on patterns, update docs

---

**Total Setup Time**: 1 hour
**Time to First Feature**: 2 hours
**ROI**: 10x within first week

Follow this checklist exactly on your first project. After that, you'll know what to customize for each new project.
