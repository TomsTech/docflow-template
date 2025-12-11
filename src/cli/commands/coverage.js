/**
 * DocFlow Coverage Command
 * Analyze documentation coverage across the codebase
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import fse from 'fs-extra';
import { join } from 'path';
import {
  scanCodebase,
  extractSymbols,
  checkDocumentation,
  generateReport,
  calculateCoverage
} from '../../generators/coverage.js';

export const coverageCommand = new Command('coverage')
  .description('Analyze documentation coverage across the codebase')
  .option('-f, --format <type>', 'Output format (text, json, markdown)', 'text')
  .option('-t, --threshold <percentage>', 'Minimum coverage threshold (0-100)', '0')
  .option('-o, --output <path>', 'Output file path')
  .option('-d, --directory <path>', 'Directory to scan (defaults to cwd)', process.cwd())
  .option('--include <patterns>', 'File patterns to include (comma-separated)', '**/*.js,**/*.jsx,**/*.ts,**/*.tsx,**/*.py,**/*.ps1,**/*.psm1,**/*.go,**/*.rs')
  .option('--exclude <patterns>', 'File patterns to exclude (comma-separated)', '**/node_modules/**,**/dist/**,**/build/**,**/.git/**')
  .option('--show-undocumented', 'Show list of undocumented symbols')
  .option('--show-documented', 'Show list of documented symbols')
  .option('--by-file', 'Show coverage breakdown by file')
  .option('--by-type', 'Show coverage breakdown by symbol type')
  .option('--verbose', 'Show detailed analysis')
  .action(async (options) => {
    console.log(chalk.cyan('\n  DocFlow Documentation Coverage Analysis\n'));

    const spinner = ora('Scanning codebase...').start();
    const cwd = options.directory;

    try {
      // Parse patterns
      const includePatterns = options.include.split(',').map(p => p.trim());
      const excludePatterns = options.exclude.split(',').map(p => p.trim());

      // Validate directory
      if (!await fse.pathExists(cwd)) {
        spinner.fail(`Directory not found: ${cwd}`);
        process.exit(1);
      }

      // Scan codebase
      spinner.text = 'Scanning code files...';
      const files = await scanCodebase(cwd, {
        include: includePatterns,
        exclude: excludePatterns
      });

      if (files.length === 0) {
        spinner.fail('No code files found to analyze');
        process.exit(1);
      }

      spinner.text = `Analyzing ${files.length} files...`;

      // Extract and check symbols
      const results = {
        files: [],
        totalSymbols: 0,
        documentedSymbols: 0,
        undocumentedSymbols: 0,
        byType: {},
        byFile: []
      };

      for (const file of files) {
        const fileResult = {
          path: file,
          relativePath: file.replace(cwd, '').replace(/^[/\\]/, ''),
          symbols: [],
          documented: 0,
          undocumented: 0
        };

        try {
          const content = await fse.readFile(file, 'utf-8');
          const symbols = await extractSymbols(file, content);

          for (const symbol of symbols) {
            const isDocumented = checkDocumentation(symbol, content);

            symbol.isDocumented = isDocumented;

            if (isDocumented) {
              fileResult.documented++;
              results.documentedSymbols++;
            } else {
              fileResult.undocumented++;
              results.undocumentedSymbols++;
            }

            // Count by type
            if (!results.byType[symbol.type]) {
              results.byType[symbol.type] = { total: 0, documented: 0 };
            }
            results.byType[symbol.type].total++;
            if (isDocumented) {
              results.byType[symbol.type].documented++;
            }

            fileResult.symbols.push(symbol);
            results.totalSymbols++;
          }

          if (symbols.length > 0) {
            results.byFile.push(fileResult);
            results.files.push(fileResult);
          }

        } catch (error) {
          if (options.verbose) {
            console.log(chalk.yellow(`\n  Warning: Failed to analyze ${fileResult.relativePath}: ${error.message}`));
          }
        }
      }

      spinner.succeed(`Analyzed ${results.totalSymbols} symbols in ${results.files.length} files`);

      // Calculate coverage
      const coverage = calculateCoverage(results);
      results.coverage = coverage;

      // Generate report
      const report = generateReport(results, {
        format: options.format,
        showUndocumented: options.showUndocumented,
        showDocumented: options.showDocumented,
        byFile: options.byFile,
        byType: options.byType,
        verbose: options.verbose
      });

      // Output report
      if (options.output) {
        await fse.writeFile(options.output, report);
        console.log(chalk.green(`\n  Report saved to: ${options.output}\n`));
      } else {
        console.log('\n' + report + '\n');
      }

      // Check threshold
      const threshold = parseFloat(options.threshold);
      if (threshold > 0 && coverage.percentage < threshold) {
        console.log(chalk.red(`  Coverage ${coverage.percentage.toFixed(2)}% is below threshold ${threshold}%\n`));
        process.exit(1);
      }

      // Exit with success
      if (coverage.percentage === 100) {
        console.log(chalk.green(`  Excellent! 100% documentation coverage!\n`));
      } else if (coverage.percentage >= 80) {
        console.log(chalk.green(`  Great! ${coverage.percentage.toFixed(2)}% documentation coverage\n`));
      } else if (coverage.percentage >= 60) {
        console.log(chalk.yellow(`  Good progress: ${coverage.percentage.toFixed(2)}% documentation coverage\n`));
      } else {
        console.log(chalk.yellow(`  Consider adding more documentation: ${coverage.percentage.toFixed(2)}% coverage\n`));
      }

    } catch (error) {
      spinner.fail(`Error: ${error.message}`);
      if (options.verbose) {
        console.error(error);
      }
      process.exit(1);
    }
  });
