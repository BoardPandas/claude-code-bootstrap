---
name: security-practices
description: Universal security principles including authentication, input validation, SQL injection prevention, and secrets management
---

# Security Practices

Universal security principles for building production-ready applications. Apply these practices regardless of your tech stack.

## When to Use This Skill

- Authentication and authorization implementation
- Handling user credentials and sensitive data
- API endpoint creation
- Database query construction
- Secret and configuration management
- Session and token handling
- Input validation and sanitization

## Core Security Principles

### 1. Input Validation
**Always validate and sanitize user input**

- Validate format (email, phone, URL, etc.)
- Check length and size limits
- Whitelist allowed characters
- Reject unexpected input types
- Validate on both client AND server

### 2. Parameterized Queries
**NEVER use string concatenation for SQL queries**

- Use parameterized queries (prepared statements)
- Let the database driver handle escaping
- Prevents SQL injection attacks
- Apply to ALL database operations

### 3. Password Security
**Never store plaintext passwords**

- Use bcrypt or argon2 for hashing
- Salt automatically (modern libraries do this)
- Use appropriate work factor (bcrypt: 10-12)
- Never log passwords
- Enforce minimum strength requirements

### 4. Secret Management
**Never hardcode secrets in code**

- Use environment variables for all secrets
- API keys, database passwords, JWT secrets
- Never commit `.env` files to version control
- Use different secrets per environment
- Rotate secrets periodically

### 5. Authentication
**Implement secure authentication**

- Use JWT or secure session cookies
- Set appropriate expiration times
- Implement token refresh mechanisms
- Require re-authentication for sensitive operations
- Use HTTPS only in production

### 6. Authorization
**Always check permissions before actions**

- Verify user has permission for the resource
- Check on every request (not just first)
- Use role-based access control (RBAC)
- Fail closed (deny by default)
- Never trust client-side permissions

### 7. Rate Limiting
**Prevent abuse and brute force attacks**

- Limit login attempts
- Rate limit API endpoints
- Use progressive delays on failures
- Track by IP and user account
- Return same error message for valid/invalid users

### 8. Error Handling
**Don't leak sensitive information in errors**

- Generic error messages to users
- Detailed errors only in logs
- Don't reveal database structure
- Don't expose stack traces in production
- Log security events for monitoring

## Implementation Examples

### Node.js/TypeScript Example

```typescript
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import { pool } from './db';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ✅ GOOD: Secure authentication endpoint
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // 1. Input validation
    if (!email || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // 2. Parameterized query (prevents SQL injection)
    const result = await pool.query(
      'SELECT id, email, password_hash, role FROM users WHERE email = $1',
      [email]
    );

    if (!result.rows[0]) {
      // Same error message for security
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // 3. Password verification (hashed with bcrypt)
    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      // Same error message for security
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 4. JWT with expiration and secret from env
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET!, // Secret from environment variable
      { expiresIn: '24h' }
    );

    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    // 5. Generic error message, detailed logging
    console.error('Login error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// ✅ GOOD: Secure registration endpoint
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    // Input validation
    if (!email || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    if (!name || name.length < 2) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Hash password with bcrypt
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Parameterized query
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name',
      [email, password_hash, name]
    );

    const user = result.rows[0];

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    res.status(201).json({ token, user });
  } catch (error: any) {
    console.error('Registration error:', error);

    // Handle unique constraint violation
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Email already exists' });
    }

    res.status(500).json({ error: 'Registration failed' });
  }
});

// ✅ GOOD: Authentication middleware
const authenticate = async (req: Request, res: Response, next: Function) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    // Attach user info to request
    req.user = { id: decoded.userId, role: decoded.role };

    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

// ✅ GOOD: Authorization check
const requireAdmin = (req: Request, res: Response, next: Function) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};
```

### ❌ BAD: Insecure Examples (DO NOT USE)

