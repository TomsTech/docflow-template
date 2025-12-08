/**
 * DocFlow Validate Command
 * Validate configuration and project structure
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import fse from 'fs-extra';
import { join } from 'path';
import Ajv from 'ajv';
import { loadConfig, loadSchema } from '../utils/config.js';

export const validateCommand = new Command('validate')
  .description('Validate DocFlow configuration and structure')
  .option('-c, --config-only', 'Only validate configuration file')
  .option('-s, --structure-only', 'Only validate folder structure')
  .option('-v, --verbose', 'Show detailed validation results')
  .action(async (options) => {
    console.log(chalk.cyan('\n  DocFlow Validation\n'));

    const cwd = process.cwd();
    const spinner = ora('Validating...').start();

    const results = {
      config: { valid: false, errors: [] },
      schema: { valid: false, errors: [] },
      structure: { valid: false, errors: [] },
    };

    try {
      // Validate config exists
      const configPath = join(cwd, 'docflow.config.json');

      if (!await fse.pathExists(configPath)) {
        spinner.fail('No docflow.config.json found');
        process.exit(1);
      }

      // Load config
      const config = await loadConfig(cwd);
      results.config.valid = true;

      // Schema validation
      if (!options.structureOnly) {
        spinner.text = 'Validating schema...';

        const schema = await loadSchema(cwd);

        if (schema) {
          const ajv = new Ajv({ allErrors: true });
          const validate = ajv.compile(schema);
          const valid = validate(config);

          if (valid) {
            results.schema.valid = true;
          } else {
            results.schema.errors = validate.errors.map(e =>
              `${e.instancePath || 'root'}: ${e.message}`
            );
          }
        } else {
          results.schema.errors.push('Schema file not found');
        }
      }

      // Structure validation
      if (!options.configOnly) {
        spinner.text = 'Validating structure...';

        const requiredFolders = config.folders?.required || [];
        const missingFolders = [];

        for (const folder of requiredFolders) {
          if (!await fse.pathExists(join(cwd, folder))) {
            missingFolders.push(folder);
          }
        }

        if (missingFolders.length === 0) {
          results.structure.valid = true;
        } else {
          results.structure.errors = missingFolders.map(f => `Missing required folder: ${f}`);
        }
      }

      spinner.stop();

      // Output results
      console.log(chalk.bold('  Results:\n'));

      // Config
      if (!options.structureOnly) {
        const configIcon = results.config.valid ? chalk.green('✓') : chalk.red('✗');
        console.log(`  ${configIcon} Configuration: ${results.config.valid ? 'Valid' : 'Invalid'}`);

        // Schema
        const schemaIcon = results.schema.valid ? chalk.green('✓') : chalk.yellow('⚠');
        console.log(`  ${schemaIcon} Schema: ${results.schema.valid ? 'Valid' : 'Issues found'}`);

        if (results.schema.errors.length && options.verbose) {
          results.schema.errors.forEach(e => console.log(chalk.gray(`      - ${e}`)));
        }
      }

      // Structure
      if (!options.configOnly) {
        const structIcon = results.structure.valid ? chalk.green('✓') : chalk.red('✗');
        console.log(`  ${structIcon} Structure: ${results.structure.valid ? 'Valid' : 'Issues found'}`);

        if (results.structure.errors.length) {
          results.structure.errors.forEach(e => console.log(chalk.yellow(`      - ${e}`)));
        }
      }

      console.log('');

      // Exit code
      const allValid = results.config.valid &&
        (options.configOnly || results.structure.valid) &&
        (options.structureOnly || results.schema.valid || results.schema.errors.length === 0);

      if (allValid) {
        console.log(chalk.green('  All validations passed!\n'));
      } else {
        console.log(chalk.yellow('  Some validations failed. Run with --verbose for details.\n'));
        process.exit(1);
      }

    } catch (error) {
      spinner.fail(`Error: ${error.message}`);
      process.exit(1);
    }
  });
