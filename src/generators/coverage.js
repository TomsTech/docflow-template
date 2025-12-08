/**
 * DocFlow Coverage Generator
 * Scan codebases and check documentation coverage
 */

import { glob } from 'glob';
import { join, extname } from 'path';
import chalk from 'chalk';

/**
 * Scan codebase for code files
 * @param {string} dir - Directory to scan
 * @param {object} options - Scan options
 * @param {string[]} options.include - Patterns to include
 * @param {string[]} options.exclude - Patterns to exclude
 * @returns {Promise<string[]>} Array of file paths
 */
export async function scanCodebase(dir, options = {}) {
  const include = options.include || ['**/*.{js,ts,py,ps1}'];
  const exclude = options.exclude || [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/.git/**',
    '**/coverage/**',
    '**/*.min.js',
    '**/*.bundle.js'
  ];

  const files = [];

  for (const pattern of include) {
    const matches = await glob(pattern, {
      cwd: dir,
      absolute: true,
      ignore: exclude,
      nodir: true
    });
    files.push(...matches);
  }

  // Remove duplicates
  return [...new Set(files)];
}

/**
 * Extract symbols (functions, classes, exports) from a file
 * @param {string} filePath - Path to the file
 * @param {string} content - File content
 * @returns {Promise<object[]>} Array of symbol objects
 */
export async function extractSymbols(filePath, content) {
  const ext = extname(filePath).toLowerCase();
  const symbols = [];

  switch (ext) {
    case '.js':
    case '.ts':
    case '.jsx':
    case '.tsx':
      symbols.push(...extractJavaScriptSymbols(content, filePath));
      break;
    case '.py':
      symbols.push(...extractPythonSymbols(content, filePath));
      break;
    case '.ps1':
      symbols.push(...extractPowerShellSymbols(content, filePath));
      break;
    default:
      // Unsupported file type
      break;
  }

  return symbols;
}

/**
 * Extract JavaScript/TypeScript symbols
 * @param {string} content - File content
 * @param {string} filePath - File path for reference
 * @returns {object[]} Array of symbols
 */
function extractJavaScriptSymbols(content, filePath) {
  const symbols = [];
  const lines = content.split('\n');

  // Function declarations: function name(...) or function* name(...)
  const functionRegex = /^(?:export\s+)?(?:async\s+)?function\s*\*?\s+(\w+)\s*\(/gm;
  let match;
  while ((match = functionRegex.exec(content)) !== null) {
    const lineNumber = content.substring(0, match.index).split('\n').length;
    symbols.push({
      name: match[1],
      type: 'function',
      line: lineNumber,
      file: filePath,
      position: match.index
    });
  }

  // Arrow functions: const/let/var name = (...) =>
  const arrowRegex = /^(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/gm;
  while ((match = arrowRegex.exec(content)) !== null) {
    const lineNumber = content.substring(0, match.index).split('\n').length;
    symbols.push({
      name: match[1],
      type: 'function',
      line: lineNumber,
      file: filePath,
      position: match.index
    });
  }

  // Class declarations: class Name
  const classRegex = /^(?:export\s+)?(?:abstract\s+)?class\s+(\w+)/gm;
  while ((match = classRegex.exec(content)) !== null) {
    const lineNumber = content.substring(0, match.index).split('\n').length;
    symbols.push({
      name: match[1],
      type: 'class',
      line: lineNumber,
      file: filePath,
      position: match.index
    });
  }

  // Class methods
  const methodRegex = /^\s+(?:async\s+)?(?:static\s+)?(\w+)\s*\([^)]*\)\s*{/gm;
  while ((match = methodRegex.exec(content)) !== null) {
    const name = match[1];
    // Skip constructor and common non-methods
    if (name === 'constructor' || name === 'if' || name === 'for' || name === 'while') {
      continue;
    }
    const lineNumber = content.substring(0, match.index).split('\n').length;
    symbols.push({
      name,
      type: 'method',
      line: lineNumber,
      file: filePath,
      position: match.index
    });
  }

  // Named exports: export { name }
  const namedExportRegex = /export\s*{([^}]+)}/g;
  while ((match = namedExportRegex.exec(content)) !== null) {
    const exports = match[1].split(',').map(e => e.trim().split(/\s+as\s+/)[0]);
    for (const exp of exports) {
      if (exp && !symbols.find(s => s.name === exp)) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        symbols.push({
          name: exp,
          type: 'export',
          line: lineNumber,
          file: filePath,
          position: match.index
        });
      }
    }
  }

  return symbols;
}

