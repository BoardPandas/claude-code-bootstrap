#!/usr/bin/env bash
# PreToolUse hook on Write|Edit: surface the right knowledge-base shelves at the
# moment a file is about to be written.
#
# Why this exists alongside the SessionStart nudge and the path-scoped rules:
#   - session-start-kb-check.sh fires once, generically, before any technology is
#     known. By the time Claude knows it is writing PowerShell, that nudge is far
#     up the context and names no shelf.
#   - .claude/rules/llg-check.md is passive. It loads when a matching file is in
#     context and states the mandate, but nothing fires at the write itself.
#   - pre-plan-kb-check.sh only fires on EnterPlanMode, so a plan document written
#     outside plan mode (/spec-developer writing into tasks/) got no check at all.
#
# This hook closes both gaps: it names the exact LL-G shelf for the file's
# technology, and it treats a plan document as a plan (LL-G + BP) rather than as
# just another markdown file.
#
# Always exits 0 (advisory). stdout is injected into the session as context.
#
# LL-G: kb/claude-code/{hook-env-vars-do-not-exist,hook-empty-path-formats-repo,
#                       hook-matcher-tool-names-only}.md

set -u

# --------------------------------------------------------------- read payload
# $TOOL_INPUT / $CLAUDE_FILE_PATH do not exist. Guarding on them would disable
# the hook outright, and an empty path expansion is not a no-op.
# (LL-G kb/claude-code/hook-env-vars-do-not-exist.md)
HOOK_INPUT=$(cat)

# Pick a parser by RUNNING one, not by looking one up. On Windows, `command -v
# python3` finds the WindowsApps Store stub, which exits without output -- so a
# `command -v` guard reports success and every field silently comes back empty.
# Probe once with a payload of known shape.
JSON_PARSER=""
for cand in node python3 python; do
  command -v "$cand" >/dev/null 2>&1 || continue
  case "$cand" in
    node)   probe=$(printf '{"a":"ok"}' | node -e \
              'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{process.stdout.write(String(JSON.parse(s).a||""))}catch(e){}})' 2>/dev/null) ;;
    *)      probe=$(printf '{"a":"ok"}' | "$cand" -c \
              'import sys,json
try: sys.stdout.write(json.load(sys.stdin).get("a",""))
except Exception: pass' 2>/dev/null) ;;
  esac
  if [ "$probe" = "ok" ]; then JSON_PARSER="$cand"; break; fi
done

# $1 = dotted key path, e.g. tool_input.file_path
extract() {
  case "$JSON_PARSER" in
    node)
      printf '%s' "$HOOK_INPUT" | node -e \
        'let s="";const k=process.argv[1].split(".");process.stdin.on("data",d=>s+=d).on("end",()=>{
           try{let v=JSON.parse(s);for(const p of k)v=(v||{})[p];process.stdout.write(typeof v==="string"?v:"")}catch(e){}
         })' "$1" 2>/dev/null ;;
    python3|python)
      printf '%s' "$HOOK_INPUT" | "$JSON_PARSER" -c 'import sys,json
try:
    v = json.load(sys.stdin)
    for p in sys.argv[1].split("."):
        v = (v or {}).get(p)
    sys.stdout.write(v if isinstance(v, str) else "")
except Exception:
    pass' "$1" 2>/dev/null ;;
  esac
}

FILE_PATH=$(extract tool_input.file_path)
SESSION_ID=$(extract session_id)

# Degraded path: no working parser. Pull the values out of the raw payload rather
# than going quiet -- a check that disappears when a parser is missing is the
# silent failure this whole guard exists to prevent.
raw_field() {
  printf '%s' "$HOOK_INPUT" \
    | sed -n "s/.*\"$1\"[[:space:]]*:[[:space:]]*\"\([^\"]*\)\".*/\1/p" | head -1
}
[ -n "$FILE_PATH" ]  || FILE_PATH=$(raw_field file_path)
[ -n "$SESSION_ID" ] || SESSION_ID=$(raw_field session_id)

# No path means nothing to classify. Hard-guard on empty before any use.
[ -n "$FILE_PATH" ] || exit 0

# Normalize: JSON-escaped backslashes on Windows, then separators.
NORM=$(printf '%s' "$FILE_PATH" | sed 's|\\\\|/|g; s|\\|/|g' | tr '[:upper:]' '[:lower:]')

