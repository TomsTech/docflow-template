/**
 * DocFlow CLI
 * Enterprise Documentation & CI/CD Template System
 *
 * (c) 2024-2025 Tom Mangano (TomsTech). All Rights Reserved.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import { initCommand } from './commands/init.js';
import { scaffoldCommand } from './commands/scaffold.js';
import { addCommand } from './commands/add.js';
import { validateCommand } from './commands/validate.js';
import { generateCommand } from './commands/generate.js';
import { aggregateCommand } from './commands/aggregate.js';
import { exportCommand } from './commands/export.js';
import { coverageCommand } from './commands/coverage.js';
import { siteCommand } from './commands/site.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read version from package.json
const pkg = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf-8'));

const program = new Command();

// ASCII banner
const banner = `
${chalk.cyan('╔══════════════════════════════════════════╗')}
${chalk.cyan('║')}   ${chalk.bold.white('DocFlow')} ${chalk.gray('- Enterprise Documentation')}    ${chalk.cyan('║')}
${chalk.cyan('║')}   ${chalk.gray('& CI/CD Template System')}               ${chalk.cyan('║')}
${chalk.cyan('╚══════════════════════════════════════════╝')}
`;

program
  .name('docflow')
  .description('Enterprise Documentation & CI/CD Template System')
  .version(pkg.version)
  .addHelpText('before', banner);

// Register commands
program.addCommand(initCommand);
program.addCommand(scaffoldCommand);
program.addCommand(addCommand);
program.addCommand(validateCommand);
program.addCommand(generateCommand);
program.addCommand(aggregateCommand);
program.addCommand(exportCommand);
program.addCommand(siteCommand);
program.addCommand(coverageCommand);

// Parse arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  console.log(banner);
  program.outputHelp();
}
