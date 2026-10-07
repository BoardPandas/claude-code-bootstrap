# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.21.3] - 2026-10-07

### Fixed
- **`/repo-review` and `/ux-review` now run on the model they were meant to.** Both set `agent:` without `context: fork`. Claude Code honours `agent:` only when the skill forks, so both bindings were silently ignored and the skills ran on whatever model the session used. `ux-review` now forks into the `ux-reviewer` agent. `repo-review` declares `model: sonnet` instead, because it needs Bash and the `reviewer` agent has no Bash.
- **The wiring guard catches an inert agent binding.** Check 9 now fails a skill that sets `agent:` without `context: fork`, so this cannot come back unnoticed. `npm test` covers the new case.
- **The docs no longer say `agent:` works on its own.** CLAUDE.md, `instructions.md`, `init-repo` and `update-practices` now say the binding needs `context: fork`.

## [0.21.2] - 2026-10-07

### Changed
- **Node 24.** CI runs on Node 24, the current Active LTS, in all three workflows, and `package.json` now requires Node 24 or later. CI no longer tests Node 22, so the old `>=22` floor was a claim nothing checked.
- **The review workflow still installs Claude Code through npm, and now says why.** Anthropic's README marks npm install deprecated in favour of the native installer. A published npm version can never change. The installer script is fetched unpinned on every run and takes the binary's checksum from the same server as the binary. In the one job that holds the API key, the npm pin is the stronger guarantee.
- **The hooks reference separates plugin mod hooks from `settings.json` hooks.** Claude Mods (v2.1.287) use dotted events such as `tool.check` and `agent.spawn` inside a plugin. They never belong in `settings.json`, and none of the matcher or wiring-guard rules apply to them.
- **CLAUDE.md names the `explorer` agent for parallel exploration.** It used to say the built-in `Explore`, which `update-practices` warns against because it loads every MCP tool schema.

### Removed
- **The developertoolkit.ai changelog tracker** is no longer in the source registry. It was nine releases behind the official changelog (2.1.283 against 2.1.292). The registry's own policy drops a tracker that lags like that, because it only mirrors the changelog late.

## [0.21.1] - 2026-10-07

### Changed
- **CI actions moved to their current majors.** `actions/checkout` is now v7.0.1 and `actions/setup-node` v7.0.0 in all three workflows, still pinned to commit SHAs. Neither major changes anything these workflows rely on: none use `pull_request_target` or automatic dependency caching.
- **The AI review workflow installs Claude Code 2.1.289**, up from 2.1.247. Its `--tools`, `--strict-mcp-config` and `--permission-mode` flags were checked against that version's `--help`.
- **The hooks and settings reference is current to Claude Code 2.1.292.** It has a new section on hook behavior changes since 2.1.201:
  - PreToolUse and PermissionRequest hooks now fail closed when matching or serializing the input fails.
  - Rewritten tool input is re-checked against permission rules.
  - `<system-reminder>` tags in hook output are escaped.
  - Path-scoped rules now load on Write and Edit, not just Read.

  It also notes that agent-type hooks are refused on PermissionRequest, adds new settings (`attribution: false`, `maxProseWidth`, and the managed `allowedProviders`, `deniedModels` and `availableModelsMatch`), and lists the removed `taskOutputMaxChars` setting and settings a project can no longer set.
- **`instructions.md` documents new frontmatter.**
  - Agents: `omitClaudeMd` and `experimental.cacheTtl`.
  - The Agent tool's per-spawn `effort` parameter.
  - Frontmatter booleans also accept `yes`/`no`/`on`/`off`.
  - Naming a skill `verify` makes Claude run it before every commit.
- README's last-synced date is now 2026-10-07.

## [0.21.0] - 2026-10-06

### Removed
- **The configuration eval suite.** `npm run evals`, the 25-case corpus in `.claude/evals/`, `scripts/run-evals.mjs` and its self-test, and the `agent-evals.yml` workflow are gone. The template's checks are now `npm run check:claude` and `npm test`, both of which run in CI on every push. `init-repo` no longer creates an eval corpus. `update-practices` no longer syncs or audits one; a repo that adopted the suite earlier keeps it as its own, and the skill leaves it alone. Where `add-lesson`, `spec-developer`, `REVIEW.md` and the intent README said to add an eval case for a configuration lesson, they now say to add a wiring-guard check when the defect can be detected statically. Guard check 11 (a headless `claude` restricted by `--allowed-tools` must also be confined) stays, since it also covers the AI review workflow.

## [0.20.5] - 2026-10-03

### Fixed
- **The hooks reference taught the matcher mistake CLAUDE.md warns against.** Its "Matcher syntax" section listed `Bash(pattern)`, `Write(pattern)`, `Edit(pattern)` and `Read(pattern)` as matchers, and its recommended hooks said to configure `PreToolUse` with a `Bash(git commit*)` matcher, `PostToolUse` with `Write(*)` or `Edit(*)`, and a `Bash(rm -rf*)` delete gate. In a matcher that is permission-rule syntax: it matches nothing, so every hook configured from those lines would silently never run, and the wiring guard fails on it. The section now says a matcher takes tool names only (`Bash`, `Write|Edit`), argument filters go in `if:` on the handler, `if:` names each tool itself, and a gate script still checks the command because `if:` fires conservatively. Each recommendation names its matcher and `if:` separately. `init-repo`'s list of always-on hooks is reworded the same way. Repos that run "update practices" get the corrected reference, which that skill replaces with the template's copy.

## [0.20.4] - 2026-10-03

### Fixed

- **Every hook stopped running as soon as the shell left the repo root.** `settings.json` called each script as `bash .claude/scripts/<name>.sh`, but a hook runs in the session's current directory, and that directory moves with every `cd`. From a subdirectory the path no longer resolved, the hook failed as a non-blocking "No such file or directory" error, and the tool call went through unchecked. Session transcripts from repos built on this template show about 6,700 such failures between July 30 and October 3, most of them in sessions working inside an app subfolder: the release-authorization gate did not run on 684 shell commands and the changelog gate on 909. All nine hooks now run as `bash "$CLAUDE_PROJECT_DIR"/.claude/scripts/<name>.sh`, which resolves from any directory.

### Added

- **The wiring guard fails a hook that calls its script by a cwd-relative path** (check 3d). Its existing missing-script check also understands the anchored form now; without that it would have quietly stopped checking every hook. `init-repo`, the hooks reference and CLAUDE.md say to anchor, and a new eval case (`hook-script-project-dir`) covers writing a new hook. A repo that picks this up through "update practices" fails the guard until its own repo-specific hooks are anchored as well.

## [0.20.3] - 2026-09-28

### Fixed

- **`/add-lesson` and `/add-practice` told the agent to write scratch files where it is not allowed to.** Both staged the entry and index files under `.git/`, but the template's own `Edit(**/.git/**)` deny rule blocks the Write tool there. The first real run of `/add-lesson` stalled on it, and three files fetched into `.git/` by shell could not be removed afterwards because the cleanup was denied too. Scratch files now go in `.claude/kb-scratch/`, which contains a `.gitignore` of `*`. That makes the directory ignore itself, so nothing in it can be committed in any repo, whatever the repo's own `.gitignore` says.

## [0.20.2] - 2026-09-28

### Added

- **The wiring guard now fails any `claude` call restricted by `--allowed-tools` alone** (check 11). `--allowed-tools` only pre-approves tools, so under a `bypassPermissions` default the "read-only" agent keeps Edit, Bash and every MCP connector. That is the gap 0.20.1 closed by hand in the eval harness and the CI reviewer. Workflows and scripts now have to pass `--tools`, `--strict-mcp-config` and `--permission-mode` alongside it, and the check fires on both pre-fix files. Recorded in LL-G as `kb/claude-code/allowed-tools-does-not-restrict-under-bypass.md`.

## [0.20.1] - 2026-09-28

### Security

- **The eval harness was only read-only on paper.** Each case agent ran with `--allowed-tools Read,Glob,Grep`, which pre-approves those tools but removes none. Under a user-level `defaultMode: bypassPermissions`, the agent kept Edit, Bash, and every MCP connector on the machine: about 1,100 tools, including mail and chat senders. A case that asked it to "rewrite the frontmatter" of a rule did exactly that, editing `.claude/rules/bp-check.md` and `wiring-exemptions.json` and then running `npm test` in the working tree under test. Agent and judge calls now pass `--tools Read,Glob,Grep --strict-mcp-config --permission-mode default`, which leaves exactly three tools. A regression test asserts every `claude -p` call carries the lockdown. The 0.16.0 entry that credited `--allowed-tools` with making runs read-only was wrong.
- **The CI reviewer had the same gap.** `claude-review.yml` reads an untrusted diff, and project settings still gave it `WebFetch` and `Bash(git clone …)`. It now runs with the same lockdown.

## [0.20.0] - 2026-09-28

### Added

