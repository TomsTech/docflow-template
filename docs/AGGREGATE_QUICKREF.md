# Documentation Aggregation - Quick Reference

## One-Minute Setup

```bash
# 1. Add to docflow.config.json
{
  "aggregate": {
    "enabled": true,
    "repos": ["org/repo1", "org/repo2"],
    "sections": ["adr", "api", "runbooks"]
  }
}

# 2. Run aggregation
docflow aggregate --clone

# 3. View output
cat docs/aggregated/INDEX.md
```

## Common Commands

```bash
# Basic usage (uses config file)
docflow aggregate --clone

# Override repos
docflow aggregate --repos "org/repo1,org/repo2" --clone

# Select sections
docflow aggregate --sections "adr,api" --clone

# Clean before aggregating
docflow aggregate --clean --clone

# Custom output directory
docflow aggregate --output "docs/multi-repo" --clone
```

## Configuration Cheatsheet

```json
{
  "aggregate": {
    "enabled": true,                          // Enable feature
    "repos": ["org/repo1", "org/repo2"],     // Source repositories
    "output": "docs/aggregated",             // Output directory
    "sections": ["adr", "api", "runbooks"],  // What to aggregate
    "schedule": "weekly",                     // Automation schedule
    "conflictResolution": "prefix",          // How to handle duplicates
    "cloneDepth": 1                          // Git clone depth
  }
}
```

## Conflict Resolution Strategies

| Strategy | Behaviour | Use Case |
|----------|-----------|----------|
| `prefix` | Add repo name to filename | ADRs, runbooks (keep separate) |
| `merge` | Combine content into one doc | General docs (consolidate) |
| `skip` | Keep first, ignore duplicates | Reference docs (same content) |
| `error` | Fail on conflict | Manual review required |

## Section Paths

DocFlow searches these paths in each repo:

| Section | Paths Searched |
|---------|---------------|
| `adr` | `docs/architecture/adr`, `docs/adr`, `adr`, `.design/adr` |
| `api` | `docs/api`, `api`, `docs/endpoints` |
| `runbooks` | `docs/runbooks`, `runbooks`, `docs/operations` |
| `features` | `docs/features`, `features`, `docs/requirements` |
| `architecture` | `docs/architecture`, `architecture`, `.design` |
| `database` | `docs/database`, `database`, `docs/schema` |
| `security` | `docs/security`, `security` |
| `deployment` | `docs/deployment`, `deployment`, `docs/deploy` |

## Output Structure

```
docs/aggregated/
├── INDEX.md                    # Navigation index
├── adr/                       # Architecture decisions
│   ├── repo1-ADR-001.md
│   └── repo2-ADR-001.md
├── api/                       # API documentation
│   ├── auth-api.md
│   └── orders-api.md
└── runbooks/                  # Operational runbooks
    ├── repo1-RB-001.md
    └── repo2-RB-002.md
```

## GitHub Actions

Manual trigger:
```bash
gh workflow run "docflow-aggregate.yml" \
  -f repos="org/repo1,org/repo2" \
  -f sections="adr,api" \
  -f clean=true
```

Automatic schedule (in `.github/workflows/docflow-aggregate.yml`):
```yaml
on:
  schedule:
    - cron: '0 2 * * 0'  # Weekly Sunday 2 AM UTC
```

## Error Messages

| Error | Solution |
|-------|----------|
| `No repositories configured` | Add `aggregate.repos` to config or use `--repos` |
| `Repository not found` | Check repo name format: `org/repo` |
| `Authentication required` | Set `GITHUB_TOKEN` environment variable |
| `Failed to clone` | Verify repo access and network |

## Metadata Format

For best results, use frontmatter in your docs:

```yaml
---
title: Document Title
date: 2024-12-01
author: Team Name
status: Active
tags: [tag1, tag2]
---
```

## API Quick Reference

```javascript
import {
  cloneRepos,
  extractDocs,
  mergeDocumentation,
  linkCrossReferences,
  generateIndex
} from './generators/aggregate.js';

// Clone repos
const cloned = await cloneRepos(
  ['org/repo1', 'org/repo2'],
  '.docflow/repos'
);

// Extract docs
const docs = await extractDocs(repoPath, {
  sections: ['adr', 'api']
});

// Merge with conflict resolution
const merged = await mergeDocumentation(allDocs, {
  sections: ['adr', 'api']
});

// Link cross-references
const linked = await linkCrossReferences(merged);

// Generate index
const index = await generateIndex(linked, {
  repos: ['org/repo1', 'org/repo2'],
  sections: ['adr', 'api']
});
```

## Examples

### Microservices Documentation Hub
```json
{
  "aggregate": {
    "enabled": true,
    "repos": [
      "company/auth-service",
      "company/user-service",
      "company/order-service"
    ],
    "sections": ["api", "runbooks"],
    "conflictResolution": "prefix"
  }
}
```

### ADR Knowledge Base
```json
{
  "aggregate": {
    "enabled": true,
    "repos": [
      "company/platform-core",
      "company/platform-ui",
      "company/platform-api"
    ],
    "sections": ["adr", "architecture"],
    "conflictResolution": "merge"
  }
}
```

### Operations Runbook Hub
```json
{
  "aggregate": {
    "enabled": true,
    "repos": [
      "company/ops-database",
      "company/ops-kubernetes",
      "company/ops-monitoring"
    ],
    "sections": ["runbooks", "deployment"],
    "schedule": "daily"
  }
}
```

## Troubleshooting

**Empty output?**
```bash
# Check repo structure
ls -R .docflow/repos/*/docs/

# Try all sections
docflow aggregate --sections "adr,api,runbooks,features,architecture"
```

**Old content persists?**
```bash
# Clean before aggregating
docflow aggregate --clean --clone
```

**Links broken?**
```bash
# Use relative paths in source docs
[Link](../adr/ADR-001.md)  # Good
[Link](/docs/adr/ADR-001.md)  # Bad
```

---

**Full Documentation**: [AGGREGATION_GUIDE.md](./AGGREGATION_GUIDE.md)
