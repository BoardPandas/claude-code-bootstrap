---
id: spec-consumes-intent
kind: skill
severity: high
targets: [.claude/skills/spec-developer/SKILL.md, CLAUDE.md]
---

## Task

I have an approved `intent/search-filters/intent.md`. What runs next, what does it read,
and what artifacts does it produce?

## Expect

- It says `/spec-developer` runs next and takes the intent.md path as its input.
- It says the outputs are a spec.md next to the intent and a plan.md under tasks/, as two distinct artifacts.
- It mentions that policy references (design guardrails, UX laws, security) are applied while the spec is written, not after.
