/**
 * VitePress Configuration Template
 * This file is used by DocFlow to generate VitePress documentation sites
 *
 * Variables are replaced during initialization:
 * - {{PROJECT_NAME}}
 * - {{PROJECT_DESCRIPTION}}
 * - {{GITHUB_OWNER}}
 * - {{GITHUB_REPO}}
 * - {{PRIMARY_COLOR}}
 * - {{SECONDARY_COLOR}}
 */

import { defineConfig } from 'vitepress'
import navigation from './navigation.json'

export default defineConfig({
  title: '{{PROJECT_NAME}}',
  description: '{{PROJECT_DESCRIPTION}}',

  // Base URL - set this if deploying to GitHub Pages
  base: process.env.BASE_URL || '/',

  themeConfig: {
    // Navigation bar
    nav: navigation.nav,

    // Sidebar configuration
    sidebar: navigation.sidebar,

    // Social links
    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/{{GITHUB_OWNER}}/{{GITHUB_REPO}}'
      }
    ],

    // Footer
    footer: {
      message: 'Generated with <a href="https://github.com/TomsTech/docflow-template">DocFlow</a>',
      copyright: `Copyright © ${new Date().getFullYear()}`
    },

    // Search
    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: 'Search',
            buttonAriaLabel: 'Search documentation'
          },
          modal: {
            noResultsText: 'No results found',
            resetButtonTitle: 'Clear query',
            footer: {
              selectText: 'to select',
              navigateText: 'to navigate',
              closeText: 'to close'
            }
          }
        }
      }
    },

    // Edit link
    editLink: {
      pattern: 'https://github.com/{{GITHUB_OWNER}}/{{GITHUB_REPO}}/edit/main/docs/:path',
      text: 'Edit this page on GitHub'
    },

    // Last updated text
    lastUpdated: {
      text: 'Last updated',
      formatOptions: {
        dateStyle: 'medium',
        timeStyle: 'short'
      }
    },

    // Doc footer navigation
    docFooter: {
      prev: 'Previous',
      next: 'Next'
    },

    // Outline
    outline: {
      level: [2, 3],
      label: 'On this page'
    },

    // Logo (optional - uncomment and add logo to public folder)
    // logo: '/logo.svg'
  },

  // Markdown configuration
  markdown: {
    lineNumbers: true,

    // Enable Mermaid diagrams
    config: (md) => {
      // Add custom markdown-it plugins here if needed
    }
  },

  // Appearance configuration
  appearance: 'dark', // 'dark' | 'light' | false

  // Head configuration
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '{{PRIMARY_COLOR}}' }],
    ['meta', { name: 'og:type', content: 'website' }],
    ['meta', { name: 'og:locale', content: 'en' }],
    ['meta', { name: 'og:site_name', content: '{{PROJECT_NAME}}' }]
  ],

  // Site map configuration
  sitemap: {
    hostname: 'https://{{GITHUB_OWNER}}.github.io/{{GITHUB_REPO}}'
  },

  // Build configuration
  srcDir: 'docs',
  outDir: '.vitepress/dist',
  cacheDir: '.vitepress/cache',

  // Clean URLs (remove .html)
  cleanUrls: true,

  // Ignore dead links (change to 'error' in production)
  ignoreDeadLinks: 'localhostLinks',

  // Multi-language support (optional)
  // locales: {
  //   root: {
  //     label: 'English',
  //     lang: 'en'
  //   }
  // }
})
