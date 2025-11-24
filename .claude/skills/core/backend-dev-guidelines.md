# Backend Development Guidelines

Guidelines for backend API development on the Wellforce Platform.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express
- **Language**: TypeScript (keep it simple)
- **Database**: PostgreSQL with direct queries
- **Cache**: Redis
- **AI**: OpenAI GPT-5 Mini (Responses API)

## MVP Principles (Most Important!)

### Always Follow
- **Simple functions** over classes
- **Direct SQL queries** (NO ORM)
- **Inline logic** over abstraction
- **Hard-code first**, extract later
- **One file** for related functionality
- **Synchronous** over async (unless needed)

### Never Use
- Service layers or repositories
- Factory patterns
- Dependency injection
- Abstract classes
- Complex type hierarchies
- ORMs (use direct SQL)

## File Structure

```
src/
├── routes-simple.ts       # Main API routes (keep consolidated)
├── server-simple.ts       # Server entry point
├── routes/               # Individual route handlers (if needed)
│   ├── agents.ts
│   ├── clients.ts
│   └── tickets.ts
├── middleware/           # Simple middleware functions
└── database/
    └── connection.ts     # Connection pool setup
```

## Database Queries (Direct SQL)

### ✅ CORRECT - Direct Queries
```typescript
// Simple parameterized query
app.post('/tickets', async (req, res) => {
  const { subject, email, priority } = req.body;

  // Validation (inline and simple)
  if (!subject) return res.status(400).json({ error: 'Subject required' });
  if (!email?.includes('@')) return res.status(400).json({ error: 'Invalid email' });

  try {
    // Direct SQL query with parameterization (prevents SQL injection)
    const result = await pool.query(
      `INSERT INTO tickets (subject, requester_email, priority, status, created_at)
       VALUES ($1, $2, $3, 'pending', NOW())
       RETURNING *`,
      [subject, email, priority || 'medium']
    );

    res.status(201).json({
      success: true,
      ticket: result.rows[0]
    });
  } catch (error) {
    console.error('Ticket creation error:', error);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});
```

### ❌ WRONG - ORM or Repository Pattern
```typescript
// DON'T DO THIS - Too complex for MVP
class TicketRepository {
  async create(data: CreateTicketDto): Promise<Ticket> {
    // ... abstraction we don't need
  }
}
```

## Route Structure

### Simple Route Handler Pattern
```typescript
// routes-simple.ts or routes/feature.ts

import { Router } from 'express';
import { Pool } from 'pg';

const router = Router();

// GET endpoint
router.get('/tickets', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM tickets ORDER BY created_at DESC LIMIT 100'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// POST endpoint
router.post('/tickets', async (req, res) => {
  const { subject, email } = req.body;

  // Simple validation
  if (!subject) return res.status(400).json({ error: 'Subject required' });

  try {
    const result = await pool.query(
      'INSERT INTO tickets (subject, requester_email) VALUES ($1, $2) RETURNING *',
      [subject, email]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

export default router;
```

## Multi-Tenancy

### Client ID Header Pattern
```typescript
// Extract client ID from header, query, or agentId
function getClientId(req): string {
  // 1. Check header
  if (req.headers['x-client-id']) {
    return req.headers['x-client-id'] as string;
  }

  // 2. Check query param
  if (req.query.clientId) {
    return req.query.clientId as string;
  }

  // 3. Extract from agentId (format: org_XXXXX-agent-YYYYY)
  if (req.body.agentId?.startsWith('org_')) {
    const match = req.body.agentId.match(/^(org_\d+)/);
    if (match) return match[1];
  }

  // 4. Default fallback
  return 'default';
}

// Use in route
router.post('/tickets', async (req, res) => {
  const clientId = getClientId(req);

  const result = await pool.query(
    'INSERT INTO tickets (client_id, subject) VALUES ($1, $2) RETURNING *',
    [clientId, req.body.subject]
  );

  res.json(result.rows[0]);
});
```

## Error Handling

### Simple Pattern (MVP)
```typescript
// Try-catch with clear error messages
app.post('/endpoint', async (req, res) => {
  try {
    // Business logic here
    const result = await doSomething();
    res.json(result);
  } catch (error) {
    console.error('Error description:', error);
    res.status(500).json({
      error: 'User-friendly error message',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
```

### Input Validation (Inline)
```typescript
// Validate at start of handler
app.post('/tickets', async (req, res) => {
  const { subject, email, priority } = req.body;

  // Simple validation - early return pattern
  if (!subject) {
    return res.status(400).json({ error: 'Subject is required' });
  }

  if (!email?.includes('@')) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  if (priority && !['low', 'medium', 'high', 'urgent'].includes(priority)) {
    return res.status(400).json({ error: 'Invalid priority' });
  }

  // Continue with logic...
});
```

## AI Integration (OpenAI GPT-5)

