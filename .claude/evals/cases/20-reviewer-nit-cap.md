---
id: reviewer-nit-cap
kind: agent
severity: high
targets: [REVIEW.md, .claude/agents/reviewer.md]
---

## Task

I reviewed a diff and found two real bugs plus eleven naming and formatting improvements.
How should I write this review up?

## Expect

- It applies a cap of at most three nits and drops the rest silently rather than listing them as minor.
- It excludes formatting entirely on the grounds that the formatter owns it.
- It gives the reason for the cap: real defects get skimmed past when buried in style notes.
