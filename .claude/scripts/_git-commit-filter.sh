#!/usr/bin/env bash
# Shared self-filter for the git-commit hooks. Source it, do not execute it:
#
#   . "$(dirname "$0")/_git-commit-filter.sh"
#   read_hook_input                 # sets HOOK_COMMAND from stdin
#   is_git_commit || exit 0
#
# Why this exists as a helper rather than four copies: the four commit hooks had
# four slightly different inline filters, and the one that drifted (a missing
# ">&2") went unnoticed for months. One definition, one place to fix.

# JSON extraction lives in _json-parser.sh for the same reason, one level down.
. "$(dirname "${BASH_SOURCE[0]}")/_json-parser.sh"

# Reads the hook's JSON payload from stdin and sets:
#   HOOK_INPUT    raw payload (kept for callers that need the unparsed text)
#   HOOK_COMMAND  tool_input.command only
#
# Scanning tool_input.command rather than the whole payload matters: a PostToolUse
# payload also carries tool_response, so a command whose OUTPUT merely mentions
# "git commit" would otherwise trip the filter.
# (LL-G kb/bash/hook-scans-tool-output-false-record.md)
read_hook_input() {
  HOOK_INPUT=$(cat)
  HOOK_COMMAND=$(json_field "$HOOK_INPUT" tool_input.command)

  # Degraded path: no working parser, or a parser that returned nothing for a
  # payload that clearly carries a command. Recover the command from the raw
  # text -- over-eager, but a blocking hook must not go quiet just because a
  # parser is missing.
  #
  # json_field_flat is deliberately NOT used: it stops at the first quote, so
  # `echo "hi" && git commit` truncates to `echo ` and the gate stops blocking.
  # Under-eager is the one direction this hook cannot afford.
  #
  # Handing over the whole payload -- what this did before -- is not a fallback
  # either. is_git_commit strips quoted regions, and in raw JSON the command IS
  # a quoted region, so it strips to nothing and never matches. That fallback
  # was itself dead; it just had no way to show it while the parser branch was
  # also dead.
  if [ -z "$HOOK_COMMAND" ]; then
    HOOK_COMMAND=$(json_field_greedy "$HOOK_INPUT" command)
  fi
}

# True when HOOK_COMMAND actually invokes `git commit`.
#
# Quoted regions are stripped before matching so a command that only MENTIONS
# the phrase is not treated as a commit:
#   grep -r 'git commit' docs/          -> not a commit  (was blocked before)
#   git add CHANGELOG.md && git commit  -> is a commit
#   git commit -m "mentions git commit" -> is a commit
is_git_commit() {
  local stripped
  stripped=$(printf '%s' "$HOOK_COMMAND" | sed -e "s/'[^']*'//g" -e 's/"[^"]*"//g')
  printf '%s' "$stripped" | grep -qE '(^|[;&|(]|&&|\|\|)[[:space:]]*([A-Za-z_][A-Za-z0-9_]*=[^[:space:]]*[[:space:]]+)*git[[:space:]]+commit\b'
}

# Commits that legitimately carry no changelog entry.
is_changelog_exempt() {
  # Merge commits: the merged branches carry their own entries.
  if git rev-parse -q --verify MERGE_HEAD >/dev/null 2>&1; then
    return 0
  fi
  # Explicit opt-out for reverts, hotfixes, genuinely trivial commits.
  if [ "${SKIP_CHANGELOG:-}" = "1" ]; then
    return 0
  fi
  return 1
}

# True when CHANGELOG.md is already staged, or when this very command stages it.
# The hook fires BEFORE the command runs, so a compound
# "git add CHANGELOG.md && git commit ..." has not staged it yet.
changelog_is_handled() {
  if printf '%s' "$HOOK_COMMAND" | grep -qE 'git add [^&|;]*CHANGELOG\.md'; then
    return 0
  fi
  git diff --cached --name-only 2>/dev/null | grep -q '^CHANGELOG\.md$'
}
