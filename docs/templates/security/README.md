# Security Architecture

> Security controls, threat models, and compliance requirements for {{PROJECT_NAME}}.

---

## Table of Contents

1. [Overview](#overview)
2. [Security Principles](#security-principles)
3. [Authentication & Authorisation](#authentication--authorisation)
4. [Data Protection](#data-protection)
5. [Network Security](#network-security)
6. [Application Security](#application-security)
7. [Compliance](#compliance)
8. [Incident Response](#incident-response)
9. [Security Testing](#security-testing)

---

## Overview

### Security Posture

| Aspect | Status |
|--------|--------|
| Security Classification | {{CLASSIFICATION}} |
| Last Security Review | {{DATE}} |
| Penetration Test | {{DATE}} |
| Compliance Certifications | {{CERTIFICATIONS}} |

### Threat Model Summary

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           THREAT MODEL                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  EXTERNAL THREATS              SYSTEM                 INTERNAL THREATS  │
│  ┌──────────────┐         ┌──────────────┐         ┌──────────────┐    │
│  │ • Attackers  │────────▶│              │◀────────│ • Insider    │    │
│  │ • Bots       │         │  {{SYSTEM}}  │         │ • Misconfig  │    │
│  │ • DDoS       │         │              │         │ • Data leak  │    │
│  └──────────────┘         └──────────────┘         └──────────────┘    │
│                                  │                                      │
│                                  ▼                                      │
│                          ┌──────────────┐                              │
│                          │  Protected   │                              │
│                          │    Assets    │                              │
│                          └──────────────┘                              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Security Principles

### Defence in Depth

| Layer | Controls |
|-------|----------|
| Perimeter | WAF, DDoS protection, rate limiting |
| Network | VPC isolation, security groups, NACLs |
| Application | Input validation, output encoding, CSRF protection |
| Data | Encryption at rest/transit, access controls |
| Identity | MFA, SSO, least privilege |

### Zero Trust Architecture

1. **Never Trust, Always Verify** - All requests authenticated
2. **Least Privilege Access** - Minimum permissions required
3. **Assume Breach** - Segment and monitor continuously
4. **Explicit Verification** - Context-aware access decisions

---

## Authentication & Authorisation

### Authentication Flow

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  User   │───▶│  Login  │───▶│   IdP   │───▶│  Token  │
└─────────┘    └─────────┘    └─────────┘    └─────────┘
                                                  │
                                                  ▼
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│ Access  │◀───│ Verify  │◀───│  API    │◀───│ Request │
└─────────┘    └─────────┘    └─────────┘    └─────────┘
```

### Authentication Methods

| Method | Use Case | Implementation |
|--------|----------|----------------|
| JWT | API access | RS256 signed tokens |
| OAuth 2.0 | Third-party auth | Authorization Code + PKCE |
| API Keys | Service-to-service | HMAC-SHA256 |
| MFA | High-privilege actions | TOTP/WebAuthn |

### Token Configuration

| Parameter | Value |
|-----------|-------|
| Access Token TTL | 15 minutes |
| Refresh Token TTL | 7 days |
| Algorithm | RS256 |
| Key Rotation | 90 days |

### Role-Based Access Control (RBAC)

| Role | Permissions | Scope |
|------|-------------|-------|
| Super Admin | Full system access | Global |
| Tenant Admin | Tenant management | Own tenant |
| User | CRUD own resources | Own records |
| Viewer | Read-only access | Assigned resources |
| Service Account | API access | Specific endpoints |

### Permission Matrix

| Resource | Admin | User | Viewer |
|----------|-------|------|--------|
| Users | CRUD | R (self) | - |
| Records | CRUD | CRUD (own) | R |
| Settings | CRUD | R | R |
| Audit Logs | R | - | - |
| Reports | CRUD | R | R |

---

## Data Protection

### Encryption Standards

| Data State | Method | Standard |
|------------|--------|----------|
| At Rest | AES-256-GCM | Database, files, backups |
| In Transit | TLS 1.3 | All network communication |
| In Use | Application-level | Sensitive field encryption |

### Key Management

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        KEY MANAGEMENT HIERARCHY                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│                        ┌──────────────────┐                            │
│                        │   Master Key     │                            │
│                        │   (HSM/KMS)      │                            │
│                        └────────┬─────────┘                            │
│                                 │                                       │
│              ┌──────────────────┼──────────────────┐                   │
│              ▼                  ▼                  ▼                   │
│     ┌──────────────┐   ┌──────────────┐   ┌──────────────┐           │
│     │  Data Keys   │   │  Token Keys  │   │ Backup Keys  │           │
│     │  (Per-Tenant)│   │   (Signing)  │   │  (Recovery)  │           │
│     └──────────────┘   └──────────────┘   └──────────────┘           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Data Classification

| Level | Description | Controls |
|-------|-------------|----------|
| Public | Marketing, docs | None required |
| Internal | Business data | Authentication |
| Confidential | PII, financial | Encryption + access control |
| Restricted | Credentials, keys | HSM + audit + approval |

### PII Handling

| Data Type | Storage | Access | Retention |
|-----------|---------|--------|-----------|
| Email | Encrypted | Authenticated | Account lifetime |
| Name | Encrypted | Authenticated | Account lifetime |
| IP Address | Hashed | Admin only | 90 days |
| Password | bcrypt (cost 12) | Never readable | Until changed |

---

## Network Security

### Network Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         NETWORK SECURITY ZONES                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  INTERNET                                                               │
│      │                                                                  │
│      ▼                                                                  │
│  ┌──────────────┐                                                      │
│  │     WAF      │  ← Rate limiting, IP filtering, SQL injection        │
│  └──────┬───────┘                                                      │
│         │                                                               │
│         ▼                                                               │
│  ╔══════════════════════════════════════════════════════════════════╗  │
│  ║  DMZ (Public Subnet)                                             ║  │
│  ║  ┌──────────────┐    ┌──────────────┐                           ║  │
│  ║  │ Load Balancer│───▶│   CDN Edge   │                           ║  │
│  ║  └──────┬───────┘    └──────────────┘                           ║  │
│  ╚═════════│════════════════════════════════════════════════════════╝  │
│            │                                                            │
│            ▼                                                            │
│  ╔══════════════════════════════════════════════════════════════════╗  │
│  ║  APPLICATION TIER (Private Subnet)                               ║  │
│  ║  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       ║  │
│  ║  │   API GW     │───▶│   Services   │───▶│   Workers    │       ║  │
│  ║  └──────────────┘    └──────┬───────┘    └──────────────┘       ║  │
│  ╚═════════════════════════════│════════════════════════════════════╝  │
│                                │                                        │
│                                ▼                                        │
│  ╔══════════════════════════════════════════════════════════════════╗  │
│  ║  DATA TIER (Isolated Subnet)                                     ║  │
│  ║  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       ║  │
│  ║  │   Database   │    │    Cache     │    │   Storage    │       ║  │
│  ║  └──────────────┘    └──────────────┘    └──────────────┘       ║  │
│  ╚══════════════════════════════════════════════════════════════════╝  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Security Group Rules

| Rule | Source | Port | Purpose |
|------|--------|------|---------|
| HTTPS | 0.0.0.0/0 | 443 | Public web access |
| API Internal | VPC CIDR | 8080 | Service-to-service |
| Database | App SG | 5432 | Application DB access |
| Cache | App SG | 6379 | Application cache access |

---

## Application Security

### OWASP Top 10 Mitigations

| Risk | Mitigation |
|------|------------|
| A01 Broken Access Control | RBAC, resource ownership validation |
| A02 Cryptographic Failures | TLS 1.3, AES-256, secure key management |
| A03 Injection | Parameterised queries, input validation |
| A04 Insecure Design | Threat modelling, security reviews |
| A05 Security Misconfiguration | Infrastructure as Code, secure defaults |
| A06 Vulnerable Components | Dependabot, regular patching |
| A07 Auth Failures | MFA, session management, rate limiting |
| A08 Data Integrity Failures | Signed releases, integrity checks |
| A09 Logging Failures | Centralised logging, audit trails |
| A10 SSRF | URL validation, egress filtering |

### Input Validation

```typescript
// Example validation schema
const schema = {
  email: z.string().email().max(255),
  name: z.string().min(1).max(100).regex(/^[a-zA-Z\s'-]+$/),
  age: z.number().int().min(0).max(150),
  url: z.string().url().refine(url =>
    ['https://allowed-domain.com'].some(d => url.startsWith(d))
  ),
};
```

### Security Headers

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

---

## Compliance

### Regulatory Requirements

| Regulation | Scope | Status |
|------------|-------|--------|
| GDPR | EU user data | Compliant |
| Privacy Act 1988 | AU user data | Compliant |
| SOC 2 Type II | Security controls | In progress |
| ISO 27001 | ISMS | Planned |

### Audit Controls

| Control | Implementation | Evidence |
|---------|----------------|----------|
| Access Logging | CloudWatch/audit table | Logs retained 2 years |
| Change Management | Git + PR reviews | Commit history |
| Vulnerability Management | Dependabot + SAST | Scan reports |
| Incident Response | Runbooks + PagerDuty | Incident records |

### Data Retention

| Data Type | Retention | Deletion Method |
|-----------|-----------|-----------------|
| User data | Account lifetime + 30 days | Soft delete → hard delete |
| Audit logs | 2 years | Automated archival |
| Backups | 30 days | Automated expiry |
| Analytics | 1 year | Anonymisation |

---

## Incident Response

### Severity Levels

| Level | Description | Response Time | Examples |
|-------|-------------|---------------|----------|
| P1 Critical | Service down, data breach | 15 minutes | Complete outage, confirmed breach |
| P2 High | Major feature broken | 1 hour | Auth failure, payment issues |
| P3 Medium | Minor feature affected | 4 hours | Non-critical bug, performance |
| P4 Low | Cosmetic/minor | 24 hours | UI issues, documentation |

### Incident Response Flow

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│ Detect  │───▶│ Triage  │───▶│ Contain │───▶│Eradicate│───▶│ Recover │
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘
                                                                  │
                                                                  ▼
                                                           ┌─────────┐
                                                           │ Review  │
                                                           └─────────┘
```

### Security Contacts

| Role | Contact | Escalation |
|------|---------|------------|
| Security Lead | {{EMAIL}} | First response |
| CISO | {{EMAIL}} | P1/P2 incidents |
| Legal | {{EMAIL}} | Data breach |
| Communications | {{EMAIL}} | Public disclosure |

---

## Security Testing

### Testing Schedule

| Test Type | Frequency | Scope |
|-----------|-----------|-------|
| SAST (CodeQL) | Every PR | All code changes |
| DAST (OWASP ZAP) | Weekly | Staging environment |
| Dependency Scan | Daily | All dependencies |
| Penetration Test | Annual | Full application |
| Red Team | Bi-annual | Infrastructure + app |

### Vulnerability Management

| Severity | SLA | Action |
|----------|-----|--------|
| Critical | 24 hours | Immediate patch/mitigation |
| High | 7 days | Prioritised fix |
| Medium | 30 days | Scheduled fix |
| Low | 90 days | Next release |

### Security Checklist for PRs

- [ ] No secrets in code
- [ ] Input validation on all user input
- [ ] Output encoding for XSS prevention
- [ ] Parameterised queries for database access
- [ ] Authentication required for protected routes
- [ ] Authorisation checks for resource access
- [ ] Sensitive data encrypted
- [ ] Security headers configured
- [ ] Dependencies updated
- [ ] No high/critical vulnerabilities

---

## Related Documents

- [Architecture Overview](../architecture/README.md)
- [API Documentation](../api/README.md)
- [Incident Runbooks](../runbooks/)
- [Deployment Guide](../deployment/README.md)

---

## Changelog

| Date | Author | Change |
|------|--------|--------|
| {{DATE}} | {{AUTHOR}} | Initial security documentation |
