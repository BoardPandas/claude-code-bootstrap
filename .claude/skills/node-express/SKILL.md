---
name: node-express
description: Node.js + Express + TypeScript + PostgreSQL stack examples. Use when building backend APIs with Express, Node.js routes, or TypeScript server code with direct SQL queries.
disable-model-invocation: true
---

# Node.js + Express Stack Examples

Stack-specific examples for backend development with Node.js, Express, TypeScript, and PostgreSQL.

> These examples implement the universal principles from the `backend-dev-guidelines` skill.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express
- **Language**: TypeScript
- **Database**: PostgreSQL with direct queries (node-postgres `pg` package)
- **Cache**: Redis (when needed)

## File Structure

```
src/
├── routes-simple.ts       # Main API routes (keep consolidated)
├── server-simple.ts       # Server entry point
├── routes/               # Individual route handlers (when needed)
│   ├── users.ts
│   └── items.ts
├── middleware/           # Simple middleware functions
└── database/
    └── connection.ts     # Connection pool setup
```

## Database Queries (Direct SQL)

### Simple Parameterized Query
```typescript
app.post('/items', async (req, res) => {
  const { name, description, category } = req.body;

  // Inline validation
  if (!name) return res.status(400).json({ error: 'Name required' });

  try {
    const result = await pool.query(
      `INSERT INTO items (name, description, category, status, created_at)
       VALUES ($1, $2, $3, 'active', NOW())
       RETURNING *`,
      [name, description, category || 'general']
    );

    res.status(201).json({
      success: true,
      item: result.rows[0]
    });
  } catch (error) {
    console.error('Item creation error:', error);
    res.status(500).json({ error: 'Failed to create item' });
  }
});
```

### Anti-Pattern: ORM or Repository
```typescript
// DON'T DO THIS - Too complex for MVP
class ItemRepository {
  async create(data: CreateItemDto): Promise<Item> {
    // ... abstraction we don't need
  }
}
```

## Route Structure

### Simple Route Handler Pattern
```typescript
import { Router } from 'express';
import { Pool } from 'pg';

const router = Router();

// GET endpoint
router.get('/items', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM items ORDER BY created_at DESC LIMIT 100'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// POST endpoint
router.post('/items', async (req, res) => {
  const { name, description } = req.body;

  if (!name) return res.status(400).json({ error: 'Name required' });

  try {
    const result = await pool.query(
      'INSERT INTO items (name, description) VALUES ($1, $2) RETURNING *',
      [name, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

export default router;
```

## Error Handling

### Simple Pattern
```typescript
app.post('/endpoint', async (req, res) => {
  try {
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
app.post('/items', async (req, res) => {
  const { name, email, priority } = req.body;

  // Simple validation - early return pattern
  if (!name) return res.status(400).json({ error: 'Name is required' });
  if (!email?.includes('@')) return res.status(400).json({ error: 'Valid email required' });
  if (priority && !['low', 'medium', 'high', 'urgent'].includes(priority)) {
    return res.status(400).json({ error: 'Invalid priority' });
  }

  // Continue with logic...
});
```

## Multi-Tenancy

### Client ID Header Pattern
```typescript
function getClientId(req): string {
  // 1. Check header
  if (req.headers['x-client-id']) return req.headers['x-client-id'] as string;
  // 2. Check query param
  if (req.query.clientId) return req.query.clientId as string;
  // 3. Default fallback
  return 'default';
}

router.post('/items', async (req, res) => {
  const clientId = getClientId(req);
  const result = await pool.query(
    'INSERT INTO items (client_id, name) VALUES ($1, $2) RETURNING *',
    [clientId, req.body.name]
  );
  res.json(result.rows[0]);
});
```

## Common Patterns

### Pagination
```typescript
router.get('/items', async (req, res) => {
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = parseInt(req.query.offset as string) || 0;

  const result = await pool.query(
    'SELECT * FROM items ORDER BY created_at DESC LIMIT $1 OFFSET $2',
    [limit, offset]
  );

  res.json({ items: result.rows, limit, offset, total: result.rowCount });
});
```

### Background Jobs (Simple Polling)
```typescript
async function processQueue() {
  while (true) {
    const jobs = await pool.query(
      `SELECT * FROM jobs WHERE status = 'queued' ORDER BY created_at ASC LIMIT 5`
    );
    for (const job of jobs.rows) {
      await processJob(job);
    }
    await new Promise(resolve => setTimeout(resolve, 120000)); // Poll every 2 min
  }
}
processQueue().catch(console.error);
```

### Auth Middleware
```typescript
function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

router.get('/admin/users', requireAuth, async (req, res) => {
  // ... admin logic
});
```

## Build & Run Commands

```bash
npm run dev          # Start development server
npm run build        # Compile TypeScript
npm run typecheck    # Type check without emitting
npm test             # Run tests
npx prettier --write . # Format code
```

## Anti-Patterns to Avoid

```typescript
// DON'T: Service layers
class ItemService {
  constructor(private repo: ItemRepository) {}
  async create(dto: CreateItemDto): Promise<Item> { ... }
}

// DON'T: Complex validation libraries
import { validate } from 'class-validator';
class CreateItemDto { ... }

// DON'T: ORMs
import { Entity, Column } from 'typeorm';
@Entity() class Item { ... }

// DO: Validate inline and query directly
if (!req.body.name) return res.status(400).json({ error: 'Name required' });
const result = await pool.query('INSERT INTO items...', [values]);
```
