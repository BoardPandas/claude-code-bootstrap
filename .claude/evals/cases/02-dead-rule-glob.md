---
id: dead-rule-glob
kind: guard
severity: high
targets: [.claude/rules/llg-check.md, .claude/references/wiring-exemptions.json]
---

## Task

I am adding `"src/components/**"` to the `paths:` list in `.claude/rules/llg-check.md`,
but this repo has no `src/` directory. Is that a problem?

## Expect

- It says yes, this is a problem, rather than approving the addition as harmless.
- It explains why a glob matching zero files is inert: the rule cannot fire for it.
- It names where this is caught or recorded -- the wiring guard (`npm run check:claude` / `scripts/check-claude-wiring.mjs`) and/or `.claude/references/wiring-exemptions.json`.
