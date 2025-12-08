/**
 * Docusaurus Configuration Template
 * This file is used by DocFlow to generate Docusaurus documentation sites
 *
 * Variables are replaced during initialization:
 * - {{PROJECT_NAME}}
 * - {{PROJECT_DESCRIPTION}}
 * - {{GITHUB_OWNER}}
 * - {{GITHUB_REPO}}
 * - {{PRIMARY_COLOR}}
 */

// @ts-check

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: '{{PROJECT_NAME}}',
  tagline: '{{PROJECT_DESCRIPTION}}',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://{{GITHUB_OWNER}}.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  baseUrl: '/{{GITHUB_REPO}}/',

  // GitHub pages deployment config
  organizationName: '{{GITHUB_OWNER}}',
  projectName: '{{GITHUB_REPO}}',

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  // Internationalization
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
          routeBasePath: '/', // Serve docs at site root
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/{{GITHUB_OWNER}}/{{GITHUB_REPO}}/edit/main/',
          showLastUpdateTime: true,
          showLastUpdateAuthor: true,
        },
        blog: false, // Disable blog
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Navbar configuration
      navbar: {
        title: '{{PROJECT_NAME}}',
        // logo: {
        //   alt: '{{PROJECT_NAME}} Logo',
        //   src: 'img/logo.svg',
        // },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'mainSidebar',
            position: 'left',
            label: 'Documentation',
          },
          {
            href: 'https://github.com/{{GITHUB_OWNER}}/{{GITHUB_REPO}}',
            label: 'GitHub',
            position: 'right',
          },
        ],
        hideOnScroll: true,
      },

      // Footer configuration
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Documentation',
            items: [
              {
                label: 'Getting Started',
                to: '/getting-started',
              },
              {
                label: 'Architecture',
                to: '/architecture',
              },
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/{{GITHUB_OWNER}}/{{GITHUB_REPO}}',
              },
              {
                label: 'Issues',
                href: 'https://github.com/{{GITHUB_OWNER}}/{{GITHUB_REPO}}/issues',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Generated with <a href="https://github.com/TomsTech/docflow-template">DocFlow</a>`,
      },

      // Syntax highlighting
      prism: {
        theme: require('prism-react-renderer/themes/github'),
        darkTheme: require('prism-react-renderer/themes/dracula'),
        additionalLanguages: ['powershell', 'bash', 'json', 'yaml'],
      },

      // Color mode configuration
      colorMode: {
        defaultMode: 'dark',
        disableSwitch: false,
        respectPrefersColorScheme: true,
      },

      // Algolia search (optional - configure when ready)
      // algolia: {
      //   appId: 'YOUR_APP_ID',
      //   apiKey: 'YOUR_API_KEY',
      //   indexName: 'YOUR_INDEX_NAME',
      // },

      // Table of contents
      tableOfContents: {
        minHeadingLevel: 2,
        maxHeadingLevel: 3,
      },

      // Docs settings
      docs: {
        sidebar: {
          hideable: true,
          autoCollapseCategories: true,
        },
      },

      // Announcement bar (optional)
      // announcementBar: {
      //   id: 'announcement',
      //   content: 'Welcome to our documentation!',
      //   backgroundColor: '{{PRIMARY_COLOR}}',
      //   textColor: '#ffffff',
      //   isCloseable: true,
      // },
    }),

  // Plugins
  plugins: [
    // Add custom plugins here
  ],

  // Custom fields
  customFields: {
    description: '{{PROJECT_DESCRIPTION}}',
  },

  // Markdown configuration
  markdown: {
    mermaid: true,
  },
  themes: ['@docusaurus/theme-mermaid'],
};

module.exports = config;
