# Documentation Aggregation - Usage Examples

## Example 1: Basic Microservices API Hub

**Scenario**: Aggregate API documentation from 3 microservices into a unified developer portal.

### Configuration

```json
{
  "aggregate": {
    "enabled": true,
    "repos": [
      "mycompany/auth-service",
      "mycompany/user-service",
      "mycompany/order-service"
    ],
    "output": "docs/api-hub",
    "sections": ["api"],
    "conflictResolution": "prefix"
  }
}
```

### Command

```bash
docflow aggregate --clone
```

### Expected Output

```
docs/api-hub/
├── INDEX.md
└── api/
    ├── auth-service-authentication-endpoints.md
    ├── user-service-user-management-api.md
    └── order-service-order-processing-api.md
```

---

## Example 2: Architecture Decision Records (ADRs) Knowledge Base

**Scenario**: Collect all ADRs across platform repositories into central architecture docs.

### Configuration

```json
{
  "aggregate": {
    "enabled": true,
    "repos": [
      "platform/core",
      "platform/web-ui",
      "platform/mobile-app",
      "platform/api-gateway",
      "platform/infrastructure"
    ],
    "output": "docs/architecture",
    "sections": ["adr", "architecture"],
    "schedule": "weekly",
    "conflictResolution": "prefix"
  }
}
```

### Command

```bash
docflow aggregate --clean --clone
```

### Expected Output

```
docs/architecture/
├── INDEX.md
├── adr/
│   ├── core-ADR-001-use-microservices.md
│   ├── core-ADR-002-database-per-service.md
│   ├── web-ui-ADR-001-react-framework.md
│   ├── mobile-app-ADR-001-react-native.md
│   ├── api-gateway-ADR-001-kong-gateway.md
│   └── infrastructure-ADR-001-kubernetes.md
└── architecture/
    ├── core-system-overview.md
    ├── web-ui-component-architecture.md
    └── infrastructure-deployment-architecture.md
```

---

## Example 3: DevOps Runbooks Collection

**Scenario**: Aggregate operational runbooks from multiple infrastructure teams.

### Configuration

```json
{
  "aggregate": {
    "enabled": true,
    "repos": [
      "devops/kubernetes-ops",
      "devops/database-ops",
      "devops/monitoring-ops",
      "devops/security-ops"
    ],
    "output": "docs/operations",
    "sections": ["runbooks", "deployment"],
    "schedule": "daily",
    "conflictResolution": "prefix"
  }
}
```

### Command

```bash
# Run daily via GitHub Actions
# Manual trigger:
docflow aggregate --clone --clean
```

### Expected Output

```
docs/operations/
├── INDEX.md
├── runbooks/
│   ├── kubernetes-ops-RB-001-pod-restart.md
│   ├── kubernetes-ops-RB-002-node-drain.md
│   ├── database-ops-RB-001-backup-restore.md
│   ├── database-ops-RB-002-replication-recovery.md
│   ├── monitoring-ops-RB-001-alert-response.md
│   └── security-ops-RB-001-incident-response.md
└── deployment/
    ├── kubernetes-ops-k8s-deployment.md
    └── security-ops-security-deployment.md
```

---

## Example 4: Multi-Team Feature Documentation

**Scenario**: Combine feature specifications from product teams.

### Configuration

```json
{
  "aggregate": {
    "enabled": true,
    "repos": [
      "product/team-checkout",
      "product/team-search",
      "product/team-recommendations",
      "product/team-user-profile"
    ],
    "output": "docs/features",
    "sections": ["features"],
    "conflictResolution": "merge"
  }
}
```

### Command

```bash
docflow aggregate --repos "product/team-checkout,product/team-search,product/team-recommendations,product/team-user-profile" --sections "features" --clone
```

### Expected Output

```
docs/features/
├── INDEX.md
└── features/
    ├── checkout-flow.md
    ├── search-functionality.md
    ├── recommendation-engine.md
    └── user-profile-management.md
```

---

## Example 5: Security & Compliance Documentation

**Scenario**: Aggregate security docs, threat models, and compliance documentation.

### Configuration

```json
{
  "aggregate": {
    "enabled": true,
    "repos": [
      "security/appsec",
      "security/infrasec",
      "security/compliance",
      "security/incident-response"
    ],
    "output": "docs/security",
    "sections": ["security", "runbooks"],
    "conflictResolution": "prefix"
  }
}
```

### Command

```bash
docflow aggregate --clone --output "docs/security"
```

### Expected Output

```
docs/security/
├── INDEX.md
├── security/
│   ├── appsec-threat-model.md
│   ├── appsec-security-controls.md
│   ├── infrasec-network-security.md
│   ├── compliance-gdpr-compliance.md
│   └── compliance-soc2-controls.md
└── runbooks/
    ├── incident-response-RB-001-data-breach.md
    └── incident-response-RB-002-ddos-mitigation.md
```

---

## Example 6: Database Schema Documentation

**Scenario**: Aggregate database schemas and data dictionaries from multiple services.

### Configuration

```json
{
  "aggregate": {
    "enabled": true,
    "repos": [
      "data/auth-db",
      "data/user-db",
      "data/order-db",
      "data/analytics-db"
    ],
    "output": "docs/database",
    "sections": ["database"],
    "conflictResolution": "prefix"
  }
}
```

### Command

```bash
docflow aggregate --sections "database" --clone
```

### Expected Output

