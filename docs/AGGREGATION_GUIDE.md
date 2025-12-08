# Multi-Repository Documentation Aggregation Guide

## Overview

DocFlow's aggregation feature allows you to collect and merge documentation from multiple repositories into a unified documentation site. This is ideal for:

- **Microservices architectures** - Aggregate API docs from multiple services
- **Multi-repo projects** - Combine ADRs and runbooks across repos
- **Documentation portals** - Build centralized knowledge bases
- **Cross-team collaboration** - Share best practices and standards

## Quick Start

### 1. Configure Aggregation

Add to your `docflow.config.json`:

```json
{
  "aggregate": {
    "enabled": true,
    "repos": [
      "myorg/service-auth",
      "myorg/service-orders",
      "myorg/service-payments"
    ],
    "output": "docs/aggregated",
    "sections": ["adr", "api", "runbooks"],
    "schedule": "weekly",
    "conflictResolution": "prefix"
  }
}
```

### 2. Run Aggregation

```bash
# Use configuration from docflow.config.json
docflow aggregate --clone

# Override with CLI options
docflow aggregate --repos "org/repo1,org/repo2" --sections "adr,api" --clone

# Clean output directory first
docflow aggregate --clean --clone
```

### 3. Review Output

Aggregated documentation will be in `docs/aggregated/`:

```
docs/aggregated/
├── INDEX.md              # Unified index with navigation
├── adr/                  # Architecture Decision Records
│   ├── service-auth-ADR-001-oauth2.md
│   ├── service-orders-ADR-001-event-sourcing.md
│   └── service-payments-ADR-001-pci-compliance.md
├── api/                  # API Documentation
│   ├── authentication-api.md
│   ├── orders-api.md
│   └── payments-api.md
└── runbooks/            # Operational Runbooks
    ├── RB-001-auth-service-restart.md
    ├── RB-002-order-reconciliation.md
    └── RB-003-payment-gateway-failover.md
```

## Configuration Options

### `aggregate.enabled`
- **Type**: `boolean`
- **Default**: `false`
- **Description**: Enable/disable aggregation feature

### `aggregate.repos`
- **Type**: `string[]`
- **Format**: `"org/repo"` (GitHub format)
- **Description**: List of repositories to aggregate from
- **Example**: `["myorg/repo1", "myorg/repo2"]`

### `aggregate.output`
- **Type**: `string`
- **Default**: `"docs/aggregated"`
- **Description**: Output directory for aggregated docs

### `aggregate.sections`
- **Type**: `string[]`
- **Options**: `"adr"`, `"api"`, `"runbooks"`, `"features"`, `"architecture"`, `"database"`, `"security"`, `"deployment"`
- **Default**: `["adr", "api", "runbooks"]`
- **Description**: Which documentation sections to aggregate

### `aggregate.schedule`
- **Type**: `string`
- **Options**: `"daily"`, `"weekly"`, `"monthly"`, `"manual"`
- **Default**: `"weekly"`
- **Description**: Automated aggregation schedule (for CI/CD)

### `aggregate.conflictResolution`
- **Type**: `string`
- **Options**: `"prefix"`, `"merge"`, `"skip"`, `"error"`
- **Default**: `"prefix"`
- **Description**: How to handle filename conflicts
  - `prefix`: Add repo name prefix to filename
  - `merge`: Combine content into single document
  - `skip`: Keep first occurrence, skip duplicates
  - `error`: Fail on conflict (requires manual resolution)

### `aggregate.cloneDepth`
- **Type**: `integer`
- **Default**: `1`
- **Description**: Git clone depth for source repos (shallow clones are faster)

## CLI Usage

### Basic Aggregation

```bash
# Use config file settings
docflow aggregate

# Specify repos on command line
docflow aggregate --repos "org/repo1,org/repo2"

# Select specific sections
docflow aggregate --sections "adr,runbooks"

# Specify custom output directory
docflow aggregate --output "docs/multi-repo"
```

### Advanced Options

```bash
# Clone repositories if not present locally
docflow aggregate --clone

# Clean output directory before aggregation
docflow aggregate --clean

# Combine options
docflow aggregate --repos "org/repo1,org/repo2" --sections "adr,api" --clone --clean
```

### GitHub Actions Integration

The workflow `.github/workflows/docflow-aggregate.yml` runs automatically:

