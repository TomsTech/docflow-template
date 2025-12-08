/**
 * DocFlow PDF Generator
 * Generate PDF reports from markdown documentation
 *
 * (c) 2024-2025 Tom Mangano (TomsTech). All Rights Reserved.
 */

import fse from 'fs-extra';
import { join, basename, dirname, relative } from 'path';
import { marked } from 'marked';
import puppeteer from 'puppeteer';

/**
 * Generate PDF from markdown files
 * @param {Object} options - Generation options
 * @param {string[]} options.inputFiles - Array of markdown file paths
 * @param {string} options.outputPath - Output PDF path
 * @param {string} options.template - Template type (executive, technical, full)
 * @param {boolean} options.includeToc - Include table of contents
 * @param {boolean} options.includeCover - Include cover page
 * @param {string} options.customHeader - Custom header text
 * @param {string} options.customFooter - Custom footer text
 * @param {Object} options.config - DocFlow configuration
 * @param {string} options.cwd - Current working directory
 */
export async function generatePDF(options) {
  const {
    inputFiles,
    outputPath,
    template = 'technical',
    includeToc = true,
    includeCover = true,
    customHeader,
    customFooter,
    config,
    cwd
  } = options;

  // Load and parse markdown files
  const documents = await loadDocuments(inputFiles, cwd);

  // Apply template filtering
  const filteredDocs = applyTemplate(documents, template);

  // Build HTML content
  const htmlContent = await buildHTML({
    documents: filteredDocs,
    config,
    template,
    includeToc,
    includeCover,
    customHeader,
    customFooter
  });

  // Generate PDF using Puppeteer
  await renderPDF(htmlContent, outputPath);
}

/**
 * Load and parse markdown documents
 */
async function loadDocuments(filePaths, cwd) {
  const documents = [];

  for (const filePath of filePaths) {
    const content = await fse.readFile(filePath, 'utf-8');
    const relativePath = relative(cwd, filePath);

    // Extract title from first heading or filename
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : basename(filePath, '.md');

    // Parse markdown to HTML
    const html = marked.parse(content, {
      gfm: true,
      breaks: false,
      headerIds: true,
      mangle: false
    });

    documents.push({
      path: filePath,
      relativePath,
      title,
      content,
      html,
      headings: extractHeadings(content)
    });
  }

  // Sort documents by path for consistent ordering
  documents.sort((a, b) => a.relativePath.localeCompare(b.relativePath));

  return documents;
}

/**
 * Extract headings from markdown content
 */
function extractHeadings(markdown) {
  const headings = [];
  const lines = markdown.split('\n');

  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');

      headings.push({ level, text, id });
    }
  }

  return headings;
}

/**
 * Apply template filtering to documents
 */
function applyTemplate(documents, template) {
  switch (template) {
    case 'executive':
      // Include only high-level docs
      return documents.filter(doc => {
        const path = doc.relativePath.toLowerCase();
        return path.includes('readme') ||
               path.includes('overview') ||
               path.includes('summary') ||
               path.includes('architecture') && !path.includes('adr');
      });

    case 'technical':
      // Exclude executive summaries and high-level overviews
      return documents.filter(doc => {
        const path = doc.relativePath.toLowerCase();
        return !path.includes('executive') &&
               !path.includes('summary');
      });

    case 'full':
    default:
      // Include everything
      return documents;
  }
}

/**
 * Build complete HTML document
 */
async function buildHTML(options) {
  const {
    documents,
    config,
    template,
    includeToc,
    includeCover,
    customHeader,
    customFooter
  } = options;

  const parts = [];

  // HTML header
  parts.push(buildHTMLHeader(config));

  // Cover page
  if (includeCover) {
    parts.push(buildCoverPage(config, template));
  }

  // Table of contents
  if (includeToc) {
    parts.push(buildTableOfContents(documents));
  }

  // Document content
  for (const doc of documents) {
    parts.push(buildDocumentSection(doc, customHeader, customFooter));
  }

  // HTML footer
  parts.push(buildHTMLFooter());

  return parts.join('\n');
}

/**
 * Build HTML header with styles
 */
