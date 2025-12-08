<p align="center">
  <h1 align="center">DocFlow</h1>
  <p align="center">
    <strong>Enterprise Documentation & CI/CD Template System</strong>
  </p>
  <p align="center">
    Automated docs generation, quality gates, security scanning, and release management.
  </p>
</p>

---

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│     ██████╗  ██████╗  ██████╗███████╗██╗      ██████╗ ██╗    ██╗           │
│     ██╔══██╗██╔═══██╗██╔════╝██╔════╝██║     ██╔═══██╗██║    ██║           │
│     ██║  ██║██║   ██║██║     █████╗  ██║     ██║   ██║██║ █╗ ██║           │
│     ██║  ██║██║   ██║██║     ██╔══╝  ██║     ██║   ██║██║███╗██║           │
│     ██████╔╝╚██████╔╝╚██████╗██║     ███████╗╚██████╔╝╚███╔███╔╝           │
│     ╚═════╝  ╚═════╝  ╚═════╝╚═╝     ╚══════╝ ╚═════╝  ╚══╝╚══╝            │
│                                                                             │
│                    Enterprise Documentation Automation                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## What is DocFlow?

DocFlow is a comprehensive template system that automates documentation, enforces quality standards, and manages releases for any software project. Built from patterns extracted from 24+ production repositories.

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   COMMIT    │────▶│   QUALITY   │────▶│    DOCS     │────▶│   RELEASE   │
│             │     │    GATES    │     │  GENERATE   │     │             │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
      │                   │                   │                   │
      ▼                   ▼                   ▼                   ▼
   Push/PR          Lint + Test         README, ERD,         Tag, Notes,
                    + Security          Data Dict            Artifacts
```

---

## Features

### Documentation Generation
- Enterprise templates (ADR, Runbooks, API docs, Security, Deployment)
- Auto-generated data dictionaries from schemas
- Mermaid + ASCII architecture diagrams
- Multi-format export (Markdown, PDF, DOCX)

### Quality Gates
| Language | Tools |
|----------|-------|
| JavaScript/TypeScript | ESLint, TypeScript |
| Python | Ruff |
| PowerShell | PSScriptAnalyzer |
| YAML | yamllint |
| Markdown | markdownlint |

### Security Scanning
- **CodeQL** - Static analysis
- **OWASP ZAP** - Web/API scanning
- **Secret Detection** - Credential scanning
- **Dependency Audit** - Vulnerability checks

### Release Management
- Semantic versioning
- Conventional commit changelogs
- GitHub Releases with artifacts
- Teams/Email notifications

---

## Templates Included

```
docs/templates/
├── adr/           # Architecture Decision Records
├── api/           # API endpoint documentation
├── architecture/  # System design with C4 diagrams
├── database/      # Schema documentation
├── deployment/    # Infrastructure & CI/CD
├── features/      # Feature specifications
├── runbooks/      # Operational procedures
└── security/      # Security architecture
```

---

## Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `docflow-quality-gates.yml` | Push, PR | Linting, tests, coverage |
| `docflow-security-scan.yml` | Push, Schedule | Security scanning |
| `docflow-generate-docs.yml` | Push, PR | Documentation generation |
| `docflow-release.yml` | Tag | Release management |
| `docflow-scaffold.yml` | Manual | Scaffold docs structure |

---

## Configuration

All settings in `docflow.config.json`:

```json
{
  "project": {
    "name": "Your Project",
    "type": "auto"
  },
  "templates": {
    "scaffold": { "enabled": true },
    "adr": { "enabled": true },
    "runbooks": { "enabled": true }
  },
  "security": {
    "owaspZap": { "enabled": true },
    "codeql": { "enabled": true }
  }
}
```

---

## License

**Proprietary License** - Personal use only.

Commercial use requires a paid license. All royalties payable to Tom Mangano (TomsTech).

See [LICENSE](LICENSE) for full terms.

---

<p align="center">
  <sub>Built by <strong>TomsTech</strong> | Queensland, Australia</sub>
</p>