- **Schedule**: Weekly (Sunday 2 AM UTC)
- **Manual**: Via workflow dispatch
- **On-demand**: Manual trigger with custom options

Trigger manually:

```bash
# Using GitHub CLI
gh workflow run "docflow-aggregate.yml" \
  -f repos="org/repo1,org/repo2" \
  -f sections="adr,api" \
  -f clean=true

# Via GitHub UI
# Actions → DocFlow: Aggregate Multi-Repo Documentation → Run workflow
```

## How It Works

### 1. Repository Cloning

```javascript
cloneRepos(repos, targetDir)
```

- Clones configured repositories to `.docflow/repos/`
- Uses shallow clone (`--depth 1`) for speed
- Skips if repository already exists
- Supports public and private repos (with proper auth)

### 2. Documentation Extraction

```javascript
extractDocs(repoDir, options)
```

For each repository:
- Searches common documentation paths
- Extracts metadata from frontmatter
- Categorizes by section (ADR, API, runbooks, etc.)
- Preserves relative paths within sections

**Paths searched per section**:
- **ADR**: `docs/architecture/adr`, `docs/adr`, `adr`, `.design/adr`
- **API**: `docs/api`, `api`, `docs/endpoints`
- **Runbooks**: `docs/runbooks`, `runbooks`, `docs/operations`
- **Architecture**: `docs/architecture`, `architecture`, `.design`

### 3. Conflict Resolution

```javascript
mergeDocumentation(allDocs, options)
```

When multiple repos have files with the same name:

**Prefix Strategy** (default for ADRs, runbooks):
```
service-auth-ADR-001-oauth2.md
service-orders-ADR-001-event-sourcing.md
```

**Merge Strategy** (for general docs):
```markdown
# Combined Document Title

> Note: Aggregated from multiple repositories

## From service-auth
[Content from first repo]

---

## From service-orders
[Content from second repo]
```

### 4. Cross-Reference Linking

```javascript
linkCrossReferences(merged)
```

- Detects markdown links between documents
- Updates paths for cross-repo references
- Preserves anchors (`#section-name`)
- Example: `[See ADR](../adr/service-auth-ADR-001.md)`

### 5. Index Generation

```javascript
generateIndex(merged, options)
```

Creates `INDEX.md` with:
- Summary statistics
- Source repository list
- Navigation by section
- Status indicators
- Conflict resolution markers

## Metadata Extraction

DocFlow extracts metadata from:

### YAML Frontmatter
```yaml
---
title: OAuth 2.0 Implementation
date: 2024-12-01
author: Security Team
status: Accepted
tags: [security, authentication, oauth]
---
```

### ADR Format
```markdown
# ADR-001: Use OAuth 2.0

## Status
Accepted

## Date
2024-12-01
```

Metadata is used for:
- Document titles in index
- Status badges
- Sorting and filtering
- Search metadata

## Error Handling

### Missing Repositories
```
Error: Repository not found: org/missing-repo
```
**Solution**: Verify repo name and access permissions

### Authentication Failures
```
Error: Failed to clone org/private-repo: Authentication required
```
**Solution**: Configure GitHub token in environment:
```bash
export GITHUB_TOKEN=ghp_your_token_here
```

### Invalid Configuration
```
Error: No repositories configured
```
**Solution**: Add repos to `docflow.config.json` or use `--repos` flag

### Merge Conflicts
```
Warning: Filename conflict detected: api-reference.md
Resolution: prefix
```
**Result**: Files renamed with repo prefix

## Best Practices

### 1. Section Organization

Keep related documentation in standard paths:
```
docs/
├── adr/           # Architecture decisions
├── api/           # API documentation
├── runbooks/      # Operational procedures
├── architecture/  # High-level design
└── features/      # Feature specifications
```

### 2. Consistent Naming

Use consistent file naming across repos:
```
ADR-{number}-{title}.md
RB-{number}-{title}.md
API-{resource}.md
```

### 3. Frontmatter

Always include frontmatter for better metadata:
```yaml
---
title: Document Title
date: 2024-12-01
author: Team Name
status: Draft|Active|Deprecated
tags: [tag1, tag2]
---
```

### 4. Cross-References

Use relative links that work in both individual and aggregated views:
```markdown
See [Authentication ADR](../adr/ADR-001-authentication.md)
```

### 5. Regular Updates