- **Codex gets the same configuration as Claude Code, generated rather than copied.** `npm run sync:codex` builds `AGENTS.md`, `.agents/skills/`, and `.codex/` (custom agents, hooks, config) from `CLAUDE.md` and `.claude/`. Every sibling repo that maintained these by hand drifted: skills went missing, a blind "Claude" to "Codex" replace produced `.Codex/agent-memory/` paths that do not exist, model names went stale, and a copied hook script kept a bug after the original was fixed. Hooks run the same `.claude/scripts/` in place, so there is still one copy of each.
- **`npm run check:claude` now fails when the Codex mirror is stale, missing a file, or carries one no source generates**, so a `.claude/` change cannot ship without regenerating it. `scripts/sync-codex.test.mjs` asserts each of those paths still fires.
- **What Codex cannot mirror is reported, not dropped.** The plan-mode hook (Codex has no plan-mode tool) and the two edit hooks (Codex edits arrive as `apply_patch`, which the scripts do not parse yet) are listed in `AGENTS.md` and `.codex/README.md`. The Stop/Notification bell becomes Codex's native `[tui] notifications`. Permission deny rules, which Codex does not enforce, are written into `AGENTS.md` as rules.
- `init-repo` and `update-practices` install and refresh the Codex mirror in downstream repos.

### Changed

- **The agent registry moved from `agents.md` to `.claude/references/agent-registry.md`.** A lowercase `agents.md` and Codex's `AGENTS.md` are the same path on Windows and default macOS, so one silently overwrites the other. The generator refuses to run while a lowercase `agents.md` exists, and `init-repo` moves an older repo's registry.
## [0.19.0] - 2026-09-10

### Added

- **`.gitattributes` now pins LF for every text file, not just `*.sh`**, and **`scripts/check-line-endings.mjs` (`npm run check:eol`, wired into CI) enforces it.** The guard fails if the `* text=auto eol=lf` rule is removed, or if any tracked text file is stored CRLF or mixed in the index. Both ship as part of the template, so every repo cloned from it inherits the rule and the guard rather than the gap.

  `eol=lf` is the half that matters: `text=auto` alone normalizes what is *committed* but leaves the *checkout* to `core.autocrlf`, which Git for Windows sets to true by default, so the CRs return on the next clone. The failure it prevents is silent from every angle — a CRLF working tree plus a later LF-only rewrite by any tool that treats a lone CR as a line terminator emits one line per CR, so every CR becomes a **real** blank line and a file's line count becomes exactly old-lines plus old-CRs, roughly doubling each cycle. A knowledge-base index went 257 → 768 → 1537 → 3071 lines that way while its actual content stayed at ~173, and changing a single number in it produced a 768-insertion/257-deletion diff that destroyed `git blame` for the file. `git status` stays clean throughout and Markdown renders N blank lines exactly like one, so nothing complains. Full write-up: LL-G `kb/git/crlf-expansion-doubles-file.md`.

  Paths marked `-text` are exempt by design — the attribute is the opt-out for vendored payloads kept byte-for-byte so a future upstream drop can be diffed. `.gitattributes` carries commented examples for when the template is cloned into a repo that vendors sources.

  `scripts/check-line-endings.test.mjs` covers it the way this repo covers its other guards: a fixture that passes, then one mutation at a time asserting exit 1 and the message naming the defect. Six cases, including the one this check has already failed in real life — an unparseable `git ls-files --eol` row (empty `w/` field, for a file staged but not checked out) once made its pattern miss, and a CRLF blob sailed through counted as "exempt" while the guard printed OK. Unparseable rows now fail closed. Reintroducing that bug fails two of the six tests.

  Deliberately not checked: a "blank lines outnumber content lines" heuristic. Legitimate files sit near a 1:1 ratio (changelogs, run logs, vendored manuals), so it false-positives on healthy files while the CR check catches the cause before any expansion can occur.

## [0.18.0] - 2026-09-10

### Added

- **`.claude/scripts/kb-commit.mjs` — writes several files to a repo as ONE commit** via the git data API (blobs → tree → commit → ref), with no local clone. `add-lesson` and `add-practice` now use it instead of three sequential `kb-upsert.sh` pushes.

  A knowledge-base entry is three files that are only correct together: the entry, its shelf `llms.txt`, and the master index count. Pushed one at a time the target repo passes through two genuinely broken states — after the first push the entry is a file no index links, after the second the master count disagrees with its shelf — and both now fail LL-G's and BP's CI. On 2026-09-10 that produced three red LL-G builds before the fourth went green.

  It also closes a HIGH-severity defect the old path carried. `kb-upsert.sh` re-reads each blob's SHA immediately before its PUT "so the value is fresh", which inverts the compare-and-swap: a freshly-read SHA always matches HEAD, so the write always succeeds and silently overwrites anything that landed while you were editing. LL-G's own `kb/git/github-contents-sha-refresh-defeats-cas.md` quotes that helper's comment as the anti-pattern. `kb-commit.mjs` therefore **requires** `--base` — the commit your edits were based on, read before editing — parents the new commit on it, and moves the ref with `force=false`, so a concurrent push is refused rather than clobbered. Verified both directions against a throwaway branch: a two-file commit landed as one commit with CRs stripped, and a deliberately stale `--base` was refused with HTTP 422 while the branch tip and existing content stayed untouched.

  It also normalizes content to LF before encoding. The contents API stores bytes verbatim — no git clean filter runs on that path — so a `.gitattributes` `eol=lf` rule does not govern it, and a CRLF scratch file (what the Write tool produces on Windows) otherwise puts CRs straight into the knowledge base. 24 arrived in an LL-G shelf index exactly that way.

### Changed

- **`add-lesson` and `add-practice` capture the base commit SHA before reading anything, and commit all three files together.** Both skills also gained the constraints they were previously silent about: append shelf bullets in the file's own format and on one line (both guards count bullets by line); edit the master index line-anchored because it has a hard byte budget that fails CI (LL-G 20 KB, BP 12 KB — LL-G's had once reached 51 KB of shelf summaries); and confirm the commit's CI run went green rather than treating the push as the finish line. `add-practice` additionally states that `## CHECK` and `## IMPLEMENT` are mandatory, because `apply-practice` reads exactly those two sections and an entry without them cannot be applied mechanically.

## [0.17.0] - 2026-09-06

### Added

- **`.github/workflows/claude-review.yml` — AI review in CI.** Reviews the diff against `REVIEW.md` and posts findings as a commit comment (or a PR comment where PRs are used). Runs on **push to main** as well as pull requests, because work here lands by merging directly; a PR-only review would never fire. Read-only, guarded on `ANTHROPIC_API_KEY`, using the pinned CLI rather than a third-party action.
- **`.claude/scripts/require-release-authorization.sh` — a release approval gate.** Production deploy commands block until a named person authorises the specific release with `RELEASE_AUTHORIZED_BY=<name>` on the command itself, which then appears in the transcript as a recorded fact rather than an unremembered click. Scoped to deploy commands; `--dry-run` exempt.

### Changed

- **`/add-lesson` now asks whether a lesson also needs enforcement** — an eval case, or a guard check when the defect is statically checkable. An LL-G entry teaches but does not enforce, which is how a gotcha returns later in another repo. It explicitly permits "no case needed" for technology gotchas rather than manufacturing one.

### Fixed

- **The context-budget check never saw `.claude/CLAUDE.md`.** It resolved only the repository root, so a repo keeping its instructions under `.claude/` had its entire CLAUDE.md silently exempt from the ceiling it was meant to enforce. Found by the eval suite; the check now falls back to `.claude/CLAUDE.md`.
- **`/add-lesson` had been made to skip writing the LL-G entry.** The new Step 7 read as a substitute for Steps 1-6 rather than an addition to them, so the skill proposed a guard check and dropped the lesson entirely — displacing its whole purpose. Caught by `add-lesson-trigger` before it shipped. Step 7 now states that the LL-G entry always ships and is never replaced.
- **Two eval cases graded things their Task never asked, or contradicted this repo.** `dead-rule-glob` demanded the response say a dead glob surfaces no error — but this repo *has* the guard, so the build genuinely fails, and the correct answer was being penalised. `changelog-cross-repo` asked only about `git -C` while requiring the answer to also cover the `cd` form; passing depended on the agent volunteering it.

## [0.16.0] - 2026-09-06

The eval suite ran for the first time. It found two defects in itself, three in the
repository's own security posture, and nine cases that were grading the wrong thing.

### Security

- **`Bash(git clone:*)` was pre-approved, which is arbitrary code execution.** Git's `ext::` transport runs a shell command as the transport (`git clone "ext::sh -c <cmd>"`), and `--upload-pack=` is a second route; the `:*` glob constrained neither. This mattered more than usual here because RULE 1 and RULE 3 push the agent to fetch and act on third-party markdown every session. The allow entry is now scoped to `https://github.com/*`, and both routes are denied outright — deny wins at every settings tier, so a looser local override cannot reopen them.
- **The live deny list was weaker than the one this repo publishes as its own managed-settings example.** With blanket `Read` allowed, any dotenv file or private key in a working tree was readable with no prompt. Added `Read(**/.env)`, `Read(**/.env.*)`, `Read(**/*.pem)`, `Read(**/*.key)`, `Read(**/*.p12)`, `Read(**/*.pfx)` and `Read(~/.gnupg/**)`.
- **The eval workflow installed the Claude Code CLI unpinned, in the one job that holds the API key.** Every GitHub Action in this repo is pinned to a commit SHA for exactly this reason; the npm install was the outlier. Pinned to `@anthropic-ai/claude-code@2.1.247`, to be bumped deliberately.

### Fixed

