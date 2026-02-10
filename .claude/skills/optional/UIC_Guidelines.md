---
name: uic-guidelines
description: Universal ID Convention system for unique, trackable UI element identifiers (data-uic attributes)
---

# UIC (Universal ID Convention) Guidelines

**CRITICAL**: This project uses a Universal ID Convention (UIC) system for tracking all UI elements. Every interactive element must have a unique `data-uic` attribute for testability, debugging, and analytics.

> **Philosophy**: Traceable, testable, debuggable UI. Every element has a unique identifier following a consistent convention.

## 📚 Documentation Quick Links

- **UI Conventions**: [`/docs/UI_CONVENTIONS.md`](../../docs/UI_CONVENTIONS.md) - Canonical components and validation
- **UIC Master List**: [`/docs/UIC_MASTER_LIST.md`](../../docs/UIC_MASTER_LIST.md) - Complete registry of all UICs
- **Frontend Guidelines**: [`/docs/FRONTEND.md`](../../docs/FRONTEND.md) - Dashboard development guide

**This skill provides quick UIC reminders for active development. For the complete registry, use the links above.**

## Golden Rules (ALWAYS Follow)

1. **Every UI element needs a UIC** - Buttons, inputs, divs, cards, tables, tabs, etc.
2. **Use canonical components** - StandardTabs and StandardTable automatically include UICs
3. **Check the master list** - Always verify your UIC doesn't already exist
4. **Sequential numbering** - Use the next available number for your page/element type
5. **Update the master list** - Add your new UICs to `/docs/UIC_MASTER_LIST.md`
6. **Run validation** - Use `npm run ui:enforce` before committing
7. **Respect the allowlist** - Only duplicate UICs on the allowlist can be reused

## UIC Format Specification

### Frontend/UI Elements
Format: `[PAGE][ELEMENT][####]`

**Examples**:
- `LOGDIV0001` - Login page, div container, #0001
- `DASBUT0003` - Dashboard page, button, #0003
- `UMGINP0005` - User Management page, input field, #0005
- `TICTTL0001` - Tickets page, title, #0001

**Components**:
- **PAGE**: 3-letter page code (see Page Codes section)
- **ELEMENT**: 3-letter element type (see Element Codes section)
- **####**: 4-digit sequential number (0001, 0002, etc.)

### Shared Components
Format: `SHR[ELEMENT][####]`

**Examples**:
- `SHRTAB0001` - Shared tabs component
- `SHRTBL0001` - Shared table container
- `SHRBUT0001` - Shared button component

**Use shared UICs for**:
- Reusable components across multiple pages
- Design system components
- Common UI patterns

### Backend/Infrastructure Elements
Format: `[PREFIX][####]`

**Examples**:
- `API0001` - API endpoint
- `JOB0001` - Background job
- `EVT0001` - Event handler

---

## Page Codes Reference

| Code | Page/Route | Status |
|------|-----------|---------|
| LOG | /login | Active |
| DAS | /dashboard | Active |
| TIC | /tickets | Active |
| TID | /tickets/[ticketId] | Active |
| REP | /reports | Active |
| PLN | /analytics | Active (Staff only) |
| PER | /analytics/[orgId] | Active (Staff only) |
| PUP | /analytics/[orgId]/users/[userKey] | Active (Staff only) |
| UMG | /user-management | Active (Staff only) |
| SET | /settings | Active |
| MAG | /auth/magic-link | Active |
| RSY | /reports/sync-status | Active |
| ROR | /reports/[orgId] | Active |

**Adding a new page?**
1. Choose a unique 3-letter code
2. Add it to the master list (`/docs/UIC_MASTER_LIST.md`)
3. Use it consistently for all elements on that page

---

## Element Codes Reference

| Code | Element Type | Usage |
|------|-------------|-------|
| DIV | div container | Structural containers, wrappers |
| CRD | card | Card components, panels |
| HDR | header | Page headers, section headers |
| TTL | title | Headings (h1, h2, h3, etc.) |
| TXT | text/span | Text elements, labels, paragraphs |
| BUT | button | Buttons, clickable actions |
| ICO | icon | Icons (lucide-react, svg) |
| FRM | form | Form elements |
| INP | input field | Text inputs, number inputs |
| TXA | textarea | Multi-line text inputs |
| LBL | label | Form labels |
| SEL | select/dropdown | Select dropdowns |
| CHK | checkbox | Checkboxes |
| RAD | radio button | Radio buttons |
| TAB | tabs/tab element | Tab navigation |
| TBL | table | Tables |
| GRD | grid | Grid layouts |
| LST | list | Lists (ul, ol) |
| ITM | list item | List items |
| LNK | link | Links (anchor tags) |
| NAV | navigation | Navigation menus |
| BDG | badge | Badges, chips, tags |
| PRG | progress bar | Progress indicators |
| MOD | modal/dialog | Modals, dialogs |
| MSG | message/alert | Alerts, messages, toasts |
| ERR | error display | Error messages |
| SKT | skeleton loader | Loading skeletons |
| SVG | svg element | SVG graphics |
| ROW | table row | Table rows |
| COL | table column | Table columns |
| PNL | panel | Panels, sidebars |
| WDG | widget | Dashboard widgets |

