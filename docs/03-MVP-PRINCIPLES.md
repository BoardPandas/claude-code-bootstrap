# MVP/Prototype Development Principles

The philosophy that makes fast shipping possible without creating unmaintainable garbage.

## Core Philosophy

**You are building a prototype to validate a business idea, not enterprise software.**

Until you have:
- 1000+ paying users
- $100k+ MRR
- Actual performance problems
- Real security incidents

You should optimize for:
- **Speed of iteration**
- **Learning from users**
- **Validating assumptions**
- **Preserving cash runway**

NOT for:
- Scalability
- Flexibility
- Extensibility
- "Best practices"

## The Golden Rules

### 1. If It Works, Ship It

Perfect is the enemy of done.

**Good:**
```typescript
// Simple, works, ships today
function createTicket(data) {
  return pool.query(
    'INSERT INTO tickets (subject, description) VALUES ($1, $2)',
    [data.subject, data.description]
  );
}
```

**Over-engineered:**
```typescript
// Enterprise, flexible, ships never
interface ITicketRepository {
  create(data: CreateTicketDTO): Promise<Ticket>;
}

class TicketRepositoryPostgres implements ITicketRepository {
  constructor(private db: IDatabaseConnection) {}

  async create(data: CreateTicketDTO): Promise<Ticket> {
    // 50 more lines...
  }
}

class TicketService {
  constructor(private repo: ITicketRepository) {}
  // ...
}
```

**Why**: The first version works TODAY. The second might be "better architecture" but took 10x longer and provides ZERO additional value with 0 users.

### 2. YAGNI - You Aren't Gonna Need It

Don't build for hypothetical futures.

**Good:**
```typescript
// Hardcoded config
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png'];
```

**Over-engineered:**
```typescript
// "Flexible" config system you'll never use
class ConfigManager {
  private config: Map<string, any>;

  get(key: string, defaultValue?: any) { /* ... */ }
  set(key: string, value: any) { /* ... */ }
  load(source: ConfigSource) { /* ... */ }
}
```

**Why**: You have 0 users. You don't know if file uploads will even be a feature that matters. Hardcode it, ship it, change it IF needed.

### 3. One File is Better Than Ten

Monolithic > Microservices at this stage.

**Good:**
```
src/
  routes-simple.ts  (500 lines, all API routes)
  server-simple.ts  (50 lines, starts server)
```

**Over-engineered:**
```
src/
  routes/
    tickets/
      create.ts
      read.ts
      update.ts
      delete.ts
      validate.ts
      transform.ts
      repository.ts
    users/
      [same structure]
  services/
  repositories/
  dtos/
  interfaces/
```

**Why**: With 0 users, you're constantly changing everything. One file = one place to change. Splitting across 20 files means 20 files to update for one feature change.

### 4. Inline Everything

Functions over classes. Scripts over frameworks.

**Good:**
```typescript
app.post('/api/tickets', async (req, res) => {
  // Validation inline
  if (!req.body.subject) {
    return res.status(400).json({ error: 'Subject required' });
  }

  // Business logic inline
  const ticket = await pool.query(
    'INSERT INTO tickets (subject, description) VALUES ($1, $2) RETURNING *',
    [req.body.subject, req.body.description]
  );

  // Response inline
  res.json(ticket.rows[0]);
});
```

**Over-engineered:**
```typescript
app.post('/api/tickets',
  validateTicket,
  authenticateUser,
  checkPermissions,
  TicketController.create
);
```

**Why**: The second version spreads one operation across 5+ files. Harder to understand, harder to debug, harder to change. The first version is 15 lines and does everything.

### 5. Hard-code First, Configure Later

Constants are your friend.

**Good:**
```typescript
const OPENAI_MODEL = 'gpt-4o-mini';
const MAX_RETRIES = 3;
const TIMEOUT_MS = 30000;
```

**Over-engineered:**
```typescript
interface AIConfig {
  provider: 'openai' | 'anthropic';
  model: string;
  retries: number;
  timeout: number;
  fallback?: AIConfig;
}

const config = loadConfig<AIConfig>('ai.yml');
```

**Why**: You're not switching AI providers. You have one use case. Hardcode it and move on.

### 6. If You're Typing More Than 50 Lines, You're Over-engineering

Seriously. Stop and ask "what's the hackiest way to make this work?"

## Banned Patterns

DO NOT USE these until you have 1000+ paying users:

### Absolutely Forbidden
- Factory patterns
- Dependency injection containers
- Abstract base classes
- Multiple inheritance
- Complex type systems
- Event sourcing
- CQRS
- Microservices
- Service mesh
- Repository patterns
- Unit of work patterns
- Domain-driven design
- Hexagonal architecture
- Any pattern with "Strategy" or "Factory" in the name

### Why These Are Banned

