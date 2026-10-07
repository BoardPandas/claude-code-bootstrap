#!/usr/bin/env bash
# PreToolUse hook on Bash: pause a production deploy until a named person has
# authorised this specific release.
#
# Stage 5 of the AI-native SDLC playbook: "hooks as approval gates". The point is
# not to make deploys hard -- it is to make the authorisation a recorded, checkable
# fact rather than a click nobody remembers giving.
#
# BLOCKING (exit 2). A blocking hook's stdout is discarded, so every refusal here
# writes to stderr; a gate that refuses without saying why trains people to
# disable it.
#
# Scope is deliberately narrow. It fires only on commands that look like a
# production deploy, so ordinary work never sees it. A gate that fires on
# everything is a gate that gets switched off.
#
# LL-G: kb/claude-code/{hook-env-vars-do-not-exist,hook-matcher-tool-names-only}.md

set -u

HOOK_INPUT=$(cat)

. "$(dirname "${BASH_SOURCE[0]}")/_json-parser.sh"
. "$(dirname "${BASH_SOURCE[0]}")/_hook-context.sh"

CMD=$(json_field "$HOOK_INPUT" tool_input.command)
# Degraded path: no working interpreter. Use the over-eager extraction, because
# for a blocking gate truncating the subject is the dangerous direction -- a
# half-read command that no longer matches would wave a deploy straight through.
[ -n "$CMD" ] || CMD=$(json_field_greedy "$HOOK_INPUT" command)
[ -n "$CMD" ] || exit 0

# ------------------------------------------------------------- is this a deploy?
# Match against the command with quoted regions collapsed, NOT the raw text. A
# substring match on raw text cannot tell a deploy from a command that merely
# mentions one -- `echo '{"command":"wrangler deploy"}' | bash gate.sh` is not a
# deploy, and blocking it makes the gate fire on its own tests. This is the same
# distinction _git-commit-filter.sh draws, for the same reason; each quoted
# region collapses to one opaque token rather than being deleted, so a flag's
# quoted value cannot let the following word slide into a command position.
#
# Newlines become separators so the second line of a multi-line script is still
# checked.
SCAN=$(printf '%s' "$CMD" \
  | sed -e "s/'[^']*'/__Q__/g" -e 's/"[^"]*"/__Q__/g' \
  | tr '\n' ';' \
  | sed -e 's/[;&|()][;&|()]*/ ; /g')

# --------------------------------------------------- tool + subcommand matching
# Deploy subcommands are matched as WHOLE TOKENS, never as substrings.
#
# The substring form is what `*railway*up*` was, and `up` occurs inside `backup`,
# `update`, `upgrade` and `upload`. That gate blocked `railway postgres pitr
# backup list`, `railway api --file q.graphql | grep -i backup`, `railway
# variable update` and a heredoc of markdown prose that merely mentioned Railway
# and a backup -- none of which deploy anything. A gate that refuses read-only
# commands is a gate that gets switched off, which is the one failure this hook
# cannot survive.
#
# The walk deliberately does NOT model command position, so `echo railway up`
# still blocks. Over-eager is the safe direction here: a missed deploy is a
# release that shipped unauthorised, while a false block costs one `--dry-run`
# or one named authorisation. What it no longer does is fire on a command that
# never contains the subcommand at all.
# (LL-G kb/claude-code/hook-git-commit-filter-needs-argv-walk.md)
#
# Both lists are SPACE-SEPARATED and compared with `=`, never used as a case
# pattern. `case "$tok" in $sub_pat)` looks like it would work and does not: the
# `|` that separates case alternatives is resolved when the case statement is
# parsed, so a variable expanding to `up|redeploy` is one pattern containing a
# literal pipe and matches nothing at all. Silently -- the gate simply stops
# firing, which is the direction that ships an unauthorised release.
#
# $1  space-separated tool names, compared against the token with any leading
#     path and a .exe/.cmd suffix stripped  -- "railway", "fly flyctl"
# $2  space-separated subcommands, compared against the RAW token so that
#     flag-shaped ones work  -- "up redeploy", "--prod"
invokes_subcommand() {
  local tools="$1" subs="$2"
  local tok name cand seen result restore_glob

  # Unquoted word splitting below would otherwise glob-expand a token like `*`
  # against the working directory.
  restore_glob=0
  case $- in
    *f*) ;;
    *)   restore_glob=1; set -f ;;
  esac

  seen=0
  result=1
  for tok in $SCAN; do
    # Every command separator was normalised to `;` above. The subcommand has to
    # sit in the SAME command as the tool, so `railway logs | grep up` is not a
    # deploy and neither is `railway status && npm run up-to-date`.
    if [ "$tok" = ";" ]; then seen=0; continue; fi

    if [ "$seen" = 0 ]; then
      name=${tok##*/}
      name=${name%.exe}
      name=${name%.cmd}
      for cand in $tools; do
        if [ "$name" = "$cand" ]; then seen=1; break; fi
      done
      continue
    fi

    for cand in $subs; do
      if [ "$tok" = "$cand" ]; then result=0; break 2; fi
    done
  done

  [ "$restore_glob" = 1 ] && set +f
  return "$result"
}

