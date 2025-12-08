# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x.x   | Yes       |
| < 1.0   | No        |

## Reporting a Vulnerability

**DO NOT** create public GitHub issues for security vulnerabilities.

### Contact

- **Email**: security@tomstech.com.au
- **Response Time**: Within 48 hours
- **Disclosure**: 90 days coordinated disclosure

### Process

1. Report received and acknowledged (48 hours)
2. Vulnerability confirmed and severity assessed (7 days)
3. Fix developed and tested (14-30 days depending on severity)
4. Security advisory published
5. Fix released

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Severity Levels

| Level | Response | Examples |
|-------|----------|----------|
| Critical | 24 hours | RCE, credential exposure |
| High | 7 days | Auth bypass, data leak |
| Medium | 30 days | XSS, CSRF |
| Low | 90 days | Information disclosure |

## Security Features

DocFlow includes built-in security scanning:

- **CodeQL**: Static analysis for code vulnerabilities
- **OWASP ZAP**: Web/API security scanning
- **Secret Detection**: Hardcoded credential scanning
- **Dependency Audit**: Known vulnerability checking

## Responsible Disclosure

We appreciate security researchers who:

- Give us reasonable time to fix issues before disclosure
- Make a good faith effort to avoid privacy violations
- Do not exploit vulnerabilities beyond proof of concept

---

(c) 2024-2025 Tom Mangano (TomsTech). All Rights Reserved.
