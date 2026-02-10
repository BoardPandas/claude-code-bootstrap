/**
 * Error Pattern Checker Utility
 *
 * Analyzes code for missing error handling and risky patterns.
 * Supports multiple languages: JavaScript/TypeScript, Python, Go.
 * Plain JavaScript - no TypeScript or ts-node dependency needed.
 */

const { readFileSync } = require('fs');
const { extname } = require('path');

/**
 * Language-specific pattern sets
 */
const JS_TS_PATTERNS = [
  {
    check: 'async-no-try-catch',
    severity: 'high',
    message: 'Async function without try-catch or .catch()',
    suggestion: 'Add try-catch block to handle errors',
  },
  {
    check: 'api-call-no-error-handling',
    severity: 'high',
    message: 'API/DB call without error handling',
    suggestion: 'Add try-catch or .catch() to handle request failures',
  },
  {
    check: 'hardcoded-secret',
    severity: 'high',
    message: 'Potential hardcoded secret detected',
    suggestion: 'Move to environment variable or config file',
  },
  {
    check: 'console-log',
    severity: 'low',
    message: 'console.log found in production code',
    suggestion: 'Use proper logging or remove before committing',
  },
];

const PYTHON_PATTERNS = [
  {
    check: 'bare-except',
    severity: 'high',
    message: 'Bare except clause (catches all exceptions including SystemExit)',
    suggestion: 'Use except Exception: or a specific exception type',
  },
  {
    check: 'hardcoded-secret',
    severity: 'high',
    message: 'Potential hardcoded secret detected',
    suggestion: 'Use os.environ or a config file',
  },
];

const GO_PATTERNS = [
  {
    check: 'unchecked-error',
    severity: 'high',
    message: 'Function returns error but error is not checked',
    suggestion: 'Check the returned error value',
  },
  {
    check: 'hardcoded-secret',
    severity: 'high',
    message: 'Potential hardcoded secret detected',
    suggestion: 'Use os.Getenv or a config file',
  },
];

/**
 * Detect file language from extension
 */
function detectLanguage(file) {
  const ext = extname(file).toLowerCase();
  if (['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'].includes(ext)) return 'js';
  if (['.py', '.pyw'].includes(ext)) return 'python';
  if (ext === '.go') return 'go';
  return null;
}

/**
 * Check JavaScript/TypeScript file
 */
function checkJsFile(content, file) {
  const patterns = [];
  const lines = content.split('\n');
  const isTestFile = file.includes('.test.') || file.includes('.spec.') || file.includes('__test');

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Skip comments
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return;

    // Async without try-catch (look ahead 15 lines)
    if (/async\s+(function|\(|[a-zA-Z_$][a-zA-Z0-9_$]*\s*\()/.test(line)) {
      const nextLines = lines.slice(index, Math.min(index + 15, lines.length)).join('\n');
      if (!nextLines.includes('try') && !nextLines.includes('.catch(')) {
        patterns.push({
          severity: 'high',
          file,
          line: index + 1,
          message: 'Async function without try-catch or .catch()',
          suggestion: 'Add try-catch block to handle errors',
        });
      }
    }

    // API/DB calls without error handling
    if (/\b(fetch\(|axios\.|pool\.query|db\.(query|fetch)|http\.(get|post)|request\()/.test(line)) {
      const contextStart = Math.max(0, index - 5);
      const contextEnd = Math.min(lines.length, index + 10);
      const context = lines.slice(contextStart, contextEnd).join('\n');
      if (!context.includes('try') && !context.includes('.catch(') && !context.includes('catch (')) {
        patterns.push({
          severity: 'high',
          file,
          line: index + 1,
          message: 'API/DB call without error handling',
          suggestion: 'Add try-catch or .catch() to handle failures',
        });
      }
    }

    // console.log in non-test files
    if (!isTestFile && /console\.log\(/.test(line) && !trimmed.startsWith('//')) {
      patterns.push({
        severity: 'low',
        file,
        line: index + 1,
        message: 'console.log found in production code',
        suggestion: 'Use proper logging or remove before committing',
      });
    }

    // Hardcoded secrets
    checkHardcodedSecrets(line, index, file, patterns, ['process.env.', 'os.environ']);
  });

  return patterns;
}

/**
 * Check Python file
 */
function checkPythonFile(content, file) {
  const patterns = [];
  const lines = content.split('\n');
  const isTestFile = file.includes('test_') || file.includes('_test.py') || file.includes('/tests/');

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Skip comments
    if (trimmed.startsWith('#')) return;

    // Bare except
    if (/^\s*except\s*:/.test(line)) {
      patterns.push({
        severity: 'high',
        file,
        line: index + 1,
        message: 'Bare except clause (catches all exceptions including SystemExit)',
        suggestion: 'Use except Exception: or a specific exception type',
      });
    }

    // Hardcoded secrets
    checkHardcodedSecrets(line, index, file, patterns, ['os.environ', 'os.getenv', 'settings.']);
  });

  return patterns;
}

/**
 * Check Go file
 */
function checkGoFile(content, file) {
  const patterns = [];
  const lines = content.split('\n');
  const isTestFile = file.endsWith('_test.go');

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Skip comments
    if (trimmed.startsWith('//')) return;

    // Unchecked error: assigned to _ or call without capturing error return
    if (/\b\w+,\s*_\s*:?=\s*\w+/.test(line) && !isTestFile) {
      // Pattern: result, _ := someFunc() — ignoring error
      if (/,\s*_\s*:?=/.test(line)) {
        patterns.push({
          severity: 'high',
          file,
          line: index + 1,
          message: 'Error return value ignored (assigned to _)',
          suggestion: 'Check the returned error value',
        });
      }
    }

    // Hardcoded secrets
    checkHardcodedSecrets(line, index, file, patterns, ['os.Getenv', 'viper.Get']);
  });

  return patterns;
}

