---
name: tdd-jest
description: TDD with Jest + Supertest for Node.js/TypeScript projects. Use when writing tests with Jest, Supertest, or testing-library/react.
disable-model-invocation: true
---

# TDD with Jest + Supertest

Stack-specific testing examples for Node.js/TypeScript projects using Jest and Supertest.

> These examples implement the universal TDD principles from the `tdd-workflow` skill.

## Test Framework

- **Runner**: Jest
- **HTTP Testing**: Supertest
- **Frontend Testing**: @testing-library/react (if applicable)

## API Endpoint Testing

### Step 1: Write Failing Test (RED)
```typescript
// test/routes/items.test.ts
import request from 'supertest';
import app from '../../src/server';

describe('POST /api/v1/items', () => {
  it('should create an item with valid data', async () => {
    const response = await request(app)
      .post('/api/v1/items')
      .send({
        name: 'Test item',
        description: 'A test item',
        category: 'general'
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('Test item');
  });
});
```

### Step 2: Make It Pass (GREEN)
```typescript
// src/routes.ts
app.post('/api/v1/items', async (req, res) => {
  const { name, description, category } = req.body;
  const result = await pool.query(
    'INSERT INTO items (name, description, category) VALUES ($1, $2, $3) RETURNING *',
    [name, description, category]
  );
  res.status(201).json(result.rows[0]);
});
```

### Step 3: Add Error Tests
```typescript
it('should return 400 when name is missing', async () => {
  const response = await request(app)
    .post('/api/v1/items')
    .send({ description: 'No name' });

  expect(response.status).toBe(400);
  expect(response.body.error).toContain('name');
});
```

## Unit Tests

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
});
```

## Database Tests (Use Real DB)

```typescript
import { pool } from '../src/database/connection';

describe('Item creation', () => {
  afterEach(async () => {
    await pool.query('DELETE FROM items WHERE name = $1', ['Test Item']);
  });

  it('inserts item into database', async () => {
    const result = await pool.query(
      'INSERT INTO items (name) VALUES ($1) RETURNING *',
      ['Test Item']
    );
    expect(result.rows[0].name).toBe('Test Item');
  });
});
```

## Component Tests (Frontend)

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import ItemForm from '../components/ItemForm';

describe('ItemForm', () => {
  it('submits form with valid data', () => {
    const onSubmit = jest.fn();
    render(<ItemForm onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Test' } });
    fireEvent.click(screen.getByText('Submit'));
    expect(onSubmit).toHaveBeenCalledWith({ name: 'Test' });
  });
});
```

## Test Organization

```
test/
├── routes/              # API endpoint tests
│   └── items.test.ts
├── utils/               # Utility function tests
│   └── validation.test.ts
├── components/          # Frontend component tests
│   └── ItemCard.test.tsx
└── integration/         # End-to-end tests
    └── item-flow.test.ts
```

## Running Tests

```bash
npm test                      # Run all tests
npm test -- items.test.ts     # Run specific file
npm test -- --watch           # Watch mode
npm test -- --coverage        # With coverage report
```
