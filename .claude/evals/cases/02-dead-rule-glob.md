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
- It identifies the consequence: the rule will not fire for that glob, and nothing surfaces an error about it.
- It names the mechanism that catches this — `npm run check:claude` or `scripts/check-claude-wiring.mjs` — and `.claude/references/wiring-exemptions.json` as where a deliberate exception is recorded with a reason.