- **The eval harness mutated the repository it was grading.** It ran cases under `--permission-mode plan`, which reads as the safer choice and is not: plan mode writes a plan artifact as a side effect, and the destination is not reliably controllable — a `--settings` override of `plansDirectory` was ignored in favour of `~/.claude/plans`. The first 24-case run left 7 plan files in `tasks/`. Read-only now comes from `--allowed-tools Read,Glob,Grep` alone, which is what was actually providing it; the claim that plan mode made the run read-only has been corrected in the runner and in `.claude/evals/README.md`.
- **The formatter hook's containment guard could be escaped by a symlink.** It resolved the edited file's *directory* and confirmed that was inside the repo — but an in-repo symlink pointing outside passes that check, and the formatter then wrote through it to the target. It now resolves the full path and formats the resolved path, so nothing downstream re-follows the link.
- **A single pass/fail verdict hid judge errors.** The judge reported that a correct answer addressed none of its three expectations; because nothing was retained, it could not be investigated. Verdicts are now per-expectation and every run writes the response and verdict to `.claude/evals/.transcripts/<id>.md` (git-ignored).

### Changed

- **Nine eval cases rewritten to grade behaviour instead of recall.** Cases failed agents that had done the right thing but not recited a particular fact — `changelog-major-bump` identified the breaking change and stopped to ask, then failed for not adding that Major resets Minor and Patch to zero. Two more were unsatisfiable by construction: the harness allows only `Read,Glob,Grep`, so "routes to `/security-scan`" and "covers git history" could never pass. One graded the main session against a subagent's definition. All three anti-patterns are now written down in `.claude/evals/README.md`.
- **Timeouts report as `TIMEOUT` rather than a behavioural failure**, with the cap raised to 15 minutes and overridable via `EVAL_TIMEOUT_MS`.

## [0.15.0] - 2026-09-03

Aligns the template with Anthropic's AI-native SDLC playbook. The gaps closed were, in
order of consequence: nothing regression-tested the configuration, review policy lived in
nobody's file, and there was no way to put a problem into the system without already
knowing the solution.

### Added

- **Configuration evals (`.claude/evals/`).** The wiring guard proves `.claude/` is *wired*; nothing proved it still *works*. A skill body replaced wholesale by a template sync, a CLAUDE.md rule pruned one line too far, or a hook whose refusal message stopped landing all passed CI while behaving differently. A 24-case corpus now covers the guard contract, the commit gate, skill triggering, agent boundaries, and review policy. `npm run evals -- --validate` checks corpus structure with no API calls and runs on every push; `npm run evals` grades behaviour through `claude -p` restricted to read-only tools. A case that cannot be run fails rather than skipping — a suite that silently runs zero cases is indistinguishable from one that passes.
- **`REVIEW.md`.** Version-controlled review policy: five passes, a deliberately narrow Important bar (wrong, silently wrong, or a security/data-loss risk — everything else is a nit), a three-nit cap, and an explicit do-not-report list. `npm run check:claude` now fails when it is missing or missing a required section, because an empty stub satisfies an existence check and provides nothing.
- **`/capture-intent` and the `intent/` convention.** An idea can now enter the system as `intent/<slug>/intent.md` — the problem in the originator's own words, with no technology choices, file structure, or estimates. Requires no engineering knowledge, and stays `Status: Draft` until a product owner approves it. Unanswered questions are recorded as unanswered rather than filled with plausible guesses that later read as real constraints.
- **`## Commands`, `## Verifying your work`, and `## Things Claude Gets Wrong` in CLAUDE.md.** The verification contract was previously buried in prose: the repo had an ideal single check command and never said that green was the definition of done. The third section collects the eight corrections that had been needed twice.
- **Formatter hook (`PostToolUse` on `Write|Edit`).** Formats the edited file using whatever formatter the *project* declares — biome, prettier, ruff, black, rustfmt, gofmt, shfmt. Non-blocking by design, and paired with `REVIEW.md` forbidding formatting comments in review: a hook owns it now, so reviewers should not.
- **`.claude/references/managed-settings.example.json`.** A lift-and-adapt example of the org-policy tier: credential denies that cannot be relaxed downstream, a deny-by-default network allowlist, an approval-gate hook, and a minimum version floor. Documented as deployed via MDM — it is inert where it sits.
- **Weekly `security-scan` workflow.** `/security-scan` was on-demand only, making coverage point-in-time: a CVE published the day after a manual run went unnoticed. Now audits dependencies and checks for tracked credential files on a schedule.
- **Protected-path denies** for `node_modules`, build output, vendored trees, lockfiles, minified bundles, and `.git`.

### Changed

- **`/spec-developer` now consumes an approved intent and emits two artifacts, not one.** It previously conflated `spec.md` (what is built, product-owner-owned) with `plan.md` (how, engineer-owned). Splitting them lets a product owner approve the requirements without being asked to approve the implementation, and makes "did the diff match the plan?" answerable. It also refuses a `Status: Draft` intent unless explicitly overridden, and loads design guardrails, UX laws, the infrastructure profile, `REVIEW.md`, and recorded decisions *while writing* — conflicts land in a Flagged Concerns table naming who resolves each, rather than surfacing at review time when they have already cost a design.
- **CLAUDE.md is 14.5 KB, down from 15.9 KB against a 16 KB ceiling.** It had drifted to 97% full, so the next added paragraph would have turned CI red. Skill and agent frontmatter catalogs, the infrastructure profile detail, and the skills table were duplicated in `instructions.md`, `.claude/references/`, and `README.md`; they are now pointers. The skills table in particular was restating descriptions the harness already surfaces.
- **`update-practices` syncs the files outside `.claude/` that the guard requires.** `REVIEW.md` and `scripts/` were excluded by the blanket "any file not in `.claude/`" rule, which would have left every adopting repo permanently red with no way to fix it from the template. Its health audit also now covers eval-corpus drift, review-policy decay, and stalled artifacts.
- **`init-repo` creates `REVIEW.md` and an eval corpus**, tailors the review passes to the detected stack, and requires the three new CLAUDE.md sections. Budget guidance corrected from a line count to bytes.

### Fixed

- **Template sync would have shipped adopting repos a red build.** Anything the wiring guard requires but lives outside `.claude/` was unreachable through `update-practices`, and the `README.md` copy instructions for existing projects omitted `REVIEW.md` and `scripts/` entirely.

## [0.14.1] - 2026-08-23

### Fixed

- **The commit gate now judges the repo your command actually targets.** `cd otherrepo && git commit` and `git -C otherrepo commit` were checked against the CHANGELOG.md of whichever repo the session started in — refusing a perfectly compliant commit in another clone, and waving through a non-compliant one whenever the session's own changelog happened to be current. The gate now follows `cd`/`pushd` and `-C` out of the command text (later redirection wins, as it does for git), resolving relative paths against the directory the command will run in. When the target genuinely cannot be determined — a path built from a variable, a directory that does not exist, an explicit `--git-dir` — the commit is allowed rather than blocked.
- **`SKIP_CHANGELOG=1` actually bypasses the gate now.** The documented escape hatch, the one the block message itself tells you to reach for, never worked: hooks are spawned by the harness and do not inherit variables set on the command being checked, so the bypass silently did nothing and the commit stayed blocked. `SKIP_CHANGELOG=1 git commit -m "..."` is now read out of the command text. It must be a prefix on the command itself — mentioning it inside a commit message exempts nothing.

## [0.14.0] - 2026-08-23

### Added

- **Two infrastructure profiles instead of one locked stack.** Server-side work now deploys onto **Cloudflare** (Workers for frontend and API, D1 or Hyperdrive-fronted Postgres, KV and Durable Objects, Queues, Cron Triggers, native CDN/WAF) or **Railway** (container services, managed Postgres and Redis, cron service type, volumes, with a Cloudflare proxy in front). Profiles are picked whole rather than mixed layer by layer, because the two platforms do not map onto each other — Cloudflare has no Redis and no managed Postgres, Railway has no object storage or edge network. `.claude/references/infrastructure.md` documents both end to end with diagrams, constraints, and a table of requirements that decide the choice outright.
- **plan-repo researches the platform instead of being told it.** A new Wave 1 subagent compares both profiles against the project's actual requirements as of the current date and reports a recommendation, the strongest argument against it, and any requirement that rules a profile out. The user approves or overrides it in the stack recommendation like any other layer; overriding the profile re-runs the dependent research rather than keeping picks that no longer fit.
- **A desktop track in plan-repo.** A new delivery-target question (web, desktop, or both) routes the research: desktop projects get subagents for the desktop framework (Tauri, Electron, Wails, Flutter, Compose, Avalonia, Qt, Rust-native, or fully native per-OS), desktop UI and local data (embedded SQLite, OS keychain, offline sync), and packaging and distribution (per-OS installers, code signing, macOS notarization, auto-update feeds, CI matrix builds). Desktop follow-up questions cover target OSes, OS-level capabilities, and how users receive updates.
- **Desktop projects can have no infrastructure at all.** A local-first desktop app gets no hosting section; a profile enters the plan only when the app actually needs a server for accounts, sync, licensing, or telemetry. Auto-update artifacts alone need only R2, no compute on either profile.
- **Desktop coverage in the generated artifacts.** Design guardrails gain native-feel and desktop-state rules (window chrome, per-OS menus and shortcuts, offline and update states); the README gains a desktop deployment section; the CLAUDE.md hierarchy gains a `desktop/CLAUDE.md`; and `tools.md` gains a desktop build-tool table (`cargo`, `tauri`, `electron-builder`, `codesign`/`notarytool`, `signtool`).

### Changed

- **Everything that is still fixed is stated as such, and it is a shorter list.** Cloudflare R2, Resend, Better Auth, and the five auth methods are shared by both profiles and are never researched. Payments remain out of the plan unless the requirements call for them.
- **Research runs in three waves rather than two**, since the platform decision constrains the language, framework, and ORM picks that follow. A routing table in the skill says which waves run for each delivery target.
- **`tools.md` is profile-aware.** `wrangler` covers R2 on both profiles plus Workers, D1, KV, Queues, and bindings on Cloudflare; the `railway` CLI covers deploys, addons, `railway run`, and logs on Railway. The "no local infrastructure" rule now carves out desktop builds, which are local by nature.

