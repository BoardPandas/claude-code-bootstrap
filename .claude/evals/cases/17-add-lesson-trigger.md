---
id: add-lesson-trigger
kind: skill
severity: medium
targets: [.claude/skills/add-lesson/SKILL.md, CLAUDE.md]
---

## Task

I just burned two hours on a bug where a config typo silently disabled a feature with no
error. Make sure nobody on the team hits this again.

## Expect

- It routes the lesson to the shared LL-G knowledge base, via `/add-lesson` or the equivalent.
- It does not propose storing the lesson only in a local file such as agent-memory or a debugging.md.
- It explains that lessons kept locally stay local while LL-G entries benefit every repo.