```
docs/database/
├── INDEX.md
└── database/
    ├── auth-db-schema.md
    ├── auth-db-migrations.md
    ├── user-db-schema.md
    ├── order-db-schema.md
    └── analytics-db-schema.md
```

---

## Example 7: Complete Documentation Portal

**Scenario**: Aggregate all documentation types for a comprehensive portal.

### Configuration

```json
{
  "aggregate": {
    "enabled": true,
    "repos": [
      "platform/auth-service",
      "platform/user-service",
      "platform/order-service",
      "platform/payment-service"
    ],
    "output": "docs/portal",
    "sections": [
      "adr",
      "api",
      "runbooks",
      "features",
      "architecture",
      "database",
      "security",
      "deployment"
    ],
    "schedule": "weekly",
    "conflictResolution": "prefix"
  }
}
```

### Command

```bash
docflow aggregate --clean --clone
```

### Expected Output

```
docs/portal/
├── INDEX.md
├── adr/
│   └── [All ADRs from all repos]
├── api/
│   └── [All API docs from all repos]
├── runbooks/
│   └── [All runbooks from all repos]
├── features/
│   └── [All feature specs from all repos]
├── architecture/
│   └── [All architecture docs from all repos]
├── database/
│   └── [All database docs from all repos]
├── security/
│   └── [All security docs from all repos]
└── deployment/
    └── [All deployment docs from all repos]
```

---

## Example 8: Command Line Overrides

**Scenario**: Override configuration for ad-hoc aggregation.

### Configuration (docflow.config.json)

```json
{
  "aggregate": {
    "enabled": true,
    "repos": [
      "org/repo1",
      "org/repo2"
    ],
    "sections": ["api"],
    "output": "docs/aggregated"
  }
}
```

### Commands with Overrides

```bash
# Override repos
docflow aggregate --repos "org/repo3,org/repo4" --clone

# Override sections
docflow aggregate --sections "adr,runbooks" --clone

# Override output directory
docflow aggregate --output "docs/custom" --clone

# Combine all overrides
docflow aggregate \
  --repos "org/repo3,org/repo4" \
  --sections "adr,api,runbooks" \
  --output "docs/custom" \
  --clean \
  --clone
```

---

## Example 9: GitHub Actions Manual Trigger

**Scenario**: Manually trigger aggregation via GitHub Actions with custom parameters.

### Using GitHub CLI

```bash
# Basic manual trigger
gh workflow run "docflow-aggregate.yml"

# With custom repos
gh workflow run "docflow-aggregate.yml" \
  -f repos="org/repo1,org/repo2,org/repo3"

# With custom sections
gh workflow run "docflow-aggregate.yml" \
  -f sections="adr,api"

# With clean option
gh workflow run "docflow-aggregate.yml" \
  -f clean=true

# Create PR instead of direct commit
gh workflow run "docflow-aggregate.yml" \
  -f commit=false

# All options combined
gh workflow run "docflow-aggregate.yml" \
  -f repos="org/repo1,org/repo2" \
  -f sections="adr,api,runbooks" \
  -f clean=true \
  -f commit=false
```

### Using GitHub Web UI

1. Navigate to **Actions** tab
2. Select **DocFlow: Aggregate Multi-Repo Documentation**
3. Click **Run workflow**
4. Fill in parameters:
   - **repos**: `org/repo1,org/repo2`
   - **sections**: `adr,api,runbooks`
   - **clean**: `true`
   - **commit**: `true`
5. Click **Run workflow**

---

## Example 10: Conflict Resolution Strategies

**Scenario**: Different conflict handling for different use cases.

### Prefix Strategy (Default for ADRs)

```json
{
  "aggregate": {
    "conflictResolution": "prefix"
  }
}
```

**Input**: Both repos have `ADR-001-authentication.md`

**Output**:
- `auth-service-ADR-001-authentication.md`
- `user-service-ADR-001-authentication.md`

### Merge Strategy (For general docs)

```json
{
  "aggregate": {
    "conflictResolution": "merge"
  }
}
```

**Input**: Both repos have `deployment-guide.md`

**Output**: Single `deployment-guide.md` containing:
```markdown
# Deployment Guide

> Note: This document has been aggregated from multiple repositories

## From auth-service
[Content from auth-service]

---

## From user-service
[Content from user-service]
```

### Skip Strategy (For reference docs)

```json
{
  "aggregate": {
    "conflictResolution": "skip"
  }
}
```

**Input**: Both repos have identical `api-standards.md`

**Output**: `api-standards.md` (from first repo, second skipped)

### Error Strategy (Manual review)

```json
{
  "aggregate": {
    "conflictResolution": "error"
  }
}
```

**Input**: Both repos have `README.md`

**Output**: Error with message to resolve manually

---

## Tips for Success

### 1. Consistent Structure
Organize docs in standard locations across all repos:
```
docs/
├── adr/
├── api/
├── runbooks/
└── architecture/
```

### 2. Use Frontmatter
Add metadata to all documents:
```yaml
---
title: API Authentication
date: 2024-12-01
author: Platform Team
status: Active
---
```

### 3. Relative Links
Use relative paths for cross-references:
```markdown
See [ADR-001](../adr/ADR-001-authentication.md)
```

### 4. Regular Schedules
Set up automated aggregation:
```json
{
  "aggregate": {
    "schedule": "weekly"  // or "daily" for active docs
  }
}
```

### 5. Review Changes
Check the generated `INDEX.md` after each aggregation:
```bash
cat docs/aggregated/INDEX.md
```
