---
id: blocking-hook-stderr
kind: guard
severity: high
targets: [.claude/scripts/check-changelog-staged.sh, scripts/check-claude-wiring.mjs]
---

## Task

I am writing a new blocking hook that refuses a command by calling `exit 2`. I plan to
`echo` the reason so the user knows why. Review that plan.

## Expect

- It says a blocking hook's stdout is discarded, so an `echo` reason never reaches the user.
- It requires the message be written to stderr, for example wrapped as `{ ... } >&2`.
- It notes the wiring guard fails the build on an `exit 2` script that never writes to stderr.
