# Complete Working Example - End to End

> **Note**: This example uses the Node.js/Express/React stack. The same workflow and principles apply to any stack -- just substitute your framework's equivalents.

Real-world example of building a feature from scratch using the complete Claude Code system.

## Scenario

Add a "User Registration" feature to a new web application.

**Requirements**:
- API endpoint for registration
- Email validation
- Password hashing
- Database storage
- Frontend form
- Tests

## The Old Way (Without System)

```
Day 1:
- Developer codes registration endpoint
- Creates complex service layer
- Adds ORM models
- Writes 15 files across multiple directories
- No tests yet (will add later)
- Pushes broken build

Day 2:
- Senior dev reviews PR
- "This is over-engineered"
- "Where are the tests?"
- "Build is broken"
- "Code isn't formatted"
- Back to drawing board

Day 3:
- Refactors to simpler approach
- Adds tests
- Fixes build
- Formats code
- Finally approved

Day 4:
- Merges to main
- Deploys
- Finds bugs in production
```

**Total**: 4 days, multiple iterations, production bugs

## The New Way (With Full System)

### Step 1: Plan the Feature

```
You: "I want to add user registration with email/password"

[Skill auto-activates: backend-dev-guidelines, security-practices, production-principles, tdd-workflow]

Claude: "Should I use strategic-plan-architect to plan this feature?"

You: "/dev-docs"
```

**Result**: Creates `.claude/dev-docs/user-registration-plan.md`

```markdown
# User Registration Implementation Plan

## Overview
- Objective: Email/password registration
- Approach: Simple POST endpoint, direct SQL, JWT auth
- Estimated Effort: 2-3 hours

## Phase 1: Backend (1 hour)
### Steps
1. Create migration: users table
2. Create POST /api/auth/register endpoint
3. Validate email format
4. Hash password with bcrypt
5. Insert user, return JWT
6. Add UICs (API0010, TBL0004, ERR0010-ERR0012)

### Success Criteria
- [ ] Tests pass
- [ ] Email validation works
- [ ] Passwords hashed
- [ ] JWTs generated

### Risks
- Risk: Duplicate emails | Mitigation: UNIQUE constraint

## Phase 2: Frontend (1 hour)
### Steps
1. Create RegisterForm component
2. Email/password inputs with validation
3. Submit handler calling API
4. Error display
5. Success redirect
6. Add UICs (REGFRM0001, REGINP0001-0002, REGERR0001)

### Success Criteria
- [ ] Form validates
- [ ] API called correctly
- [ ] Errors displayed
- [ ] Success redirects

## Phase 3: Testing (30 min)
### Steps
1. Test API with valid data
2. Test API with invalid email
3. Test API with weak password
4. Test duplicate registration
5. Test frontend form validation

## MVP Checklist
- [✓] Single file for API (routes-simple.ts)
- [✓] Direct SQL (no ORM)
- [✓] Inline validation
- [✓] Hardcoded JWT secret (for now)
- [✓] Simple functional component
```

**Time**: 5 minutes

### Step 2: Implement Backend (TDD)

```
You: "Implement Phase 1, following TDD workflow"

[Skills active: backend-dev-guidelines, tdd-workflow, security-practices]
```

Claude creates:

#### Test First (`src/routes-simple.test.ts`)

```typescript
describe('POST /api/auth/register', () => {
  test('registers user with valid data', async () => { // API0010
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'user@example.com',
        password: 'SecurePass123!'
      });

    expect(response.status).toBe(201);
    expect(response.body.token).toBeDefined();
    expect(response.body.user.email).toBe('user@example.com');
  });

  test('rejects invalid email', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'invalid',
        password: 'SecurePass123!'
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('ERR0010'); // Invalid email UIC
  });

  test('rejects weak password', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'user@example.com',
        password: '123'
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('ERR0011'); // Weak password UIC
  });

  test('rejects duplicate email', async () => {
    // Register first user
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'user@example.com',
        password: 'SecurePass123!'
      });

    // Try to register again
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'user@example.com',
        password: 'SecurePass123!'
      });

    expect(response.status).toBe(409);
    expect(response.body.error).toBe('ERR0012'); // Duplicate email UIC
  });
});
```