### Removed

- **Northflank.** It is no longer the hosting platform, no longer in `tools.md` as a CLI or an MCP entry, and no longer named in the plan-repo or init-repo skills. The duplicate Railway row in the MCP server table has been merged into one.

## [0.13.0] - 2026-08-21

### Added

- **Test suites for both gates** (`npm test`). `scripts/check-claude-wiring.test.mjs` builds a passing fixture repo, then breaks one thing at a time and asserts the wiring guard exits non-zero and names the defect — 22 cases covering every check. `scripts/check-changelog-gate.test.mjs` asserts the commit gate in both directions across 17 cases: each refusal path, each allow path, every exemption, subdirectory invocation, and graceful degradation in a repo with no `package.json`. Previously the guard was the only thing standing between silently-dead config and green CI, and nothing verified the guard itself still worked.
- **Wiring check: every skill must resolve to a model.** A skill either declares `model:` or binds `agent:` and inherits that agent's. Declaring neither leaves it running on whatever the session happens to be using, which is now a build failure rather than an invisible default.
- **`repo-review` documented in instructions.md**, which had never listed it.

### Changed

- **The context budgets now fail the build instead of warning.** `CLAUDE.md` over 16 KB, or all always-on context over 20 KB, is an error. There is no warning tier left in the wiring guard: an advisory check is read on the day it is added and never again, and in the meantime `CLAUDE.md` had drifted to 95% of a ceiling nobody was enforcing.
- **`CLAUDE.md` trimmed back under budget.** The 30-item hook-event list and the optional-settings list were duplicated verbatim from `.claude/references/hooks-and-settings.md`; both are now pointers to it, with an instruction to read it before editing hooks. Net 845 bytes of headroom restored.
- **CI hardening.** Third-party actions are pinned to full commit SHAs rather than mutable `@v4` tags, and the workflow declares `permissions: contents: read`.
- **The changelog flow is direct-to-version.** There is no `[Unreleased]` staging area — each commit adds its own `## [version]` section. The rule and both hooks said otherwise while the repo had done it this way for 29 releases.

### Fixed

- **The commit gate no longer accepts intent in place of state.** It previously allowed any command whose *text* mentioned staging the changelog, and `git add CHANGELOG.md` stages nothing when the file is unmodified — so the exemption fired for exactly the commits it existed to stop. It now checks that `CHANGELOG.md` differs from `HEAD`, that `package.json`'s version differs from `HEAD`'s, and that the changelog contains a section naming that version. The tradeoff is stated in the block message: the edit must be its own step, because a `PreToolUse` hook cannot see a file the command it is checking has not written yet. (LL-G `kb/claude-code/hook-validates-text-not-state.md`)
- **The commit gate enforces the version bump it always demanded.** Its own refusal message told you to bump `package.json`; nothing checked. A commit with a staged changelog and an unchanged version passed.
- **The gate is anchored to the repo root**, so a commit issued from a subdirectory is judged against the same tree as one issued from the top.
- **Exemptions for `--amend` and the initial commit**, both of which previously tripped the gate for no reason.
- **`README.md` no longer teaches trigger phrases that cannot work.** `plan-repo`, `spec-developer`, `mermaid-diagram`, and `merge-worktrees` set `disable-model-invocation: true`, so the plain-English phrases the Quick Start recommended silently did nothing. They are now shown as slash commands, with a note explaining the distinction.
- **`README.md` skill and agent tables brought current** — they listed 10 of 16 skills and 5 of 8 agents, omitting the entire LL-G/BP contribution loop that RULE 1 and RULE 3 depend on.
- **`README.md` clone URL and sync date corrected** — it pointed at a `your-org` placeholder and claimed March 2026.
- **Removed the `agy-execute-plan` documentation from `instructions.md`.** The skill was deleted; its tree entry and full reference section remained, describing a subsystem that no longer exists.
- **`design-guardrails.md` marked as generated** in `README.md`, which described it as if it shipped with the template.

## [0.12.2] - 2026-08-07

### Fixed
- **`git -C <path> commit` walked straight past all three commit gates.** The filter matched `git` followed immediately by `commit`, so any of git's global flags sitting between the two hid the commit from every gate: `git -C /repo commit`, `git --git-dir=/r/.git commit`, `git -c user.name=bot commit`. Loosening the pattern to allow tokens in between is not the fix either -- that starts blocking `git log --grep=commit` and `git config --get commit.gpgsign`. Detection now walks the command's tokens the way git reads its own argv: find `git` at a command position, step over global flags (accounting for the ones that consume the *next* token as their value), and require the first non-flag token to be `commit`. Covered by a 30-case matrix of commit forms and near-misses, run against each parser backend.

- **The degraded path mangled two cases it was supposed to catch.** With no interpreter available, the command is recovered from the raw payload text, and the surrounding JSON came with it: trailing structure fused onto the last token (`commit"}}` is not `commit`) and an escaped newline fused two commands into one (`x\ngit` is not `git`). Both read as "no commit here" -- silence, in the fallback whose whole job is not to be silent. The recovered text is now split on JSON's own punctuation first.

### Changed
- **Verification now covers Linux, not just the Windows failure that prompted it.** The parser probe, the argv walk, and the degraded fallback were each exercised three ways: with `node`, with a real `python3` (what a Linux box normally selects), and with no working interpreter at all -- 30/30 in every mode. One Windows-only fix was caught and reverted during this: a `sed` substitution for escaped newlines works on Linux but silently matches nothing under Git Bash, because MSYS rewrites backslashes in a command's argv. It is done with bash parameter expansion instead, which behaves identically on both.

## [0.12.1] - 2026-08-07

### Fixed
- **The commit gates' emergency fallback had never worked either.** When no JSON interpreter is available, `_git-commit-filter.sh` was documented to fall back to scanning the whole hook payload -- "over-eager but never under-eager", so a blocking gate could not go quiet. It went quiet. The matcher strips quoted regions before looking for `git commit`, and in a raw JSON payload the command *is* a quoted region: `{"command":"git commit -F m.txt"}` strips down to `{:}` and matches nothing. The fallback was dead in exactly the same way the parser branch was, and it could not show it while the branch above it was also dead. The degraded path now lifts the command out of the raw text first, so it is bare enough to match. Verified with `node` absent and `python3` resolving to the Windows Store stub: every commit form is still detected, and `git log` still is not.

### Changed
- **JSON extraction moved into one shared `_json-parser.sh`.** The parser probe and both interpreter one-liners existed as two independently-maintained copies, in the commit filter and in the write hook. That is the arrangement `_git-commit-filter.sh` was itself created to end, and it matters more here: this code works around a bug whose entire character is silence, so a drifted copy does not throw, it returns nothing forever and the hook stops firing. The probe now also runs once at source time rather than once per field, which removes a redundant interpreter launch from every `Write` and `Edit`.

## [0.12.0] - 2026-08-07

### Added
- **`update-practices` now audits the health of the `.claude/` folder, not just its currency.** Syncing keeps the config *up to date*; the new Step 2c checks whether it actually *works*. Those come apart quietly: a hook that never fires, a skill whose documented trigger cannot start it, an agent nothing can reach, a memory entry the code contradicts. None of that raises an error, it just stops helping.

  The audit runs the wiring guard first and explicitly does not re-implement it -- if a property is mechanically checkable it belongs in CI, not in a skill someone has to remember to run. On top of that it verifies hooks **behaviorally**, by running each script against a synthetic payload and asserting both directions: that it fires when it should, *and* that it stays silent when it should not. Only the second direction catches an over-broad filter. It also checks that skills are startable (a `disable-model-invocation: true` skill must be documented as `/command`), that every agent named by a skill or `Agent()` allowlist resolves, that memory entries are still true and that gotchas were routed to LL-G, and that the CLAUDE.md hierarchy stays lean and non-duplicating.

  Findings are classified BROKEN / DEGRADED / SUGGESTION / HEALTHY. New agents are only ever *suggested*, with the evidence that motivated them, and never created -- an unused agent is permanent context cost. A check that could not be run is reported as its own finding rather than counted as healthy.

### Fixed
- **All four git-commit hooks were dead on Windows, and had been since they were written.** `_git-commit-filter.sh` chose its JSON parser with `command -v python3`. On Windows that resolves to the WindowsApps Store stub: the lookup *succeeds*, the stub writes "Python was not found" to stderr (swallowed by the customary `2>/dev/null`) and prints nothing to stdout. `HOOK_COMMAND` came back empty, `is_git_commit` returned false, and every one of the four hooks exited 0 -- the changelog gate, the here-string check, the changelog reminder, and the post-commit knowledge-base prompt all silently allowing everything. The over-eager fallback written to prevent exactly this was unreachable, because the `command -v` guard had already reported success.

  This is the same defect fixed in the other hook scripts in 0.11.0; the shared helper was missed, which is why it survived. Parser selection now probes a candidate by running it against a payload of known shape, and the fallback also triggers when a parser returns nothing for a payload that plainly carries a command. Found by the new health audit on its first run, and verified in three directions: blocks a commit with no changelog staged, allows one with it staged, and stays silent on a command that merely mentions `git commit`.

