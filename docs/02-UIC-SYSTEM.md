# Universal ID Convention (UIC) System

> **Optional**: This system is most useful for projects with web UI components. If your project is a CLI tool, library, or backend-only service, you can skip this.

A systematic approach to naming every component in your application for instant debugging and clarity.

## The Problem

Without a naming convention:
- "The submit button is broken" - which one?
- "Error in the user table" - which table?
- "This API endpoint fails" - which endpoint?
- Support tickets are vague
- Debugging takes forever
- Code search is ambiguous

## The Solution

Give EVERY component a unique, searchable, typeable ID.

## Core Concept

```
Format: [PREFIX][NUMBER]

Examples:
- LOGBUT0001 - Login page, button, first one
- DASTXT0042 - Dashboard page, text element, 42nd one
- API0123 - API endpoint number 123
- TBL0005 - Database table number 5
```

## Benefits

1. **Fast Debugging**: Search codebase for exact ID
2. **Clear Communication**: "Fix LOGBUT0001" is unambiguous
3. **Easy Testing**: Target specific elements
4. **Instant Context**: ID tells you page, type, location
5. **Simple References**: Support tickets can cite IDs
6. **Searchable Logs**: Filter by component ID

## Naming Schemes

### Frontend/UI Elements (Page-Specific)

Format: `[3-letter page][3-letter element][4 digits]`

#### Page Codes

| Code | Page/Section |
|------|--------------|
| LOG | /login |
| DAS | /dashboard |
| TIC | /tickets |
| USR | /user-profiles |
| REP | /reports |
| MON | /monitoring |
| SET | /settings |
| MAG | /magic-link |
| ONB | /onboarding |
| HOM | /home or homepage |
| PRO | /profile |
| ADM | /admin |
| NAV | Global navigation |
| MOD | Global modals |

#### Element Codes

| Code | Element Type |
|------|--------------|
| BUT | button |
| TXT | text/span |
| INP | input field |
| DIV | div container |
| FRM | form |
| TBL | table |
| MOD | modal |
| ICO | icon |
| LNK | link |
| IMG | image |
| HDR | header |
| NAV | navigation |
| CRD | card |
| LST | list |
| ITM | list item |
| CHK | checkbox |
| RAD | radio button |
| SEL | select/dropdown |
| TAB | tab |
| PNL | panel |
| WDG | widget |
| GRD | grid |
| ROW | table row |
| COL | column |
| LBL | label |
| TTL | title |
| MSG | message |
| ERR | error display |
| SVG | svg element |

#### Examples

```jsx
// Login page
<button data-uic="LOGBUT0001">Login</button>
<input data-uic="LOGINP0001" type="email" />
<input data-uic="LOGINP0002" type="password" />
<span data-uic="LOGERR0001" className="error">Error message</span>

// Dashboard page
<div data-uic="DASDIV0001" className="stats-container">
  <h1 data-uic="DASTTL0001">Dashboard</h1>
  <table data-uic="DASTBL0001">
    <thead>
      <tr data-uic="DASROW0001">
        <th data-uic="DASHDR0001">Name</th>
        <th data-uic="DASHDR0002">Status</th>
      </tr>
    </thead>
  </table>
</div>
```

### Backend/Infrastructure Elements (System-Wide)

Format: `[3-letter prefix][4 digits]`

#### Prefix Codes

| Prefix | Component Type |
|--------|----------------|
| API | API endpoints |
| TBL | Database tables |
| COL | Database columns |
| IDX | Database indexes |
| TRG | Database triggers |
| VIW | Database views |
| ERR | Error codes |
| JOB | Background jobs |
| QUE | Message queues |
| EVT | Events |
| LOG | Log entries |

#### Examples

```typescript
// API endpoints
app.post('/api/tickets', /* API0001 */ (req, res) => {});
app.get('/api/users/:id', /* API0002 */ (req, res) => {});
app.put('/api/tickets/:id', /* API0003 */ (req, res) => {});

// Database tables
CREATE TABLE clients ( -- TBL0001
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) -- COL0001
);

CREATE TABLE tickets ( -- TBL0002
  id SERIAL PRIMARY KEY,
  subject VARCHAR(500), -- COL0002
  description TEXT -- COL0003
);

// Error codes
const ERRORS = {
  INVALID_AUTH: 'ERR0001',
  MISSING_PARAM: 'ERR0002',
  DB_CONNECTION: 'ERR0003',
};
```

## Implementation

### Step 1: Create UIC Master List

File: `docs/UIC_MASTER_LIST.md`

