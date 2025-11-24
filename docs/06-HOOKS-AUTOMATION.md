# Hooks System - No Mess Left Behind

Automate code formatting, build checking, and error detection so you never have to think about it.

## The Problem

Without automation:
- Forget to format code
- Push broken builds
- Miss obvious errors
- Manual cleanup after every change
- Context switch between coding and housekeeping

## The Solution

Hooks run automatically during Claude Code sessions:
- **Before processing**: Analyze prompt, suggest skills
- **After response**: Format code, check build, detect errors

Result: "No mess left behind"

## Available Hooks

### 1. userPromptSubmit

**Runs**: Before Claude processes your message

**Purpose**: Analyze context and inject skill suggestions

**File**: `.claude/hooks/user-prompt-submit.ts`

**What It Does**:
1. Reads your prompt
2. Matches against skill-rules.json
3. Checks recently edited files
4. Injects skill activation reminders
5. Returns modified prompt

**Example**:

```typescript
// Input prompt
"Create an API endpoint for tickets"

// Hook analyzes and injects
"Create an API endpoint for tickets

[System: Consider these skills]
- backend-dev-guidelines (API patterns)
- tdd-workflow (write tests first)
- security-practices (input validation)"

// Claude receives enhanced prompt
```

**Implementation**:

```typescript
import fs from 'fs';
import path from 'path';

export default function userPromptSubmit(prompt: string): string {
  // Load skill rules
  const rulesPath = path.join(__dirname, '../skill-rules.json');
  const rules = JSON.parse(fs.readFileSync(rulesPath, 'utf-8'));

  const triggeredSkills: string[] = [];

  // Check each skill
  for (const [skillName, config] of Object.entries(rules)) {
    // Check keyword triggers
    const keywords = config.promptTriggers?.keywords || [];
    if (keywords.some(k => prompt.toLowerCase().includes(k.toLowerCase()))) {
      triggeredSkills.push(skillName);
      continue;
    }

    // Check intent pattern triggers
    const patterns = config.promptTriggers?.intentPatterns || [];
    if (patterns.some(p => new RegExp(p, 'i').test(prompt))) {
      triggeredSkills.push(skillName);
    }
  }

  // Inject skill suggestions
  if (triggeredSkills.length > 0) {
    const suggestions = triggeredSkills
      .map(s => `- ${s}`)
      .join('\n');

    return `${prompt}\n\n[Skill Suggestions]\n${suggestions}`;
  }

  return prompt;
}
```

### 2. stop (Linux/Mac)

**Runs**: After Claude completes a response

**Purpose**: Clean up and validate

**File**: `.claude/hooks/stop.sh`

**What It Does**:
1. Tracks modified files
2. Auto-formats changed files
3. Runs build check
4. Detects error patterns
5. Reports results

**Implementation**:

```bash
#!/bin/bash

HOOKS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$HOOKS_DIR/../.." && pwd)"

cd "$PROJECT_ROOT"

echo "🔍 Post-response checks..."

# 1. Track modified files
echo "📝 Tracking changes..."
node "$HOOKS_DIR/utils/file-tracker.ts"

# 2. Auto-format changed files
echo "✨ Formatting code..."
if command -v prettier &> /dev/null; then
  git diff --name-only --diff-filter=ACMR | \
    grep -E '\.(ts|tsx|js|jsx|json|md)$' | \
    xargs -r npx prettier --write
fi

# 3. Run build check
echo "🏗️  Checking build..."
node "$HOOKS_DIR/utils/build-checker.ts"

# 4. Check for error patterns
echo "🔎 Checking for common errors..."
node "$HOOKS_DIR/utils/error-pattern-checker.ts"

echo "✅ Checks complete!"
```

### 3. stop (Windows)

**File**: `.claude/hooks/stop.bat`