- **The wiring guard now catches this parser defect** (check 7b), so it cannot return through another script. A loop over `command -v "$cand"` is the correct form and is not flagged. Verified that the assertion fails on a script carrying the defect and passes once it is removed.

## [0.11.0] - 2026-08-07

### Added
- **The knowledge-base check now fires at the moment a file is written, not only at the start of a session.** A new `PreToolUse` hook on `Write|Edit` inspects the file about to be written and names the exact LL-G shelves for its technology (`.ps1` to `powershell`, `.tsx` under `app/` to `typescript` + `nextjs` + `react`, anything under `.claude/` to `claude-code`, and so on) rather than restating the generic mandate. Files with no shelf coverage -- prose, JSON, lockfiles, assets -- produce nothing. This closes the gap between the SessionStart nudge, which fires once before any technology is known, and `.claude/rules/llg-check.md`, which states the rule but never fires at the write itself.

  The reminder is de-duplicated per session and per shelf set, so it appears once for PowerShell work rather than on every edit. Session identity comes from the hook payload; sessions no longer share state.

- **Plan documents written outside plan mode are now caught.** The same hook recognizes a plan by its path (`tasks/`, or a filename containing `plan`, `spec`, or `roadmap`) and asks for both LL-G and BP before the document is written. Previously the only planning check hung off `EnterPlanMode`, so a plan written by `/spec-developer` straight into `tasks/` got no check at all.

- **`ExitPlanMode` is now a second planning checkpoint.** `pre-plan-kb-check.sh` fires on entry and on exit, with wording specific to each: entry asks for the knowledge bases up front, exit asks Claude to confirm it consulted them and to revise before presenting if it did not. Both are advisory -- gating every plan on a network fetch would be worse than a skipped check.

### Fixed
- **Hook scripts silently extracted nothing from their JSON payload on Windows.** The scripts selected a parser with `command -v python3`, which on Windows resolves to the WindowsApps Store stub: the lookup succeeds, the stub exits without output, and every field comes back empty with no error. The effect on the new write hook would have been that `session_id` never resolved and all sessions shared one de-duplication file, so the reminder fired once ever and then went quiet. Parser selection now probes candidates by *running* one against a payload of known shape and keeping the first that answers correctly, preferring `node`, with a `sed` extraction as a last resort so the check degrades loudly rather than disappearing.

- **The wiring guard failed any hook script that mentioned `$CLAUDE_FILE_PATH` in a comment.** Check 7 tested the raw file text, so citing the gotcha at the point it applies -- which is this repo's documented convention -- tripped the very warning being documented. It now strips whole-line comments before testing. Trailing inline comments are deliberately still flagged, since a real use and a trailing note cannot be told apart without a shell parser. Verified that a genuine `prettier --write "$CLAUDE_FILE_PATH"` is still caught.

## [0.10.0] - 2026-08-07

### Added
- **`update-practices` and `init-repo` now run a live web search alongside the fixed source list.** It is gated twice, and both gates are hard filters: a result needs a visible publish date within the last seven days, and it has to be tied to the current Claude Code version's minor line. Undated pages fail on the first gate by design, since that is most of what a best-practices query returns. Finding nothing is a normal run and gets reported as such -- the skills are told not to widen the window to manufacture results. Surviving results are treated as claims, not sources: one only reaches the config if an official source or the installed CLI confirms it, and everything else is reported to you instead.
- **The source registry now states what qualifies as a source**, with the two `curl` checks that decide it -- a repo's `pushed_at`, and a version-anchored grep for trackers. The loose version of that grep matches minified JS and misreports live pages as dead, so the pattern is spelled out.

### Removed
- **Eight frozen sources dropped from the registry** (30 URLs down to 22). One was a plain 404. Two were `anthropics/courses`, untouched since November 2025. Four were dated one-off posts -- two Substack articles, a Product Compass post, and a conference-talk transcript -- each pinned to whatever version was current when it was written. The last was the `claudefa.st` changelog mirror, stopped at 2.1.128 while Claude Code shipped 2.1.224.

### Fixed
- **The Anthropic cookbook URL pointed at a renamed repo.** `anthropics/anthropic-cookbook` became `anthropics/claude-cookbooks`; the old address answered only through a redirect. Repaired rather than dropped -- that repo is still updated daily.

## [0.9.1] - 2026-08-07

### Fixed
- **The wiring guard's exemption mechanism never worked on Windows.** `check-claude-wiring.mjs` derived file keys with `path.relative()`, which returns backslash-separated paths on Windows, then compared them by strict equality against the forward-slash keys in `wiring-exemptions.json`. No exemption could ever match, so `npm run check:claude` failed locally on Windows with a contradictory pair of errors for every entry: each glob was reported as dead (its exemption did not apply) *and* its exemption was reported as stale (it was never consumed). On Linux CI both sides are forward-slashed, so the check passed there -- the bug was invisible to the workflow that gates it and only ever hit developers on Windows. `rel()` now normalizes to posix separators, which also makes reported paths identical across platforms. Verified that the guard still fails on an unexempted dead glob and on a genuinely stale exemption.

## [0.9.0] - 2026-08-07

### Added
- **New `triage-issues` skill.** `/triage-issues` reads the open GitHub issues, groups duplicates that share a root cause, and dispatches one worktree-isolated `builder` subagent per unit to implement and verify the fix. The session then lands each finished branch one at a time -- merge, re-verify on the merged tree, update CHANGELOG and version, commit, push, close the issues -- and reports anything a subagent could not resolve as a blocker with a concrete recommended next step. Blocked issues get a `claude-blocked` label so the next default run skips them; `/triage-issues all` retries them.

  The skill is repo-agnostic: it detects the main branch, stack, package manager, and verification commands from the target repository rather than assuming any of them. It only dispatches agents at issues with an identifiable code root cause -- data problems, product decisions, and unreproducible reports are reported back instead, because a confident wrong fix on the main branch is worse than an untouched issue.

  Guardrails: a dirty working tree, a protected main branch, a merge conflict, a failed verification, or a rejected push each stop the run. It never force-pushes, and never closes an issue before the fix is pushed. Subagents are barred from touching `CHANGELOG.md`, the version, the main branch, and the issues themselves -- the coordinating session owns all four, which is what keeps parallel agents from conflicting on every unit.

  Set `disable-model-invocation: true`: it commits and pushes autonomously, so it runs only from the explicit slash command.

## [0.8.0] - 2026-07-29

Ran the BP `claude-config/claude-wiring-audit` checklist against this repo and fixed what it found. The theme: enforcement that looked correct but had never run.

### Added
- **`.claude/` wiring is now verified in CI.** New `scripts/check-claude-wiring.mjs` (`npm run check:claude`, dependency-free, node built-ins only) asserts the properties that otherwise fail silently: rule frontmatter uses `paths:` and not Cursor's `globs:`/`alwaysApply:`, every glob matches at least one real file, hook matchers are bare tool names, referenced hook scripts exist, no hook silences both stderr and its exit code, blocking hooks write to stderr, no hook interpolates the nonexistent `$CLAUDE_FILE_PATH`, frontmatter keys are hyphenated, and the always-on context budget stays under ceiling. Every assertion was verified to actually fail on the defect it targets. A new GitHub Actions workflow runs it before any install step, plus a `bash -n` syntax check on the shipped hook scripts.
- **Deliberately-dead globs are now recorded, not silent.** `.claude/references/wiring-exemptions.json` holds the template-only globs (`src/**`, `Dockerfile*`, …) that match nothing in this repo but do match in projects cloned from it, each with a reason. An exemption that stops being needed fails the guard instead of rotting.

### Fixed
- **Blocked commits explained themselves for the first time.** `check-changelog-staged.sh` wrote its `BLOCKED:` message to stdout before exiting 2, and a blocking hook's stdout is discarded — so every refusal since the hook landed arrived with no reason attached (the harness reported literally "No stderr output"). The message now goes to stderr and includes the four steps to unblock.
- **The commit hooks no longer fire on commands that merely mention a commit.** All four shared a self-filter that grepped the whole hook payload, so `grep -r 'git commit' docs/` was blocked outright and any command whose *output* mentioned a commit tripped the post-commit hook. The filter now reads `tool_input.command` only and ignores quoted text. It lives in one place (`.claude/scripts/_git-commit-filter.sh`) rather than four slightly-different copies — the drift between those copies is what hid the stderr bug.
- **The LL-G rule could never fire.** `llg-check.md` was scoped to `src/`, `lib/`, `app/`, `worker/`, `api/`, `scripts/`, `middleware.*` — none of which exist here — and omitted `.claude/**`, so editing a hook script triggered no knowledge-base check in this repo or in any project cloned from it. Now scoped to `.claude/**` and `scripts/**` as well. `bp-check.md` gained `.github/**` and `package.json`, and lost a duplicated `.github/**` entry.
- **`kb/claude-code/` is now in the RULE 1 technology list.** The one LL-G shelf most relevant to a repo whose entire content is `.claude/` configuration was missing from it — and it already documented the stderr bug above, along with the worktree and byte-budget gotchas also fixed in this release.
- **Four skills documented triggers that cannot work.** plan-repo, spec-developer, mermaid-diagram and merge-worktrees set `disable-model-invocation: true`, so the advertised phrases ("plan repo", "spec developer", …) never started them — including the repo's headline workflow. The skills table and workflow section now show the `/command` form.
- **The builder agent can no longer silently report success against stale files.** It runs with `isolation: worktree`, so uncommitted work in the main tree is invisible to it; it now orients with `git rev-parse`/`status`/`log` first and stops rather than reporting "already compliant" against content it cannot see.
- **CLAUDE.md is budgeted in bytes, not lines.** The stated "under 200 lines" limit was both wrong (the file was 211) and unenforceable — long lines game a line count while the real token cost grows. Now a 16 KB ceiling checked by `npm run check:claude`. Also corrected: rules are described accurately (a rule with no `paths:` loads in every session), and `template-sync-state.json` / `design-guardrails.md` are marked as generated-on-demand rather than implied to exist.