```typescript
// ❌ BAD: Multiple security vulnerabilities
app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // ❌ SQL Injection vulnerability (string concatenation)
  const user = await pool.query(
    `SELECT * FROM users WHERE email = '${email}'`
  );

  // ❌ Plaintext password comparison
  if (user.rows[0].password === password) {
    // ❌ Hardcoded secret
    // ❌ No expiration
    const token = jwt.sign({ userId: user.rows[0].id }, 'secret123');

    // ❌ Returning password hash to client
    res.json({ token, user: user.rows[0] });
  } else {
    // ❌ Revealing information about user existence
    res.status(401).json({ error: 'Password is incorrect' });
  }
});

// ❌ BAD: No input validation
app.post('/api/users', async (req: Request, res: Response) => {
  const { email, role } = req.body;

  // ❌ No validation, allows privilege escalation
  const user = await pool.query(
    'INSERT INTO users (email, role) VALUES ($1, $2)',
    [email, role] // Attacker can set role to 'admin'
  );

  res.json(user.rows[0]);
});
```

## Stack Adapters

### Python (FastAPI/Django)

```python
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel, EmailStr
import bcrypt
import jwt
from datetime import datetime, timedelta
import os
import psycopg2

app = FastAPI()

# ✅ GOOD: Secure login
@app.post("/api/auth/login")
async def login(email: EmailStr, password: str):
    conn = psycopg2.connect(os.getenv('DATABASE_URL'))
    cursor = conn.cursor()

    # Parameterized query
    cursor.execute(
        "SELECT id, email, password_hash FROM users WHERE email = %s",
        (email,)
    )
    user = cursor.fetchone()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Password verification
    if not bcrypt.checkpw(password.encode(), user[2].encode()):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # JWT generation
    token = jwt.encode(
        {"user_id": user[0], "exp": datetime.utcnow() + timedelta(hours=24)},
        os.getenv('JWT_SECRET'),
        algorithm="HS256"
    )

    return {"token": token}
```

### Go

```go
package main

import (
    "database/sql"
    "os"
    "time"
    "golang.org/x/crypto/bcrypt"
    "github.com/golang-jwt/jwt/v5"
)

// ✅ GOOD: Secure login
func Login(db *sql.DB, email, password string) (string, error) {
    // Parameterized query
    var userID int
    var passwordHash string
    err := db.QueryRow(
        "SELECT id, password_hash FROM users WHERE email = $1",
        email,
    ).Scan(&userID, &passwordHash)

    if err != nil {
        return "", errors.New("invalid credentials")
    }

    // Password verification
    err = bcrypt.CompareHashAndPassword(
        []byte(passwordHash),
        []byte(password),
    )
    if err != nil {
        return "", errors.New("invalid credentials")
    }

    // JWT generation
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
        "user_id": userID,
        "exp":     time.Now().Add(24 * time.Hour).Unix(),
    })

    tokenString, err := token.SignedString([]byte(os.Getenv("JWT_SECRET")))
    return tokenString, err
}
```

### Ruby (Rails)

```ruby
# ✅ GOOD: Secure login
class AuthController < ApplicationController
  def login
    email = params[:email]
    password = params[:password]

    # Parameterized query (ActiveRecord does this automatically)
    user = User.find_by(email: email)

    unless user && BCrypt::Password.new(user.password_hash) == password
      render json: { error: 'Invalid credentials' }, status: :unauthorized
      return
    end

    # JWT generation
    token = JWT.encode(
      { user_id: user.id, exp: 24.hours.from_now.to_i },
      ENV['JWT_SECRET'],
      'HS256'
    )

    render json: { token: token }
  end
end
```

### PHP (Laravel)

