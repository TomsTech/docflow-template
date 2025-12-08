/**
 * DocFlow Site Generator
 * Static documentation site generation with VitePress and Docusaurus
 */

import fse from 'fs-extra';
import { join, relative, dirname, basename } from 'path';
import { glob } from 'glob';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Initialize documentation site
 * @param {string} cwd - Current working directory
 * @param {object} config - DocFlow configuration
 * @param {string} generator - Site generator (vitepress or docusaurus)
 * @returns {Promise<object>} Initialization result
 */
export async function initSite(cwd, config, generator = 'vitepress') {
  const files = [];

  if (generator === 'vitepress') {
    // Create .vitepress directory
    const vitepressDir = join(cwd, '.vitepress');
    await fse.ensureDir(vitepressDir);

    // Copy VitePress config template
    const configPath = join(vitepressDir, 'config.js');
    const configContent = await generateVitePressConfig(config);
    await fse.writeFile(configPath, configContent);
    files.push('.vitepress/config.js');

    // Create theme directory
    const themeDir = join(vitepressDir, 'theme');
    await fse.ensureDir(themeDir);

    // Copy theme files
    const themeIndexPath = join(themeDir, 'index.js');
    const themeIndexContent = generateVitePressTheme(config);
    await fse.writeFile(themeIndexPath, themeIndexContent);
    files.push('.vitepress/theme/index.js');

    const themeCssPath = join(themeDir, 'custom.css');
    const themeCssContent = generateThemeCSS(config);
    await fse.writeFile(themeCssPath, themeCssContent);
    files.push('.vitepress/theme/custom.css');

    // Generate navigation
    const navigation = await generateNavigation(cwd, config);
    const navPath = join(vitepressDir, 'navigation.json');
    await fse.writeJson(navPath, navigation, { spaces: 2 });
    files.push('.vitepress/navigation.json');

    // Create index.md if it doesn't exist
    const indexPath = join(cwd, 'docs', 'index.md');
    if (!await fse.pathExists(indexPath)) {
      await fse.ensureDir(join(cwd, 'docs'));
      const indexContent = generateIndexPage(config);
      await fse.writeFile(indexPath, indexContent);
      files.push('docs/index.md');
    }

  } else if (generator === 'docusaurus') {
    // Copy Docusaurus config template
    const configPath = join(cwd, 'docusaurus.config.js');
    const configContent = await generateDocusaurusConfig(config);
    await fse.writeFile(configPath, configContent);
    files.push('docusaurus.config.js');

    // Create src directory
    const srcDir = join(cwd, 'src');
    await fse.ensureDir(srcDir);

    // Create custom CSS
    const cssDir = join(srcDir, 'css');
    await fse.ensureDir(cssDir);
    const cssPath = join(cssDir, 'custom.css');
    const cssContent = generateThemeCSS(config);
    await fse.writeFile(cssPath, cssContent);
    files.push('src/css/custom.css');

    // Generate sidebar
    const navigation = await generateNavigation(cwd, config);
    const sidebarPath = join(cwd, 'sidebars.js');
    const sidebarContent = generateDocusaurusSidebar(navigation);
    await fse.writeFile(sidebarPath, sidebarContent);
    files.push('sidebars.js');

  } else {
    throw new Error(`Unsupported generator: ${generator}`);
  }

  return { files, generator };
}

/**
 * Build static documentation site
 * @param {string} cwd - Current working directory
 * @param {object} config - Site configuration
 * @returns {Promise<object>} Build result
 */
export async function buildSite(cwd, config) {
  const generator = await detectGenerator(cwd);
  const outputPath = config.output || join(cwd, '.vitepress', 'dist');

  let buildCommand, buildArgs;

  if (generator === 'vitepress') {
    buildCommand = 'npx';
    buildArgs = ['vitepress', 'build', 'docs'];
  } else if (generator === 'docusaurus') {
    buildCommand = 'npm';
    buildArgs = ['run', 'build'];
  } else {
    throw new Error('No site generator detected. Run: docflow site init');
  }

  // Run build command
  await executeCommand(buildCommand, buildArgs, cwd);

  // Get build statistics
  const stats = await getBuildStats(outputPath);

  return {
    outputPath,
    generator,
    stats
  };
}

/**
 * Serve documentation site locally
 * @param {string} cwd - Current working directory
 * @param {object} config - Server configuration
 * @returns {Promise<object>} Server instance
 */
