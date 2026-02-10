/**
 * Build Checker Utility
 *
 * Auto-detects project type and runs the appropriate build/type check.
 * Supports: Node.js (TypeScript), Python (mypy), Go, Rust (cargo).
 * Plain JavaScript - no TypeScript or ts-node dependency needed.
 */

const { execSync } = require('child_process');
const { existsSync, readFileSync, writeFileSync, mkdirSync } = require('fs');
const { join } = require('path');

/**
 * Detect project type and return the appropriate build command
 */
function detectBuildCommand(cwd) {
  cwd = cwd || process.cwd();

  // Node.js: check package.json for scripts
  const packageJsonPath = join(cwd, 'package.json');
  if (existsSync(packageJsonPath)) {
    try {
      const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      if (pkg.scripts?.typecheck) return { cmd: 'npm run typecheck', type: 'node' };
      if (pkg.scripts?.build) return { cmd: 'npm run build', type: 'node' };
    } catch { /* ignore parse errors */ }
  }

  // TypeScript: check for tsconfig.json
  if (existsSync(join(cwd, 'tsconfig.json'))) {
    return { cmd: 'npx tsc --noEmit', type: 'typescript' };
  }

  // Python: check for pyproject.toml or setup.py
  if (existsSync(join(cwd, 'pyproject.toml')) || existsSync(join(cwd, 'setup.py'))) {
    return { cmd: 'mypy .', type: 'python' };
  }

  // Go: check for go.mod
  if (existsSync(join(cwd, 'go.mod'))) {
    return { cmd: 'go build ./...', type: 'go' };
  }

  // Rust: check for Cargo.toml
  if (existsSync(join(cwd, 'Cargo.toml'))) {
    return { cmd: 'cargo check', type: 'rust' };
  }

  return null;
}

/**
 * Run the detected build command
 */
function runBuildCheck(cwd) {
  cwd = cwd || process.cwd();
  const startTime = Date.now();
  const result = {
    success: true,
    errors: [],
    warnings: [],
    output: '',
    duration: 0,
    buildType: 'unknown',
  };

  const detected = detectBuildCommand(cwd);

  if (!detected) {
    result.output = 'No build system detected (no package.json, tsconfig.json, pyproject.toml, go.mod, or Cargo.toml found)';
    result.duration = Date.now() - startTime;
    return result;
  }

  result.buildType = detected.type;

  try {
    const output = execSync(detected.cmd, {
      encoding: 'utf-8',
      cwd,
      stdio: 'pipe',
    });

    result.output = output;
    result.success = true;
  } catch (error) {
    result.success = false;
    result.output = error.stdout || error.stderr || error.message;

    // Parse errors from output
    const errorLines = result.output.split('\n');
    errorLines.forEach(line => {
      const lower = line.toLowerCase();
      if (lower.includes('error') && !lower.includes('warning')) {
        result.errors.push(line.trim());
      } else if (lower.includes('warning')) {
        result.warnings.push(line.trim());
      }
    });
  }

  result.duration = Date.now() - startTime;
  return result;
}

/**
 * Save build results to log
 */
function saveBuildLog(result, logDir) {
  logDir = logDir || '.claude/logs';
  const logPath = join(process.cwd(), logDir);

  if (!existsSync(logPath)) {
    mkdirSync(logPath, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const logFile = join(logPath, `build-${timestamp}.log`);

  const content = [
    `Build Check - ${new Date().toISOString()}`,
    `Type: ${result.buildType}`,
    `Duration: ${result.duration}ms`,
    `Success: ${result.success}`,
    '',
    result.errors.length > 0 ? `Errors (${result.errors.length}):` : 'No errors',
    ...result.errors,
    '',
    result.warnings.length > 0 ? `Warnings (${result.warnings.length}):` : 'No warnings',
    ...result.warnings,
    '',
    'Full Output:',
    result.output,
  ].join('\n');

  writeFileSync(logFile, content);
  return logFile;
}

/**
 * Generate build summary for display
 */
function generateBuildSummary(result) {
  const status = result.success ? 'SUCCESS' : 'FAILED';
  const duration = `${(result.duration / 1000).toFixed(2)}s`;

  let summary = `Build ${status} [${result.buildType}] (${duration})`;

  if (result.errors.length > 0) {
    summary += `\n  Errors: ${result.errors.length}`;
    result.errors.slice(0, 3).forEach(error => {
      summary += `\n    - ${error.substring(0, 80)}`;
    });
    if (result.errors.length > 3) {
      summary += `\n    ... and ${result.errors.length - 3} more`;
    }
  }

  if (result.warnings.length > 0) {
    summary += `\n  Warnings: ${result.warnings.length}`;
  }

  return summary;
}

module.exports = { runBuildCheck, saveBuildLog, generateBuildSummary, detectBuildCommand };

// CLI interface
if (require.main === module) {
  console.log('Running build check...\n');

  const detected = detectBuildCommand();
  if (!detected) {
    console.log('No build system detected. Skipping build check.');
    process.exit(0);
  }

  console.log(`Detected: ${detected.type} (${detected.cmd})`);
  const result = runBuildCheck();
  console.log(generateBuildSummary(result));

  if (!result.success) {
    console.log('\nRun "/build-and-fix" to resolve errors');
    const logFile = saveBuildLog(result);
    console.log(`Full log: ${logFile}`);
    process.exit(1);
  }

  process.exit(0);
}
