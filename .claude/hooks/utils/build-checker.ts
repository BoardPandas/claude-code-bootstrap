/**
 * Build Checker Utility
 *
 * Runs builds on affected repos and catches TypeScript errors immediately.
 * Implements the "catch errors fast" principle from the Reddit post.
 */

import { execSync } from 'child_process';
import { existsSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

interface BuildResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  output: string;
  duration: number;
}

/**
 * Run TypeScript type checking
 */
export function runTypeCheck(cwd: string = process.cwd()): BuildResult {
  const startTime = Date.now();
  const result: BuildResult = {
    success: true,
    errors: [],
    warnings: [],
    output: '',
    duration: 0,
  };

  try {
    const output = execSync('npm run typecheck', {
      encoding: 'utf-8',
      cwd,
      stdio: 'pipe',
    });

    result.output = output;
    result.success = true;
  } catch (error: any) {
    result.success = false;
    result.output = error.stdout || error.stderr || error.message;

    // Parse TypeScript errors
    const errorLines = result.output.split('\n');
    errorLines.forEach(line => {
      if (line.includes('error TS')) {
        result.errors.push(line.trim());
      } else if (line.includes('warning TS')) {
        result.warnings.push(line.trim());
      }
    });
  }

  result.duration = Date.now() - startTime;
  return result;
}

/**
 * Run full build
 */
export function runBuild(cwd: string = process.cwd()): BuildResult {
  const startTime = Date.now();
  const result: BuildResult = {
    success: true,
    errors: [],
    warnings: [],
    output: '',
    duration: 0,
  };

  try {
    const output = execSync('npm run build', {
      encoding: 'utf-8',
      cwd,
      stdio: 'pipe',
    });

    result.output = output;
    result.success = true;
  } catch (error: any) {
    result.success = false;
    result.output = error.stdout || error.stderr || error.message;

    // Parse errors
    const errorLines = result.output.split('\n');
    errorLines.forEach(line => {
      if (line.includes('error') || line.includes('ERROR')) {
        result.errors.push(line.trim());
      } else if (line.includes('warning') || line.includes('WARNING')) {
        result.warnings.push(line.trim());
      }
    });
  }

  result.duration = Date.now() - startTime;
  return result;
}

/**
 * Quick check - only type check, no full build
 */
export function quickCheck(cwd: string = process.cwd()): BuildResult {
  console.log('Running quick TypeScript check...');
  return runTypeCheck(cwd);
}

/**
 * Full check - run complete build
 */
export function fullCheck(cwd: string = process.cwd()): BuildResult {
  console.log('Running full build...');
  return runBuild(cwd);
}

/**
 * Save build results to log
 */
export function saveBuildLog(result: BuildResult, logDir: string = '.claude/logs'): string {
  const logPath = join(process.cwd(), logDir);

  // Ensure log directory exists
  if (!existsSync(logPath)) {
    mkdirSync(logPath, { recursive: true });
  }

  // Generate log file name with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const logFile = join(logPath, `build-${timestamp}.log`);

  // Format log content
  const content = [
    `Build Check - ${new Date().toISOString()}`,
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
export function generateBuildSummary(result: BuildResult): string {
  const status = result.success ? '✓ SUCCESS' : '✗ FAILED';
  const duration = `${(result.duration / 1000).toFixed(2)}s`;

  let summary = `Build ${status} (${duration})`;

  if (result.errors.length > 0) {
    summary += `\n  Errors: ${result.errors.length}`;
    // Show first 3 errors
    result.errors.slice(0, 3).forEach(error => {
      summary += `\n    - ${error.substring(0, 80)}...`;
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

/**
 * Check if build scripts exist
 */
export function hasBuildScripts(cwd: string = process.cwd()): boolean {
  try {
    const packageJson = require(join(cwd, 'package.json'));
    return !!(packageJson.scripts?.build || packageJson.scripts?.typecheck);
  } catch {
    return false;
  }
}

// CLI interface for testing
if (require.main === module) {
  console.log('Running build check...\n');

  if (!hasBuildScripts()) {
    console.log('No build scripts found in package.json');
    process.exit(1);
  }

  // Run quick check by default
  const result = quickCheck();

  console.log(generateBuildSummary(result));

  if (!result.success) {
    console.log('\nRun "/build-and-fix" to resolve errors');
    const logFile = saveBuildLog(result);
    console.log(`\nFull log: ${logFile}`);
    process.exit(1);
  }

  process.exit(0);
}
