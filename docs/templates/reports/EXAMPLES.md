# DocFlow PDF Export Examples

Complete examples for generating PDF reports using the DocFlow export command.

## Prerequisites

Install dependencies first:

```bash
npm install
```

This will install:
- `marked` - Markdown parsing
- `puppeteer` - PDF generation (includes Chromium)

## Basic Usage

### 1. Default Export

Export all documentation with default settings:

```bash
docflow export pdf
```

**Generates:**
- File: `documentation.pdf`
- Template: Technical
- Input: All `.md` files in `docs/`
- Includes: Cover page (no TOC by default)

### 2. With Table of Contents

Add a clickable table of contents:

```bash
docflow export pdf --toc
```

### 3. Different Templates

**Executive Summary** (high-level overview):
```bash
docflow export pdf --template executive --toc --cover
```

**Technical Documentation** (detailed specs):
```bash
docflow export pdf --template technical --toc --cover
```

**Full Documentation** (everything):
```bash
docflow export pdf --template full --toc --cover
```

## Advanced Usage

### Custom Input and Output

#### Export Specific Files

```bash
docflow export pdf \
  --input README.md,CONTRIBUTING.md,LICENSE \
  --output quick-reference.pdf
```

#### Export Specific Directories

```bash
docflow export pdf \
  --input docs/api,docs/architecture \
  --output api-architecture.pdf \
  --template technical \
  --toc
```

#### Export Single File

```bash
docflow export pdf \
  --input docs/API_REFERENCE.md \
  --output api-reference.pdf
```

### Custom Headers and Footers

#### Confidential Documents

```bash
docflow export pdf \
  --template executive \
  --header "CONFIDENTIAL - INTERNAL USE ONLY" \
  --footer "© 2025 Queensland College of Teachers" \
  --toc --cover
```

#### Project-Specific Branding

```bash
docflow export pdf \
  --template technical \
  --header "QCT Power Apps Request Suite" \
  --footer "Documentation Version 4.1" \
  --output qct-technical-docs.pdf \
  --toc --cover
```

### Overwriting Files

Force overwrite existing files:

```bash
docflow export pdf \
  --output documentation.pdf \
  --force
```

## Real-World Examples

### Example 1: API Documentation Bundle

Export all API-related documentation:

```bash
docflow export pdf \
  --input docs/api \
  --output reports/api-documentation-$(date +%Y-%m-%d).pdf \
  --template technical \
  --toc --cover \
  --header "API Reference Documentation" \
  --footer "Page"
```

**Result:**
- All files from `docs/api/` included
- Technical template styling
- Table of contents with API endpoints
- Custom header
- Dated filename for versioning

### Example 2: Executive Quarterly Report

Create executive summary for stakeholders:

```bash
docflow export pdf \
  --input README.md,docs/ARCHITECTURE.md,CHANGELOG.md \
  --output reports/executive-summary-Q4-2025.pdf \
  --template executive \
  --toc --cover \
  --header "Quarterly Technical Review - Q4 2025" \
  --footer "Confidential"
```

**Result:**
- Executive-friendly formatting
- Only high-level documentation
- Professional cover page
- Confidentiality marking

### Example 3: Complete Handover Package

Full system documentation for handover:

```bash
docflow export pdf \
  --input docs \
  --output handover/complete-system-documentation-v4.1.pdf \
  --template full \
  --toc --cover \
  --header "QCT PARS - Complete System Documentation" \
  --footer "Version 4.1 - Handover Package"
```

**Result:**
- Everything from docs folder
- Comprehensive formatting
- Full table of contents
- Version-stamped

### Example 4: Security Audit Documentation

Bundle security-related docs for audit:

```bash
docflow export pdf \
  --input docs/security,docs/architecture/adr,SECURITY.md \
  --output audit/security-documentation-$(date +%Y-%m-%d).pdf \
  --template technical \
  --toc --cover \
  --header "Security Audit Documentation" \
  --footer "Prepared for Annual Security Review"
```

**Result:**
- Security docs + ADRs
- Technical detail level
- Audit-ready format
- Date-stamped

### Example 5: Developer Onboarding Pack

Documentation for new team members:

```bash
docflow export pdf \
  --input README.md,CONTRIBUTING.md,docs/architecture,docs/deployment \
  --output onboarding/developer-guide-$(date +%Y-%m-%d).pdf \
  --template technical \
  --toc --cover \
  --header "Developer Onboarding Guide" \
  --footer "Welcome to the Team!"
```

**Result:**
- Essential developer information
- Architecture and deployment guides
- Easy navigation with TOC
- Friendly footer message

## Automation Scripts

### Daily Documentation Export

Create a scheduled task to export docs daily:

**Windows (PowerShell)**
```powershell
# Export-DailyDocs.ps1
$date = Get-Date -Format "yyyy-MM-dd"
$output = "reports\daily\documentation-$date.pdf"

& docflow export pdf `
  --template technical `
  --toc --cover `
  --output $output `
  --force

Write-Host "Generated: $output"
```

**Linux/Mac (Bash)**
```bash
#!/bin/bash
# export-daily-docs.sh
DATE=$(date +%Y-%m-%d)
OUTPUT="reports/daily/documentation-${DATE}.pdf"

docflow export pdf \
  --template technical \
  --toc --cover \
  --output "$OUTPUT" \
  --force

echo "Generated: $OUTPUT"
```

### Weekly Executive Report

