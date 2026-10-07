# Hooks & Settings Reference

Canonical catalog of Claude Code hook events, hook types, matcher syntax, and
`settings.json` options. The `init-repo` and `update-practices` skills both point
here so this list is maintained in exactly one place (it used to be duplicated in
both skills, which let the two copies drift).

> Verify against the current Claude Code release when you use this. The event and
> settings catalogs grow over time; fetch the official docs (see
> `.claude/references/source-urls.md`) and add anything new here rather than into
> a skill body.

## Hook events

| Event | Fires When | Use Cases |
|-------|-----------|-----------|
| **SessionStart** | When a new session begins | Welcome message, status check, re-inject context after compaction (matcher: `compact`) |
| **SessionEnd** | When a session ends | Save state, create handoff doc |
| **UserPromptSubmit** | When user submits a prompt | Input validation, prompt logging |
| **UserPromptExpansion** | When a slash command expands | Inspect/rewrite expanded command, block disallowed commands |
| **PreToolUse** | Before any tool call | Validate tool args, block dangerous commands, log activity |
| **PostToolUse** | After any tool call completes | Post-processing, validation of results, auto-lint |
| **PostToolUseFailure** | When a tool call fails | Error logging, fallback actions, retry logic |
| **PostToolBatch** | After a parallel tool batch resolves | Aggregate batch results, enforce post-batch invariants, block |
| **PermissionRequest** | When a tool requests permission | Auto-approve safe reads, log permission decisions |
| **PermissionDenied** | When a permission request is denied | Audit logging, suggest alternative paths |
| **SubagentStart** | When a subagent launches | Log subagent activity, resource tracking |
| **SubagentStop** | When a subagent completes | Aggregate results, trigger follow-up tasks |
| **Stop** | When Claude finishes a response | Notification sounds, auto-formatting, status updates |
| **StopFailure** | When a turn ends due to an API error | Error alerting, failure logging |
| **Notification** | When Claude sends a notification, including background-agent events (`agent_needs_input`, `agent_completed`) | Alert sounds, desktop notifications, webhook pings |
| **MessageDisplay** | As assistant message text is displayed | Transform or hide message text, redact secrets in output |
| **PreCompact** | Before context compaction (matcher: `manual` or `auto`) | Save important state, create summaries |
| **PostCompact** | After context compaction completes | Re-inject context, verify state |
| **TeammateIdle** | When a teammate agent is idle | Coordination, load balancing |
| **TaskCreated** | When a background task is created | Task tracking, resource planning |
| **TaskCompleted** | When a background task completes | Status updates, follow-up actions |
| **InstructionsLoaded** | When a CLAUDE.md or rules file loads | Audit logging, rule tracking |
| **ConfigChange** | When settings or skill files change | Audit logging, reload triggers |
| **WorktreeCreate** | When an isolated worktree is created | Setup worktree-specific config |
| **WorktreeRemove** | When a worktree is cleaned up | Cleanup, merge results |
| **CwdChanged** | When the working directory changes | Reload directory-scoped config |
| **FileChanged** | When a watched file changes on disk | Reload triggers, external-edit detection |
| **Elicitation** | When an MCP server requests structured input | Auto-fill known values, log requests |
| **ElicitationResult** | After an MCP elicitation is answered | Post-process structured input |
| **Setup** | On `--init`, `--init-only`, or `--maintenance` flags | One-time project setup, maintenance tasks |

## Hook types

1. **Command hooks**: `{ "type": "command", "command": "..." }` — Runs a shell command. Exit code 0 = allow, 2 = block (PreToolUse), non-zero = error. The command runs in the session's current directory, which moves with every `cd`, so call project scripts as `bash "$CLAUDE_PROJECT_DIR"/.claude/scripts/<name>.sh`. A cwd-relative `bash .claude/scripts/<name>.sh` fails from any subdirectory, and the hook silently does not run.
2. **HTTP hooks**: `{ "type": "http", "url": "https://..." }` — Sends an HTTP POST to a URL. The request body contains the event payload. Requires the URL to be listed in `settings.json` under `allowedHttpHookUrls`. Supports custom headers with env-var interpolation, e.g. `"headers": { "Authorization": "Bearer ${MY_WEBHOOK_TOKEN}" }`.
3. **Prompt hooks**: `{ "type": "prompt", "prompt": "..." }` — Single-turn LLM judgment (yes/no decision). Useful for validation gates.
4. **Agent hooks**: `{ "type": "agent", "prompt": "..." }` — Multi-turn subagent with tool access. Useful for complex validation or post-processing. Not accepted on `PermissionRequest` since v2.1.280 (its answer could never allow or deny); there it errors, so use a command or http hook.
5. **MCP tool hooks**: `{ "type": "mcp_tool", "tool": "...", "arguments": {...} }` — Directly invokes an MCP tool as the hook action. Useful for posting to integrated services without a shell.

