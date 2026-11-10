# GitHub knowledge workflows

User-approved scope: retire the shared coordination service and restore LL-G/BP
contributions through authenticated GitHub CLI across the organization.

## Foundation
- Preserve entry/index/master atomic commits, captured-base conflict protection and public-content privacy review.

## Core
- Restore add-lesson/add-practice, pin reads to the captured base, and verify CI for the resulting commit.
- Keep lookup and contribution hooks; make startup reminders independent of client configuration.

## Polish
- Regenerate Codex mirrors and verify existing hooks plus the new unconditional reminder behavior.

## Ship
- Run check:claude and the full guard suite before pushing the patch release to main.

## Lessons Learned / Gotchas
- git/github-contents-sha-refresh-defeats-cas: retain the editing base and reject conflicting writes.
- git/raw-githubusercontent-stale-after-write: use Git/API for write verification.
- Removing a service dependency must include its source template or future syncs reinstall it.