export async function serveSite(cwd, config) {
  const generator = await detectGenerator(cwd);

  let serveCommand, serveArgs;

  if (generator === 'vitepress') {
    serveArgs = ['vitepress', 'dev', 'docs', '--port', config.port.toString()];
    if (config.host) {
      serveArgs.push('--host', config.host);
    }
    if (config.open) {
      serveArgs.push('--open');
    }
    serveCommand = 'npx';
  } else if (generator === 'docusaurus') {
    serveArgs = ['run', 'start', '--', '--port', config.port.toString()];
    if (config.host) {
      serveArgs.push('--host', config.host);
    }
    serveCommand = 'npm';
  } else {
    throw new Error('No site generator detected. Run: docflow site init');
  }

  // Start dev server
  const serverProcess = spawn(serveCommand, serveArgs, {
    cwd,
    stdio: 'inherit',
    shell: true
  });

  return {
    process: serverProcess,
    close: () => serverProcess.kill()
  };
}

/**
 * Deploy documentation site to GitHub Pages
 * @param {string} cwd - Current working directory
 * @param {object} config - Deployment configuration
 * @returns {Promise<object>} Deployment result
 */
export async function deploySite(cwd, config) {
  const { buildPath, branch, message, dryRun } = config;

  // Verify git repository
  const gitDir = join(cwd, '.git');
  if (!await fse.pathExists(gitDir)) {
    throw new Error('Not a git repository');
  }

  // Get remote URL for GitHub Pages URL
  const remoteUrl = await getGitRemote(cwd);
  const pagesUrl = remoteUrl ? convertToGitHubPagesUrl(remoteUrl) : null;

  if (dryRun) {
    return {
      commit: 'dry-run',
      branch,
      url: pagesUrl,
      dryRun: true
    };
  }

  // Deploy using gh-pages or git subtree
  try {
    // Try gh-pages npm package first
    await executeCommand('npx', [
      'gh-pages',
      '-d', buildPath,
      '-b', branch,
      '-m', message
    ], cwd);
  } catch (error) {
    // Fallback to git subtree
    await executeCommand('git', [
      'subtree', 'push',
      '--prefix', relative(cwd, buildPath),
      'origin', branch
    ], cwd);
  }

  // Get commit hash
  const commitHash = await getLatestCommitHash(cwd, branch);

  return {
    commit: commitHash,
    branch,
    url: pagesUrl
  };
}

/**
 * Validate site configuration
 * @param {string} cwd - Current working directory
 * @returns {Promise<object>} Site configuration
 */
export async function validateSiteConfig(cwd) {
  const vitepressConfig = join(cwd, '.vitepress', 'config.js');
  const docusaurusConfig = join(cwd, 'docusaurus.config.js');

  if (await fse.pathExists(vitepressConfig)) {
    return {
      generator: 'vitepress',
      configPath: vitepressConfig
    };
  } else if (await fse.pathExists(docusaurusConfig)) {
    return {
      generator: 'docusaurus',
      configPath: docusaurusConfig
    };
  } else {
    throw new Error('No site configuration found. Run: docflow site init');
  }
}

/**
 * Generate navigation structure from docs folder
 * @param {string} cwd - Current working directory
 * @param {object} config - DocFlow configuration
 * @returns {Promise<object>} Navigation structure
 */
export async function generateNavigation(cwd, config) {
  const docsDir = join(cwd, 'docs');
  const navigation = {
    nav: [],
    sidebar: {}
  };

  // Find all markdown files
  const markdownFiles = await glob('**/*.md', {
    cwd: docsDir,
    ignore: ['node_modules/**', '.vitepress/**']
  });

  // Build navigation tree
  const fileTree = {};

  for (const file of markdownFiles) {
    const parts = file.split('/');
    const fileName = parts.pop();

    // Skip index files in navigation
    if (fileName.toLowerCase() === 'index.md') continue;

    let current = fileTree;
    for (const part of parts) {
      if (!current[part]) {
        current[part] = { files: [], children: {} };
      }
      current = current[part].children;
    }

    // Read frontmatter for title
    const filePath = join(docsDir, file);
    const frontmatter = await extractFrontmatter(filePath);

    const link = '/' + file.replace(/\.md$/, '');
    const title = frontmatter.title || fileName.replace(/\.md$/, '').replace(/-/g, ' ');

    if (parts.length === 0) {
      // Top-level file
      navigation.nav.push({ text: title, link });
    } else {
      // Nested file
      const section = parts[0];
      if (!navigation.sidebar[`/${section}/`]) {
        navigation.sidebar[`/${section}/`] = [];
      }

      const sectionItem = navigation.sidebar[`/${section}/`].find(
        item => item.text === formatSectionName(section)
      );

      if (!sectionItem) {
        navigation.sidebar[`/${section}/`].push({
          text: formatSectionName(section),
          items: [{ text: title, link }]
        });
      } else {
        sectionItem.items.push({ text: title, link });
      }
    }
  }

  return navigation;
}

/**
 * Process markdown files with frontmatter
 * @param {string[]} files - Array of file paths
 * @returns {Promise<object[]>} Processed files
 */