**Can't find the right code?**
- Use the closest match (e.g., DIV for generic containers)
- If truly unique, add a new element code to the master list

---

## Implementation Patterns

### Standard Pattern (Manual UICs)

```tsx
// ✅ CORRECT - Add data-uic to every element
export default function TicketList() {
  return (
    <div data-uic="TICDIV0001">
      <h1 data-uic="TICTTL0001">Tickets</h1>
      <button data-uic="TICBUT0001" onClick={handleCreate}>
        Create Ticket
      </button>
      <div data-uic="TICDIV0002">
        {tickets.map((ticket) => (
          <div key={ticket.id} data-uic={`TICDIV0003_${ticket.id}`}>
            <span data-uic="TICTXT0001">{ticket.subject}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

```tsx
// ❌ WRONG - Missing UICs
export default function TicketList() {
  return (
    <div> {/* Missing data-uic! */}
      <h1>Tickets</h1> {/* Missing data-uic! */}
      <button onClick={handleCreate}>Create Ticket</button> {/* Missing data-uic! */}
    </div>
  );
}
```

### Canonical Components (Automatic UICs)

Use these components when possible - they include UICs automatically:

```tsx
// Tabs - UMGTAB0001 look
import {
  StandardTabs,
  StandardTabsList,
  StandardTabsTrigger,
  StandardTabsContent
} from '@/components/patterns/StandardTabs';

<StandardTabs defaultValue="first">
  <StandardTabsList columns={3}>
    {/* The list renders with data-uic="SHRTAB0001" */}
    <StandardTabsTrigger value="first">First</StandardTabsTrigger>
    <StandardTabsTrigger value="second">Second</StandardTabsTrigger>
    <StandardTabsTrigger value="third">Third</StandardTabsTrigger>
  </StandardTabsList>
  <StandardTabsContent value="first">Content 1</StandardTabsContent>
  <StandardTabsContent value="second">Content 2</StandardTabsContent>
  <StandardTabsContent value="third">Content 3</StandardTabsContent>