/**
 * Extract Python symbols
 * @param {string} content - File content
 * @param {string} filePath - File path for reference
 * @returns {object[]} Array of symbols
 */
function extractPythonSymbols(content, filePath) {
  const symbols = [];

  // Function definitions: def name(...):
  const functionRegex = /^(?:async\s+)?def\s+(\w+)\s*\(/gm;
  let match;
  while ((match = functionRegex.exec(content)) !== null) {
    const name = match[1];
    // Skip private methods (starting with _) unless they're special methods (__init__)
    if (name.startsWith('_') && !name.startsWith('__')) {
      continue;
    }
    const lineNumber = content.substring(0, match.index).split('\n').length;
    symbols.push({
      name,
      type: name.startsWith('__') ? 'method' : 'function',
      line: lineNumber,
      file: filePath,
      position: match.index
    });
  }

  // Class definitions: class Name:
  const classRegex = /^class\s+(\w+)(?:\([^)]*\))?:/gm;
  while ((match = classRegex.exec(content)) !== null) {
    const lineNumber = content.substring(0, match.index).split('\n').length;
    symbols.push({
      name: match[1],
      type: 'class',
      line: lineNumber,
      file: filePath,
      position: match.index
    });
  }

  return symbols;
}

/**
 * Extract PowerShell symbols
 * @param {string} content - File content
 * @param {string} filePath - File path for reference
 * @returns {object[]} Array of symbols
 */
function extractPowerShellSymbols(content, filePath) {
  const symbols = [];

  // Function definitions: function Verb-Noun { or Function Verb-Noun {
  const functionRegex = /^(?:function|Function)\s+([\w-]+)\s*(?:\([^)]*\))?\s*{/gm;
  let match;
  while ((match = functionRegex.exec(content)) !== null) {
    const lineNumber = content.substring(0, match.index).split('\n').length;
    symbols.push({
      name: match[1],
      type: 'function',
      line: lineNumber,
      file: filePath,
      position: match.index
    });
  }

  // Advanced functions with [CmdletBinding()]
  const advancedFunctionRegex = /\[CmdletBinding\(\)\][^\n]*\s+(?:function|Function)\s+([\w-]+)/g;
  while ((match = advancedFunctionRegex.exec(content)) !== null) {
    const name = match[1];
    // Skip if already added
    if (!symbols.find(s => s.name === name)) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      symbols.push({
        name,
        type: 'function',
        line: lineNumber,
        file: filePath,
        position: match.index
      });
    }
  }

  // Script parameters (indicate a script module)
  const paramRegex = /^[Pp]aram\s*\(/m;
  if (paramRegex.test(content)) {
    symbols.push({
      name: filePath.split(/[/\\]/).pop().replace('.ps1', ''),
      type: 'script',
      line: 1,
      file: filePath,
      position: 0
    });
  }

  return symbols;
}

/**
 * Check if a symbol is documented
 * @param {object} symbol - Symbol object
 * @param {string} content - Full file content
 * @returns {boolean} True if documented
 */
export function checkDocumentation(symbol, content) {
  const lines = content.split('\n');
  const symbolLine = symbol.line - 1; // 0-indexed

  // Look backwards from the symbol line for documentation
  let docStartLine = symbolLine - 1;
  let foundDoc = false;

  // Check for different documentation styles based on file type
  const ext = extname(symbol.file).toLowerCase();

  switch (ext) {
    case '.js':
    case '.ts':
    case '.jsx':
    case '.tsx':
      foundDoc = checkJSDocDocumentation(lines, symbolLine);
      break;
    case '.py':
      foundDoc = checkPythonDocstring(lines, symbolLine);
      break;
    case '.ps1':
      foundDoc = checkPowerShellHelp(lines, symbolLine, content, symbol);
      break;
  }

  return foundDoc;
}

