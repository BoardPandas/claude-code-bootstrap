---
name: skill-developer
description: Meta-skill for creating new Claude Code skills. Use when asked to create, update, or improve a skill, or when discussing skill structure and best practices.
---

# Skill Developer

Meta-skill for creating high-quality Claude Code skills with progressive disclosure and proper structure.

## Philosophy

**Skills are living documentation that actively guides development, not passive reference material.**

From the Reddit post: *"Keep skills under 500 lines with progressive disclosure through resource files."*

## Skill Structure (The Right Way)

### Main Skill File (300-400 lines max)

```markdown
# Skill Name

Brief description (1-2 sentences)

## Core Principles
[3-5 key principles]

## Quick Reference
[Most common patterns and examples]

## Common Patterns
[5-10 practical examples with code]

## Best Practices
[Key do's and don'ts]

## Resources
See supporting documentation:
- [Detailed API Reference](./resources/skill-name/api-reference.md)
- [Advanced Patterns](./resources/skill-name/advanced.md)
- [Troubleshooting Guide](./resources/skill-name/troubleshooting.md)
```

### Skill Directory Structure (v2.1.38)

Each skill lives in its own directory with `SKILL.md` as the entrypoint:

```
.claude/skills/
└── skill-name/
    ├── SKILL.md           # Main instructions (required, 300-500 lines)
    ├── reference.md       # Detailed API docs (optional)
    ├── examples.md        # Usage examples (optional)
    └── scripts/
        └── helper.sh      # Script Claude can execute (optional)
```

## Creating a New Skill (Step-by-Step)

### Step 1: Define Purpose and Scope

Ask:
1. **What problem does this skill solve?**
2. **Who will use it?** (You, team, specific role)
3. **When should it activate?** (Keywords, file patterns)
4. **What's the minimum viable skill?** (Don't over-engineer)

**Example:**
```
Problem: Backend developers keep using ORMs instead of direct SQL
User: Any developer working on backend routes
Trigger: Keywords like "database", "query", "sql", "backend"
MVP: Core patterns with examples, link to full SQL reference
```

### Step 2: Structure Your Skill

**Main File Components:**

1. **Title & Description** (2-3 lines)
   - What this skill covers
   - When to use it

2. **Core Principles** (5-10 bullet points)
   - Key concepts to remember
   - Non-negotiable rules

3. **Quick Reference** (1-2 code examples)
   - Most common use case
   - Copy-paste ready

4. **Common Patterns** (5-10 examples)
   - Practical scenarios
   - Good vs Bad examples

5. **Best Practices** (Do's and Don'ts)
   - What to do
   - What to avoid

6. **Resources** (Links to deeper docs)
   - Advanced topics
   - Full API reference
   - Troubleshooting

### Step 3: Write Clear Examples

#### ✅ GOOD Example Structure
```markdown
### Creating a New API Endpoint

**Pattern:** (pseudocode — adapt to your framework)

1. Parse and validate input (early return on invalid)
2. Execute database query with parameterized values
3. Return result with appropriate status code
4. Catch errors and return user-friendly message

**Key Points:**
- Inline validation (no middleware for MVP)
- Direct SQL query (no ORM)
- Consistent response format
- Proper status codes

For concrete code examples, reference the appropriate stack skill directory.
```

#### ❌ BAD Example Structure
```markdown
### Creating Endpoints

You can create endpoints. Here's an example:
[Complex code without explanation]
```

**Problems:**
- No context
- No explanation
- Too complex for quick reference

### Step 4: Add Progressive Disclosure

**Main file stays light:**
```markdown
## Database Queries

Use direct SQL with parameterized queries.

### Basic Query
[Simple example in your project's language — see stack skill directories for concrete examples]

### Detailed Reference
For complex queries, transactions, and optimization:
- See: [Database Patterns Reference](./resources/backend-dev/database-patterns.md)
```

**Resource file has details:**
```markdown
# Database Patterns Reference

## Complex Joins
[Detailed examples]

## Transactions
[Detailed examples]

## Query Optimization
[Detailed guide]
```

### Step 5: Configure Auto-Activation via Frontmatter

Claude Code uses the `description` field in SKILL.md frontmatter to decide when to auto-activate a skill. Write a clear, keyword-rich description:

```yaml
---
name: my-skill
description: What this skill does. Use when [specific scenarios and keywords that should trigger activation].
---
```

**Example descriptions (good):**
```yaml
# Good - specific scenarios and keywords
description: Backend API development principles. Use when working on backend routes, API endpoints, handlers, controllers, database queries, middleware, or server-side code.

# Good - clear trigger context
description: Security principles for production applications. Use when implementing authentication, authorization, input validation, secrets management, or handling sensitive data.
```

**Example descriptions (bad):**
```yaml
# Bad - too vague, won't trigger correctly
description: Development guidelines

# Bad - too narrow, will miss relevant contexts
description: Express.js route handlers
```

**Controlling invocation:**

