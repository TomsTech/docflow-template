# Deployment Guide

> Deployment architecture, procedures, and runbooks for {{PROJECT_NAME}}.

---

## Table of Contents

1. [Overview](#overview)
2. [Environments](#environments)
3. [Infrastructure](#infrastructure)
4. [CI/CD Pipeline](#cicd-pipeline)
5. [Deployment Procedures](#deployment-procedures)
6. [Configuration Management](#configuration-management)
7. [Monitoring & Observability](#monitoring--observability)
8. [Rollback Procedures](#rollback-procedures)
9. [Disaster Recovery](#disaster-recovery)

---

## Overview

### Deployment Philosophy

- **Infrastructure as Code** - All infrastructure defined in version control
- **Immutable Deployments** - Replace, don't modify running instances
- **Blue/Green Deployments** - Zero-downtime releases
- **Feature Flags** - Decouple deployment from release

### Quick Reference

| Item | Value |
|------|-------|
| Cloud Provider | {{PROVIDER}} |
| Container Orchestration | {{KUBERNETES/ECS/etc}} |
| CI/CD Platform | GitHub Actions |
| IaC Tool | Terraform / Pulumi |
| Secrets Management | {{VAULT/AWS SM/etc}} |

---

## Environments

### Environment Matrix

| Environment | Purpose | URL | Branch |
|-------------|---------|-----|--------|
| Development | Feature testing | dev.{{domain}} | `develop` |
| Staging | Pre-production validation | staging.{{domain}} | `release/*` |
| Production | Live system | {{domain}} | `main` |

### Environment Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        ENVIRONMENT TOPOLOGY                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  PRODUCTION                                                      │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │   │
│  │  │  Region  │  │  Region  │  │  Global  │  │  DR      │        │   │
│  │  │  Primary │  │  Standby │  │  CDN     │  │  Backup  │        │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              ▲                                          │
│                              │ Promotion                                │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  STAGING                                                         │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐                       │   │
│  │  │  App     │  │  DB      │  │  Cache   │                       │   │
│  │  │  Cluster │  │  Replica │  │  Cluster │                       │   │
│  │  └──────────┘  └──────────┘  └──────────┘                       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              ▲                                          │
│                              │ Promotion                                │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  DEVELOPMENT                                                     │   │
│  │  ┌──────────┐  ┌──────────┐                                     │   │
│  │  │  App     │  │  DB      │  (shared resources)                 │   │
│  │  └──────────┘  └──────────┘                                     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Resource Allocation

| Environment | Compute | Database | Cache | Storage |
|-------------|---------|----------|-------|---------|
| Development | 2 vCPU, 4GB | db.t3.small | 1 node | 50GB |
| Staging | 4 vCPU, 8GB | db.t3.medium | 2 nodes | 100GB |
| Production | 8+ vCPU, 16GB+ | db.r5.large | 3 nodes | 500GB+ |

---

## Infrastructure

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      PRODUCTION INFRASTRUCTURE                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│                            ┌──────────┐                                │
│                            │   DNS    │                                │
│                            │ (Route53)│                                │
│                            └────┬─────┘                                │
│                                 │                                       │
│                            ┌────▼─────┐                                │
│                            │   CDN    │                                │
│                            │(CloudFr) │                                │
│                            └────┬─────┘                                │
│                                 │                                       │
│  ┌──────────────────────────────┼──────────────────────────────────┐   │
│  │  VPC                         │                                   │   │
│  │                         ┌────▼─────┐                            │   │
│  │                         │   ALB    │                            │   │
│  │                         └────┬─────┘                            │   │
│  │                              │                                   │   │
│  │  ┌───────────────────────────┼───────────────────────────────┐  │   │
│  │  │  Private Subnet           │                                │  │   │
│  │  │                  ┌────────┴────────┐                       │  │   │
│  │  │                  │                 │                       │  │   │
│  │  │            ┌─────▼─────┐     ┌─────▼─────┐                 │  │   │
│  │  │            │  Service  │     │  Service  │                 │  │   │
│  │  │            │  Pod 1    │     │  Pod 2    │                 │  │   │
│  │  │            └─────┬─────┘     └─────┬─────┘                 │  │   │
│  │  │                  │                 │                       │  │   │
│  │  │                  └────────┬────────┘                       │  │   │
│  │  │                           │                                │  │   │
│  │  │  ┌────────────────────────┼────────────────────────────┐  │  │   │
│  │  │  │  Data Tier             │                             │  │  │   │
│  │  │  │              ┌─────────┴─────────┐                   │  │  │   │
│  │  │  │              │                   │                   │  │  │   │
│  │  │  │        ┌─────▼─────┐       ┌─────▼─────┐             │  │  │   │
│  │  │  │        │  Primary  │◀─────▶│  Replica  │             │  │  │   │
│  │  │  │        │    DB     │       │    DB     │             │  │  │   │
│  │  │  │        └───────────┘       └───────────┘             │  │  │   │
│  │  │  │                                                      │  │  │   │
│  │  │  │        ┌───────────┐                                 │  │  │   │
│  │  │  │        │   Redis   │                                 │  │  │   │
│  │  │  │        │  Cluster  │                                 │  │  │   │
│  │  │  │        └───────────┘                                 │  │  │   │
│  │  │  └──────────────────────────────────────────────────────┘  │  │   │
│  │  └────────────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Infrastructure as Code

```
infrastructure/
├── terraform/
│   ├── modules/
│   │   ├── networking/
│   │   ├── compute/
│   │   ├── database/
│   │   └── monitoring/
│   ├── environments/
│   │   ├── dev/
│   │   ├── staging/
│   │   └── prod/
│   └── main.tf
├── kubernetes/
│   ├── base/
│   ├── overlays/
│   │   ├── dev/
│   │   ├── staging/
│   │   └── prod/
│   └── kustomization.yaml
└── scripts/
    ├── bootstrap.sh
    └── destroy.sh
```

---

## CI/CD Pipeline

### Pipeline Overview

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  Push   │───▶│  Build  │───▶│  Test   │───▶│ Deploy  │───▶│ Verify  │
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘
                   │              │              │              │
                   ▼              ▼              ▼              ▼
              ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐
              │  Lint   │   │  Unit   │   │  Stage  │   │  Smoke  │
              │  SAST   │   │  Int.   │   │  Prod   │   │  E2E    │
              └─────────┘   └─────────┘   └─────────┘   └─────────┘
```

### Pipeline Stages

| Stage | Trigger | Actions | Duration |
|-------|---------|---------|----------|
| Build | Push/PR | Compile, lint, SAST | 2-3 min |
| Test | Build success | Unit, integration tests | 5-10 min |
| Security | Test success | Dependency scan, DAST | 5-15 min |
| Deploy Staging | Main branch | Deploy to staging | 3-5 min |
| E2E Tests | Staging deploy | Automated E2E suite | 10-15 min |
| Deploy Production | Manual approval | Blue/green deployment | 5-10 min |
| Verify | Prod deploy | Smoke tests, monitoring | 5 min |

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'
        required: true
        type: choice
        options:
          - staging
          - production

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build
        run: npm run build
      - name: Test
        run: npm test
      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - name: Deploy to staging
        run: ./deploy.sh staging

  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy to production
        run: ./deploy.sh production
```

---

## Deployment Procedures

### Standard Deployment

```bash
# 1. Pre-deployment checks
./scripts/pre-deploy-check.sh

# 2. Create release
git tag -a v1.2.3 -m "Release v1.2.3"
git push origin v1.2.3

# 3. Monitor deployment
gh run watch

# 4. Verify deployment
./scripts/smoke-test.sh production
```

### Blue/Green Deployment Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      BLUE/GREEN DEPLOYMENT                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Step 1: Initial State                                                  │
│  ┌──────────────┐                                                      │
│  │   BLUE       │◀────── 100% Traffic                                  │
│  │   (v1.0)     │                                                      │
│  └──────────────┘                                                      │
│  ┌──────────────┐                                                      │
│  │   GREEN      │        (idle)                                        │
│  │   (empty)    │                                                      │
│  └──────────────┘                                                      │
│                                                                         │
│  Step 2: Deploy New Version                                            │
│  ┌──────────────┐                                                      │
│  │   BLUE       │◀────── 100% Traffic                                  │
│  │   (v1.0)     │                                                      │
│  └──────────────┘                                                      │
│  ┌──────────────┐                                                      │
│  │   GREEN      │        (deploying v1.1)                              │
│  │   (v1.1)     │                                                      │
│  └──────────────┘                                                      │
│                                                                         │
│  Step 3: Switch Traffic                                                │
│  ┌──────────────┐                                                      │
│  │   BLUE       │        (standby)                                     │
│  │   (v1.0)     │                                                      │
│  └──────────────┘                                                      │
│  ┌──────────────┐                                                      │
│  │   GREEN      │◀────── 100% Traffic                                  │
│  │   (v1.1)     │                                                      │
│  └──────────────┘                                                      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Deployment Checklist

**Pre-Deployment**:
- [ ] All tests passing
- [ ] Security scan clean
- [ ] Database migrations tested
- [ ] Feature flags configured
- [ ] Rollback plan documented
- [ ] On-call team notified

**Deployment**:
- [ ] Create release tag
- [ ] Monitor pipeline progress
- [ ] Verify staging deployment
- [ ] Approve production deployment
- [ ] Monitor deployment metrics

**Post-Deployment**:
- [ ] Run smoke tests
- [ ] Check error rates
- [ ] Monitor performance metrics
- [ ] Update status page
- [ ] Announce release (if applicable)

---

## Configuration Management

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | Yes | - | Environment name |
| `DATABASE_URL` | Yes | - | Database connection string |
| `REDIS_URL` | Yes | - | Redis connection string |
| `API_KEY` | Yes | - | External API key |
| `LOG_LEVEL` | No | `info` | Logging verbosity |
| `FEATURE_X_ENABLED` | No | `false` | Feature flag |

### Secrets Management

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        SECRETS FLOW                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐              │
│  │   GitHub     │───▶│   Secrets    │───▶│  Application │              │
│  │   Actions    │    │   Manager    │    │    Runtime   │              │
│  └──────────────┘    └──────────────┘    └──────────────┘              │
│         │                   │                   │                       │
│         │                   │                   │                       │
│         ▼                   ▼                   ▼                       │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐              │
│  │  Build-time  │    │  Encrypted   │    │   Env vars   │              │
│  │   secrets    │    │   at rest    │    │   injected   │              │
│  └──────────────┘    └──────────────┘    └──────────────┘              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Feature Flags

| Flag | Default | Description |
|------|---------|-------------|
| `feature.new_dashboard` | false | Enable new dashboard UI |
| `feature.api_v2` | false | Enable API v2 endpoints |
| `feature.dark_mode` | true | Enable dark mode option |

---

## Monitoring & Observability

### Metrics to Monitor

| Metric | Warning | Critical | Action |
|--------|---------|----------|--------|
| Error rate | > 1% | > 5% | Page on-call |
| Latency p99 | > 500ms | > 2s | Scale up |
| CPU usage | > 70% | > 90% | Scale up |
| Memory usage | > 80% | > 95% | Investigate |
| Disk usage | > 70% | > 90% | Expand/cleanup |

### Alerting Rules

```yaml
# Example Prometheus alert rules
groups:
  - name: deployment
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: High error rate detected

      - alert: HighLatency
        expr: histogram_quantile(0.99, http_request_duration_seconds_bucket) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: High latency detected
```

### Log Aggregation

| Log Type | Retention | Location |
|----------|-----------|----------|
| Application | 30 days | CloudWatch/Elasticsearch |
| Access | 90 days | S3/CloudWatch |
| Audit | 2 years | S3 (archived) |
| Security | 1 year | SIEM |

---

## Rollback Procedures

### Automatic Rollback Triggers

- Error rate > 10% for 2 minutes
- Health check failures > 50%
- P0 alert triggered

### Manual Rollback

```bash
# Option 1: Revert to previous deployment
kubectl rollout undo deployment/{{service}}

# Option 2: Deploy specific version
./deploy.sh production --version v1.2.2

# Option 3: Traffic shift (blue/green)
./scripts/switch-traffic.sh blue
```

### Rollback Checklist

- [ ] Identify failing version
- [ ] Execute rollback command
- [ ] Verify service health
- [ ] Check database compatibility
- [ ] Update status page
- [ ] Notify stakeholders
- [ ] Create incident report

---

## Disaster Recovery

### Recovery Objectives

| Metric | Target |
|--------|--------|
| RTO (Recovery Time Objective) | < 1 hour |
| RPO (Recovery Point Objective) | < 15 minutes |

### Backup Strategy

| Component | Frequency | Retention | Location |
|-----------|-----------|-----------|----------|
| Database | Continuous | 30 days | Cross-region |
| Files/Media | Daily | 90 days | Cross-region |
| Configuration | On change | Indefinite | Git |
| Secrets | On change | Versioned | Secrets Manager |

### DR Procedures

1. **Detect** - Automated monitoring alerts
2. **Declare** - Incident commander declares DR
3. **Failover** - Execute failover runbook
4. **Verify** - Confirm services operational
5. **Communicate** - Update stakeholders
6. **Recover** - Plan primary restoration

---

## Related Documents

- [Architecture Overview](../architecture/README.md)
- [Security Guide](../security/README.md)
- [Runbooks](../runbooks/)
- [API Documentation](../api/README.md)

---

## Changelog

| Date | Author | Change |
|------|--------|--------|
| {{DATE}} | {{AUTHOR}} | Initial deployment guide |