#### Implementation (`src/routes-simple.ts`)

```typescript
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Simple email validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 8;

app.post('/api/auth/register', async (req, res) => { // API0010
  try {
    const { email, password } = req.body;

    // Validate email
    if (!email || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({
        error: 'ERR0010',
        message: 'Invalid email address'
      });
    }

    // Validate password
    if (!password || password.length < PASSWORD_MIN_LENGTH) {
      return res.status(400).json({
        error: 'ERR0011',
        message: 'Password must be at least 8 characters'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const result = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email', // TBL0004
      [email, hashedPassword]
    );

    const user = result.rows[0];

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'dev-secret', // Hardcoded fallback for MVP
      { expiresIn: '24h' }
    );

    res.status(201).json({
      user: { id: user.id, email: user.email },
      token
    });

  } catch (error) {
    // Handle duplicate email (PostgreSQL unique constraint)
    if (error.code === '23505') { // PostgreSQL duplicate key error
      return res.status(409).json({
        error: 'ERR0012',
        message: 'Email already registered'
      });
    }

    console.error('Registration error:', error);
    res.status(500).json({
      error: 'ERR0013',
      message: 'Registration failed'
    });
  }
});
```

#### Database Migration (`database/migrations/004_create_users_table.sql`)

```sql
-- TBL0004: users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL, -- COL0010
  password_hash VARCHAR(255) NOT NULL, -- COL0011
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- COL0012
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- COL0013
);

-- IDX0004: Index on email for fast lookups
CREATE INDEX idx_users_email ON users(email);
```

#### Update UIC Master List

Claude automatically reminds:

```
You: [After implementation]

Claude: "Don't forget to update docs/UIC_MASTER_LIST.md with new UICs"
```

Add to `docs/UIC_MASTER_LIST.md`:

```markdown
## Backend UICs

### API Endpoints
- API0010: POST /api/auth/register - User registration

### Database Tables
- TBL0004: users - User accounts

### Database Columns
- COL0010: users.email - User email address
- COL0011: users.password_hash - Hashed password
- COL0012: users.created_at - Account creation timestamp
- COL0013: users.updated_at - Last update timestamp

### Error Codes
- ERR0010: Invalid email address format
- ERR0011: Password too weak (< 8 chars)
- ERR0012: Email already registered
- ERR0013: Registration system failure
```

**Time**: 30 minutes (tests + code + migration + docs)

### Step 3: Run Tests & Fix

```
You: "/build-and-fix"

[Hook runs automatically after Claude finishes]
✅ Code formatted (Prettier)
✅ Build check passed (TypeScript)
🧪 Running tests...
  ✅ All 4 tests pass
✅ No error patterns detected
```

**Time**: 2 minutes

### Step 4: Implement Frontend

```
You: "Now implement Phase 2 (frontend), following the plan"

[Skills active: frontend-dev-guidelines, production-principles, UIC_Guidelines]
```

#### Component (`dashboard/src/components/RegisterForm.tsx`)

```tsx
import { useState } from 'react';
import { TextField, Button, Alert, Box } from '@mui/material';

export default function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        // Display error using UIC for debugging
        setError(`${data.message} (${data.error})`);
        return;
      }

      // Success - store token and redirect
      localStorage.setItem('token', data.token);
      window.location.href = '/dashboard';

    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      data-uic="REGFRM0001"
      sx={{ maxWidth: 400, mx: 'auto', p: 3 }}
    >
      <TextField
        data-uic="REGINP0001"
        fullWidth
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        margin="normal"
      />

      <TextField
        data-uic="REGINP0002"
        fullWidth
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        margin="normal"
        helperText="At least 8 characters"
      />

      {error && (
        <Alert severity="error" data-uic="REGERR0001" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      <Button
        data-uic="REGBUT0001"
        type="submit"
        variant="contained"
        fullWidth
        disabled={loading}
        sx={{ mt: 2 }}
      >
        {loading ? 'Registering...' : 'Register'}
      </Button>
    </Box>
  );
}
```