| Frontmatter | You can invoke | Claude can invoke |
|---|---|---|
| (default) | Yes | Yes |
| `disable-model-invocation: true` | Yes | No |
| `user-invocable: false` | No | Yes |

Use `disable-model-invocation: true` for action commands (deploy, commit) and stack-specific skills that users opt into via `/setup-stack`.

## Skill Writing Best Practices

### ✅ DO This

1. **Start with Why**
   ```markdown
   # Skill Name
   Why this matters: [Brief explanation]
   ```

2. **Use Clear Headers**
   ```markdown
   ## Section Name (What It Covers)
   ### Subsection (Specific Topic)
   ```

3. **Show Good vs Bad**
   ```markdown
   ❌ BAD - Why it's wrong
   [bad code]

   ✅ GOOD - Why it's right
   [good code]
   ```

4. **Include Context**
   ```markdown
   // Good: Explain WHY
   // Use direct SQL for MVP speed and simplicity
   const result = await pool.query('SELECT * FROM users');
   ```

5. **Link to Resources**
   ```markdown
   For advanced usage, see: [Advanced Patterns](./resources/...)
   ```

6. **Keep Examples Practical**
   ```markdown
   // Real-world scenario
   app.post('/api/v1/tickets', async (req, res) => {
     // Actual working code
   });
   ```

### ❌ DON'T Do This

1. **Don't Wall-of-Text**
   ```markdown
   ❌ BAD: Huge paragraphs with no breaks
   ```

2. **Don't Be Vague**
   ```markdown
   ❌ BAD: "You should probably use good practices"
   ✅ GOOD: "Always validate input before database queries"
   ```

3. **Don't Show Only Code**
   ```markdown
   ❌ BAD: [100 lines of code, no explanation]
   ✅ GOOD: [20 lines with clear comments and context]
   ```

4. **Don't Duplicate Existing Skills**
   ```markdown
   ❌ BAD: Creating "backend-api-dev.md" when "backend-dev.md" exists
   ✅ GOOD: Extend existing skill or create focused sub-skill
   ```

5. **Don't Create Monster Skills**
   ```markdown
   ❌ BAD: 1,500-line "everything-backend.md"
   ✅ GOOD: 400-line main + 10 focused resource files
   ```

## Skill Types

### 1. Domain Skills (Technical)
**Purpose:** Guide development in specific technology areas

**Examples:**
- `backend-dev-guidelines.md`
- `frontend-dev-guidelines.md`
- `openai-api-expert.md`
- `rest-api-expert.md`

**When to Create:**
- New technology stack introduced
- Team keeps making same mistakes
- Complex API with many patterns

### 2. Quality Skills (Process)
**Purpose:** Enforce standards and best practices

**Examples:**
- `mvp-principles.md`
- `tdd-workflow.md`
- `code-review-checklist.md`

**When to Create:**
- Team repeatedly over-engineers
- Consistency issues across codebase
- Quality standards need enforcement

### 3. Tool Skills (Utility)
**Purpose:** Guide usage of specific tools

**Examples:**
- `docker-deployment.md`
- `git-workflow.md`
- `testing-patterns.md`

**When to Create:**
- Complex tool with many options
- Team unfamiliar with tool
- Tool misuse causes issues

## Testing Your Skill

### Manual Test

Test your skill by invoking it directly and by checking auto-activation:

1. **Direct invocation**: Type `/skill-name` to verify it works as expected
2. **Auto-activation**: Ask Claude something matching your description and check if the skill loads
3. **Skill listing**: Ask "What skills are available?" to verify your skill appears

### Verification Checklist

- [ ] SKILL.md is in its own directory (`.claude/skills/skill-name/SKILL.md`)
- [ ] YAML frontmatter has `name` and `description` fields
- [ ] Description includes activation keywords/scenarios
- [ ] SKILL.md under 500 lines (ideally 300-400)
- [ ] Examples are clear and copy-paste ready
- [ ] Good vs Bad comparisons included
- [ ] Progressive disclosure (supporting files for details)
- [ ] No duplication with existing skills
- [ ] Follows project conventions (MVP, TDD, etc.)

## Common Patterns

### Pattern 1: Code-Heavy Skill
```markdown
# Skill Name

## Quick Start
[Minimal example]

## Common Patterns
### Pattern 1
[Example with explanation]

### Pattern 2
[Example with explanation]

## Resources
- [Full API Reference](./resources/skill/api.md)
- [Advanced Examples](./resources/skill/advanced.md)
```

### Pattern 2: Concept-Heavy Skill
```markdown
# Skill Name

## Core Principles
- Principle 1: [Explanation]
- Principle 2: [Explanation]

## Applying Principles
### Scenario 1
[How to apply]

### Scenario 2
[How to apply]

## Resources
- [Deep Dive](./resources/skill/deep-dive.md)
```

### Pattern 3: Checklist Skill
```markdown
# Skill Name

## When to Use
[Trigger scenarios]

## Checklist

### Category 1
- [ ] Check 1
- [ ] Check 2

### Category 2
- [ ] Check 1
- [ ] Check 2

## Resources
- [Detailed Guide](./resources/skill/guide.md)
```

