/**
 * DocFlow Project Detection Utilities
 * Auto-detect project type, tech stack, and frameworks
 */

import fse from 'fs-extra';
import { glob } from 'glob';
import { join } from 'path';

/**
 * Detect project type from files
 * Uses multi-phase detection for accuracy:
 * 1. Config files (highest confidence)
 * 2. Project files (glob patterns)
 * 3. Source files (fallback for projects without config)
 */
export async function detectProjectType(cwd) {
  // Phase 1: Check for definitive config files (highest confidence)
  const configChecks = [
    { files: ['package.json'], type: 'node' },
    { files: ['requirements.txt', 'pyproject.toml', 'setup.py', 'Pipfile', 'setup.cfg'], type: 'python' },
    { files: ['Cargo.toml'], type: 'rust' },
    { files: ['go.mod', 'go.sum'], type: 'go' },
    { files: ['pom.xml', 'build.gradle', 'build.gradle.kts'], type: 'java' },
    { files: ['Gemfile', 'Gemfile.lock'], type: 'ruby' },
    { files: ['composer.json'], type: 'php' },
  ];

  for (const check of configChecks) {
    for (const file of check.files) {
      if (await fse.pathExists(join(cwd, file))) {
        return check.type;
      }
    }
  }

  // Phase 2: Check for project files with glob patterns
  const globChecks = [
    { patterns: ['*.csproj', '*.sln', '*.fsproj'], type: 'dotnet' },
    { patterns: ['*.gemspec'], type: 'ruby' },
  ];

  for (const check of globChecks) {
    for (const pattern of check.patterns) {
      const matches = await glob(pattern, { cwd, nodir: true });
      if (matches.length > 0) return check.type;
    }
  }

  // Phase 3: Check for source files (fallback - no config file found)
  const sourceFileChecks = [
    { patterns: ['*.py', 'src/**/*.py'], type: 'python', exclude: ['**/node_modules/**', '**/.venv/**', '**/venv/**'] },
    { patterns: ['*.ps1', '*.psm1', '*.psd1'], type: 'powershell', exclude: [] },
    { patterns: ['*.go', 'src/**/*.go'], type: 'go', exclude: ['**/vendor/**'] },
    { patterns: ['*.rs', 'src/**/*.rs'], type: 'rust', exclude: ['**/target/**'] },
    { patterns: ['*.rb', 'lib/**/*.rb'], type: 'ruby', exclude: ['**/vendor/**'] },
    { patterns: ['*.php', 'src/**/*.php'], type: 'php', exclude: ['**/vendor/**'] },
    { patterns: ['*.java', 'src/**/*.java'], type: 'java', exclude: ['**/target/**', '**/build/**'] },
    { patterns: ['*.ts', '*.tsx', 'src/**/*.ts'], type: 'node', exclude: ['**/node_modules/**', '**/dist/**'] },
    { patterns: ['*.js', '*.jsx', 'src/**/*.js'], type: 'node', exclude: ['**/node_modules/**', '**/dist/**', '**/*.min.js'] },
  ];

  for (const check of sourceFileChecks) {
    for (const pattern of check.patterns) {
      try {
        const matches = await glob(pattern, { cwd, nodir: true, ignore: check.exclude, dot: false });
        if (matches.length > 0) return check.type;
      } catch (e) { /* ignore */ }
    }
  }

  return 'generic';
}

/**
 * Detect tech stack from project files
 */
export async function detectTechStack(cwd) {
  const stack = [];

  if (await fse.pathExists(join(cwd, 'package.json'))) stack.push('npm');
  if (await fse.pathExists(join(cwd, 'yarn.lock'))) stack.push('yarn');
  if (await fse.pathExists(join(cwd, 'pnpm-lock.yaml'))) stack.push('pnpm');
  if (await fse.pathExists(join(cwd, 'requirements.txt'))) stack.push('pip');
  if (await fse.pathExists(join(cwd, 'Pipfile'))) stack.push('pipenv');
  if (await fse.pathExists(join(cwd, 'poetry.lock'))) stack.push('poetry');
  if (await fse.pathExists(join(cwd, 'prisma'))) stack.push('Prisma');
  if (await fse.pathExists(join(cwd, 'drizzle.config.ts'))) stack.push('Drizzle');
  if (await fse.pathExists(join(cwd, '.github/workflows'))) stack.push('GitHub Actions');
  if (await fse.pathExists(join(cwd, '.gitlab-ci.yml'))) stack.push('GitLab CI');
  if (await fse.pathExists(join(cwd, 'azure-pipelines.yml'))) stack.push('Azure DevOps');
  if (await fse.pathExists(join(cwd, 'Dockerfile'))) stack.push('Docker');
  if (await fse.pathExists(join(cwd, 'docker-compose.yml'))) stack.push('Docker Compose');
  if (await fse.pathExists(join(cwd, 'kubernetes'))) stack.push('Kubernetes');
  if (await fse.pathExists(join(cwd, 'jest.config.js')) || await fse.pathExists(join(cwd, 'jest.config.ts'))) stack.push('Jest');
  if (await fse.pathExists(join(cwd, 'vitest.config.ts'))) stack.push('Vitest');
  if (await fse.pathExists(join(cwd, 'pytest.ini')) || await fse.pathExists(join(cwd, 'pyproject.toml'))) {
    if (await fse.pathExists(join(cwd, 'pyproject.toml'))) {
      const content = await fse.readFile(join(cwd, 'pyproject.toml'), 'utf-8');
      if (content.includes('pytest')) stack.push('pytest');
    }
  }

  return stack;
}

