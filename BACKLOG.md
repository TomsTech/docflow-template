# DocFlow Backlog

> Prioritised feature backlog with detailed implementation plans.

---

## Priority Legend

| Priority | Label | Effort |
|----------|-------|--------|
| P0 | Critical | Hours |
| P1 | High | Days |
| P2 | Medium | Week |
| P3 | Nice to have | Weeks |

---

## Quick Wins (P0)

### 1. JSON Schema for Config Validation

**Status**: `DONE`
**Effort**: 1 hour
**Impact**: IDE autocomplete, validation, documentation

**Implementation Plan**:

1. Create `docflow.schema.json` in repo root
2. Define all properties from `docflow.config.json` with:
   - Types and constraints
   - Descriptions for each field
   - Default values
   - Required fields
   - Enum values for options
3. Update `docflow.config.json` to reference schema:
   ```json
   {
     "$schema": "./docflow.schema.json"
   }
   ```
4. Add schema to package.json for npm publishing

**Schema Structure**:
```
docflow.schema.json
├── $schema, $id, title, description
├── properties
│   ├── project (name, description, type, language, owner, repository)
│   ├── branding (primary, secondary, accent, background, success, warning, error)
│   ├── folders (enforce, required[], optional[])
│   ├── readme (generate, template, sections[], badges)
│   ├── diagrams (mermaid, erd, architecture, flow, state)
│   ├── documentation (output, dataDictionary, apiReference, changelog, asBuilt)
│   ├── templates (scaffold, adr, runbooks, features, api, database, architecture, security, deployment, variables)
│   ├── ai (claudeMd)
│   ├── security (owaspZap, secretScanning, dependencyScanning, codeql)
│   ├── linting (enabled, failOnError, languages)
│   ├── naming (enforce, rules)
│   ├── testing (enabled, phases, coverage, regression)
│   ├── releases (enabled, versioning, artifacts, notes)
│   ├── notifications (teams, email, github)
│   └── cicd (provider, environments, qualityGates, deployment)
└── required[], additionalProperties
```

**Files to Create**:
- `docflow.schema.json`

---

### 2. SECURITY.md - Vulnerability Reporting Policy

**Status**: `DONE`
**Effort**: 30 mins
**Impact**: Professional security posture, responsible disclosure

**Implementation Plan**:

1. Create `SECURITY.md` in repo root
2. Include sections:
   - Supported versions table
   - Reporting a vulnerability (email, response time)
   - Security update process
   - PGP key for encrypted reports (optional)
   - Bug bounty policy (if applicable)
   - Security-related configuration

**Template**:
```markdown
# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x.x   | Yes       |
| < 1.0   | No        |

## Reporting a Vulnerability

**DO NOT** create public GitHub issues for security vulnerabilities.

Email: security@tomstech.com.au
Response: Within 48 hours
Disclosure: 90 days coordinated disclosure

## Process

1. Report received and acknowledged
2. Vulnerability confirmed and severity assessed
3. Fix developed and tested
4. Security advisory published
5. Fix released
```

**Files to Create**:
- `SECURITY.md`

---

### 3. Dependabot Configuration

**Status**: `DONE`
**Effort**: 15 mins
**Impact**: Automated dependency updates, security patches

**Implementation Plan**:

1. Create `.github/dependabot.yml`
2. Configure for:
   - npm (package.json)
   - GitHub Actions (workflow files)
   - Docker (if Dockerfiles exist)
3. Set update schedule (weekly)
4. Configure PR limits and labels

**Configuration**:
```yaml
version: 2
updates:
  # npm dependencies
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
    open-pull-requests-limit: 5
    labels:
      - "dependencies"
      - "automated"
    commit-message:
      prefix: "deps"

  # GitHub Actions
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
    labels:
      - "ci"
      - "automated"
    commit-message:
      prefix: "ci"
```

**Files to Create**:
- `.github/dependabot.yml`

---

### 4. CODEOWNERS File

**Status**: `DONE`
**Effort**: 15 mins
**Impact**: Automatic PR review assignment, ownership clarity

**Implementation Plan**:

1. Create `.github/CODEOWNERS`
2. Define ownership patterns:
   - Global default owner
   - Workflow files
   - Documentation
   - Templates
   - Security-related files

**Configuration**:
```
# Default owner for everything
* @TomsTech

# Workflows require owner review
.github/workflows/ @TomsTech

# Security files require owner review
SECURITY.md @TomsTech
.github/dependabot.yml @TomsTech

# Documentation
docs/ @TomsTech
*.md @TomsTech

# Configuration
docflow.config.json @TomsTech
docflow.schema.json @TomsTech
```

