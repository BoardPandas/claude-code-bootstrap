# Production Development Principles

**CRITICAL**: This project is in PRODUCTION BETA serving multiple MSPs.

> **Philosophy**: Simple, scalable, maintainable. Not MVP shortcuts, not enterprise bloat.

See `/docs/DEVELOPMENT_PRINCIPLES.md` for full reference. This skill provides quick reminders.

## Golden Rules (ALWAYS Follow)

1. **If it works reliably, ship it** - Perfect is still the enemy of done
2. **YAGNI until you need it** - Don't build for hypothetical futures
3. **Simple files > Complex architecture** - Start simple, extract when needed
4. **Direct > Abstract** - Prefer direct solutions, abstract when patterns emerge
5. **Start hardcoded, extract when needed** - Make it configurable after the 3rd use
6. **Quality matters now** - We have paying customers, but over-engineering still hurts
7. **200 lines before extracting** - Functions/features can be larger now, but extract at 200 lines

## Reality Check (Where We Are)

- **10-100 MSPs**: Optimize for this scale, not millions
- **Production beta**: Real customers, but still learning
- **Multi-tenant**: Each MSP has unique needs
- **Speed + Reliability**: Ship fast, but don't break things
- **Technical debt payback**: Fix issues that impact customers NOW

## Patterns to Avoid (Nuanced for Our Scale)

### ❌ Avoid Unless Justified

These patterns add complexity. Only use if you meet the criteria:

- **Factory patterns**: Avoid unless you have 5+ different implementations
- **Dependency injection frameworks**: Avoid unless team size >5 developers (Go interfaces are fine)
- **Abstract base classes**: Avoid unless you have 3+ concrete implementations
- **Event sourcing / CQRS**: Avoid unless you have audit requirements or >10,000 events/day
- **Microservices**: Avoid unless monolith is >100k LOC or team >10 developers
- **Complex repository patterns**: Avoid unless you have 5+ data sources (direct queries + transactions are fine)
- **Service meshes**: Avoid unless you have >20 services
- **API gateways**: Avoid unless you have >10 backend services (nginx is enough)
- **Custom frameworks**: Avoid unless you're doing the same thing 10+ times

### 🚫 Still Completely Banned

- **Premature optimization**: Never optimize before measuring
- **Speculative generality**: Never build for "what if" scenarios
- **Gold plating**: Never add features "because it's cool"
- **Resume-driven development**: Never use tech "to learn it"

## Patterns to Use (Production-Ready)

✅ **Strongly Encouraged**:
- Simple functions with clear names
- Direct database queries with transactions for multi-step operations
- Configuration files/env vars (not hardcoded secrets)
- Defensive coding (validation, error handling, retries)
- Logging and monitoring (errors, performance, business metrics)
- Inline code when <3 uses, extract when 3+ uses (Rule of Three)
- Database migrations (not raw SQL changes)
- Basic caching (Redis) when queries are measured as slow (>500ms)
- Polling with smart intervals (not webhooks unless push is required)
- Functions up to 200 lines (extract at 200, not 50)

## Production Concerns (NEW)

### 🚨 Must Haves for Production

1. **Error Handling**
   - All external calls wrapped in try/catch
   - Errors logged with context (user, MSP, operation)
   - User-friendly error messages
   - Retry logic for transient failures (network, rate limits)

2. **Data Integrity**
   - Use database transactions for multi-step operations
   - Validate inputs before writing to database
   - Backups run daily (already set up)
   - Soft deletes for critical data (tickets, users)

3. **Observability**
   - Log all errors with stack traces
   - Log slow operations (>2s)
   - Monitor API response times
   - Track business metrics (tickets created, AI usage)

4. **Security**
   - Never log secrets/API keys (use last 4 chars only)
   - Validate + sanitize user inputs
   - Rate limiting on public endpoints
   - Keep dependencies updated (monthly review)

5. **Multi-tenancy**
   - Every query includes ClientID filter
   - Test with multiple MSPs
   - No cross-tenant data leaks

### ⚖️ Production vs Speed Balance

#### Ship Fast (do these)
- Inline validation (no validation framework)
- Direct SQL queries (no ORM)
- Environment variables for config
- Simple retry logic (3 attempts, exponential backoff)
- File-based logs (rotate daily)

#### Take Time (do these right)
- Database migrations (use migrate tool)
- Authentication/authorization (test thoroughly)
- Data export/import (customers depend on this)
- Email delivery (use queue + retries)
- Payment processing (never cut corners)

## Decision Framework (Updated for Production)

Before ANY architectural decision, ask:

### Question 1: Is this reliable for production?
- **If yes**: Proceed
- **If no**: What's missing? (error handling, validation, logging)

### Question 2: Will 100 MSPs break this?
- **If no**: Ship it
- **If yes**: What's the bottleneck? Add specific fix (caching, indexing, pagination)

### Question 3: Can another dev maintain this in 6 months?
- **If yes**: Good complexity level
- **If no**: Add comments, extract functions, simplify

### Question 4: What's the blast radius if this fails?
- **One user**: Ship it, fix if it breaks
- **One MSP**: Add error handling + logging
- **All MSPs**: Add retry logic, monitoring, fallbacks

## When to Add Abstraction (NEW)

### Triggers for Abstraction

