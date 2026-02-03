---
name: rest-api-expert
description: REST API design patterns with Express/Node.js including URL structure, response formats, and error handling
---

# REST API Expert

Expert guidance for designing and building RESTful APIs with Express/Node.js, following MVP principles.

## API Design Principles (MVP-Focused)

### Core Philosophy
- **Simple > Clever**: Obvious endpoints beat complex routing
- **Consistent**: Follow patterns across all endpoints
- **Pragmatic**: Perfect REST is less important than working APIs
- **Document minimally**: Code should be self-explanatory

### URL Structure (Keep It Simple)

```typescript
// ✅ GOOD - Clear, consistent, predictable
GET    /api/v1/tickets           // List tickets
GET    /api/v1/tickets/:id       // Get one ticket
POST   /api/v1/tickets           // Create ticket
PUT    /api/v1/tickets/:id       // Update ticket
DELETE /api/v1/tickets/:id       // Delete ticket

// ✅ GOOD - Nested resources (when needed)
GET    /api/v1/tickets/:id/comments       // Ticket's comments
POST   /api/v1/tickets/:id/comments       // Add comment

// ❌ BAD - Too clever, hard to remember
GET    /api/v1/tickets/search?q=...       // Just use query params on main endpoint
GET    /api/v1/tickets-by-status/:status  // Use query params instead
```

### HTTP Methods (The Basics)

- **GET**: Read data (should never modify)
- **POST**: Create new resource
- **PUT**: Update entire resource
- **PATCH**: Update partial resource (use sparingly for MVP)
- **DELETE**: Remove resource

### MVP Routing Pattern

```typescript
// ✅ CORRECT - Simple, direct Express routing
import express from 'express';
const app = express();

// List all
app.get('/api/v1/tickets', async (req, res) => {
  const { status, priority, limit = 50 } = req.query;

  try {
    let query = 'SELECT * FROM tickets WHERE 1=1';
    const params: any[] = [];

    // Simple filtering
    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }

    if (priority) {
      params.push(priority);
      query += ` AND priority = $${params.length}`;
    }

    // Limit results
    params.push(limit);
    query += ` ORDER BY created_at DESC LIMIT $${params.length}`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// Get one
app.get('/api/v1/tickets/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM tickets WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({ error: 'Failed to fetch ticket' });
  }
});

// Create
app.post('/api/v1/tickets', async (req, res) => {
  const { subject, description, priority = 'medium' } = req.body;

  // Simple validation
  if (!subject) {
    return res.status(400).json({ error: 'Subject is required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO tickets (subject, description, priority, status, created_at)
       VALUES ($1, $2, $3, 'open', NOW())
       RETURNING *`,
      [subject, description, priority]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

