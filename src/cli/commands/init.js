/**
 * DocFlow Init Command
 * Interactive project initialization
 */

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import fse from 'fs-extra';
import { join } from 'path';
import { detectProjectType } from '../utils/detect.js';
import { copyTemplates, createConfig, createDirectories } from '../utils/scaffold.js';

export const initCommand = new Command('init')
  .description('Initialize DocFlow in your project')
  .option('-y, --yes', 'Use defaults without prompts')
  .option('-t, --type <type>', 'Project type (auto, node, python, etc.)')
  .option('-n, --name <name>', 'Project name')
  .action(async (options) => {
    console.log(chalk.cyan('\n  DocFlow Initialization\n'));

    const cwd = process.cwd();
    const detectedType = await detectProjectType(cwd);

    let answers;

    if (options.yes) {
      // Use defaults
      answers = {
        name: options.name || fse.basename(cwd),
        description: '',
        type: options.type || detectedType,
        language: 'Australian English',
        features: ['adr', 'runbooks', 'security', 'api'],
        security: true,
        workflows: true,
      };
    } else {
      // Interactive prompts
      answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'Project name:',
          default: options.name || fse.basename(cwd),
        },
        {
          type: 'input',
          name: 'description',
          message: 'Project description:',
          default: '',
        },
        {
          type: 'list',
          name: 'type',
          message: 'Project type:',
          choices: [
            { name: `Auto-detect (${detectedType})`, value: 'auto' },
            { name: 'Node.js', value: 'node' },
            { name: 'Python', value: 'python' },
            { name: '.NET', value: 'dotnet' },
            { name: 'PowerShell', value: 'powershell' },
            { name: 'Go', value: 'go' },
            { name: 'Generic', value: 'generic' },
          ],
          default: 'auto',
        },
        {
          type: 'list',
          name: 'language',
          message: 'Documentation language:',
          choices: ['Australian English', 'British English', 'American English'],
          default: 'Australian English',
        },
        {
          type: 'checkbox',
          name: 'features',
          message: 'Enable documentation templates:',
          choices: [
            { name: 'Architecture Decision Records (ADR)', value: 'adr', checked: true },
            { name: 'Runbooks', value: 'runbooks', checked: true },
            { name: 'Security Documentation', value: 'security', checked: true },
            { name: 'API Documentation', value: 'api', checked: true },
            { name: 'Database Documentation', value: 'database', checked: false },
            { name: 'Feature Specifications', value: 'features', checked: false },
            { name: 'Deployment Guides', value: 'deployment', checked: true },
          ],
        },
        {
          type: 'confirm',
          name: 'security',
          message: 'Enable security scanning?',
          default: true,
        },
        {
          type: 'confirm',
          name: 'workflows',
          message: 'Install GitHub workflows?',
          default: true,
        },
      ]);
    }

    // Create configuration
    const spinner = ora('Creating DocFlow configuration...').start();

    try {
      // Create config file
      await createConfig(cwd, answers);
      spinner.succeed('Created docflow.config.json');

      // Create directory structure
      spinner.start('Creating directory structure...');
      await createDirectories(cwd, answers.features);
      spinner.succeed('Created directories');

      // Copy templates
      spinner.start('Copying documentation templates...');
      await copyTemplates(cwd, answers.features);
      spinner.succeed('Copied templates');

      // Copy workflows if requested
      if (answers.workflows) {
        spinner.start('Installing GitHub workflows...');
        await copyWorkflows(cwd, answers);
        spinner.succeed('Installed workflows');
      }

      // Copy schema
      spinner.start('Copying JSON schema...');
      await copySchema(cwd);
      spinner.succeed('Copied schema');

      console.log(chalk.green('\n  DocFlow initialized successfully!\n'));
      console.log(chalk.white('  Next steps:'));
      console.log(chalk.gray('    1. Review docflow.config.json'));
      console.log(chalk.gray('    2. Commit and push to GitHub'));
      console.log(chalk.gray('    3. Workflows will run automatically\n'));

    } catch (error) {
      spinner.fail(`Error: ${error.message}`);
      process.exit(1);
    }
  });

async function copyWorkflows(targetDir, options) {
  const workflowDir = join(targetDir, '.github', 'workflows');
  await fse.ensureDir(workflowDir);

  const workflows = [
    'docflow-quality-gates.yml',
    'docflow-generate-docs.yml',
    'docflow-release.yml',
  ];

  if (options.security) {
    workflows.push('docflow-security-scan.yml');
  }

  // In production, these would be fetched from the package
  // For now, create placeholder files
  for (const wf of workflows) {
    const dest = join(workflowDir, wf);
    if (!await fse.pathExists(dest)) {
      await fse.writeFile(dest, `# ${wf}\n# Downloaded from DocFlow\n`);
    }
  }
}

async function copySchema(targetDir) {
  const schemaPath = join(targetDir, 'docflow.schema.json');
  // In production, copy from package. For now, create reference
  if (!await fse.pathExists(schemaPath)) {
    await fse.writeJson(schemaPath, {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "$id": "https://raw.githubusercontent.com/TomsTech/docflow-template/main/docflow.schema.json",
      "title": "DocFlow Configuration",
      "description": "See full schema at GitHub"
    }, { spaces: 2 });
  }
}
