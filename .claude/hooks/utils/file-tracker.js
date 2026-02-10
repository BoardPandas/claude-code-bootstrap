/**
 * File Edit Tracker Utility
 *
 * Tracks which files are modified during Claude's responses.
 * Provides audit trail of changes.
 * Plain JavaScript - no TypeScript or ts-node dependency needed.
 */

const { execSync } = require('child_process');
const { existsSync, appendFileSync, mkdirSync } = require('fs');
const { join } = require('path');

/**
 * Get list of modified files from git
 */
function getModifiedFiles() {
  try {
    const output = execSync('git diff --name-only', {
      encoding: 'utf-8',
      cwd: process.cwd(),
    });

    return output.trim().split('\n').filter(Boolean);
  } catch (error) {
    console.warn('Failed to get modified files from git:', error.message);
    return [];
  }
}

/**
 * Get file modification status
 */
function getFileStatus(file) {
  try {
    const status = execSync(`git status --porcelain "${file}"`, {
      encoding: 'utf-8',
      cwd: process.cwd(),
    }).trim();

    if (status.startsWith('A') || status.startsWith('??')) return 'added';
    if (status.startsWith('D')) return 'deleted';
    return 'modified';
  } catch {
    return 'modified';
  }
}

/**
 * Get number of lines changed in a file
 */
function getLinesChanged(file) {
  try {
    const output = execSync(`git diff --numstat "${file}"`, {
      encoding: 'utf-8',
      cwd: process.cwd(),
    });

    const match = output.match(/^(\d+)\s+(\d+)/);
    if (match) {
      const added = parseInt(match[1], 10);
      const removed = parseInt(match[2], 10);
      return added + removed;
    }
  } catch {
    // Ignore errors
  }

  return 0;
}

/**
 * Log file edits to tracking file
 */
function logFileEdits(edits, logDir) {
  logDir = logDir || '.claude/logs';
  const logPath = join(process.cwd(), logDir);

  if (!existsSync(logPath)) {
    mkdirSync(logPath, { recursive: true });
  }

  const date = new Date().toISOString().split('T')[0];
  const logFile = join(logPath, `file-edits-${date}.log`);

  const entries = edits.map(edit => {
    const lines = edit.linesChanged ? ` (${edit.linesChanged} lines)` : '';
    return `[${edit.timestamp}] ${edit.status.toUpperCase()}: ${edit.file}${lines}`;
  });

  appendFileSync(logFile, entries.join('\n') + '\n');
}

/**
 * Track all current file modifications
 */
function trackCurrentModifications() {
  const timestamp = new Date().toISOString();
  const modifiedFiles = getModifiedFiles();

  const edits = modifiedFiles.map(file => ({
    timestamp,
    file,
    status: getFileStatus(file),
    linesChanged: getLinesChanged(file),
  }));

  if (edits.length > 0) {
    logFileEdits(edits);
  }

  return edits;
}

/**
 * Generate summary of tracked edits
 */
function generateEditSummary(edits) {
  if (edits.length === 0) {
    return 'No files modified';
  }

  const added = edits.filter(e => e.status === 'added').length;
  const modified = edits.filter(e => e.status === 'modified').length;
  const deleted = edits.filter(e => e.status === 'deleted').length;
  const totalLines = edits.reduce((sum, e) => sum + (e.linesChanged || 0), 0);

  let summary = `Modified ${edits.length} file(s)`;

  if (added > 0) summary += ` | Added: ${added}`;
  if (modified > 0) summary += ` | Modified: ${modified}`;
  if (deleted > 0) summary += ` | Deleted: ${deleted}`;
  if (totalLines > 0) summary += ` | Total lines changed: ${totalLines}`;

  return summary;
}

module.exports = { getModifiedFiles, trackCurrentModifications, generateEditSummary };

// CLI interface
if (require.main === module) {
  console.log('Tracking current file modifications...\n');

  const edits = trackCurrentModifications();

  if (edits.length === 0) {
    console.log('No files modified');
  } else {
    console.log(generateEditSummary(edits));
    console.log('\nDetails:');
    edits.forEach(edit => {
      const lines = edit.linesChanged ? ` (${edit.linesChanged} lines)` : '';
      console.log(`  ${edit.status.toUpperCase()}: ${edit.file}${lines}`);
    });
  }
}
