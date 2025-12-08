/**
 * DocFlow Dependency Graph Generator
 * Generate dependency graphs from import statements in JavaScript/TypeScript codebases
 */

import fse from 'fs-extra';
import { join, relative, dirname } from 'path';
import { glob } from 'glob';

/**
 * Generate dependency graph for a project
 */
export async function generateDependencyGraph(cwd, options = {}) {
  const entryPoints = options.entryPoints || await findEntryPoints(cwd);
  const maxDepth = options.maxDepth || 5;
  const includeExternal = options.includeExternal !== false;
  const filePattern = options.pattern || '**/*.{js,ts,jsx,tsx,mjs,cjs}';

  if (entryPoints.length === 0) {
    throw new Error('No entry points found. Specify with --entry option.');
  }

  // Scan all source files
  const files = await glob(filePattern, {
    cwd,
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/*.test.*', '**/*.spec.*'],
    absolute: true
  });

  if (files.length === 0) {
    throw new Error(`No files found matching pattern: ${filePattern}`);
  }

  // Parse all files
  const modules = new Map();
  for (const file of files) {
    const content = await fse.readFile(file, 'utf-8');
    const imports = parseImports(content, file, cwd);
    const relativePath = relative(cwd, file).replace(/\\/g, '/');
    modules.set(relativePath, imports);
  }

  // Build graph starting from entry points
  const graph = buildDependencyGraph(modules, entryPoints, maxDepth, includeExternal);

  return {
    graph,
    format: options.format || 'markdown',
    outputPath: options.output
  };
}

/**
 * Find entry points in the project
 */
async function findEntryPoints(cwd) {
  const entryPoints = [];

  // Check package.json
  const pkgPath = join(cwd, 'package.json');
  if (await fse.pathExists(pkgPath)) {
    try {
      const pkg = await fse.readJson(pkgPath);

      if (pkg.main) {
        entryPoints.push(pkg.main);
      }

      if (pkg.module) {
        entryPoints.push(pkg.module);
      }

      if (pkg.exports) {
        if (typeof pkg.exports === 'string') {
          entryPoints.push(pkg.exports);
        } else if (typeof pkg.exports === 'object') {
          Object.values(pkg.exports).forEach(exp => {
            if (typeof exp === 'string') {
              entryPoints.push(exp);
            } else if (exp.import) {
              entryPoints.push(exp.import);
            } else if (exp.require) {
              entryPoints.push(exp.require);
            }
          });
        }
      }
    } catch (e) {
      // Ignore errors
    }
  }

  // Common entry points
  const commonEntries = [
    'src/index.ts',
    'src/index.js',
    'src/main.ts',
    'src/main.js',
    'src/app.ts',
    'src/app.js',
    'index.ts',
    'index.js',
    'main.ts',
    'main.js'
  ];

  for (const entry of commonEntries) {
    if (await fse.pathExists(join(cwd, entry))) {
      entryPoints.push(entry);
    }
  }

  // Deduplicate
  return [...new Set(entryPoints)];
}

/**
 * Parse import statements from file content
 */
function parseImports(content, filePath, cwd) {
  const imports = [];

  // ES6 imports
  const es6Regex = /import\s+(?:(?:[\w*\s{},]*)\s+from\s+)?['"]([^'"]+)['"]/g;
  let match;

  while ((match = es6Regex.exec(content)) !== null) {
    imports.push({
      source: match[1],
      type: 'import',
      line: content.substring(0, match.index).split('\n').length
    });
  }

  // CommonJS requires
  const cjsRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((match = cjsRegex.exec(content)) !== null) {
    imports.push({
      source: match[1],
      type: 'require',
      line: content.substring(0, match.index).split('\n').length
    });
  }

  // Dynamic imports
  const dynamicRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((match = dynamicRegex.exec(content)) !== null) {
    imports.push({
      source: match[1],
      type: 'dynamic',
      line: content.substring(0, match.index).split('\n').length
    });
  }

  // Resolve import paths
  return imports.map(imp => ({
    ...imp,
    resolved: resolveImportPath(imp.source, filePath, cwd),
    isExternal: isExternalModule(imp.source)
  }));
}