They're designed for problems you DON'T have:
- **Factory patterns**: You're not swapping implementations
- **DI containers**: You're not testing 50 services
- **Event sourcing**: You're not rebuilding state
- **Microservices**: You're not scaling to millions

You have different problems:
- Getting users
- Validating features
- Shipping fast
- Preserving runway

## Preferred Patterns

### Use These

1. **Simple Functions**
   ```typescript
   function createUser(email, password) {
     // Do the thing
   }
   ```

2. **Direct Database Queries**
   ```typescript
   const users = await pool.query('SELECT * FROM users WHERE active = true');
   ```

3. **Global Variables for Config**
   ```typescript
   const config = {
     apiKey: process.env.API_KEY,
     maxUsers: 100
   };
   ```

4. **Copy-Paste Over Abstraction**
   ```typescript
   // Copy this function 3 times instead of abstracting
   function sendEmail() { /* ... */ }
   function sendSMS() { /* copy of sendEmail adapted */ }
   ```

5. **Hardcoded Values**
   ```typescript
   const ADMIN_EMAILS = [
     'brandon@example.com',
     'chaz@example.com'
   ];
   ```

6. **Synchronous Over Async** (when possible)
   ```typescript
   // Good: Simple and clear
   const data = fs.readFileSync('config.json', 'utf-8');

   // Overkill for a startup script
   const data = await fs.promises.readFile('config.json', 'utf-8');
   ```

7. **Polling Over Webhooks**
   ```typescript
   // Poll every 30 seconds - works, simple
   setInterval(checkForUpdates, 30000);

   // Webhooks require infrastructure, ngrok, etc.
   ```

## Decision Framework

Before making ANY architectural decision, ask these three questions:

### 1. Will This Work TODAY?

If yes, proceed. If no, find something simpler.

**Example:**
- ✅ "Store files on local disk" - works today
- ❌ "Setup S3, CloudFront, CDN, etc." - takes 2 days

### 2. Will 10 Users Break This?

If no, ship it. If yes, still consider shipping and fixing when you GET 10 users.

**Example:**
- ✅ "SQLite database" - handles 10 users fine
- ❌ "Distributed database cluster" - overkill

### 3. Can I Explain This to a Junior Dev in 30 Seconds?

If no, it's too complex.

**Example:**
- ✅ "We put tickets in a database table"
- ❌ "We use CQRS with event sourcing where commands go through a message bus and..."

## Startup Reality Checks

### We Have 0 Users

Don't optimize for millions.

**Bad**: "Let's shard the database for horizontal scaling"
**Good**: "Let's use one PostgreSQL instance"

### We Might Pivot Tomorrow

Don't over-invest in current direction.

**Bad**: "Let's build a plugin system for extensibility"
**Good**: "Let's hardcode this feature and see if anyone uses it"

### Speed Beats Quality

Ship broken, fix in production.

**Bad**: "Let's spend 2 weeks on a perfect solution"
**Good**: "Let's ship the 80% solution today and iterate"

### Learning > Planning

We don't know what we don't know.

**Bad**: "Let's architect this to handle every possible case"
**Good**: "Let's build for the one case we know and adapt"

### Cash Is Burning

Every day of development costs money.

**Bad**: "Let's refactor everything to be cleaner"
**Good**: "Let's ship and make revenue first"

### Technical Debt Is Fine

We'll refactor IF we succeed.

**Reality**: 90% of startups fail. That perfect architecture? Wasted if you're in the 90%.

## Simplicity Examples

### Example 1: User Authentication

**Bad (Overengineered):**
```typescript
interface IAuthProvider {
  authenticate(credentials: Credentials): Promise<User>;
  authorize(user: User, resource: Resource): boolean;
}

class JWTAuthProvider implements IAuthProvider { /* ... */ }
class OAuth2Provider implements IAuthProvider { /* ... */ }
class MagicLinkProvider implements IAuthProvider { /* ... */ }

class AuthService {
  constructor(
    private providers: IAuthProvider[],
    private tokenService: ITokenService,
    private sessionService: ISessionService
  ) {}
}
```

**Good (MVP):**
```typescript
function sendMagicLink(email) {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = Date.now() + (30 * 60 * 1000); // 30 minutes

  await pool.query(
    'INSERT INTO magic_links (email, token, expires) VALUES ($1, $2, $3)',
    [email, token, expires]
  );

  await sendEmail(email, `https://app.com/verify?token=${token}`);
}

function verifyMagicLink(token) {
  const result = await pool.query(
    'SELECT email FROM magic_links WHERE token = $1 AND expires > $2',
    [token, Date.now()]
  );

  if (result.rows.length === 0) {
    throw new Error('Invalid or expired token');
  }

  return result.rows[0].email;
}
```

**Why Good**: 20 lines, works today, handles auth for 1000 users easily.

### Example 2: API Error Handling

**Bad (Overengineered):**
```typescript
abstract class BaseError extends Error {
  abstract statusCode: number;
  abstract code: string;
}