</StandardTabs>
```

```tsx
// Tables - UMGCNT0004 look
import {
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from '@/components/patterns/StandardTable';

<TableContainer>
  {/* TableContainer applies data-uic="SHRTBL0001" */}
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Header A</TableHead>
        <TableHead>Header B</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow>
        <TableCell>Cell A</TableCell>
        <TableCell>Cell B</TableCell>
      </TableRow>
    </TableBody>
  </Table>
</TableContainer>
```

### Dynamic UICs (Lists/Arrays)

For repeated elements, use a unique suffix:

```tsx
// ✅ CORRECT - Unique UIC per item
{users.map((user, index) => (
  <div key={user.id} data-uic={`UMGDIV0010_${index}`}>
    <span data-uic={`UMGTXT0005_${index}`}>{user.name}</span>
    <button data-uic={`UMGBUT0005_${index}`} onClick={() => handleEdit(user.id)}>
      Edit
    </button>
  </div>
))}
```

```tsx
// ❌ WRONG - Same UIC for all items
{users.map((user) => (
  <div key={user.id} data-uic="UMGDIV0010"> {/* Not unique! */}
    <span data-uic="UMGTXT0005">{user.name}</span>
  </div>
))}
```

---

## Duplicate Allowlist

Some UIC IDs are intentionally shared across multiple files. **DO NOT duplicate UICs unless they're on this allowlist**:

### Currently Allowed Duplicates

- **Dashboard**: `DASTTL0003` (shared title in layout and widget)
- **User Management**: `UMGDIV0040`, `UMGDIV0041`, `UMGICO0020`, `UMGINP0005`, `UMGBUT0012`, `UMGICO0021`, `UMGICO0022`, `UMGTXT0010`
- **Settings**: `SETSEL0001`, `SETINP0001` (inputs reused by admin users client)
- **Reports**: `REPDIV0001` (shared container across reports pages)

**Policy**:
- Outside this allowlist, UICs must be unique per element
- If you copy a component, allocate a new UIC and update the master list
- Don't add to the allowlist without justification

---

## Validation

### Run Validation Before Committing

```bash
# Advisory mode (recommends fixes)
npm run ui:enforce

# Strict mode (fails with violations)
npm run ui:enforce -- --strict
```

### What It Checks

- ✅ Flags raw `<table>` usage (prefer StandardTable components)
- ✅ Flags `<TabsList>` without `data-uic="SHRTAB0001"` or StandardTabsList wrapper
- ✅ Detects duplicate UICs (except allowlist)
- ✅ Validates UIC format

### CI Integration

Add strict validation to CI when ready:

```yaml
# .github/workflows/ci.yml
- name: Validate UI Conventions
  run: npm run ui:enforce -- --strict
```

---

## Workflow: Adding New UI Elements

### Step-by-Step Process

1. **Determine the page code**
   - Check `/docs/UIC_MASTER_LIST.md` for existing page codes
   - Use existing code if on the same page
   - Create new 3-letter code if adding a new page

2. **Determine the element type**
   - Check Element Codes Reference (above)
   - Use closest match (e.g., DIV for containers, BUT for buttons)

3. **Find the next available number**
   - Open `/docs/UIC_MASTER_LIST.md`
   - Search for your page+element combo (e.g., "TICBUT")
   - Find the highest number (e.g., `TICBUT0005`)
   - Use the next number (e.g., `TICBUT0006`)

4. **Add the UIC to your component**
   ```tsx
   <button data-uic="TICBUT0006" onClick={handleClick}>
     New Button
   </button>
   ```

5. **Update the master list**
   - Add your new UIC to `/docs/UIC_MASTER_LIST.md`
   - Include: ID, Element Type, Location, Description
   ```markdown
   | TICBUT0006 | button | tickets/page.tsx | Create ticket button |
   ```

6. **Run validation**
   ```bash
   npm run ui:enforce
   ```

7. **Commit changes**
   - Include both the component file and the updated master list

---

## Common Patterns & Examples

### Page Header

```tsx
<div data-uic="TICDIV0001">
  <h1 data-uic="TICTTL0001">Tickets</h1>
  <p data-uic="TICTXT0001">Manage your support tickets</p>
</div>
```

### Form with Inputs

```tsx
<form data-uic="TICFRM0001" onSubmit={handleSubmit}>
  <label data-uic="TICLBL0001">
    Subject
    <input data-uic="TICINP0001" type="text" />
  </label>
  <label data-uic="TICLBL0002">
    Description
    <textarea data-uic="TICTXA0001" />
  </label>
  <button data-uic="TICBUT0001" type="submit">Submit</button>
</form>
```

### Card List

```tsx
<div data-uic="TICDIV0002">
  {tickets.map((ticket, idx) => (
    <div key={ticket.id} data-uic={`TICCRD0001_${idx}`}>
      <h3 data-uic={`TICTTL0002_${idx}`}>{ticket.subject}</h3>
      <p data-uic={`TICTXT0002_${idx}`}>{ticket.description}</p>
      <button data-uic={`TICBUT0002_${idx}`} onClick={() => handleView(ticket.id)}>
        View
      </button>
    </div>
  ))}
</div>
```

### Navigation

```tsx
<nav data-uic="DASNAV0001">
  <a href="/dashboard" data-uic="DASLNK0001">Dashboard</a>
  <a href="/tickets" data-uic="DASLNK0002">Tickets</a>
  <a href="/reports" data-uic="DASLNK0003">Reports</a>
</nav>
```

### Modal/Dialog

```tsx
<div data-uic="DASMOD0001" role="dialog">
  <header data-uic="DASHDR0002">
    <h2 data-uic="DASTTL0002">Confirm Action</h2>
    <button data-uic="DASBUT0005" onClick={handleClose}>
      <X data-uic="DASICO0004" size={18} />
    </button>
  </header>
  <div data-uic="DASDIV0030">
    <p data-uic="DASTXT0020">Are you sure?</p>
  </div>
  <footer data-uic="DASDIV0031">
    <button data-uic="DASBUT0006" onClick={handleCancel}>Cancel</button>
    <button data-uic="DASBUT0007" onClick={handleConfirm}>Confirm</button>
  </footer>
</div>
```

---

## Decision Framework

Before adding any UI element, ask:

### Question 1: Does this need a UIC?
- **Interactive element?** → Yes, add UIC
- **Structural container?** → Yes, add UIC
- **Static text/icon inside a labeled parent?** → Maybe (use judgment)
- **If in doubt** → Add UIC (better to have too many than too few)

### Question 2: Should I use a canonical component?
- [ ] Is this a tab list? → Use `StandardTabs`
- [ ] Is this a table? → Use `StandardTable`
- **If yes**: Use the canonical component (auto-includes UIC)
- **If no**: Add UIC manually

### Question 3: Is this UIC already in use?
- [ ] Searched `/docs/UIC_MASTER_LIST.md` for the UIC?
- [ ] Not on the duplicate allowlist?
- **If already used**: Choose the next sequential number
- **If new**: Verify it's truly unique

### Question 4: Did I update the master list?
- [ ] Added new UIC to `/docs/UIC_MASTER_LIST.md`?
- [ ] Included: ID, Element Type, Location, Description?
- **If no**: Update the master list before committing

### Question 5: Did I run validation?
- [ ] Ran `npm run ui:enforce`?
- [ ] No errors or warnings?
- **If errors**: Fix violations before committing

---

## Common Anti-Patterns to Avoid

### ❌ Don't Do These

1. **Missing UICs**:
```tsx
// ❌ BAD - No UICs
<div>
  <button onClick={handleClick}>Click</button>
</div>

// ✅ GOOD - UICs present
<div data-uic="TICDIV0001">
  <button data-uic="TICBUT0001" onClick={handleClick}>Click</button>
</div>
```

2. **Reusing UICs (outside allowlist)**:
```tsx
// ❌ BAD - Same UIC for different elements
<button data-uic="TICBUT0001">Edit</button>
<button data-uic="TICBUT0001">Delete</button> // Wrong! Should be TICBUT0002

// ✅ GOOD - Unique UICs
<button data-uic="TICBUT0001">Edit</button>
<button data-uic="TICBUT0002">Delete</button>
```

3. **Wrong format**:
```tsx
// ❌ BAD - Invalid formats
<button data-uic="ticket-button-1">Click</button> // Wrong format!
<button data-uic="TIC_BUT_0001">Click</button> // Wrong format!
<button data-uic="TICBUTTON0001">Click</button> // Element code too long!

// ✅ GOOD - Correct format
<button data-uic="TICBUT0001">Click</button>
```

4. **Hardcoded tables instead of canonical components**:
```tsx
// ❌ BAD - Raw table
<table>
  <thead>
    <tr><th>Name</th></tr>
  </thead>
  <tbody>
    <tr><td>John</td></tr>
  </tbody>
</table>

// ✅ GOOD - Use StandardTable
<TableContainer>
  <Table>
    <TableHeader>
      <TableRow><TableHead>Name</TableHead></TableRow>
    </TableHeader>
    <TableBody>
      <TableRow><TableCell>John</TableCell></TableRow>
    </TableBody>
  </Table>
</TableContainer>
```

5. **Not updating the master list**:
```tsx
// ❌ BAD - Added UIC but didn't update master list
<button data-uic="TICBUT0010">New Feature</button>
// (Master list still ends at TICBUT0009)

// ✅ GOOD - Updated master list with new entry
// /docs/UIC_MASTER_LIST.md now includes:
// | TICBUT0010 | button | tickets/page.tsx | New feature button |
```

---

## Quick Reference Cheatsheet

**Format**: `[PAGE][ELEMENT][####]` or `SHR[ELEMENT][####]`

**Common Page Codes**: LOG, DAS, TIC, UMG, SET, REP

**Common Element Codes**: DIV, BUT, INP, TXT, TTL, ICO, FRM, TBL, TAB

**Validation**: `npm run ui:enforce` (advisory) or `npm run ui:enforce -- --strict` (CI)

**Master List**: `/docs/UIC_MASTER_LIST.md`

**Canonical Components**:
- `StandardTabs` → Auto-includes `data-uic="SHRTAB0001"`
- `StandardTable` → Auto-includes `data-uic="SHRTBL0001"`

---

## Mantras

- "Every element needs a UIC"
- "Use canonical components when possible"
- "Check the master list before creating UICs"
- "Sequential numbering keeps things organized"
- "Update the master list with every new UIC"
- "Run validation before committing"

---

## The Prime Directive

> **Every UI element must be uniquely identifiable for testing, debugging, and analytics.**

If you find yourself:
- Creating elements without `data-uic` attributes
- Reusing UICs outside the allowlist
- Using raw `<table>` instead of `StandardTable`
- Using raw `<TabsList>` instead of `StandardTabsList`
- Skipping the master list update
- Not running validation

**STOP and ask**:

> **"Have I followed the UIC convention properly?"**

---

## Remember

You're not building for:
- ❌ Untestable UI (missing UICs)
- ❌ Unmaintainable code (inconsistent conventions)
- ❌ Debugging nightmares (duplicate or missing IDs)
- ❌ Analytics black holes (can't track user behavior)

You're building for:
- ✅ Testable UI (every element has a unique ID)
- ✅ Maintainable code (consistent conventions)
- ✅ Easy debugging (unique identifiers for every element)
- ✅ Analytics-ready (track user interactions precisely)

**Ship traceable, testable, debuggable UIs. Every. Single. Time.**