/**
 * Resolve import path to absolute path
 */
function resolveImportPath(importPath, fromFile, cwd) {
  // External module
  if (isExternalModule(importPath)) {
    return importPath;
  }

  // Relative import
  if (importPath.startsWith('.')) {
    const fromDir = dirname(fromFile);
    const resolved = join(fromDir, importPath);

    // Try with extensions
    const extensions = ['.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs', '/index.js', '/index.ts'];
    for (const ext of extensions) {
      const withExt = resolved + ext;
      if (fse.existsSync(withExt)) {
        return relative(cwd, withExt).replace(/\\/g, '/');
      }
    }

    return relative(cwd, resolved).replace(/\\/g, '/');
  }

  // Absolute import from src
  if (importPath.startsWith('@/')) {
    return importPath.replace('@/', 'src/');
  }

  // Assume it's a module path
  return importPath;
}

/**
 * Check if module is external (node_modules)
 */
function isExternalModule(modulePath) {
  return !modulePath.startsWith('.') &&
         !modulePath.startsWith('/') &&
         !modulePath.startsWith('@/');
}

/**
 * Build dependency graph using BFS
 */
function buildDependencyGraph(modules, entryPoints, maxDepth, includeExternal) {
  const graph = {
    nodes: new Map(),
    edges: []
  };

  const visited = new Set();
  const queue = entryPoints.map(entry => ({ path: entry, depth: 0 }));

  while (queue.length > 0) {
    const { path, depth } = queue.shift();

    if (visited.has(path) || depth > maxDepth) {
      continue;
    }

    visited.add(path);

    // Add node
    const nodeId = sanitizeNodeId(path);
    const isExternal = isExternalModule(path);

    if (!isExternal || includeExternal) {
      graph.nodes.set(nodeId, {
        id: nodeId,
        path,
        isExternal,
        depth
      });
    }

    // Get imports for this module
    const imports = modules.get(path);
    if (!imports) continue;

    // Add edges and queue dependencies
    for (const imp of imports) {
      const targetId = sanitizeNodeId(imp.resolved);
      const targetIsExternal = imp.isExternal;

      if (!targetIsExternal || includeExternal) {
        graph.edges.push({
          from: nodeId,
          to: targetId,
          type: imp.type,
          isDynamic: imp.type === 'dynamic'
        });

        if (!visited.has(imp.resolved)) {
          queue.push({ path: imp.resolved, depth: depth + 1 });
        }
      }
    }
  }

  return graph;
}

/**
 * Sanitize node ID for Mermaid
 */
function sanitizeNodeId(path) {
  return path
    .replace(/[\/\\]/g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '')
    .replace(/^(\d)/, 'n$1'); // Prefix if starts with number
}

/**
 * Generate Mermaid diagram from dependency graph
 */
export function generateMermaidDiagram(graph, options = {}) {
  const direction = options.direction || 'TD'; // Top to bottom
  const groupByFolder = options.groupByFolder !== false;

  const lines = [];
  lines.push('```mermaid');
  lines.push(`graph ${direction}`);
  lines.push('');

  // Group nodes by folder if enabled
  const folders = new Map();

  if (groupByFolder) {
    for (const [id, node] of graph.nodes) {
      if (node.isExternal) continue;

      const parts = node.path.split('/');
      if (parts.length > 1) {
        const folder = parts.slice(0, -1).join('/');
        if (!folders.has(folder)) {
          folders.set(folder, []);
        }
        folders.get(folder).push({ id, node });
      }
    }

    // Create subgraphs
    for (const [folder, nodes] of folders) {
      const subgraphId = sanitizeNodeId(folder);
      lines.push(`  subgraph ${subgraphId}["${folder}"]`);

      for (const { id, node } of nodes) {
        const label = node.path.split('/').pop();
        lines.push(`    ${id}["${label}"]`);
      }

      lines.push('  end');
      lines.push('');
    }
  }

  // Add ungrouped nodes
  for (const [id, node] of graph.nodes) {
    if (node.isExternal) {
      lines.push(`  ${id}(["${node.path}"])`);
    } else if (!groupByFolder || node.path.split('/').length === 1) {
      lines.push(`  ${id}["${node.path}"]`);
    }
  }

  lines.push('');

  // Add edges
  const addedEdges = new Set();

  for (const edge of graph.edges) {
    const edgeKey = `${edge.from}->${edge.to}`;
    if (addedEdges.has(edgeKey)) continue;

    addedEdges.add(edgeKey);

    const arrow = edge.isDynamic ? '-.->|dynamic|' : '-->';
    lines.push(`  ${edge.from} ${arrow} ${edge.to}`);
  }

  // Style external modules
  lines.push('');
  lines.push('  classDef external fill:#e1e8ed,stroke:#657786,stroke-width:2px');

  for (const [id, node] of graph.nodes) {
    if (node.isExternal) {
      lines.push(`  class ${id} external`);
    }
  }

  lines.push('```');
  return lines.join('\n');
}

