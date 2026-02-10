#!/bin/bash
#
# Stop Event Hook
#
# Runs after Claude's response completes. Performs:
# 1. Track file edits
# 2. Auto-format modified files (detects formatter)
# 3. Run build/type check (detects build system)
# 4. Check for error handling patterns
#
# Multi-stack: auto-detects Node.js, Python, Go, Rust projects.

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}[Hook] Running post-response checks...${NC}\n"

# Get project root
PROJECT_ROOT=$(pwd)
HOOK_DIR="$PROJECT_ROOT/.claude/hooks"
LOG_DIR="$PROJECT_ROOT/.claude/logs"

# Create log directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Timestamp for logs
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Track issues across all checks (use temp file to avoid subshell variable loss)
ISSUES_FILE=$(mktemp)
echo "0" > "$ISSUES_FILE"

increment_issues() {
    local current
    current=$(cat "$ISSUES_FILE")
    echo $((current + 1)) > "$ISSUES_FILE"
}

#
# 1. TRACK FILE EDITS
#
echo -e "${BLUE}[1/4] Tracking file edits...${NC}"

MODIFIED_FILES=$(git diff --name-only 2>/dev/null || echo "")

if [ -n "$MODIFIED_FILES" ]; then
    echo "$MODIFIED_FILES" >> "$LOG_DIR/file-edits-$TIMESTAMP.log"
    FILE_COUNT=$(echo "$MODIFIED_FILES" | wc -l | tr -d ' ')
    echo -e "${GREEN}Tracked $FILE_COUNT modified files${NC}"
else
    echo -e "${YELLOW}No files modified${NC}"
fi

#
# 2. AUTO-FORMAT MODIFIED FILES
#
echo -e "\n${BLUE}[2/4] Auto-formatting modified files...${NC}"

if [ -n "$MODIFIED_FILES" ]; then
    # Detect formatter
    if [ -f "package.json" ] && command -v npx &> /dev/null; then
        # Node.js: use Prettier
        FORMATTABLE_FILES=$(echo "$MODIFIED_FILES" | grep -E '\.(ts|tsx|js|jsx|json|md|yml|yaml)$' || echo "")
        if [ -n "$FORMATTABLE_FILES" ]; then
            echo "$FORMATTABLE_FILES" | while IFS= read -r file; do
                if [ -f "$file" ]; then
                    npx prettier --write "$file" 2>/dev/null || true
                fi
            done
            echo -e "${GREEN}Formatted with Prettier${NC}"
        else
            echo -e "${YELLOW}No formattable files${NC}"
        fi
    elif [ -f "pyproject.toml" ] && command -v black &> /dev/null; then
        # Python: use Black
        PY_FILES=$(echo "$MODIFIED_FILES" | grep -E '\.py$' || echo "")
        if [ -n "$PY_FILES" ]; then
            echo "$PY_FILES" | xargs -r black --quiet 2>/dev/null || true
            echo -e "${GREEN}Formatted with Black${NC}"
        else
            echo -e "${YELLOW}No Python files to format${NC}"
        fi
    elif [ -f "go.mod" ] && command -v gofmt &> /dev/null; then
        # Go: use gofmt
        GO_FILES=$(echo "$MODIFIED_FILES" | grep -E '\.go$' || echo "")
        if [ -n "$GO_FILES" ]; then
            echo "$GO_FILES" | xargs -r gofmt -w 2>/dev/null || true
            echo -e "${GREEN}Formatted with gofmt${NC}"
        fi
    elif [ -f "Cargo.toml" ] && command -v rustfmt &> /dev/null; then
        # Rust: use rustfmt
        RS_FILES=$(echo "$MODIFIED_FILES" | grep -E '\.rs$' || echo "")
        if [ -n "$RS_FILES" ]; then
            echo "$RS_FILES" | xargs -r rustfmt 2>/dev/null || true
            echo -e "${GREEN}Formatted with rustfmt${NC}"
        fi
    else
        echo -e "${YELLOW}No formatter detected (install Prettier, Black, gofmt, or rustfmt)${NC}"
    fi
else
    echo -e "${YELLOW}No files to format${NC}"
fi

#
# 3. BUILD / TYPE CHECK
#
echo -e "\n${BLUE}[3/4] Running build check...${NC}"

BUILD_LOG="$LOG_DIR/build-$TIMESTAMP.log"

