/**
 * DocFlow Add Command
 * Add new documentation from templates
 */

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import fse from 'fs-extra';
import { join } from 'path';
import { loadConfig } from '../utils/config.js';
import { substituteVariables } from '../utils/template.js';

export const addCommand = new Command('add')
  .description('Add new documentation from templates')
  .argument('<type>', 'Template type (adr, runbook, feature, api, database)')
  .option('-n, --name <name>', 'Name/title for the document')
  .option('-o, --output <path>', 'Output path')
  .action(async (type, options) => {
    console.log(chalk.cyan(`\n  DocFlow Add: ${type}\n`));

    const cwd = process.cwd();
    const spinner = ora('Loading configuration...').start();

    try {
      const config = await loadConfig(cwd);

      if (!config) {
        spinner.fail('No docflow.config.json found. Run `docflow init` first.');
        process.exit(1);
      }

      spinner.succeed('Configuration loaded');

      // Get template settings
      const templateConfig = config.templates?.[type === 'runbook' ? 'runbooks' : type];

      if (!templateConfig?.enabled) {
        console.log(chalk.yellow(`  Template type '${type}' is not enabled in config.`));
        process.exit(1);
      }

      // Prompt for details if not provided
      let name = options.name;
      let description = '';

      if (!name) {
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'name',
            message: `${type.charAt(0).toUpperCase() + type.slice(1)} name/title:`,
            validate: (input) => input.length > 0 || 'Name is required',
          },
          {
            type: 'input',
            name: 'description',
            message: 'Brief description:',
          },
        ]);
        name = answers.name;
        description = answers.description;
      }

      // Generate filename
      const prefix = templateConfig.prefix || type.toUpperCase();
      const number = await getNextNumber(cwd, templateConfig.directory, prefix);
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const filename = `${prefix}-${number.toString().padStart(3, '0')}-${slug}.md`;

      // Get output path
      const outputDir = options.output || templateConfig.directory || `docs/${type}`;
      const outputPath = join(cwd, outputDir, filename);

      spinner.start(`Creating ${filename}...`);

      // Load and process template
      const templatePath = templateConfig.template;
      let content;

      if (templatePath && await fse.pathExists(join(cwd, templatePath))) {
        content = await fse.readFile(join(cwd, templatePath), 'utf-8');
      } else {
        // Use default template
        content = getDefaultTemplate(type);
      }

      // Substitute variables
      const variables = {
        ...config.templates?.variables,
        NAME: name,
        TITLE: name,
        DESCRIPTION: description,
        NUMBER: number.toString().padStart(3, '0'),
        PREFIX: prefix,
        DATE: new Date().toISOString().split('T')[0],
        AUTHOR: process.env.USER || process.env.USERNAME || 'Unknown',
      };

      content = substituteVariables(content, variables);

      // Write file
      await fse.ensureDir(join(cwd, outputDir));
      await fse.writeFile(outputPath, content);

      spinner.succeed(`Created ${outputDir}/${filename}`);

      console.log(chalk.green(`\n  Created: ${outputPath}\n`));

    } catch (error) {
      spinner.fail(`Error: ${error.message}`);
      process.exit(1);
    }
  });

async function getNextNumber(cwd, directory, prefix) {
  const dir = join(cwd, directory || 'docs');

  if (!await fse.pathExists(dir)) {
    return 1;
  }

  const files = await fse.readdir(dir);
  const pattern = new RegExp(`^${prefix}-(\\d+)`);

  let maxNumber = 0;
  for (const file of files) {
    const match = file.match(pattern);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNumber) maxNumber = num;
    }
  }

  return maxNumber + 1;
}

function getDefaultTemplate(type) {
  const templates = {
    adr: `# ADR-{{NUMBER}}: {{TITLE}}

> {{DESCRIPTION}}

## Status

Proposed

## Context

<!-- Describe the context and problem statement -->

## Decision

<!-- Describe the decision that was made -->

## Consequences

### Positive

-

### Negative

-

### Neutral

-

---

*Created: {{DATE}} by {{AUTHOR}}*
`,
    runbook: `# RB-{{NUMBER}}: {{TITLE}}

> {{DESCRIPTION}}

## Overview

| Property | Value |
|----------|-------|
| Category | |
| Severity | |
| On-Call | |

## Prerequisites

-

## Procedure

### Step 1

<!-- Step details -->

### Step 2

<!-- Step details -->

## Verification

<!-- How to verify success -->

## Rollback

<!-- Rollback procedure if needed -->

---

*Created: {{DATE}} by {{AUTHOR}}*
`,
    feature: `# Feature: {{TITLE}}

> {{DESCRIPTION}}

## User Story

As a [user type],
I want [goal],
So that [benefit].

## Acceptance Criteria

- [ ]
- [ ]
- [ ]

## Technical Notes

<!-- Implementation details -->

## Related

- ADR:
- Epic:

---

*Created: {{DATE}} by {{AUTHOR}}*
`,
    api: `# API: {{TITLE}}

> {{DESCRIPTION}}

## Endpoint

\`\`\`
METHOD /path
\`\`\`

## Request

### Headers

| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | Bearer token |

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| | | | |

### Body

\`\`\`json
{
}
\`\`\`

## Response

### Success (200)

\`\`\`json
{
}
\`\`\`

### Errors

| Code | Description |
|------|-------------|
| 400 | Bad Request |
| 401 | Unauthorised |

---

*Created: {{DATE}} by {{AUTHOR}}*
`,
    database: `# Table: {{TITLE}}

> {{DESCRIPTION}}

## Schema

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | Primary key |
| | | | | |

## Relationships

| Relation | Table | Type | FK |
|----------|-------|------|-----|
| | | | |

## Indexes

| Name | Columns | Unique |
|------|---------|--------|
| | | |

## Sample Data

\`\`\`sql
SELECT * FROM table_name LIMIT 5;
\`\`\`

---

*Created: {{DATE}} by {{AUTHOR}}*
`,
  };

  return templates[type] || templates.feature;
}
