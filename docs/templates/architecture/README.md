# Architecture Overview

> Enterprise architecture documentation following TOGAF principles.

---

## Table of Contents

1. [Architecture Vision](#architecture-vision)
2. [Architecture Principles](#architecture-principles)
3. [System Context](#system-context)
4. [Container Architecture](#container-architecture)
5. [Component Architecture](#component-architecture)
6. [Data Architecture](#data-architecture)
7. [Security Architecture](#security-architecture)
8. [Deployment Architecture](#deployment-architecture)
9. [Architecture Decisions](#architecture-decisions)

---

## Architecture Vision

### Purpose Statement

{{PROJECT_NAME}} is designed to {{PURPOSE}}. The architecture must support:

- **Scalability**: Handle growth in {{DIMENSION}}
- **Reliability**: Maintain {{UPTIME_TARGET}} availability
- **Security**: Protect {{ASSETS}}
- **Maintainability**: Enable rapid development cycles

### Key Stakeholders

| Stakeholder | Concerns |
|-------------|----------|
| End Users | Performance, reliability, ease of use |
| Developers | Code quality, documentation, testability |
| Operations | Monitoring, deployment, incident response |
| Business | Cost, time to market, compliance |

### Quality Attributes

| Attribute | Target | Measurement |
|-----------|--------|-------------|
| Availability | 99.9% | Monthly uptime |
| Response Time | < 200ms (p95) | APM metrics |
| Throughput | 1000 req/s | Load testing |
| Security | Zero critical vulnerabilities | Security scans |

---

## Architecture Principles

### Business Principles

| Principle | Description | Implications |
|-----------|-------------|--------------|
| **User-Centric** | Optimise for user productivity | Fast UI, smart defaults |
| **Security-First** | Security is not optional | Encryption, audit logging |
| **Cost-Efficient** | Maximise value per dollar | Right-sized resources |

### Application Principles

| Principle | Description | Implications |
|-----------|-------------|--------------|
| **Modularity** | Loosely coupled modules | Clear boundaries |
| **API-First** | All features via API | Complete API coverage |
| **Stateless** | No server-side session | Horizontal scaling |

### Data Principles

| Principle | Description | Implications |
|-----------|-------------|--------------|
| **Data Ownership** | Users own their data | Export, deletion rights |
| **Data Isolation** | Tenant separation | Schema-per-tenant |
| **Audit Trail** | All changes tracked | Immutable audit log |

### Technology Principles

| Principle | Description | Implications |
|-----------|-------------|--------------|
| **Infrastructure as Code** | Version-controlled infra | Reproducible, auditable |
| **Containerisation** | All services containerised | Consistent environments |
| **Observability** | Full system visibility | Logging, metrics, tracing |

---

## System Context

### Context Diagram (C4 Level 1)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           SYSTEM CONTEXT                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│                            ┌──────────┐                                 │
│                            │   User   │                                 │
│                            │  (Actor) │                                 │
│                            └────┬─────┘                                 │
│                                 │ Uses                                  │
│                                 ▼                                       │
│  ┌──────────────┐        ┌─────────────────┐        ┌──────────────┐   │
│  │   External   │◄──────▶│  {{PROJECT}}    │◄──────▶│   External   │   │
│  │   System A   │  API   │     System      │  API   │   System B   │   │
│  │              │        │                 │        │              │   │
│  │ (e.g. Auth)  │        │ [{{PURPOSE}}]   │        │ (e.g. Email) │   │
│  └──────────────┘        └─────────────────┘        └──────────────┘   │
│                                 │                                       │
│                                 │ Stores                                │
│                                 ▼                                       │
│                          ┌──────────────┐                              │
│                          │   Database   │                              │
│                          │   (Store)    │                              │
│                          └──────────────┘                              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### External Systems

| System | Purpose | Integration Type |
|--------|---------|------------------|
| {{SYSTEM_A}} | {{PURPOSE}} | REST API |
| {{SYSTEM_B}} | {{PURPOSE}} | Webhook |
| {{SYSTEM_C}} | {{PURPOSE}} | Queue |

---

## Container Architecture

### Container Diagram (C4 Level 2)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CONTAINER ARCHITECTURE                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│                         ┌──────────────────┐                            │
│                         │   CDN / WAF      │                            │
│                         │  (Cloudflare)    │                            │
│                         └────────┬─────────┘                            │
│                                  │                                      │
│         ┌────────────────────────┼────────────────────────┐            │
│         │                        │                        │            │
│    ┌────▼────┐            ┌──────▼──────┐           ┌─────▼─────┐      │
│    │  Web    │            │    API      │           │  Admin    │      │
│    │  App    │            │   Gateway   │           │  Portal   │      │
│    │ (React) │            │  (Node.js)  │           │  (React)  │      │
│    └────┬────┘            └──────┬──────┘           └─────┬─────┘      │
│         │                        │                        │            │
│         └────────────────────────┼────────────────────────┘            │
│                                  │                                      │
│    ┌──────────────────────────────┼──────────────────────────────┐     │
│    │                              │                              │     │
│    │  ┌──────────┐  ┌─────────────┼─────────────┐  ┌──────────┐ │     │
│    │  │  Auth    │  │             │             │  │  Worker  │ │     │
│    │  │ Service  │  │      ┌──────▼──────┐      │  │ Service  │ │     │
│    │  └────┬─────┘  │      │   Core      │      │  └────┬─────┘ │     │
│    │       │        │      │   API       │      │       │       │     │
│    │       │        │      │ (NestJS)    │      │       │       │     │
│    │       │        │      └──────┬──────┘      │       │       │     │
│    │       │        │             │             │       │       │     │
│    │       │        └─────────────┼─────────────┘       │       │     │
│    │       │                      │                     │       │     │
│    └───────┼──────────────────────┼─────────────────────┼───────┘     │
│            │                      │                     │             │
│            └──────────────────────┼─────────────────────┘             │
│                                   │                                    │
│              ┌────────────────────┼────────────────────┐              │
│              │                    │                    │              │
│         ┌────▼────┐         ┌─────▼─────┐        ┌─────▼─────┐        │
│         │PostgreSQL│        │   Redis   │        │   Blob    │        │
│         │  (Data)  │        │  (Cache)  │        │ (Storage) │        │
│         └──────────┘        └───────────┘        └───────────┘        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Container Descriptions

| Container | Technology | Purpose |
|-----------|------------|---------|
| Web App | React + TypeScript | User interface |
| Admin Portal | React + TypeScript | Administration |
| API Gateway | Node.js | Request routing, auth |
| Core API | NestJS | Business logic |
| Worker Service | Node.js + BullMQ | Background jobs |
| PostgreSQL | PostgreSQL 16 | Primary database |
| Redis | Redis 7 | Cache, queue, pub/sub |
| Blob Storage | S3/Azure Blob | File storage |

---

## Component Architecture

### Module Structure

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        COMPONENT ARCHITECTURE                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                          API GATEWAY                             │   │
│  │            (Authentication, Rate Limiting, Routing)              │   │
│  └───────────────────────────────┬─────────────────────────────────┘   │
│                                  │                                      │
│  ┌───────────────────────────────┼─────────────────────────────────┐   │
│  │                         CORE APPLICATION                         │   │
│  ├───────────────────────────────┼─────────────────────────────────┤   │
│  │                               │                                  │   │
│  │  ┌──────────────────────────────────────────────────────────┐   │   │
│  │  │                    FEATURE MODULES                        │   │   │
│  │  ├──────────┬──────────┬──────────┬──────────┬──────────────┤   │   │
│  │  │ Module A │ Module B │ Module C │ Module D │  Module E    │   │   │
│  │  └──────────┴──────────┴──────────┴──────────┴──────────────┘   │   │
│  │                               │                                  │   │
│  │  ┌──────────────────────────────────────────────────────────┐   │   │
│  │  │                    SHARED SERVICES                        │   │   │
│  │  ├──────────┬──────────┬──────────┬──────────┬──────────────┤   │   │
│  │  │  Event   │  Cache   │  Queue   │  Email   │  External    │   │   │
│  │  │   Bus    │ Service  │ Service  │ Service  │  API Client  │   │   │
│  │  └──────────┴──────────┴──────────┴──────────┴──────────────┘   │   │
│  │                                                                  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Module Template

Each module follows this structure:

```
src/modules/{module}/
├── {module}.module.ts        # Module definition
├── {module}.controller.ts    # HTTP handlers
├── {module}.service.ts       # Business logic
├── {module}.repository.ts    # Data access
├── dto/                      # Data transfer objects
├── entities/                 # Database entities
└── tests/                    # Unit & integration tests
```

---

## Data Architecture

### Conceptual Data Model

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      CONCEPTUAL DATA MODEL                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│                            ┌──────────┐                                 │
│                            │  TENANT  │                                 │
│                            └────┬─────┘                                 │
│                                 │                                       │
│              ┌──────────────────┼──────────────────┐                    │
│              │                  │                  │                    │
│         ┌────▼────┐        ┌────▼────┐       ┌─────▼────┐              │
│         │  USER   │        │  DATA   │       │ SETTINGS │              │
│         └────┬────┘        │ ENTITY  │       └──────────┘              │
│              │             └────┬────┘                                  │
│              │                  │                                       │
│         ┌────▼────┐        ┌────▼────┐                                 │
│         │  AUDIT  │        │  CHILD  │                                 │
│         │   LOG   │        │ ENTITY  │                                 │
│         └─────────┘        └─────────┘                                 │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Multi-Tenancy

**Strategy**: Schema-per-tenant

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         POSTGRESQL DATABASE                              │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   public    │  │  tenant_1   │  │  tenant_2   │  │  tenant_n   │    │
│  │   schema    │  │   schema    │  │   schema    │  │   schema    │    │
│  ├─────────────┤  ├─────────────┤  ├─────────────┤  ├─────────────┤    │
│  │ - tenants   │  │ - users     │  │ - users     │  │ - users     │    │
│  │ - plans     │  │ - data      │  │ - data      │  │ - data      │    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Security Architecture

### Security Layers

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        SECURITY ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  EDGE SECURITY                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  WAF │ DDoS Protection │ Bot Management │ Rate Limiting         │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  TRANSPORT SECURITY                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  TLS 1.3 │ HSTS │ Certificate Management                        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  APPLICATION SECURITY                                                   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Input Validation │ Output Encoding │ CSRF │ CSP │ CORS         │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  AUTHENTICATION & AUTHORISATION                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  OAuth 2.0 │ JWT │ RBAC │ MFA                                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  DATA SECURITY                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Encryption at Rest │ Field Encryption │ Key Management         │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Access Control

| Role | Permissions |
|------|-------------|
| Super Admin | Full system access |
| Tenant Admin | Full tenant access |
| User | Own resources |
| Viewer | Read-only |

---

## Deployment Architecture

### Production Environment

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       DEPLOYMENT ARCHITECTURE                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│                          ┌──────────────┐                               │
│                          │  CLOUDFLARE  │                               │
│                          │  (CDN/WAF)   │                               │
│                          └──────┬───────┘                               │
│                                 │                                       │
│  ┌──────────────────────────────┼───────────────────────────────────┐  │
│  │                         CLOUD PROVIDER                            │  │
│  │                                                                   │  │
│  │  ┌─────────────────────────────────────────────────────────────┐ │  │
│  │  │                    PRODUCTION CLUSTER                        │ │  │
│  │  │                                                             │ │  │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │ │  │
│  │  │  │   Web    │  │   Web    │  │  Worker  │  │  Worker  │   │ │  │
│  │  │  │  App 1   │  │  App 2   │  │    1     │  │    2     │   │ │  │
│  │  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │ │  │
│  │  │       └──────────────┼──────────────┴──────────────┘       │ │  │
│  │  │                      │                                      │ │  │
│  │  │       ┌──────────────┼──────────────┐                      │ │  │
│  │  │  ┌────▼────┐   ┌─────▼─────┐  ┌─────▼─────┐               │ │  │
│  │  │  │PostgreSQL│  │   Redis   │  │   Blob    │               │ │  │
│  │  │  │  (HA)   │   │ (Cluster) │  │  Storage  │               │ │  │
│  │  │  └─────────┘   └───────────┘  └───────────┘               │ │  │
│  │  │                                                             │ │  │
│  │  └─────────────────────────────────────────────────────────────┘ │  │
│  │                                                                   │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Environments

| Environment | Purpose | Data |
|-------------|---------|------|
| Development | Local development | Seeded test data |
| Staging | Pre-production | Anonymised snapshot |
| Production | Live system | Real data |

---

## Architecture Decisions

See [ADR folder](./adr/) for Architecture Decision Records.

| ADR | Title | Status |
|-----|-------|--------|
| ADR-001 | Use Modular Monolith | Accepted |
| ADR-002 | Schema-per-Tenant Multi-tenancy | Accepted |
| ADR-003 | Event-Driven Communication | Accepted |
| ADR-004 | API-First Development | Accepted |

---

## Related Documents

- [Feature Catalogue](../features/README.md)
- [API Documentation](../api/README.md)
- [Database Schema](../database/README.md)
- [Security Architecture](../security/README.md)
- [Deployment Guide](../deployment/README.md)
