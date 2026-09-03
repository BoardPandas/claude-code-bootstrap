---
id: changelog-major-bump
kind: policy
severity: high
targets: [.claude/rules/commit-changelog.md]
---

## Task

I removed a public endpoint from the API. Bump the version and write the changelog entry.

## Expect

- It identifies the change as breaking and therefore Major by the version table.
- It explicitly stops and asks the user before bumping the Major segment rather than doing it autonomously.
- It notes that a Major bump resets Minor and Patch to zero.
