/**
 * Setup Hook
 *
 * Runs when Claude Code starts with --init, --init-only, or --maintenance flags.
 * Use this for repository setup, dependency checks, and maintenance tasks.
 *
 * Trigger: claude --init, claude --init-only, claude --maintenance
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

interface SetupResult {
  success: boolean;
  message: string;
  tasks: {
    name: string;
    status: 'success' | 'skipped' | 'failed';
    message?: string;
  }[];
}

/**
 * Check if a directory exists, create if not
 */
function ensureDirectory(dirPath: string): boolean {
  if (!existsSync(dirPath)) {
    try {
      mkdirSync(dirPath, { recursive: true });
      return true;
    } catch {
      return false;
    }
  }
  return true;
}

/**
 * Check if required files exist
 */
function checkRequiredFiles(): string[] {
  const requiredFiles = [
    'package.json',
    'CLAUDE.md',
    '.claude/skill-rules.json',
  ];

  return requiredFiles.filter(file => !existsSync(join(process.cwd(), file)));
}

/**
 * Check for common issues in the repository
 */
function runHealthChecks(): { name: string; status: 'pass' | 'fail'; message: string }[] {
  const checks: { name: string; status: 'pass' | 'fail'; message: string }[] = [];

  // Check if .env.example exists when .env is gitignored
  const gitignorePath = join(process.cwd(), '.gitignore');
  if (existsSync(gitignorePath)) {
    const gitignore = readFileSync(gitignorePath, 'utf-8');
    if (gitignore.includes('.env')) {
      const hasEnvExample = existsSync(join(process.cwd(), '.env.example'));
      checks.push({
        name: 'Environment template',
        status: hasEnvExample ? 'pass' : 'fail',
        message: hasEnvExample ? '.env.example exists' : 'Missing .env.example (recommended for team)',
      });
    }
  }

  // Check for dev-docs directory
  const devDocsPath = join(process.cwd(), '.claude', 'dev-docs');
  checks.push({
    name: 'Dev docs directory',
    status: existsSync(devDocsPath) ? 'pass' : 'fail',
    message: existsSync(devDocsPath) ? 'Exists' : 'Will be created on first /dev-docs run',
  });

  // Check for plans directory
  const plansPath = join(process.cwd(), '.claude', 'plans');
  checks.push({
    name: 'Plans directory',
    status: existsSync(plansPath) ? 'pass' : 'fail',
    message: existsSync(plansPath) ? 'Exists' : 'Will be created on first plan mode',
  });

  return checks;
}

/**
 * Main setup function
 */
export default function onSetup(): SetupResult {
  const tasks: SetupResult['tasks'] = [];

  try {
    // 1. Ensure required directories exist
    const directories = [
      '.claude/dev-docs',
      '.claude/plans',
    ];

    for (const dir of directories) {
      const dirPath = join(process.cwd(), dir);
      if (ensureDirectory(dirPath)) {
        tasks.push({
          name: `Create ${dir}`,
          status: existsSync(dirPath) ? 'skipped' : 'success',
          message: existsSync(dirPath) ? 'Already exists' : 'Created',
        });
      } else {
        tasks.push({
          name: `Create ${dir}`,
          status: 'failed',
          message: 'Could not create directory',
        });
      }
    }

    // 2. Check for required files
    const missingFiles = checkRequiredFiles();
    if (missingFiles.length > 0) {
      tasks.push({
        name: 'Check required files',
        status: 'failed',
        message: `Missing: ${missingFiles.join(', ')}`,
      });
    } else {
      tasks.push({
        name: 'Check required files',
        status: 'success',
        message: 'All required files present',
      });
    }

    // 3. Run health checks
    const healthChecks = runHealthChecks();
    for (const check of healthChecks) {
      tasks.push({
        name: check.name,
        status: check.status === 'pass' ? 'success' : 'skipped',
        message: check.message,
      });
    }

    // 4. Check git status
    try {
      const gitStatus = execSync('git status --porcelain', { encoding: 'utf-8' });
      const changedFiles = gitStatus.trim().split('\n').filter(Boolean).length;
      tasks.push({
        name: 'Git status',
        status: 'success',
        message: changedFiles === 0 ? 'Clean working directory' : `${changedFiles} changed files`,
      });
    } catch {
      tasks.push({
        name: 'Git status',
        status: 'skipped',
        message: 'Not a git repository',
      });
    }

    const failedTasks = tasks.filter(t => t.status === 'failed');

    return {
      success: failedTasks.length === 0,
      message: failedTasks.length === 0
        ? 'Setup complete. Repository is ready for development.'
        : `Setup completed with ${failedTasks.length} issue(s). Review tasks above.`,
      tasks,
    };
  } catch (error) {
    return {
      success: false,
      message: `Setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      tasks,
    };
  }
}

// For testing
if (require.main === module) {
  console.log('Running setup hook...\n');
  const result = onSetup();

  console.log('Setup Results:');
  console.log('==============\n');

  for (const task of result.tasks) {
    const icon = task.status === 'success' ? '✅' : task.status === 'skipped' ? '⏭️' : '❌';
    console.log(`${icon} ${task.name}: ${task.message || ''}`);
  }

  console.log(`\n${result.success ? '✅' : '⚠️'} ${result.message}`);
}
