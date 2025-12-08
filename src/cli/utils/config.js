/**
 * DocFlow Configuration Utilities
 */

import fse from 'fs-extra';
import { join } from 'path';

/**
 * Load DocFlow configuration
 */
export async function loadConfig(cwd) {
  const configPath = join(cwd, 'docflow.config.json');

  if (!await fse.pathExists(configPath)) {
    return null;
  }

  try {
    return await fse.readJson(configPath);
  } catch (error) {
    throw new Error(`Failed to parse docflow.config.json: ${error.message}`);
  }
}

/**
 * Load JSON Schema
 */
export async function loadSchema(cwd) {
  const schemaPath = join(cwd, 'docflow.schema.json');

  if (!await fse.pathExists(schemaPath)) {
    // Try to load from package
    try {
      const pkgSchemaPath = new URL('../../docflow.schema.json', import.meta.url).pathname;
      if (await fse.pathExists(pkgSchemaPath)) {
        return await fse.readJson(pkgSchemaPath);
      }
    } catch (e) {
      // Ignore
    }
    return null;
  }

  try {
    return await fse.readJson(schemaPath);
  } catch (error) {
    throw new Error(`Failed to parse docflow.schema.json: ${error.message}`);
  }
}

/**
 * Save DocFlow configuration
 */
export async function saveConfig(cwd, config) {
  const configPath = join(cwd, 'docflow.config.json');

  try {
    await fse.writeJson(configPath, config, { spaces: 2 });
  } catch (error) {
    throw new Error(`Failed to write docflow.config.json: ${error.message}`);
  }
}

/**
 * Merge configuration with defaults
 */
export function mergeWithDefaults(config, defaults) {
  const result = { ...defaults };

  for (const [key, value] of Object.entries(config)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = mergeWithDefaults(value, defaults[key] || {});
    } else {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Get default configuration
 */
export function getDefaultConfig() {
  return {
    version: '1.0.0',
    project: {
      name: '',
      description: '',
      type: 'auto',
      language: 'Australian English',
    },
    folders: {
      enforce: true,
      required: ['.github/workflows', 'docs', 'src', 'tests'],
      optional: ['.design', 'scripts'],
    },
    templates: {
      adr: { enabled: true, directory: 'docs/architecture/adr' },
      runbooks: { enabled: true, directory: 'docs/runbooks' },
      security: { enabled: true, directory: 'docs/security' },
      api: { enabled: true, directory: 'docs/api' },
    },
    security: {
      secretScanning: { enabled: true },
      codeql: { enabled: true },
    },
    linting: {
      enabled: true,
      failOnError: true,
    },
    releases: {
      enabled: true,
      versioning: { strategy: 'semver' },
    },
  };
}
