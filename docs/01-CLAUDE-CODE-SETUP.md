# Claude Code Complete Setup Guide

Comprehensive guide to setting up Claude Code for maximum effectiveness.

## Table of Contents

1. [Directory Structure](#directory-structure)
2. [Core Configuration](#core-configuration)
3. [Skills System](#skills-system)
4. [Agents System](#agents-system)
5. [Commands System](#commands-system)
6. [Hooks System](#hooks-system)
7. [Integration](#integration)
8. [Customization](#customization)

## Directory Structure

```
your-project/
├── .claude/                    # Claude Code configuration
│   ├── CLAUDE.md              # Main config (auto-loaded)
│   ├── README.md              # Documentation
│   ├── skill-rules.json       # Skill auto-activation rules
│   ├── settings.local.json    # Local settings (hooks config)
│   │
│   ├── agents/                # Specialized agents
│   │   ├── strategic-plan-architect.md
│   │   ├── build-error-resolver.md
│   │   ├── code-architecture-reviewer.md
│   │   └── mvp-enforcer.md
│   │
│   ├── skills/                # Domain-specific guidelines
│   │   ├── backend-dev-guidelines.md
│   │   ├── frontend-dev-guidelines.md
│   │   ├── mvp-principles.md
│   │   ├── tdd-workflow.md
│   │   ├── database-operations.md
│   │   ├── security-practices.md
│   │   ├── openai-api-expert.md
│   │   ├── rest-api-expert.md
│   │   ├── prompt-engineering-expert.md
│   │   ├── go-desktop-agent-guidelines.md
│   │   └── skill-developer.md
│   │
│   ├── commands/              # Custom slash commands
│   │   ├── dev-docs.md
│   │   ├── dev-docs-update.md
│   │   ├── build-and-fix.md
│   │   ├── code-review.md
│   │   └── test-api.md
│   │
│   ├── hooks/                 # Automation hooks
│   │   ├── user-prompt-submit.ts
│   │   ├── stop.sh
│   │   ├── stop.bat
│   │   ├── README.md
│   │   └── utils/
│   │       ├── file-tracker.ts
│   │       ├── build-checker.ts
│   │       └── error-pattern-checker.ts
│   │
│   └── dev-docs/             # Task documentation (created by /dev-docs)
│       ├── [task]-plan.md
│       ├── [task]-context.md
│       └── [task]-tasks.md
│
├── docs/                      # Project documentation
│   ├── MVP_PRINCIPLES.md
│   ├── UIC_MASTER_LIST.md
│   └── ...
│
└── [your project files]
```

## Core Configuration

### CLAUDE.md - The Brain

This is the main configuration file that Claude Code automatically loads. It should contain:

1. **Project Overview**
   - Tech stack
   - Architecture summary
   - Key patterns

2. **Development Guidelines**
   - MVP principles
   - Code style
   - File structure

3. **Quick Reference**
   - Common commands
   - Environment setup
   - Deployment info

4. **Links to Skills/Agents**
   - When to use what
   - Available tools

**Example Structure:**

```markdown
# Project Name - Claude Code Configuration

## Critical Mindset
- MVP first, always
- Ship working code, iterate fast
- Simple over complex

## Tech Stack
- Backend: [your stack]
- Frontend: [your stack]
- Database: [your database]

## Development Workflow
1. Plan with /dev-docs
2. Write tests first (TDD)
3. Implement simply
4. Run /build-and-fix
5. Ship it

## Skills Available
- backend-dev-guidelines
- frontend-dev-guidelines
- mvp-principles
- tdd-workflow

## Custom Commands
- /dev-docs - Create implementation plan
- /build-and-fix - Fix all errors
- /code-review - Review quality

## Decision Framework
Before any decision, ask:
1. Will this work TODAY?
2. Will 10 users break this?
3. Can I explain this in 30 seconds?
```

### README.md - The Guide

Documentation about the Claude Code setup itself. Should explain:
- What each component does
- How to use commands/agents/skills
- Examples and workflows

### settings.local.json - Local Config

Project-specific settings, primarily for hooks:

```json
{
  "hooks": {
    "userPromptSubmit": ".claude/hooks/user-prompt-submit.ts",
    "stop": ".claude/hooks/stop.sh"
  },
  "customSettings": {
    "autoFormat": true,
    "buildCheck": true,
    "lintOnSave": false
  }
}
```

## Skills System

Skills are domain-specific guidelines that Claude Code can reference.

### What Makes a Good Skill

1. **Focused** - One domain (backend, frontend, testing)
2. **Concise** - Under 500 lines (progressive disclosure)
3. **Actionable** - Clear do's and don'ts
4. **Examples** - Show good vs bad code

### Skill Structure

```markdown
# Skill Name

Brief description (1-2 sentences)

## Core Principles

- Principle 1
- Principle 2
- Principle 3

## Patterns to Use

### Pattern 1
Description and example

## Patterns to Avoid

### Anti-pattern 1
Why it's bad and what to do instead

## Examples

### Good Example
```code
// Good code
```

### Bad Example
```code
// Bad code - why it's bad
```

## Quick Reference

- Checklist item 1
- Checklist item 2
```

### Skill Auto-Activation

Configure in `skill-rules.json`:

```json
{
  "skill-name": {
    "type": "domain|quality",
    "enforcement": "suggest|require",
    "priority": "critical|high|medium|low",
    "description": "When this skill applies",
    "promptTriggers": {
      "keywords": ["keyword1", "keyword2"],
      "intentPatterns": [
        "(create|build).*(feature|component)"
      ]
    },
    "fileTriggers": {
      "pathPatterns": ["src/**/*.ts"],
      "contentPatterns": ["import.*react"]
    }
  }
}
```

## Agents System

Agents are specialized AI personas for specific tasks.

### When to Use Agents vs Skills

- **Skills**: Guidelines to follow (passive)
- **Agents**: Active task execution (proactive)

### Agent Structure

```markdown
# Agent Name

You are a [role]. Your mission is to [objective].

## Your Capabilities

- Capability 1
- Capability 2

## Your Process

1. Step 1
2. Step 2
3. Step 3

## Guidelines

### Always Do
- Guideline 1
- Guideline 2

### Never Do
- Anti-pattern 1
- Anti-pattern 2

## Output Format

[Specify expected format]

## Examples

[Show example interactions]
```

### Essential Agents

1. **strategic-plan-architect** - Create implementation plans
2. **build-error-resolver** - Fix TypeScript/compile errors
3. **code-architecture-reviewer** - Review for best practices
4. **mvp-enforcer** - Prevent over-engineering

## Commands System

Custom slash commands for common workflows.

### Command Structure

Commands are markdown files in `.claude/commands/` that expand into prompts.

**File: `.claude/commands/my-command.md`**

```markdown
# My Command

You are about to [what this command does].

## Steps to Follow

1. First, [step 1]
2. Then, [step 2]
3. Finally, [step 3]

## Output Format

[Expected format]

## Guidelines

- Use [specific guideline]
- Avoid [anti-pattern]

## Example

[Show example]
```

### Usage

```bash
/my-command
```

Claude Code will expand this into the full prompt and execute.

### Essential Commands

1. **dev-docs** - Create 3-file implementation plan
2. **dev-docs-update** - Update docs with progress
3. **build-and-fix** - Systematically fix all errors
4. **code-review** - Review against best practices

## Hooks System

Hooks run automatically during Claude Code sessions.

### Available Hooks

1. **userPromptSubmit** - Runs before Claude processes your message
2. **stop** - Runs after Claude completes response

### userPromptSubmit Hook

**Purpose**: Analyze prompt and inject skill suggestions

**File**: `.claude/hooks/user-prompt-submit.ts`

```typescript
// Pseudo-code structure
function userPromptSubmit(prompt: string) {
  // 1. Load skill-rules.json
  // 2. Match prompt against triggers
  // 3. Inject skill activation reminders
  // 4. Return modified prompt
}
```

### stop Hook

**Purpose**: Clean up after Claude's response

**File**: `.claude/hooks/stop.sh` (or stop.bat for Windows)

```bash
#!/bin/bash

# 1. Track modified files
node .claude/hooks/utils/file-tracker.ts

# 2. Auto-format changed files
npx prettier --write [changed-files]

# 3. Run build check
node .claude/hooks/utils/build-checker.ts

# 4. Check for common errors
node .claude/hooks/utils/error-pattern-checker.ts
```

### Hook Benefits

- **Consistency**: Code always formatted
- **Quality**: Errors caught immediately
- **Context**: Skills activated automatically
- **Efficiency**: No manual cleanup needed

## Integration

### With Git

Add to `.gitignore`:

```
.claude/dev-docs/
.claude/settings.local.json
```

Commit everything else so team benefits.

### With CI/CD

Run hook checks in CI:

```yaml
# .github/workflows/quality.yml
- name: Format check
  run: npx prettier --check .

- name: Build check
  run: npm run build

- name: Pattern check
  run: node .claude/hooks/utils/error-pattern-checker.ts
```

### With IDE

Most checks run automatically via hooks, but you can also:

- Setup format-on-save in VS Code
- Configure TypeScript checking
- Enable ESLint integration

## Customization

### Adding New Skills

1. Create `.claude/skills/new-skill.md`
2. Add entry to `skill-rules.json`
3. Test with relevant prompt

### Adding New Agents

1. Create `.claude/agents/new-agent.md`
2. Document when to use it in `CLAUDE.md`
3. Test invocation

### Adding New Commands

1. Create `.claude/commands/new-command.md`
2. Test with `/new-command`
3. Document in `README.md`

### Customizing Hooks

Edit `.claude/hooks/stop.sh`:

```bash
# Add custom checks
npm run lint
npm test -- --changed
node scripts/custom-validation.js
```

## Best Practices

### Do

- Keep skills under 500 lines
- Use progressive disclosure (link to details)
- Test skill activation with keywords
- Document why, not just what
- Update CLAUDE.md regularly

### Don't

- Duplicate information across files
- Create too many skills (10-15 max)
- Make agents too generic
- Forget to chmod +x stop.sh
- Commit sensitive info

## Validation

### Check Skills Work

```bash
# Trigger backend skill
"Create an API endpoint"

# Trigger frontend skill
"Create a React component"

# Trigger MVP principles
"Let's create a service layer"
```

### Check Hooks Work

```bash
# Make a change
# After Claude responds, check:
- Code is formatted
- Build passes
- No obvious errors
```

### Check Commands Work

```bash
/dev-docs
# Should create 3 files in dev-docs/

/build-and-fix
# Should run build and fix errors
```

## Troubleshooting

### Skills Not Activating

- Check `skill-rules.json` syntax
- Verify keywords match
- Try explicit: "Use skill-name skill"

### Hooks Not Running

- Check `settings.local.json` exists
- Verify file paths are correct
- Check file permissions (chmod +x)
- Check hook logs for errors

### Commands Not Found

- Check file is in `.claude/commands/`
- File must end in `.md`
- Restart Claude Code session

### Build Checks Failing

- Verify build command is correct
- Check Node.js/npm installed
- Ensure project dependencies installed

## Next Steps

1. Read `02-UIC-SYSTEM.md` for universal ID convention
2. Read `03-MVP-PRINCIPLES.md` for development philosophy
3. Read `04-SKILLS-SYSTEM.md` for skill details
4. Read `10-COMPLETE-EXAMPLE.md` for working example

## Resources

- Claude Code Docs: Official documentation
- Reddit Post: "Claude Code is a Beast"

---

This setup takes 30 minutes to implement but saves hours daily.
