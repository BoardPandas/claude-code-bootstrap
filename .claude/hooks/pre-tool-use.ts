/**
 * PreToolUse Hook
 *
 * Runs before each tool execution. Use this to:
 * - Inject additional context based on the tool being used
 * - Block dangerous operations
 * - Add reminders or warnings for specific operations
 *
 * Return value:
 * - { decision: 'allow' } - Allow the tool to run
 * - { decision: 'allow', additionalContext: '...' } - Allow with context injection
 * - { decision: 'block', reason: '...' } - Block the tool execution
 * - { decision: 'ask', reason: '...' } - Ask user for permission
 */

interface ToolInput {
  tool: string;
  input: Record<string, unknown>;
}

interface HookResult {
  decision: 'allow' | 'block' | 'ask';
  reason?: string;
  additionalContext?: string;
}

/**
 * Check if a file path is in a protected location
 */
function isProtectedPath(filePath: string): boolean {
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
function isDangerousCommand(command: string): boolean {
  const dangerousPatterns = [
    /rm\s+-rf\s+[\/~]/,           // rm -rf with root or home
    /rm\s+-rf\s+\*/,              // rm -rf *
    />\s*\/dev\/sda/,             // Write to disk device
    /mkfs/,                        // Format filesystem
    /dd\s+if=/,                    // dd command (can be destructive)
    /:(){ :|:& };:/,              // Fork bomb
    /curl.*\|\s*bash/,            // Piping curl to bash
    /wget.*\|\s*bash/,            // Piping wget to bash
  ];

  return dangerousPatterns.some(pattern => pattern.test(command));
}

/**
 * Get context reminder based on the tool being used
 */
function getContextReminder(tool: string, input: Record<string, unknown>): string | null {
  switch (tool) {
    case 'Edit':
    case 'Write': {
      const filePath = (input.file_path as string) || '';

      // Remind about test files
      if (filePath.includes('.test.') || filePath.includes('.spec.')) {
        return 'Remember: TDD is required. If modifying tests, ensure they cover the intended behavior.';
      }

      // Remind about route files
      if (filePath.includes('routes') || filePath.includes('api')) {
        return 'Remember: Add error handling, input validation, and logging for production quality.';
      }

      // Remind about config files
      if (filePath.includes('config') || filePath.endsWith('.json')) {
        return 'Remember: Never commit secrets. Use environment variables for sensitive values.';
      }

      return null;
    }

    case 'Bash': {
      const command = (input.command as string) || '';

      // Remind about database operations
      if (command.includes('psql') || command.includes('pg_dump') || command.includes('migrate')) {
        return 'Remember: Use transactions for multi-step database operations. Test on dev first.';
      }

      // Remind about npm operations
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
 * Main hook function
 */
export default function onPreToolUse(toolInput: ToolInput): HookResult {
  const { tool, input } = toolInput;

  try {
    // Check for protected file access
    if (tool === 'Read' || tool === 'Edit' || tool === 'Write') {
      const filePath = (input.file_path as string) || '';

      if (isProtectedPath(filePath)) {
        return {
          decision: 'ask',
          reason: `This file may contain sensitive data: ${filePath}. Proceed with caution.`,
        };
      }
    }

    // Check for dangerous bash commands
    if (tool === 'Bash') {
      const command = (input.command as string) || '';

      if (isDangerousCommand(command)) {
        return {
          decision: 'block',
          reason: `This command appears potentially destructive: ${command.substring(0, 100)}`,
        };
      }
    }

    // Add context reminders
    const reminder = getContextReminder(tool, input);
    if (reminder) {
      return {
        decision: 'allow',
        additionalContext: reminder,
      };
    }

    // Default: allow the tool
    return { decision: 'allow' };

  } catch (error) {
    // On error, allow the tool but log the issue
    console.error('PreToolUse hook error:', error);
    return { decision: 'allow' };
  }
}

// For testing
if (require.main === module) {
  const testCases: ToolInput[] = [
    { tool: 'Read', input: { file_path: '.env.local' } },
    { tool: 'Edit', input: { file_path: 'src/routes/api.ts' } },
    { tool: 'Bash', input: { command: 'rm -rf /' } },
    { tool: 'Bash', input: { command: 'npm install express' } },
    { tool: 'Write', input: { file_path: 'src/utils/helper.test.ts' } },
  ];

  console.log('Testing PreToolUse hook:\n');

  for (const testCase of testCases) {
    console.log(`Tool: ${testCase.tool}`);
    console.log(`Input: ${JSON.stringify(testCase.input)}`);
    const result = onPreToolUse(testCase);
    console.log(`Result: ${JSON.stringify(result, null, 2)}`);
    console.log('---\n');
  }
}
