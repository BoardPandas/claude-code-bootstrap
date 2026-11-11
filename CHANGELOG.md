# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/2.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html) from 0.0.1 on. Releases 1.3.0.0 to 1.8.1.3 came first and used a four-part version (Major.Minor.Patch.Build); the version was reset to 0.0.1 when the project moved to SemVer, so they are listed after 0.0.1.

## [Unreleased]

## [0.29.0] - 2026-11-11

### Added
- **Google Antigravity mirror generation and hook bridge.** `npm run sync:codex` (and the new `npm run sync:agents` / `check:agents` aliases) now generates `.agents/agents/*.md`, `.agents/rules/*.md` (`trigger: glob`), `.agents/hooks.json`, and `.agents/README.md` alongside Codex's `.codex/` mirror via `scripts/sync-antigravity.mjs`. A new pure-bash adapter, `.claude/scripts/_antigravity-hook.sh`, runs existing `.claude/scripts/*.sh` hooks under Antigravity by anchoring at the git root, mapping `run_command`, `write_to_file`, and `replace_file_content` payloads, turning blocking `exit 2` responses into `{"decision":"deny"}` (exit `0`), emitting `SessionStart` output as `systemMessage`, and queueing `PreToolUse` / `PostToolUse` advisory context per `conversationId` for `PreInvocation`.

### Changed
- **24,000-byte skill and `AGENTS.md` ceilings.** `sync-codex.mjs` enforces Antigravity's 24,000-byte limit on `AGENTS.md` and generated `SKILL.md` files, prefixes `disable-model-invocation: true` skill descriptions so Antigravity never invokes them implicitly, and extracts static reference material from `init-repo`, `plan-repo`, and `update-practices` into `references/`.
- **Review policy wired into `reviewer` and `/repo-review`.** Both now read `REVIEW.md` directly and enforce its `[IMPORTANT|NIT]` format, concrete `Failure:` line, 3-nit cap, and exclusions.

## [0.28.1] - 2026-11-10

### Changed
- Restore LL-G and BP contributions through authenticated GitHub with atomic commits, privacy review, conflict protection, and commit-specific CI verification; remove Roundtable dependencies from agent guidance.

## [0.28.0] - 2026-11-03

### Added
- **After you push the default branch, Claude offers to clean up what it merged.** A new `PostToolUse` hook, `post-push-cleanup.sh`, runs after any push that moves `origin/<default>`. It lists the local branches now merged into it, the worktrees on those branches that have no uncommitted changes, and worktree entries whose directory is gone, then has Claude ask you once before removing anything. It never deletes anything itself, and the commands it suggests are `git worktree remove` and `git branch -d`, never `--force` or `-D`, so git still refuses to drop unmerged or modified work. It leaves alone locked worktrees, the worktree the session is working in, and any worktree with uncommitted changes, which it reports. It confirms the push from the `origin/<default>` reflog rather than trusting the command text, so a dry run, a rejected push or a push of another branch stays silent. It also catches `git -C <repo> push`, the form `/merge-worktrees` uses.

### Changed
- **The shared git-command parser can test for any subcommand.** `_git-commit-filter.sh` gains `is_git_subcommand` and `git_target_dir`. The commit hooks use them unchanged through `is_git_commit` and `commit_target_dir`, so a fix to the argv walk reaches every hook that relies on it.

## [0.27.0] - 2026-11-03

