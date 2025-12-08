# Documentation Templates

> Pre-built templates following enterprise documentation standards extracted from best practices.

---

## Template Catalogue

| Template | Purpose | Location |
|----------|---------|----------|
| **ADR** | Architecture Decision Records | [adr/](./adr/) |
| **API** | API endpoint documentation | [api/](./api/) |
| **Architecture** | System design documentation | [architecture/](./architecture/) |
| **Database** | Schema and data model docs | [database/](./database/) |
| **Deployment** | Infrastructure and CI/CD | [deployment/](./deployment/) |
| **Features** | Feature specifications | [features/](./features/) |
| **Runbooks** | Operational procedures | [runbooks/](./runbooks/) |
| **Security** | Security controls and policies | [security/](./security/) |

---

## How to Use Templates

### 1. Copy Template Structure

```bash
# Copy entire docs structure to your project
cp -r docs/templates/* your-project/docs/
```

### 2. Customize Placeholders

Each template contains placeholders marked with `{{PLACEHOLDER}}`:
- `{{PROJECT_NAME}}` - Your project name
- `{{DATE}}` - Current date
- `{{AUTHOR}}` - Document author
- `{{VERSION}}` - Document version

### 3. Remove Unused Sections

Templates are comprehensive. Remove sections that don't apply to your project.

---

## Template Standards

### Document Header

Every document should start with:

```markdown
# [Document Title]

> [One-line purpose statement]

---

## Table of Contents

1. [Section 1](#section-1)
2. [Section 2](#section-2)

---
```

### Cross-References

Use relative links with anchors:

```markdown
See [Architecture Overview](../architecture/README.md#overview)
```

### Diagrams

Use ASCII art for version-controllable diagrams:

```
┌─────────────────────────────────────────┐
│              COMPONENT                   │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────┐      ┌─────────┐          │
│  │ Module  │─────▶│ Module  │          │
│  └─────────┘      └─────────┘          │
│                                         │
└─────────────────────────────────────────┘
```

### Tables

Use tables for structured information:

```markdown
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Value    | Value    | Value    |
```

---

## Related Documents

- [MASTER_STANDARD.md](../../.design/MASTER_STANDARD.md) - Unified project standards
- [CLAUDE.md](../../CLAUDE.md) - AI context template