/**
 * Check for hardcoded secrets (shared across languages)
 */
function checkHardcodedSecrets(line, index, file, patterns, envPatterns) {
  // Skip if line uses environment variables
  if (envPatterns.some(p => line.includes(p))) return;

  // Skip comments
  const trimmed = line.trim();
  if (trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('*')) return;

  const secretRegexes = [
    /api[_-]?key\s*[:=]\s*['"][^'"]{20,}['"]/i,
    /password\s*[:=]\s*['"][^'"]+['"]/i,
    /secret\s*[:=]\s*['"][^'"]{20,}['"]/i,
    /token\s*[:=]\s*['"][^'"]{30,}['"]/i,
  ];

  secretRegexes.forEach(regex => {
    if (regex.test(line)) {
      patterns.push({
        severity: 'high',
        file,
        line: index + 1,
        message: 'Potential hardcoded secret detected',
        suggestion: 'Move to environment variable or config file',
      });
    }
  });
}

/**
 * Check a single file for error patterns
 */
function checkFile(file) {
  try {
    const content = readFileSync(file, 'utf-8');
    const lang = detectLanguage(file);

    switch (lang) {
      case 'js': return checkJsFile(content, file);
      case 'python': return checkPythonFile(content, file);
      case 'go': return checkGoFile(content, file);
      default: return [];
    }
  } catch (error) {
    console.warn(`Failed to check file ${file}:`, error.message);
    return [];
  }
}

/**
 * Check multiple files
 */
function checkFiles(files) {
  const allPatterns = [];
  files.forEach(file => {
    allPatterns.push(...checkFile(file));
  });
  return allPatterns;
}

/**
 * Generate report
 */
function generateReport(patterns) {
  if (patterns.length === 0) {
    return 'No error handling issues detected';
  }

  const high = patterns.filter(p => p.severity === 'high');
  const medium = patterns.filter(p => p.severity === 'medium');
  const low = patterns.filter(p => p.severity === 'low');

  let report = `Found ${patterns.length} potential issue(s):\n\n`;

  if (high.length > 0) {
    report += `HIGH PRIORITY (${high.length}):\n`;
    high.forEach(p => {
      report += `  ${p.file}:${p.line} - ${p.message}\n`;
      report += `    -> ${p.suggestion}\n\n`;
    });
  }

  if (medium.length > 0) {
    report += `MEDIUM PRIORITY (${medium.length}):\n`;
    medium.forEach(p => {
      report += `  ${p.file}:${p.line} - ${p.message}\n`;
    });
    report += '\n';
  }

  if (low.length > 0) {
    report += `LOW PRIORITY (${low.length}):\n`;
    report += `  ${low.map(p => `${p.file}:${p.line}`).join(', ')}\n\n`;
  }

  return report;
}

module.exports = { checkFile, checkFiles, generateReport, detectLanguage };

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node error-pattern-checker.js <file1> <file2> ...');
    process.exit(1);
  }

  console.log('Checking files for error patterns...\n');

  const patterns = checkFiles(args);
  console.log(generateReport(patterns));

  process.exit(patterns.filter(p => p.severity === 'high').length > 0 ? 1 : 0);
}