Any hook entry accepts an optional `if:` field using permission-rule syntax (e.g., `Bash(git *)`) so the hook fires only on matching tool calls — reduces overhead on unrelated calls.

## Hook output capabilities

Hooks can return structured output (`hookSpecificOutput`) to influence the session, not just allow/block:

- **PostToolUse** — `hookSpecificOutput.updatedToolOutput` rewrites the tool's output for ANY tool before Claude sees it (redaction, normalization, annotation).
- **Stop / SubagentStop** — `hookSpecificOutput.additionalContext` feeds text back and continues the turn instead of ending it (self-review loops, "did you run the tests?" nudges).
- **SessionStart** — `reloadSkills: true` rescans skill directories mid-session; `hookSpecificOutput.sessionTitle` sets the session title.

## Matcher syntax

How a `matcher` is read depends on its characters (official: code.claude.com/docs/en/hooks#matcher-patterns):

- **Omitted, `""` or `"*"`**: every occurrence of the event.
- **Only letters, digits, `_`, `-`, spaces, `,` and `|`**: exact names, alone or as a `|`/`,` list: `Bash`, `Write|Edit`, `Edit, Write`, `code-reviewer`. Prefer this form. (`FileChanged` and `StopFailure` accept only letters, digits, `_` and `|` here.)
- **Any other character**: an *unanchored* JavaScript regex. `mcp__memory__.*` matches every tool on that server; `Edit.*` also matches `NotebookEdit`, so anchor with `^...$` for a whole-name match. An MCP server prefix needs the `.*`: bare `mcp__memory` is an exact name and matches no tool.
- Non-tool events match on their own values, e.g. `SessionStart` on `startup|resume|clear|compact`, `SubagentStop` on the agent type.
- Permission-rule syntax such as `Bash(git commit*)` or `Write(*)` in a matcher is a regex that matches no tool name, so the hook silently never runs. `npm run check:claude` fails on it, and on a regex that does not compile.
- Filter on a tool's arguments with `if:` on the handler, which takes permission-rule syntax: `matcher: "Bash"` plus `if: "Bash(git commit*)"`, or `matcher: "Edit"` plus `if: "Edit(src/**)"`. `if:` names each tool itself, so a Write call needs its own `Write(src/**)` handler.
- `if:` fires conservatively on commands it cannot read (substitutions, `bash -c`), so a script that must act only on one command also checks `tool_input.command` itself. LL-G `claude-code/hook-matcher-tool-names-only`.
- Call a script by `bash "$CLAUDE_PROJECT_DIR"/.claude/scripts/<name>.sh`, never a cwd-relative path (see Hook types above).
- Deny and ask permission rules also accept `Tool(param:value)`, e.g. `Agent(model:opus)` for Agent calls that request Opus. That is permission syntax, so it never goes in a `matcher`.

## Plugin mod hooks are a different system

Since v2.1.287, plugins can ship "Claude Mods": a JavaScript hooks module with dotted
events such as `tool.check`, `tool.call`, `prompt.submit`, `turn.step` and `agent.spawn`.
These are not `settings.json` hooks. They never go in `.claude/settings.json`, the
matcher and `if:` rules above do not apply to them, and the wiring guard does not check
them. Write them inside a plugin, using the built-in `plugin-authoring` skill, and check
them with `claude plugin validate` and `claude plugin test`. Everything else in this file
is about `settings.json` hooks.

## Hook behavior changes (v2.1.201 to v2.1.292)

Verified against the official changelog. Each one changes what a hook in this config can rely on.

- **PreToolUse and PermissionRequest now fail closed** (v2.1.288). When matching a hook fails, or the tool input cannot be serialized to JSON, the call is blocked. Before, the hook was skipped and the call ran.
- **Rewritten input is re-checked** (v2.1.290). Permission rules and safety checks now apply to a tool call after a PreToolUse hook rewrites its input.
- **`<system-reminder>` tags in hook output are escaped** before they reach Claude (v2.1.292). A hook cannot use them to inject instructions.
- **Path-scoped rules and nested CLAUDE.md load on Write and Edit** (v2.1.288). Before, only Read loaded them, so a rule never applied to a file Claude created.
- **InstructionsLoaded reports `agent_id` and `agent_type`** when a subagent's file access loads a rule or nested CLAUDE.md (v2.1.288).
- **SubagentStop matchers no longer fire for subagents with an empty agent type** (v2.1.275).
- **`mcp_tool` hooks on blocking events wait for their MCP server** to connect, up to the connect timeout (v2.1.281). Before, they were skipped while it connected.
- **Elicitation and ElicitationResult honor `{"decision":"block"}`** (v2.1.284), the same as exit code 2.
- **Hooks declared in agent frontmatter need workspace trust** for the agent file's folder (v2.1.218).

## Hooks to configure based on project needs

**Always configure:**
- `SessionStart` — surface the LL-G / BP knowledge-base reminder once per session
- `PreToolUse` on `Bash` with `if: "Bash(git commit*)"` — validation before commits
- `Stop` — notification sound (use `printf '\a'`, not `echo '\a'` — `echo` prints a literal `\a` in most shells)
- `Notification` — notification sound

**Recommended for active development:**
- `PostToolUse` on `Write|Edit` — auto-lint after file changes (if a linter is configured); the script reads the path from `tool_input.file_path`
- `PreToolUse` on `Bash` with `if: "Bash(rm -rf*)"` — block dangerous deletes; the script still checks the command itself, heredoc bodies fed to a shell included (LL-G `claude-code/delete-gate-cannot-skip-heredoc-bodies`)
- `SubagentStop` — notification when long-running subagents complete

**Recommended for team projects using HTTP hooks:**
- `Stop` with HTTP hook — ping team webhook (Slack, Discord) when Claude finishes a task
- `StopFailure` with HTTP hook — send error reports to monitoring

**Cost/friction saver:**
- `PermissionRequest` with a `prompt` hook — route the permission decision to a single-turn LLM judge that auto-approves known-safe operations (read-only commands, project-local writes) and defers everything else to the user. Cuts prompt fatigue without widening the static allow list.

Ask the user which additional hooks they want before configuring beyond the defaults.

## settings.json core settings (always configure)

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "permissions": {
    "allow": ["Read", "Glob", "Grep", "WebFetch", "WebSearch"],
    "deny": [
      "Read(~/.ssh/**)",
      "Read(~/.aws/**)",
      "Read(~/.azure/**)",
      "Read(~/.kube/**)",
      "Read(~/.docker/config.json)",
      "Read(~/.npmrc)",
      "Read(~/.git-credentials)",
      "Read(~/.config/gh/**)",
      "Edit(~/.bashrc)",
      "Edit(~/.zshrc)",
      "Edit(~/.profile)"
    ]
  },
  "env": { "ENABLE_TOOL_SEARCH": "true" },
  "plansDirectory": "tasks",
  "hooks": { }
}
```

## Optional settings

| Setting | Purpose | When to enable |
|---------|---------|---------------|
| `attribution.commit` | Add "Generated by Claude Code" to commit messages | Team projects for audit trail |
| `attribution.pr` | Add Claude attribution to PR descriptions | Team projects for transparency |
| `autoUpdatesChannel` | `"stable"` or `"preview"` for Claude Code updates | `"stable"` for production repos, `"preview"` for template/experimental repos |
| `sandbox.permissions` | Sandboxed execution permissions for tools | When running untrusted code analysis |
| `sandbox.network` | Network access restrictions in sandbox | Security-sensitive projects |
| `worktree.bgIsolation` | `"none"` lets background sessions edit the working copy directly instead of an isolated worktree | Background-agent workflows that should not branch |
| `worktree.baseRef` | `"fresh"` branches worktrees from `origin/<default>`, `"head"` from local `HEAD` | Control where isolated worktrees branch from |
| `language` | Preferred response language (e.g., `"en"`, `"ja"`) | Non-English teams |
| `allowedHttpHookUrls` | Allowlist of URLs for HTTP hooks | When using HTTP hooks for webhooks |
| `alwaysThinkingEnabled` | Always use extended thinking | Complex codebases that benefit from deeper reasoning |
| `disableAllHooks` | Kill switch for all hooks | For `settings.local.json` — lets individuals disable hooks locally |
| `defaultMode` | Default permission mode. Note: the value `"default"` was renamed to `"manual"` in v2.1.200, and Manual is now the out-of-box default | Set explicitly if the team wants `acceptEdits`/`plan` as the session default |
| `fallbackModel` | Fallback model(s) when the primary is unavailable — now accepts a list of up to 3 | Resilience for CI/automation sessions |
| `enforceAvailableModels` | Restrict which models sessions may select | Org cost-control or compliance |
| `disableBundledSkills` | Turn off Claude Code's built-in bundled skills | When bundled skills collide with project skills |
| `requiresMinimumVersion` / `requiredMaximumVersion` | Pin the Claude Code version range for the repo | Teams that need reproducible harness behavior |
| `attribution.sessionUrl` | Include the session URL in attribution output | Audit trails that link commits back to sessions |
| `autoMode.classifyAllShell` / `autoMode.idleTimeout` | Tune auto-mode shell classification and idle behavior | Heavy auto-mode users |
| `attribution: false` | Hide all commit and PR attribution (v2.1.281) | Personal settings only. CLI versions older than 2.1.281 skip a settings file containing it, so keep the object form in any file shared across versions |
| `maxProseWidth` | Cap the width of Claude's prose in wide terminals; tables and code keep full width (v2.1.282) | Personal preference, so `settings.local.json` |
| `allowedProviders` | Managed only: limit which API providers a machine may use (v2.1.285) | Org policy |
| `deniedModels` / `availableModelsMatch: "exact"` | Managed only: block specific models; with `"exact"`, an `availableModels` entry allows only the version it names (v2.1.283) | Org policy that must not auto-admit new model releases |

Env levers worth knowing: `ENABLE_TOOL_SEARCH` (lazy-load MCP tool schemas; also accepts `auto:N`) and `ENABLE_PROMPT_CACHING_1H` (opt into the 1-hour prompt-cache TTL for long sessions). `CLAUDE_CODE_DISABLE_STRUCTURED_OUTPUTS` (v2.1.288) is for gateways that reject structured outputs. `CLAUDE_CODE_DISABLE_1M_CONTEXT=1` (v2.1.287) keeps the 200K window on Bedrock, Vertex, Foundry and the Claude apps gateway, where 1M became the default; this template deliberately does not set it.

Removed or restricted: the `taskOutputMaxChars` setting and `TASK_MAX_OUTPUT_LENGTH` do nothing since the TaskOutput tool was removed (v2.1.277). A repository's `.claude/settings.json` or `settings.local.json` can no longer set `CLAUDE_CODE_DISABLE_ATTACHMENTS` (v2.1.292) or turn on Claude in Chrome; use user or managed settings. Niche display settings (`wheelScrollAccelerationEnabled`, `footerLinksRegexes`, `respondToBashCommands`, `pluginSuggestionMarketplaces`, `allowAllClaudeAiMcps`) exist but rarely belong in a shared template.

Security note (v2.1.196): MCP servers declared in a committed `.claude/settings.json` / `.mcp.json` no longer auto-spawn without user approval — do not design workflows that assume a cloned repo's MCP servers start automatically.

## settings.json vs settings.local.json

- **`.claude/settings.json`** — Version-controlled, shared team settings. Put everything the team agrees on here.
- **`.claude/settings.local.json`** — Git-ignored, personal overrides. Document this in instructions.md so developers know they can create it.

Full precedence chain (highest wins): `managed-settings.json` (MDM/org policy) > CLI flags > `.claude/settings.local.json` > `.claude/settings.json` > `~/.claude/settings.local.json` > `~/.claude/settings.json`. Deny permission rules always win regardless of tier. Any setting can also be set inline with `/config key=value`.

Recommended `.claude/settings.local.json.example` showing common personal overrides:
```json
{
  "disableAllHooks": false,
  "alwaysThinkingEnabled": true,
  "language": "en"
}
```