function buildHTMLHeader(config) {
  const primaryColor = config?.branding?.primary || '#072151';
  const secondaryColor = config?.branding?.secondary || '#2978c7';
  const accentColor = config?.branding?.accent || '#14b8a6';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config?.project?.name || 'Documentation'}</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    @page {
      size: A4;
      margin: 2cm 1.5cm;
      @top-right {
        content: counter(page);
      }
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #1f2937;
    }

    .cover-page {
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%);
      color: white;
      page-break-after: always;
      padding: 2cm;
    }

    .cover-page h1 {
      font-size: 48pt;
      font-weight: 700;
      margin-bottom: 0.5em;
      text-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }

    .cover-page .subtitle {
      font-size: 24pt;
      font-weight: 300;
      margin-bottom: 2em;
      opacity: 0.9;
    }

    .cover-page .meta {
      font-size: 12pt;
      opacity: 0.8;
    }

    .toc {
      page-break-after: always;
      padding: 2cm 0;
    }

    .toc h1 {
      font-size: 28pt;
      color: ${primaryColor};
      margin-bottom: 1em;
      border-bottom: 2px solid ${accentColor};
      padding-bottom: 0.5em;
    }

    .toc ul {
      list-style: none;
      padding-left: 0;
    }

    .toc li {
      margin: 0.5em 0;
      padding-left: 1em;
    }

    .toc li.level-1 {
      font-weight: 600;
      font-size: 12pt;
      margin-top: 1em;
      padding-left: 0;
    }

    .toc li.level-2 {
      padding-left: 1.5em;
    }

    .toc li.level-3 {
      padding-left: 3em;
      font-size: 10pt;
    }

    .document-section {
      page-break-before: always;
      padding: 1cm 0;
    }

    .document-section:first-of-type {
      page-break-before: auto;
    }

    .document-header {
      border-bottom: 2px solid ${primaryColor};
      padding-bottom: 0.5em;
      margin-bottom: 2em;
    }

    .document-header h1 {
      font-size: 24pt;
      color: ${primaryColor};
    }

    .document-header .path {
      font-size: 9pt;
      color: #6b7280;
      font-family: 'Courier New', monospace;
      margin-top: 0.5em;
    }

    h1 {
      font-size: 24pt;
      color: ${primaryColor};
      margin-top: 1.5em;
      margin-bottom: 0.5em;
      page-break-after: avoid;
    }

    h2 {
      font-size: 18pt;
      color: ${secondaryColor};
      margin-top: 1.2em;
      margin-bottom: 0.4em;
      page-break-after: avoid;
    }

    h3 {
      font-size: 14pt;
      color: ${secondaryColor};
      margin-top: 1em;
      margin-bottom: 0.3em;
      page-break-after: avoid;
    }

    h4, h5, h6 {
      font-size: 12pt;
      color: #374151;
      margin-top: 0.8em;
      margin-bottom: 0.2em;
      page-break-after: avoid;
    }

    p {
      margin: 0.5em 0;
      text-align: justify;
    }

    code {
      background: #f3f4f6;
      padding: 0.2em 0.4em;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
      font-size: 10pt;
      color: #dc2626;
    }

    pre {
      background: #1f2937;
      color: #f3f4f6;
      padding: 1em;
      border-radius: 4px;
      overflow-x: auto;
      margin: 1em 0;
      page-break-inside: avoid;
    }

    pre code {
      background: transparent;
      color: inherit;
      padding: 0;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1em 0;
      page-break-inside: avoid;
    }

    th, td {
      border: 1px solid #d1d5db;
      padding: 0.5em;
      text-align: left;
    }

    th {
      background: ${primaryColor};
      color: white;
      font-weight: 600;
    }

    tr:nth-child(even) {
      background: #f9fafb;
    }

    ul, ol {
      margin: 0.5em 0;
      padding-left: 2em;
    }

    li {
      margin: 0.3em 0;
    }

    blockquote {
      border-left: 4px solid ${accentColor};
      padding-left: 1em;
      margin: 1em 0;
      color: #4b5563;
      font-style: italic;
    }

    img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 1em auto;
      page-break-inside: avoid;
    }

    a {
      color: ${secondaryColor};
      text-decoration: none;
    }

    a:hover {
      text-decoration: underline;
    }

    .page-footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 1cm;
      text-align: center;
      font-size: 9pt;
      color: #6b7280;
    }
  </style>
</head>
<body>`;
}

/**
 * Build cover page
 */
function buildCoverPage(config, template) {
  const projectName = config?.project?.name || 'Documentation';
  const description = config?.project?.description || '';
  const date = new Date().toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const templateTitles = {
    executive: 'Executive Summary',
    technical: 'Technical Documentation',
    full: 'Complete Documentation'
  };

  return `
<div class="cover-page">
  <h1>${projectName}</h1>
  <div class="subtitle">${templateTitles[template] || 'Documentation'}</div>
  ${description ? `<div class="subtitle" style="font-size: 14pt;">${description}</div>` : ''}
  <div class="meta">
    <p>Generated: ${date}</p>
    ${config?.project?.owner ? `<p>Owner: ${config.project.owner}</p>` : ''}
    ${config?.version ? `<p>Version: ${config.version}</p>` : ''}
  </div>
</div>`;
}

/**
 * Build table of contents
 */
function buildTableOfContents(documents) {
  const tocItems = [];

  for (const doc of documents) {
    // Add document title as level 1
    tocItems.push(`<li class="level-1">${doc.title}</li>`);

    // Add headings as sub-items (only h2 and h3 for cleaner TOC)
    for (const heading of doc.headings) {
      if (heading.level === 2) {
        tocItems.push(`<li class="level-2">${heading.text}</li>`);
      } else if (heading.level === 3) {
        tocItems.push(`<li class="level-3">${heading.text}</li>`);
      }
    }
  }

  return `
<div class="toc">
  <h1>Table of Contents</h1>
  <ul>
    ${tocItems.join('\n    ')}
  </ul>
</div>`;
}

/**
 * Build document section
 */
function buildDocumentSection(doc, customHeader, customFooter) {
  return `
<div class="document-section">
  <div class="document-header">
    <h1>${doc.title}</h1>
    <div class="path">${doc.relativePath}</div>
  </div>
  ${doc.html}
</div>`;
}

/**
 * Build HTML footer
 */
function buildHTMLFooter() {
  return `
</body>
</html>`;
}

/**
 * Render HTML to PDF using Puppeteer
 */
async function renderPDF(htmlContent, outputPath) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Set content
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0'
    });

    // Generate PDF
    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '2cm',
        right: '1.5cm',
        bottom: '2cm',
        left: '1.5cm'
      },
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `
        <div style="width: 100%; font-size: 9pt; text-align: center; color: #6b7280; padding: 0 1.5cm;">
          <span class="pageNumber"></span> / <span class="totalPages"></span>
        </div>
      `
    });

  } finally {
    await browser.close();
  }
}