/**
 * Check for JSDoc documentation
 * @param {string[]} lines - File lines
 * @param {number} symbolLine - Line number of symbol
 * @returns {boolean} True if documented
 */
function checkJSDocDocumentation(lines, symbolLine) {
  let foundDoc = false;
  let checkLine = symbolLine - 1;

  // Look backwards for JSDoc comment
  while (checkLine >= 0) {
    const line = lines[checkLine].trim();

    // Found end of JSDoc block
    if (line === '*/') {
      // Now look for the start
      for (let i = checkLine; i >= 0; i--) {
        if (lines[i].trim().startsWith('/**')) {
          foundDoc = true;
          break;
        }
        // If we hit something that's not a comment, stop
        if (lines[i].trim() && !lines[i].trim().startsWith('*')) {
          break;
        }
      }
      break;
    }

    // Stop if we hit a non-empty, non-comment line
    if (line && !line.startsWith('//') && !line.startsWith('*')) {
      break;
    }

    // Single-line JSDoc: /** ... */
    if (line.startsWith('/**') && line.endsWith('*/')) {
      foundDoc = true;
      break;
    }

    checkLine--;

    // Don't look too far back
    if (symbolLine - checkLine > 50) {
      break;
    }
  }

  return foundDoc;
}

/**
 * Check for Python docstrings
 * @param {string[]} lines - File lines
 * @param {number} symbolLine - Line number of symbol
 * @returns {boolean} True if documented
 */
function checkPythonDocstring(lines, symbolLine) {
  // Python docstrings appear AFTER the def/class line
  // Look at the next few lines
  for (let i = symbolLine + 1; i < Math.min(lines.length, symbolLine + 5); i++) {
    const line = lines[i].trim();

    // Found a docstring
    if (line.startsWith('"""') || line.startsWith("'''")) {
      return true;
    }

    // Hit code before finding docstring
    if (line && !line.startsWith('#')) {
      break;
    }
  }

  return false;
}

/**
 * Check for PowerShell comment-based help
 * @param {string[]} lines - File lines
 * @param {number} symbolLine - Line number of symbol
 * @param {string} content - Full content
 * @param {object} symbol - Symbol object
 * @returns {boolean} True if documented
 */
function checkPowerShellHelp(lines, symbolLine, content, symbol) {
  // PowerShell comment-based help can appear before function or inside it
  // Look for .SYNOPSIS, .DESCRIPTION, etc.

  // Check before the function
  let checkLine = symbolLine - 1;
  let inCommentBlock = false;
  let foundHelpKeyword = false;

  while (checkLine >= 0 && symbolLine - checkLine < 50) {
    const line = lines[checkLine].trim();

    // Check for help keywords
    if (line.match(/^\.(SYNOPSIS|DESCRIPTION|PARAMETER|EXAMPLE|NOTES|LINK)/i)) {
      foundHelpKeyword = true;
    }

    // In a comment block
    if (line.startsWith('#')) {
      inCommentBlock = true;
    } else if (line.startsWith('<#')) {
      // Multi-line comment start
      inCommentBlock = true;
    } else if (line === '#>' || line.endsWith('#>')) {
      // Multi-line comment end
      if (foundHelpKeyword) {
        return true;
      }
      inCommentBlock = false;
    } else if (line && !inCommentBlock) {
      // Hit non-comment code
      break;
    }

    checkLine--;
  }

  if (foundHelpKeyword) {
    return true;
  }

  // Also check inside the function (first few lines after function declaration)
  for (let i = symbolLine + 1; i < Math.min(lines.length, symbolLine + 20); i++) {
    const line = lines[i].trim();

    if (line.match(/^\.(SYNOPSIS|DESCRIPTION|PARAMETER|EXAMPLE)/i)) {
      return true;
    }

    // If we hit a non-comment, non-empty line, stop looking
    if (line && !line.startsWith('#') && !line.startsWith('Param') && !line.startsWith('[')) {
      break;
    }
  }

  return false;
}