## [0.7.0] - 2026-07-08

### Changed
- **plan-repo skill overhauled.** Research now runs in two explicit waves (language + frontend first, then the four prompts that depend on those picks), every subagent prompt embeds the literal resolved date instead of "today's date", candidate lists are marked as seeds that subagents must refresh against current search results, and a failed subagent no longer stalls the skill. The skill now consults LL-G and BP before researching (RULE 1 + RULE 3) so HIGH-severity gotchas can demote candidates and pre-seed the plan's Lessons Learned section. The SPA-vs-SSR serving mode is recorded as an explicit decision in the recommendation and saved plan. Re-running the skill with an existing `tasks/plan-repo.md` now asks whether to revise or archive instead of overwriting. The optional project-description argument is actually consumed. Frontmatter tightened: `disable-model-invocation: true` and the Agent tool restricted to `Agent(explorer)`.
- **Agent roster hardened.** Read-only review agents (reviewer, performance, security, ux-reviewer, architect) drop `permissionMode: plan` and instead gain `Write` scoped solely to saving reports/plans under `tasks/`, with an explicit "never modify source" instruction; review agents also get `maxTurns` budgets. The security agent moves to `effort: xhigh`, adds package-manager-aware audit commands (`pnpm`/`yarn` audit, `pip-audit`) plus `git log`/`ls-files`/`check-ignore` for history and tracked-secret checks, and its scan categories are rebuilt around the 2025 OWASP Top 10 with value-shaped secret patterns. The builder agent runs in an isolated git worktree (`isolation: worktree`); explorer and tester gain `memory: project` so they read agent-memory before acting. The performance agent adds a hot-path verification step and measurement-to-confirm guidance.
- **Skills refreshed to current Claude Code practices.** security-scan, update-practices, spec-developer, ux-review, init-repo, performance-review, test-scaffold, dependency-audit, and doc-sync were revised for accuracy and current tooling; init-repo gains `AskUserQuestion`. CLAUDE.md adds RULE 0 (Read-Only First), documents hook-script portability and the new template-sync files, and `instructions.md`/`agents.md` are updated to match.
- **Template sync now tracks state.** New `.claude/references/template-sync-ignore.md` lets a project record files it deliberately removed so `update-practices` will not re-create them, alongside a `template-sync-state.json` for last-synced commit and dead-URL strikes.

### Removed
- **`agy-execute-plan` skill removed** (SKILL.md and its evals), superseded by the standard plan/execute workflow.

### Fixed
- **Stripe is no longer assumed.** plan-repo previously wrote Stripe env vars into every README; payments now enter the plan only when the requirements interview says the project takes them (Stripe as the default provider).
- **Gotcha routing aligned with CLAUDE.md.** plan-repo and init-repo told sessions to route post-implementation discoveries to the local `.claude/agent-memory/debugging.md`; both now route to LL-G via `/add-lesson`, and the section name is standardized to "Lessons Learned / Gotchas".

## [0.6.0] - 2026-07-08

### Added
- **New `repo-review` skill.** A general code health review of the whole repository that complements the specialized scans: it checks repo hygiene (tracked junk, oversized files, config drift), correctness and error handling gaps, maintainability (dead code, duplication, naming, premature abstraction), and configuration consistency, then produces a severity-ranked report where every finding includes a specific fix. Instead of duplicating the deep skills, it does a light pass on security, performance, tests, dependencies, docs, and UX, and routes real signal to security-scan, performance-review, test-scaffold, dependency-audit, doc-sync, or ux-review as follow-ups. Bound to the reviewer agent and triggered with "repo review".

## [0.5.2] - 2026-07-05

### Added
- **Hooks & settings catalog expanded to Claude Code 2.1.201 (July 2026).** `hooks-and-settings.md` now documents hook structured output (`updatedToolOutput` on PostToolUse, `additionalContext` on Stop/SubagentStop, `reloadSkills`/`sessionTitle` on SessionStart), `Tool(param:value)` parameter matching (e.g. `Agent(model:opus)`), HTTP hook custom headers with env-var interpolation, a `PermissionRequest` prompt-hook auto-approval pattern, new settings (`defaultMode`, `fallbackModel`, `enforceAvailableModels`, `disableBundledSkills`, `requiresMinimumVersion`, `attribution.sessionUrl`, `autoMode.*`), the full six-tier settings precedence chain, the `ENABLE_PROMPT_CACHING_1H` cache lever, and the v2.1.196 security change that stops committed MCP servers from auto-spawning.
- **New frontmatter capabilities documented.** `user-invocable: false` for hidden background-knowledge skills, `Agent(agent_type)` tool-allowlist entries to restrict which subagents an agent can spawn, and nested `.claude/` directories as a first-class per-subfolder convention (closest wins, `<dir>:<name>` collision naming).
- **Tools reference refreshed for mid-2026.** Biome promoted to the BP-recommended default for new JS/TS projects, `oxlint` and `rolldown` added (Vite 8+ bundles via Rolldown), eslint repositioned for plugin-dependent codebases, and the Prisma entry updated for v7's pure TS/WASM client with native edge support.

### Changed
- **Docs caught up with the agent roster.** `instructions.md` now covers the `builder` and `tester` agents, the `agy-execute-plan` skill, `hooks-and-settings.md`, and per-agent memory folders that already existed in the repo but were missing from the folder map and reference sections.
- **CLAUDE.md notes that subagents now run in the background by default** and can nest up to 5 levels; stale "see init-repo skill" pointers now point at the hooks-and-settings catalog.

### Removed
- **Generic coding-standard bullets pruned from CLAUDE.md** (clear code, descriptive names, small functions) per the "remove what the model handles natively" rule, keeping the file under the 200-line cap.

## [0.5.1] - 2026-06-14

### Added
- **Builder agent memory: skill-propagation pattern** (`.claude/agent-memory/builder/feedback_skill_propagation.md`). Captures the verified, safe sequence for propagating template skills into downstream repos (read every target before writing, stage-then-chmod `kb-upsert.sh`, add the `.gitattributes` LF rule before committing the script, re-read `package.json` right before bumping because a hook may auto-bump it, never sync `infrastructure.md`, and always route exploration to the custom `explorer` agent). Distilled by the builder agents during the cross-repo propagation run.

## [0.5.0] - 2026-06-14

### Added
- **New `agy-execute-plan` skill.** Hands an existing Claude-written plan to the Antigravity CLI (`agy`) for autonomous end-to-end execution, then independently verifies the result against the plan's acceptance criteria using the test suite and the git diff (not AGY's self-reported log), fixes whatever AGY left incomplete or broke, and reports an honest blocked/partial/complete status. Encodes the verified `agy` v1.0.8 operating knowledge a fresh session would otherwise have to rediscover: run headless with an empty stdin and `--dangerously-skip-permissions` or it hangs forever, print-mode stdout is empty when redirected (judge by diff + tests), the Windows PATH-reload step, the `AGY_BLOCKED.md` halt signal, and the set of flags that actually exist in v1.0.8.

## [0.4.0] - 2026-06-14

### Added
- **Bundled `.claude/scripts/kb-upsert.sh`.** A portable create-or-update helper for the GitHub contents API that captures each file's blob SHA immediately before writing and base64-encodes without the GNU-only `base64 -w0` flag. The `add-lesson` and `add-practice` skills now call it instead of hand-running ~8 `gh api` calls each with manual SHA threading, removing a fragile, duplicated sequence and a macOS portability landmine.
- **New `.claude/references/hooks-and-settings.md`.** A single canonical catalog of every hook event, the five hook types, matcher syntax, and all `settings.json` options. `init-repo` and `update-practices` now point at it instead of each carrying their own copy, so the lists can no longer drift apart.

### Changed
- **Knowledge-base skills route exploration to the custom `explorer` agent.** `spec-developer`, `mermaid-diagram`, `plan-repo`, `init-repo`, and `update-practices` previously spun up the built-in `Explore` subagent, which loads every connected MCP tool schema and exceeds the context window (the exact failure CLAUDE.md warns against). They now use the scoped `explorer` agent and say why; `doc-sync`'s explorer references were made explicit too.
- **`add-lesson`, `add-practice`, and `apply-practice` frontmatter normalized.** Added pushy, trigger-phrase-rich descriptions and the `user-invocable`, `argument-hint`, and least-privilege `allowed-tools` fields the other skills already declare.
- **Consistent model routing.** Every standalone skill now pins `model:` (haiku for the mechanical KB writers, sonnet for analysis, opus for orchestration); agent-bound skills continue to inherit their agent's model.
- **`init-repo` slimmed from 491 to 396 lines** by moving the hook/settings reference tables into `hooks-and-settings.md`, bringing it back under the 500-line guideline.

