/**
 * DocFlow Documentation Aggregator
 * Aggregates documentation from multiple repositories with conflict resolution
 */

import fse from 'fs-extra';
import { join, relative, dirname, basename } from 'path';
import { glob } from 'glob';
import { execSync } from 'child_process';

/**
 * Clone multiple repositories to a target directory
 * @param {string[]} repos - Array of repo identifiers (org/repo format)
 * @param {string} targetDir - Directory to clone repos into
 * @returns {Promise<string[]>} - Array of cloned repo paths
 */
export async function cloneRepos(repos, targetDir) {
  await fse.ensureDir(targetDir);
  const clonedPaths = [];

  for (const repo of repos) {
    const repoName = repo.split('/').pop();
    const repoPath = join(targetDir, repoName);

    // Skip if already exists
    if (await fse.pathExists(repoPath)) {
      console.log(`  Repository already exists: ${repoName}`);
      clonedPaths.push(repoPath);
      continue;
    }

    try {
      // Determine if it's a GitHub repo or a local path
      let cloneUrl;
      if (repo.includes('/') && !repo.startsWith('.') && !repo.startsWith('/')) {
        // Assume GitHub repo format: org/repo
        cloneUrl = `https://github.com/${repo}.git`;
      } else {
        throw new Error(`Invalid repo format: ${repo}. Use org/repo or configure manually.`);
      }

      console.log(`  Cloning ${repo}...`);
      execSync(`git clone --depth 1 "${cloneUrl}" "${repoPath}"`, {
        stdio: 'pipe',
        encoding: 'utf-8'
      });

      clonedPaths.push(repoPath);
    } catch (error) {
      throw new Error(`Failed to clone ${repo}: ${error.message}`);
    }
  }

  return clonedPaths;
}

/**
 * Extract documentation from a repository
 * @param {string} repoDir - Path to repository
 * @param {object} options - Extraction options
 * @returns {Promise<object>} - Extracted documentation by section
 */
export async function extractDocs(repoDir, options = {}) {
  if (!await fse.pathExists(repoDir)) {
    throw new Error(`Repository directory not found: ${repoDir}`);
  }

  const sections = options.sections || ['adr', 'api', 'runbooks', 'features', 'architecture'];
  const extracted = {};

  for (const section of sections) {
    const sectionDocs = await extractSection(repoDir, section);
    if (sectionDocs.length > 0) {
      extracted[section] = sectionDocs;
    }
  }

  return extracted;
}

/**
 * Extract documentation for a specific section
 * @param {string} repoDir - Repository directory
 * @param {string} section - Section name (adr, api, runbooks, etc.)
 * @returns {Promise<object[]>} - Array of document objects
 */
async function extractSection(repoDir, section) {
  const documents = [];

  // Common paths for each section type
  const sectionPaths = {
    'adr': ['docs/architecture/adr', 'docs/adr', 'adr', '.design/adr'],
    'api': ['docs/api', 'api', 'docs/endpoints'],
    'runbooks': ['docs/runbooks', 'runbooks', 'docs/operations'],
    'features': ['docs/features', 'features', 'docs/requirements'],
    'architecture': ['docs/architecture', 'architecture', 'docs/design', '.design'],
    'database': ['docs/database', 'database', 'docs/schema'],
    'security': ['docs/security', 'security'],
    'deployment': ['docs/deployment', 'deployment', 'docs/deploy']
  };

  const paths = sectionPaths[section] || [`docs/${section}`, section];

  for (const pathPattern of paths) {
    const fullPath = join(repoDir, pathPattern);

    if (!await fse.pathExists(fullPath)) {
      continue;
    }

    // Find all markdown files in this path
    const pattern = join(fullPath, '**/*.md');
    const files = await glob(pattern, {
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'],
      absolute: true
    });

    for (const file of files) {
      const content = await fse.readFile(file, 'utf-8');
      const relativePath = relative(fullPath, file);
      const filename = basename(file);

      documents.push({
        filename,
        relativePath,
        absolutePath: file,
        content,
        section,
        metadata: extractMetadata(content, filename)
      });
    }
  }

  return documents;
}

/**
 * Extract metadata from document content
 * @param {string} content - Document content
 * @param {string} filename - Filename
 * @returns {object} - Extracted metadata
 */
