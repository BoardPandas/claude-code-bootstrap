#!/bin/bash
#
# Stop Event Hook
#
# Runs after Claude's response completes. Performs:
# 1. Track file edits
# 2. Auto-format modified files with Prettier
# 3. Run build check on affected code
# 4. Check for error handling patterns
#
# This implements the "no mess left behind" philosophy from the Reddit post.

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}[Hook] Running post-response checks...${NC}\n"

# Get project root
PROJECT_ROOT=$(pwd)
HOOK_DIR="$PROJECT_ROOT/.claude/hooks"
LOG_DIR="$PROJECT_ROOT/.claude/logs"

# Create log directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Timestamp for logs
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

#
# 1. TRACK FILE EDITS
#
echo -e "${BLUE}[1/4] Tracking file edits...${NC}"

# Get list of modified files (staged and unstaged)
MODIFIED_FILES=$(git diff --name-only 2>/dev/null || echo "")

if [ -n "$MODIFIED_FILES" ]; then
    echo "$MODIFIED_FILES" >> "$LOG_DIR/file-edits-$TIMESTAMP.log"
    echo -e "${GREEN}✓ Tracked $(echo "$MODIFIED_FILES" | wc -l) modified files${NC}"
else
    echo -e "${YELLOW}No files modified${NC}"
fi

#
# 2. AUTO-FORMAT WITH PRETTIER
#
echo -e "\n${BLUE}[2/4] Auto-formatting modified files...${NC}"

if [ -n "$MODIFIED_FILES" ]; then
    # Filter for files that Prettier can format
    FORMATTABLE_FILES=$(echo "$MODIFIED_FILES" | grep -E '\.(ts|tsx|js|jsx|json|md|yml|yaml)$' || echo "")

    if [ -n "$FORMATTABLE_FILES" ]; then
        echo "$FORMATTABLE_FILES" | while IFS= read -r file; do
            if [ -f "$file" ]; then
                echo "  Formatting: $file"
                npx prettier --write "$file" 2>/dev/null || echo -e "${YELLOW}    Warning: Failed to format $file${NC}"
            fi
        done
        echo -e "${GREEN}✓ Formatted files with Prettier${NC}"
    else
        echo -e "${YELLOW}No formattable files to process${NC}"
    fi
else
    echo -e "${YELLOW}No files to format${NC}"
fi

#
# 3. BUILD CHECK (TypeScript only on affected files)
#
echo -e "\n${BLUE}[3/4] Checking TypeScript compilation...${NC}"

# Check if there are any TypeScript files modified
TS_FILES=$(echo "$MODIFIED_FILES" | grep -E '\.(ts|tsx)$' || echo "")

if [ -n "$TS_FILES" ]; then
    # Only run type check, not full build (faster)
    if npm run typecheck > "$LOG_DIR/typecheck-$TIMESTAMP.log" 2>&1; then
        echo -e "${GREEN}✓ TypeScript compilation successful${NC}"
    else
        echo -e "${RED}✗ TypeScript errors found${NC}"
        echo -e "${YELLOW}  See: .claude/logs/typecheck-$TIMESTAMP.log${NC}"
        echo -e "${YELLOW}  Run '/build-and-fix' to resolve errors${NC}"
    fi
else
    echo -e "${YELLOW}No TypeScript files modified, skipping build check${NC}"
fi

#
# 4. ERROR HANDLING PATTERNS CHECK
#
echo -e "\n${BLUE}[4/4] Checking error handling patterns...${NC}"

if [ -n "$TS_FILES" ]; then
    ISSUES_FOUND=0

    echo "$TS_FILES" | while IFS= read -r file; do
        if [ -f "$file" ]; then
            # Check for async functions without try-catch
            if grep -q "async.*(" "$file"; then
                if ! grep -q "try {" "$file"; then
                    echo -e "${YELLOW}  ⚠ $file: Async function without try-catch${NC}"
                    ISSUES_FOUND=$((ISSUES_FOUND + 1))
                fi
            fi

            # Check for fetch/API calls without error handling
            if grep -qE "(fetch\(|axios\.|pool\.query)" "$file"; then
                if ! grep -qE "(try \{|\.catch\(|catch \()" "$file"; then
                    echo -e "${YELLOW}  ⚠ $file: API call without error handling${NC}"
                    ISSUES_FOUND=$((ISSUES_FOUND + 1))
                fi
            fi

            # Check for console.log in production code (excluding test files)
            if [[ "$file" != *".test."* ]] && [[ "$file" != *".spec."* ]]; then
                if grep -q "console\.log" "$file"; then
                    echo -e "${YELLOW}  ⚠ $file: Contains console.log (consider using proper logging)${NC}"
                fi
            fi
        fi
    done

    if [ $ISSUES_FOUND -eq 0 ]; then
        echo -e "${GREEN}✓ No obvious error handling issues detected${NC}"
    fi
else
    echo -e "${YELLOW}No TypeScript files to check${NC}"
fi

#
# SUMMARY
#
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Post-response checks complete!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Cleanup old logs (keep last 20)
cd "$LOG_DIR"
ls -t file-edits-*.log 2>/dev/null | tail -n +21 | xargs rm -f 2>/dev/null || true
ls -t typecheck-*.log 2>/dev/null | tail -n +21 | xargs rm -f 2>/dev/null || true

exit 0