```batch
@echo off
setlocal

set HOOKS_DIR=%~dp0
set PROJECT_ROOT=%HOOKS_DIR%..\..

cd /d "%PROJECT_ROOT%"

echo 🔍 Post-response checks...

:: 1. Track modified files
echo 📝 Tracking changes...
node "%HOOKS_DIR%\utils\file-tracker.ts"

:: 2. Auto-format
echo ✨ Formatting code...
for /f %%i in ('git diff --name-only --diff-filter=ACMR') do (
  echo %%i | findstr /R "\.ts$ \.tsx$ \.js$ \.jsx$ \.json$ \.md$" >nul
  if not errorlevel 1 (
    npx prettier --write "%%i"
  )
)

:: 3. Build check
echo 🏗️  Checking build...
node "%HOOKS_DIR%\utils\build-checker.ts"

:: 4. Error patterns
echo 🔎 Checking for common errors...
node "%HOOKS_DIR%\utils\error-pattern-checker.ts"

echo ✅ Checks complete!
```

## Hook Utilities

### file-tracker.ts

**Purpose**: Log which files were modified

```typescript
import fs from 'fs';
import { execSync } from 'child_process';

interface FileChange {
  file: string;
  timestamp: string;
  changeType: 'added' | 'modified' | 'deleted';
}

function trackChanges() {
  // Get changed files from git
  const output = execSync('git diff --name-status --diff-filter=ACMR HEAD')
    .toString()
    .trim();

  if (!output) {
    console.log('No changes detected');
    return;
  }

  const changes: FileChange[] = output.split('\n').map(line => {
    const [status, file] = line.split('\t');
    return {
      file,
      timestamp: new Date().toISOString(),
      changeType: status === 'A' ? 'added' : status === 'D' ? 'deleted' : 'modified'
    };
  });

  // Log changes
  const logFile = '.claude/file-changes.log';
  const logEntry = changes.map(c =>
    `${c.timestamp} | ${c.changeType.padEnd(8)} | ${c.file}`
  ).join('\n');

  fs.appendFileSync(logFile, logEntry + '\n');

  console.log(`Tracked ${changes.length} file changes`);
}

trackChanges();
```

### build-checker.ts

**Purpose**: Run TypeScript build and report errors

```typescript
import { execSync } from 'child_process';

function checkBuild() {
  console.log('Running TypeScript build check...');

  try {
    // Run tsc --noEmit (type check without emitting files)
    execSync('npx tsc --noEmit', {
      stdio: 'inherit',
      cwd: process.cwd()
    });

    console.log('✅ Build check passed!');
    return true;
  } catch (error) {
    console.error('❌ Build check failed!');
    console.error('Run `/build-and-fix` to fix errors');
    return false;
  }
}

checkBuild();
```

### error-pattern-checker.ts

**Purpose**: Detect common error patterns

```typescript
import fs from 'fs';
import { glob } from 'glob';

interface ErrorPattern {
  file: string;
  line: number;
  pattern: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

const PATTERNS = [
  {
    regex: /await\s+(?!.*catch).*pool\.query/g,
    message: 'Database query without error handling',
    severity: 'error' as const
  },
  {
    regex: /req\.body\.(?!.*validation)/g,
    message: 'Unvalidated request body access',
    severity: 'warning' as const
  },
  {
    regex: /console\.log\(/g,
    message: 'Console.log in code (use logger)',
    severity: 'info' as const
  },
  {
    regex: /data-uic=""/g,
    message: 'Empty UIC attribute',
    severity: 'warning' as const
  }
];

function checkErrorPatterns() {
  const files = glob.sync('src/**/*.{ts,tsx}');
  const errors: ErrorPattern[] = [];

  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      PATTERNS.forEach(pattern => {
        if (pattern.regex.test(line)) {
          errors.push({
            file,
            line: index + 1,
            pattern: pattern.regex.source,
            message: pattern.message,
            severity: pattern.severity
          });
        }
      });
    });
  });

  // Report findings
  if (errors.length === 0) {
    console.log('✅ No error patterns detected');
    return;
  }

  const critical = errors.filter(e => e.severity === 'error');
  const warnings = errors.filter(e => e.severity === 'warning');

  if (critical.length > 0) {
    console.error(`\n❌ ${critical.length} critical issues:`);
    critical.forEach(e =>
      console.error(`  ${e.file}:${e.line} - ${e.message}`)
    );
  }

  if (warnings.length > 0) {
    console.warn(`\n⚠️  ${warnings.length} warnings:`);
    warnings.forEach(e =>
      console.warn(`  ${e.file}:${e.line} - ${e.message}`)
    );
  }
}

checkErrorPatterns();
```

