---
description: Perform architecture review focused on production principles and best practices
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
- [ ] Building for 100 MSPs (not 1, not 10,000)
- [ ] Abstraction only after 3rd duplicate (Rule of Three)
- [ ] Functions under 200 lines (extract at 200, not 50)

#### 2. Production Quality (Required)
- [ ] Error handling on ALL external calls (API, database, file system)
- [ ] Retry logic for transient failures (3 attempts, exponential backoff)
- [ ] Logging with context (MSP, user, operation, timestamp)
- [ ] Input validation before database writes
- [ ] Database transactions for multi-step operations
- [ ] User-friendly error messages (not raw stack traces)

#### 3. Code Quality
- [ ] Functions are focused and single-purpose
- [ ] Minimal nesting (prefer early returns)
- [ ] No complex type gymnastics
- [ ] Comments for complex logic
- [ ] No dead/commented code

#### 4. Architecture
- [ ] Direct database queries (no ORM)
- [ ] Minimal abstraction (wait for 3rd duplicate)
- [ ] Inline logic or extracted functions (not over-modularized)
- [ ] Config for secrets/URLs, constants for other values
- [ ] Transactions for multi-step database operations
- [ ] Reasonable file count (5-10 files for complex features is ok)

#### 5. Security (Production)
- [ ] No hardcoded secrets in code (use env vars)
- [ ] Input validation and sanitization
- [ ] SQL injection protected (parameterized queries)
- [ ] Authentication enforced on protected routes
- [ ] Rate limiting on public endpoints
- [ ] Multi-tenant filter (WHERE msp_id = $1)

#### 6. Performance (Measured)
- [ ] No obvious O(n²) loops on user data
- [ ] Database queries aren't N+1 problems
- [ ] No unnecessary API calls in loops
- [ ] Database indexes for frequent queries
- [ ] Caching for expensive operations (>500ms)
- [ ] Remember: optimize for 100 MSPs, not millions

#### 6. Testing (TDD Requirement)
- [ ] Tests written BEFORE implementation
- [ ] Core functionality is tested
- [ ] Edge cases covered
- [ ] Tests are simple and focused
- [ ] No complex test frameworks or mocking

#### 7. UI/UX Design System Compliance (Frontend Only)
**If reviewing frontend code, check:**
- [ ] Using design tokens (NOT hardcoded colors: `#FF6B4A`, `bg-blue-600`)
- [ ] Using semantic tokens (`bg-primary`, `text-foreground`, `border-border`)
- [ ] Using 8px spacing scale (`gap-2`, `p-4`, NOT `p-[15px]`)
- [ ] UIC compliance - all UI elements have unique `data-uic` attributes
- [ ] Using canonical components (StandardTabs, StandardTable) where applicable
- [ ] Updated UIC Master List with new elements
- [ ] WCAG AA accessibility (contrast ≥4.5:1, ARIA labels, keyboard nav)
- [ ] Theme support (works in light/dark/high-contrast)
- [ ] Responsive design (mobile/tablet/desktop)
- [ ] Component patterns consistent with design system

**Documentation**:
- UIC Guidelines: [`/.claude/skills/UIC_Guidelines.md`](../skills/UIC_Guidelines.md)
- UI Conventions: [`/docs/UI_CONVENTIONS.md`](../../docs/UI_CONVENTIONS.md)
- Quick Reference: [`/docs/DESIGN_SYSTEM_CHEATSHEET.md`](../../docs/DESIGN_SYSTEM_CHEATSHEET.md)
- Migration Guide: [`/docs/DESIGN_SYSTEM_MIGRATION.md`](../../docs/DESIGN_SYSTEM_MIGRATION.md)
- Use `design-ui-ux-supervisor` agent for detailed UI review
- Run `npm run ui:enforce` to validate UIC compliance

## Review Output

Provide feedback in this format:

### ✅ Good Practices Found
- [Specific example of production-aligned code: simple + reliable]
- [Another example]

### ⚠️ Concerns
1. **[Issue Type]**: [Specific concern]
   - **Location**: [file:line]
   - **Current**: [What it does now]
   - **Suggestion**: [Fix aligned with production principles]
   - **Priority**: [High/Medium/Low]

### 🚨 Production Principles Violations
1. **[Violation]**: [Unjustified pattern or missing production requirement]
   - **Location**: [file:line]
   - **Why it's a problem**: [Over-engineering OR missing error handling/logging/validation]
   - **Fix**: [Simpler approach OR add required production quality]

### 🎯 Quick Wins
- [Easy improvements that add value]
- [Production quality additions (error handling, logging, validation)]

### 📝 Technical Debt (Document but Accept)
- [Reasonable shortcuts that work for 100 MSPs]
- [Things to revisit when scaling to 500+ MSPs]
- [Constants to extract when used 3+ times]

## Review Guidelines

### Be Pragmatic
- We're in production beta with paying customers
- Simple + Reliable > Complex + Perfect
- Works for 100 MSPs > Works for millions
- Abstract after 3rd duplicate > Abstract speculatively

### Focus On (High Priority)
- Missing production requirements (error handling, logging, validation)
- Unjustified enterprise patterns (check criteria)
- Security issues
- Obvious bugs or logic errors
- Missing tests (TDD requirement)

### Secondary Focus (Medium Priority)
- Abstraction before 3rd duplicate
- Functions >200 lines (should extract)
- Building for hypothetical 10,000 MSPs
- Missing multi-tenant filters

### Don't Nitpick
- Variable naming (unless truly confusing)
- Minor style inconsistencies
- Lack of comments (unless logic is complex)
- "Better" ways that add unjustified complexity

### Ask Questions
- "Does this meet production quality requirements?"
- "Is abstraction justified?" (3+ duplicates OR pattern criteria met?)
- "Are we building for 100 MSPs or hypothetical 10,000?"
- "Is this the simplest RELIABLE approach?"

## Example Feedback

```markdown
### ⚠️ Concerns

1. **Missing Error Handling**: External API call not wrapped
   - **Location**: src/routes/tickets.ts:67-82
   - **Current**: Direct fetch() call with no try/catch
   - **Suggestion**: Add try/catch with retry logic (3 attempts, exponential backoff)
   - **Priority**: High
   - **Reason**: Production requirement - we have paying customers

2. **Unjustified Abstraction**: Repository pattern with 1 implementation
   - **Location**: src/repositories/ticketRepository.ts:1-150
   - **Current**: Abstract repository with only PostgreSQL implementation
   - **Suggestion**: Direct queries in route handler (extract when we add 2nd database)
   - **Priority**: Medium
   - **Reason**: Pattern requires 5+ data sources, we have 1

3. **Missing Tests**: New endpoint not tested
   - **Location**: src/routes/agents.ts:45-67
   - **Current**: No tests for new POST /agents/register
   - **Suggestion**: Add basic integration test
   - **Priority**: High
   - **Reason**: TDD is a requirement
```

## After Review

1. Discuss findings with user
2. Prioritize fixes (production requirements > security > unjustified patterns > style)
3. Make changes or document accepted technical debt
4. Re-review critical changes

Remember: The goal is simple, reliable code that works for 100 MSPs, not perfect code.
