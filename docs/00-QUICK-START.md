# Claude Code Bootstrap - Quick Start

Get any project Claude Code-ready in 5 minutes.

## What This Is

A universal system for making Claude Code incredibly effective from day one. Battle-tested on real production applications. Works with any language or framework.

## What You Get

- **Skills System**: Auto-activating guidelines based on context
- **Specialized Agents**: Quality control and task automation
- **Custom Commands**: Workflow shortcuts
- **Hooks**: Auto-format, build check, error detection
- **UIC System**: Universal component naming convention
- **MVP Principles**: Ship fast, avoid over-engineering
- **TDD Workflow**: Test-driven development patterns

## Installation (5 Minutes)

### Step 1: Copy the `.claude` folder structure

```bash
mkdir -p .claude/{agents,skills,commands,hooks/utils,dev-docs}
```

### Step 2: Download Template

Get the universal Claude Code template from the repository:
```bash
# Clone or download the template
git clone https://github.com/your-org/claude-code-bootstrap .claude-template

# Or download from releases
curl -L https://github.com/your-org/claude-code-bootstrap/archive/main.zip -o template.zip
unzip template.zip
```

### Step 3: Copy Core Skills

Copy the 7 universal skills that work with any stack:
```bash
cp .claude-template/skills/backend-dev-guidelines.md ./.claude/skills/
cp .claude-template/skills/frontend-dev-guidelines.md ./.claude/skills/
cp .claude-template/skills/production-principles.md ./.claude/skills/
cp .claude-template/skills/tdd-workflow.md ./.claude/skills/
cp .claude-template/skills/UIC_Guidelines.md ./.claude/skills/
cp .claude-template/skills/security-practices.md ./.claude/skills/
cp .claude-template/skills/skill-developer.md ./.claude/skills/

# Copy activation rules
cp .claude-template/skill-rules.json ./.claude/skill-rules.json
```

### Step 4: Copy Core Agents

Copy the 4 universal automation agents:
```bash
cp .claude-template/agents/strategic-plan-architect.md ./.claude/agents/
cp .claude-template/agents/build-error-resolver.md ./.claude/agents/
cp .claude-template/agents/code-architecture-reviewer.md ./.claude/agents/
cp .claude-template/agents/production-principles-enforcer.md ./.claude/agents/
```

### Step 5: Copy Commands

```bash
cp .claude-template/commands/*.md ./.claude/commands/
```

### Step 6: Setup Hooks (optional but powerful)

```bash
# Copy hooks
cp .claude-template/hooks/*.{ts,sh,bat} ./.claude/hooks/
cp -r .claude-template/hooks/utils ./.claude/hooks/

# Make executable (Linux/Mac)
chmod +x .claude/hooks/stop.sh
```

### Step 7: Configure Claude Code

Create `.claude/settings.local.json`:

```json
{
  "hooks": {
    "userPromptSubmit": ".claude/hooks/user-prompt-submit.ts",
    "stop": ".claude/hooks/stop.sh"
  }
}
```

### Step 8: Customize for your stack

1. **Create `.claude/CLAUDE.md`** - Project-specific configuration:
   ```markdown
   # My Project - Claude Code Configuration

   ## Tech Stack
   - Language: [Python/Node.js/Go/Ruby/etc.]
   - Framework: [FastAPI/Express/Gin/Rails/etc.]
   - Database: [PostgreSQL/MongoDB/etc.]

   ## Project-Specific Guidelines
   [Add your patterns and conventions here]
   ```

2. **Update skills for your stack** - Adapt backend/frontend guidelines:
   - See "Stack Adapters" section in `01-CLAUDE-CODE-SETUP.md`
   - Python: Use FastAPI/Django patterns
   - Go: Use standard library patterns
   - Ruby: Use Rails conventions
   - etc.

3. **Test** - Type "Create an API endpoint" (should trigger skills)

## What Happens Now

### Skills Auto-Activate
- Type "backend" → Backend guidelines suggested
- Type "component" → Frontend guidelines suggested
- Type "refactor" → MVP principles enforced

### Agents Available
- `/dev-docs` - Create implementation plans
- `/build-and-fix` - Fix all TypeScript errors
- `/code-review` - Review against best practices

### Hooks Run Automatically
- **Before prompt**: Analyzes context, suggests skills
- **After response**: Formats code, checks build, detects errors

## Next Steps

1. Read `01-CLAUDE-CODE-SETUP.md` for detailed explanation
2. Read `02-UIC-SYSTEM.md` to implement universal IDs
3. Read `03-MVP-PRINCIPLES.md` for development philosophy
4. Read `04-SKILLS-SYSTEM.md` to understand skills
5. Read `10-COMPLETE-EXAMPLE.md` for full working example

## Quick Reference

### Common Commands
```bash
/dev-docs              # Create implementation plan
/dev-docs-update       # Update plan with progress
/build-and-fix         # Fix all build errors
/code-review           # Review code quality
```

### Skill Invocation
```
"Follow backend-dev-guidelines for this API"
"Apply mvp-principles to this design"
"Use tdd-workflow for this feature"
```

### Agent Invocation
```
"Use the strategic-plan-architect agent to plan this feature"
"Use the mvp-enforcer agent to review this design"
"Use the build-error-resolver agent to fix these errors"
```

## Troubleshooting

### Skills not activating?
- Check `.claude/skill-rules.json` exists
- Verify keywords match your prompt
- Try explicit: "Use backend-dev-guidelines skill"

### Hooks not running?
- Check `.claude/settings.local.json` exists
- Verify paths are correct
- Make stop.sh executable: `chmod +x .claude/hooks/stop.sh`

### Commands not working?
- Check `.claude/commands/` has .md files
- Restart Claude Code session
- Try typing `/` to see available commands

## Success Metrics

You'll know it's working when:
- Skills auto-suggest based on your prompts
- Code stays formatted without asking
- Build errors caught immediately
- Claude follows MVP principles automatically
- Planning happens before implementation

## Philosophy

This system enforces:
1. **Plan before code** - Use /dev-docs for complex tasks
2. **MVP first** - Simple over complex, always
3. **TDD required** - Tests before implementation
4. **Ship fast** - Working code over perfect code
5. **Automate quality** - Hooks catch issues automatically

## Resources

- **Full Docs**: Read files 01-10 in this folder
- **Core Skills**: `.claude/skills/` (7 universal skills)
- **Core Agents**: `.claude/agents/` (4 specialized agents)
- **Stack Adapters**: See `01-CLAUDE-CODE-SETUP.md` for Python/Go/Ruby examples

---

**Time to first value**: 5 minutes
**Time to mastery**: 1 week
**ROI**: 10x faster development with fewer bugs

Start with the quick setup above, then read the detailed guides as needed.
