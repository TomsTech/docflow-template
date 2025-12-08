/**
 * DocFlow Aggregate Command
 * Aggregate documentation from multiple repositories
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import fse from 'fs-extra';
import { join } from 'path';
import { loadConfig } from '../utils/config.js';
import {
  cloneRepos,
  extractDocs,
  mergeDocumentation,
  generateIndex,
  linkCrossReferences
} from '../../generators/aggregate.js';

export const aggregateCommand = new Command('aggregate')
  .description('Aggregate documentation from multiple repositories')
  .option('-c, --config <path>', 'Path to aggregation config (defaults to docflow.config.json)')
  .option('-o, --output <dir>', 'Output directory for aggregated docs', 'docs/aggregated')
  .option('-r, --repos <repos>', 'Comma-separated list of repos (e.g., org/repo1,org/repo2)')
  .option('--clone', 'Clone repos if not present locally')
  .option('--clean', 'Clean output directory before aggregating')
  .option('-s, --sections <sections>', 'Comma-separated sections to aggregate (e.g., adr,api,runbooks)')
  .action(async (options) => {
    console.log(chalk.cyan('\n  DocFlow Aggregate\n'));

    const cwd = process.cwd();
    let spinner = ora('Loading configuration...').start();

    try {
      // Load configuration
      const config = await loadConfig(cwd);

      if (!config && !options.repos) {
        spinner.fail('No docflow.config.json found and no --repos specified. Run `docflow init` first or provide --repos.');
        process.exit(1);
      }

      spinner.succeed('Configuration loaded');

      // Determine repos to aggregate
      let repos = [];
      let sections = [];
      let outputDir = options.output;

      if (options.repos) {
        repos = options.repos.split(',').map(r => r.trim());
      } else if (config?.aggregate?.repos) {
        repos = config.aggregate.repos;
      } else {
        spinner.fail('No repositories specified. Use --repos or configure aggregate.repos in docflow.config.json');
        process.exit(1);
      }

      // Determine sections to aggregate
      if (options.sections) {
        sections = options.sections.split(',').map(s => s.trim());
      } else if (config?.aggregate?.sections) {
        sections = config.aggregate.sections;
      }

      // Override output dir from config
      if (config?.aggregate?.output) {
        outputDir = options.output === 'docs/aggregated' ? config.aggregate.output : options.output;
      }

      const outputPath = join(cwd, outputDir);

      console.log(chalk.blue(`\n  Repositories: ${repos.length}`));
      console.log(chalk.gray(`  ${repos.join(', ')}\n`));

      if (sections.length > 0) {
        console.log(chalk.blue(`  Sections: ${sections.join(', ')}\n`));
      }

      // Clean output directory if requested
      if (options.clean && await fse.pathExists(outputPath)) {
        spinner.start('Cleaning output directory...');
        await fse.emptyDir(outputPath);
        spinner.succeed('Output directory cleaned');
      }

      // Clone repositories if needed
      if (options.clone) {
        spinner.start(`Cloning ${repos.length} repositories...`);
        try {
          const targetDir = join(cwd, '.docflow', 'repos');
          const clonedRepos = await cloneRepos(repos, targetDir);
          spinner.succeed(`Cloned ${clonedRepos.length} repositories`);
        } catch (error) {
          spinner.fail(`Failed to clone repositories: ${error.message}`);
          throw error;
        }
      }

      // Extract documentation from each repo
      spinner.start('Extracting documentation from repositories...');
      const allDocs = [];
      const repoDir = options.clone ? join(cwd, '.docflow', 'repos') : cwd;

      for (const repo of repos) {
        try {
          const repoName = repo.split('/').pop();
          const repoPath = options.clone ? join(repoDir, repoName) : join(cwd, '..', repoName);

          const docs = await extractDocs(repoPath, { sections });
          allDocs.push({
            repo,
            repoName,
            docs
          });

          spinner.text = `Extracted documentation from ${allDocs.length}/${repos.length} repos...`;
        } catch (error) {
          console.warn(chalk.yellow(`\n  Warning: Failed to extract from ${repo}: ${error.message}`));
        }
      }

      spinner.succeed(`Extracted documentation from ${allDocs.length} repositories`);

      // Merge documentation
      spinner.start('Merging documentation...');
      const merged = await mergeDocumentation(allDocs, { sections });
      spinner.succeed('Documentation merged');

      // Link cross-references
      spinner.start('Linking cross-repo references...');
      const linked = await linkCrossReferences(merged);
      spinner.succeed('Cross-references linked');

      // Generate index
      spinner.start('Generating unified index...');
      const index = await generateIndex(linked, { repos, sections });
      spinner.succeed('Index generated');

      // Write aggregated documentation
      spinner.start('Writing aggregated documentation...');
      await fse.ensureDir(outputPath);

      // Write index
      await fse.writeFile(
        join(outputPath, 'INDEX.md'),
        index,
        'utf-8'
      );

      // Write merged documents by section
      for (const [section, documents] of Object.entries(linked)) {
        const sectionDir = join(outputPath, section);
        await fse.ensureDir(sectionDir);

        for (const doc of documents) {
          const docPath = join(sectionDir, doc.filename);
          await fse.writeFile(docPath, doc.content, 'utf-8');
        }
      }

      spinner.succeed(`Aggregated documentation written to ${outputDir}`);

      // Summary
      console.log(chalk.green('\n  Aggregation complete!\n'));
      console.log(chalk.gray(`  Output: ${outputDir}`));
      console.log(chalk.gray(`  Sections: ${Object.keys(linked).length}`));

      const totalDocs = Object.values(linked).reduce((sum, docs) => sum + docs.length, 0);
      console.log(chalk.gray(`  Documents: ${totalDocs}\n`));

    } catch (error) {
      spinner.fail(`Error: ${error.message}`);
      if (process.env.DEBUG) {
        console.error(error);
      }
      process.exit(1);
    }
  });
