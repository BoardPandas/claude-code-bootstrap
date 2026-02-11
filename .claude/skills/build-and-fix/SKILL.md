---
name: build-and-fix
description: Run build and systematically fix all compilation/type errors
disable-model-invocation: true
allowed-tools:
  - Read
  - Edit
  - Bash
  - Glob
  - Grep
---

# Build and Fix - Comprehensive Error Resolution

Run the build process and systematically fix all compilation errors.

## Instructions

### Step 1: Detect and Run Build

Detect the project's build system and run the appropriate command:

```bash
# Detect and run the correct build command for this project:
# - Node/TypeScript: npm run build / npm run typecheck / npx tsc --noEmit
# - Python: mypy . / python -m py_compile / ruff check .
# - Go: go build ./... / go vet ./...
# - Rust: cargo check / cargo build
# - Java/Kotlin: ./gradlew build / mvn compile
# - C#/.NET: dotnet build
# - Other: check Makefile, package.json, build.gradle, Cargo.toml, etc.
```

Check CLAUDE.md for project-specific build commands.

### Step 2: Analyze Errors
- Capture all error output
- Group errors by type and file
- Prioritize errors (syntax > imports > types/compilation > lint)
- Identify root causes vs symptoms

### Step 3: Fix Systematically
Work through errors in this order:

1. **Syntax Errors** - Fix immediately, these block everything
2. **Import/Module Errors** - Resolve missing or incorrect imports/dependencies
3. **Type/Compilation Errors** - Fix type mismatches, missing definitions, compile failures
4. **Lint Errors** - Address code quality issues
5. **Warning Messages** - Fix if quick, otherwise document

### Step 4: Verify Fix
After each fix:
- Re-run build to verify error is resolved
- Ensure no new errors introduced
- Check related files for cascading issues

### Step 5: Final Verification
```bash
# Run the project's build command again
# Run the project's type-check or lint command if separate
# Run the project's test command if available
```

## Fixing Guidelines

### MVP-First Approach
- Fix errors with simplest solution
- Don't refactor while fixing build errors
- Use pragmatic shortcuts when needed temporarily
- Copy-paste working patterns from similar code
- Document any shortcuts taken

### Common Fixes by Language

**Import/Module Errors** (all languages):
- Fix incorrect paths or module names
- Add missing dependencies to the project's package manager
- Resolve circular imports by restructuring

**Type/Compilation Errors**:
- Add missing type annotations or definitions
- Fix type mismatches with correct types
- Use language-appropriate escape hatches sparingly when needed for MVP
  (e.g., `any` in TypeScript, `Any` in Python, type assertions in Go)

**Null/Nil Safety**:
- Add null checks or use safe-access patterns
- Use default values where appropriate
- Add guard clauses for required values

### What NOT to Do
- Don't refactor unrelated code
- Don't add complex type systems or abstractions
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
- [file1]: [brief description]
- [file2]: [brief description]

### Approach:
- [Key decision 1]
- [Key decision 2]

### Remaining Issues:
- [ ] [Warning or non-blocking issue]

### Build Status: PASS / FAIL
```

## Important Notes

- Fix errors, don't suppress or hide them
- Document any temporary/MVP shortcuts
- If error is complex, ask user before major refactor
- Keep fixes aligned with MVP principles
- Test manually after fixes if possible

Remember: Working code beats perfect types. Ship it.