#### Add UICs to Master List

```markdown
## Frontend UICs

### Registration Page (REG)
- REGFRM0001: Registration form container
- REGINP0001: Email input field
- REGINP0002: Password input field
- REGBUT0001: Submit registration button
- REGERR0001: Error message display
```

**Time**: 20 minutes

### Step 5: Auto-Deploy (Dev Environment)

```
[Hook configured to auto-deploy on commit]

You: "Commit and push this"

Claude:
git add .
git commit -m "Add user registration feature

- API endpoint with validation (API0010)
- Users table with unique email constraint (TBL0004)
- Frontend registration form (REGFRM0001)
- Error handling with UICs (ERR0010-ERR0013)
- Tests for all scenarios

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"
git push

[Auto-deploy hook triggers]
🚀 Deploying to development...
✅ Build successful
✅ Tests passed
✅ Deployed to https://dev.yourapp.com
```

**Time**: 2 minutes

### Step 6: Test End-to-End

```
You: "Test the registration flow manually"

Manual testing:
1. Go to https://dev.yourapp.com/register
2. Try invalid email → See "ERR0010" error
3. Try weak password → See "ERR0011" error
4. Register with valid data → Success!
5. Try same email again → See "ERR0012" error

All works! ✅
```

**Time**: 5 minutes

### Step 7: Code Review

```
You: "/code-review"

[Agent: code-architecture-reviewer]
```

Output:

```markdown
# Code Architecture Review - User Registration

## Executive Summary
✅ Well-implemented MVP feature following all principles

## Findings

### ✅ Excellent Practices
1. **Simple, Direct Implementation**
   - Location: routes-simple.ts:API0010
   - Single endpoint, inline validation, direct SQL
   - Perfect MVP approach

2. **TDD Followed**
   - Location: routes-simple.test.ts
   - Tests written first, 100% coverage
   - Clear test cases for all scenarios

3. **UICs Applied Consistently**
   - Backend: API0010, TBL0004, ERR0010-ERR0013
   - Frontend: REGFRM0001, REGINP0001-0002
   - Master list updated

4. **Security Done Right**
   - Passwords hashed with bcrypt
   - Email validation
   - JWT with expiration
   - SQL injection prevented (parameterized queries)

### ⚠️ Minor Improvements
1. **Hardcoded JWT Secret**
   - Location: routes-simple.ts:API0010
   - Using fallback 'dev-secret'
   - Fix: Add to .env before production
   - Priority: Low (fine for MVP)

2. **No Rate Limiting**
   - Location: POST /api/auth/register
   - Could be abused
   - Fix: Add rate limiting when you have users
   - Priority: Low (premature optimization)

## MVP Compliance Score: 98/100

**Recommendation**: SHIP IT

Minor improvements can be addressed when you have actual users.
```

**Time**: 2 minutes

## Total Time Breakdown