/**
 * Generate circular dependency report
 */
export function detectCircularDependencies(graph) {
  const cycles = [];
  const visited = new Set();
  const recursionStack = new Set();

  function dfs(nodeId, path = []) {
    if (recursionStack.has(nodeId)) {
      // Found cycle
      const cycleStart = path.indexOf(nodeId);
      cycles.push(path.slice(cycleStart).concat(nodeId));
      return;
    }

    if (visited.has(nodeId)) {
      return;
    }

    visited.add(nodeId);
    recursionStack.add(nodeId);
    path.push(nodeId);

    // Find outgoing edges
    const outgoing = graph.edges.filter(e => e.from === nodeId);
    for (const edge of outgoing) {
      dfs(edge.to, [...path]);
    }

    recursionStack.delete(nodeId);
  }

  for (const [nodeId] of graph.nodes) {
    dfs(nodeId);
  }

  return cycles;
}

/**
 * Save dependency graph to file
 */
export async function saveDependencyGraph(result, outputPath, format = 'markdown') {
  const dir = dirname(outputPath);
  await fse.ensureDir(dir);

  const mermaidDiagram = generateMermaidDiagram(result.graph, { groupByFolder: true });
  const cycles = detectCircularDependencies(result.graph);

  const lines = [];
  lines.push('# Dependency Graph\n');
  lines.push('> Auto-generated by DocFlow\n');

  // Stats
  const stats = {
    totalModules: result.graph.nodes.size,
    externalModules: Array.from(result.graph.nodes.values()).filter(n => n.isExternal).length,
    totalDependencies: result.graph.edges.length,
    circularDependencies: cycles.length
  };

  lines.push('## Statistics\n');
  lines.push(`- **Total Modules**: ${stats.totalModules}`);
  lines.push(`- **External Modules**: ${stats.externalModules}`);
  lines.push(`- **Total Dependencies**: ${stats.totalDependencies}`);
  lines.push(`- **Circular Dependencies**: ${stats.circularDependencies}\n`);

  // Diagram
  lines.push('## Dependency Diagram\n');
  lines.push(mermaidDiagram);
  lines.push('');

  // Circular dependencies warning
  if (cycles.length > 0) {
    lines.push('## ⚠️ Circular Dependencies Detected\n');
    lines.push('The following circular dependencies were found:\n');

    for (let i = 0; i < cycles.length; i++) {
      const cycle = cycles[i];
      const paths = cycle.map(id => {
        const node = result.graph.nodes.get(id);
        return node ? node.path : id;
      });
      lines.push(`${i + 1}. ${paths.join(' → ')}\n`);
    }
  }

  if (format === 'separate') {
    // Save diagram to .mmd file
    const mmdPath = outputPath.replace(/\.md$/, '.mmd');
    await fse.writeFile(mmdPath, mermaidDiagram.replace(/```mermaid\n|\n```/g, ''));
    console.log(`  Saved diagram: ${mmdPath}`);
  }

  await fse.writeFile(outputPath, lines.join('\n'));
  console.log(`  Saved: ${outputPath}`);
}
