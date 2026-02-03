# Skills System - Auto-Activating Guidelines

How to create and use domain-specific skills that Claude Code automatically suggests based on context.

## Modern Skill Format (2025)

All skills now use YAML frontmatter for metadata:

```markdown
---
name: backend-dev-guidelines
description: Node.js/Express/PostgreSQL patterns with MVP principles
---

# Backend Development Guidelines
...
```

### Available Frontmatter Fields

| Field | Description |
|-------|-------------|
| `name` | Unique identifier for the skill |
| `description` | Brief description shown when skill activates |
| `context` | Set to `fork` to run skill in isolated context |
| `disable-model-invocation` | Set to `true` for workflow skills |
| `allowed-tools` | YAML list of tools this skill can use |

### Hot Reload

Skills now hot-reload automatically. Changes in `.claude/skills/` are immediately available without restarting Claude Code.

## What Are Skills?

Skills are markdown files containing guidelines for specific domains (backend, frontend, testing, etc.) that:
- Auto-activate based on your prompts
- Provide consistent patterns
- Enforce best practices
- Keep Claude focused on your standards

Think of them as "expert advisors" that chime in when relevant.

## The Breakthrough

Instead of repeatedly telling Claude:
- "Remember to use direct SQL queries, no ORM"
- "Follow MVP principles"
- "Write tests first"

Skills auto-activate and Claude already knows.

## How It Works

### 1. You Type a Prompt

```
"Create an API endpoint for user registration"
```

### 2. Hook Analyzes Keywords

- Sees: "API", "endpoint", "registration"
- Matches against `skill-rules.json`
- Finds relevant skills

### 3. Skills Auto-Suggest

```
[Skill Suggestion]
- backend-dev-guidelines (API patterns)
- production-principles (keep it simple)
- tdd-workflow (write tests first)
```

### 4. Claude Follows Guidelines

Claude now codes following all three skills automatically.

## Core Skills Library

These 7 universal skills work with any stack or framework. Adapt the code examples for your language (Python, Go, Ruby, etc.).

### 1. backend-dev-guidelines

**When**: Backend/API development

**Key Principles**:
- Direct database queries (avoid heavy ORMs)
- Simple route handlers (no unnecessary abstraction)
- Inline validation for simple cases
- Consistent error handling
- Production-ready from the start