/**
 * Calculate coverage percentage
 * @param {object} results - Results object with documented/undocumented counts
 * @returns {object} Coverage statistics
 */
export function calculateCoverage(results) {
  const total = results.totalSymbols;
  const documented = results.documentedSymbols;
  const percentage = total > 0 ? (documented / total) * 100 : 0;

  return {
    total,
    documented,
    undocumented: results.undocumentedSymbols,
    percentage: Math.round(percentage * 100) / 100
  };
}

/**
 * Generate coverage report in various formats
 * @param {object} results - Analysis results
 * @param {object} options - Report options
 * @returns {string} Formatted report
 */
export function generateReport(results, options = {}) {
  const format = options.format || 'text';

  switch (format) {
    case 'json':
      return generateJSONReport(results);
    case 'markdown':
      return generateMarkdownReport(results, options);
    case 'text':
    default:
      return generateTextReport(results, options);
  }
}

/**
 * Generate JSON report
 */
function generateJSONReport(results) {
  return JSON.stringify(results, null, 2);
}

/**
 * Generate text report
 */
function generateTextReport(results, options) {
  const lines = [];
  const coverage = results.coverage;

  lines.push('  Documentation Coverage Report');
  lines.push('  ' + '='.repeat(50));
  lines.push('');
  lines.push(`  Total Symbols:       ${coverage.total}`);
  lines.push(`  Documented:          ${coverage.documented} (${coverage.percentage}%)`);
  lines.push(`  Undocumented:        ${coverage.undocumented}`);
  lines.push('');

  // Coverage bar
  const barLength = 40;
  const filledLength = Math.round((coverage.percentage / 100) * barLength);
  const emptyLength = barLength - filledLength;
  const bar = '█'.repeat(filledLength) + '░'.repeat(emptyLength);

  let barColor;
  if (coverage.percentage >= 80) barColor = 'green';
  else if (coverage.percentage >= 60) barColor = 'yellow';
  else barColor = 'red';

  lines.push(`  Coverage: ${chalk[barColor](bar)} ${coverage.percentage}%`);
  lines.push('');

  // By type breakdown
  if (options.byType && Object.keys(results.byType).length > 0) {
    lines.push('  Coverage by Symbol Type');
    lines.push('  ' + '-'.repeat(50));

    for (const [type, stats] of Object.entries(results.byType)) {
      const typePercentage = stats.total > 0 ? ((stats.documented / stats.total) * 100).toFixed(1) : 0;
      lines.push(`    ${type.padEnd(15)} ${stats.documented}/${stats.total} (${typePercentage}%)`);
    }
    lines.push('');
  }

  // By file breakdown
  if (options.byFile && results.byFile.length > 0) {
    lines.push('  Coverage by File');
    lines.push('  ' + '-'.repeat(50));

    // Sort by coverage percentage (lowest first)
    const sortedFiles = [...results.byFile].sort((a, b) => {
      const aPercent = a.documented + a.undocumented > 0
        ? (a.documented / (a.documented + a.undocumented)) * 100
        : 0;
      const bPercent = b.documented + b.undocumented > 0
        ? (b.documented / (b.documented + b.undocumented)) * 100
        : 0;
      return aPercent - bPercent;
    });

    for (const file of sortedFiles) {
      const total = file.documented + file.undocumented;
      if (total === 0) continue;

      const filePercentage = ((file.documented / total) * 100).toFixed(1);
      const indicator = filePercentage >= 80 ? chalk.green('✓') :
                       filePercentage >= 60 ? chalk.yellow('○') :
                       chalk.red('✗');

      lines.push(`    ${indicator} ${file.relativePath}`);
      lines.push(`       ${file.documented}/${total} symbols (${filePercentage}%)`);
    }
    lines.push('');
  }

  // Show undocumented symbols
  if (options.showUndocumented) {
    const undocumented = results.files
      .flatMap(f => f.symbols.filter(s => !s.isDocumented));

    if (undocumented.length > 0) {
      lines.push('  Undocumented Symbols');
      lines.push('  ' + '-'.repeat(50));

      for (const symbol of undocumented.slice(0, 50)) { // Limit to 50
        const relPath = symbol.file.replace(process.cwd(), '').replace(/^[/\\]/, '');
        lines.push(`    ${chalk.yellow(symbol.name)} (${symbol.type}) - ${relPath}:${symbol.line}`);
      }

      if (undocumented.length > 50) {
        lines.push(`    ... and ${undocumented.length - 50} more`);
      }
      lines.push('');
    }
  }

  // Show documented symbols
  if (options.showDocumented) {
    const documented = results.files
      .flatMap(f => f.symbols.filter(s => s.isDocumented));

    if (documented.length > 0) {
      lines.push('  Documented Symbols');
      lines.push('  ' + '-'.repeat(50));

      for (const symbol of documented.slice(0, 50)) { // Limit to 50
        const relPath = symbol.file.replace(process.cwd(), '').replace(/^[/\\]/, '');
        lines.push(`    ${chalk.green(symbol.name)} (${symbol.type}) - ${relPath}:${symbol.line}`);
      }

      if (documented.length > 50) {
        lines.push(`    ... and ${documented.length - 50} more`);
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}

/**
 * Generate markdown report
 */
function generateMarkdownReport(results, options) {
  const lines = [];
  const coverage = results.coverage;

  lines.push('# Documentation Coverage Report\n');
  lines.push('> Auto-generated by DocFlow\n');
  lines.push('## Summary\n');
  lines.push('| Metric | Count | Percentage |');
  lines.push('|--------|------:|------------|');
  lines.push(`| Total Symbols | ${coverage.total} | 100% |`);
  lines.push(`| Documented | ${coverage.documented} | ${coverage.percentage}% |`);
  lines.push(`| Undocumented | ${coverage.undocumented} | ${(100 - coverage.percentage).toFixed(2)}% |`);
  lines.push('');

  // Badge
  let badgeColor = 'red';
  if (coverage.percentage >= 80) badgeColor = 'green';
  else if (coverage.percentage >= 60) badgeColor = 'yellow';

  lines.push(`![Coverage](https://img.shields.io/badge/coverage-${coverage.percentage}%25-${badgeColor})\n`);

  // By type
  if (Object.keys(results.byType).length > 0) {
    lines.push('## Coverage by Symbol Type\n');
    lines.push('| Type | Documented | Total | Coverage |');
    lines.push('|------|----------:|------:|----------|');

    for (const [type, stats] of Object.entries(results.byType)) {
      const typePercentage = stats.total > 0 ? ((stats.documented / stats.total) * 100).toFixed(1) : 0;
      lines.push(`| ${type} | ${stats.documented} | ${stats.total} | ${typePercentage}% |`);
    }
    lines.push('');
  }

  // By file
  if (options.byFile && results.byFile.length > 0) {
    lines.push('## Coverage by File\n');
    lines.push('| File | Documented | Total | Coverage |');
    lines.push('|------|----------:|------:|----------|');

    for (const file of results.byFile) {
      const total = file.documented + file.undocumented;
      if (total === 0) continue;

      const filePercentage = ((file.documented / total) * 100).toFixed(1);
      lines.push(`| ${file.relativePath} | ${file.documented} | ${total} | ${filePercentage}% |`);
    }
    lines.push('');
  }

  // Undocumented list
  if (options.showUndocumented) {
    const undocumented = results.files
      .flatMap(f => f.symbols.filter(s => !s.isDocumented));

    if (undocumented.length > 0) {
      lines.push('## Undocumented Symbols\n');

      for (const symbol of undocumented) {
        const relPath = symbol.file.replace(process.cwd(), '').replace(/^[/\\]/, '');
        lines.push(`- \`${symbol.name}\` (${symbol.type}) - ${relPath}:${symbol.line}`);
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}
