/**
 * DocFlow Scaffold Command
 * Generate documentation structure
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import fse from 'fs-extra';
import { join } from 'path';
import { loadConfig } from '../utils/config.js';
import { createDirectories, copyTemplates } from '../utils/scaffold.js';

export const scaffoldCommand = new Command('scaffold')
  .description('Generate documentation structure from config')
  .option('-f, --force', 'Overwrite existing files')
  .option('-p, --preset <preset>', 'Use a preset (full, minimal, architecture, api, security)')
  .action(async (options) => {
    console.log(chalk.cyan('\n  DocFlow Scaffold\n'));

    const cwd = process.cwd();
    const spinner = ora('Loading configuration...').start();

    try {
      // Load config
      const config = await loadConfig(cwd);

      if (!config) {
        spinner.fail('No docflow.config.json found. Run `docflow init` first.');
        process.exit(1);
      }

      spinner.succeed('Configuration loaded');

      // Determine features to scaffold
      let features = [];

      if (options.preset) {
        const presets = {
          full: ['adr', 'runbooks', 'security', 'api', 'database', 'features', 'deployment', 'architecture'],
          minimal: ['adr', 'runbooks'],
          architecture: ['adr', 'architecture'],
          api: ['api', 'database'],
          security: ['security', 'deployment'],
        };
        features = presets[options.preset] || presets.minimal;
      } else {
        // Get from config
        features = Object.entries(config.templates || {})
          .filter(([key, val]) => val?.enabled && key !== 'scaffold' && key !== 'variables')
          .map(([key]) => key);
      }

      // Create directories
      spinner.start('Creating directory structure...');
      await createDirectories(cwd, features);
      spinner.succeed('Created directories');

      // Copy templates
      spinner.start('Copying templates...');
      await copyTemplates(cwd, features, options.force);
      spinner.succeed('Templates copied');

      console.log(chalk.green('\n  Scaffold complete!\n'));
      console.log(chalk.gray('  Created documentation structure for:'));
      features.forEach(f => console.log(chalk.white(`    - ${f}`)));
      console.log('');

    } catch (error) {
      spinner.fail(`Error: ${error.message}`);
      process.exit(1);
    }
  });