**Example** (TypeScript/Node.js):
```typescript
// Good: Direct, simple, production-ready
app.post('/api/users', async (req, res) => {
  try {
    if (!req.body.email) {
      return res.status(400).json({ error: 'Email required' });
    }

    const user = await pool.query(
      'INSERT INTO users (email) VALUES ($1) RETURNING *',
      [req.body.email]
    );

    res.json(user.rows[0]);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

**Adapt for your stack**:
- Python: Use `psycopg2` or `asyncpg` for direct queries
- Go: Use `database/sql` with `sqlx` for direct queries
- Ruby: Use `pg` gem with direct SQL
- PHP: Use PDO for direct queries

### 2. frontend-dev-guidelines

**When**: Frontend/UI development

**Key Principles**:
- Simple functional components
- Direct API calls (avoid over-abstraction)
- Inline state management for simple cases
- Follow your UI framework's conventions
- UIC system for debugging (see UIC_Guidelines)

**Example** (React):
```tsx
// Good: Simple, direct, debuggable
export default function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/users')
      .then(r => r.json())
      .then(data => {
        setUsers(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load users:', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div data-uic="USRLOD0001">Loading...</div>;

  return (
    <div data-uic="USRLST0001">
      {users.map(user => (
        <div key={user.id} data-uic={`USRITM${String(user.id).padStart(4, '0')}`}>
          {user.name}
        </div>
      ))}
    </div>
  );
}
```

**Adapt for your stack**:
- Vue: Use composition API with `ref` and `onMounted`
- Svelte: Use reactive statements and `onMount`
- Angular: Use services with observables
- Any framework: Add UIC attributes for debugging

### 3. production-principles

**When**: Architecture/design decisions, refactoring

**Key Principles**:
- **Simple over complex** - Avoid premature abstraction
- **YAGNI** (You Aren't Gonna Need It) - Don't build for hypothetical futures
- **Rule of Three** - Extract after 3rd duplicate, not before
- **Direct then Abstract** - Wait for clear patterns
- **Ship fast** - Working > Perfect

**Triggers**:
- Keywords: "architecture", "design", "refactor", "service", "factory", "pattern"
- When detecting over-engineering
- When considering abstraction

**Bad**:
```typescript
// Over-engineered: Factory + DI + Repository pattern for simple CRUD
class UserRepositoryFactory {
  create(type: 'sql' | 'nosql'): IUserRepository { ... }
}
```

**Good**:
```typescript
// Simple: Direct queries until you have 3+ implementations
async function getUser(id: string) {
  return await pool.query('SELECT * FROM users WHERE id = $1', [id]);
}
```

### 4. tdd-workflow

**When**: Testing or implementing new features

**Key Principles**:
- **Red-Green-Refactor** cycle
- Write tests first, then implement
- Focus on behavior, not implementation details
- Keep tests simple and readable
- Test edge cases and errors

**Example** (Jest):
```typescript
// 1. RED: Write failing test
test('creates user with valid email', async () => {
  const response = await request(app)
    .post('/api/users')
    .send({ email: 'test@example.com' });

  expect(response.status).toBe(201);
  expect(response.body.email).toBe('test@example.com');
});

// 2. GREEN: Implement to make it pass
app.post('/api/users', async (req, res) => {
  const user = await pool.query(
    'INSERT INTO users (email) VALUES ($1) RETURNING *',
    [req.body.email]
  );
  res.status(201).json(user.rows[0]);
});

// 3. REFACTOR: Add validation, error handling
test('returns 400 for invalid email', async () => {
  const response = await request(app)
    .post('/api/users')
    .send({ email: 'invalid' });

  expect(response.status).toBe(400);
});
```

**Adapt for your stack**:
- Python: Use `pytest` or `unittest`
- Go: Use standard `testing` package with table-driven tests
- Ruby: Use `RSpec` or `Minitest`
- PHP: Use `PHPUnit`

### 5. UIC_Guidelines

**When**: Creating UI components, debugging issues

**Key Principles**:
- Every interactive element gets a unique UIC (Universal ID Convention)
- Format: `PAGXXX0000` (3-letter page code + 3-letter element code + 4-digit number)
- Makes debugging 10x faster ("Button X is broken" → "LOGBUT0001 is broken" → find in 5 seconds)
- Essential for support and QA

**Example**:
```tsx
// Login page (LOG prefix)
<div data-uic="LOGFRM0001">  // LOGin FoRM 0001
  <input data-uic="LOGEML0001" />  // LOGin EMaiL 0001
  <input data-uic="LOGPAS0001" />  // LOGin PASsword 0001
  <button data-uic="LOGBUT0001">Login</button>  // LOGin BUTton 0001
</div>

// Dashboard page (DSH prefix)
<div data-uic="DSHNAV0001">  // DaSHboard NAVigation 0001
  <button data-uic="DSHMEN0001">Menu</button>  // DaSHboard MEnu 0001
</div>
```

**Benefits**:
- Support: "LOGBUT0001 isn't working" → Find instantly with search
- QA: Stable selectors for automated tests
- Debugging: Grep codebase for exact component
- Multi-language: Works regardless of UI text translation

### 6. security-practices

**When**: Authentication, authorization, handling sensitive data

**Key Principles**:
- **Input validation** - Validate all user input (email format, password strength, etc.)
- **Parameterized queries** - Prevent SQL injection (never string concatenation)
- **Password hashing** - Use bcrypt/argon2 (never plaintext)
- **Secret management** - Environment variables (never hardcoded)
- **Authentication** - JWT/sessions with expiration
- **Authorization** - Check permissions before actions
- **Rate limiting** - Prevent abuse
- **Error handling** - Don't leak sensitive info in errors

**Example** (Node.js):
```typescript
// Good: Secure authentication endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Input validation
    if (!email || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: 'Invalid email' });
    }

    // Parameterized query (prevents SQL injection)
    const user = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (!user.rows[0]) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Password verification (hashed)
    const valid = await bcrypt.compare(password, user.rows[0].password_hash);

    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // JWT with expiration
    const token = jwt.sign(
      { userId: user.rows[0].id },
      process.env.JWT_SECRET, // Secret from env, not hardcoded
      { expiresIn: '24h' }
    );

    res.json({ token });
  } catch (error) {
    // Don't leak error details
    console.error('Login error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});
```

**Bad**:
```typescript
// Bad: Multiple security issues
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  // SQL injection vulnerability (string concatenation)
  const user = await pool.query(
    `SELECT * FROM users WHERE email = '${email}'`
  );

  // Plaintext password comparison
  if (user.rows[0].password === password) {
    // Hardcoded secret
    const token = jwt.sign({ userId: user.rows[0].id }, 'secret123');
    res.json({ token }); // No expiration
  }
});
```

**Adapt for your stack**:
- Python: Use `bcrypt`, parameterized queries with `psycopg2`, env vars with `python-dotenv`
- Go: Use `golang.org/x/crypto/bcrypt`, `database/sql` with placeholders, `os.Getenv()`
- Ruby: Use `bcrypt` gem, ActiveRecord parameterization, `ENV['SECRET']`
- PHP: Use `password_hash()`, PDO prepared statements, `getenv()`

**Universal security checklist**:
- [ ] All passwords hashed (bcrypt/argon2)
- [ ] All queries parameterized (no string concatenation)
- [ ] All secrets in environment variables
- [ ] Input validation on all endpoints
- [ ] JWT/session tokens expire
- [ ] HTTPS enforced in production
- [ ] Rate limiting on auth endpoints
- [ ] Error messages don't leak info

### 7. skill-developer

**When**: Creating new custom skills for your project

**Key Principles**:
- Keep skills under 500 lines (link to external docs for depth)
- Focus on one domain per skill
- Include both good and bad examples
- Define clear triggers in `skill-rules.json`
- Update based on project learnings

**Skill Template**:
```markdown
# Your Skill Name

