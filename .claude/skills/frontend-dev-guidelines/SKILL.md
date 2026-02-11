---
name: frontend-dev-guidelines
description: Next.js/React 19/Material UI v7 development patterns with simple state management and MVP principles
---

# Frontend Development Guidelines

Universal principles for frontend/UI development — applicable to any framework.

> For stack-specific code examples, see the relevant skill directory (e.g., `react-nextjs/SKILL.md`).

## MVP Principles for Frontend

### Always Follow
- **Simple components** (functional/declarative, not class-based)
- **Framework-native state** (use your framework's built-in state management)
- **Direct API calls** (no abstraction layers between UI and API)
- **Hard-coded values first** (extract config when patterns emerge)
- **One file** for related UI until it gets large
- **Copy-paste** over premature abstraction (Rule of Three)

### Never Use (Unless Justified)
- Complex state management libraries (until you've proven built-in state isn't enough)
- Higher-order components or render props patterns
- Complex context/provider hierarchies
- "Smart" vs "Dumb" component patterns
- Styled component abstractions (use your UI library's built-in styling)

## Component Structure

Keep components simple and self-contained:

1. **State** at the top (local state, derived values)
2. **Effects/lifecycle** next (data fetching, subscriptions)
3. **Handlers** for user interactions
4. **Render** at the bottom

Each component should do one thing. When a component grows past ~200 lines, consider splitting — but don't split prematurely.

## API Calls

- Call APIs directly from components (or a thin wrapper file)
- Don't build abstraction layers, API clients, or service classes for MVP
- Handle loading, error, and empty states for every data fetch
- Use your framework's native fetch mechanism

## State Management

### Prefer (In This Order)
1. **Local component state** — for UI state, form inputs, toggles
2. **URL/route state** — for filters, pagination, selected items
3. **Framework-native shared state** — context, signals, stores (only when multiple components need the same data)

### Avoid
- Adding a state management library before you've tried framework builtins
- Global state for data that only one component uses
- Complex reducer patterns for simple toggle/form state

## Loading & Error States

Every component that fetches data should handle:
1. **Loading** — show a spinner or skeleton
2. **Error** — show an error message with retry option
3. **Empty** — show a helpful empty state (not just blank space)
4. **Success** — render the data

Don't skip these — they're the difference between a prototype and a usable product.

## Forms

- Use local state for form fields
- Validate on submit (not on every keystroke for MVP)
- Show clear error messages next to the relevant field
- Reset form after successful submission
- Keep validation simple: required fields, basic format checks

## Routing

- Use your framework's built-in router
- Keep URL structure simple and predictable
- Use path parameters for resource IDs (`/items/:id`)
- Use query parameters for filters and pagination

## Performance (MVP Reality Check)

### Do These (Simple Wins)
- Debounce search inputs
- Paginate long lists
- Lazy load images
- Let your framework handle code splitting

### Don't Worry About (Yet)
- Complex memoization strategies
- Virtual scrolling
- Advanced caching
- Bundle size optimization (unless it's noticeably slow)

## Environment Variables

- Use your framework's env var mechanism (`.env.local`, `.env`, etc.)
- Prefix public vars appropriately per your framework's convention
- Never commit secrets to frontend code
- Use different values per environment

## Checklist Before Committing

- [ ] Following MVP principles (simple components, no complex patterns)
- [ ] Using framework-native state management
- [ ] Direct API calls (no abstraction layers)
- [ ] Tests written for critical flows
- [ ] Loading, error, and empty states handled
- [ ] Mobile responsive
- [ ] No console errors
- [ ] Component under 200 lines (guideline)

## Common Mistakes to Avoid

- **Complex state management**: Don't add state libraries for MVP
- **Premature abstraction**: Don't create component hierarchies before you need them
- **Over-styled components**: Use your UI library's built-in patterns
- **Missing error states**: Always handle loading, error, and empty

## Remember

- **Simple components** (functional, minimal)
- **Direct API calls** (no abstraction)
- **Framework-native state** (don't add libraries)
- **UI library defaults** (don't over-customize)
- **TDD** (test critical flows)
- **MVP mindset** (ship working UI fast)

When in doubt: "Can this component be simpler?"
