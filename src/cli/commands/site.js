/**
 * DocFlow Site Command
 * Static documentation site generation and deployment
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import fse from 'fs-extra';
import { join } from 'path';
import { spawn } from 'child_process';
import { initSite, buildSite, serveSite, deploySite, validateSiteConfig } from '../../generators/site.js';
import { loadConfig } from '../utils/config.js';

export const siteCommand = new Command('site')
  .description('Generate and manage static documentation sites')
  .addCommand(
    new Command('init')
      .description('Initialize documentation site configuration')
      .option('-g, --generator <type>', 'Site generator (vitepress, docusaurus)', 'vitepress')
      .option('-f, --force', 'Overwrite existing configuration')
      .action(async (options) => {
        console.log(chalk.cyan('\n  Initializing Documentation Site\n'));

        const cwd = process.cwd();
        const spinner = ora('Loading DocFlow configuration...').start();

        try {
          // Load DocFlow config
          const config = await loadConfig(cwd);
          spinner.succeed('Loaded DocFlow configuration');

          // Check if site already initialized
          const siteConfigPath = join(cwd, '.vitepress', 'config.js');
          const docusaurusConfigPath = join(cwd, 'docusaurus.config.js');

          if (!options.force && (await fse.pathExists(siteConfigPath) || await fse.pathExists(docusaurusConfigPath))) {
            spinner.fail('Site already initialized. Use --force to reinitialize');
            process.exit(1);
          }

          // Initialize site
          spinner.start(`Initializing ${options.generator} site...`);
          const result = await initSite(cwd, config, options.generator);
          spinner.succeed(`Initialized ${options.generator} site`);

          console.log(chalk.green('\n  Documentation site initialized successfully!\n'));
          console.log(chalk.white('  Files created:'));
          result.files.forEach(file => {
            console.log(chalk.gray(`    - ${file}`));
          });
          console.log(chalk.white('\n  Next steps:'));
          console.log(chalk.gray('    1. Review the site configuration'));
          console.log(chalk.gray('    2. Run: docflow site serve'));
          console.log(chalk.gray('    3. Run: docflow site build'));
          console.log(chalk.gray('    4. Run: docflow site deploy\n'));

        } catch (error) {
          spinner.fail(`Error: ${error.message}`);
          console.error(chalk.red(`\n  ${error.stack}\n`));
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('build')
      .description('Build the static documentation site')
      .option('-o, --output <dir>', 'Output directory', '.vitepress/dist')
      .option('-b, --base <path>', 'Base URL path', '/')
      .option('--clean', 'Clean output directory before build', false)
      .action(async (options) => {
        console.log(chalk.cyan('\n  Building Documentation Site\n'));

        const cwd = process.cwd();
        const spinner = ora('Loading configuration...').start();

        try {
          // Load configurations
          const config = await loadConfig(cwd);
          const siteConfig = await validateSiteConfig(cwd);
          spinner.succeed('Configuration loaded');

          // Clean output directory if requested
          if (options.clean) {
            spinner.start('Cleaning output directory...');
            await fse.emptyDir(join(cwd, options.output));
            spinner.succeed('Output directory cleaned');
          }

          // Build site
          spinner.start('Building static site...');
          const result = await buildSite(cwd, {
            ...config,
            ...siteConfig,
            output: options.output,
            base: options.base
          });
          spinner.succeed('Site built successfully');

          console.log(chalk.green('\n  Build completed!\n'));
          console.log(chalk.white('  Output directory:'));
          console.log(chalk.gray(`    ${result.outputPath}\n`));
          console.log(chalk.white('  Statistics:'));
          console.log(chalk.gray(`    Pages: ${result.stats.pages}`));
          console.log(chalk.gray(`    Assets: ${result.stats.assets}`));
          console.log(chalk.gray(`    Size: ${formatBytes(result.stats.size)}\n`));

        } catch (error) {
          spinner.fail(`Build failed: ${error.message}`);
          console.error(chalk.red(`\n  ${error.stack}\n`));
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('serve')
      .description('Serve the documentation site locally')
      .option('-p, --port <number>', 'Port number', '5173')
      .option('-h, --host <address>', 'Host address', 'localhost')
      .option('--open', 'Open browser automatically', false)
      .action(async (options) => {
        console.log(chalk.cyan('\n  Starting Development Server\n'));

        const cwd = process.cwd();
        const spinner = ora('Loading configuration...').start();

        try {
          // Load configurations
          const config = await loadConfig(cwd);
          const siteConfig = await validateSiteConfig(cwd);
          spinner.succeed('Configuration loaded');

          // Start dev server
          spinner.start(`Starting server on ${options.host}:${options.port}...`);
          const server = await serveSite(cwd, {
            ...config,
            ...siteConfig,
            port: parseInt(options.port),
            host: options.host,
            open: options.open
          });

          spinner.succeed(`Server running at ${chalk.green(`http://${options.host}:${options.port}`)}`);

          console.log(chalk.white('\n  Press Ctrl+C to stop\n'));

          // Keep process alive
          process.on('SIGINT', () => {
            console.log(chalk.yellow('\n  Shutting down server...\n'));
            server.close();
            process.exit(0);
          });

        } catch (error) {
          spinner.fail(`Failed to start server: ${error.message}`);
          console.error(chalk.red(`\n  ${error.stack}\n`));
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('deploy')
      .description('Deploy documentation site to GitHub Pages')
      .option('-b, --branch <name>', 'Target branch', 'gh-pages')
      .option('-m, --message <msg>', 'Commit message', 'Deploy documentation site')
      .option('--dry-run', 'Simulate deployment without pushing', false)
      .action(async (options) => {
        console.log(chalk.cyan('\n  Deploying Documentation Site\n'));

        const cwd = process.cwd();
        const spinner = ora('Loading configuration...').start();

        try {
          // Load configurations
          const config = await loadConfig(cwd);
          const siteConfig = await validateSiteConfig(cwd);
          spinner.succeed('Configuration loaded');

          // Build site first
          spinner.start('Building site for deployment...');
          const buildResult = await buildSite(cwd, {
            ...config,
            ...siteConfig,
            production: true
          });
          spinner.succeed('Site built');

          // Deploy
          spinner.start(`Deploying to ${options.branch} branch...`);
          const deployResult = await deploySite(cwd, {
            ...config,
            buildPath: buildResult.outputPath,
            branch: options.branch,
            message: options.message,
            dryRun: options.dryRun
          });

          if (options.dryRun) {
            spinner.succeed('Dry run completed (no changes pushed)');
          } else {
            spinner.succeed('Deployment successful');
          }

          console.log(chalk.green('\n  Deployment completed!\n'));
          console.log(chalk.white('  Details:'));
          console.log(chalk.gray(`    Branch: ${options.branch}`));
          console.log(chalk.gray(`    Commit: ${deployResult.commit}`));
          if (deployResult.url) {
            console.log(chalk.gray(`    URL: ${chalk.blue(deployResult.url)}`));
          }
          console.log();

        } catch (error) {
          spinner.fail(`Deployment failed: ${error.message}`);
          console.error(chalk.red(`\n  ${error.stack}\n`));
          process.exit(1);
        }
      })
  );

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
