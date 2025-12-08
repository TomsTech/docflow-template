# DocFlow PDF Export - Quick Reference

## Installation

```bash
npm install
```

## Basic Commands

| Command | Description |
|---------|-------------|
| `docflow export pdf` | Generate PDF with defaults |
| `docflow export pdf --toc` | Include table of contents |
| `docflow export pdf --template executive` | Executive summary |
| `docflow export pdf --template technical` | Technical documentation |
| `docflow export pdf --template full` | Complete documentation |
| `docflow export pdf --help` | Show all options |

## Common Options

| Option | Default | Description |
|--------|---------|-------------|
| `-i, --input <path>` | `docs` | Input files or directories (comma-separated) |
| `-o, --output <path>` | `documentation.pdf` | Output PDF filename |
| `-t, --template <type>` | `technical` | Template: executive, technical, full |
| `--toc` | `false` | Include table of contents |
| `--cover` | `true` | Include cover page |
| `--header <text>` | - | Custom header text |
| `--footer <text>` | - | Custom footer text |
| `-f, --force` | `false` | Overwrite existing file |

## Quick Examples

### All Documentation
```bash
docflow export pdf --toc --cover
```

### Specific Files
```bash
docflow export pdf --input README.md,docs/API.md --output quick-ref.pdf
```

### Executive Summary
```bash
docflow export pdf --template executive --toc --cover --output executive-summary.pdf
```

### API Documentation
```bash
docflow export pdf --input docs/api --output api-docs.pdf --toc
```

### With Custom Branding
```bash
docflow export pdf --header "MyCompany Docs" --footer "© 2025" --toc --cover
```

## Templates

| Template | Use For | Includes |
|----------|---------|----------|
| **executive** | Stakeholders, executives | High-level overview, summaries |
| **technical** | Developers, architects | Technical specs, APIs, architecture |
| **full** | Handover, audit, archive | Everything |

## Output Structure

Generated PDFs include:

1. **Cover Page** (if `--cover`)
   - Project name
   - Description
   - Generation date
   - Version info

2. **Table of Contents** (if `--toc`)
   - Document titles
   - Section headings (H2, H3)
   - Clickable links

3. **Content Pages**
   - Formatted markdown
   - Syntax-highlighted code
   - Styled tables
   - Page numbers

## File Organization

Recommended structure:

```
project/
├── docs/
│   ├── api/
│   ├── architecture/
│   └── deployment/
├── reports/
│   ├── daily/
│   ├── weekly/
│   └── releases/
└── docflow.config.json
```

## Automation

### Daily Export
```bash
# Linux/Mac
docflow export pdf --output "reports/daily/docs-$(date +%Y-%m-%d).pdf" --force

# Windows PowerShell
docflow export pdf --output "reports\daily\docs-$(Get-Date -Format 'yyyy-MM-dd').pdf" --force
```

### Weekly Executive Report
```bash
docflow export pdf \
  --template executive \
  --input README.md,CHANGELOG.md \
  --output "reports/weekly/exec-$(date +%Y-W%V).pdf" \
  --toc --cover --force
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Chromium not found | `npm install puppeteer --save` |
| Files not found | Check paths, use absolute paths if needed |
| File exists error | Add `--force` flag |
| PDF too large | Split into multiple PDFs or use selective input |

## Dependencies

- **marked** (^11.1.1) - Markdown parsing
- **puppeteer** (^21.7.0) - PDF generation (includes Chromium)

## Configuration

Customize in `docflow.config.json`:

```json
{
  "project": {
    "name": "Your Project",
    "description": "Your description"
  },
  "branding": {
    "primary": "#072151",
    "secondary": "#2978c7",
    "accent": "#14b8a6"
  }
}
```

## Tips

1. **Version your outputs**: Include date or version in filename
2. **Use templates wisely**: Match template to audience
3. **Organize exports**: Keep different report types in separate folders
4. **Automate**: Use cron/Task Scheduler for regular exports
5. **Test first**: Run with `--help` to verify options

## Getting Help

```bash
# General help
docflow --help

# Export command help
docflow export --help

# PDF subcommand help
docflow export pdf --help
```

## Further Reading

- [Full Examples](./EXAMPLES.md) - Detailed usage examples
- [Template Documentation](./README.md) - Template guide
- [DocFlow README](../../../README.md) - Main documentation

---

**Version**: 1.0.0
**Last Updated**: 2025-12-08
