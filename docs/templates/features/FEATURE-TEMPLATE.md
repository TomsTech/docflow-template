# {{FEATURE_NAME}}

> {{ONE_LINE_DESCRIPTION}}

---

## Table of Contents

1. [Overview](#overview)
2. [Key Features](#key-features)
3. [Architecture](#architecture)
4. [User Interface](#user-interface)
5. [API](#api)
6. [Configuration](#configuration)
7. [Security](#security)
8. [Performance](#performance)
9. [Related Documents](#related-documents)

---

## Overview

### Purpose

{{DETAILED_PURPOSE_DESCRIPTION}}

### Problem Solved

- Problem 1 that this feature addresses
- Problem 2 that this feature addresses
- Problem 3 that this feature addresses

### Target Users

| User Type | Use Case |
|-----------|----------|
| User Type 1 | How they use this feature |
| User Type 2 | How they use this feature |

### Quick Facts

| Metric | Value |
|--------|-------|
| Status | Planned / In Development / Released |
| Version | 1.0.0 |
| Release Date | YYYY-MM-DD |

---

## Key Features

### Feature 1: {{FEATURE_1_NAME}}

**Description**: What this sub-feature does

**Capabilities**:
- Capability A
- Capability B
- Capability C

**Example**:
```
[Code or usage example]
```

---

### Feature 2: {{FEATURE_2_NAME}}

**Description**: What this sub-feature does

**Capabilities**:
- Capability A
- Capability B

---

### Feature 3: {{FEATURE_3_NAME}}

**Description**: What this sub-feature does

---

## Architecture

### System Context

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           SYSTEM CONTEXT                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│                            ┌──────────┐                                 │
│                            │   User   │                                 │
│                            └────┬─────┘                                 │
│                                 │                                       │
│                                 ▼                                       │
│  ┌──────────────┐        ┌──────────────┐        ┌──────────────┐      │
│  │   External   │◄──────▶│    THIS      │◄──────▶│   External   │      │
│  │   System A   │        │   FEATURE    │        │   System B   │      │
│  └──────────────┘        └──────────────┘        └──────────────┘      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         {{FEATURE_NAME}}                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌───────────────┐    ┌───────────────┐    ┌───────────────┐           │
│  │   Component   │───▶│   Component   │───▶│   Component   │           │
│  │       A       │    │       B       │    │       C       │           │
│  └───────────────┘    └───────────────┘    └───────────────┘           │
│         │                    │                    │                     │
│         └────────────────────┼────────────────────┘                     │
│                              │                                          │
│                              ▼                                          │
│                    ┌─────────────────┐                                  │
│                    │    Database     │                                  │
│                    └─────────────────┘                                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
┌─────────┐    ┌──────────┐    ┌─────────┐    ┌──────────┐    ┌─────────┐
│  Input  │───▶│ Validate │───▶│ Process │───▶│  Store   │───▶│  Output │
└─────────┘    └──────────┘    └─────────┘    └──────────┘    └─────────┘
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | {{TECH}} | User interface |
| API | {{TECH}} | Business logic |
| Database | {{TECH}} | Data persistence |
| Cache | {{TECH}} | Performance optimization |

---

## User Interface

### Main Screen

```
┌─────────────────────────────────────────────────────────────────────────┐
│  [Logo]  {{FEATURE_NAME}}                              [User] [Settings]│
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                        PAGE HEADER                               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────┐  ┌─────────────────────────────────────────────┐  │
│  │                 │  │                                             │  │
│  │    SIDEBAR      │  │              MAIN CONTENT                   │  │
│  │                 │  │                                             │  │
│  │  • Option 1     │  │  ┌─────────────────────────────────────┐   │  │
│  │  • Option 2     │  │  │         CONTENT CARD 1               │   │  │
│  │  • Option 3     │  │  └─────────────────────────────────────┘   │  │
│  │                 │  │                                             │  │
│  │                 │  │  ┌─────────────────────────────────────┐   │  │
│  │                 │  │  │         CONTENT CARD 2               │   │  │
│  │                 │  │  └─────────────────────────────────────┘   │  │
│  │                 │  │                                             │  │
│  └─────────────────┘  └─────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                         FOOTER                                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### User Flow

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  Start  │───▶│ Step 1  │───▶│ Step 2  │───▶│  Done   │
└─────────┘    └─────────┘    └─────────┘    └─────────┘
                   │              │
                   │              └──▶ [Error] ──▶ Retry
                   │
                   └──▶ [Cancel] ──▶ Start
```

---

## API

### Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/{{resource}}` | JWT | List all |
| GET | `/api/v1/{{resource}}/:id` | JWT | Get one |
| POST | `/api/v1/{{resource}}` | JWT | Create |
| PUT | `/api/v1/{{resource}}/:id` | JWT | Update |
| DELETE | `/api/v1/{{resource}}/:id` | JWT | Delete |

### Request/Response Examples

#### Create Resource

**Request**:
```http
POST /api/v1/{{resource}}
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "field1": "value1",
  "field2": "value2"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "field1": "value1",
    "field2": "value2",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "meta": {
    "request_id": "req_abc123"
  }
}
```

### Error Codes

| Code | Status | Description |
|------|--------|-------------|
| VALIDATION_ERROR | 400 | Invalid input data |
| UNAUTHORIZED | 401 | Missing or invalid token |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| RATE_LIMITED | 429 | Too many requests |

---

## Configuration

### Environment Variables

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `FEATURE_ENABLED` | boolean | No | true | Enable/disable feature |
| `FEATURE_MAX_ITEMS` | number | No | 100 | Maximum items |
| `FEATURE_TIMEOUT_MS` | number | No | 30000 | Request timeout |

### Configuration File

```yaml
# config/feature.yaml
feature:
  enabled: true
  settings:
    maxItems: 100
    timeout: 30000
    retries: 3
  integrations:
    external_api:
      url: https://api.example.com
      timeout: 5000
```

---

## Security

### Authentication

- JWT tokens required for all endpoints
- Token expiry: 1 hour
- Refresh token support: Yes

### Authorisation

| Role | Permissions |
|------|-------------|
| Admin | Full access |
| User | Read/Write own resources |
| Viewer | Read-only access |

### Data Protection

- Encryption at rest: AES-256
- Encryption in transit: TLS 1.3
- PII handling: [Describe approach]

---

## Performance

### Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Response time (p95) | < 200ms | TBD |
| Throughput | 1000 req/s | TBD |
| Availability | 99.9% | TBD |

### Caching Strategy

- Cache layer: Redis
- TTL: 5 minutes for list queries
- Invalidation: On write operations

### Rate Limits

| Tier | Limit | Window |
|------|-------|--------|
| Free | 100 | 1 hour |
| Pro | 1000 | 1 hour |
| Enterprise | Unlimited | - |

---

## Related Documents

- [Architecture Overview](../architecture/README.md)
- [API Documentation](../api/README.md)
- [Database Schema](../database/README.md)

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | {{DATE}} | Initial release |