### Changed
- **`/dependency-audit` now audits GitHub Actions.** A new step checks every action the workflows use against its latest release (SHA pins are resolved to their real tag, and each action is checked against GitHub's advisory database, for an archived repo, and for a deprecated Node runtime), every `runs-on` label against GitHub's current runner images and their retirement dates, the tool versions workflows install against current releases and the repo's own pins, container images, and whether Dependabot covers `github-actions`. Self-hosted runners are listed for a manual version check.

## [0.26.1] - 2026-11-03

### Changed
- **The changelog follows Keep a Changelog 2.0.0, and so do new projects.** 2.0.0 keeps the 1.1.0 format, so only the header link moves and no entry is rewritten. The shipped commit rule, `init-repo` and `scripts/new-project.mjs` now write and describe 2.0.0, and the archive step follows its advice: past 100 KB, only releases older than 30 days move to `CHANGELOG-archive.md` (at least the 10 newest stay), and releases inside that window that had been archived are back in this changelog.

## [0.26.0] - 2026-11-03

### Added
- **Every version heading links to its changes.** Each release has a compare link at the bottom of its file, backed by a `vX.Y.Z` tag for every version with a changelog heading. A new `Tag versions` workflow (`.github/workflows/tag-versions.yml`) tags each version as it reaches `main`, so new links work without tagging by hand. It ships with the template: a repo made from it leaves the template's history untagged and tags its own releases from 0.0.1.
- **Older releases now live in `CHANGELOG-archive.md`.** With the links, CHANGELOG.md went past 100 KB. It now holds the newest releases (about 50 KB) and points to the archive, which holds the rest unchanged.

### Changed
- **The changelog follows Keep a Changelog 1.1.0.** An empty `## [Unreleased]` heading sits at the top, and the header says the project follows Semantic Versioning from 0.0.1 on. The 1.x releases used the earlier four-part version and stay listed after 0.0.1, where they belong by date: the version was reset to 0.0.1 when the project moved to SemVer.
- **The commit rule carries the standard to every repo that syncs it.** `.claude/rules/commit-changelog.md` adds Deprecated to the section types and allows only those six, each once per version, in that order. It keeps `[Unreleased]` on top with each commit's section directly below it, gives the heading format, says to add the new version's compare link, and says when to archive: past 100 KB, move the oldest releases to `CHANGELOG-archive.md` until CHANGELOG.md is under 50 KB, keeping at least the 10 newest. The changelog hooks' messages now say where the new section goes and list all six types.
- **A new project starts on the standard.** `scripts/new-project.mjs` and init-repo's changelog reset write the Semantic Versioning line, an empty `[Unreleased]` and, when the GitHub repo is known, the 0.0.1 links. Both also remove the template's `CHANGELOG-archive.md`.

## [0.25.0] - 2026-10-19

### Changed
- **`/add-lesson` and `/add-practice` publish through Roundtable.** Both skills now search for a duplicate with Roundtable's `kb_search`, then publish with `kb_propose` instead of committing to LL-G or BP `main` with `gh`. Roundtable refuses credentials, email addresses and IPs, refuses a duplicate slug, caps each agent at 10 proposals a day, writes the entry, its shelf index and the master count as one commit, and indexes it once that repository's CI passes. The direct `gh` path skipped all of that, and both repositories are public. Each skill also has a step to remove client names, internal hostnames and other details no scan can recognise.
- **`gh` is kept only for a new shelf or concern,** which `kb_propose` cannot create. That path still writes the entry, its new index and the master index line as one commit with `kb-commit.mjs`.
- **Without Roundtable the skills stop.** When the `roundtable` MCP tools are not available, the skills say how to set Roundtable up and do not fall back to `gh`.
- The artifact table in `CLAUDE.md` and the skill notes in `instructions.md` now say lessons are published by Roundtable's checks, not reviewed by a person.

## [0.24.0] - 2026-10-17

### Added
- **Tests for each way the hook decides,** in `scripts/advisory-hooks.test.mjs`. Every case runs with a temporary `HOME`, `XDG_CONFIG_HOME`, `CLAUDE_CONFIG_DIR` and `CODEX_HOME`, with no `GIT_*` variables, and with `RT_CONFIG`, `CLAUDE_PROJECT_DIR` and `CLAUDE_CODE_ENTRYPOINT` unset, so a real Roundtable install or git config on the machine cannot decide a result. The hook prints the two-line note, and not the full reminder, with a full install for Claude Code, and for Codex once the hook is trusted. It prints the full reminder in every other case tested: no install; only the credentials file; only the hook; the hook installed for the other client; a malformed hooks file; an untrusted, changed or disabled Codex hook; a missing or non-executable `rt`, or an executable `rt` that is not Roundtable's; a handler in a scoped group; an Agent SDK session; a client that cannot be identified; outside a git repository; and a jq that does not run. A stdin pipe left open returns in about 2 seconds. Every case exits 0. Each check was mutation-tested, and the suite also passes under bash 3.2.57.

### Changed
- **The session-start knowledge-base reminder defers to Roundtable.** Once `rt install claude --write` or `rt install codex --write` has added Roundtable's own SessionStart hook for the client you are using, `session-start-kb-check.sh` replaces its full reminder with a two-line note. The note says Roundtable's digest lists this repo's LL-G / BP lessons, that RULE 1 and RULE 3 still apply, and gives both `llms.txt` index URLs in case no digest appears. rt prints the digest, or the full LL-G / BP reminder itself whenever Roundtable is unreachable or misconfigured. Sessions no longer get the full reminder twice, or on top of the digest. The note is never silent, because rt can still print nothing, for example when it is killed at its 5-second hook timeout. Everywhere else the full reminder is unchanged.
- **It shortens the reminder only when it can confirm that rt's hook will run.** The client is the one whose config directory (`CLAUDE_CONFIG_DIR` or `~/.claude`, `CODEX_HOME` or `~/.codex`) holds the session's transcript, and a Claude Code session must also have `CLAUDE_PROJECT_DIR` set. That client's hooks file must be one valid JSON object with a SessionStart handler, in a group no matcher limits, that runs `rt hook <client> session_start`. That `rt` must be executable and must be Roundtable's: its first lines carry `# rt: Roundtable's command-line client`, the mark `rt doctor` checks for. rt's credentials file must exist where rt reads it (`RT_CONFIG`, else `~/.config/roundtable/env`; rt does not read `XDG_CONFIG_HOME`), and the session must be in a git repository, because rt prints nothing outside one. In Codex the hook must also be trusted in `/hooks` as it stands now: the script checks the hash in `config.toml` the same way `rt doctor codex` does, because Codex skips an untrusted, changed or disabled hook without a word. An Agent SDK session (`CLAUDE_CODE_ENTRYPOINT` starting with `sdk`) always gets the full reminder, since it can load project settings without user settings and so never run rt's hook. So does anything else that fails a check, including a jq that does not run. The script never calls `rt hook` itself, which would register a second checkpoint.
- **The hook no longer waits on an open stdin.** It reads the payload with a 2-second timed read, so a client that never closes the pipe cannot hold up the session start.
- **Nothing to re-approve.** `.claude/settings.json` and `.codex/hooks.json` are unchanged, so Codex keeps trusting the project hook. A synced repo gets the new script on its next "update practices" run.

## [0.23.0] - 2026-10-15

### Added
- **Builders check their own work before reporting done.** The builder agent now writes its pass conditions as real commands before it edits anything (for example `npm test exits 0`), then repeats change → run → fix until every one passes. "Looks right" and "no errors were raised" no longer count as done. After 3 failed rounds it stops and reports BLOCKED with a fixed five-line block: UNIT, VERDICT, REASON, EVIDENCE (file:line, expected vs actual), SCOPE. You get the failing evidence, not a fourth rewrite.
- **`/triage-issues` retries only the unit that failed.** When a fix passes on its own branch but fails verification after merging, the skill sends that one failure back to the builder that wrote it, using the five-line block, with an instruction to fix only that unit's files. Fixes that already passed are never re-dispatched. Each unit gets at most 3 correction rounds before it is reported as blocked with its last evidence. A merge conflict is still a hard stop.
- **Plan steps declare their files and dependencies.** Each implementation step in a `/spec-developer` plan now lists `Files:` (what the step may touch) and `Needs:` (the earlier step whose output it actually reads, or `none`). Steps with `Needs: none` and no shared files can go to parallel builders, rather than waiting in typing order.

### Fixed
- **`/triage-issues` builders keep their own worktree when agent teams is on.** This template enables agent teams, and a named Agent call then starts a teammate that ignores the builder's `isolation: worktree`, so parallel builders could share one checkout. The skill now passes `isolation: "worktree"` on every dispatch. A resumed builder also `cd`s into the worktree named in the retry message before it touches anything.

## [0.22.0] - 2026-10-11

### Added
- **New projects start at 0.0.1 with their own changelog.** A repo created from this template no longer inherits the template's `CHANGELOG.md` and `package.json` version. `node scripts/new-project.mjs`, now a step in the README's clone instructions, writes a fresh `CHANGELOG.md` with a single `0.0.1` entry. It sets `package.json` to `0.0.1` with the project's own name and an empty description, and keeps the scripts and `engines` that CI and the wiring guard need. Then it deletes itself.
- **"Use this template" does the reset automatically.** The new `template-cleanup` workflow runs the script on a generated repo's first push, commits the result, and then tries to delete itself. If GitHub refuses to let the workflow token delete a workflow file, the file stays but does nothing. The workflow never runs in this repo, in a fork of it, or in any repo marked as a template.
- **The reset only touches a fresh copy.** It acts only while `package.json` is still named `claude-code-bootstrap`, and refuses to run in the template or in a clone whose `origin` still points at it. `npm test` covers each refusal and checks that the workflow and the script name the same template repo.

### Changed
- **`init-repo` uses the same reset.** If a project skipped `new-project.mjs`, Step 15 runs it rather than judging the changelog by its contents. It also treats a changelog holding only the `0.0.1` baseline as already reset.

## [0.21.8] - 2026-10-11

### Removed
- **The AI code review workflow.** `claude-review.yml` no longer reviews each push and pull request against `REVIEW.md`, and the repo no longer needs an `ANTHROPIC_API_KEY` secret. `REVIEW.md` still sets the policy for reviews run in a session. Guard check 11 stays: it still catches a headless `claude` restricted by `--allowed-tools` alone in any workflow or script.
- **The scheduled security scan workflow.** `security-scan.yml` no longer runs every Monday. Run `/security-scan` when you need an audit. `update-practices` no longer copies the workflow into adopting repos, and leaves alone any repo that already has either workflow.

## [0.21.7] - 2026-10-08

### Changed
- **`/add-lesson` and `/add-practice` use the same `.agent-scratch/` directory** in place of `.kb-scratch/` (0.21.6), so the template has one scratch directory. They now delete only their own `llg-*`/`bp-*` files afterwards rather than the whole directory, because a commit message may be waiting in it.

### Fixed
- **Commit and merge messages have a working home when a session has no scratchpad.** `check-commit-herestring.sh`, `triage-issues` and `merge-worktrees` said only "the session scratchpad", which harnesses without one (Codex, plain `claude -p`) cannot follow. The obvious substitute, a `mktemp` file, is outside the working directory, where the Write tool is refused in `acceptEdits` mode and in non-interactive runs. They now name the fallback: `.agent-scratch/` at the repo root, created with a `.gitignore` of `*` so it ignores itself. It was checked with `claude -p --permission-mode acceptEdits`: the `mktemp` path was refused, and `.agent-scratch/` was written and stayed out of `git status`.

## [0.21.6] - 2026-10-08

### Fixed
- **`/add-lesson` and `/add-practice` can write their scratch files outside bypass mode.** Both staged the entry, index and master files in `.claude/kb-scratch/`, but Claude Code treats `.claude/` as a protected path: in `acceptEdits` mode and in non-interactive runs the Write tool is refused there ("a sensitive file"), so the skill stopped at its first write. Only `bypassPermissions` let it through. The scratch directory is now `.kb-scratch/` at the repo root, which is neither protected nor outside the working directory (a path outside it is refused the same way). It keeps the self-ignoring `.gitignore` of `*`, so nothing in it can be committed. Both locations were checked with `claude -p --permission-mode acceptEdits`: `.claude/kb-scratch/` was refused and `.kb-scratch/` was written.

## [0.21.5] - 2026-10-07

### Added
- **The wiring guard checks a forked skill's tools against its agent** (check 12). A skill with `context: fork` and `agent: X` runs with X's tools; its `allowed-tools` only pre-approves. The guard now fails when an `allowed-tools` entry is neither in X's `tools:` nor covered by the bare tool name there (`Bash` covers `Bash(du*)`). Agents with no `tools:` inherit everything and are skipped.
- **Tests for all of the above, in both directions:** grouped and keyword commits fire the gate while quoted text and `commit-tree` do not; each advisory hook's stdout parses as JSON with the right event name, and stays empty when the hook should be silent; `json_escape` round-trips backslashes, quotes and tabs; `gofmt` and `rustfmt` run for a module below the root but not for a file under no module or under one outside the repo. Every new check was mutation-tested.
- **Docs.** The hooks reference has a "Where hook output goes" section (the visibility rule, the JSON shape, exit 2 for blocking, `SessionStart` `source: "fork"`). CLAUDE.md, `instructions.md`, `REVIEW.md` and `update-practices` now say that advice on a tool event must be JSON and that a forked skill gets its agent's tools.

### Fixed
- **Advisory hooks now reach Claude.** On `PreToolUse` and `PostToolUse`, Claude Code sends a hook's plain stdout to the debug log; only `SessionStart`, `UserPromptSubmit`, `UserPromptExpansion` and `PostModelSwitch` show it to the model. The planning and pre-write knowledge-base reminders, the changelog reminder before a commit, the contribution prompt after one, and the release gate's "authorised by" note all printed plain text, so they ran on every call and were never read. Each now prints `hookSpecificOutput.additionalContext` JSON through a new pure-bash helper, `.claude/scripts/_hook-context.sh`, which Codex reads too. Blocking hooks are unchanged: exit 2 with the reason on stderr.
- **The changelog gate sees commits inside groups, keywords and wrappers.** `{ git commit -m x; }`, `if git commit ...; then`, `! git commit`, and commits behind `time`, `command`, `exec`, `nohup` or `env` were not recognised as commits, so the gate and its reminder never fired on them. The three command walkers (is it a commit, which repo does it target, does it carry `SKIP_CHANGELOG=1`) now share one predicate for these words, so a grouped `cd other-repo && git commit` is judged against the other repo, and a `SKIP_CHANGELOG=1` prefix inside a group still opts out. Quoted text and `git commit-tree` inside a group are still not commits.
- **Go and Rust files in a monorepo get formatted.** The format hook looked for `go.mod` and `Cargo.toml` only at the repo root, so a module below it (`services/api/go.mod`, `crates/core/Cargo.toml`) was never formatted. It now walks up from the edited file to the repo root, and still ignores a marker outside the repo.
- **`/performance-review` can run its measurements.** It told the `performance` agent to run `npm ls` and `du`, and pre-approved both, but the agent had no Bash, so those steps never ran. The agent now holds `Bash(npm ls*)` and `Bash(du*)`, and nothing broader.
- **The Codex section of `AGENTS.md` no longer says advisory hooks reach Claude but not Codex.** Neither runtime read their plain stdout; both read the JSON they print now.

## [0.21.4] - 2026-10-07

### Fixed
- **Hook matcher check matches Claude Code's real rules.** Check 3 rejected every matcher that was not a bare `|`-joined tool name, so valid matchers such as `mcp__memory__.*`, `Edit, Write`, `code-reviewer` and `"*"` failed the build. It now accepts exact-name lists and real regexes, and fails only on `Tool(pattern)` permission syntax (including inside a `|` list) and on a regex that does not compile. The hooks reference's matcher section now documents the official exact-versus-regex rules instead of "tool names only".
- **Commit-message guidance no longer points at `.git/`.** `check-commit-herestring.sh`, `triage-issues` and `merge-worktrees` said to write the message to `.git/CLAUDE_COMMIT_MSG.txt`, but the template's own `Edit(**/.git/**)` deny rule blocks the Write tool there. They now say to use a scratchpad file.
- **The release gate matches deploy subcommands as whole tokens.** It matched `*railway*up*` as a substring, and `up` is inside `backup`, `update`, `upgrade` and `upload`, so it blocked read-only commands like `railway postgres pitr backup list`. Subcommands are now compared token by token after the tool name, with a test file covering both directions.

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

### Added
- **The wiring guard fails a hook that calls its script by a cwd-relative path** (check 3d). Its existing missing-script check also understands the anchored form now; without that it would have quietly stopped checking every hook. `init-repo`, the hooks reference and CLAUDE.md say to anchor, and a new eval case (`hook-script-project-dir`) covers writing a new hook. A repo that picks this up through "update practices" fails the guard until its own repo-specific hooks are anchored as well.

### Fixed
- **Every hook stopped running as soon as the shell left the repo root.** `settings.json` called each script as `bash .claude/scripts/<name>.sh`, but a hook runs in the session's current directory, and that directory moves with every `cd`. From a subdirectory the path no longer resolved, the hook failed as a non-blocking "No such file or directory" error, and the tool call went through unchecked. Session transcripts from repos built on this template show about 6,700 such failures between July 30 and October 3, most of them in sessions working inside an app subfolder: the release-authorization gate did not run on 684 shell commands and the changelog gate on 909. All nine hooks now run as `bash "$CLAUDE_PROJECT_DIR"/.claude/scripts/<name>.sh`, which resolves from any directory.

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

### Changed
- **Nine eval cases rewritten to grade behaviour instead of recall.** Cases failed agents that had done the right thing but not recited a particular fact — `changelog-major-bump` identified the breaking change and stopped to ask, then failed for not adding that Major resets Minor and Patch to zero. Two more were unsatisfiable by construction: the harness allows only `Read,Glob,Grep`, so "routes to `/security-scan`" and "covers git history" could never pass. One graded the main session against a subagent's definition. All three anti-patterns are now written down in `.claude/evals/README.md`.
- **Timeouts report as `TIMEOUT` rather than a behavioural failure**, with the cap raised to 15 minutes and overridable via `EVAL_TIMEOUT_MS`.

### Fixed
- **The eval harness mutated the repository it was grading.** It ran cases under `--permission-mode plan`, which reads as the safer choice and is not: plan mode writes a plan artifact as a side effect, and the destination is not reliably controllable — a `--settings` override of `plansDirectory` was ignored in favour of `~/.claude/plans`. The first 24-case run left 7 plan files in `tasks/`. Read-only now comes from `--allowed-tools Read,Glob,Grep` alone, which is what was actually providing it; the claim that plan mode made the run read-only has been corrected in the runner and in `.claude/evals/README.md`.
- **The formatter hook's containment guard could be escaped by a symlink.** It resolved the edited file's *directory* and confirmed that was inside the repo — but an in-repo symlink pointing outside passes that check, and the formatter then wrote through it to the target. It now resolves the full path and formats the resolved path, so nothing downstream re-follows the link.
- **A single pass/fail verdict hid judge errors.** The judge reported that a correct answer addressed none of its three expectations; because nothing was retained, it could not be investigated. Verdicts are now per-expectation and every run writes the response and verdict to `.claude/evals/.transcripts/<id>.md` (git-ignored).

### Security
- **`Bash(git clone:*)` was pre-approved, which is arbitrary code execution.** Git's `ext::` transport runs a shell command as the transport (`git clone "ext::sh -c <cmd>"`), and `--upload-pack=` is a second route; the `:*` glob constrained neither. This mattered more than usual here because RULE 1 and RULE 3 push the agent to fetch and act on third-party markdown every session. The allow entry is now scoped to `https://github.com/*`, and both routes are denied outright — deny wins at every settings tier, so a looser local override cannot reopen them.
- **The live deny list was weaker than the one this repo publishes as its own managed-settings example.** With blanket `Read` allowed, any dotenv file or private key in a working tree was readable with no prompt. Added `Read(**/.env)`, `Read(**/.env.*)`, `Read(**/*.pem)`, `Read(**/*.key)`, `Read(**/*.p12)`, `Read(**/*.pfx)` and `Read(~/.gnupg/**)`.
- **The eval workflow installed the Claude Code CLI unpinned, in the one job that holds the API key.** Every GitHub Action in this repo is pinned to a commit SHA for exactly this reason; the npm install was the outlier. Pinned to `@anthropic-ai/claude-code@2.1.247`, to be bumped deliberately.

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

Older releases are in [CHANGELOG-archive.md](CHANGELOG-archive.md).

[Unreleased]: https://github.com/BoardPandas/claude-code-bootstrap/compare/v0.29.0...HEAD
[0.29.0]: https://github.com/BoardPandas/claude-code-bootstrap/compare/v0.28.1...v0.29.0
[0.28.1]: https://github.com/BoardPandas/claude-code-bootstrap/compare/v0.28.0...v0.28.1
[0.28.0]: https://github.com/BoardPandas/claude-code-bootstrap/compare/v0.27.0...v0.28.0
[0.27.0]: https://github.com/BoardPandas/claude-code-bootstrap/compare/v0.26.1...v0.27.0
[0.26.1]: https://github.com/BoardPandas/claude-code-bootstrap/compare/v0.26.0...v0.26.1
[0.26.0]: https://github.com/BoardPandas/claude-code-bootstrap/compare/v0.25.0...v0.26.0
[0.25.0]: https://github.com/BoardPandas/claude-code-bootstrap/compare/v0.24.0...v0.25.0
[0.24.0]: https://github.com/BoardPandas/claude-code-bootstrap/compare/v0.23.0...v0.24.0
[0.23.0]: https://github.com/BoardPandas/claude-code-bootstrap/compare/v0.22.0...v0.23.0
[0.22.0]: https://github.com/BoardPandas/claude-code-bootstrap/compare/v0.21.8...v0.22.0
[0.21.8]: https://github.com/BoardPandas/claude-code-bootstrap/compare/v0.21.7...v0.21.8
[0.21.7]: https://github.com/BoardPandas/claude-code-bootstrap/compare/v0.21.6...v0.21.7
[0.21.6]: https://github.com/BoardPandas/claude-code-bootstrap/compare/v0.21.5...v0.21.6
[0.21.5]: https://github.com/BoardPandas/claude-code-bootstrap/compare/v0.21.4...v0.21.5
[0.21.4]: https://github.com/BoardPandas/claude-code-bootstrap/compare/v0.21.3...v0.21.4
[0.21.3]: https://github.com/BoardPandas/claude-code-bootstrap/compare/v0.21.2...v0.21.3
[0.21.2]: https://github.com/BoardPandas/claude-code-bootstrap/compare/v0.21.1...v0.21.2
[0.21.1]: https://github.com/BoardPandas/claude-code-bootstrap/compare/v0.21.0...v0.21.1
[0.21.0]: https://github.com/BoardPandas/claude-code-bootstrap/compare/v0.20.5...v0.21.0
[0.20.5]: https://github.com/BoardPandas/claude-code-bootstrap/compare/v0.20.4...v0.20.5
[0.20.4]: https://github.com/BoardPandas/claude-code-bootstrap/compare/v0.20.3...v0.20.4
[0.20.3]: https://github.com/BoardPandas/claude-code-bootstrap/compare/v0.20.2...v0.20.3
[0.20.2]: https://github.com/BoardPandas/claude-code-bootstrap/compare/v0.20.1...v0.20.2
[0.20.1]: https://github.com/BoardPandas/claude-code-bootstrap/compare/v0.20.0...v0.20.1
[0.20.0]: https://github.com/BoardPandas/claude-code-bootstrap/compare/v0.19.0...v0.20.0
[0.19.0]: https://github.com/BoardPandas/claude-code-bootstrap/compare/v0.18.0...v0.19.0
[0.18.0]: https://github.com/BoardPandas/claude-code-bootstrap/compare/v0.17.0...v0.18.0
[0.17.0]: https://github.com/BoardPandas/claude-code-bootstrap/compare/v0.16.0...v0.17.0
[0.16.0]: https://github.com/BoardPandas/claude-code-bootstrap/compare/v0.15.0...v0.16.0
[0.15.0]: https://github.com/BoardPandas/claude-code-bootstrap/compare/v0.14.1...v0.15.0
[0.14.1]: https://github.com/BoardPandas/claude-code-bootstrap/compare/v0.14.0...v0.14.1