```markdown
# UIC Master List

## Frontend UICs

### Login Page (LOG)
- LOGBUT0001: Submit button
- LOGINP0001: Email input
- LOGINP0002: Password input
- LOGERR0001: Error message display

### Dashboard Page (DAS)
- DASDIV0001: Main container
- DASTTL0001: Page title
- DASTBL0001: Tickets table

## Backend UICs

### API Endpoints
- API0001: POST /api/tickets - Create ticket
- API0002: GET /api/users/:id - Get user
- API0003: PUT /api/tickets/:id - Update ticket

### Database Tables
- TBL0001: clients
- TBL0002: tickets
- TBL0003: users

### Error Codes
- ERR0001: Invalid authentication
- ERR0002: Missing required parameter
- ERR0003: Database connection failed
```

### Step 2: Add to Existing Components

**React Example:**

```tsx
// Before
<button onClick={handleLogin}>Login</button>

// After
<button
  data-uic="LOGBUT0001"
  onClick={handleLogin}
>
  Login
</button>
```

**API Example:**

```typescript
// Before
app.post('/api/tickets', async (req, res) => {
  // handler
});

// After
app.post('/api/tickets', async (req, res) => { // API0001
  try {
    // handler
  } catch (error) {
    logger.error('API0001 failed', { error });
    res.status(500).json({
      error: 'ERR0001',
      message: 'Failed to create ticket'
    });
  }
});
```

**SQL Example:**

```sql
-- Before
CREATE TABLE tickets (
  id SERIAL PRIMARY KEY,
  subject VARCHAR(500)
);

-- After
CREATE TABLE tickets ( -- TBL0002
  id SERIAL PRIMARY KEY,
  subject VARCHAR(500), -- COL0002
  description TEXT -- COL0003
);
```

### Step 3: Use in Logging

```typescript
// Application logging
logger.info('LOGBUT0001 clicked', { userId: user.id });
logger.error('API0001 failed', { error, requestId });
logger.warn('TBL0002 query slow', { duration: 5000 });

// Error responses
res.status(400).json({
  error: 'ERR0002',
  message: 'Missing required field: email',
  uic: 'LOGINP0001'
});
```

### Step 4: Use in Testing

```typescript
// E2E tests
test('login flow', async () => {
  await page.click('[data-uic="LOGBUT0001"]');
  await page.fill('[data-uic="LOGINP0001"]', 'user@example.com');
  await page.fill('[data-uic="LOGINP0002"]', 'password123');
  await page.click('[data-uic="LOGBUT0001"]');
});

// API tests
test('create ticket', async () => {
  const response = await fetch('/api/tickets'); // API0001
  expect(response.status).toBe(201);
});
```

### Step 5: Use in Support

```
Support Ticket:
"User reports LOGBUT0001 is not responding on mobile devices."

Developer:
- Searches codebase for "LOGBUT0001"
- Finds exact component in 2 seconds
- Sees it's the login submit button
- Checks mobile styles
- Fixes issue
```

## Progressive Rollout

You don't need to add UICs everywhere at once:

### Phase 1: New Code Only
- Add UICs to all new components
- Build the habit

### Phase 2: High-Traffic Areas
- Add UICs to critical user paths
- Login, checkout, main flows

### Phase 3: Error-Prone Areas
- Add UICs to frequently buggy components
- Complex forms, API endpoints with errors

### Phase 4: Comprehensive
- Systematically add to all components
- Use script to find missing UICs

## Automation

### Auto-Generate Next ID

```typescript
// scripts/next-uic.ts
import fs from 'fs';

function getNextUIC(prefix: string): string {
  const masterList = fs.readFileSync('docs/UIC_MASTER_LIST.md', 'utf-8');

  // Find all UICs with this prefix
  const regex = new RegExp(`${prefix}(\\d{4})`, 'g');
  const matches = [...masterList.matchAll(regex)];

  if (matches.length === 0) {
    return `${prefix}0001`;
  }

  // Get highest number
  const numbers = matches.map(m => parseInt(m[1]));
  const max = Math.max(...numbers);

  // Return next number, padded to 4 digits
  return `${prefix}${String(max + 1).padStart(4, '0')}`;
}

// Usage
console.log(getNextUIC('LOGBUT')); // LOGBUT0002
console.log(getNextUIC('API')); // API0124
```

### Validate UICs

```typescript
// scripts/validate-uics.ts
import { glob } from 'glob';
import fs from 'fs';

function validateUICs() {
  const files = glob.sync('src/**/*.{ts,tsx}');
  const duplicates = new Map();

  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    const uics = [...content.matchAll(/data-uic="([^"]+)"/g)];

    uics.forEach(([, uic]) => {
      if (duplicates.has(uic)) {
        duplicates.get(uic).push(file);
      } else {
        duplicates.set(uic, [file]);
      }
    });
  });

  // Report duplicates
  duplicates.forEach((files, uic) => {
    if (files.length > 1) {
      console.error(`Duplicate UIC ${uic} in:`, files);
    }
  });
}
```

