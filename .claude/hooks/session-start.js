/**
 * SessionStart Hook (v2.1.38 format)
 *
 * Runs when Claude Code starts or resumes a session.
 * Ensures required directories exist and runs health checks.
 * Cross-platform: plain JavaScript, no TypeScript dependency.
 *
 * Reads JSON from stdin, outputs context to stdout.
 */

const { existsSync, mkdirSync, readFileSync } = require('fs');
const { join } = require('path');
const { execSync } = require('child_process');

function ensureDirectory(dirPath) {
  if (!existsSync(dirPath)) {
    try {
      mkdirSync(dirPath, { recursive: true });
      return 'created';
    } catch {
      return 'failed';
    }
  }
  return 'exists';
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
  const context = [];

  // Ensure required directories exist
  const directories = [
    join(cwd, '.claude', 'dev-docs'),
    join(cwd, '.claude', 'plans'),
    join(cwd, '.claude', 'logs'),
  ];

  for (const dir of directories) {
    const status = ensureDirectory(dir);
    if (status === 'created') {
      context.push(`Created directory: ${dir}`);
    }
  }

  // Check for CLAUDE.md
  if (!existsSync(join(cwd, 'CLAUDE.md'))) {
    context.push('Note: No CLAUDE.md found. Run /setup-stack to configure your project.');
  }

  // Check for .env.example when .env is gitignored
  const gitignorePath = join(cwd, '.gitignore');
  if (existsSync(gitignorePath)) {
    try {
      const gitignore = readFileSync(gitignorePath, 'utf-8');
      if (gitignore.includes('.env') && !existsSync(join(cwd, '.env.example'))) {
        context.push('Warning: .env is gitignored but no .env.example template exists for team onboarding.');
      }
    } catch { /* ignore */ }
  }

  // Check git status
  try {
    const gitStatus = execSync('git status --porcelain', { encoding: 'utf-8', cwd });
    const changedFiles = gitStatus.trim().split('\n').filter(Boolean).length;
    if (changedFiles > 0) {
      context.push(`Git: ${changedFiles} uncommitted change(s) in working directory.`);
    }
  } catch { /* not a git repo, ignore */ }

  // Output context if there's anything useful
  if (context.length > 0) {
    const result = {
      hookSpecificOutput: {
        hookEventName: 'SessionStart',
        additionalContext: context.join('\n'),
      },
    };
    process.stdout.write(JSON.stringify(result));
  }

  process.exit(0);
}

main();
