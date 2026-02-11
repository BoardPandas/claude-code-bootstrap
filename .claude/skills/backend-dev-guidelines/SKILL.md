---
name: backend-dev-guidelines
description: Universal backend API development principles. Use when working on backend routes, API endpoints, handlers, controllers, database queries, middleware, or server-side code.
---

# Backend Development Guidelines

Universal principles for backend API development — applicable to any language and framework.

> For stack-specific code examples, see the relevant skill directory (e.g., `node-express`, `python-fastapi`, `go-gin`).

## MVP Principles (Most Important!)

### Always Follow
- **Simple functions** over classes
- **Direct database queries** over ORMs (for MVP — extract a data layer after 3+ patterns emerge)
- **Inline logic** over abstraction
- **Hard-code first**, extract when patterns emerge (Rule of Three)
- **One file** for related functionality until it gets unwieldy
- **Synchronous** over async (unless performance requires it)

### Never Use (Unless Justified)
- Service layers or repositories (for MVP)
- Factory patterns (unless 5+ implementations)
- Dependency injection frameworks (unless team >5 devs)
- Abstract base classes (unless 3+ concrete implementations)
- Complex type hierarchies
- ORMs (use direct parameterized queries)

## Route / Handler Structure

Keep route handlers simple and self-contained:

1. **Validate input** at the top of the handler (early return on invalid)
2. **Execute the query** or business logic
3. **Return the result** with appropriate status codes
4. **Catch errors** and return user-friendly messages

Avoid splitting a single request across service layers, repositories, and DTOs. A handler that validates, queries, and responds in one place is easier to read, test, and debug.

## Database Queries

### Direct Parameterized Queries
- Always use parameterized queries (prevents SQL injection)
- Write SQL directly — it's readable and debuggable
- Use transactions for multi-step operations
- Add indexes for columns you query frequently

### When to Consider an ORM
- After you have 3+ repeated query patterns that would benefit from abstraction
- When your team has standardized on one and everyone knows it
- Never at the start of a new project

## Input Validation

- Validate at the handler level (inline, not in separate validation layers)
- Use early return pattern — reject bad input before doing any work
- Keep validation simple: required fields, format checks, allowed values
- Use your framework's built-in validation if it has one (e.g., Pydantic, Gin binding tags)
- Don't pull in complex validation libraries for MVP

## Error Handling

Every handler should:
1. Wrap external calls (database, APIs) in error handling
2. Log errors with context (what operation failed, relevant IDs)
3. Return user-friendly error messages (never expose stack traces or SQL in production)
4. Use appropriate HTTP status codes (400 for bad input, 401/403 for auth, 500 for server errors)

## Multi-Tenancy (If Applicable)

If your app serves multiple tenants:
- Extract tenant ID from request headers, query params, or auth token
- Filter all queries by tenant ID
- Keep the extraction logic in one place (a helper function or middleware)

## Common Patterns

### Pagination
- Accept `limit` and `offset` (or `page` and `page_size`) as query parameters
- Set sensible defaults (e.g., limit=20)
- Return pagination metadata with results

### Background Jobs
- Start simple: polling loop that checks for pending work
- Don't introduce a job queue framework until you have proven the need
- Log job processing results

### Authentication
- Use JWT or session-based auth (whichever your framework supports natively)
- Store secrets in environment variables
- Add auth middleware to protected routes
- Re-authenticate for destructive operations

## Security (MVP Basics)

### Required
- Parameterized queries (prevent SQL injection)
- Environment variables for all secrets
- Basic input validation on all endpoints
- HTTPS in production
- Authentication on protected routes

### Defer for MVP
- Advanced rate limiting
- Complex authorization schemes
- Input sanitization libraries
- CSRF protection (unless using cookie-based sessions)

## Checklist Before Committing

- [ ] Following MVP principles (no service layers, repositories, etc.)
- [ ] Using direct parameterized queries (no ORM)
- [ ] Tests written first (TDD)
- [ ] Input validation present
- [ ] Error handling on all external calls
- [ ] No hardcoded secrets
- [ ] Handler is readable and self-contained
- [ ] Can explain to another dev in 30 seconds

## Common Mistakes to Avoid

- **Over-engineering**: Don't create service/repository layers for MVP
- **Complex validation libraries**: Validate inline or with framework builtins
- **ORMs at project start**: Direct queries are simpler and more transparent
- **Abstracting too early**: Wait for the 3rd duplicate before extracting

## Remember

- **Simple > Complex** (always)
- **Working > Perfect** (ship it)
- **Direct > Abstracted** (inline logic)
- **TDD** (write tests first)
- **MVP mindset** (build for your actual scale, not hypothetical millions)

When in doubt, ask: "What's the simplest thing that could possibly work?"