// Update
app.put('/api/v1/tickets/:id', async (req, res) => {
  const { id } = req.params;
  const { subject, description, status, priority } = req.body;

  try {
    const result = await pool.query(
      `UPDATE tickets
       SET subject = COALESCE($1, subject),
           description = COALESCE($2, description),
           status = COALESCE($3, status),
           priority = COALESCE($4, priority),
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [subject, description, status, priority, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating ticket:', error);
    res.status(500).json({ error: 'Failed to update ticket' });
  }
});

// Delete
app.delete('/api/v1/tickets/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM tickets WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json({
      success: true,
      message: 'Ticket deleted',
      id: result.rows[0].id
    });
  } catch (error) {
    console.error('Error deleting ticket:', error);
    res.status(500).json({ error: 'Failed to delete ticket' });
  }
});
```

## Response Format Standards

### Success Responses

```typescript
// ✅ CONSISTENT FORMAT
{
  "success": true,
  "data": { ...actualData },
  "count": 42,          // For lists (optional)
  "message": "..."      // For operations without data (optional)
}
```

### Error Responses

```typescript
// ✅ CONSISTENT FORMAT
{
  "error": "Clear, user-friendly error message",
  "code": "OPTIONAL_ERROR_CODE",  // Optional for client handling
  "details": { ... }               // Optional for debugging
}
```

### Status Codes (The Essentials)

**Success:**
- `200 OK` - Standard success (GET, PUT, DELETE)
- `201 Created` - Resource created successfully (POST)
- `204 No Content` - Success but no data to return

**Client Errors:**
- `400 Bad Request` - Invalid input/validation error
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Authenticated but not authorized
- `404 Not Found` - Resource doesn't exist
- `409 Conflict` - Duplicate or conflicting resource

**Server Errors:**
- `500 Internal Server Error` - Catch-all server error
- `503 Service Unavailable` - Temporary downtime

## Request Validation (Simple & Effective)

```typescript
// ✅ INLINE VALIDATION (MVP Way)
app.post('/api/v1/tickets', async (req, res) => {
  const { subject, email, description } = req.body;

  // Validate required fields
  if (!subject || subject.trim().length === 0) {
    return res.status(400).json({ error: 'Subject is required' });
  }

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  if (subject.length > 200) {
    return res.status(400).json({ error: 'Subject too long (max 200 chars)' });
  }

  // Proceed with creation...
});
```

### ❌ Don't Over-engineer Validation
```typescript
// ❌ WRONG - Too complex for MVP
import { body, validationResult } from 'express-validator';

const validateTicket = [
  body('subject').trim().notEmpty().isLength({ max: 200 }),
  body('email').isEmail().normalizeEmail(),
  // ... 20 more rules
];

app.post('/api/v1/tickets', validateTicket, (req, res) => {
  // ... validation middleware abstraction
});
```

## Authentication & Authorization

### Simple API Key Auth (MVP)

```typescript
// Simple middleware for API key validation
function requireApiKey(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  // Simple validation (for MVP - use env var)
  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  next();
}

// Apply to protected routes
app.post('/api/v1/tickets', requireApiKey, async (req, res) => {
  // Handler
});
```

### JWT Auth (When Needed)

```typescript
import jwt from 'jsonwebtoken';

// Generate token (login endpoint)
app.post('/api/v1/auth/login', async (req, res) => {
  const { email, password } = req.body;

  // Validate credentials (check database)
  const user = await validateCredentials(email, password);

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Generate JWT
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET!,
    { expiresIn: '24h' }
  );

  res.json({
    success: true,
    token,
    user: { id: user.id, email: user.email }
  });
});

// Verify token middleware
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.substring(7); // Remove 'Bearer '

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded; // Attach user to request
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Use on protected routes
app.get('/api/v1/me', requireAuth, async (req, res) => {
  res.json({ success: true, user: req.user });
});
```

### Multi-Tenancy (Client ID Header)

```typescript
// Extract client ID from header
function extractClientId(req: Request): string {
  return req.headers['x-client-id'] as string ||
         req.query.clientId as string ||
         process.env.DEFAULT_CLIENT_ID!;
}

// Use in queries
app.get('/api/v1/tickets', async (req, res) => {
  const clientId = extractClientId(req);

  const result = await pool.query(
    'SELECT * FROM tickets WHERE client_id = $1',
    [clientId]
  );

  res.json({ success: true, data: result.rows });
});
```

## Query Parameters (Filtering, Sorting, Pagination)

### Filtering
```typescript
// /api/v1/tickets?status=open&priority=high
app.get('/api/v1/tickets', async (req, res) => {
  const { status, priority, assignee } = req.query;

  let query = 'SELECT * FROM tickets WHERE 1=1';
  const params: any[] = [];

  if (status) {
    params.push(status);
    query += ` AND status = $${params.length}`;
  }

  if (priority) {
    params.push(priority);
    query += ` AND priority = $${params.length}`;
  }

  const result = await pool.query(query, params);
  res.json({ success: true, data: result.rows });
});
```

### Sorting
```typescript
// /api/v1/tickets?sort=created_at&order=desc
app.get('/api/v1/tickets', async (req, res) => {
  const { sort = 'created_at', order = 'desc' } = req.query;

  // Whitelist allowed sort fields (security)
  const allowedFields = ['created_at', 'updated_at', 'priority', 'status'];
  const sortField = allowedFields.includes(sort as string) ? sort : 'created_at';
  const sortOrder = order === 'asc' ? 'ASC' : 'DESC';

  const result = await pool.query(
    `SELECT * FROM tickets ORDER BY ${sortField} ${sortOrder}`
  );

  res.json({ success: true, data: result.rows });
});
```

### Pagination
```typescript
// /api/v1/tickets?page=2&limit=20
app.get('/api/v1/tickets', async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100); // Max 100
  const offset = (page - 1) * limit;

  // Get total count
  const countResult = await pool.query('SELECT COUNT(*) FROM tickets');
  const totalCount = parseInt(countResult.rows[0].count);

  // Get paginated results
  const result = await pool.query(
    'SELECT * FROM tickets ORDER BY created_at DESC LIMIT $1 OFFSET $2',
    [limit, offset]
  );

  res.json({
    success: true,
    data: result.rows,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      hasNext: page * limit < totalCount,
      hasPrev: page > 1
    }
  });
});
```

## Error Handling (Best Practices)

### Global Error Handler

```typescript
// ✅ CORRECT - Catch-all error middleware (place last)
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);

  // Don't expose internal errors to clients
  res.status(500).json({
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { details: err.message })
  });
});
```

### Async Error Wrapper

```typescript
// Helper to catch async errors
function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Use it
app.get('/api/v1/tickets/:id', asyncHandler(async (req, res) => {
  const result = await pool.query('SELECT * FROM tickets WHERE id = $1', [req.params.id]);

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Not found' });
  }

  res.json({ success: true, data: result.rows[0] });
}));
```

## CORS (Cross-Origin Requests)

```typescript
import cors from 'cors';

// ✅ SIMPLE - Allow all origins (development/MVP)
app.use(cors());

// ✅ PRODUCTION - Restrict origins
app.use(cors({
  origin: [
    'https://dashboard.example.com',
    'https://app.example.com'
  ],
  credentials: true // Allow cookies
}));
```

## Rate Limiting (Simple)

```typescript
import rateLimit from 'express-rate-limit';

// Apply to API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests per windowMs
  message: { error: 'Too many requests, please try again later' }
});

app.use('/api/', apiLimiter);
```

## File Uploads (Basic)

```typescript
import multer from 'multer';
import path from 'path';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    // Only images and PDFs
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Upload endpoint
app.post('/api/v1/tickets/:id/attachments', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const { id } = req.params;

  // Save file reference to database
  await pool.query(
    'INSERT INTO attachments (ticket_id, filename, path) VALUES ($1, $2, $3)',
    [id, req.file.originalname, req.file.path]
  );

  res.json({
    success: true,
    file: {
      filename: req.file.originalname,
      size: req.file.size,
      path: req.file.path
    }
  });
});
```

## API Versioning (Simple)

```typescript
// ✅ GOOD - URL versioning (simple, obvious)
app.use('/api/v1', v1Routes);
app.use('/api/v2', v2Routes);

// ❌ AVOID - Header versioning (complex for MVP)
// Accept-Version: v1
```

## Testing APIs (TDD Required)

```typescript
import request from 'supertest';
import app from '../src/server';

describe('Tickets API', () => {
  describe('POST /api/v1/tickets', () => {
    it('should create ticket with valid data', async () => {
      const response = await request(app)
        .post('/api/v1/tickets')
        .send({
          subject: 'Test ticket',
          email: 'user@example.com'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
    });

    it('should return 400 with missing subject', async () => {
      const response = await request(app)
        .post('/api/v1/tickets')
        .send({ email: 'user@example.com' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('required');
    });
  });
});
```

## API Documentation (Minimal for MVP)

```typescript
// ✅ SIMPLE - Inline comments in code
/**
 * GET /api/v1/tickets
 *
 * Query params:
 * - status: open|closed|pending
 * - priority: low|medium|high
 * - page: number (default: 1)
 * - limit: number (default: 50, max: 100)
 *
 * Returns: { success: true, data: Ticket[], pagination: {...} }
 */
app.get('/api/v1/tickets', async (req, res) => {
  // ...
});
```

## Common Mistakes to Avoid

### ❌ Don't Use ORMs for MVP
```typescript
// ❌ WRONG
const tickets = await Ticket.findAll({ where: { status: 'open' } });

// ✅ CORRECT - Direct SQL
const result = await pool.query('SELECT * FROM tickets WHERE status = $1', ['open']);
```

### ❌ Don't Over-abstract
```typescript
// ❌ WRONG
class TicketService {
  async createTicket(dto: CreateTicketDto): Promise<Ticket> { ... }
}

// ✅ CORRECT - Direct route handler
app.post('/api/v1/tickets', async (req, res) => { ... });
```

### ❌ Don't Return Sensitive Data
```typescript
// ❌ WRONG
const user = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
res.json(user.rows[0]); // Includes password hash!

// ✅ CORRECT
const user = await pool.query(
  'SELECT id, email, name FROM users WHERE id = $1',
  [id]
);
res.json(user.rows[0]);
```

## Performance Tips (For Later)

- Use database indexes on frequently queried fields
- Implement caching for expensive queries (Redis)
- Add pagination to all list endpoints
- Use connection pooling (already in pg pool)
- Monitor slow queries and optimize

## References

- REST API Design: https://restfulapi.net/
- Express.js Docs: https://expressjs.com/
- PostgreSQL Node Driver: https://node-postgres.com/

## MVP Reminder

- **Start with simple CRUD**: GET, POST, PUT, DELETE
- **Inline everything**: No services, repositories, or abstractions
- **Hard-code first**: Extract to config only when needed
- **Direct SQL**: No ORM for MVP
- **Test as you go**: TDD is required
