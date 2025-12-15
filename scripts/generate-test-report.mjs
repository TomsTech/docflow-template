#!/usr/bin/env node
/**
 * Universal Test Report Generator
 *
 * Runs tests and generates a beautiful HTML report.
 * Supports multiple test frameworks: vitest, jest, mocha, and Node.js built-in test runner.
 *
 * Usage:
 *   node scripts/generate-test-report.mjs
 *   node scripts/generate-test-report.mjs --title "v1.0.0 Release" --description "Release test results"
 *   node scripts/generate-test-report.mjs --input test-results.json --framework jest
 *
 * Output: test-report.html in project root
 */

import { execSync } from 'child_process';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// Parse CLI arguments
const args = process.argv.slice(2);
let title = 'Test Report';
let description = 'Automated test results';
let inputFile = null;
let outputFile = join(ROOT, 'test-report.html');
let framework = 'auto'; // auto, vitest, jest, mocha, node
let projectName = null;
let accentColour = '#22c55e'; // Default green

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--title' && args[i + 1]) {
    title = args[++i];
  } else if (args[i] === '--description' && args[i + 1]) {
    description = args[++i];
  } else if (args[i] === '--input' && args[i + 1]) {
    inputFile = args[++i];
  } else if (args[i] === '--output' && args[i + 1]) {
    outputFile = args[++i];
  } else if (args[i] === '--framework' && args[i + 1]) {
    framework = args[++i];
  } else if (args[i] === '--project' && args[i + 1]) {
    projectName = args[++i];
  } else if (args[i] === '--accent' && args[i + 1]) {
    accentColour = args[++i];
  } else if (args[i] === '--help') {
    console.log(`
Universal Test Report Generator

Usage:
  node scripts/generate-test-report.mjs [options]

Options:
  --title <string>       Report title (default: "Test Report")
  --description <string> Report description
  --input <file>         Use existing JSON file instead of running tests
  --output <file>        Output HTML file (default: test-report.html)
  --framework <type>     Test framework: auto, vitest, jest, mocha, node (default: auto)
  --project <name>       Project name for footer (reads from package.json if not set)
  --accent <colour>      Accent colour hex code (default: #22c55e)
  --help                 Show this help message

Examples:
  node scripts/generate-test-report.mjs --title "v1.0.0 Release"
  node scripts/generate-test-report.mjs --framework jest --input coverage/test-results.json
  node scripts/generate-test-report.mjs --accent "#1DB954" --project "My App"
`);
    process.exit(0);
  }
}

// Get project info from package.json
let version = '0.0.0';
let repoUrl = '';
if (existsSync(join(ROOT, 'package.json'))) {
  try {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'));
    version = pkg.version || version;
    projectName = projectName || pkg.name || 'Project';
    if (pkg.repository) {
      repoUrl = typeof pkg.repository === 'string'
        ? pkg.repository
        : pkg.repository.url || '';
      repoUrl = repoUrl.replace(/^git\+/, '').replace(/\.git$/, '');
    }
  } catch {
    // Ignore errors reading package.json
  }
}
projectName = projectName || 'Project';

console.log(`\n🧪 ${projectName} - Test Report Generator\n`);

// Detect test framework if auto
function detectFramework() {
  if (existsSync(join(ROOT, 'vitest.config.ts')) || existsSync(join(ROOT, 'vitest.config.js'))) {
    return 'vitest';
  }
  if (existsSync(join(ROOT, 'jest.config.js')) || existsSync(join(ROOT, 'jest.config.ts'))) {
    return 'jest';
  }
  if (existsSync(join(ROOT, 'package.json'))) {
    try {
      const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'));
      if (pkg.devDependencies?.vitest || pkg.dependencies?.vitest) return 'vitest';
      if (pkg.devDependencies?.jest || pkg.dependencies?.jest) return 'jest';
      if (pkg.devDependencies?.mocha || pkg.dependencies?.mocha) return 'mocha';
    } catch {
      // Ignore
    }
  }
  return 'node'; // Default to Node.js built-in test runner
}

if (framework === 'auto') {
  framework = detectFramework();
  console.log(`📦 Detected test framework: ${framework}`);
}