### Update Master List

```typescript
// .claude/hooks/utils/uic-tracker.ts
import fs from 'fs';

export function trackNewUIC(uic: string, description: string, file: string) {
  const masterList = 'docs/UIC_MASTER_LIST.md';
  const entry = `- ${uic}: ${description} (${file})\n`;

  // Append to master list
  fs.appendFileSync(masterList, entry);

  console.log(`Added ${uic} to master list`);
}

// Usage in hooks
if (codeContainsNewUIC) {
  trackNewUIC('LOGBUT0003', 'Forgot password button', 'src/pages/login.tsx');
}
```

## Integration with Claude Code

Add to `.claude/CLAUDE.md`:

```markdown
## Universal ID Convention (UIC)

All components MUST have unique IDs:

**Frontend**: [3-letter page][3-letter element][4 digits]
- Example: LOGBUT0001, DASTXT0042

**Backend**: [3-letter prefix][4 digits]
- Example: API0001, TBL0003

**When creating new components**:
1. Check `docs/UIC_MASTER_LIST.md` for next ID
2. Add UIC to component: `data-uic="LOGBUT0001"`
3. Update master list with new UIC
4. Add UIC to logs/errors

**Benefits**: Fast debugging, clear communication, easy testing
```

## Claude Code Skill

Create `.claude/skills/uic-naming.md`:

```markdown
# UIC Naming Skill

When creating ANY new component, API, database table, or identifiable element:

## Always Do

1. Assign a unique UIC following the convention
2. Add it to docs/UIC_MASTER_LIST.md
3. Use it in data-uic attributes, comments, or logs
4. Use it in error messages and logging

## UIC Format

Frontend: [PAGE][ELEMENT][NUMBER]
Backend: [PREFIX][NUMBER]

## Examples

Frontend:
- data-uic="LOGBUT0001" (Login button)
- data-uic="DASHDR0001" (Dashboard header)

Backend:
- // API0001 - POST /api/tickets
- CREATE TABLE clients ( -- TBL0001

## Quick Reference

Common prefixes:
- LOG = /login
- DAS = /dashboard
- BUT = button
- INP = input
- API = API endpoint
- TBL = database table
```

## Real-World Example

### Before UIC

```typescript
// Button somewhere in the app
<button onClick={submit}>Save</button>

// Support ticket
"The save button doesn't work"

// Developer
// Where? Which save button? There are 20 save buttons!
// Searches codebase, takes 30 minutes to find it
```

### After UIC

```typescript
// Button with UIC
<button data-uic="TICBUT0002" onClick={submit}>Save</button>

// Support ticket
"TICBUT0002 doesn't work"

// Developer
// Searches "TICBUT0002"
// Finds it in 5 seconds
// It's the ticket save button
// Fixes immediately
```

## Best Practices

### Do

- Use UICs consistently everywhere
- Update master list immediately
- Use UICs in logs and errors
- Include UICs in support workflows
- Validate UICs in CI

### Don't

- Reuse UICs (they're unique!)
- Skip updating master list
- Use UICs as CSS selectors (use classes)
- Change UICs after deployment (they're in logs!)
- Create UICs manually (use script)

## FAQ

**Q: Do I need UICs for every element?**
A: No, focus on interactive elements, containers, and backend components.

**Q: What if I run out of numbers?**
A: Use 4 digits = 10,000 per prefix. If needed, add prefix variants.

**Q: Should UICs be in production?**
A: Yes! They're tiny (12 bytes) and invaluable for debugging.

**Q: How do I search for a UIC?**
A: `grep -r "LOGBUT0001" .` or use IDE search.

**Q: Can I change a UIC?**
A: Only if it's not deployed. Once in production, it's in logs forever.

## Tools

### VS Code Snippet

```json
{
  "UIC Data Attribute": {
    "prefix": "uic",
    "body": [
      "data-uic=\"${1:PREFIX}${2:0001}\""
    ],
    "description": "Add UIC data attribute"
  }
}
```

### Shell Alias

```bash
# Get next UIC
alias next-uic="node scripts/next-uic.ts"

# Usage
$ next-uic LOGBUT
LOGBUT0002
```

## Migration Path

For existing projects:

1. **Week 1**: Add UICs to new code only
2. **Week 2**: Add UICs to critical paths
3. **Week 3**: Add UICs to common bugs
4. **Month 2**: Systematic coverage
5. **Month 3**: 100% coverage

## Success Metrics

You'll know UICs are working when:
- Support tickets reference UICs
- Developers find bugs in seconds
- Logs are instantly searchable
- Tests are easier to write
- Team says "Just search for XYZ0001"

---

**Investment**: 5 minutes per component
**Payoff**: Hours saved in debugging
**ROI**: 10x within first month

Start with your most critical components today.
