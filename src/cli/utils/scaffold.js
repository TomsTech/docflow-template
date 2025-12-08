/**
 * DocFlow Scaffold Utilities
 */

import fse from 'fs-extra';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getDefaultConfig, saveConfig } from './config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Create DocFlow configuration file
 */
export async function createConfig(cwd, options) {
  const config = getDefaultConfig();

  // Override with user options
  config.project.name = options.name;
  config.project.description = options.description || '';
  config.project.type = options.type;
  config.project.language = options.language;

  // Enable selected features
  const features = options.features || [];
  const templateTypes = ['adr', 'runbooks', 'security', 'api', 'database', 'features', 'deployment', 'architecture'];

  for (const type of templateTypes) {
    if (config.templates[type]) {
      config.templates[type].enabled = features.includes(type);
    }
  }

  // Security settings
  config.security.secretScanning.enabled = options.security;
  config.security.codeql.enabled = options.security;

  await saveConfig(cwd, config);
}

/**
 * Create directory structure
 */
export async function createDirectories(cwd, features = []) {
  const directories = [
    '.github/workflows',
    '.github/ISSUE_TEMPLATE',
    'docs',
    'src',
    'tests',
  ];

  // Add feature-specific directories
  const featureDirs = {
    adr: 'docs/architecture/adr',
    runbooks: 'docs/runbooks',
    security: 'docs/security',
    api: 'docs/api',
    database: 'docs/database',
    features: 'docs/features',
    deployment: 'docs/deployment',
    architecture: 'docs/architecture',
  };

  for (const feature of features) {
    if (featureDirs[feature]) {
      directories.push(featureDirs[feature]);
    }
  }

  // Create all directories
  for (const dir of directories) {
    await fse.ensureDir(join(cwd, dir));
  }
}

/**
 * Copy documentation templates
 */
export async function copyTemplates(cwd, features = [], force = false) {
  const templateDir = join(__dirname, '../../../docs/templates');

  const templateMap = {
    adr: 'adr/ADR-000-TEMPLATE.md',
    runbooks: 'runbooks/RB-000-TEMPLATE.md',
    security: 'security/README.md',
    api: 'api/ENDPOINT-TEMPLATE.md',
    database: 'database/TABLE-TEMPLATE.md',
    features: 'features/FEATURE-TEMPLATE.md',
    deployment: 'deployment/README.md',
    architecture: 'architecture/README.md',
  };

  const destMap = {
    adr: 'docs/architecture/adr/README.md',
    runbooks: 'docs/runbooks/README.md',
    security: 'docs/security/README.md',
    api: 'docs/api/README.md',
    database: 'docs/database/README.md',
    features: 'docs/features/README.md',
    deployment: 'docs/deployment/README.md',
    architecture: 'docs/architecture/README.md',
  };

  for (const feature of features) {
    const templateFile = templateMap[feature];
    const destFile = destMap[feature];

    if (!templateFile || !destFile) continue;

    const srcPath = join(templateDir, templateFile);
    const destPath = join(cwd, destFile);

    // Skip if exists and not forcing
    if (!force && await fse.pathExists(destPath)) {
      continue;
    }

    // Check if source template exists
    if (await fse.pathExists(srcPath)) {
      await fse.ensureDir(dirname(destPath));
      await fse.copy(srcPath, destPath);
    } else {
      // Create placeholder
      await fse.ensureDir(dirname(destPath));
      await fse.writeFile(destPath, `# ${feature.charAt(0).toUpperCase() + feature.slice(1)}\n\n> Documentation placeholder\n`);
    }
  }
}

/**
 * Copy GitHub workflows
 */
export async function copyWorkflows(cwd, options = {}) {
  const workflowDir = join(cwd, '.github', 'workflows');
  await fse.ensureDir(workflowDir);

  const workflows = [
    'docflow-quality-gates.yml',
    'docflow-generate-docs.yml',
    'docflow-release.yml',
  ];

  if (options.security !== false) {
    workflows.push('docflow-security-scan.yml');
  }

  const srcWorkflowDir = join(__dirname, '../../../.github/workflows');

  for (const wf of workflows) {
    const srcPath = join(srcWorkflowDir, wf);
    const destPath = join(workflowDir, wf);

    if (await fse.pathExists(srcPath)) {
      await fse.copy(srcPath, destPath);
    }
  }
}
