---
name: tdd-workflow
description: Test-Driven Development workflow with Red-Green-Refactor cycle and practical testing patterns
---

# Test-Driven Development (TDD) Workflow

Test-Driven Development is **REQUIRED** for all coding tasks on this project.

> For stack-specific test examples, see the relevant skill directory (e.g., `tdd-jest/SKILL.md`, `tdd-pytest/SKILL.md`, `tdd-go/SKILL.md`).

## TDD Cycle (Red-Green-Refactor)

```
1. RED:      Write a failing test
2. GREEN:    Write minimal code to make it pass
3. REFACTOR: Clean up while keeping tests green
```

## The Process

### Step 1: Write Test First (RED)

Before writing ANY production code, write a test that:
- Calls the function/endpoint you're about to create
- Asserts the expected behavior
- **Run it** — it should FAIL (the thing doesn't exist yet)

### Step 2: Write Minimal Code (GREEN)

Write the **simplest possible code** to make the test pass:
- Don't add features the test doesn't require
- Don't optimize
- Just make the test green

### Step 3: Refactor (BLUE)

Now clean up while keeping tests green:
- Add validation
- Improve naming
- Extract duplicates (only if 3+ exist)
- **Run tests after every change** — they must stay green

### Step 4: Add More Tests

Once the happy path works, add tests for:
- Error cases (invalid input, missing required fields)
- Edge cases (boundary values, empty collections)
- Auth/permission failures (if applicable)

## What to Test

### DO Test
- **Happy paths** — core functionality works as expected
- **Error cases** — invalid inputs return proper errors
- **Edge cases** — boundary conditions, empty states
- **Critical paths** — user-facing features, payment flows
- **Business logic** — core algorithms, calculations

### DON'T Test (For MVP)
- **Third-party libraries** — trust they work
- **Framework internals** — trust your framework works
- **Database engine** — trust your database works
- **Trivial getters/setters** — not worth the time
- **Over-mocking** — use real dependencies when sensible

## Testing Principles

### Test Behavior, Not Implementation
```
BAD:  "it calls the database with the correct query string"
GOOD: "it creates an item and returns it with an ID"
```

Testing implementation details makes tests brittle — they break when you refactor even if behavior is unchanged.

### Use Real Dependencies When Possible
- Prefer integration tests with a real database over unit tests with mocks
- Only mock external services you don't control (third-party APIs)
- If you're mocking more than one thing per test, the test is probably too complex

### Keep Tests Simple and Focused
- One assertion per concept (multiple asserts are fine if testing one thing)
- Each test should be independently understandable
- Tests are documentation — make them readable

### Test Organization
```
Group by feature, not by type:
  "Item creation"
    - creates item with valid data
    - returns error when name is missing
    - returns error for invalid email
```

## Common TDD Mistakes

### Mistake 1: Testing Implementation Details
Don't spy on internal method calls. Test the observable outcome instead.

### Mistake 2: Too Many Mocks
If you need to mock 5 things to test one function, your code is probably too coupled. Simplify the code, don't add more mocks.

### Mistake 3: Testing Frameworks
Don't test that your framework does its job. Test YOUR code.

### Mistake 4: Skipping the RED Step
If you write code first and tests after, you don't know if your tests actually catch failures. Always see the test fail before making it pass.

## TDD for MVP — Keep It Simple

### Good Test (Simple, Focused)
- Tests one behavior
- Sets up minimal data
- Makes one API call or function call
- Asserts the expected outcome

### Bad Test (Over-Engineered)
- Sets up complex mocks and fixtures
- Tests implementation details
- Has 50 lines of setup for 1 line of assertion
- Uses dependency injection and mock frameworks

## TDD Benefits

1. **Confidence** — know your code works before shipping
2. **Documentation** — tests show how to use the code
3. **Regression prevention** — catch breaks early
4. **Better design** — testable code is simpler code
5. **Faster debugging** — tests pinpoint exactly what broke

## TDD Checklist

Before implementing any feature:

- [ ] Write failing test first (RED)
- [ ] Run test — confirm it fails
- [ ] Write minimal code to pass (GREEN)
- [ ] Run test — confirm it passes
- [ ] Add error case tests
- [ ] Add edge case tests (critical ones only)
- [ ] Refactor while keeping tests green
- [ ] Run full test suite before committing

## Remember

- **Test first, code second** (always)
- **Keep tests simple** (no over-mocking)
- **Test behavior, not implementation**
- **Use real dependencies** when sensible
- **Tests are documentation** (make them readable)
- **Green tests before committing** (always)

### TDD Mantra

> **Red → Green → Refactor → Repeat**

Write the test. Make it pass. Clean it up. Ship it.