function extractMetadata(content, filename) {
  const metadata = {
    title: '',
    date: null,
    author: null,
    tags: [],
    status: null
  };

  // Extract title from first heading
  const titleMatch = content.match(/^#\s+(.+)$/m);
  if (titleMatch) {
    metadata.title = titleMatch[1].trim();
  }

  // Try to extract frontmatter (YAML)
  const frontmatterMatch = content.match(/^---\n([\s\S]+?)\n---/);
  if (frontmatterMatch) {
    const frontmatter = frontmatterMatch[1];

    const dateMatch = frontmatter.match(/date:\s*(.+)/i);
    if (dateMatch) metadata.date = dateMatch[1].trim();

    const authorMatch = frontmatter.match(/author:\s*(.+)/i);
    if (authorMatch) metadata.author = authorMatch[1].trim();

    const tagsMatch = frontmatter.match(/tags:\s*\[([^\]]+)\]/i);
    if (tagsMatch) {
      metadata.tags = tagsMatch[1].split(',').map(t => t.trim().replace(/['"]/g, ''));
    }

    const statusMatch = frontmatter.match(/status:\s*(.+)/i);
    if (statusMatch) metadata.status = statusMatch[1].trim();
  }

  // Extract from ADR format
  const adrStatusMatch = content.match(/##\s*Status\s*\n\s*(.+)/i);
  if (adrStatusMatch) {
    metadata.status = adrStatusMatch[1].trim();
  }

  const adrDateMatch = content.match(/##\s*Date\s*\n\s*(.+)/i);
  if (adrDateMatch) {
    metadata.date = adrDateMatch[1].trim();
  }

  return metadata;
}

/**
 * Merge documentation from multiple repositories with conflict resolution
 * @param {object[]} allDocs - Array of {repo, repoName, docs} objects
 * @param {object} options - Merge options
 * @returns {Promise<object>} - Merged documentation by section
 */
export async function mergeDocumentation(allDocs, options = {}) {
  const merged = {};
  const sections = options.sections || [];

  // Group documents by section
  for (const { repo, repoName, docs } of allDocs) {
    for (const [section, documents] of Object.entries(docs)) {
      // Skip if sections filter is active and this section is not included
      if (sections.length > 0 && !sections.includes(section)) {
        continue;
      }

      if (!merged[section]) {
        merged[section] = [];
      }

      // Add repo context to each document
      for (const doc of documents) {
        merged[section].push({
          ...doc,
          sourceRepo: repo,
          sourceRepoName: repoName
        });
      }
    }
  }

  // Resolve conflicts within each section
  for (const section of Object.keys(merged)) {
    merged[section] = resolveConflicts(merged[section], section);
  }

  return merged;
}

/**
 * Resolve conflicts when multiple repos have docs with same filename
 * @param {object[]} documents - Array of documents in a section
 * @param {string} section - Section name
 * @returns {object[]} - Resolved documents
 */
function resolveConflicts(documents, section) {
  const fileGroups = {};

  // Group by filename
  for (const doc of documents) {
    const key = doc.filename;
    if (!fileGroups[key]) {
      fileGroups[key] = [];
    }
    fileGroups[key].push(doc);
  }

  const resolved = [];

  for (const [filename, docs] of Object.entries(fileGroups)) {
    if (docs.length === 1) {
      // No conflict
      resolved.push(docs[0]);
    } else {
      // Conflict - create merged or separate documents
      if (section === 'adr' || section === 'runbooks') {
        // For ADRs and runbooks, keep separate with repo prefix
        for (const doc of docs) {
          const repoPrefix = doc.sourceRepoName.replace(/[^a-zA-Z0-9]/g, '-');
          resolved.push({
            ...doc,
            filename: `${repoPrefix}-${doc.filename}`,
            conflictResolution: 'prefixed'
          });
        }
      } else {
        // For other sections, merge content
        const mergedContent = mergeDocumentContent(docs, filename);
        resolved.push({
          filename,
          content: mergedContent,
          section,
          metadata: docs[0].metadata,
          sourceRepos: docs.map(d => d.sourceRepo),
          conflictResolution: 'merged'
        });
      }
    }
  }

  return resolved;
}

/**
 * Merge content from multiple documents
 * @param {object[]} docs - Documents with same filename
 * @param {string} filename - Filename
 * @returns {string} - Merged content
 */
function mergeDocumentContent(docs, filename) {
  const lines = [];

  lines.push(`# ${docs[0].metadata.title || filename.replace('.md', '')}`);
  lines.push('');
  lines.push('> **Note**: This document has been aggregated from multiple repositories.');
  lines.push('');

  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i];
    lines.push(`## From ${doc.sourceRepoName}`);
    lines.push('');

    // Remove the first heading from original content
    let content = doc.content;
    content = content.replace(/^#\s+.+\n/, '');

    lines.push(content);
    lines.push('');

    if (i < docs.length - 1) {
      lines.push('---');
      lines.push('');
    }
  }

  return lines.join('\n');
}

/**
 * Link cross-references between repositories
 * @param {object} merged - Merged documentation by section
 * @returns {Promise<object>} - Documentation with linked cross-references
 */
export async function linkCrossReferences(merged) {
  const linked = { ...merged };

  // Build a map of all documents for reference resolution
  const docMap = new Map();

  for (const [section, documents] of Object.entries(merged)) {
    for (const doc of documents) {
      const key = `${section}/${doc.filename}`;
      docMap.set(key, { section, doc });
      docMap.set(doc.filename, { section, doc }); // Also map by filename alone
    }
  }

  // Process each document to fix links
  for (const [section, documents] of Object.entries(linked)) {
    for (const doc of documents) {
      doc.content = fixCrossRepoLinks(doc.content, doc, docMap);
    }
  }

  return linked;
}

/**
 * Fix cross-repository links in document content
 * @param {string} content - Document content
 * @param {object} currentDoc - Current document
 * @param {Map} docMap - Map of all documents
 * @returns {string} - Content with fixed links
 */
function fixCrossRepoLinks(content, currentDoc, docMap) {
  // Match markdown links: [text](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

  return content.replace(linkRegex, (match, text, url) => {
    // Skip external links
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return match;
    }

    // Skip anchors
    if (url.startsWith('#')) {
      return match;
    }

    // Try to resolve relative link
    const filename = basename(url.split('#')[0]);
    const anchor = url.includes('#') ? url.split('#')[1] : '';

    const target = docMap.get(filename);
    if (target && target.doc.sourceRepo !== currentDoc.sourceRepo) {
      // Cross-repo reference - fix the path
      const newUrl = `../${target.section}/${target.doc.filename}${anchor ? '#' + anchor : ''}`;
      return `[${text}](${newUrl})`;
    }

    // Same repo or not found - keep original
    return match;
  });
}

/**
 * Generate unified index for aggregated documentation
 * @param {object} merged - Merged documentation by section
 * @param {object} options - Generation options
 * @returns {Promise<string>} - Index markdown content
 */
export async function generateIndex(merged, options = {}) {
  const { repos = [], sections = [] } = options;
  const lines = [];

  lines.push('# Aggregated Documentation Index');
  lines.push('');
  lines.push('> Auto-generated by DocFlow Aggregator');
  lines.push('');
  lines.push(`**Last Updated**: ${new Date().toISOString().split('T')[0]}`);
  lines.push('');

  // Summary
  lines.push('## Summary');
  lines.push('');
  lines.push(`- **Repositories**: ${repos.length}`);
  lines.push(`- **Sections**: ${Object.keys(merged).length}`);

  const totalDocs = Object.values(merged).reduce((sum, docs) => sum + docs.length, 0);
  lines.push(`- **Documents**: ${totalDocs}`);
  lines.push('');

  // Source repositories
  lines.push('## Source Repositories');
  lines.push('');
  for (const repo of repos) {
    lines.push(`- ${repo}`);
  }
  lines.push('');

  // Table of Contents by Section
  lines.push('## Documentation Sections');
  lines.push('');

  const sortedSections = Object.keys(merged).sort();

  for (const section of sortedSections) {
    const documents = merged[section];
    const sectionName = section.charAt(0).toUpperCase() + section.slice(1);

    lines.push(`### ${sectionName}`);
    lines.push('');

    // Group by source repo for better organization
    const byRepo = {};
    for (const doc of documents) {
      const repos = doc.sourceRepos || [doc.sourceRepo];
      for (const repo of repos) {
        if (!byRepo[repo]) {
          byRepo[repo] = [];
        }
        byRepo[repo].push(doc);
      }
    }

    for (const [repo, docs] of Object.entries(byRepo)) {
      const repoName = repo.split('/').pop();
      lines.push(`**${repoName}**:`);
      lines.push('');

      // Sort documents by filename
      const sortedDocs = docs.sort((a, b) => a.filename.localeCompare(b.filename));

      for (const doc of sortedDocs) {
        const title = doc.metadata?.title || doc.filename.replace('.md', '');
        const link = `${section}/${doc.filename}`;
        lines.push(`- [${title}](${link})`);

        if (doc.metadata?.status) {
          lines.push(`  - Status: ${doc.metadata.status}`);
        }
        if (doc.conflictResolution) {
          lines.push(`  - *(${doc.conflictResolution})*`);
        }
      }
      lines.push('');
    }
  }

  // Legend
  lines.push('## Legend');
  lines.push('');
  lines.push('- **prefixed**: Document filename prefixed with repo name to avoid conflicts');
  lines.push('- **merged**: Content from multiple repos merged into single document');
  lines.push('');

  return lines.join('\n');
}
