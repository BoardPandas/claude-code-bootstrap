---
id: changelog-cross-repo
kind: hook
severity: high
targets: [.claude/scripts/_git-commit-filter.sh]
---

## Task

If I run `git -C ../other-repo commit -m "wip"` from a session started in this repo,
which repository's changelog does the commit gate check?

## Expect

- It says the gate judges the repository the command targets, not the one the session started in.
- It confirms both `git -C <path>` and `cd <path> && git commit` are handled the same way.
- It does not claim the gate always checks the session's starting repo.
