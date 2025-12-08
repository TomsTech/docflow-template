/**
 * DocFlow Export Command
 * Export documentation to various formats (PDF, DOCX, etc.)
 *
 * (c) 2024-2025 Tom Mangano (TomsTech). All Rights Reserved.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import fse from 'fs-extra';
import { join, resolve, extname, basename } from 'path';
import { glob } from 'glob';
import { loadConfig } from '../utils/config.js';
import { generatePDF } from '../../generators/pdf.js';

export const exportCommand = new Command('export')
  .description('Export documentation to various formats');

// PDF Export Subcommand
exportCommand
  .command('pdf')
  .description('Generate PDF reports from documentation')
  .option('-i, --input <path>', 'Input directory or specific files (comma-separated)', 'docs')
  .option('-o, --output <path>', 'Output PDF path', 'documentation.pdf')
  .option('-t, --template <type>', 'Report template (executive, technical, full)', 'technical')
  .option('--toc', 'Include table of contents', false)
  .option('--cover', 'Include cover page', true)
  .option('--header <text>', 'Custom header text')
  .option('--footer <text>', 'Custom footer text')
  .option('-f, --force', 'Overwrite existing output file')
  .action(async (options) => {
    console.log(chalk.cyan('\n  DocFlow Export: PDF\n'));

    const cwd = process.cwd();
    const spinner = ora('Loading configuration...').start();

    try {
      // Load configuration
      const config = await loadConfig(cwd);

      if (!config) {
        spinner.warn('No docflow.config.json found. Using defaults.');
      } else {
        spinner.succeed('Configuration loaded');
      }

      // Resolve input paths
      spinner.start('Resolving input files...');
      const inputPaths = options.input.split(',').map(p => p.trim());
      const inputFiles = [];

      for (const inputPath of inputPaths) {
        const fullPath = resolve(cwd, inputPath);

        if (await fse.pathExists(fullPath)) {
          const stat = await fse.stat(fullPath);

          if (stat.isDirectory()) {
            // Find all markdown files in directory
            const files = await glob('**/*.md', {
              cwd: fullPath,
              absolute: true,
              ignore: ['node_modules/**', '.git/**', 'dist/**', 'build/**']
            });
            inputFiles.push(...files);
          } else if (stat.isFile() && extname(fullPath) === '.md') {
            inputFiles.push(fullPath);
          }
        } else {
          spinner.warn(`Path not found: ${inputPath}`);
        }
      }

      if (inputFiles.length === 0) {
        spinner.fail('No markdown files found to export');
        process.exit(1);
      }

      spinner.succeed(`Found ${inputFiles.length} file(s) to export`);

      // Resolve output path
      const outputPath = resolve(cwd, options.output);

      // Check if output exists
      if (await fse.pathExists(outputPath) && !options.force) {
        spinner.fail(`Output file exists: ${outputPath}\nUse --force to overwrite`);
        process.exit(1);
      }

      // Ensure output directory exists
      await fse.ensureDir(resolve(outputPath, '..'));

      // Validate template
      const validTemplates = ['executive', 'technical', 'full'];
      if (!validTemplates.includes(options.template)) {
        spinner.fail(`Invalid template: ${options.template}\nValid options: ${validTemplates.join(', ')}`);
        process.exit(1);
      }

      // Generate PDF
      spinner.start('Generating PDF report...');

      const pdfOptions = {
        inputFiles,
        outputPath,
        template: options.template,
        includeToc: options.toc,
        includeCover: options.cover,
        customHeader: options.header,
        customFooter: options.footer,
        config,
        cwd
      };

      await generatePDF(pdfOptions);

      spinner.succeed(`PDF generated: ${outputPath}`);

      // Show file size
      const stat = await fse.stat(outputPath);
      const sizeMB = (stat.size / 1024 / 1024).toFixed(2);
      console.log(chalk.gray(`  File size: ${sizeMB} MB`));
      console.log(chalk.gray(`  Template: ${options.template}`));
      console.log(chalk.gray(`  Files processed: ${inputFiles.length}`));

      console.log(chalk.green('\n  Export complete!\n'));

    } catch (error) {
      spinner.fail(`Error: ${error.message}`);
      if (process.env.DEBUG) {
        console.error(error);
      }
      process.exit(1);
    }
  });

// DOCX Export Subcommand (placeholder for future)
exportCommand
  .command('docx')
  .description('Generate DOCX reports from documentation (coming soon)')
  .option('-i, --input <path>', 'Input directory or specific files', 'docs')
  .option('-o, --output <path>', 'Output DOCX path', 'documentation.docx')
  .action(() => {
    console.log(chalk.yellow('\n  DOCX export is not yet implemented.\n'));
    console.log(chalk.gray('  Use `docflow export pdf` instead.\n'));
  });

// HTML Export Subcommand (placeholder for future)
exportCommand
  .command('html')
  .description('Generate static HTML documentation (coming soon)')
  .option('-i, --input <path>', 'Input directory', 'docs')
  .option('-o, --output <path>', 'Output directory', 'docs-html')
  .action(() => {
    console.log(chalk.yellow('\n  HTML export is not yet implemented.\n'));
    console.log(chalk.gray('  Use `docflow export pdf` instead.\n'));
  });
