# Skill Developer

Meta-skill for creating high-quality Claude Code skills with progressive disclosure and auto-activation.

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

### Resource Files (Supporting Details)

```
.claude/skills/
├── skill-name.md              # Main file (300-400 lines)
└── resources/
    └── skill-name/
        ├── api-reference.md   # Detailed API docs
        ├── advanced.md        # Complex patterns
        ├── troubleshooting.md # Common issues
        └── examples/          # Code samples
            ├── basic.ts
            └── advanced.ts
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

**Pattern:**
```typescript
// Simple, direct Express route
app.post('/api/v1/resource', async (req, res) => {
  const { field1, field2 } = req.body;

  // Validation
  if (!field1) {
    return res.status(400).json({ error: 'field1 required' });
  }

  // Database query
  const result = await pool.query(
    'INSERT INTO table (field1, field2) VALUES ($1, $2) RETURNING *',
    [field1, field2]
  );

  res.status(201).json({ success: true, data: result.rows[0] });
});
```

**Key Points:**
- Inline validation (no middleware for MVP)
- Direct SQL query (no ORM)
- Consistent response format
- Proper status codes
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
```typescript
const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
```

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

### Step 5: Create Auto-Activation Rules

**Add to skill-rules.json:**

```json
{
  "skill-name": {
    "type": "domain",  // or "quality"
    "enforcement": "suggest",
    "priority": "high",  // critical|high|medium|low
    "description": "Brief one-line description",
    "promptTriggers": {
      "keywords": [
        "keyword1",
        "keyword2",
        "keyword3"
      ],
      "intentPatterns": [
        "(create|add|build).*(feature|component)",
        "(fix|debug).*(issue|bug)"
      ]
    },
    "fileTriggers": {
      "pathPatterns": [
        "src/**/*.ts",
        "path/to/**/*.tsx"
      ],
      "contentPatterns": [
        "import.*library",
        "class.*Pattern"
      ]
    }
  }
}
```

**Trigger Types:**
- `keywords`: Simple word matching in prompts
- `intentPatterns`: Regex patterns for user intentions
- `pathPatterns`: Glob patterns for file paths
- `contentPatterns`: Regex patterns for file contents

**Priority Levels:**
- `critical`: Always show first (MVP principles, TDD)
- `high`: Important for this domain (backend, frontend)
- `medium`: Helpful but not critical
- `low`: Nice to have

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
```typescript
// In user-prompt-submit.ts
if (require.main === module) {
  const testPrompts = [
    'Create a new API endpoint for tickets',
    'Fix the database query bug',
  ];

  testPrompts.forEach(prompt => {
    console.log(`Prompt: "${prompt}"`);
    const result = onUserPromptSubmit(prompt);
    console.log(result);
  });
}
```

### Verification Checklist

- [ ] Skill file under 500 lines (ideally 300-400)
- [ ] Examples are clear and copy-paste ready
- [ ] Good vs Bad comparisons included
- [ ] Progressive disclosure (links to resources)
- [ ] Auto-activation rules added to skill-rules.json
- [ ] Keywords trigger correctly
- [ ] File patterns match actual usage
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

## Examples from Wellforce

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

## Skill Rules Configuration

### Basic Rule
```json
{
  "skill-name": {
    "type": "domain",
    "enforcement": "suggest",
    "priority": "high",
    "description": "One-line description",
    "promptTriggers": {
      "keywords": ["keyword1", "keyword2"],
      "intentPatterns": ["pattern1", "pattern2"]
    }
  }
}
```

### Advanced Rule (with File Triggers)
```json
{
  "skill-name": {
    "type": "domain",
    "enforcement": "suggest",
    "priority": "high",
    "description": "One-line description",
    "promptTriggers": {
      "keywords": ["api", "endpoint", "route"],
      "intentPatterns": [
        "(create|add|build).*(route|endpoint|api)",
        "(fix|debug).*(backend|api)"
      ]
    },
    "fileTriggers": {
      "pathPatterns": [
        "src/**/*.ts",
        "src/routes/**/*.ts"
      ],
      "contentPatterns": [
        "app\\.(get|post|put|delete)",
        "router\\.",
        "pool\\.query"
      ]
    }
  }
}
```

## Pro Tips

### Tip 1: Test Activation Logic
```bash
# Test keyword matching
echo "create a new api endpoint" | grep -i "api\|endpoint\|route"
```

### Tip 2: Use Template Starters
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
- [ ] Added to skill-rules.json
- [ ] Keywords match actual usage
- [ ] Intent patterns tested
- [ ] File patterns correct (if applicable)
- [ ] Priority level appropriate

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
