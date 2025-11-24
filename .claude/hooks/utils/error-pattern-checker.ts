/**
 * Error Pattern Checker Utility
 *
 * Analyzes code for missing error handling and risky patterns.
 * Provides gentle reminders rather than blocking - MVP aligned.
 */

import { readFileSync } from 'fs';

interface ErrorPattern {
  type: 'missing-try-catch' | 'missing-error-handling' | 'console-log' | 'hardcoded-secret';
  severity: 'high' | 'medium' | 'low';
  file: string;
  line: number;
  message: string;
  suggestion: string;
}

/**
 * Check for async functions without try-catch
 */
function checkAsyncErrorHandling(content: string, file: string): ErrorPattern[] {
  const patterns: ErrorPattern[] = [];
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    // Find async functions
    if (/async\s+(function|\(|[a-zA-Z_$][a-zA-Z0-9_$]*\s*\()/.test(line)) {
      // Check if there's a try block in the next few lines
      const nextLines = lines.slice(index, index + 10).join('\n');

      if (!nextLines.includes('try {') && !nextLines.includes('.catch(')) {
        patterns.push({
          type: 'missing-try-catch',
          severity: 'high',
          file,
          line: index + 1,
          message: 'Async function without try-catch or .catch()',
          suggestion: 'Add try-catch block to handle errors',
        });
      }
    }
  });

  return patterns;
}

/**
 * Check for API calls without error handling
 */
function checkApiErrorHandling(content: string, file: string): ErrorPattern[] {
  const patterns: ErrorPattern[] = [];
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    // Find API calls
    if (/\b(fetch\(|axios\.|pool\.query|http\.|request\()/.test(line)) {
      // Check surrounding context for error handling
      const contextStart = Math.max(0, index - 5);
      const contextEnd = Math.min(lines.length, index + 10);
      const context = lines.slice(contextStart, contextEnd).join('\n');

      if (!context.includes('try {') && !context.includes('.catch(') && !context.includes('catch (')) {
        patterns.push({
          type: 'missing-error-handling',
          severity: 'high',
          file,
          line: index + 1,
          message: 'API call without error handling',
          suggestion: 'Add try-catch or .catch() to handle request failures',
        });
      }
    }
  });

  return patterns;
}

/**
 * Check for console.log in production code
 */
function checkConsoleLog(content: string, file: string): ErrorPattern[] {
  const patterns: ErrorPattern[] = [];

  // Skip test files
  if (file.includes('.test.') || file.includes('.spec.')) {
    return patterns;
  }

  const lines = content.split('\n');

  lines.forEach((line, index) => {
    if (/console\.log\(/.test(line) && !line.includes('//')) {
      patterns.push({
        type: 'console-log',
        severity: 'low',
        file,
        line: index + 1,
        message: 'console.log found in production code',
        suggestion: 'Use proper logging (Winston, Pino) or remove before committing',
      });
    }
  });

  return patterns;
}

/**
 * Check for potential hardcoded secrets
 */
function checkHardcodedSecrets(content: string, file: string): ErrorPattern[] {
  const patterns: ErrorPattern[] = [];
  const lines = content.split('\n');

  // Patterns that might indicate secrets
  const secretPatterns = [
    /api[_-]?key\s*[:=]\s*['"][^'"]{20,}['"]/i,
    /password\s*[:=]\s*['"][^'"]+['"]/i,
    /secret\s*[:=]\s*['"][^'"]{20,}['"]/i,
    /token\s*[:=]\s*['"][^'"]{30,}['"]/i,
  ];

  lines.forEach((line, index) => {
    // Skip if it's a comment or uses env var
    if (line.includes('//') || line.includes('process.env.')) {
      return;
    }

    secretPatterns.forEach(pattern => {
      if (pattern.test(line)) {
        patterns.push({
          type: 'hardcoded-secret',
          severity: 'high',
          file,
          line: index + 1,
          message: 'Potential hardcoded secret detected',
          suggestion: 'Move to environment variable or config file',
        });
      }
    });
  });

  return patterns;
}

/**
 * Check a single file for error patterns
 */
export function checkFile(file: string): ErrorPattern[] {
  try {
    const content = readFileSync(file, 'utf-8');
    const patterns: ErrorPattern[] = [];

    // Run all checks
    patterns.push(...checkAsyncErrorHandling(content, file));
    patterns.push(...checkApiErrorHandling(content, file));
    patterns.push(...checkConsoleLog(content, file));
    patterns.push(...checkHardcodedSecrets(content, file));

    return patterns;
  } catch (error) {
    console.warn(`Failed to check file ${file}:`, error);
    return [];
  }
}

/**
 * Check multiple files
 */
export function checkFiles(files: string[]): ErrorPattern[] {
  const allPatterns: ErrorPattern[] = [];

  files.forEach(file => {
    const patterns = checkFile(file);
    allPatterns.push(...patterns);
  });

  return allPatterns;
}

/**
 * Group patterns by severity
 */
export function groupBySeverity(patterns: ErrorPattern[]): {
  high: ErrorPattern[];
  medium: ErrorPattern[];
  low: ErrorPattern[];
} {
  return {
    high: patterns.filter(p => p.severity === 'high'),
    medium: patterns.filter(p => p.severity === 'medium'),
    low: patterns.filter(p => p.severity === 'low'),
  };
}

/**
 * Generate report of error patterns
 */
export function generateReport(patterns: ErrorPattern[]): string {
  if (patterns.length === 0) {
    return '✓ No error handling issues detected';
  }

  const grouped = groupBySeverity(patterns);
  let report = `Found ${patterns.length} potential issue(s):\n\n`;

  // High severity
  if (grouped.high.length > 0) {
    report += `⚠️  HIGH PRIORITY (${grouped.high.length}):\n`;
    grouped.high.forEach(p => {
      report += `  ${p.file}:${p.line} - ${p.message}\n`;
      report += `    → ${p.suggestion}\n\n`;
    });
  }

  // Medium severity
  if (grouped.medium.length > 0) {
    report += `⚡ MEDIUM PRIORITY (${grouped.medium.length}):\n`;
    grouped.medium.forEach(p => {
      report += `  ${p.file}:${p.line} - ${p.message}\n`;
    });
    report += '\n';
  }

  // Low severity
  if (grouped.low.length > 0) {
    report += `💡 LOW PRIORITY (${grouped.low.length}):\n`;
    report += `  ${grouped.low.map(p => `${p.file}:${p.line}`).join(', ')}\n\n`;
  }

  return report;
}

/**
 * Filter TypeScript/JavaScript files
 */
export function filterCodeFiles(files: string[]): string[] {
  return files.filter(file => /\.(ts|tsx|js|jsx)$/.test(file));
}

// CLI interface for testing
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: ts-node error-pattern-checker.ts <file1> <file2> ...');
    process.exit(1);
  }

  console.log('Checking files for error patterns...\n');

  const patterns = checkFiles(args);
  console.log(generateReport(patterns));

  process.exit(patterns.filter(p => p.severity === 'high').length > 0 ? 1 : 0);
}
