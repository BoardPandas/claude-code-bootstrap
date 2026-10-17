#!/usr/bin/env bash
# SessionStart hook: surface the LL-G / BP knowledge-base mandate once per session.
#
# RULE 1 (LL-G) and RULE 3 (BP) in CLAUDE.md apply to "every session" -- but the
# pre-plan hook only fires in plan mode, and the path-scoped rules only load when a
# matching file is touched. This nudge guarantees the mandate is visible at the start
# of every session, including sessions that never enter plan mode.
#
# It defers to Roundtable's `rt` CLI. `rt install <client> --write` adds a user-level
# SessionStart hook that prints a digest carrying this repo's relevant LL-G / BP
# entries, and prints this same reminder itself whenever Roundtable is unreachable or
# misconfigured. So when this script can confirm that rt's hook will run for this
# session, it replaces the full reminder with a two-line note (print_deferred) that
# keeps the mandate and the two index URLs in view, in case rt prints nothing (killed
# at its hook timeout, say). On any doubt it prints the full reminder: no working jq,
# an unknown client, an Agent SDK session (CLAUDE_CODE_ENTRYPOINT sdk-*, which can load
# project settings without user settings, so rt's user-level hook may never run), an
# unreadable or malformed hooks file, an rt that is not Roundtable's, an untrusted
# Codex hook. It never runs `rt hook` itself: the user-level hook already does, and a
# second call would register a second checkpoint.
#
# Always exits 0 (advisory). Plain stdout is injected into the session as context
# here because this is SessionStart, one of the few events where that is true.
# Do not copy the pattern to a PreToolUse or PostToolUse hook: there plain stdout
# goes to the debug log, so use emit_context from _hook-context.sh instead.
#
# Bash 3.2 (macOS) and Git Bash (Codex's commandWindows) run this too: no bash 4
# features, files fed to jq on stdin (MSYS rewrites path arguments), fields joined
# with \u001f rather than @tsv (LL-G bash/jq-tsv-escapes-backslashes).

print_reminder() {
  cat <<'EOF'
=== KNOWLEDGE BASE CHECK (RULE 1 + RULE 3) ===

This session may involve scripting, automation, new features, or tooling/config work.
Before writing code or starting new work, consult the knowledge bases:

1. LL-G (Lessons Learned / Gotchas) -- what NOT to do:
   WebFetch https://raw.githubusercontent.com/BoardPandas/LL-G/main/llms.txt
   Then fetch kb/<tech>/llms.txt for each technology you will use.
   Read ALL HIGH-severity entries; read MEDIUM entries matching your task.

2. BP (Best Practices) -- what TO do:
   WebFetch https://raw.githubusercontent.com/BoardPandas/BP/main/llms.txt
   Then fetch practices/<concern>/llms.txt for each relevant concern.
   Load ALL FOUNDATIONAL entries; load RECOMMENDED entries matching the stack.

Skip only if this session is purely conversational or trivial. If you already
loaded the relevant entries earlier in this conversation, you need not re-fetch.
===
EOF
}

print_deferred() {
  printf '%s\n' \
    "=== KNOWLEDGE BASE: Roundtable's digest lists the LL-G / BP lessons for this repo; RULE 1 and RULE 3 still apply. ===" \
    "If no Roundtable digest appears, read the indexes: https://raw.githubusercontent.com/BoardPandas/LL-G/main/llms.txt and https://raw.githubusercontent.com/BoardPandas/BP/main/llms.txt"
}

# The line every Roundtable rt carries near its top (Roundtable cli/lib/guard.sh,
# RT_SIGNATURE), which rt doctor and the pre-commit guard check before trusting an rt.
RT_SIGNATURE="# rt: Roundtable's command-line client"

# A client's config directory, where rt install writes its hooks and the client keeps
# its transcripts. $1 is the override variable's value, $2 the default under $HOME.
config_dir() {
  local dir="${1:-${HOME:-}/$2}"
  printf '%s' "${dir%/}"
}

# Prints the 64-hex sha256 of $1, or fails.
sha256_hex() {
  local out
  out="$(printf '%s' "$1" | sha256sum 2>/dev/null)" ||
    out="$(printf '%s' "$1" | shasum -a 256 2>/dev/null)" || return 1
  out="${out%% *}"
  [ "${#out}" -eq 64 ] || return 1
  case "$out" in *[!0-9a-f]*) return 1 ;; esac
  printf '%s' "$out"
}

# Whether Codex trusts the hook at trust key $2, whose normalised identity is $3, in
# the config.toml under $1. Codex skips an untrusted, changed or disabled user hook
# without a word, so rt's hook being present is not enough. Codex records trust as
# [hooks.state."<hooks.json>:<event>:<group>:<handler>"] with the sha256 of the hook's
# canonical JSON; this is the check `rt doctor codex` makes.
codex_trusts() {
  local config="$1/config.toml" key="$2" identity="$3" table hash canonical want
  [ -f "$config" ] || return 1
  table="$(awk -v h="[hooks.state.\"$key\"]" '$0 == h { p = 1; next } /^[[:space:]]*\[/ { p = 0 } p' <"$config" 2>/dev/null)" || return 1
  hash="$(sed -n 's/^trusted_hash = "\(.*\)"$/\1/p' <<<"$table")"
  [ -n "$hash" ] || return 1
  if grep -q '^enabled = false' <<<"$table"; then return 1; fi
  canonical="$(jq -cS . <<<"$identity" 2>/dev/null)" || return 1
  want="$(sha256_hex "$canonical")" || return 1
  [ "$hash" = "sha256:$want" ]
}