### Fixed
- **Corrected a false claim** in `add-lesson`/`add-practice`/`apply-practice` that the GitHub MCP server "does not exist and will hang the skill." A GitHub MCP server can be connected; the guidance now explains the real reason to stay on `gh`/`WebFetch` (avoid loading MCP schemas mid-skill).
- **Removed the dead `Agent` tool** from `security-scan`, `performance-review`, and `ux-review` allowed-tools — each is bound to a read-only agent that lacks the `Agent` tool, so the entry was impossible and unused.
- **Dropped a phantom `Error` hook event** that `init-repo` referenced; the new reference uses the real `StopFailure` event.

## [0.3.1] - 2026-06-14

### Changed
- **Rewrote the agent-memory README** (`.claude/agent-memory/README.md`) to a more prescriptive version ported from another project. Adds a numbered Rules section covering append-only edits, the 200-line context-injection limit per memory file, and topic-based partitioning when files grow, plus clearer entry-format and activation guidance.

## [0.3.0] - 2026-06-14

### Added
- **New `builder` agent** (`.claude/agents/builder.md`). The template's first implementation-capable agent: a scoped Read/Glob/Grep/Edit/Write/Bash role (`sonnet`, effort `high`, `permissionMode: acceptEdits`, `memory: project`) that turns a plan or spec into working, tested code matching existing conventions. It fills the gap that enabling agent teams exposed: every prior agent was read-only, so the only way to spawn an implementing teammate was the built-in `general-purpose` type that CLAUDE.md bans for blowing the context window. Builders own a file set and coordinate via messaging rather than editing across boundaries, making parallel feature and cross-layer work possible without conflicts.
- **New `tester` agent** (`.claude/agents/tester.md`). A Read/Glob/Grep/Bash role (`sonnet`, effort `medium`) that detects the project's test runner rather than assuming one, runs the relevant suite, and reports pass/fail with actual failure output and a likely-cause classification. It verifies behavior and never edits source, pairing with `builder` to complete the cross-layer team loop (one teammate builds, one verifies).
- Both agents registered in `agents.md` (full entries) and the CLAUDE.md key-agents list.

## [0.2.1] - 2026-06-14

### Added
- **Agent teams enabled project-wide.** `.claude/settings.json` now sets `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: "1"` in `env`, so every session cloned from this template can coordinate multiple Claude Code instances (shared task list, inter-agent messaging) without per-machine setup. Agent teams are experimental and require Claude Code v2.1.32 or later; the flag is read at session start, so a restart is needed for it to take effect. Subagents (the `Agent` tool) need no flag and remain on by default.

## [0.2.0] - 2026-06-09

### Added
- **Per-skill and per-agent `effort:` frontmatter.** All 15 skills and all 6 agents now pin an effort level matched to their workload: `low` for mechanical step-by-step skills (add-lesson, add-practice, mermaid-diagram), `medium` for analysis and guided-edit skills and the sonnet agents (reviewer, performance, explorer, ux-reviewer), and `high` for orchestration, planning, and high-stakes analysis (init-repo, plan-repo, update-practices, spec-developer, security-scan, architect, security). Lightweight skill invocations no longer inherit session-level effort they do not need.
- **`disable-model-invocation: true` on the `merge-worktrees` skill.** The skill force-deletes branches and worktrees, so it should never auto-trigger; it now runs only when explicitly invoked with `/merge-worktrees`.

### Changed
- **`doc-sync` allowed-tools now declares `Agent`** instead of the pre-rename `Task` tool, completing the cleanup that 0.1.2 applied to the other skills.
- **`agents.md` documents each agent's effort level** alongside its model.

## [0.1.2] - 2026-06-09

### Fixed
- **Commit hook scripts now self-filter on the actual command instead of trusting the `if` rule.** Discovered live after 0.1.1 made the hooks active: the `if: "Bash(git commit*)"` rule fires conservatively on commands containing opaque command substitutions (verified: a `gh api ... -f content="$(base64 ...)"` upload with no git commit in it was blocked by the changelog gate). All four hook scripts now read the hook input JSON and exit 0 unless the command actually contains a git commit invocation, treating `if` as an optimization rather than the guard. Both gotchas from this work were contributed to the LL-G knowledge base under the new `claude-code` technology.

## [0.1.1] - 2026-06-09

### Fixed
- **The git-commit hooks never fired.** All four commit hooks in `.claude/settings.json` used `"matcher": "Bash(git commit*)"`, but hook matchers only match tool names (verified against the official hooks reference and confirmed empirically: a `git commit` with nothing staged ran unblocked). Changed each group to `"matcher": "Bash"` with `"if": "Bash(git commit*)"` on every handler, the documented way to filter on tool arguments. The here-string guard, both changelog gates, and the post-commit knowledge-base prompt are now live.
- **The changelog staged-check no longer falsely blocks compound commands.** `check-changelog-staged.sh` runs before the command executes, so `git add CHANGELOG.md ... && git commit ...` was blocked because the changelog was not staged yet at hook time. The script now reads the hook input and allows any command that stages `CHANGELOG.md` itself.
- **`disable-model-invocation` was spelled with underscores and silently ignored.** The `mermaid-diagram` and `spec-developer` skills used `disable_model_invocation: true`, which Claude Code does not recognize, so both skills remained auto-invocable despite the manual-only intent. Corrected to the hyphenated key (both skills now disappear from the model-invocable list) and fixed the two `instructions.md` passages teaching the underscore spelling.
- **The pre-commit changelog reminder still described the retired 4-segment version scheme.** `pre-commit-changelog-reminder.sh` told Claude to bump `Major.Minor.Patch.Build` with "Build: every commit," contradicting the 3-segment SemVer rule adopted in 0.0.1. The hook text now matches `.claude/rules/commit-changelog.md`.
- **`.gitignore` no longer ignores `Cargo.lock`** (lockfiles should be committed), and the GOPATH-era `bin/` and `pkg/` entries plus the duplicate `build/` under Java/Kotlin were removed so projects' real `bin/`, `pkg/`, and `build/` directories are not silently excluded.

### Changed
- **`instructions.md` caught up with the template's current contents.** Added the `ux-review` and `merge-worktrees` skills, the `ux-reviewer` agent, and `references/ux-laws.md` to the folder structure and reference sections.
- **Skill `allowed-tools` lists now use the current `Agent` tool name.** `performance-review`, `security-scan`, `test-scaffold`, and `ux-review` still listed the pre-rename `Task` tool; all skills now consistently declare `Agent`.

## [0.1.0] - 2026-06-05

### Added
- **New `merge-worktrees` skill** (triggered by "merge worktrees"). Consolidates outstanding work into the repository's main branch and tears down the leftovers: it inventories every worktree and local branch, detects the real main branch (no `main` assumption), shows a plan and asks for confirmation, commits pending work in each worktree, merges every branch into main with `--no-ff`, pushes, then removes the worktrees and force-deletes the merged branches (locally and, with confirmation, on the remote). Merge conflicts and non-fast-forward pulls are hard stops, not auto-resolved, and nothing is deleted until the merge is committed and pushed. Registered in the CLAUDE.md skills index.

## [0.0.3] - 2026-06-05

### Removed
- **Deleted the completed `tasks/peaceful-whistling-dolphin.md` plan file.** The Learning Lessons / Gotchas (LL-G) system it described has been implemented, so the plan is no longer needed.

## [0.0.2] - 2026-06-03

### Fixed
- **`doc-sync` skill no longer assumes the docs folder is capital-D `Docs/`.** On Windows and macOS the filesystem is case-insensitive, so a pre-existing lowercase `docs/` folder satisfied the old hardcoded `Docs/` existence check while the skill kept writing to and citing `Docs/`, creating confusion (and a second, divergent folder on case-sensitive Linux/CI/git). The skill now resolves the docs root once, case-insensitively, preferring the casing git actually tracks (`git ls-files`), reuses that exact name for the whole run, and only defaults to `Docs/` when no docs folder exists.

## [0.0.1] - 2026-06-01

### Changed
- **Switched versioning from 4-segment `Major.Minor.Patch.Build` to 3-segment SemVer `Major.Minor.Patch` and reset the version to `0.0.1`.** Updated the scheme table and rules in `.claude/rules/commit-changelog.md` (the Build segment is removed; the Patch segment now also covers docs, refactors, config, and chores). Prior `1.x.x.x` entries below are retained as historical record.