**Files to Create**:
- `.github/CODEOWNERS`

---

### 5. Pull Request Template

**Status**: `DONE`
**Effort**: 20 mins
**Impact**: Standardised PRs, better reviews

**Implementation Plan**:

1. Create `.github/PULL_REQUEST_TEMPLATE.md`
2. Include sections:
   - Description
   - Type of change (feature, fix, docs, etc.)
   - Checklist
   - Testing instructions
   - Screenshots (if UI)
   - Related issues

**Template**:
```markdown
## Description

<!-- Describe your changes -->

## Type of Change

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to change)
- [ ] Documentation update
- [ ] Configuration change

## Checklist

- [ ] I have read the contributing guidelines
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code where necessary
- [ ] I have updated the documentation
- [ ] My changes generate no new warnings
- [ ] Any dependent changes have been merged

## Testing

<!-- How has this been tested? -->

## Related Issues

<!-- Link related issues: Fixes #123, Relates to #456 -->
```

**Files to Create**:
- `.github/PULL_REQUEST_TEMPLATE.md`

---

## Medium Effort (P1)

### 6. CLI Tool - `npx docflow`

**Status**: `DONE`
**Effort**: 4-6 hours
**Impact**: Interactive scaffolding, ease of use, adoption

**Implementation Plan**:

1. **Setup**:
   - Add CLI dependencies to package.json:
     ```json
     {
       "bin": {
         "docflow": "./bin/docflow.js"
       },
       "dependencies": {
         "commander": "^11.0.0",
         "inquirer": "^9.0.0",
         "chalk": "^5.0.0",
         "ora": "^7.0.0",
         "fs-extra": "^11.0.0"
       }
     }
     ```

2. **Commands**:
   ```
   docflow init          # Interactive project setup
   docflow scaffold      # Generate docs structure
   docflow add adr       # Add new ADR
   docflow add runbook   # Add new runbook
   docflow validate      # Validate docflow.config.json
   docflow generate      # Generate documentation locally
   ```

3. **File Structure**:
   ```
   bin/
   └── docflow.js        # Entry point
   src/
   └── cli/
       ├── index.js      # Commander setup
       ├── commands/
       │   ├── init.js
       │   ├── scaffold.js
       │   ├── add.js
       │   ├── validate.js
       │   └── generate.js
       ├── prompts/
       │   ├── init.js
       │   └── add.js
       └── utils/
           ├── template.js
           ├── config.js
           └── logger.js
   ```

4. **Init Flow**:
   ```
   $ npx docflow init

   ┌─────────────────────────────────────┐
   │         DocFlow Setup               │
   └─────────────────────────────────────┘

   ? Project name: My Project
   ? Project description: My awesome project
   ? Project type: (auto-detected: node)
   ? Enable security scanning? Yes
   ? Enable documentation generation? Yes
   ? Which templates? (multi-select)
     [x] ADR
     [x] Runbooks
     [x] API
     [ ] Database
     [x] Security

   Creating docflow.config.json... done
   Creating .github/workflows... done
   Creating docs/templates... done

   ✔ DocFlow initialized successfully!

   Next steps:
     1. Review docflow.config.json
     2. Commit and push
     3. Watch the magic happen
   ```

5. **Publishing**:
   - Publish to npm as `@tomstech/docflow`
   - Add GitHub Action for npm publish on release

**Files to Create**:
- `bin/docflow.js`
- `src/cli/index.js`
- `src/cli/commands/*.js`
- Update `package.json`

---

### 7. Project Type Auto-Detection

**Status**: `DONE`
**Effort**: 2-3 hours
**Impact**: Zero-config setup, smart defaults

**Implementation Plan**:

1. **Detection Logic** (in CLI and workflows):
   ```javascript
   function detectProjectType() {
     const checks = [
       { file: 'package.json', type: 'node' },
       { file: 'requirements.txt', type: 'python' },
       { file: 'pyproject.toml', type: 'python' },
       { file: 'Cargo.toml', type: 'rust' },
       { file: 'go.mod', type: 'go' },
       { file: '*.csproj', type: 'dotnet' },
       { file: '*.sln', type: 'dotnet' },
       { file: 'pom.xml', type: 'java' },
       { file: 'build.gradle', type: 'java' },
       { file: '*.ps1', type: 'powershell' },
       { file: 'Gemfile', type: 'ruby' },
       { file: 'composer.json', type: 'php' },
     ];

     for (const check of checks) {
       if (glob.sync(check.file).length > 0) {
         return check.type;
       }
     }
     return 'generic';
   }
   ```