```php
<?php
// ✅ GOOD: Secure login
public function login(Request $request) {
    $email = $request->input('email');
    $password = $request->input('password');

    // Parameterized query (Laravel does this automatically)
    $user = DB::table('users')
        ->where('email', $email)
        ->first();

    if (!$user || !password_verify($password, $user->password_hash)) {
        return response()->json(['error' => 'Invalid credentials'], 401);
    }

    // JWT generation
    $token = JWT::encode(
        ['user_id' => $user->id, 'exp' => time() + 86400],
        getenv('JWT_SECRET'),
        'HS256'
    );

    return response()->json(['token' => $token]);
}
```

## Universal Security Checklist

Before shipping authentication/sensitive features:

- [ ] All passwords hashed with bcrypt/argon2 (never plaintext)
- [ ] All SQL queries use parameterized queries (no string concatenation)
- [ ] All secrets in environment variables (never hardcoded)
- [ ] Input validation on all endpoints (email format, password length, etc.)
- [ ] JWT/session tokens have expiration times
- [ ] HTTPS enforced in production (redirect HTTP to HTTPS)
- [ ] Rate limiting on authentication endpoints
- [ ] Error messages don't reveal sensitive info (user existence, etc.)
- [ ] Authorization checks on protected resources
- [ ] No sensitive data in logs (passwords, tokens, SSNs, etc.)
- [ ] CORS configured properly (not wildcard `*` in production)
- [ ] XSS prevention (escape output, use Content-Security-Policy)

## Common Security Mistakes

### 1. Trusting Client-Side Validation
```typescript
// ❌ BAD: Only client-side validation
// Client: validates email format
// Server: trusts req.body.email without validation

// ✅ GOOD: Always validate on server
if (!email || !EMAIL_REGEX.test(email)) {
  return res.status(400).json({ error: 'Invalid email' });
}
```

### 2. Exposing User Existence
```typescript
// ❌ BAD: Different messages reveal user existence
if (!user) return res.json({ error: 'User not found' });
if (!validPassword) return res.json({ error: 'Wrong password' });

// ✅ GOOD: Same message for both
return res.status(401).json({ error: 'Invalid credentials' });
```

### 3. Not Using HTTPS
```typescript
// ❌ BAD: Allowing HTTP in production
app.listen(3000);

// ✅ GOOD: Force HTTPS in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      return res.redirect(`https://${req.header('host')}${req.url}`);
    }
    next();
  });
}
```

### 4. Logging Sensitive Data
```typescript
// ❌ BAD: Logging passwords
console.log('User login:', req.body); // Contains password!

// ✅ GOOD: Log only safe data
console.log('User login attempt:', { email: req.body.email });
```

## Production Security Requirements

For production deployments, ensure:

1. **Environment Variables**: All secrets in `.env` (not in code)
2. **HTTPS Only**: Force HTTPS in production
3. **Rate Limiting**: Implement on auth endpoints
4. **Monitoring**: Log security events (failed logins, permission denials)
5. **Dependency Scanning**: Regular security audits (npm audit, etc.)
6. **Secrets Rotation**: Rotate JWT secrets, API keys periodically
7. **Backup Strategy**: Encrypted backups of sensitive data
8. **Access Control**: Principle of least privilege for database users

## Quick Reference

| Scenario | Solution |
|----------|----------|
| Storing passwords | Hash with bcrypt or argon2 (never plaintext) |
| SQL queries | Parameterized queries (never string concatenation) |
| Storing API keys | Environment variables (never in code) |
| Authentication | JWT or sessions with expiration |
| Authorization | Check permissions on every request |
| Input validation | Whitelist + regex + length checks |
| Rate limiting | Use your framework's rate limiting middleware |
| HTTPS | Force redirect HTTP → HTTPS in production |

## Resources

- **OWASP Top 10**: https://owasp.org/www-project-top-ten/
- **OWASP Cheat Sheets**: https://cheatsheetseries.owasp.org/
- **bcrypt**: Work factor calculator
- **JWT**: https://jwt.io/

---

**Remember**: Security is not optional. These practices prevent 95% of common vulnerabilities. Apply them from day one, not as an afterthought.