# ------------------------------------------------------------- is this a deploy?
# Match on intent, not on one tool. Add this project's own deploy command here;
# the list travels with the repo, so keep it accurate rather than broad.
#
# `flyctl` is named explicitly. The old `*fly*deploy*` covered it only by
# accident, through the substring it also mis-fired on, so anchoring the token
# without listing the real binary name would have opened a silent hole.
is_production_deploy() {
  case "$SCAN" in
    *--dry-run*|*--help*|*" -h"*) return 1 ;;
  esac

  invokes_subcommand 'wrangler'   'deploy publish' && return 0
  invokes_subcommand 'railway'    'up redeploy'    && return 0
  invokes_subcommand 'vercel'     '--prod'         && return 0
  invokes_subcommand 'fly flyctl' 'deploy'         && return 0
  invokes_subcommand 'terraform'  'apply'          && return 0
  invokes_subcommand 'npm pnpm'   'deploy:prod'    && return 0

  # kubectl and helm address every environment with the same verb, so the verb
  # alone is not intent. `prod` stays a substring test on purpose: it has to
  # catch `--namespace=prod`, `prod-cluster` and `production`, and it can only
  # ever NARROW a match that already found `kubectl apply` / `helm upgrade`.
  case "$SCAN" in
    *prod*)
      invokes_subcommand 'kubectl' 'apply'   && return 0
      invokes_subcommand 'helm'    'upgrade' && return 0
      ;;
  esac

  return 1
}

is_production_deploy || exit 0

# ------------------------------------------------------------------ the gate
# Authorisation rides on the command itself, exactly like SKIP_CHANGELOG. The
# hook is spawned by the harness and does NOT inherit variables exported in an
# earlier shell command, so reading the environment would silently never match.
# (LL-G kb/claude-code/hook-env-assignment-not-inherited.md)
RELEASE_AUTH=$(printf '%s' "$SCAN" | sed -n 's/.*RELEASE_AUTHORIZED_BY=\([A-Za-z0-9._@-]\{1,\}\).*/\1/p' | head -1)

if [ -n "$RELEASE_AUTH" ]; then
  # Recorded, not just allowed: the session now carries who authorised this
  # deploy, which is the artifact an audit actually needs. As JSON, because plain
  # PreToolUse stdout goes to the debug log and the note would reach no one.
  emit_context PreToolUse "Release authorised by: $RELEASE_AUTH"
  exit 0
fi

{
  echo "BLOCKED: this looks like a production deploy, and no release authorisation is attached."
  echo ""
  echo "  Command: $(printf '%s' "$CMD" | cut -c1-120)"
  echo ""
  echo "Production deploys require a named person to authorise the specific release,"
  echo "so the authorisation is a recorded fact rather than an unremembered click."
  echo ""
  echo "  1. Confirm with the release owner what is shipping."
  echo "  2. Re-run with their identifier as a prefix on the command itself:"
  echo ""
  echo "       RELEASE_AUTHORIZED_BY=<name-or-email> <your deploy command>"
  echo ""
  echo "The prefix must ride on the same command being judged -- the hook reads it"
  echo "out of the command text, not out of its own environment, which the harness"
  echo "gives it rather than your shell."
  echo ""
  echo "This gate is scoped to production deploy commands only; --dry-run is exempt."
  echo "If it fired on something that is not a production deploy, fix the match list"
  echo "in .claude/scripts/require-release-authorization.sh rather than disabling it."
} >&2
exit 2