**PowerShell**
```powershell
# Export-WeeklyExecutive.ps1
$week = Get-Date -Format "yyyy-Www"
$output = "reports\weekly\executive-summary-$week.pdf"

& docflow export pdf `
  --input README.md,docs/ARCHITECTURE.md,CHANGELOG.md `
  --template executive `
  --toc --cover `
  --output $output `
  --header "Weekly Executive Summary - $week" `
  --force

Write-Host "Generated: $output"
```

### Monthly Archive

**Bash**
```bash
#!/bin/bash
# archive-monthly-docs.sh
MONTH=$(date +%Y-%m)
OUTPUT="archives/${MONTH}/complete-documentation.pdf"

mkdir -p "archives/${MONTH}"

docflow export pdf \
  --template full \
  --toc --cover \
  --output "$OUTPUT" \
  --header "Monthly Documentation Archive - ${MONTH}" \
  --footer "Archived: $(date +%Y-%m-%d)" \
  --force

# Compress older archives
find archives/ -type f -name "*.pdf" -mtime +90 -exec gzip {} \;

echo "Monthly archive created: $OUTPUT"
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Generate Documentation PDF

on:
  push:
    branches: [main]
  schedule:
    - cron: '0 2 * * 0'  # Weekly on Sunday at 2 AM

jobs:
  generate-pdf:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Generate PDF
        run: |
          mkdir -p reports
          npm run docflow -- export pdf \
            --template full \
            --toc --cover \
            --output reports/documentation-${{ github.sha }}.pdf \
            --header "Generated from commit ${{ github.sha }}" \
            --force

      - name: Upload PDF artifact
        uses: actions/upload-artifact@v4
        with:
          name: documentation-pdf
          path: reports/*.pdf
          retention-days: 90

      - name: Create Release
        if: startsWith(github.ref, 'refs/tags/')
        uses: softprops/action-gh-release@v1
        with:
          files: reports/*.pdf
```

### Azure DevOps

```yaml
# azure-pipelines.yml
trigger:
  - main

pool:
  vmImage: 'ubuntu-latest'

steps:
- task: NodeTool@0
  inputs:
    versionSpec: '20.x'

- script: npm ci
  displayName: 'Install dependencies'

- script: |
    mkdir -p $(Build.ArtifactStagingDirectory)/reports
    npm run docflow -- export pdf \
      --template full \
      --toc --cover \
      --output $(Build.ArtifactStagingDirectory)/reports/documentation.pdf \
      --force
  displayName: 'Generate PDF documentation'

- task: PublishBuildArtifacts@1
  inputs:
    pathToPublish: '$(Build.ArtifactStagingDirectory)/reports'
    artifactName: 'documentation'
```

## Troubleshooting

### Issue: "Chromium not found"

**Solution:**
```bash
# Reinstall Puppeteer
npm uninstall puppeteer
npm install puppeteer --save
```

### Issue: "Input files not found"

**Solution:**
```bash
# Check your current directory
pwd

# Use absolute or correct relative paths
docflow export pdf --input ./docs/api/README.md

# Or use full paths
docflow export pdf --input /full/path/to/docs
```

### Issue: "Output file exists"

**Solution:**
```bash
# Use --force flag
docflow export pdf --output documentation.pdf --force
```

### Issue: "PDF too large"

**Solutions:**

1. **Split into multiple PDFs:**
   ```bash
   # API docs
   docflow export pdf --input docs/api --output api-docs.pdf

   # Architecture docs
   docflow export pdf --input docs/architecture --output arch-docs.pdf
   ```

2. **Use selective template:**
   ```bash
   # Executive template includes less content
   docflow export pdf --template executive
   ```

3. **Exclude large files:**
   ```bash
   # Only include specific files
   docflow export pdf --input docs/api,docs/deployment
   ```

## Tips and Best Practices

### 1. Versioned Outputs

Always include version/date in filename:

```bash
docflow export pdf --output "docs-v$(git describe --tags)-$(date +%Y-%m-%d).pdf"
```

### 2. Template Selection Guide

| Use Case | Template | Why |
|----------|----------|-----|
| Board presentation | Executive | High-level, non-technical |
| Code review | Technical | Detailed, technical specs |
| Audit compliance | Full | Complete documentation |
| New developer | Technical | Balance of detail and overview |
| Handover | Full | Everything they'll need |

### 3. Organized Output

Keep exports organized:

```bash
mkdir -p reports/{daily,weekly,monthly,releases}

# Daily technical docs
docflow export pdf --output reports/daily/tech-$(date +%Y-%m-%d).pdf

# Weekly executive summary
docflow export pdf --template executive --output reports/weekly/exec-$(date +%Y-W%V).pdf

# Release documentation
docflow export pdf --template full --output reports/releases/v4.1.0.pdf
```

### 4. Custom Branding

Customize for your organization in `docflow.config.json`:

```json
{
  "project": {
    "name": "Your Project Name",
    "description": "Your project description",
    "owner": "Your Team"
  },
  "branding": {
    "primary": "#072151",
    "secondary": "#2978c7",
    "accent": "#14b8a6"
  }
}
```

These colours will automatically apply to all generated PDFs.

## Additional Resources

- [Report Templates README](./README.md) - Template documentation
- [DocFlow README](../../../README.md) - Main documentation
- [Marked Documentation](https://marked.js.org/) - Markdown parsing
- [Puppeteer Documentation](https://pptr.dev/) - PDF generation

---

**Last Updated**: 2025-12-08
**DocFlow Version**: 1.0.0