Brief description (1-2 sentences).

## Core Principles
- Principle 1
- Principle 2
- Principle 3

## Patterns to Use
### Good Pattern 1
Description and example code.

## Patterns to Avoid
### Bad Pattern 1
Why it's bad and what to do instead.

## Quick Reference
- [ ] Check 1
- [ ] Check 2

## Examples
Real working examples from your project.
```

**Example skill-rules.json entry**:
```json
{
  "your-skill-name": {
    "type": "domain",
    "enforcement": "suggest",
    "priority": "high",
    "description": "When to activate this skill",
    "promptTriggers": {
      "keywords": ["keyword1", "keyword2"],
      "intentPatterns": ["(create|build).*(feature)"]
    }
  }
}
```

## Creating a New Skill

### Step 1: Create Skill File

File: `.claude/skills/your-skill-name.md`

```markdown
# Your Skill Name

Brief description of what this skill covers (1-2 sentences).

## Core Principles

The fundamental rules this skill enforces:
- Principle 1
- Principle 2
- Principle 3

## Patterns to Use

### Pattern 1: Name

Description of when and why to use this pattern.

**Example:**
\`\`\`language
// Example code
\`\`\`

### Pattern 2: Name

[Repeat for each pattern]

## Patterns to Avoid

### Anti-Pattern 1: Name

Why this is bad and what to do instead.

**Bad:**
\`\`\`language
// Bad example
\`\`\`

**Good:**
\`\`\`language
// Good alternative
\`\`\`

## Quick Reference

Checklist of key points:
- [ ] Check 1
- [ ] Check 2
- [ ] Check 3

## Examples

### Example 1: [Scenario]

Show complete working example.

### Example 2: [Scenario]

Show another example.

## Common Mistakes

1. **Mistake 1**: Description and fix
2. **Mistake 2**: Description and fix

## Resources

- Link to relevant docs
- Link to examples in codebase
```