# Each rt SessionStart handler for client $1 in the hooks JSON on stdin, one line each:
# group index, handler index, the rt it runs, and its identity as Codex hashes it
# (codex-rs/hooks discovery.rs, as rt doctor reproduces it). rt's own handler is a
# command ending in `rt hook <client> session_start` (rt install's RT_JQ_MINE), in a
# group no matcher scopes to some sources only. Fails, printing nothing, unless stdin
# is exactly one JSON object in the shape the client reads, as the client would refuse
# the whole file and run none of its hooks.
# shellcheck disable=SC2016  # jq's variables, not the shell's.
rt_handlers() {
  jq -rs --arg client "$1" '
    def unscoped: (.matcher | type) != "string" or .matcher == "" or .matcher == "*";
    def mine: type == "object" and .type == "command" and (.async // false) == false
      and (.command | type) == "string"
      and (.command | test("(^|/)rt\\x27?\\s+hook\\s+" + $client + "\\s+session_start\\s*$"));
    def rtpath: (.command | capture("^(\\x27(?<q>[^\\x27]*)\\x27|(?<b>[^\\s]+))\\s+hook\\s") | .q // .b) // "";
    def identity($group):
      {event_name: "session_start"}
      + ($group | if (.matcher | type) == "string" then {matcher} else {} end)
      + {hooks: [{type: "command", command, timeout: ((.timeout // 600) | if . < 1 then 1 else . end),
            async: (.async // false)}
          + (if (.statusMessage | type) == "string" then {statusMessage} else {} end)
          + (if (.additionalContextLimit | type) == "number" and .additionalContextLimit != 2500
              then {additionalContextLimit} else {} end)]};
    if length != 1 or (.[0] | type) != "object" then error("not one object") else .[0] end
    | (.hooks.SessionStart // [] | if type == "array" then . else error("not an array") end)
    | to_entries[] as $g
    | select($g.value | type == "object" and unscoped)
    | ($g.value.hooks // [] | if type == "array" then . else [] end) | to_entries[]
    | select(.value | mine)
    | [$g.key, .key, (.value | rtpath), (.value | identity($g.value) | tojson)]
    | map(tostring) | join("\u001f")'
}

# Succeeds only when rt's own SessionStart hook will run for this session, for the
# client running this script. The payload is the hook's stdin, in $1.
rt_hook_will_run() {
  local payload="$1" fields transcript cwd session_id claude_home codex_home
  local client hooks_file handlers group handler rt identity top

  # An Agent SDK run can load project settings without user settings, so rt's
  # user-level hook may not run at all.
  case "${CLAUDE_CODE_ENTRYPOINT:-}" in sdk*) return 1 ;; esac

  # A missing jq, or a stub that resolves but never runs (LL-G
  # bash/command-v-finds-nonexecuting-stub), leaves no fields, so the reminder prints.
  fields="$(jq -r 'select(type == "object") | [.transcript_path, .cwd, .session_id]
    | select(all(type == "string")) | join("\u001f")' 2>/dev/null <<<"$payload")" || return 1
  IFS=$'\x1f' read -r transcript cwd session_id <<<"$fields"
  [ -n "$transcript" ] && [ -n "$cwd" ] && [ -n "$session_id" ] || return 1

  # Which client: the one whose config directory holds this session's transcript,
  # which is also the directory whose hooks file rt install writes. A CLAUDE_* variable
  # alone proves nothing, since Codex sets CLAUDE_PLUGIN_ROOT for plugin hooks; Claude
  # Code must also have set CLAUDE_PROJECT_DIR, as it does for every hook.
  claude_home="$(config_dir "${CLAUDE_CONFIG_DIR:-}" .claude)"
  codex_home="$(config_dir "${CODEX_HOME:-}" .codex)"
  case "$transcript" in
    "$claude_home"/projects/*)
      [ -n "${CLAUDE_PROJECT_DIR:-}" ] || return 1
      client=claude
      hooks_file="$claude_home/settings.json"
      ;;
    "$codex_home"/sessions/*)
      client=codex
      hooks_file="$codex_home/hooks.json"
      ;;
    *) return 1 ;;
  esac

  # rt says nothing outside a git repository, so this must not either.
  git -C "$cwd" rev-parse --show-toplevel >/dev/null 2>&1 || return 1

  # rt's credentials file, where rt reads it (RT_CONFIG, else this path; not
  # XDG_CONFIG_HOME). Bad modes or credentials make rt print the reminder itself.
  [ -f "${RT_CONFIG:-${HOME:-}/.config/roundtable/env}" ] || return 1

  [ -f "$hooks_file" ] && [ -r "$hooks_file" ] || return 1
  handlers="$(rt_handlers "$client" <"$hooks_file" 2>/dev/null)" || return 1

  while IFS=$'\x1f' read -r group handler rt identity; do
    [ -n "$rt" ] || continue
    case "$rt" in
      */*) ;;
      *) rt="$(command -v "$rt" 2>/dev/null)" || continue ;;
    esac
    [ -f "$rt" ] && [ -x "$rt" ] || continue
    # Roundtable's rt, not some other program of that name (Request Tracker ships one).
    top="$(sed -n '1,10p' "$rt" 2>/dev/null)"
    grep -q "^$RT_SIGNATURE" <<<"$top" || continue
    if [ "$client" = claude ]; then return 0; fi
    if codex_trusts "$codex_home" "$hooks_file:session_start:$group:$handler" "$identity"; then
      return 0
    fi
  done <<<"$handlers"
  return 1
}

# Bounded, so a client that never closes stdin cannot hold the session start. read
# returns non-zero at EOF (no NUL arrives) and on timeout; either way the payload is
# what arrived, and anything incomplete fails to parse and prints the full reminder.
payload=""
if [ ! -t 0 ]; then IFS= read -r -d '' -t 2 payload 2>/dev/null; fi

if rt_hook_will_run "$payload"; then
  print_deferred
else
  print_reminder
fi
exit 0
