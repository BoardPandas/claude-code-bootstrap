# Installation Guide

Step-by-step instructions for setting up Claude Code Bootstrap in your project.

## Prerequisites

- Claude Code CLI installed
- Git (for cloning)
- Your project initialized

## Installation Methods

### Method 1: Clone and Copy (Recommended)

```bash
# 1. Clone this template repository
git clone https://github.com/your-username/claude-code-bootstrap.git

# 2. Navigate to your project
cd /path/to/your/project

# 3. Copy .claude folder
cp -r /path/to/claude-code-bootstrap/.claude ./

# 4. Copy documentation (optional but helpful)
cp -r /path/to/claude-code-bootstrap/docs ./

# 5. Copy and customize CLAUDE.md
cp /path/to/claude-code-bootstrap/CLAUDE.md.template ./.claude/CLAUDE.md

# 6. Copy and rename settings template
cp .claude/settings.local.json.template .claude/settings.local.json

# 7. Hooks are cross-platform JavaScript (no chmod needed)
```

### Method 2: Manual Download

1. **Download ZIP**
   - Go to GitHub repository
   - Click "Code" -> "Download ZIP"
   - Extract to temporary location

2. **Copy to Your Project**
   ```bash
   cp -r /path/to/extracted/claude-code-bootstrap/.claude /path/to/your/project/
   cp -r /path/to/extracted/claude-code-bootstrap/docs /path/to/your/project/
   ```

3. **Customize** - Follow steps 5-7 from Method 1 above

### Method 3: GitHub Template (If Available)

1. Click **"Use this template"** button on GitHub
2. Create your repository
3. Clone your new repository
4. Use it as-is or copy to existing project

## Post-Installation Configuration

### 1. Configure Your Stack

Run `/setup-stack` in Claude Code to interactively configure your project. This will:
- Ask which tech stack you're using
- Enable the relevant stack-specific skills
- Enable any optional skills you need
- Update CLAUDE.md with your stack details

**Or configure manually:**

Stack-specific skills are in `.claude/skills/` with `disable-model-invocation: true` by default. To enable one, edit its `SKILL.md` frontmatter and remove that line:

| Your Stack | Enable These Skills |
|---|---|
| Node.js + Express | `node-express/`, `tdd-jest/` |
| React + Next.js | `react-nextjs/` |
| Python + FastAPI | `python-fastapi/`, `tdd-pytest/` |
| Go + Gin | `go-gin/`, `tdd-go/` |

Core skills (backend-dev-guidelines, frontend-dev-guidelines, etc.) are universal and auto-activate for any stack.

### 2. Customize CLAUDE.md

Open `.claude/CLAUDE.md` and replace all placeholders:

```
{{PROJECT_NAME}}          -> Your actual project name
{{PROJECT_DESCRIPTION}}   -> Brief description
{{TECH_STACK}}            -> Your tech stack summary
{{BACKEND_LANGUAGE}}      -> Node.js, Python, Go, Ruby, etc.
{{BACKEND_FRAMEWORK}}     -> Express, FastAPI, Gin, Rails, etc.
{{DATABASE}}              -> PostgreSQL, MySQL, MongoDB, etc.
{{FRONTEND_FRAMEWORK}}    -> Next.js, React, Vue, Angular, etc.
{{UI_LIBRARY}}            -> Material UI, Tailwind, Bootstrap, etc.
{{NAMING_CONVENTIONS}}    -> Your naming rules
{{FILE_ORGANIZATION}}     -> Your file structure rules
```

### 3. Test the Setup

```bash
# Start Claude Code
claude-code

# Test skill activation
# Type: "Create an API endpoint"
# Skills should auto-suggest

# Test commands
# Type: /dev-docs
# Should create a planning document
```

## Verify Installation

### Check File Structure

```
your-project/
├── .claude/
│   ├── agents/              # 4 agent files
│   ├── skills/              # Each skill in its own directory
│   │   ├── backend-dev-guidelines/SKILL.md
│   │   ├── frontend-dev-guidelines/SKILL.md
│   │   ├── node-express/SKILL.md
│   │   ├── ...              # More skill directories
│   │   └── skill-developer/SKILL.md
│   ├── commands/            # Command files (also available as skills)
│   ├── hooks/               # Cross-platform JS hooks + utils/
│   ├── settings.json        # Shared project settings
│   ├── settings.local.json  # Local settings (not .template)
│   └── settings.local.json.template
├── .claudeignore            # Files excluded from Claude's context
├── .mcp.json                # MCP server configuration
├── CLAUDE.md                # Project instructions
└── docs/                    # (optional) documentation files
```

### Test Auto-Activation

1. **Test Backend Skill**
   - Type: "Create a new API endpoint"
   - Should suggest: `backend-dev-guidelines`

2. **Test Frontend Skill**
   - Type: "Create a new component"
   - Should suggest: `frontend-dev-guidelines`

3. **Test Security Skill**
   - Type: "Implement user authentication"
   - Should suggest: `security-practices`

4. **Test MVP Principles**
   - Type: "Let's refactor this to use a service layer"
   - Should suggest: `production-principles`

## Troubleshooting

### Skills Not Activating

**Problem**: Skills don't auto-suggest

**Solutions**:
1. Check each skill's `SKILL.md` has a descriptive `description` field in frontmatter
2. Verify `CLAUDE.md` exists in your project root
3. Check that `disable-model-invocation: true` is not set on skills you want auto-activated
4. Try explicit activation: `/backend-dev-guidelines`
5. Restart Claude Code session

### Hooks Not Running

**Problem**: Hooks don't execute

**Solutions**:
1. Check `.claude/settings.local.json` exists (not `.template`)
2. Verify hook paths in settings.local.json use `$CLAUDE_PROJECT_DIR`
3. Hooks are cross-platform JavaScript — no chmod needed
4. Restart Claude Code

### Commands Not Working

**Problem**: Slash commands don't work

**Solutions**:
1. Check `.claude/commands/` folder has `.md` files
2. Restart Claude Code session
3. Type `/` to see available commands
4. Verify command file format is correct

## Next Steps

1. **Read Quick Start** - `docs/00-QUICK-START.md`
2. **See Full Example** - `docs/10-COMPLETE-EXAMPLE.md`
3. **Build First Feature** - Use `/dev-docs` to plan, let skills guide you
4. **Customize Further** - Add project-specific skills, create custom agents

## Support

- **Documentation**: See `docs/` folder
- **Issues**: Report on GitHub repository

---

**Installation Time**: 15-30 minutes
**First Value**: Immediate (next feature you build)
**ROI**: 10x within first week