Schedule regular aggregation:
- **Daily**: For rapidly changing documentation
- **Weekly**: Standard cadence for most projects
- **Monthly**: For stable, long-term documentation

## Troubleshooting

### Issue: Aggregated docs are empty

**Causes**:
- Documentation not in standard paths
- Wrong section names specified
- Files not in markdown format

**Solution**:
```bash
# Verify repo structure
ls -R .docflow/repos/repo-name/docs/

# Check all sections
docflow aggregate --sections "adr,api,runbooks,features,architecture"
```

### Issue: Cross-references broken

**Cause**: Links use absolute paths or external URLs

**Solution**: Use relative paths within documentation:
```markdown
# Bad
[Link](/docs/adr/ADR-001.md)
[Link](https://github.com/org/repo/blob/main/docs/adr/ADR-001.md)

# Good
[Link](../adr/ADR-001.md)
[Link](./local-doc.md)
```

### Issue: Clone fails with rate limit

**Cause**: GitHub API rate limiting

**Solution**:
```bash
# Authenticate with GitHub CLI
gh auth login

# Or set token
export GITHUB_TOKEN=your_token
```

### Issue: Old content still present

**Solution**: Use `--clean` flag:
```bash
docflow aggregate --clean --clone
```

## Examples

### Example 1: Microservices API Aggregation

```json
{
  "aggregate": {
    "enabled": true,
    "repos": [
      "company/auth-service",
      "company/user-service",
      "company/order-service",
      "company/payment-service"
    ],
    "sections": ["api", "runbooks"],
    "output": "docs/microservices",
    "conflictResolution": "prefix"
  }
}
```

### Example 2: ADR Knowledge Base

```json
{
  "aggregate": {
    "enabled": true,
    "repos": [
      "company/platform-core",
      "company/platform-ui",
      "company/platform-api",
      "company/platform-infra"
    ],
    "sections": ["adr", "architecture"],
    "output": "docs/architecture-decisions",
    "conflictResolution": "merge"
  }
}
```

### Example 3: Operations Runbooks

```json
{
  "aggregate": {
    "enabled": true,
    "repos": [
      "company/ops-database",
      "company/ops-kubernetes",
      "company/ops-monitoring",
      "company/ops-security"
    ],
    "sections": ["runbooks", "deployment"],
    "output": "docs/operations",
    "schedule": "daily"
  }
}
```

## CI/CD Integration

### Automatic Commits

The GitHub workflow automatically commits aggregated docs:
```yaml
on:
  schedule:
    - cron: '0 2 * * 0'  # Weekly Sunday 2 AM
```

### Pull Request Workflow

For manual review before merge:
```bash
gh workflow run docflow-aggregate.yml -f commit=false
```

This creates a PR with:
- Aggregated documentation
- Summary of changes
- Review checklist

### Notifications

Configure Teams/Slack notifications for failures:
```json
{
  "notifications": {
    "teams": {
      "enabled": true,
      "webhookSecret": "TEAMS_WEBHOOK_URL",
      "events": ["aggregate.failure"]
    }
  }
}
```

## API Reference

Full API documentation for programmatic use:

### `cloneRepos(repos, targetDir)`
Clones multiple repositories.

**Parameters**:
- `repos` (string[]): Array of repo identifiers
- `targetDir` (string): Directory to clone into

**Returns**: `Promise<string[]>` - Array of cloned repo paths

### `extractDocs(repoDir, options)`
Extracts documentation from a repository.

**Parameters**:
- `repoDir` (string): Repository directory path
- `options` (object): `{ sections?: string[] }`

**Returns**: `Promise<object>` - Extracted docs by section

### `mergeDocumentation(allDocs, options)`
Merges documentation with conflict resolution.

**Parameters**:
- `allDocs` (object[]): Array of extracted docs
- `options` (object): `{ sections?: string[] }`

**Returns**: `Promise<object>` - Merged docs by section

### `linkCrossReferences(merged)`
Links cross-repository references.

**Parameters**:
- `merged` (object): Merged documentation

**Returns**: `Promise<object>` - Documentation with linked references

### `generateIndex(merged, options)`
Generates unified index.

**Parameters**:
- `merged` (object): Merged documentation
- `options` (object): `{ repos?: string[], sections?: string[] }`

**Returns**: `Promise<string>` - Index markdown content

---

**Need help?** [Open an issue](https://github.com/TomsTech/docflow-template/issues) or check the [main documentation](../README.md).