### Correct Configuration
```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Use GPT-5 Mini with Responses API
async function generateTicketSummary(ticketData: any) {
  const response = await openai.chat.completions.create({
    model: 'gpt-5-mini',
    messages: [
      {
        role: 'system',
        content: 'You are a technical support analyst. Analyze tickets concisely.'
      },
      {
        role: 'user',
        content: `Analyze this ticket: ${ticketData.subject}\n${ticketData.description}`
      }
    ],
    // GPT-5 specific parameters
    reasoning: {
      effort: 'medium' // minimal, low, medium, high
    },
    text: {
      verbosity: 'high' // low, medium, high
    },
    max_output_tokens: 2000,
    // DO NOT use these (GPT-5 rejects them):
    // temperature: 0.7,  // ❌ Don't use
    // top_p: 1.0,        // ❌ Don't use
  });

  return response.choices[0].message.content;
}
```

### Important AI Notes
- Default to `gpt-5-mini` for all workflows
- Use Responses API with `reasoning.effort` and `text.verbosity`
- **NEVER** pass `temperature`, `top_p`, or `logprobs` (GPT-5 rejects them)
- Keep prompts simple and direct
- Hard-code model and settings (don't over-configure)

## Testing (TDD Required)

### Write Tests First
```typescript
// test/routes/tickets.test.ts
import request from 'supertest';
import app from '../src/server-simple';

describe('POST /api/v1/agents/tickets', () => {
  it('should create a ticket with valid data', async () => {
    const response = await request(app)
      .post('/api/v1/agents/tickets')
      .send({
        agentId: 'test-agent',
        subject: 'Test ticket',
        userEmail: 'test@example.com',
        priority: 'medium'
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.ticketId).toBeDefined();
  });

  it('should reject ticket without subject', async () => {
    const response = await request(app)
      .post('/api/v1/agents/tickets')
      .send({
        agentId: 'test-agent',
        userEmail: 'test@example.com'
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('subject');
  });
});
```

### Keep Tests Simple
- Test happy path first
- Test error cases
- Don't mock everything (use real DB for integration tests)
- Focus on behavior, not implementation

## Common Patterns

### Pagination (Simple)
```typescript
router.get('/tickets', async (req, res) => {
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = parseInt(req.query.offset as string) || 0;

  const result = await pool.query(
    'SELECT * FROM tickets ORDER BY created_at DESC LIMIT $1 OFFSET $2',
    [limit, offset]
  );

  res.json({
    tickets: result.rows,
    limit,
    offset,
    total: result.rowCount
  });
});
```

### Background Jobs (Simple Polling)
```typescript
// Simple background processor
async function processQueue() {
  while (true) {
    const jobs = await pool.query(
      `SELECT * FROM build_jobs
       WHERE status = 'queued'
       ORDER BY created_at ASC
       LIMIT 5`
    );

    for (const job of jobs.rows) {
      await processJob(job);
    }

    // Poll every 2 minutes
    await new Promise(resolve => setTimeout(resolve, 120000));
  }
}

// Start on server boot
processQueue().catch(console.error);
```

## Security (MVP Basics)

### Required
- [ ] Parameterized queries (prevent SQL injection)
- [ ] Environment variables for secrets
- [ ] Basic input validation
- [ ] HTTPS in production
- [ ] JWT for authentication (if needed)

### Nice to Have (Defer for MVP)
- Advanced rate limiting
- Complex authorization
- Input sanitization libraries
- CSRF protection

### Example Auth Middleware
```typescript
// Simple JWT check
function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Use on protected routes
router.get('/admin/users', requireAuth, async (req, res) => {
  // ... admin logic
});
```

## Checklist Before Committing

- [ ] Following MVP principles (no service layers, repositories, etc.)
- [ ] Using direct SQL queries (no ORM)
- [ ] Tests written first (TDD)
- [ ] Input validation present
- [ ] Error handling included
- [ ] No hardcoded secrets
- [ ] Code under 50 lines per feature (guideline)
- [ ] Can explain to junior dev in 30 seconds

## Common Mistakes to Avoid

### ❌ Over-Engineering
```typescript
// Don't create service layers
class TicketService {
  constructor(private repo: TicketRepository) {}
  async create(dto: CreateTicketDto): Promise<Ticket> { ... }
}
```

### ❌ Complex Validation Libraries
```typescript
// Don't use complex validation
import { validate } from 'class-validator';
class CreateTicketDto { ... }
```

### ❌ ORMs
```typescript
// Don't use ORMs
import { Entity, Column } from 'typeorm';
@Entity()
class Ticket { ... }
```

### ✅ Keep It Simple
```typescript
// Just validate inline and query directly
if (!req.body.subject) return res.status(400).json({ error: 'Subject required' });
const result = await pool.query('INSERT INTO tickets...', [values]);
```

## Remember

- **Simple > Complex** (always)
- **Working > Perfect** (ship it)
- **Direct > Abstracted** (inline logic)
- **TDD** (write tests first)
- **MVP mindset** (we have 0 users)

When in doubt, ask: "What's the simplest thing that could possibly work?"
