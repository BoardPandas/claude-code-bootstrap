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
  HOOK_COMMAND=""

  if command -v python3 >/dev/null 2>&1; then
    HOOK_COMMAND=$(printf '%s' "$HOOK_INPUT" | python3 -c 'import sys, json
try:
    print(json.load(sys.stdin).get("tool_input", {}).get("command", ""))
except Exception:
    print("")' 2>/dev/null)
  else
    # Degraded path: no python3. Fall back to the whole payload, which is
    # over-eager but never under-eager -- a blocking hook must not go quiet
    # just because a parser is missing.
    HOOK_COMMAND="$HOOK_INPUT"
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