2. **Type-Specific Defaults**:
   ```javascript
   const typeDefaults = {
     node: {
       linting: { tool: 'eslint' },
       testing: { tool: 'jest' },
       packageManager: 'npm',
     },
     python: {
       linting: { tool: 'ruff' },
       testing: { tool: 'pytest' },
       packageManager: 'pip',
     },
     // ... etc
   };
   ```

3. **Integration Points**:
   - CLI `init` command
   - Workflow detection step
   - Config generation

**Files to Create/Modify**:
- `src/cli/utils/detect.js`
- `src/cli/commands/init.js`
- `.github/workflows/docflow-quality-gates.yml`

---

### 8. CLAUDE.md Generator

**Status**: `DONE`
**Effort**: 3-4 hours
**Impact**: AI-ready projects, better Claude Code integration

**Implementation Plan**:

1. **Generator Script**:
   ```javascript
   async function generateClaudeMd(config) {
     const sections = [];

     // Project Overview
     sections.push(generateProjectOverview(config));

     // Folder Structure (auto-scan)
     sections.push(await generateFolderStructure());

     // Tech Stack (from package.json, etc.)
     sections.push(await generateTechStack());

     // Common Commands
     sections.push(generateCommonCommands(config));

     // Key Files (detect entry points, configs)
     sections.push(await generateKeyFiles());

     // Data Model (from schemas)
     sections.push(await generateDataModel());

     return sections.join('\n\n---\n\n');
   }
   ```

2. **Auto-Detection**:
   - Scan for entry points (`index.js`, `main.py`, `Program.cs`)
   - Detect frameworks (React, Express, Django, etc.)
   - Find config files
   - Identify test patterns
   - Extract scripts from package.json

3. **CLI Command**:
   ```
   docflow generate claude    # Generate/update CLAUDE.md
   ```

4. **Workflow Integration**:
   - Add step to `docflow-generate-docs.yml`
   - Auto-update on push

**Files to Create**:
- `src/cli/commands/generate-claude.js`
- `src/generators/claude.js`
- Update workflows

---

### 9. Mermaid Diagram Generation from Code

**Status**: `DONE`
**Effort**: 6-8 hours
**Impact**: Auto-generated architecture diagrams, always up-to-date

**Implementation Plan**:

