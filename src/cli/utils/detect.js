/**
 * DocFlow Project Detection Utilities
 * Auto-detect project type, tech stack, and frameworks
 */

import fse from 'fs-extra';
import { glob } from 'glob';
import { join } from 'path';

/**
 * Detect project type from files
 */
export async function detectProjectType(cwd) {
  const checks = [
    { files: ['package.json'], type: 'node' },
    { files: ['requirements.txt', 'pyproject.toml', 'setup.py'], type: 'python' },
    { files: ['Cargo.toml'], type: 'rust' },
    { files: ['go.mod'], type: 'go' },
    { files: ['*.csproj', '*.sln', '*.fsproj'], type: 'dotnet' },
    { files: ['pom.xml', 'build.gradle', 'build.gradle.kts'], type: 'java' },
    { files: ['Gemfile', '*.gemspec'], type: 'ruby' },
    { files: ['composer.json'], type: 'php' },
    { files: ['*.ps1', '*.psm1'], type: 'powershell' },
  ];

  for (const check of checks) {
    for (const pattern of check.files) {
      if (pattern.includes('*')) {
        const matches = await glob(pattern, { cwd, nodir: true });
        if (matches.length > 0) return check.type;
      } else {
        if (await fse.pathExists(join(cwd, pattern))) {
          return check.type;
        }
      }
    }
  }

  return 'generic';
}

/**
 * Detect tech stack from project files
 */
export async function detectTechStack(cwd) {
  const stack = [];

  // Check for package managers
  if (await fse.pathExists(join(cwd, 'package.json'))) stack.push('npm');
  if (await fse.pathExists(join(cwd, 'yarn.lock'))) stack.push('yarn');
  if (await fse.pathExists(join(cwd, 'pnpm-lock.yaml'))) stack.push('pnpm');
  if (await fse.pathExists(join(cwd, 'requirements.txt'))) stack.push('pip');
  if (await fse.pathExists(join(cwd, 'Pipfile'))) stack.push('pipenv');
  if (await fse.pathExists(join(cwd, 'poetry.lock'))) stack.push('poetry');

  // Check for databases
  if (await fse.pathExists(join(cwd, 'prisma'))) stack.push('Prisma');
  if (await fse.pathExists(join(cwd, 'drizzle.config.ts'))) stack.push('Drizzle');

  // Check for CI/CD
  if (await fse.pathExists(join(cwd, '.github/workflows'))) stack.push('GitHub Actions');
  if (await fse.pathExists(join(cwd, '.gitlab-ci.yml'))) stack.push('GitLab CI');
  if (await fse.pathExists(join(cwd, 'azure-pipelines.yml'))) stack.push('Azure DevOps');

  // Check for containerisation
  if (await fse.pathExists(join(cwd, 'Dockerfile'))) stack.push('Docker');
  if (await fse.pathExists(join(cwd, 'docker-compose.yml'))) stack.push('Docker Compose');
  if (await fse.pathExists(join(cwd, 'kubernetes'))) stack.push('Kubernetes');

  // Check for testing
  if (await fse.pathExists(join(cwd, 'jest.config.js')) ||
      await fse.pathExists(join(cwd, 'jest.config.ts'))) stack.push('Jest');
  if (await fse.pathExists(join(cwd, 'vitest.config.ts'))) stack.push('Vitest');
  if (await fse.pathExists(join(cwd, 'pytest.ini')) ||
      await fse.pathExists(join(cwd, 'pyproject.toml'))) {
    // Check if pytest is mentioned
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

  // Check package.json for Node.js frameworks
  const pkgPath = join(cwd, 'package.json');
  if (await fse.pathExists(pkgPath)) {
    try {
      const pkg = await fse.readJson(pkgPath);
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };

      // Frontend frameworks
      if (deps['react']) frameworks.push('React');
      if (deps['vue']) frameworks.push('Vue');
      if (deps['@angular/core']) frameworks.push('Angular');
      if (deps['svelte']) frameworks.push('Svelte');
      if (deps['next']) frameworks.push('Next.js');
      if (deps['nuxt']) frameworks.push('Nuxt');
      if (deps['astro']) frameworks.push('Astro');

      // Backend frameworks
      if (deps['express']) frameworks.push('Express');
      if (deps['fastify']) frameworks.push('Fastify');
      if (deps['@nestjs/core']) frameworks.push('NestJS');
      if (deps['hono']) frameworks.push('Hono');
      if (deps['koa']) frameworks.push('Koa');

      // CSS frameworks
      if (deps['tailwindcss']) frameworks.push('Tailwind CSS');
      if (deps['bootstrap']) frameworks.push('Bootstrap');

      // State management
      if (deps['redux']) frameworks.push('Redux');
      if (deps['zustand']) frameworks.push('Zustand');

      // TypeScript
      if (deps['typescript']) frameworks.push('TypeScript');
    } catch (e) {
      // Ignore parse errors
    }
  }

  // Check requirements.txt for Python frameworks
  const reqPath = join(cwd, 'requirements.txt');
  if (await fse.pathExists(reqPath)) {
    try {
      const content = await fse.readFile(reqPath, 'utf-8');
      if (content.includes('django')) frameworks.push('Django');
      if (content.includes('flask')) frameworks.push('Flask');
      if (content.includes('fastapi')) frameworks.push('FastAPI');
      if (content.includes('pandas')) frameworks.push('Pandas');
      if (content.includes('numpy')) frameworks.push('NumPy');
    } catch (e) {
      // Ignore read errors
    }
  }

  // Check for .NET frameworks
  const csprojFiles = await glob('**/*.csproj', { cwd, ignore: ['**/node_modules/**'] });
  if (csprojFiles.length > 0) {
    try {
      for (const file of csprojFiles.slice(0, 3)) {
        const content = await fse.readFile(join(cwd, file), 'utf-8');
        if (content.includes('Microsoft.AspNetCore')) frameworks.push('ASP.NET Core');
        if (content.includes('Microsoft.NET.Sdk.BlazorWebAssembly')) frameworks.push('Blazor');
        if (content.includes('Microsoft.EntityFrameworkCore')) frameworks.push('Entity Framework');
      }
    } catch (e) {
      // Ignore read errors
    }
  }

  // Deduplicate
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