// Run tests or read existing results
let testResults;
let rawOutput = '';

if (inputFile) {
  console.log(`📁 Reading test results from ${inputFile}...`);
  testResults = JSON.parse(readFileSync(inputFile, 'utf-8'));
} else {
  console.log('🏃 Running tests with JSON reporter...');

  const testCommands = {
    vitest: 'npm test -- --reporter=json',
    jest: 'npm test -- --json --outputFile=test-results.json',
    mocha: 'npm test -- --reporter json',
    node: 'npm test'
  };

  try {
    rawOutput = execSync(testCommands[framework], {
      cwd: ROOT,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // For Jest, read from output file
    if (framework === 'jest' && existsSync(join(ROOT, 'test-results.json'))) {
      testResults = JSON.parse(readFileSync(join(ROOT, 'test-results.json'), 'utf-8'));
    } else {
      testResults = JSON.parse(rawOutput);
    }
  } catch (error) {
    // Tests might fail but still produce JSON output
    if (error.stdout) {
      try {
        rawOutput = error.stdout;
        if (framework === 'jest' && existsSync(join(ROOT, 'test-results.json'))) {
          testResults = JSON.parse(readFileSync(join(ROOT, 'test-results.json'), 'utf-8'));
        } else {
          testResults = JSON.parse(error.stdout);
        }
      } catch {
        console.log('⚠️  Could not parse JSON output, generating basic report');
        testResults = null;
      }
    } else if (framework === 'node') {
      // Node.js test runner doesn't output JSON by default
      console.log('⚠️  Node.js test runner detected - using basic output parsing');
      testResults = null;
    }
  }
}

// Parse test results based on framework
let passed = 0;
let failed = 0;
let pending = 0;
let total = 0;
let testSuites = [];

if (testResults) {
  if (framework === 'vitest' || framework === 'jest') {
    // Vitest and Jest have similar JSON structures
    const files = testResults.testResults || [];

    for (const file of files) {
      const suiteName = basename(file.name || file.testFilePath || 'Unknown');
      const suiteTests = [];

      const assertions = file.assertionResults || [];
      for (const test of assertions) {
        const testInfo = {
          name: test.title || test.fullName || 'Unknown Test',
          status: test.status === 'passed' ? 'passed' : test.status === 'failed' ? 'failed' : 'skipped',
          duration: test.duration || 0,
          suite: suiteName
        };
        suiteTests.push(testInfo);
      }

      testSuites.push({
        name: suiteName,
        tests: suiteTests,
        passed: suiteTests.filter(t => t.status === 'passed').length,
        failed: suiteTests.filter(t => t.status === 'failed').length
      });
    }

    passed = testResults.numPassedTests || testSuites.reduce((sum, s) => sum + s.passed, 0);
    failed = testResults.numFailedTests || testSuites.reduce((sum, s) => sum + s.failed, 0);
    pending = testResults.numPendingTests || 0;
    total = testResults.numTotalTests || (passed + failed + pending);

  } else if (framework === 'mocha') {
    // Mocha JSON structure
    const tests = testResults.tests || [];
    const passes = testResults.passes || [];
    const failures = testResults.failures || [];

    passed = passes.length;
    failed = failures.length;
    pending = testResults.pending?.length || 0;
    total = tests.length || (passed + failed + pending);

    // Group by suite
    const suiteMap = new Map();
    for (const test of [...passes, ...failures]) {
      const suiteName = test.fullTitle?.split(' ')[0] || 'Default Suite';
      if (!suiteMap.has(suiteName)) {
        suiteMap.set(suiteName, { name: suiteName, tests: [], passed: 0, failed: 0 });
      }
      const suite = suiteMap.get(suiteName);
      const status = passes.includes(test) ? 'passed' : 'failed';
      suite.tests.push({
        name: test.title || 'Unknown',
        status,
        duration: test.duration || 0,
        suite: suiteName
      });
      if (status === 'passed') suite.passed++;
      else suite.failed++;
    }
    testSuites = Array.from(suiteMap.values());
  }
} else {
  // Fallback: parse raw output for basic stats
  const passMatch = rawOutput.match(/(\d+)\s*pass/i);
  const failMatch = rawOutput.match(/(\d+)\s*fail/i);
  const skipMatch = rawOutput.match(/(\d+)\s*skip/i);

  passed = passMatch ? parseInt(passMatch[1]) : 0;
  failed = failMatch ? parseInt(failMatch[1]) : 0;
  pending = skipMatch ? parseInt(skipMatch[1]) : 0;
  total = passed + failed + pending;

  testSuites = [{
    name: 'All Tests',
    tests: [],
    passed,
    failed
  }];
}

console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed, ${pending} skipped (${total} total)\n`);

// Generate HTML
const timestamp = new Date().toISOString();
const html = generateHTML({
  title,
  description,
  projectName,
  version,
  repoUrl,
  timestamp,
  passed,
  failed,
  pending,
  total,
  testSuites,
  accentColour
});

writeFileSync(outputFile, html);
console.log(`✅ Report generated: ${outputFile}\n`);

// Exit with error code if tests failed
if (failed > 0) {
  process.exit(1);
}

function generateHTML({ title, description, projectName, version, repoUrl, timestamp, passed, failed, pending, total, testSuites, accentColour }) {
  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    :root {
      --bg: #0a0a0a;
      --surface: #141414;
      --surface-2: #1e1e1e;
      --border: #2a2a2a;
      --text: #fafafa;
      --text-muted: #888;
      --accent: ${accentColour};
      --danger: #e74c3c;
      --warning: #f39c12;
      --info: #3498db;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      padding: 2rem;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 {
      font-size: 2rem;
      margin-bottom: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    h1 .emoji { font-size: 2.5rem; }
    .subtitle { color: var(--text-muted); margin-bottom: 0.5rem; }
    .meta { color: var(--text-muted); font-size: 0.85rem; margin-bottom: 2rem; }
    .meta span { margin-right: 1.5rem; }

    .summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .summary-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.25rem;
      text-align: center;
    }
    .summary-card.success { border-color: var(--accent); }
    .summary-card.danger { border-color: var(--danger); }
    .summary-card.warning { border-color: var(--warning); }
    .summary-card.info { border-color: var(--info); }
    .summary-card .value {
      font-size: 2.5rem;
      font-weight: 700;
    }
    .summary-card.success .value { color: var(--accent); }
    .summary-card.danger .value { color: var(--danger); }
    .summary-card.warning .value { color: var(--warning); }
    .summary-card.info .value { color: var(--info); }
    .summary-card .label {
      color: var(--text-muted);
      font-size: 0.85rem;
      margin-top: 0.25rem;
    }

    .section {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }
    .section-title {
      font-size: 1.25rem;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .test-suite {
      margin-bottom: 1.5rem;
    }
    .test-suite:last-child { margin-bottom: 0; }
    .suite-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      background: var(--surface-2);
      border-radius: 8px;
      margin-bottom: 0.5rem;
      cursor: pointer;
    }
    .suite-header:hover { background: #252525; }
    .suite-name { flex: 1; font-weight: 500; }
    .suite-stats {
      display: flex;
      gap: 0.75rem;
      font-size: 0.85rem;
    }
    .suite-stats .pass { color: var(--accent); }
    .suite-stats .fail { color: var(--danger); }

    .test-list {
      display: none;
      padding-left: 1.5rem;
    }
    .test-list.expanded { display: block; }
    .test-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 0.75rem;
      border-radius: 6px;
    }
    .test-item:hover { background: var(--surface-2); }
    .test-item .status {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.7rem;
      flex-shrink: 0;
    }
    .test-item .status.pass { background: var(--accent); }
    .test-item .status.fail { background: var(--danger); }
    .test-item .status.skip { background: var(--warning); }
    .test-item .name { flex: 1; font-size: 0.9rem; }
    .test-item .duration {
      color: var(--text-muted);
      font-size: 0.8rem;
    }

    .badge {
      display: inline-block;
      padding: 0.2rem 0.6rem;
      border-radius: 50px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .badge.success { background: rgba(34, 197, 94, 0.2); color: var(--accent); }
    .badge.danger { background: rgba(231, 76, 60, 0.2); color: var(--danger); }

    .footer {
      text-align: center;
      margin-top: 3rem;
      padding-top: 2rem;
      border-top: 1px solid var(--border);
      color: var(--text-muted);
    }
    .footer a { color: var(--accent); text-decoration: none; }

    .progress-bar {
      height: 8px;
      background: var(--surface-2);
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 1rem;
    }
    .progress-bar .fill {
      height: 100%;
      background: var(--accent);
      transition: width 0.3s ease;
    }
    .progress-bar.has-failures .fill { background: linear-gradient(90deg, var(--accent) 0%, var(--danger) 100%); }

    .no-tests {
      text-align: center;
      padding: 3rem;
      color: var(--text-muted);
    }

    @media (max-width: 600px) {
      body { padding: 1rem; }
      .summary-cards { grid-template-columns: repeat(2, 1fr); }
      .suite-header { flex-wrap: wrap; }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>
      <span class="emoji">${failed > 0 ? '❌' : passed > 0 ? '✅' : '🧪'}</span>
      ${escapeHtml(title)}
    </h1>
    <p class="subtitle">${escapeHtml(description)}</p>
    <p class="meta">
      <span>📦 v${escapeHtml(version)}</span>
      <span>🕐 ${timestamp}</span>
      <span>📊 ${passRate}% pass rate</span>
    </p>

    <div class="progress-bar ${failed > 0 ? 'has-failures' : ''}">
      <div class="fill" style="width: ${passRate}%"></div>
    </div>

    <div class="summary-cards">
      <div class="summary-card ${passed > 0 ? 'success' : ''}">
        <div class="value">${passed}</div>
        <div class="label">Passed</div>
      </div>
      <div class="summary-card ${failed > 0 ? 'danger' : ''}">
        <div class="value">${failed}</div>
        <div class="label">Failed</div>
      </div>
      <div class="summary-card ${pending > 0 ? 'warning' : ''}">
        <div class="value">${pending}</div>
        <div class="label">Skipped</div>
      </div>
      <div class="summary-card info">
        <div class="value">${total}</div>
        <div class="label">Total</div>
      </div>
    </div>

    <div class="section">
      <h3 class="section-title">📋 Test Suites</h3>
      ${testSuites.length > 0 ? testSuites.map(suite => `
        <div class="test-suite">
          <div class="suite-header" onclick="this.nextElementSibling.classList.toggle('expanded')">
            <span class="suite-name">${escapeHtml(suite.name)}</span>
            <div class="suite-stats">
              <span class="pass">✓ ${suite.passed}</span>
              ${suite.failed > 0 ? `<span class="fail">✗ ${suite.failed}</span>` : ''}
            </div>
            <span class="badge ${suite.failed > 0 ? 'danger' : 'success'}">${suite.tests.length || (suite.passed + suite.failed)} tests</span>
          </div>
          <div class="test-list">
            ${suite.tests.length > 0 ? suite.tests.map(test => `
              <div class="test-item">
                <div class="status ${test.status === 'passed' ? 'pass' : test.status === 'failed' ? 'fail' : 'skip'}">
                  ${test.status === 'passed' ? '✓' : test.status === 'failed' ? '✗' : '○'}
                </div>
                <span class="name">${escapeHtml(test.name)}</span>
                ${test.duration ? `<span class="duration">${test.duration}ms</span>` : ''}
              </div>
            `).join('') : '<div class="test-item"><span class="name" style="color: var(--text-muted)">No detailed test information available</span></div>'}
          </div>
        </div>
      `).join('') : '<div class="no-tests">No test suites found</div>'}
    </div>

    <div class="footer">
      <p>${escapeHtml(projectName)}${repoUrl ? ` - <a href="${escapeHtml(repoUrl)}">View on GitHub</a>` : ''}</p>
      <p style="margin-top: 0.5rem; font-size: 0.8rem;">Generated by docflow test report generator</p>
    </div>
  </div>

  <script>
    // Expand failed suites by default
    document.querySelectorAll('.test-suite').forEach(suite => {
      if (suite.querySelector('.fail')) {
        suite.querySelector('.test-list').classList.add('expanded');
      }
    });
  </script>
</body>
</html>`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