## Setup

### 1. Install Dependencies

```bash
npm install --save-dev \
  typescript \
  prettier \
  @types/node \
  glob
```

### 2. Create Hook Files

```bash
mkdir -p .claude/hooks/utils

# Copy hook files
cp hooks/user-prompt-submit.ts .claude/hooks/
cp hooks/stop.sh .claude/hooks/
cp hooks/stop.bat .claude/hooks/
cp hooks/utils/*.ts .claude/hooks/utils/

# Make executable
chmod +x .claude/hooks/stop.sh
```

### 3. Configure in settings.local.json

```json
{
  "hooks": {
    "userPromptSubmit": ".claude/hooks/user-prompt-submit.ts",
    "stop": ".claude/hooks/stop.sh"
  }
}
```

For Windows:
```json
{
  "hooks": {
    "userPromptSubmit": ".claude/hooks/user-prompt-submit.ts",
    "stop": ".claude/hooks/stop.bat"
  }
}
```

### 4. Test Hooks

```bash
# Test userPromptSubmit
echo "Create an API endpoint" | node .claude/hooks/user-prompt-submit.ts

# Test stop hook
./.claude/hooks/stop.sh
```

## Customization

### Add Custom Formatting

Edit `stop.sh`:

```bash
# Add ESLint
if command -v eslint &> /dev/null; then
  echo "🔧 Running ESLint..."
  npx eslint --fix $(git diff --name-only --diff-filter=ACMR | grep -E '\.(ts|tsx|js|jsx)$')
fi
```

### Add Custom Checks

Create `.claude/hooks/utils/custom-checker.ts`:

```typescript
// Your custom validations
function checkCustomRules() {
  // Example: Check for missing UICs
  // Example: Validate API routes
  // Example: Check for security issues
}

checkCustomRules();
```

Add to `stop.sh`:

```bash
echo "🎯 Running custom checks..."
node "$HOOKS_DIR/utils/custom-checker.ts"
```

### Add Testing

```bash
# Run tests on changed files
echo "🧪 Running tests..."
npm test -- --findRelatedTests $(git diff --name-only --diff-filter=ACMR)
```

### Add Git Pre-commit Integration

Create `.git/hooks/pre-commit`:

```bash
#!/bin/bash

# Run the same checks as stop hook
.claude/hooks/stop.sh

# Fail commit if critical errors
if [ $? -ne 0 ]; then
  echo "❌ Pre-commit checks failed"
  exit 1
fi
```

## Best Practices

### Do

- Keep hooks fast (< 5 seconds)
- Make hooks idempotent (safe to run multiple times)
- Report what hooks are doing
- Log errors clearly
- Skip optional checks if tools missing

### Don't

- Make hooks slow (>10 seconds kills flow)
- Make hooks fail on warnings (only errors)
- Require manual interaction
- Change code without formatting (format first)
- Forget to make scripts executable

## Advanced Techniques

### Conditional Checks

Only run expensive checks on certain files:

```bash
# Only run build check if TypeScript files changed
if git diff --name-only | grep -q '\.tsx\?$'; then
  echo "🏗️  Running build check..."
  node "$HOOKS_DIR/utils/build-checker.ts"
fi
```

### Parallel Execution

Run multiple checks in parallel:

