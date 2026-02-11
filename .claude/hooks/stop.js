/**
 * Stop Hook (v2.1.38 format)
 *
 * Runs after Claude finishes responding. Performs:
 * 1. Track file edits via git
 * 2. Auto-format modified files (detects formatter)
 * 3. Run build/type check (detects build system)
 * 4. Check for error handling patterns
 *
 * Cross-platform: plain JavaScript, replaces stop.sh and stop.bat.
 * Multi-stack: auto-detects Node.js, Python, Go, Rust projects.
 */

const { readFileSync, existsSync, mkdirSync, appendFileSync } = require('fs');
const { join } = require('path');
const { execSync } = require('child_process');

function log(msg) {
  process.stderr.write(`[Hook] ${msg}\n`);
}

function exec(cmd, cwd) {
  try {
    return { ok: true, output: execSync(cmd, { encoding: 'utf-8', cwd, stdio: 'pipe', timeout: 60000 }) };
  } catch (e) {
    return { ok: false, output: e.stdout || e.stderr || e.message || '' };
  }
}

function main() {
  let input;
  try {
    const raw = readFileSync(0, 'utf-8');
    input = JSON.parse(raw);
  } catch {
    input = {};
  }

  const cwd = input.cwd || process.cwd();
  const hookDir = join(cwd, '.claude', 'hooks');
  const logDir = join(cwd, '.claude', 'logs');

  if (!existsSync(logDir)) {
    mkdirSync(logDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  let issues = 0;

  // 1. Track file edits
  log('Tracking file edits...');
  const { ok: gitOk, output: modifiedOutput } = exec('git diff --name-only', cwd);
  const modifiedFiles = gitOk ? modifiedOutput.trim().split('\n').filter(Boolean) : [];

  if (modifiedFiles.length > 0) {
    const logFile = join(logDir, `file-edits-${timestamp}.log`);
    appendFileSync(logFile, modifiedFiles.join('\n') + '\n');
    log(`Tracked ${modifiedFiles.length} modified file(s)`);
  }

  // 2. Auto-format modified files
  log('Auto-formatting...');
  if (modifiedFiles.length > 0) {
    if (existsSync(join(cwd, 'package.json'))) {
      const formattable = modifiedFiles.filter(f => /\.(ts|tsx|js|jsx|json|md|yml|yaml)$/.test(f));
      for (const file of formattable) {
        if (existsSync(join(cwd, file))) {
          exec(`npx prettier --write "${file}"`, cwd);
        }
      }
      if (formattable.length > 0) log('Formatted with Prettier');
    } else if (existsSync(join(cwd, 'pyproject.toml'))) {
      const pyFiles = modifiedFiles.filter(f => f.endsWith('.py'));
      for (const file of pyFiles) {
        if (existsSync(join(cwd, file))) {
          exec(`black --quiet "${file}"`, cwd);
        }
      }
      if (pyFiles.length > 0) log('Formatted with Black');
    } else if (existsSync(join(cwd, 'go.mod'))) {
      const goFiles = modifiedFiles.filter(f => f.endsWith('.go'));
      for (const file of goFiles) {
        if (existsSync(join(cwd, file))) {
          exec(`gofmt -w "${file}"`, cwd);
        }
      }
      if (goFiles.length > 0) log('Formatted with gofmt');
    } else if (existsSync(join(cwd, 'Cargo.toml'))) {
      const rsFiles = modifiedFiles.filter(f => f.endsWith('.rs'));
      for (const file of rsFiles) {
        if (existsSync(join(cwd, file))) {
          exec(`rustfmt "${file}"`, cwd);
        }
      }
      if (rsFiles.length > 0) log('Formatted with rustfmt');
    }
  }

  // 3. Build / type check
  log('Running build check...');
  const buildLog = join(logDir, `build-${timestamp}.log`);
  let buildCmd = null;

  if (existsSync(join(cwd, 'package.json'))) {
    try {
      const pkg = JSON.parse(readFileSync(join(cwd, 'package.json'), 'utf-8'));
      if (pkg.scripts && pkg.scripts.typecheck) buildCmd = 'npm run typecheck';
      else if (pkg.scripts && pkg.scripts.build) buildCmd = 'npm run build';
      else if (existsSync(join(cwd, 'tsconfig.json'))) buildCmd = 'npx tsc --noEmit';
    } catch { /* ignore */ }
  } else if (existsSync(join(cwd, 'pyproject.toml'))) {
    buildCmd = 'mypy .';
  } else if (existsSync(join(cwd, 'go.mod'))) {
    buildCmd = 'go build ./...';
  } else if (existsSync(join(cwd, 'Cargo.toml'))) {
    buildCmd = 'cargo check';
  }

  if (buildCmd) {
    const { ok, output } = exec(buildCmd, cwd);
    try { appendFileSync(buildLog, output); } catch { /* ignore */ }
    if (ok) {
      log('Build check passed');
    } else {
      log('Build errors found - see .claude/logs/build-' + timestamp + '.log');
      issues++;
    }
  } else {
    log('No build system detected');
  }

  // 4. Error handling patterns check
  log('Checking error patterns...');
  if (modifiedFiles.length > 0) {
    const checkerPath = join(hookDir, 'utils', 'error-pattern-checker.js');
    if (existsSync(checkerPath)) {
      const codeFiles = modifiedFiles.filter(f => /\.(ts|tsx|js|jsx|py|go)$/.test(f));
      if (codeFiles.length > 0) {
        exec(`node "${checkerPath}" ${codeFiles.map(f => `"${f}"`).join(' ')}`, cwd);
      }
    }
  }

  // Cleanup old logs (keep last 20)
  try {
    const { readdirSync, unlinkSync } = require('fs');
    const logs = readdirSync(logDir).filter(f => f.startsWith('file-edits-') || f.startsWith('build-'));
    const byType = {};
    for (const f of logs) {
      const prefix = f.startsWith('file-edits-') ? 'file-edits' : 'build';
      if (!byType[prefix]) byType[prefix] = [];
      byType[prefix].push(f);
    }
    for (const [, files] of Object.entries(byType)) {
      files.sort().reverse();
      for (const f of files.slice(20)) {
        try { unlinkSync(join(logDir, f)); } catch { /* ignore */ }
      }
    }
  } catch { /* ignore */ }

  // Summary
  if (issues > 0) {
    log(`Post-response checks complete (${issues} issue(s) found)`);
  } else {
    log('Post-response checks complete');
  }

  process.exit(0);
}

main();