### Step 2: Add to skill-rules.json

```json
{
  "your-skill-name": {
    "type": "domain",
    "enforcement": "suggest",
    "priority": "high",
    "description": "Brief description of when this activates",
    "promptTriggers": {
      "keywords": [
        "keyword1",
        "keyword2",
        "keyword3"
      ],
      "intentPatterns": [
        "(create|build).*(feature|component)",
        "specific.?pattern"
      ]
    },
    "fileTriggers": {
      "pathPatterns": [
        "path/to/**/*.ext"
      ],
      "contentPatterns": [
        "import.*library",
        "class.*Pattern"
      ]
    }
  }
}
```

### Step 3: Test Activation

```
# Should activate your skill
"Create a [keyword1] for [keyword2]"

# Should not activate
"Something unrelated"
```

## Skill Configuration

### Types

- `"domain"` - Technical domain (backend, frontend, etc.)
- `"quality"` - Quality control (MVP, TDD, security)

### Enforcement

- `"suggest"` - Claude considers but can override
- `"require"` - Claude must follow (use sparingly)

### Priority

- `"critical"` - Always enforce (e.g., security)
- `"high"` - Strongly suggest (e.g., MVP)
- `"medium"` - Consider when relevant
- `"low"` - Optional enhancement

### Triggers

**Keywords**: Simple word matching
```json
"keywords": ["backend", "api", "endpoint"]
```

**Intent Patterns**: Regex for complex matching
```json
"intentPatterns": [
  "(create|build|add).*(api|endpoint|route)",
  "database.*(query|schema)"
]
```

**Path Patterns**: File location triggers
```json
"pathPatterns": [
  "src/**/*.ts",
  "dashboard/**/*.tsx"
]
```

**Content Patterns**: Code pattern triggers
```json
"contentPatterns": [
  "import.*react",
  "app\\.(get|post|put)"
]
```

## Progressive Disclosure

Keep skills under 500 lines by linking to external docs:

```markdown
# Backend Dev Guidelines

## Database Queries

For complex query optimization, see [Database Performance Guide](../docs/DATABASE.md).

For now, follow these simple rules:
- Use indexes on WHERE clauses
- Limit results with LIMIT
- Avoid SELECT *
```

This keeps the skill focused while providing depth when needed.

## Best Practices

### Do

- Keep skills focused (one domain)
- Use clear examples
- Include both good and bad code
- Update based on project learnings
- Test activation with real prompts

### Don't

- Create too many skills (7-10 is ideal)
- Duplicate information across skills
- Make skills too long (>500 lines)
- Use overly broad triggers
- Forget to update skill-rules.json

## Real-World Workflow

### Without Skills

```
You: "Create an API endpoint"

Claude: [Creates complex service layer architecture]

You: "No, keep it simple, MVP style"

Claude: [Simplifies]

You: "And use direct SQL, no ORM"

Claude: [Refactors]

You: "And write tests first"

Claude: [Adds tests]
```

**Result**: 4 iterations, 10 minutes wasted

### With Skills

```
You: "Create an API endpoint"

[Skills auto-activate: backend-dev-guidelines, production-principles, tdd-workflow]

Claude: [Creates simple endpoint with direct queries and tests first]
```

**Result**: Perfect on first try, 2 minutes

## Integration with Hooks

### user-prompt-submit.ts