1. **ERD from Prisma**:
   ```javascript
   // Parse prisma/schema.prisma
   function prismaToMermaid(schemaPath) {
     const schema = fs.readFileSync(schemaPath, 'utf-8');
     const models = parsePrismaModels(schema);

     let mermaid = 'erDiagram\n';
     for (const model of models) {
       mermaid += `    ${model.name} {\n`;
       for (const field of model.fields) {
         mermaid += `        ${field.type} ${field.name}\n`;
       }
       mermaid += '    }\n';

       for (const relation of model.relations) {
         mermaid += `    ${model.name} ||--o{ ${relation.target} : "${relation.name}"\n`;
       }
     }
     return mermaid;
   }
   ```

2. **ERD from TypeORM/Sequelize**:
   - Parse entity decorators
   - Extract relationships

3. **Dependency Graph**:
   ```javascript
   // Generate from imports
   function generateDependencyGraph(srcDir) {
     const files = glob.sync(`${srcDir}/**/*.{js,ts}`);
     const graph = new Map();

     for (const file of files) {
       const imports = extractImports(file);
       graph.set(file, imports);
     }

     return graphToMermaid(graph);
   }
   ```

4. **Workflow Diagram**:
   - Parse GitHub Actions YAML
   - Generate job dependency flowchart

5. **Output**:
   - Write to `docs/diagrams/`
   - Embed in README
   - Generate PNG via mermaid-cli

**Files to Create**:
- `src/generators/erd.js`
- `src/generators/dependency-graph.js`
- `src/generators/workflow-diagram.js`
- `src/parsers/prisma.js`
- `src/parsers/typeorm.js`

---

## Bigger Features (P2)

### 10. VS Code Extension

**Status**: `TODO` (Requires separate repository)
**Effort**: 2-3 weeks
**Impact**: IDE integration, snippets, one-click scaffolding

**Implementation Plan**:

1. **Extension Setup**:
   ```
   vscode-docflow/
   ├── package.json
   ├── src/
   │   ├── extension.ts
   │   ├── commands/
   │   ├── providers/
   │   └── utils/
   ├── snippets/
   │   ├── adr.json
   │   ├── runbook.json
   │   └── api.json
   └── syntaxes/
       └── docflow.tmLanguage.json
   ```

2. **Features**:
   - Command palette: `DocFlow: Init`, `DocFlow: Add ADR`, etc.
   - Snippets for all templates
   - Config file validation
   - Tree view for docs structure
   - Preview for Mermaid diagrams
   - Status bar indicator

3. **Snippets**:
   ```json
   {
     "ADR": {
       "prefix": "adr",
       "body": [
         "# ADR-${1:000}: ${2:Title}",
         "",
         "> ${3:Decision summary}",
         "",
         "## Status",
         "",
         "${4|Proposed,Accepted,Deprecated,Superseded|}",
         ""
       ]
     }
   }
   ```

4. **Publishing**:
   - Publish to VS Code Marketplace
   - Add to recommended extensions in `.vscode/extensions.json`

**Files to Create**:
- New repo: `vscode-docflow`

---

### 11. GitHub App for Auto-Documentation PRs

**Status**: `TODO` (Requires separate repository and hosting)
**Effort**: 2-3 weeks
**Impact**: Fully automated documentation, zero maintenance

**Implementation Plan**:

1. **App Setup**:
   - Create GitHub App
   - Configure webhooks for push events
   - Set up Probot or custom Node.js server

2. **Workflow**:
   ```
   Push to main
       │
       ▼
   GitHub App receives webhook
       │
       ▼
   Clone repo, run docflow generate
       │
       ▼
   If changes detected:
       │
       ▼
   Create PR with documentation updates
       │
       ▼
   Auto-merge if configured
   ```

3. **Features**:
   - Auto-update README badges
   - Regenerate diagrams
   - Update CLAUDE.md
   - Create documentation PRs
   - Comment on PRs with doc previews

4. **Hosting**:
   - Deploy to Vercel/Railway/Fly.io
   - Or use GitHub Actions as backend

**Files to Create**:
- New repo: `docflow-bot`

---

### 12. Multi-Repo Documentation Aggregation

**Status**: `DONE`
**Effort**: 3-4 weeks
**Impact**: Monorepo support, organisation-wide docs

**Implementation Plan**:

1. **Config Extension**:
   ```json
   {
     "multiRepo": {
       "enabled": true,
       "repos": [
         "org/repo1",
         "org/repo2"
       ],
       "outputRepo": "org/docs",
       "aggregation": {
         "readme": true,
         "adrs": true,
         "apiDocs": true
       }
     }
   }
   ```

2. **Aggregation Script**:
   - Clone all configured repos
   - Extract documentation
   - Merge into unified structure
   - Generate cross-repo links
   - Push to docs repo

3. **Output Structure**:
   ```
   docs-repo/
   ├── README.md           # Organisation overview
   ├── repos/
   │   ├── repo1/
   │   │   └── docs/
   │   └── repo2/
   │       └── docs/
   ├── adrs/               # All ADRs aggregated
   ├── api/                # All API docs
   └── architecture/       # Organisation architecture
   ```

4. **Workflow**:
   - Scheduled aggregation (daily/weekly)
   - Triggered by webhooks from source repos

**Files to Create**:
- `src/cli/commands/aggregate.js`
- `.github/workflows/docflow-aggregate.yml`

---

## Icebox (P3)

### 13. Documentation Site Generator

**Status**: `DONE`

Generate a static site from all documentation using Docusaurus/VitePress.

### 14. AI-Powered Documentation Review

**Status**: `TODO` (Requires API integration)

Use Claude API to review and suggest improvements to documentation.

### 15. Documentation Coverage Metrics

**Status**: `DONE`

Track what percentage of code/APIs have documentation.

### 16. Internationalization Support

**Status**: `TODO`

Generate documentation in multiple languages.

### 17. PDF Report Generation

**Status**: `DONE`

Generate comprehensive PDF reports from all documentation.

---

## Changelog

| Date | Change |
|------|--------|
| 2024-12-08 | Initial backlog created |
| 2024-12-08 | Completed P0 items: JSON Schema, SECURITY.md, Dependabot, CODEOWNERS, PR Template |
| 2024-12-08 | Completed P1 items: CLI Tool, Auto-Detection, CLAUDE.md Generator |
| 2024-12-08 | Bonus: Added GitHub Issue Templates |
| 2024-12-08 | Completed P2/P3: Mermaid diagrams, Coverage metrics, PDF export, Multi-repo aggregation, Site generator |
