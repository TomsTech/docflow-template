# Report Templates

This directory contains templates for generating professional PDF reports from your documentation.

## Available Templates

### 1. Executive Summary (`executive-summary.md`)

**Purpose**: High-level overview for executive stakeholders and decision-makers

**Includes:**
- Project overview and objectives
- Key deliverables and status
- Architecture highlights
- Risk management summary
- Timeline and roadmap
- Budget and resource allocation
- Success metrics
- Recommendations

**Best For:**
- Executive briefings
- Stakeholder presentations
- Board meetings
- Strategic planning sessions

**Usage:**
```bash
docflow export pdf --template executive --toc --cover
```

### 2. Technical Report (`technical-report.md`)

**Purpose**: Detailed technical documentation for development teams and architects

**Includes:**
- System architecture diagrams
- Technical stack details
- Data models and ERDs
- API reference
- Security implementation
- Deployment procedures
- Testing strategy
- Performance considerations

**Best For:**
- Technical handovers
- Development onboarding
- Architecture reviews
- DevOps documentation

**Usage:**
```bash
docflow export pdf --template technical --toc --cover
```

### 3. Full Documentation (`full-documentation.md`)

**Purpose**: Comprehensive documentation package covering all aspects

**Includes:**
- Everything from executive and technical templates
- Operations guides
- Troubleshooting procedures
- Appendices and references
- Complete change history

**Best For:**
- Complete system handover
- Audit requirements
- Knowledge base archives
- Compliance documentation

**Usage:**
```bash
docflow export pdf --template full --toc --cover
```

## Using Templates

### Basic Export

Export all documentation in your `docs/` folder:

```bash
docflow export pdf
```

This creates `documentation.pdf` using the default technical template.

### Custom Export

Specify input, output, and template:

```bash
docflow export pdf \
  --input docs/api,docs/architecture \
  --output reports/api-docs.pdf \
  --template technical \
  --toc \
  --cover
```

### Multiple Files

Export specific files:

```bash
docflow export pdf \
  --input README.md,docs/API_REFERENCE.md,docs/DEPLOYMENT.md \
  --output quick-reference.pdf \
  --template technical
```

### Custom Headers/Footers

Add custom header and footer text:

```bash
docflow export pdf \
  --template executive \
  --header "Confidential - Internal Use Only" \
  --footer "© 2025 Your Organisation"
```

## Template Variables

Templates support variable substitution from `docflow.config.json`:

| Variable | Source | Example |
|----------|--------|---------|
| `{{PROJECT_NAME}}` | `project.name` | "QCT Portal" |
| `{{PROJECT_DESCRIPTION}}` | `project.description` | "Staff request system" |
| `{{VERSION}}` | `version` | "1.0.0" |
| `{{DATE}}` | Current date | "2025-12-08" |
| `{{OWNER}}` | `project.owner` | "Engineering Team" |
| `{{REPO}}` | `project.repository` | "github.com/org/repo" |

Variables are automatically replaced during PDF generation.

## Customising Templates

### Creating Custom Templates

1. Copy an existing template:
   ```bash
   cp technical-report.md custom-template.md
   ```

2. Edit the markdown content

3. Use in exports:
   ```bash
   docflow export pdf --template custom --input docs/templates/reports/custom-template.md
   ```

### Styling

PDF styling is controlled by the CSS in `src/generators/pdf.js`. Colours are automatically pulled from `docflow.config.json` branding section:

```json
{
  "branding": {
    "primary": "#072151",
    "secondary": "#2978c7",
    "accent": "#14b8a6"
  }
}
```

## Output Quality

### Page Settings

- **Format**: A4
- **Margins**: 2cm top/bottom, 1.5cm left/right
- **Font**: System sans-serif (Segoe UI, SF Pro, etc.)
- **Font Size**: 11pt body, responsive headings

### Features

- Table of contents with hyperlinks
- Syntax-highlighted code blocks
- Responsive tables
- Mermaid diagram support (converted to images)
- Professional cover page
- Page numbers in footer

## Best Practices

### 1. Document Organisation

Organise your docs folder by topic:

```
docs/
├── api/              # API documentation
├── architecture/     # Architecture docs
├── deployment/       # Deployment guides
├── features/         # Feature documentation
└── runbooks/         # Operations runbooks
```

### 2. Template Selection

| Audience | Template | Contents |
|----------|----------|----------|
| Executives | Executive | High-level summaries only |
| Developers | Technical | Detailed technical specs |
| Everyone | Full | Complete documentation |

### 3. File Naming

Use descriptive output names:

```bash
# Good
--output reports/api-reference-v1.0.pdf
--output handover/technical-documentation-2025-12.pdf

# Avoid
--output doc.pdf
--output output.pdf
```

### 4. Version Control

Include version and date in the filename:

```bash
docflow export pdf --output "reports/QCT-Portal-Docs-v1.0-2025-12-08.pdf"
```

## Examples

### Daily Technical Export

```bash
#!/bin/bash
# Export technical docs daily
docflow export pdf \
  --template technical \
  --input docs/api,docs/architecture,docs/database \
  --output "reports/tech-docs-$(date +%Y-%m-%d).pdf" \
  --toc --cover
```

### Executive Monthly Report

```bash
#!/bin/bash
# Generate monthly executive summary
docflow export pdf \
  --template executive \
  --input README.md,docs/ARCHITECTURE.md \
  --output "reports/executive-summary-$(date +%Y-%m).pdf" \
  --toc --cover \
  --header "Confidential"
```

### Complete Handover Package

```bash
#!/bin/bash
# Create complete handover documentation
docflow export pdf \
  --template full \
  --input docs \
  --output "handover/complete-documentation-$(date +%Y-%m-%d).pdf" \
  --toc --cover \
  --footer "Project Handover Package"
```

## Troubleshooting

### Common Issues

**Issue**: PDF generation fails with "Chromium not found"

**Solution**: Ensure Puppeteer is installed correctly:
```bash
npm install puppeteer --save
```

**Issue**: Images not appearing in PDF

**Solution**: Use absolute paths or ensure images are accessible from the docs directory.

**Issue**: Mermaid diagrams not rendering

**Solution**: Mermaid diagrams are not yet supported. They appear as code blocks. Convert to images first.

**Issue**: File too large

**Solution**: Split into multiple PDFs or use selective input:
```bash
# Instead of all docs
--input docs

# Be selective
--input docs/api,docs/architecture
```

## Support

For issues or feature requests:
- GitHub Issues: [TomsTech/docflow-template](https://github.com/TomsTech/docflow-template/issues)
- Documentation: [DocFlow README](../../../README.md)

---

**Last Updated**: 2025-12-08
**Version**: 1.0.0