### Fixed
- **Path-scoped rules were using Cursor's frontmatter dialect and silently not scoping.** `.claude/rules/llg-check.md`, `bp-check.md`, and `commit-changelog.md` used `globs:` and `alwaysApply:`, which are Cursor `.mdc` keys that Claude Code ignores (verified against the official memory docs). Because a rule with no recognized `paths:` field loads unconditionally, the LL-G and BP rules were loading on every file instead of only their intended code/config paths. Converted all three to the official `paths:` YAML-list frontmatter; `commit-changelog.md` now correctly loads unconditionally with no `paths` field.
- **The Stop and Notification bell hooks printed a literal `\a` instead of ringing.** `.claude/settings.json` used `echo '\a'`, which emits the two characters `\` and `a` in most shells. Switched both to `printf '\a'` so the terminal bell actually fires.
- **The shipped baseline `.claude/settings.json` had an empty `permissions.deny` list** despite the init-repo skill documenting a secrets deny-list as "always configure." Added the documented deny entries (`~/.ssh`, `~/.aws`, `~/.azure`, `~/.kube`, `~/.docker/config.json`, `~/.npmrc`, `~/.git-credentials`, `~/.config/gh`, and shell rc files) so every repo cloned from the template starts with secret-file protection.

### Added
- **`SessionStart` hook** wired in `.claude/settings.json` plus a new `.claude/scripts/session-start-kb-check.sh` that surfaces the RULE 1 (LL-G) / RULE 3 (BP) knowledge-base mandate once per session. Previously the KB check only fired on `EnterPlanMode`, so sessions that never entered plan mode got no nudge.
- **`.claude/settings.local.json.example`** showing common git-ignored personal overrides (`disableAllHooks`, `alwaysThinkingEnabled`, `language`), as the init-repo skill recommends.
- **Changelog gate escape hatches.** `check-changelog-staged.sh` and `pre-commit-changelog-reminder.sh` now exempt merge commits (when `MERGE_HEAD` exists) and honor `SKIP_CHANGELOG=1` for genuinely trivial commits, instead of hard-blocking every commit without a staged `CHANGELOG.md`.

### Changed
- **Documented hook event count corrected from 28 to 30.** Added `UserPromptExpansion` (fires when a slash command expands) and `PostToolBatch` (fires after a parallel tool batch resolves), both confirmed in the official hooks reference. Updated `CLAUDE.md`, the init-repo skill hook table, the update-practices skill list (and refreshed its version reference to v2.1.159), and `instructions.md`.
- **`instructions.md` hook descriptions corrected** to reflect the hooks the template actually ships (the git-commit PreToolUse chain, the EnterPlanMode KB check, the PostToolUse KB-contribute prompt, and the new SessionStart reminder) rather than the previous inaccurate "logs a notification" summary.

## [1.8.1.3] - 2026-06-01

### Changed
- Repointed the LL-G and BP knowledge-base references from the `wellforce-brandon` GitHub org to `BoardPandas` after both repos moved. Updated the RULE 1 / RULE 3 fetch URLs in `CLAUDE.md`, the `llg-check` and `bp-check` path-scoped rules, the `add-lesson`, `add-practice`, `apply-practice`, and `init-repo` skills (repo headers, raw URL bases, `gh api` paths, and WebFetch URLs), the `pre-plan-kb-check` and `post-commit-kb-contribute` hook scripts, and `instructions.md`

## [1.8.1.2] - 2026-05-29

### Added
- `MessageDisplay` hook event (introduced in Claude Code v2.1.152) documented in the init-repo skill hook table, the update-practices skill hook list, `CLAUDE.md`, and `instructions.md`. It fires as assistant message text is displayed, letting hooks transform or hide output (for example, redacting secrets). Hook event count moves from 27 to 28

### Changed
- Refreshed the Claude Code version reference in the update-practices skill from v2.1.144 to v2.1.156 (the latest at time of update, verified against the official changelog)

### Removed
- Dropped the phantom `code-review` skill from the documented skill inventory. No `.claude/skills/code-review/SKILL.md` ever existed; the name would shadow the built-in `/code-review` command that the repo already recommends, and the full-codebase-audit niche is covered by `security-scan`, `performance-review`, and `ux-review`. Removed its references from `CLAUDE.md`, `README.md`, `instructions.md` (file tree and skill section), and the update-practices skill checklist. Code review is still available via the `reviewer` agent and the built-in `/code-review` command

## [1.8.1.1] - 2026-05-29

### Changed
- Swapped locked infrastructure defaults in the plan-repo skill and supporting references: frontend hosting moves from Cloudflare Pages to Northflank containers (SPA static-served or SSR, decided per project from the chosen framework), email locks to Resend only (AWS SES dropped), and the CDN is now Cloudflare's orange-cloud proxy in front of the Northflank frontend, with Northflank's built-in Fastly CDN as a no-WAF fallback
- Added a "CDN Setup Notes (Locked)" section to `.claude/references/infrastructure.md` covering Full (Strict) TLS, the ACME-challenge vs Cloudflare-proxy ordering, SSR cache-rule requirements, and zero-cost edge-to-R2 egress
- Updated `.claude/references/tools.md` so `wrangler` is scoped to Cloudflare R2 and DNS/CDN (not Pages) and `northflank` covers frontend deploys as well as backend

## [1.8.1.0] - 2026-05-23

### Fixed
- The update-practices skill now diffs the actual text content of template skills/agents/rules instead of relying on file existence. A skill that was rewritten upstream (e.g. `add-lesson`) is now detected as `TEMPLATE-REWRITTEN` and its body is replaced wholesale with the canonical version (re-applying only genuinely project-specific bits), rather than the old merge-only strategy that silently kept the stale local copy

## [1.8.0.0] - 2026-05-19

### Added
- `reviewer` and `architect` agents now use `memory: project`, reading `.claude/agent-memory/` on startup so they review and plan against accumulated project patterns and decisions
- `worktree.bgIsolation` and `worktree.baseRef` settings documented in the init-repo skill, CLAUDE.md, and update-practices skill (new in Claude Code v2.1.144)
- Prompt-cache preservation guidance (lock the MCP/tool list and model at session start) in CLAUDE.md and instructions.md

### Changed
- Refreshed the hook event reference in the init-repo and update-practices skills to the full 27 events as of Claude Code v2.1.144 (was 18). Added the missing `StopFailure`, `PostCompact`, `PermissionDenied`, `TaskCreated`, `CwdChanged`, `FileChanged`, `Elicitation`, `ElicitationResult`, and `Setup` events
- Added the `mcp_tool` hook type and the conditional `if:` field to the init-repo skill's hook reference, matching the documentation already in CLAUDE.md and instructions.md
- Corrected the init-repo skill's "Recommended agent enhancements" guidance: `background` and `isolation: worktree` are no longer suggested for read-only analysis agents, and `memory: project` guidance now covers `reviewer` and `architect`

## [1.7.1.0] - 2026-05-19

### Fixed
- `add-lesson`, `add-practice`, and `apply-practice` skills no longer hang and time out. They depended on a GitHub MCP server (`mcp__github__*`) that is not configured; invoking those nonexistent tools caused an unresolved tool search to loop until the turn hit its time limit. All three now use the `gh` CLI instead -- `gh api` for reads and writes in add-lesson/add-practice, `WebFetch` on raw URLs for the read-only apply-practice

## [1.7.0.0] - 2026-05-19

### Added
- Pre-commit hook (`check-commit-herestring.sh`) that blocks `git commit` commands using PowerShell here-string syntax (`@'...'@`). In the Bash tool that is not a here-string, so the `@` characters leak into the commit message as a stray `@` line. The hook points to writing the message to a file and using `git commit -F` instead

## [1.6.0.1] - 2026-04-29

### Added
- Documented `mcp_tool` hook type and the conditional `if:` filter syntax for hooks (CLAUDE.md, instructions.md)
- Documented `xhigh` effort tier and `keep-coding-instructions` skill frontmatter field (CLAUDE.md, instructions.md)
- Agent-memory README guidance on explicit memory curation framing and topic partitioning when files grow
- `Cost / token efficiency` audit section in the update-practices skill (effort tuning, model routing, cache preservation, input-format swaps, subagent delegation)
- ProductCompass "stop hitting Claude Code limits" entry to the source URL registry

## [1.6.0.0] - 2026-04-16

### Changed
- Rewrote `doc-sync` skill into a TOC-driven documentation builder that produces a categorized `Docs/` wiki (core, api, features, operations, etc.), modeled on the supportforge platform docs layout but with stable PAGE_ID and AUTOGEN markers for safe incremental updates
- `doc-sync` now operates in three modes: `init` (full generation), `update` (incremental git-diff regeneration), and `audit` (legacy report-only)

### Added
- `Docs/_toc.yaml` schema as the single source of truth for pages, sections, source-file mappings, and diagram requirements
- Reference files: `page-template.md`, `citation-policy.md`, `mermaid-policy.md`, `toc-schema.md`, `doc-categories.md`, `incremental-update.md`, `readme-template.md`
- Page templates: `overview.md`, `architecture.md`, `api-reference.md`, `feature.md`, `database-schema.md`, `module.md`, `data-flow.md`, `runbook.md`, `getting-started.md`, `configuration.md`, `glossary.md`, `_toc.yaml.template`
- Evidence-based citation rules with line numbers and parenthesized inline format
- Mermaid diagram policy (graph TD only, quoted node labels, no shorthand activation) and a 3-attempt repair budget
- AUTOGEN marker contract for safe regeneration that preserves manual notes
- `Docs/_meta/GENERATION.md` and `Docs/_meta/SUMMARY.md` outputs for generation metadata and coverage reporting

## [1.5.0.0] - 2026-04-14

### Added
- UX Review skill (`/ux-review`) for reviewing UI code against Laws of UX and Gestalt principles
- UX Reviewer agent (`ux-reviewer`) with severity-ranked finding output format
- UX Laws reference doc (`.claude/references/ux-laws.md`) covering all 30 laws from lawsofux.com with code-level indicators

## [1.4.0.0] - 2026-03-25

### Added
- Bootstrap template sync step in update-practices skill (Step 2b) to pull new/updated files from upstream template repo
- Bootstrap Template source URLs for GitHub API tree and raw content access
- Template sync report section in update-practices output summary

## [1.3.0.0] - 2026-03-24

### Added
- Add Practice skill wired to `wellforce-brandon/BP` via GitHub API
- Apply Practice skill wired to `wellforce-brandon/BP` via GitHub API
- Pre-plan hook to check LL-G and BP knowledge bases before creating plans
- Post-commit hook to evaluate if work should be contributed back to LL-G or BP
- Pre-commit changelog reminder hook with condensed update instructions

### Changed
- Commit-changelog rule set to `alwaysApply: true` so version bump instructions are always in context
- Pre-commit changelog enforcement hook status message clarified