export async function processMarkdown(files) {
  const processed = [];

  for (const file of files) {
    const content = await fse.readFile(file, 'utf-8');
    const frontmatter = extractFrontmatterFromContent(content);
    const body = content.replace(/^---[\s\S]*?---\n/, '');

    processed.push({
      path: file,
      frontmatter,
      body,
      title: frontmatter.title || basename(file, '.md')
    });
  }

  return processed;
}

/**
 * Generate VitePress configuration
 */
function generateVitePressConfig(config) {
  const colors = config.branding || {};

  return `import { defineConfig } from 'vitepress'
import navigation from './navigation.json'

export default defineConfig({
  title: '${config.project?.name || 'Documentation'}',
  description: '${config.project?.description || 'Project documentation'}',

  themeConfig: {
    nav: navigation.nav,
    sidebar: navigation.sidebar,

    socialLinks: [
      { icon: 'github', link: 'https://github.com/${config.project?.owner}/${config.project?.repository}' }
    ],

    footer: {
      message: 'Generated with DocFlow',
      copyright: 'Copyright © ${new Date().getFullYear()}'
    },

    search: {
      provider: 'local'
    },

    editLink: {
      pattern: 'https://github.com/${config.project?.owner}/${config.project?.repository}/edit/main/docs/:path',
      text: 'Edit this page on GitHub'
    }
  },

  markdown: {
    lineNumbers: true
  },

  appearance: 'dark'
})
`;
}

/**
 * Generate VitePress theme
 */
function generateVitePressTheme(config) {
  return `import DefaultTheme from 'vitepress/theme'
import './custom.css'

export default {
  extends: DefaultTheme
}
`;
}

/**
 * Generate Docusaurus configuration
 */
function generateDocusaurusConfig(config) {
  const colors = config.branding || {};

  return `// @ts-check

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: '${config.project?.name || 'Documentation'}',
  tagline: '${config.project?.description || 'Project documentation'}',
  favicon: 'img/favicon.ico',

  url: 'https://${config.project?.owner}.github.io',
  baseUrl: '/${config.project?.repository}/',

  organizationName: '${config.project?.owner}',
  projectName: '${config.project?.repository}',

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/${config.project?.owner}/${config.project?.repository}/edit/main/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: '${config.project?.name || 'Docs'}',
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'tutorialSidebar',
            position: 'left',
            label: 'Documentation',
          },
          {
            href: 'https://github.com/${config.project?.owner}/${config.project?.repository}',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        copyright: \`Copyright © \${new Date().getFullYear()} Generated with DocFlow\`,
      },
      prism: {
        theme: require('prism-react-renderer/themes/github'),
        darkTheme: require('prism-react-renderer/themes/dracula'),
      },
    }),
};

module.exports = config;
`;
}

/**
 * Generate Docusaurus sidebar
 */
function generateDocusaurusSidebar(navigation) {
  return `/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  tutorialSidebar: [
    ${JSON.stringify(Object.values(navigation.sidebar).flat(), null, 2)}
  ],
};

module.exports = sidebars;
`;
}

/**
 * Generate custom theme CSS
 */
function generateThemeCSS(config) {
  const colors = config.branding || {
    primary: '#072151',
    secondary: '#2978c7',
    accent: '#14b8a6',
    background: '#ccd5e7',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444'
  };

  return `/**
 * DocFlow Custom Theme
 * Brand colours and styling
 */

:root {
  /* DocFlow brand colours */
  --docflow-primary: ${colors.primary};
  --docflow-secondary: ${colors.secondary};
  --docflow-accent: ${colors.accent};
  --docflow-background: ${colors.background};
  --docflow-success: ${colors.success};
  --docflow-warning: ${colors.warning};
  --docflow-error: ${colors.error};

  /* VitePress overrides */
  --vp-c-brand: ${colors.primary};
  --vp-c-brand-light: ${colors.secondary};
  --vp-c-brand-lighter: ${colors.accent};
  --vp-c-brand-dark: ${colors.primary};
  --vp-c-brand-darker: ${colors.primary};

  /* Docusaurus overrides */
  --ifm-color-primary: ${colors.primary};
  --ifm-color-primary-dark: ${adjustBrightness(colors.primary, -10)};
  --ifm-color-primary-darker: ${adjustBrightness(colors.primary, -15)};
  --ifm-color-primary-darkest: ${adjustBrightness(colors.primary, -20)};
  --ifm-color-primary-light: ${adjustBrightness(colors.primary, 10)};
  --ifm-color-primary-lighter: ${adjustBrightness(colors.primary, 15)};
  --ifm-color-primary-lightest: ${adjustBrightness(colors.primary, 20)};
}

/* Custom styling */
.vp-doc h1,
.vp-doc h2,
.markdown h1,
.markdown h2 {
  color: var(--docflow-primary);
}

.vp-doc a,
.markdown a {
  color: var(--docflow-secondary);
}

.vp-doc a:hover,
.markdown a:hover {
  color: var(--docflow-accent);
}

/* Code blocks */
.vp-code-group,
.markdown pre {
  border-left: 4px solid var(--docflow-accent);
}

/* Badges */
.badge--success {
  background-color: var(--docflow-success);
}

.badge--warning {
  background-color: var(--docflow-warning);
}

.badge--danger {
  background-color: var(--docflow-error);
}
`;
}