## Maintenance

### When to Update Skills

1. **New patterns emerge**
   - Add to main file if common
   - Create resource file if complex

2. **Mistakes keep happening**
   - Add explicit "Don't do this" section
   - Update auto-activation rules

3. **Technology changes**
   - Update examples
   - Deprecate old patterns
   - Add migration guide if needed

4. **Skill gets too large**
   - Extract advanced topics to resources
   - Keep main file lean
   - Add clear navigation

### Skill Deprecation

```markdown
# Old Skill Name

⚠️ **DEPRECATED**: This skill has been superseded by [New Skill](./new-skill.md)

See migration guide: [Migration](./resources/old-skill/migration.md)
```

## Examples

### Good Skill Structure
```markdown
# Backend Dev Guidelines

Guidelines for backend API development.

## Tech Stack
[Quick reference]

## MVP Principles
[Core rules]

## Route Structure
[Common pattern with example]

## Database Queries
[Direct SQL examples]

## Resources
- [Advanced SQL Patterns](./resources/backend/sql-advanced.md)
- [API Security Guide](./resources/backend/security.md)
```

### Resource File Example
```markdown
# Advanced SQL Patterns

Referenced from: [Backend Dev Guidelines](../../backend-dev-guidelines.md)

## Complex Joins
[Detailed examples]

## Transactions
[Detailed examples]

## Query Optimization
[Detailed guide]
```

## SKILL.md Frontmatter Reference

All fields are optional. Only `description` is recommended.

```yaml
---
name: my-skill                    # Display name (defaults to directory name)
description: What it does         # When to use (Claude uses this for auto-activation)
disable-model-invocation: true    # Only user can invoke (for action commands)
user-invocable: false             # Only Claude can invoke (for background knowledge)
allowed-tools: Read, Grep, Glob   # Tools allowed without permission prompts
argument-hint: "[issue-number]"   # Hint shown in autocomplete
context: fork                     # Run in isolated subagent
agent: Explore                    # Which agent type for context: fork
model: haiku                      # Override model for this skill
---
```

## Pro Tips

### Tip 1: Use Template Starters
```markdown
# [Skill Name]

[One-line description]

## When to Use This Skill
- Scenario 1
- Scenario 2

## Core Concepts
- Concept 1: [Brief explanation]
- Concept 2: [Brief explanation]

## Quick Reference
[Most common example]

## Common Patterns
### Pattern 1: [Name]
[Example]

### Pattern 2: [Name]
[Example]

## Best Practices
### ✅ Do This
- Practice 1
- Practice 2

### ❌ Avoid This
- Anti-pattern 1
- Anti-pattern 2

## Resources
- [Advanced Topics](./resources/skill-name/advanced.md)
- [Troubleshooting](./resources/skill-name/troubleshooting.md)
```

### Tip 3: Iterate Based on Usage
- Track which examples are most referenced
- Remove unused sections
- Expand frequently needed areas
- Update based on actual project needs

### Tip 4: Cross-Reference Related Skills
```markdown
## Related Skills
- For API development: [REST API Expert](./rest-api-expert.md)
- For testing: [TDD Workflow](./tdd-workflow.md)
- For deployment: [Docker Deployment](./docker-deployment.md)
```

## Skill Developer Checklist

When creating a new skill:

### Planning
- [ ] Identified specific problem to solve
- [ ] Defined clear scope (not too broad)
- [ ] Checked for existing similar skills
- [ ] Listed key keywords for activation

### Writing
- [ ] Clear title and description
- [ ] Core principles stated upfront
- [ ] Practical, copy-paste ready examples
- [ ] Good vs Bad comparisons
- [ ] Progressive disclosure (main + resources)
- [ ] Under 500 lines (ideally 300-400)

### Configuration
- [ ] SKILL.md frontmatter has descriptive `description` field
- [ ] Description includes activation keywords and scenarios
- [ ] `disable-model-invocation` set correctly (true for action commands)
- [ ] `allowed-tools` set if skill needs specific tool access

### Testing
- [ ] Manual prompt testing
- [ ] Verified auto-activation works
- [ ] Tested with edge cases
- [ ] Got feedback from team

### Documentation
- [ ] Links to related skills
- [ ] Resource files created (if needed)
- [ ] Examples match project conventions
- [ ] No sensitive information included

## Resources

- Original Reddit Post: [Claude Code is a Beast](https://www.reddit.com/r/ClaudeAI/comments/...)
- Claude Code Docs: https://docs.claude.com/claude-code
- Markdown Guide: https://www.markdownguide.org/

## Remember

> "Skills are not documentation dumps. They are active guides that prevent mistakes and promote best practices in real-time."

**Key Principles:**
1. Keep main file lean (300-400 lines)
2. Use progressive disclosure for details
3. Show practical examples
4. Test auto-activation thoroughly
5. Update based on actual usage
