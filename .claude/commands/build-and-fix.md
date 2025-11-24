---
description: Run build and systematically fix all TypeScript/compilation errors
---

# Build and Fix - Comprehensive Error Resolution

Run the build process and systematically fix all TypeScript/compilation errors.

## Instructions

### Step 1: Run Build
```bash
cd wellforce-platform
npm run build
```

### Step 2: Analyze Errors
- Capture all error output
- Group errors by type and file
- Prioritize errors (syntax > type > lint)
- Identify root causes vs symptoms

### Step 3: Fix Systematically
Work through errors in this order:

1. **Syntax Errors** - Fix immediately, these block everything
2. **Import/Module Errors** - Resolve missing or incorrect imports
3. **Type Errors** - Fix type mismatches, missing properties
4. **Lint Errors** - Address code quality issues
5. **Warning Messages** - Fix if quick, otherwise document

### Step 4: Verify Fix
After each fix:
- Re-run build to verify error is resolved
- Ensure no new errors introduced
- Check related files for cascading issues

### Step 5: Final Verification
```bash
# Run full build
npm run build

# Run type checking
npm run typecheck

# Run tests if available
npm test
```

## Fixing Guidelines

### MVP-First Approach
- Fix errors with simplest solution
- Don't refactor while fixing build errors
- Hard-code types if needed temporarily
- Use `any` sparingly but don't be afraid of it for MVP
- Copy-paste working patterns from similar code

### Common Fixes

**Missing Types**:
```typescript
// Quick fix - add explicit type
const data: any = await fetchData();

// Better fix when time allows
interface FetchedData {
  id: string;
  name: string;
}
const data: FetchedData = await fetchData();
```

**Import Errors**:
```typescript
// Fix path
import { helper } from './utils/helper';
// to
import { helper } from '../utils/helper';

// Add missing import
import type { ClientConfig } from './types';
```

**Property Errors**:
```typescript
// Add optional chaining
const name = user.profile.name;
// to
const name = user?.profile?.name;

// Add property to interface
interface User {
  id: string;
  name: string;
  // Add missing property
  email?: string;
}
```

### What NOT to Do
- Don't refactor unrelated code
- Don't add complex type systems
- Don't create abstract types for MVP
- Don't over-engineer the solution
- Don't fix warnings if they require significant changes

## Error Reporting

After fixing, provide summary:
```markdown
## Build Fix Summary

### Errors Fixed: [X]
- [Category 1]: [Count] errors
- [Category 2]: [Count] errors

### Files Modified: [Y]
- [file1.ts]: [brief description]
- [file2.ts]: [brief description]

### Approach:
- [Key decision 1]
- [Key decision 2]

### Remaining Issues:
- [ ] [Warning or non-blocking issue]

### Build Status: ✅ SUCCESS / ❌ FAILED
```

## Important Notes

- Fix errors, don't hide them with `@ts-ignore`
- Document any temporary/MVP shortcuts
- If error is complex, ask user before major refactor
- Keep fixes aligned with MVP principles
- Test manually after fixes if possible

Remember: Working code beats perfect types. Ship it.