# ------------------------------------------------------------- classification
# Plan documents. `tasks/` tracks plansDirectory in .claude/settings.json --
# change both together.
is_plan_doc() {
  case "$NORM" in
    */tasks/*.md|tasks/*.md)            return 0 ;;
    *plan*.md|*spec*.md|*roadmap*.md)   return 0 ;;
  esac
  return 1
}

# LL-G shelf slugs for the file's technology. Verbatim directory names under
# kb/ -- a guessed slug 404s and the check silently yields nothing.
shelves_for_path() {
  local s=""
  case "$NORM" in
    */.claude/*|.claude/*)              s="$s claude-code" ;;
  esac
  case "$NORM" in
    */.github/workflows/*)              s="$s github-actions" ;;
  esac
  case "$NORM" in
    *.ps1|*.psm1|*.psd1)                s="$s powershell" ;;
    *.sh|*.bash)                        s="$s bash" ;;
    *.ts|*.tsx)                         s="$s typescript" ;;
    *.js|*.jsx|*.mjs|*.cjs)             s="$s nodejs" ;;
    *.py)                               s="$s python" ;;
    *.gd|*.tscn|*.tres)                 s="$s godot" ;;
    *.rs)                               s="$s rust" ;;
    *.sql)                              s="$s postgres" ;;
    *.css)                              s="$s css tailwind" ;;
    *dockerfile*|*docker-compose*)      s="$s docker" ;;
  esac
  # Framework shelves layer on top of the language shelf.
  case "$NORM" in
    */app/*|*/pages/*|*next.config.*)   s="$s nextjs" ;;
  esac
  case "$NORM" in
    *.tsx|*.jsx)                        s="$s react" ;;
  esac
  printf '%s' "${s# }"
}

if is_plan_doc; then
  KEY="plan"
  SHELVES=""
else
  SHELVES=$(shelves_for_path)
  # Not a file this repo has shelf coverage for (prose, JSON, lockfiles, assets).
  [ -n "$SHELVES" ] || exit 0
  KEY=$(printf '%s' "$SHELVES" | tr ' ' '-')
fi

# ------------------------------------------------------------------- de-dupe
# Without this the reminder fires on every single Write and Edit and drowns the
# session. Once per (session, shelf set) is enough: the entries do not change
# mid-conversation.
STATE_DIR="${TMPDIR:-/tmp}/claude-kb-check"
STATE_FILE=""
if mkdir -p "$STATE_DIR" 2>/dev/null && [ -w "$STATE_DIR" ]; then
  # Reap prior sessions so /tmp does not accumulate.
  find "$STATE_DIR" -type f -mtime +1 -delete 2>/dev/null
  STATE_FILE="$STATE_DIR/${SESSION_ID:-pid-$PPID}.seen"
  if [ -f "$STATE_FILE" ] && grep -qxF "$KEY" "$STATE_FILE" 2>/dev/null; then
    exit 0
  fi
  printf '%s\n' "$KEY" >>"$STATE_FILE"
fi

# ------------------------------------------------------------------- output
LLG=https://raw.githubusercontent.com/BoardPandas/LL-G/main
BP=https://raw.githubusercontent.com/BoardPandas/BP/main

if [ "$KEY" = "plan" ]; then
  cat <<EOF
=== KNOWLEDGE BASE CHECK -- PLAN DOCUMENT ($FILE_PATH) ===

You are about to write a plan. Consult BOTH knowledge bases and fold the results
into the plan itself, before writing it:

1. LL-G (what NOT to do):
   WebFetch $LLG/llms.txt
   Then $LLG/kb/<tech>/llms.txt for each technology the plan touches.
   Read ALL HIGH-severity entries; read MEDIUM entries matching the work.

2. BP (what TO do):
   WebFetch $BP/llms.txt
   Then $BP/practices/<concern>/llms.txt for each concern the plan touches.
   Load ALL FOUNDATIONAL entries; load RECOMMENDED entries matching the stack.

Relevant gotchas belong in the plan's "Lessons Learned / Gotchas" section, which
every plan must end with. If you already loaded these shelves earlier in this
conversation, proceed.
===
EOF
else
  {
    echo "=== LL-G GOTCHA CHECK -- $FILE_PATH ==="
    echo
    echo "Before writing this file, read the gotchas for its technology:"
    echo
    for shelf in $SHELVES; do
      echo "   WebFetch $LLG/kb/$shelf/llms.txt"
    done
    echo
    echo "Read ALL HIGH-severity entries on those shelves; read MEDIUM entries whose"
    echo "title matches this specific task. These document silent-wrong-output failures,"
    echo "so skipping them for a \"small edit\" is exactly when they bite."
    echo
    echo "If you already loaded these shelves earlier in this conversation, proceed."
    echo "==="
  }
fi

if [ -z "$STATE_FILE" ]; then
  echo "(note: $STATE_DIR is not writable, so this reminder cannot de-duplicate"
  echo " and will repeat on every write this session.)"
fi

exit 0