```bash
# Run checks in background
node "$HOOKS_DIR/utils/build-checker.ts" &
node "$HOOKS_DIR/utils/error-pattern-checker.ts" &

# Wait for all to complete
wait
```

### Caching Results

Cache expensive checks:

```bash
# Cache build results
BUILD_CACHE=".claude/.build-cache"

if [ -f "$BUILD_CACHE" ]; then
  LAST_BUILD=$(cat "$BUILD_CACHE")
  LATEST_CHANGE=$(git log -1 --format=%ct)

  if [ "$LAST_BUILD" -ge "$LATEST_CHANGE" ]; then
    echo "✅ Build check cached (no changes)"
    exit 0
  fi
fi

# Run build
npm run build
echo $(date +%s) > "$BUILD_CACHE"
```

### Notifications

Send notifications on failures:

```bash
if [ $BUILD_FAILED ]; then
  # macOS notification
  osascript -e 'display notification "Build failed" with title "Claude Code"'

  # Linux notification
  notify-send "Claude Code" "Build failed"
fi
```

## Integration with CI

Run the same checks in CI:

```yaml
# .github/workflows/quality.yml
name: Quality Checks

on: [push, pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Install dependencies
        run: npm install

      - name: Format check
        run: npx prettier --check .

      - name: Build check
        run: npx tsc --noEmit

      - name: Error patterns
        run: node .claude/hooks/utils/error-pattern-checker.ts
```

## Troubleshooting

### Hooks Not Running

1. Check settings.local.json exists and has correct paths
2. Verify file permissions: `chmod +x .claude/hooks/stop.sh`
3. Test manually: `./.claude/hooks/stop.sh`
4. Check Claude Code logs for errors

### Hooks Too Slow

1. Profile with `time ./.claude/hooks/stop.sh`
2. Remove expensive checks
3. Add caching
4. Use parallel execution
5. Skip checks when not needed

### Hooks Failing

1. Check dependencies installed: `npm install`
2. Verify paths are correct
3. Test utilities individually
4. Check error messages
5. Add error handling to scripts

### Prettier Not Found

```bash
# Install globally
npm install -g prettier

# Or use npx
npx prettier --write file.ts
```

## Real-World Example

### Before Hooks

```
Claude: [Makes changes]
You: "Looks good, commit it"
*Commits*
*Push fails - build broken*
You: "Fix the build errors"
Claude: [Fixes]
You: "Format the code"
Claude: [Formats]
You: "Now commit"
*Finally works*
```

**Result**: 10 minutes, 4 back-and-forth

### With Hooks

```
Claude: [Makes changes]
[Hook runs automatically]
  ✅ Formatted code
  ✅ Build passed
  ✅ No error patterns
You: "Commit it"
*Works first time*
```

**Result**: 2 minutes, zero back-and-forth

## Metrics

Track hook effectiveness:

```typescript
// .claude/hooks/utils/metrics.ts
interface HookMetrics {
  timestamp: string;
  filesChanged: number;
  filesFormatted: number;
  buildPassed: boolean;
  errorsFound: number;
  duration: number;
}

function recordMetrics(metrics: HookMetrics) {
  fs.appendFileSync(
    '.claude/hook-metrics.jsonl',
    JSON.stringify(metrics) + '\n'
  );
}
```

Analyze:
```bash
# Success rate
cat .claude/hook-metrics.jsonl | jq '.buildPassed' | grep true | wc -l

# Average duration
cat .claude/hook-metrics.jsonl | jq '.duration' | awk '{sum+=$1} END {print sum/NR}'
```

## Next Steps

1. Start with basic formatting and build check
2. Add error pattern detection
3. Customize for your project's needs
4. Integrate with CI
5. Add metrics to track improvement

---

**Setup time**: 30 minutes
**Time saved**: Hours daily
**ROI**: 50x from avoiding broken commits alone

Hooks are the "secret weapon" that makes Claude Code feel magical. Set them up once, benefit forever.