class ValidationError extends BaseError { /* ... */ }
class AuthError extends BaseError { /* ... */ }
class NotFoundError extends BaseError { /* ... */ }

class ErrorHandler {
  handle(error: BaseError): Response { /* ... */ }
}

app.use((err, req, res, next) => {
  const handler = new ErrorHandler();
  handler.handle(err);
});
```

**Good (MVP):**
```typescript
app.use((err, req, res, next) => {
  console.error('Error:', err);

  if (err.message.includes('not found')) {
    return res.status(404).json({ error: 'Not found' });
  }

  if (err.message.includes('unauthorized')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  res.status(500).json({ error: 'Internal server error' });
});
```

**Why Good**: 10 lines, handles 99% of errors, easy to extend.

### Example 3: Configuration

**Bad (Overengineered):**
```typescript
interface IConfigSource {
  load(): Promise<Config>;
}

class EnvConfigSource implements IConfigSource { /* ... */ }
class FileConfigSource implements IConfigSource { /* ... */ }
class RemoteConfigSource implements IConfigSource { /* ... */ }

class ConfigManager {
  constructor(private sources: IConfigSource[]) {}

  async load() {
    for (const source of this.sources) {
      try {
        return await source.load();
      } catch (e) {
        // Try next source
      }
    }
  }
}
```

**Good (MVP):**
```typescript
const config = {
  database: process.env.DATABASE_URL,
  apiKey: process.env.API_KEY,
  port: process.env.PORT || 3000,
};
```

**Why Good**: 5 lines, covers 100% of current needs.

## When To Break These Rules

Only when you have:

1. **1000+ paying users** - Now you have real usage patterns
2. **$100k+ MRR** - Now you have resources to invest in quality
3. **Actual performance problems** - Now you have data to optimize
4. **Real security incidents** - Now you have threats to defend against
5. **Specific customer complaints** - Now you have user-driven requirements

Until then: KEEP IT SIMPLE, STUPID (KISS)

## Common Objections Answered

### "But this won't scale!"

You don't need to scale to 0 users. You need to get TO users first.

### "But this is messy code!"

Messy code that ships beats clean code that doesn't.

### "But we'll have to rewrite it later!"

Maybe. But 90% of startups fail before that's a problem. And IF you succeed, you'll have money to hire people to rewrite it.

### "But what about maintainability?"

You can't maintain a dead startup. Ship first, maintain later.

### "But best practices say..."

Best practices are for established companies with established products and paying customers. You have none of those.

## Practical Application

### Before Starting Any Feature

Ask yourself:
1. What's the simplest thing that could work?
2. Can I hardcode anything?
3. Can I combine files instead of creating new ones?
4. Am I abstracting for hypothetical futures?
5. Would a junior dev understand this in 30 seconds?

### During Code Review

Red flags:
- More than 3 files for a feature
- Any file over 500 lines
- Interfaces with one implementation
- Abstract classes
- Words like "flexible", "extensible", "scalable"
- More than 100 lines for basic functionality

Green flags:
- One file, direct code
- Hardcoded constants
- Inline validation/logic
- Direct database queries
- Simple functions
- Copy-paste over abstraction

### After Shipping

Did it:
- Work for users?
- Get feedback?
- Generate revenue?

If yes: SUCCESS. You can clean it up later if needed.

If no: GOOD. You learned fast with minimal investment.

## Mantras

Repeat these daily:

- "Premature optimization is the root of all evil"
- "Worse is better"
- "Ship it and iterate"
- "Make it work, make it right, make it fast (but usually just make it work)"
- "Code is a liability, not an asset"
- "The best code is no code"
- "Perfect is the enemy of done"
- "You can't iterate if you don't ship"

## Real Example: Facebook

Facebook started as:
- One PHP file (index.php)
- MySQL database
- No frameworks
- Hardcoded Harvard.edu emails
- Running on Mark's laptop

Not as:
- Microservices architecture
- Event-driven system
- Multiple data centers
- CDN
- Sophisticated caching

The second version is what Facebook is NOW. The first version is what GOT them there.

**You're not building Facebook's current infrastructure. You're building their MVP.**

## Success Stories

Startups that shipped "bad" code fast and won:

- **Twitter**: Ruby on Rails monolith, "Fail Whale" constantly
- **Airbnb**: Founder photographed apartments himself, manual processes
- **Stripe**: Started with simple forms, grew into API empire
- **Instagram**: Burbn pivot, minimal features, shipped fast

They all refactored AFTER success, not before.

## Final Word

The goal is not to write perfect code. The goal is to build a successful business.

Perfect code in a failed startup = $0
Messy code in a successful startup = $$$

Choose wisely.

---

**Remember**: You can refactor later. You can't refactor if you're out of business.

Ship it today. Perfect it never (or when you have revenue).
