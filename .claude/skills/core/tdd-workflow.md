# Test-Driven Development (TDD) Workflow

Test-Driven Development is **REQUIRED** for all coding tasks on this project.

## TDD Cycle (Red-Green-Refactor)

```
1. 🔴 RED: Write a failing test
2. 🟢 GREEN: Write minimal code to pass
3. 🔵 REFACTOR: Clean up (keep it simple!)
```

## The Process

### Step 1: Write Test First (RED)

Before writing ANY production code, write a test:

```typescript
// test/routes/tickets.test.ts
import request from 'supertest';
import app from '../../src/server-simple';

describe('POST /api/v1/tickets', () => {
  it('should create a ticket with valid data', async () => {
    const response = await request(app)
      .post('/api/v1/tickets')
      .send({
        subject: 'Test ticket',
        email: 'user@example.com',
        priority: 'medium'
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.subject).toBe('Test ticket');
  });
});
```

**Run test** - It should FAIL (endpoint doesn't exist yet).

### Step 2: Write Minimal Code (GREEN)

Write the simplest code to make the test pass:

```typescript
// src/routes-simple.ts
app.post('/api/v1/tickets', async (req, res) => {
  const { subject, email, priority } = req.body;

  const result = await pool.query(
    'INSERT INTO tickets (subject, requester_email, priority) VALUES ($1, $2, $3) RETURNING *',
    [subject, email, priority]
  );

  res.status(201).json(result.rows[0]);
});
```

**Run test** - It should PASS (green).

### Step 3: Refactor (BLUE)

Clean up code while keeping tests green:

```typescript
// Add validation
app.post('/api/v1/tickets', async (req, res) => {
  const { subject, email, priority } = req.body;

  // Validation
  if (!subject) {
    return res.status(400).json({ error: 'Subject required' });
  }

  const result = await pool.query(
    'INSERT INTO tickets (subject, requester_email, priority) VALUES ($1, $2, $3) RETURNING *',
    [subject, email, priority || 'medium']
  );

  res.status(201).json(result.rows[0]);
});
```

**Run test** - Still passes.

### Step 4: Add More Tests

Test error cases:

```typescript
it('should return 400 when subject is missing', async () => {
  const response = await request(app)
    .post('/api/v1/tickets')
    .send({
      email: 'user@example.com'
    });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Subject required');
});
```

**Run test** - Should pass (we already added validation).

## Test Structure

### Unit Tests (Functions)
```typescript
// test/utils/validation.test.ts
import { validateEmail } from '../../src/utils/validation';

describe('validateEmail', () => {
  it('should return true for valid email', () => {
    expect(validateEmail('user@example.com')).toBe(true);
  });

  it('should return false for invalid email', () => {
    expect(validateEmail('invalid')).toBe(false);
  });

  it('should return false for empty email', () => {
    expect(validateEmail('')).toBe(false);
  });
});
```

### Integration Tests (API Endpoints)
```typescript
// test/routes/tickets.test.ts
describe('Ticket API', () => {
  beforeEach(async () => {
    // Clean up database before each test
    await pool.query('DELETE FROM tickets WHERE subject LIKE \'Test%\'');
  });

  describe('POST /api/v1/tickets', () => {
    it('should create ticket', async () => {
      // Test implementation
    });

    it('should validate input', async () => {
      // Test validation
    });
  });

  describe('GET /api/v1/tickets', () => {
    it('should list tickets', async () => {
      // Test listing
    });
  });
});
```

## What to Test

### ✅ DO Test
- **Happy paths** - Core functionality works
- **Error cases** - Invalid inputs handled
- **Edge cases** - Boundary conditions
- **Critical paths** - User-facing features
- **Business logic** - Core algorithms

### ❌ DON'T Test (For MVP)
- **Third-party libraries** - Trust they work
- **Framework internals** - Trust Express/Next.js works
- **Database engine** - Trust PostgreSQL works
- **Trivial getters/setters** - Not worth the time
- **Over-mocking** - Use real DB when possible

## Testing Patterns

### API Endpoint Testing
```typescript
import request from 'supertest';
import app from '../src/server-simple';

describe('Ticket endpoints', () => {
  it('creates a ticket', async () => {
    const response = await request(app)
      .post('/api/v1/tickets')
      .send({ subject: 'Test', email: 'test@test.com' });

    expect(response.status).toBe(201);
    expect(response.body.id).toBeDefined();
  });
});
```

### Database Testing (Use Real DB)
```typescript
import { pool } from '../src/database/connection';

describe('Ticket creation', () => {
  afterEach(async () => {
    // Clean up test data
    await pool.query('DELETE FROM tickets WHERE subject = $1', ['Test Ticket']);
  });

  it('inserts ticket into database', async () => {
    const result = await pool.query(
      'INSERT INTO tickets (subject) VALUES ($1) RETURNING *',
      ['Test Ticket']
    );

    expect(result.rows[0].subject).toBe('Test Ticket');
  });
});
```

### Component Testing (Frontend)
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import TicketForm from '../components/TicketForm';

describe('TicketForm', () => {
  it('submits form with valid data', () => {
    const onSubmit = jest.fn();
    render(<TicketForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText('Subject'), {
      target: { value: 'Test Ticket' }
    });

    fireEvent.click(screen.getByText('Submit'));

    expect(onSubmit).toHaveBeenCalledWith({
      subject: 'Test Ticket'
    });
  });

  it('shows error for empty subject', () => {
    render(<TicketForm onSubmit={jest.fn()} />);

    fireEvent.click(screen.getByText('Submit'));

    expect(screen.getByText('Subject is required')).toBeInTheDocument();
  });
});
```

## Test Organization

```
test/
├── routes/              # API endpoint tests
│   ├── tickets.test.ts
│   ├── agents.test.ts
│   └── clients.test.ts
├── utils/               # Utility function tests
│   └── validation.test.ts
├── components/          # Frontend component tests
│   └── TicketCard.test.tsx
└── integration/         # End-to-end tests
    └── ticket-flow.test.ts
```

## Running Tests

### Development Workflow
```bash
# Run all tests
npm test

# Run specific test file
npm test -- tickets.test.ts

# Run in watch mode
npm test -- --watch

# Run with coverage
npm test -- --coverage
```

### Before Committing
```bash
# Always run full test suite
npm test

# Ensure all tests pass
# If any fail, fix before committing
```

## TDD for MVP - Keep It Simple

### ✅ Good Test (Simple, Focused)
```typescript
it('creates ticket with subject', async () => {
  const response = await request(app)
    .post('/api/v1/tickets')
    .send({ subject: 'Test' });

  expect(response.status).toBe(201);
  expect(response.body.subject).toBe('Test');
});
```

### ❌ Bad Test (Over-Mocked, Complex)
```typescript
it('creates ticket with dependency injection', async () => {
  const mockRepo = createMockRepository();
  const mockService = createMockService(mockRepo);
  const mockValidator = createMockValidator();
  // ... 50 lines of mocking

  // This is over-engineered for MVP
});
```

## TDD Benefits for MVP

### Why TDD Matters
1. **Confidence** - Know your code works
2. **Documentation** - Tests show how to use code
3. **Regression prevention** - Catch breaks early
4. **Better design** - Testable code is simpler code
5. **Faster debugging** - Tests pinpoint issues

### MVP-Specific Benefits
- **Fast iteration** - Change with confidence
- **Refactor safely** - Tests catch regressions
- **Prevent tech debt** - Good tests = good design
- **Ship with confidence** - Know it works

## Common TDD Mistakes

### ❌ Mistake 1: Testing Implementation
```typescript
// Bad - tests implementation details
it('calls database with correct query', () => {
  const spy = jest.spyOn(pool, 'query');
  createTicket({ subject: 'Test' });
  expect(spy).toHaveBeenCalledWith('INSERT INTO...');
});
```

### ✅ Fix: Test Behavior
```typescript
// Good - tests behavior/outcome
it('creates ticket in database', async () => {
  const ticket = await createTicket({ subject: 'Test' });
  expect(ticket.subject).toBe('Test');

  // Verify in database
  const result = await pool.query('SELECT * FROM tickets WHERE id = $1', [ticket.id]);
  expect(result.rows[0].subject).toBe('Test');
});
```

### ❌ Mistake 2: Too Many Mocks
```typescript
// Bad - mocking everything
const mockDB = jest.fn();
const mockValidator = jest.fn();
const mockLogger = jest.fn();
// ... too complex
```

### ✅ Fix: Use Real Dependencies
```typescript
// Good - use real database, simple test
const result = await pool.query('INSERT INTO tickets...');
expect(result.rows[0]).toBeDefined();
```

### ❌ Mistake 3: Testing Frameworks
```typescript
// Bad - testing Express/Next.js internals
it('uses Express correctly', () => {
  expect(app).toBeInstanceOf(Express);
});
```

### ✅ Fix: Test Your Code
```typescript
// Good - test your endpoint behavior
it('returns 201 on successful creation', async () => {
  const response = await request(app).post('/tickets').send({...});
  expect(response.status).toBe(201);
});
```

## TDD Checklist

Before implementing any feature:

- [ ] Write failing test first (RED)
- [ ] Run test - confirm it fails
- [ ] Write minimal code to pass (GREEN)
- [ ] Run test - confirm it passes
- [ ] Add error case tests
- [ ] Add edge case tests (critical ones only)
- [ ] Refactor while keeping tests green
- [ ] Run full test suite before committing

## Remember

- **Test first, code second** (always)
- **Keep tests simple** (no over-mocking)
- **Test behavior, not implementation**
- **Use real dependencies** (DB, APIs) when sensible
- **Tests are documentation** (make them readable)
- **Green tests before committing** (always)

### TDD Mantra

> **Red → Green → Refactor → Repeat**

Write the test. Make it pass. Clean it up. Ship it.
