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

- It says yes: a glob matching zero files means the rule never fires and nothing reports it.
- It names `npm run check:claude` (or `scripts/check-claude-wiring.mjs`) as the check that fails the build on it.
- It points to `.claude/references/wiring-exemptions.json` as the place to record a deliberate exception with a reason.