if [ -f "package.json" ]; then
    # Node.js: try typecheck first, then build
    if grep -q '"typecheck"' package.json 2>/dev/null; then
        if npm run typecheck > "$BUILD_LOG" 2>&1; then
            echo -e "${GREEN}TypeScript type check passed${NC}"
        else
            echo -e "${RED}TypeScript errors found${NC}"
            echo -e "${YELLOW}  See: .claude/logs/build-$TIMESTAMP.log${NC}"
            echo -e "${YELLOW}  Run '/build-and-fix' to resolve${NC}"
            increment_issues
        fi
    elif grep -q '"build"' package.json 2>/dev/null; then
        if npm run build > "$BUILD_LOG" 2>&1; then
            echo -e "${GREEN}Build passed${NC}"
        else
            echo -e "${RED}Build errors found${NC}"
            echo -e "${YELLOW}  See: .claude/logs/build-$TIMESTAMP.log${NC}"
            increment_issues
        fi
    elif [ -f "tsconfig.json" ]; then
        if npx tsc --noEmit > "$BUILD_LOG" 2>&1; then
            echo -e "${GREEN}TypeScript compilation passed${NC}"
        else
            echo -e "${RED}TypeScript errors found${NC}"
            increment_issues
        fi
    else
        echo -e "${YELLOW}No build/typecheck script found in package.json${NC}"
    fi
elif [ -f "pyproject.toml" ] && command -v mypy &> /dev/null; then
    # Python: run mypy
    if mypy . > "$BUILD_LOG" 2>&1; then
        echo -e "${GREEN}mypy type check passed${NC}"
    else
        echo -e "${RED}mypy errors found${NC}"
        echo -e "${YELLOW}  See: .claude/logs/build-$TIMESTAMP.log${NC}"
        increment_issues
    fi
elif [ -f "go.mod" ]; then
    # Go: run go build
    if go build ./... > "$BUILD_LOG" 2>&1; then
        echo -e "${GREEN}Go build passed${NC}"
    else
        echo -e "${RED}Go build errors found${NC}"
        echo -e "${YELLOW}  See: .claude/logs/build-$TIMESTAMP.log${NC}"
        increment_issues
    fi
elif [ -f "Cargo.toml" ]; then
    # Rust: run cargo check
    if cargo check > "$BUILD_LOG" 2>&1; then
        echo -e "${GREEN}Cargo check passed${NC}"
    else
        echo -e "${RED}Cargo check errors found${NC}"
        increment_issues
    fi
else
    echo -e "${YELLOW}No build system detected, skipping${NC}"
fi

#
# 4. ERROR HANDLING PATTERNS CHECK
#
echo -e "\n${BLUE}[4/4] Checking error handling patterns...${NC}"

if [ -n "$MODIFIED_FILES" ]; then
    # Use the JS error pattern checker if node is available
    if command -v node &> /dev/null && [ -f "$HOOK_DIR/utils/error-pattern-checker.js" ]; then
        # Pass only code files that were modified
        CODE_FILES=$(echo "$MODIFIED_FILES" | grep -E '\.(ts|tsx|js|jsx|py|go)$' || echo "")
        if [ -n "$CODE_FILES" ]; then
            node "$HOOK_DIR/utils/error-pattern-checker.js" $CODE_FILES 2>/dev/null || true
        else
            echo -e "${GREEN}No code files to check${NC}"
        fi
    else
        echo -e "${YELLOW}Error pattern checker not available (requires Node.js)${NC}"
    fi
else
    echo -e "${YELLOW}No files to check${NC}"
fi

#
# SUMMARY
#
TOTAL_ISSUES=$(cat "$ISSUES_FILE")
rm -f "$ISSUES_FILE"

echo -e "\n${BLUE}----------------------------------------${NC}"
if [ "$TOTAL_ISSUES" -gt 0 ]; then
    echo -e "${YELLOW}Post-response checks complete ($TOTAL_ISSUES issue(s) found)${NC}"
else
    echo -e "${GREEN}Post-response checks complete!${NC}"
fi
echo -e "${BLUE}----------------------------------------${NC}\n"

# Cleanup old logs (keep last 20) - use subshell to avoid cd side effects
(
    cd "$LOG_DIR" 2>/dev/null || exit 0
    ls -t file-edits-*.log 2>/dev/null | tail -n +21 | xargs rm -f 2>/dev/null || true
    ls -t build-*.log 2>/dev/null | tail -n +21 | xargs rm -f 2>/dev/null || true
)

exit 0