/**
 * Detect frameworks from project files
 */
export async function detectFrameworks(cwd) {
  const frameworks = [];

  const pkgPath = join(cwd, 'package.json');
  if (await fse.pathExists(pkgPath)) {
    try {
      const pkg = await fse.readJson(pkgPath);
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (deps['react']) frameworks.push('React');
      if (deps['vue']) frameworks.push('Vue');
      if (deps['@angular/core']) frameworks.push('Angular');
      if (deps['svelte']) frameworks.push('Svelte');
      if (deps['next']) frameworks.push('Next.js');
      if (deps['nuxt']) frameworks.push('Nuxt');
      if (deps['astro']) frameworks.push('Astro');
      if (deps['express']) frameworks.push('Express');
      if (deps['fastify']) frameworks.push('Fastify');
      if (deps['@nestjs/core']) frameworks.push('NestJS');
      if (deps['hono']) frameworks.push('Hono');
      if (deps['koa']) frameworks.push('Koa');
      if (deps['tailwindcss']) frameworks.push('Tailwind CSS');
      if (deps['bootstrap']) frameworks.push('Bootstrap');
      if (deps['redux']) frameworks.push('Redux');
      if (deps['zustand']) frameworks.push('Zustand');
      if (deps['typescript']) frameworks.push('TypeScript');
    } catch (e) { /* ignore */ }
  }

  const reqPath = join(cwd, 'requirements.txt');
  if (await fse.pathExists(reqPath)) {
    try {
      const content = await fse.readFile(reqPath, 'utf-8');
      if (content.includes('django')) frameworks.push('Django');
      if (content.includes('flask')) frameworks.push('Flask');
      if (content.includes('fastapi')) frameworks.push('FastAPI');
      if (content.includes('pandas')) frameworks.push('Pandas');
      if (content.includes('numpy')) frameworks.push('NumPy');
    } catch (e) { /* ignore */ }
  }

  const csprojFiles = await glob('**/*.csproj', { cwd, ignore: ['**/node_modules/**'] });
  if (csprojFiles.length > 0) {
    try {
      for (const file of csprojFiles.slice(0, 3)) {
        const content = await fse.readFile(join(cwd, file), 'utf-8');
        if (content.includes('Microsoft.AspNetCore')) frameworks.push('ASP.NET Core');
        if (content.includes('Microsoft.NET.Sdk.BlazorWebAssembly')) frameworks.push('Blazor');
        if (content.includes('Microsoft.EntityFrameworkCore')) frameworks.push('Entity Framework');
      }
    } catch (e) { /* ignore */ }
  }

  return [...new Set(frameworks)];
}

/**
 * Detect entry points
 */
export async function detectEntryPoints(cwd) {
  const entryPoints = [];
  const commonEntries = [
    'src/index.ts', 'src/index.js', 'src/main.ts', 'src/main.js',
    'index.ts', 'index.js', 'main.ts', 'main.js',
    'app.ts', 'app.js', 'server.ts', 'server.js',
    'src/app.ts', 'src/app.js', 'src/server.ts', 'src/server.js',
    'main.py', 'app.py', 'manage.py',
    'Program.cs', 'Startup.cs',
    'main.go', 'cmd/main.go',
    'lib/main.dart',
  ];

  for (const entry of commonEntries) {
    if (await fse.pathExists(join(cwd, entry))) {
      entryPoints.push(entry);
    }
  }

  return entryPoints;
}
