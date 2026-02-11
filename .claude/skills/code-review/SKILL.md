---
name: code-review
description: Perform architecture review focused on production principles and best practices
disable-model-invocation: true
allowed-tools:
  - Read
  - Glob
  - Grep
---

# Code Review - Architecture & Best Practices

Perform a comprehensive code review focused on architecture, production principles, and best practices.

## Instructions

Review the recently modified code for adherence to project standards.

### Review Checklist

#### 1. Production Principles Compliance
- [ ] Following "simplest reliable solution" principle
- [ ] No unjustified enterprise patterns (check criteria: 3+ implementations, 5+ data sources, etc.)
- [ ] Using preferred patterns (direct queries with transactions, error handling)
- [ ] Building for your current scale (not 1, not hypothetical millions)
- [ ] Abstraction only after 3rd duplicate (Rule of Three)
- [ ] Functions under 200 lines (extract at 200, not 50)

#### 2. Production Quality (Required)
- [ ] Error handling on ALL external calls (API, database, file system)
- [ ] Retry logic for transient failures (3 attempts, exponential backoff)
- [ ] Logging with context (tenant, user, operation, timestamp)
- [ ] Input validation before database writes
- [ ] Database transactions for multi-step operations
- [ ] User-friendly error messages (not raw stack traces)

#### 3. Code Quality
- [ ] Functions are focused and single-purpose
- [ ] Minimal nesting (prefer early returns)
- [ ] No complex type gymnastics or unnecessary abstractions
- [ ] Comments for complex logic
- [ ] No dead/commented code

#### 4. Architecture
- [ ] Minimal abstraction (wait for 3rd duplicate)
- [ ] Inline logic or extracted functions (not over-modularized)
- [ ] Config for secrets/URLs, constants for other values
- [ ] Transactions for multi-step database operations
- [ ] Reasonable file count (5-10 files for complex features is ok)

#### 5. Security (Production)
- [ ] No hardcoded secrets in code (use env vars)
- [ ] Input validation and sanitization
- [ ] Injection-protected queries (parameterized queries, ORMs with safe defaults)
- [ ] Authentication enforced on protected routes
- [ ] Rate limiting on public endpoints
- [ ] Multi-tenant filter where applicable (e.g., WHERE tenant_id = ?)

#### 6. Performance (Measured)
- [ ] No obvious O(n^2) loops on user data
- [ ] Database queries aren't N+1 problems
- [ ] No unnecessary API calls in loops
- [ ] Database indexes for frequent queries
- [ ] Caching for expensive operations (>500ms)
- [ ] Optimize for your current scale, not hypothetical millions

#### 7. Testing (TDD Requirement)
- [ ] Tests written BEFORE implementation
- [ ] Core functionality is tested
- [ ] Edge cases covered
- [ ] Tests are simple and focused
- [ ] No complex test frameworks or mocking

#### 8. UI/UX (If Reviewing Frontend Code)
**Only check these if the review includes frontend code:**
- [ ] Using design tokens (not hardcoded colors or magic numbers)
- [ ] Using semantic tokens for colors, spacing, typography
- [ ] Consistent spacing scale
- [ ] Accessibility basics (contrast, ARIA labels, keyboard navigation)
- [ ] Theme support (if applicable to the project)
- [ ] Responsive design (mobile/tablet/desktop)
- [ ] Component patterns consistent with project design system

## Review Output

Provide feedback in this format:

### Good Practices Found
- [Specific example of production-aligned code: simple + reliable]
- [Another example]

### Concerns
1. **[Issue Type]**: [Specific concern]
   - **Location**: [file:line]
   - **Current**: [What it does now]
   - **Suggestion**: [Fix aligned with production principles]
   - **Priority**: [High/Medium/Low]

### Production Principles Violations
1. **[Violation]**: [Unjustified pattern or missing production requirement]
   - **Location**: [file:line]
   - **Why it's a problem**: [Over-engineering OR missing error handling/logging/validation]
   - **Fix**: [Simpler approach OR add required production quality]

### Quick Wins
- [Easy improvements that add value]
- [Production quality additions (error handling, logging, validation)]

### Technical Debt (Document but Accept)
- [Reasonable shortcuts that work at current scale]
- [Things to revisit when scaling significantly]
- [Constants to extract when used 3+ times]

## Review Guidelines

### Be Pragmatic
- Simple + Reliable > Complex + Perfect
- Works at current scale > Works for millions
- Abstract after 3rd duplicate > Abstract speculatively

### Focus On (High Priority)
- Missing production requirements (error handling, logging, validation)
- Unjustified enterprise patterns (check criteria)
- Security issues
- Obvious bugs or logic errors
- Missing tests (TDD requirement)

### Don't Nitpick
- Variable naming (unless truly confusing)
- Minor style inconsistencies
- Lack of comments (unless logic is complex)
- "Better" ways that add unjustified complexity

## After Review

1. Discuss findings with user
2. Prioritize fixes (production requirements > security > unjustified patterns > style)
3. Make changes or document accepted technical debt
4. Re-review critical changes

Remember: The goal is simple, reliable code that works at your current scale, not perfect code.