Extract to function/class when:
- **Rule of Three**: Same logic used 3+ times
- **Domain complexity**: Business logic gets complicated (AI logic, ticket routing)
- **Testing**: Hard to test without extraction
- **Multiple implementations**: 3+ ways to do something (Zendesk, Jira, email)
- **File size**: Function/feature exceeds 200 lines

### Extraction Examples

#### ✅ Good Abstractions (Justified)
```typescript
// Extract after 3rd duplicate
function validateMSPUser(email: string, mspId: string) {
  if (!email?.includes('@')) throw new Error('Invalid email');
  if (!mspId) throw new Error('MSP ID required');
  // More validation...
}

// Extract complex business logic (>200 lines)
class TicketRouter {
  route(ticket: Ticket): string {
    // 200+ lines of conditional logic
    // Multiple MSPs have custom routing rules
  }
}

// Extract when 3+ implementations exist
interface NotificationProvider {
  send(message: string): Promise<void>;
}
// EmailProvider, SlackProvider, TeamsProvider (3 implementations = justified)
```

#### ❌ Still Over-Engineering
```typescript
// Don't do this (we have <100 MSPs, only 1 implementation):
class AbstractTicketFactory {
  abstract create(): ITicket;
}

// Don't do this (direct queries work fine, only 1 database):
class GenericRepository<T> {
  async findByQuery(query: QueryBuilder): Promise<T[]>
}

// Don't do this (env vars are enough):
class ConfigurationManager {
  loadFromMultipleSources(): Configuration
}
```

## Simplicity Checkpoints (Updated)

### Before Starting
- [ ] Is this the simplest RELIABLE approach?
- [ ] Do we need this for 10-100 MSPs (not 10,000)?
- [ ] Can this be 1-5 files?
- [ ] Is error handling included?
- [ ] Is this easily testable?

### During Implementation
- [ ] Am I adding abstraction before 3rd use?
- [ ] Am I creating >10 files? (Consolidate related logic)
- [ ] Did I add error handling + logging?
- [ ] Would another dev understand this in 6 months?
- [ ] Is this function >200 lines? (Extract if yes)

### Before Committing
- [ ] Does this handle failures gracefully?
- [ ] Are errors logged with context?
- [ ] Is complex logic tested (unit tests)?
- [ ] Can I deploy this without breaking existing MSPs?

## Scaling Triggers (When to Refactor)

### Refactor When You Hit These Limits

1. **Performance** (actual, not hypothetical)
   - API responses >2s consistently
   - Database queries >500ms
   - Memory usage growing unbounded
   - CPU consistently >70%

2. **Maintainability** (team pain)
   - Same bug appears 3+ times (extract + fix once)
   - Code duplicated 5+ times (extract + reuse)
   - New feature takes 2x longer than expected
   - Onboarding new dev takes >1 week

3. **Scale** (customer impact)
   - Supporting 100+ MSPs (current: 10-100)
   - >10,000 tickets/day (current: <1,000)
   - >100 simultaneous desktop agents (current: <50)
   - Database >100GB (current: <10GB)

4. **Customer complaints** (real problems)
   - Specific feature requested by 5+ MSPs
   - Same issue reported 3+ times
   - Security concern raised by customer
   - Competitor has feature we don't

### Don't Refactor For

- "Clean code" principles (if it works reliably)
- Hypothetical scale (until you're at 80% of limit)
- Latest framework/library (unless security fix)
- Personal preferences (consistency > perfection)

## Mantras (Updated for Production)

- "Simple + Reliable beats complex + perfect"
- "Scale when you hit limits, not before"
- "Make it work, make it right, make it fast - IN THAT ORDER"
- "Abstract after 3rd duplicate, not before"
- "Add what you need, remove what you don't"
- "Customers don't care about architecture"
- "200 lines before extracting, not 50"

## When to Add "Enterprise" Patterns

Use enterprise patterns **ONLY when you meet ALL criteria**:

| Pattern | Minimum Requirements |
|---------|---------------------|
| Factory Pattern | 5+ different implementations |
| DI Framework | Team of 5+ developers |
| Microservices | Monolith >100k LOC OR team >10 developers |
| Event Sourcing | Audit requirement OR >10k events/day |
| CQRS | Read/write performance measured as bottleneck |
| Service Mesh | 20+ microservices |
| API Gateway | 10+ backend services |
| Repository Pattern | 5+ different data sources |

**Until you hit these thresholds**: Keep it simple

## The Prime Directive (Updated)

> **Build the simplest reliable thing that works for 10-100 MSPs. Then ship it.**

If you find yourself:
- Creating >10 files for a feature
- Writing >200 lines without extracting
- Thinking about "1000+ MSP scalability"
- Adding abstraction before 3rd use
- Building generic frameworks

**STOP and ask**:

> **"What's the simplest RELIABLE way to make this work for 100 MSPs?"**

## Remember

You're not building for:
- ❌ 1 million users (you have <1,000)
- ❌ 1000 MSPs (you have 10-100)
- ❌ Fortune 500 enterprise (you're a startup)
- ❌ Infinite scale (you need finite scale)

You're building for:
- ✅ 10-100 MSPs (current reality)
- ✅ 10-50 concurrent users per MSP
- ✅ Fast iteration based on feedback
- ✅ Reliable service (you have paying customers)
- ✅ Maintainable codebase (you might hire soon)

**Ship working, reliable code. Ship it fast. Iterate based on customer feedback.**