/**
 * Generate index page
 */
function generateIndexPage(config) {
  return `---
layout: home
title: ${config.project?.name || 'Documentation'}

hero:
  name: ${config.project?.name || 'Documentation'}
  text: ${config.project?.description || 'Project documentation'}
  tagline: Generated with DocFlow
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/${config.project?.owner}/${config.project?.repository}

features:
  - icon: 📚
    title: Comprehensive Documentation
    details: Complete documentation for all project components
  - icon: 🔍
    title: Searchable
    details: Fast full-text search across all documentation
  - icon: 🎨
    title: Customizable
    details: Branded theme matching your project identity
  - icon: 🚀
    title: Fast & Modern
    details: Built with modern static site generators
---
`;
}

/**
 * Extract frontmatter from file
 */
async function extractFrontmatter(filePath) {
  const content = await fse.readFile(filePath, 'utf-8');
  return extractFrontmatterFromContent(content);
}

/**
 * Extract frontmatter from content string
 */
function extractFrontmatterFromContent(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const frontmatter = {};
  const lines = match[1].split('\n');

  for (const line of lines) {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length) {
      frontmatter[key.trim()] = valueParts.join(':').trim();
    }
  }

  return frontmatter;
}

/**
 * Format section name
 */
function formatSectionName(section) {
  return section
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Detect which generator is configured
 */
async function detectGenerator(cwd) {
  if (await fse.pathExists(join(cwd, '.vitepress', 'config.js'))) {
    return 'vitepress';
  } else if (await fse.pathExists(join(cwd, 'docusaurus.config.js'))) {
    return 'docusaurus';
  }
  return null;
}

/**
 * Execute command and return promise
 */
function executeCommand(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: true
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    proc.on('error', reject);
  });
}

/**
 * Get build statistics
 */
async function getBuildStats(outputPath) {
  if (!await fse.pathExists(outputPath)) {
    return { pages: 0, assets: 0, size: 0 };
  }

  const files = await glob('**/*', { cwd: outputPath, nodir: true });

  let totalSize = 0;
  let pages = 0;
  let assets = 0;

  for (const file of files) {
    const stats = await fse.stat(join(outputPath, file));
    totalSize += stats.size;

    if (file.endsWith('.html')) {
      pages++;
    } else {
      assets++;
    }
  }

  return { pages, assets, size: totalSize };
}

/**
 * Get git remote URL
 */
async function getGitRemote(cwd) {
  return new Promise((resolve) => {
    const proc = spawn('git', ['remote', 'get-url', 'origin'], {
      cwd,
      shell: true
    });

    let output = '';
    proc.stdout.on('data', (data) => {
      output += data.toString();
    });

    proc.on('close', () => {
      resolve(output.trim());
    });

    proc.on('error', () => resolve(null));
  });
}

/**
 * Convert git URL to GitHub Pages URL
 */
function convertToGitHubPagesUrl(gitUrl) {
  const match = gitUrl.match(/github\.com[:/](.+?)\/(.+?)(\.git)?$/);
  if (!match) return null;

  const [, owner, repo] = match;
  return `https://${owner}.github.io/${repo}/`;
}

/**
 * Get latest commit hash
 */
async function getLatestCommitHash(cwd, branch) {
  return new Promise((resolve) => {
    const proc = spawn('git', ['rev-parse', '--short', `${branch}`], {
      cwd,
      shell: true
    });

    let output = '';
    proc.stdout.on('data', (data) => {
      output += data.toString();
    });

    proc.on('close', () => {
      resolve(output.trim() || 'unknown');
    });

    proc.on('error', () => resolve('unknown'));
  });
}

/**
 * Adjust colour brightness
 */
function adjustBrightness(hex, percent) {
  // Remove # if present
  hex = hex.replace('#', '');

  // Convert to RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Adjust brightness
  const adjust = (val) => {
    const adjusted = Math.round(val + (val * percent / 100));
    return Math.max(0, Math.min(255, adjusted));
  };

  // Convert back to hex
  const toHex = (val) => val.toString(16).padStart(2, '0');

  return `#${toHex(adjust(r))}${toHex(adjust(g))}${toHex(adjust(b))}`;
}
