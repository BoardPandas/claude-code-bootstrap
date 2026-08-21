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
#   git commit -m "mentions git commit"     -> is a commit
#   git add CHANGELOG.md && git commit      -> is a commit
#   git -C /other/repo commit               -> is a commit
#   GIT_AUTHOR_NAME=x git commit            -> is a commit
#   grep -r 'git commit' docs/              -> not a commit
#   git config --get commit.gpgsign         -> not a commit
#   echo git commit                         -> not a commit
#
# This walks the token stream rather than matching a regex, because a regex
# fails in both directions at once and cannot be tuned out of it. Tight enough
# to require `git` immediately followed by `commit` misses `git -C /repo commit`,
# since git's global flags sit between the two -- and a missed commit means the
# gate silently does not fire, the worst outcome available. Loosening it to
# allow arbitrary tokens in between starts blocking `git log --grep=commit` and
# `git config --get commit.gpgsign`. The walk gets both right by modelling what
# git's argv actually looks like.
# (LL-G kb/claude-code/hook-git-commit-filter-needs-argv-walk.md)
is_git_commit() {
  local normalized tok state result restore_glob

  # Quoted regions collapse to ONE opaque token rather than being deleted.
  # Deleting them looks equivalent and is not: `git -C "/path with space" commit`
  # would become `git -C  commit`, and the -C would then swallow the word
  # `commit` as its own value -- a commit that reports itself as not a commit.
  #
  # Newlines become separators, so the second line of a two-line script is still
  # a command position.
  normalized=$(printf '%s' "$HOOK_COMMAND" \
    | sed -e "s/'[^']*'/__CCQ__/g" -e 's/"[^"]*"/__CCQ__/g' \
    | tr '\n' ';' \
    | sed -e 's/[;&|()][;&|()]*/ ; /g')

  # Unquoted word splitting below would otherwise glob-expand a token like `*`
  # against the working directory.
  restore_glob=0
  case $- in
    *f*) ;;
    *)   restore_glob=1; set -f ;;
  esac

  # cmd   -- next token starts a command
  # flags -- inside git's global flags, still looking for the subcommand
  # skip  -- this token is the value of the flag before it
  # args  -- inside some other command's arguments; nothing here is a commit
  state=cmd
  result=1
  for tok in $normalized; do
    if [ "$state" = skip ]; then state=flags; continue; fi
    if [ "$tok" = ";" ]; then state=cmd; continue; fi
    case "$state" in
      cmd)
        case "$tok" in
          *=*)                         ;;  # env assignment prefix; still at a command position
          git|git.exe|*/git|*/git.exe) state=flags ;;
          *)                           state=args ;;
        esac
        ;;
      flags)
        case "$tok" in
          # Global flags that consume the NEXT token as their value. Missing one
          # here means its value gets read as the subcommand, and the gate stops
          # firing for every command that uses it.
          -C|-c|--git-dir|--work-tree|--namespace) state=skip ;;
          commit)                                  result=0; break ;;
          -*)                                      ;;  # self-contained flag, incl. --git-dir=x
          *)                                       state=args ;;  # some other subcommand
        esac
        ;;
    esac
  done

  [ "$restore_glob" = 1 ] && set +f
  return "$result"
}

# Anchors every subsequent git call to the repo root, so a commit issued from a
# subdirectory is judged against the same tree as one issued from the top.
#
# NOTE: this anchors to the SESSION's repo. `git -C /other/repo commit` and
# `cd /other/repo && git commit` retarget the command but not the hook, so a
# cross-repo commit is still judged against the wrong tree.
# (LL-G kb/claude-code/hook-cwd-is-not-the-commit-target-repo.md)
anchor_to_repo_root() {
  local root
  root=$(git rev-parse --show-toplevel 2>/dev/null) || return 1
  cd "$root" || return 1
}

# Commits that legitimately carry no changelog entry.
is_changelog_exempt() {
  # Merge commits: the merged branches carry their own entries.
  if git rev-parse -q --verify MERGE_HEAD >/dev/null 2>&1; then
    return 0
  fi
  # --amend rewrites a commit that already carried its entry.
  if printf '%s' "$HOOK_COMMAND" | grep -qE 'git[[:space:]]+commit[^&|;]*--amend'; then
    return 0
  fi
  # The initial commit has no HEAD to diff against.
  if ! git rev-parse -q --verify HEAD >/dev/null 2>&1; then
    return 0
  fi
  # Explicit opt-out for reverts, hotfixes, genuinely trivial commits.
  if [ "${SKIP_CHANGELOG:-}" = "1" ]; then
    return 0
  fi
  return 1
}

# Reads the "version" field out of package.json content on stdin.
read_version() {
  sed -n 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1
}

# The version this commit is shipping, per the working tree. Empty when the repo
# has no package.json -- the template is cloned into non-Node repos too, and a
# gate that blocks every commit there is a gate people rip out.
current_version() {
  [ -f package.json ] || return 0
  read_version < package.json
}

# ---------------------------------------------------------------------------
# The three checks below test STATE and CONSEQUENCE, never the command's text.
#
# A PreToolUse hook fires BEFORE the command runs, so the tempting shortcut is to
# accept any command that *says* it stages the changelog. That is a gate on
# intent, and intent is satisfiable without doing the thing: `git add CHANGELOG.md`
# stages nothing when the file is unmodified, so the exemption fires for exactly
# the commits it exists to stop. This file carried that bug until 2026-08-21.
# (LL-G kb/claude-code/hook-validates-text-not-state.md)
#
# Diffing against HEAD instead of the index is what removes the need for any text
# exemption: it sees the edit whether or not it has been staged yet. The tradeoff
# is real and belongs in the block message -- the changelog edit must be its own
# step, before the commit call.
# ---------------------------------------------------------------------------

# True when CHANGELOG.md differs from HEAD (staged or merely edited).
changelog_was_edited() {
  ! git diff --quiet HEAD -- CHANGELOG.md 2>/dev/null
}

# True when package.json's version differs from HEAD's.
version_was_bumped() {
  [ -f package.json ] || return 0
  local now before
  now=$(current_version)
  before=$(git show HEAD:package.json 2>/dev/null | read_version)
  [ -n "$now" ] && [ "$now" != "$before" ]
}

# True when CHANGELOG.md actually names the version being shipped. "The file
# changed" is weak; "the file documents this release" is the invariant, and it is
# the one that catches an edit that silently landed in the wrong section.
changelog_names_version() {
  local v
  v=$(current_version)
  [ -n "$v" ] || return 0
  grep -qF "## [$v]" CHANGELOG.md 2>/dev/null
}