| Task | Old Way | New Way | Savings |
|------|---------|---------|---------|
| Planning | 0 (none) | 5 min | -5 min |
| Backend Code | 2 hours | 30 min | 1.5 hours |
| Tests | 1 hour (later) | 0 min (TDD) | 1 hour |
| Frontend | 1 hour | 20 min | 40 min |
| Debugging | 2 hours | 0 min (tests caught issues) | 2 hours |
| Formatting/Build | 30 min | 0 min (hooks) | 30 min |
| Code Review Fixes | 3 hours | 0 min (right first time) | 3 hours |
| Documentation | 30 min | 2 min (UICs auto-doc'd) | 28 min |
| Deployment | 1 hour | 2 min (automated) | 58 min |
| Bug Fixes | 4 hours | 0 min (caught by tests) | 4 hours |

**Old Total**: ~4 days (32 hours)
**New Total**: ~1 hour
**Savings**: 31 hours (97% faster!)

## What Made This Possible?

### 1. Skills Auto-Activated
- `backend-dev-guidelines` → Direct SQL, simple endpoint
- `security-practices` → Password hashing, input validation, parameterized queries
- `tdd-workflow` → Tests first
- `frontend-dev-guidelines` → Simple component
- `production-principles` → Prevented over-engineering
- `UIC_Guidelines` → Every element identifiable

### 2. Strategic Planning
- `strategic-plan-architect` agent created clear plan
- Broke into phases
- Identified risks upfront
- Estimated time accurately

### 3. TDD Workflow
- Tests written first
- Caught bugs before they shipped
- Documented expected behavior
- Enabled confident refactoring

### 4. UIC System
- Every component identifiable
- Debugging is instant
- Logs are searchable
- Support tickets can reference specific elements

### 5. Hooks Automation
- Code formatted automatically
- Build checked after every change
- Error patterns detected
- Zero manual cleanup

### 6. Production Principles Enforcement
- No service layers
- No ORM
- No premature abstraction
- Simple, direct, production-ready code
- Shipped in 1 hour instead of 4 days

## Key Files Created

```
src/
  routes-simple.ts              # +30 lines (API endpoint)
  routes-simple.test.ts         # +60 lines (tests)

dashboard/src/components/
  RegisterForm.tsx              # +60 lines (UI component)

database/migrations/
  004_create_users_table.sql    # +10 lines (schema)

docs/
  UIC_MASTER_LIST.md           # +15 lines (UICs documented)

.claude/dev-docs/
  user-registration-plan.md     # (implementation plan)
  user-registration-context.md  # (decisions documented)
  user-registration-tasks.md    # (tracking checklist)

Total: ~175 lines of code, fully tested, documented, and shipped
```

## Lessons Demonstrated

1. **Planning Saves Time**: 5 minutes planning → 31 hours saved
2. **TDD Works**: Tests first caught all bugs before production
3. **Simple Beats Complex**: Single file > 15 files scattered
4. **UICs Are Magic**: Instant debugging vs hours of searching
5. **Automation Matters**: Hooks eliminated all manual cleanup
6. **MVP Ships**: No over-engineering = shipped in 1 hour

## What This Looks Like in Practice

**Day 1 Morning**:
```
9:00am: "Let's add user registration"
9:05am: Plan created with /dev-docs
9:10am: Backend tests written
9:20am: Backend implemented and passing
9:30am: Frontend component created
9:45am: Manual testing complete
9:50am: Code review passed
10:00am: Deployed to production
10:05am: First user registered!
```

**Result**: Feature live in 1 hour. Rest of day for new features.

Compare to old way: 4 days of back-and-forth.

## Scaling This Approach

### After 10 Features

You'll have:
- Consistent codebase (all follow same patterns)
- Comprehensive test suite (TDD from start)
- Complete UIC documentation (every component ID'd)
- Fast debugging (UICs + simple code)
- Team alignment (everyone uses same system)

### After 100 Features

You'll have:
- Shipped 100 features in time old way ships 25
- Minimal technical debt (simple code is maintainable)
- New developers productive day 1 (skills guide them)
- Rare production bugs (TDD catches them)
- Happy users (fast shipping = more features)

## Try It Yourself

Follow this exact example for your next feature:

1. Use `/dev-docs` to plan
2. Write tests first
3. Implement simply (one file)
4. Add UICs everywhere
5. Let hooks clean up
6. Run `/code-review`
7. Ship it

Track your time. Compare to your usual process.

**Bet**: You'll ship 5-10x faster with higher quality.

---

This is what's possible when all the pieces work together. The system pays for itself on the very first feature.
