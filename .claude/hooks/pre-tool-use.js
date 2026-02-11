/**
 * PreToolUse Hook (v2.1.38 format)
 *
 * Runs before each tool execution. Reads JSON from stdin, writes JSON to stdout.
 * Cross-platform: plain JavaScript, no TypeScript dependency.
 *
 * Exit codes:
 *   0 = success (stdout parsed for JSON decision)
 *   2 = blocking error (stderr fed to Claude)
 *   other = non-blocking error
 */

const { readFileSync } = require('fs');

/**
 * Check if a file path is in a protected location
 */
function isProtectedPath(filePath) {
  const protectedPatterns = [
    /\.env$/,
    /\.env\.\w+$/,
    /credentials/i,
    /secrets/i,
    /\.pem$/,
    /\.key$/,
    /password/i,
  ];
  return protectedPatterns.some(pattern => pattern.test(filePath));
}

/**
 * Check if a bash command is potentially dangerous
 */
function isDangerousCommand(command) {
  const dangerousPatterns = [
    /rm\s+-rf\s+[\/~]/,
    /rm\s+-rf\s+\*/,
    />\s*\/dev\/sda/,
    /mkfs/,
    /dd\s+if=/,
    /:(){ :|:& };:/,
    /curl.*\|\s*bash/,
    /wget.*\|\s*bash/,
  ];
  return dangerousPatterns.some(pattern => pattern.test(command));
}

/**
 * Get context reminder based on the tool being used
 */
function getContextReminder(toolName, toolInput) {
  switch (toolName) {
    case 'Edit':
    case 'Write': {
      const filePath = toolInput.file_path || '';
      if (filePath.includes('.test.') || filePath.includes('.spec.')) {
        return 'Remember: TDD is required. If modifying tests, ensure they cover the intended behavior.';
      }
      if (filePath.includes('routes') || filePath.includes('api')) {
        return 'Remember: Add error handling, input validation, and logging for production quality.';
      }
      if (filePath.includes('config') || filePath.endsWith('.json')) {
        return 'Remember: Never commit secrets. Use environment variables for sensitive values.';
      }
      return null;
    }
    case 'Bash': {
      const command = toolInput.command || '';
      if (command.includes('psql') || command.includes('pg_dump') || command.includes('migrate')) {
        return 'Remember: Use transactions for multi-step database operations. Test on dev first.';
      }
      if (command.includes('npm install') || command.includes('npm add')) {
        return 'Remember: Prefer minimal dependencies. Check if stdlib or existing deps can do the job.';
      }
      return null;
    }
    default:
      return null;
  }
}

/**
 * Main: read JSON from stdin and output decision to stdout
 */
function main() {
  let input;
  try {
    const raw = readFileSync(0, 'utf-8');
    input = JSON.parse(raw);
  } catch {
    // If we can't read stdin, allow the tool
    process.exit(0);
  }

  const toolName = input.tool_name || '';
  const toolInput = input.tool_input || {};

  // Check for protected file access
  if (toolName === 'Read' || toolName === 'Edit' || toolName === 'Write') {
    const filePath = toolInput.file_path || '';
    if (isProtectedPath(filePath)) {
      const result = {
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'ask',
          permissionDecisionReason: `This file may contain sensitive data: ${filePath}. Proceed with caution.`,
        },
      };
      process.stdout.write(JSON.stringify(result));
      process.exit(0);
    }
  }

  // Check for dangerous bash commands
  if (toolName === 'Bash') {
    const command = toolInput.command || '';
    if (isDangerousCommand(command)) {
      const result = {
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'deny',
          permissionDecisionReason: `This command appears potentially destructive: ${command.substring(0, 100)}`,
        },
      };
      process.stdout.write(JSON.stringify(result));
      process.exit(0);
    }
  }

  // Add context reminders
  const reminder = getContextReminder(toolName, toolInput);
  if (reminder) {
    const result = {
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'allow',
        additionalContext: reminder,
      },
    };
    process.stdout.write(JSON.stringify(result));
    process.exit(0);
  }

  // Default: allow
  process.exit(0);
}

main();