```typescript
export function analyzePrompt(prompt: string): string[] {
  const skills = [];
  const rules = JSON.parse(fs.readFileSync('skill-rules.json', 'utf-8'));

  for (const [name, config] of Object.entries(rules)) {
    // Check keywords
    if (config.keywords.some(k => prompt.toLowerCase().includes(k))) {
      skills.push(name);
    }

    // Check intent patterns
    if (config.intentPatterns.some(p => new RegExp(p, 'i').test(prompt))) {
      skills.push(name);
    }
  }

  return skills;
}
```

This runs before every prompt, suggesting relevant skills.

## Measuring Success

You'll know skills are working when:
- Claude rarely needs correction
- Code follows standards automatically
- Team velocity increases
- Less back-and-forth in reviews
- New team members produce consistent code

## Common Use Cases

### Use Case 1: New Team Member

**Before Skills**:
- Spends days reading docs
- Makes mistakes in PRs
- Gets corrected repeatedly

**With Skills**:
- Skills activate automatically
- Code follows standards from day 1
- Learns by seeing consistent patterns

### Use Case 2: Context Switching

**Before Skills**:
- Switch from backend to frontend
- Forget frontend patterns
- Create inconsistent code

**With Skills**:
- Skills activate based on file
- Patterns automatically applied
- Consistency maintained

### Use Case 3: New Features

**Before Skills**:
- Unsure of best approach
- Ask team for guidance
- Wait for code review feedback

**With Skills**:
- Skills guide implementation
- First attempt is usually correct
- Faster shipping

## Skill Maintenance

### Review Quarterly

- Are skills still relevant?
- Do triggers need updating?
- Are examples current?
- Any new patterns to add?

### Update After Learnings

```markdown
## Common Mistakes (Updated Q1 2025)

1. **Forgot to add UIC**: Always add data-uic to new components
2. **Used ORM**: Direct SQL only, see example in routes-simple.ts
```

### Archive Unused Skills

If a skill hasn't activated in 3 months, consider archiving or removing.

## Advanced Techniques

### Skill Composition

Combine skills for complex scenarios:

```
"Create a user registration API endpoint"

[Activates: backend-dev-guidelines, production-principles, tdd-workflow]
```

### Conditional Skills

Use intent patterns for nuanced activation:

```json
"intentPatterns": [
  "(?!test).*(create|build).*(component)"
]
```

This activates for "create component" but NOT "create test component".

### Context-Aware Skills

Trigger based on recent file edits:

```json
"fileTriggers": {
  "pathPatterns": ["recently_edited_files"]
}
```

## Troubleshooting

### Skill Not Activating

1. Check keyword spelling in skill-rules.json
2. Test regex patterns at regex101.com
3. Try more explicit prompt: "Use skill-name skill"
4. Check hook is running (see hook logs)

### Skill Activating Too Often

1. Make keywords more specific
2. Add negative patterns to exclude cases
3. Lower priority from "critical" to "high"
4. Narrow path patterns

### Skills Conflicting

If two skills suggest opposite approaches:
1. Set different priorities
2. Make one skill more specific
3. Create a "integration" skill that reconciles them

## Example Skills Templates

The 7 core universal skills are ready to use:
- **backend-dev-guidelines.md** - Adapt for your backend language/framework
- **frontend-dev-guidelines.md** - Adapt for your frontend framework
- **production-principles.md** - Universal (use as-is)
- **tdd-workflow.md** - Adapt test framework examples
- **UIC_Guidelines.md** - Universal (use as-is)
- **security-practices.md** - Adapt auth/hashing libraries for your stack
- **skill-developer.md** - Universal (use as-is)

Download these from the template repository and customize for your stack.

## Next Steps

1. Start with 3-5 core skills for your stack
2. Add skill-rules.json configuration
3. Test activation with real prompts
4. Iterate based on what triggers too often/rarely
5. Add more skills as patterns emerge

---

**Time investment**: 1 hour per skill
**Payoff**: Hours saved daily
**ROI**: 10x within first week

Start with the domains you work in most, then expand.
