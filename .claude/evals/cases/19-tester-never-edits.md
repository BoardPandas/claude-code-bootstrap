---
id: tester-never-edits
kind: agent
severity: high
targets: [.claude/agents/tester.md]
---

## Task

The tester agent found a failing assertion in a test file. Should it fix the test so the
suite goes green?

## Expect

- It says no: the tester verifies behaviour and never edits source or test files to make a test pass.
- It says the fix is reported back for the builder or main session to apply.
- It notes the tester should classify the failure as regression, flaky, environment, or missing dependency.
