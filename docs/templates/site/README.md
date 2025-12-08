# DocFlow Site Generator Templates

This directory contains templates for generating static documentation sites with DocFlow.

## Overview

DocFlow supports two popular static site generators:

1. **VitePress** (Default) - Lightweight, fast, and Vue-powered
2. **Docusaurus** - Feature-rich, React-based with MDX support

## Templates

### VitePress Configuration

- **File**: `vitepress.config.js`
- **Description**: Configuration template for VitePress sites
- **Features**:
  - Auto-generated navigation from docs structure
  - Local search
  - Dark mode support
  - GitHub integration
  - DocFlow branded theme

### Docusaurus Configuration

- **File**: `docusaurus.config.js`
- **Description**: Configuration template for Docusaurus sites
- **Features**:
  - Full-featured documentation site
  - MDX support
  - Versioning
  - Internationalization
  - Advanced search with Algolia (configurable)
  - DocFlow branded theme

### Custom Theme

- **Directory**: `theme/`
- **File**: `theme/index.css`
- **Description**: DocFlow branded theme stylesheet
- **Features**:
  - Uses colours from `docflow.config.json`
  - Light and dark mode support
  - Responsive design
  - Custom badges, alerts, and cards
  - Branded scrollbars and navigation

## Usage

### Initialize a Documentation Site

```bash
# Initialize with VitePress (default)
docflow site init

# Initialize with Docusaurus
docflow site init --generator docusaurus

# Force reinitialize
docflow site init --force
```

### Build the Site

```bash
# Build static files
docflow site build

# Build with custom output directory
docflow site build --output dist

# Build with custom base URL
docflow site build --base /my-project/

# Clean and build
docflow site build --clean
```

### Serve Locally

```bash
# Start development server
docflow site serve

# Custom port
docflow site serve --port 3000

# Custom host
docflow site serve --host 0.0.0.0

# Open browser automatically
docflow site serve --open
```

### Deploy to GitHub Pages

```bash
# Deploy to gh-pages branch
docflow site deploy

# Custom branch
docflow site deploy --branch docs

# Custom commit message
docflow site deploy --message "Update documentation"

# Dry run (simulate without pushing)
docflow site deploy --dry-run
```

## Variable Substitution

The following variables are automatically replaced during site initialization:

- `{{PROJECT_NAME}}` - From `docflow.config.json`
- `{{PROJECT_DESCRIPTION}}` - From `docflow.config.json`
- `{{GITHUB_OWNER}}` - From `docflow.config.json`
- `{{GITHUB_REPO}}` - From `docflow.config.json`
- `{{PRIMARY_COLOR}}` - From `docflow.config.json` branding
- `{{SECONDARY_COLOR}}` - From `docflow.config.json` branding
- `{{ACCENT_COLOR}}` - From `docflow.config.json` branding
- `{{BACKGROUND_COLOR}}` - From `docflow.config.json` branding
- `{{SUCCESS_COLOR}}` - From `docflow.config.json` branding
- `{{WARNING_COLOR}}` - From `docflow.config.json` branding
- `{{ERROR_COLOR}}` - From `docflow.config.json` branding

## Features

### Auto-Generated Navigation

DocFlow automatically scans your `docs/` directory and generates:

- Navigation bar links
- Sidebar structure
- Breadcrumbs

Navigation is stored in `.vitepress/navigation.json` (VitePress) or `sidebars.js` (Docusaurus).

### Search Functionality

- **VitePress**: Built-in local search (no configuration required)
- **Docusaurus**: Supports Algolia search (requires configuration)

### Dark Mode

Both generators support dark mode out of the box with DocFlow branding.

### GitHub Integration

- Edit links to GitHub repository
- Social links in navigation
- Last updated timestamps from git

## GitHub Pages Deployment

DocFlow includes a GitHub Actions workflow (`.github/workflows/docflow-pages.yml`) that:

1. Automatically detects your site generator
2. Builds the site on push to main
3. Deploys to GitHub Pages
4. Supports manual triggers

### Setup GitHub Pages

1. Go to repository Settings > Pages
2. Set Source to "GitHub Actions"
3. Push changes to main branch
4. Site will be available at `https://YOUR_OWNER.github.io/YOUR_REPO/`

## File Structure

After initialization:

### VitePress

```
.vitepress/
├── config.js           # VitePress configuration
├── navigation.json     # Auto-generated navigation
└── theme/
    ├── index.js        # Theme entry point
    └── custom.css      # DocFlow branded styles
docs/
├── index.md            # Homepage
└── ...                 # Your documentation
```

### Docusaurus

```
docusaurus.config.js    # Docusaurus configuration
sidebars.js             # Auto-generated sidebar
src/
└── css/
    └── custom.css      # DocFlow branded styles
docs/
└── ...                 # Your documentation
```

## Customization

### Colours

Edit `docflow.config.json` branding section:

```json
{
  "branding": {
    "primary": "#072151",
    "secondary": "#2978c7",
    "accent": "#14b8a6",
    "background": "#ccd5e7",
    "success": "#10B981",
    "warning": "#F59E0B",
    "error": "#EF4444"
  }
}
```

Then reinitialize: `docflow site init --force`

### Navigation

Edit `.vitepress/navigation.json` or `sidebars.js` to customize navigation structure.

### Theme

Modify `.vitepress/theme/custom.css` or `src/css/custom.css` to add custom styles.

## npm Scripts

After initialization, use these shortcuts:

```bash
npm run site:dev      # Start dev server
npm run site:build    # Build site
npm run site:preview  # Preview built site
```

## Dependencies

### VitePress

```json
{
  "peerDependencies": {
    "vitepress": "^1.0.0"
  }
}
```

Install with: `npm install -D vitepress`

### Docusaurus

```json
{
  "dependencies": {
    "@docusaurus/core": "^3.0.0",
    "@docusaurus/preset-classic": "^3.0.0"
  }
}
```

Install with: `npm install @docusaurus/core @docusaurus/preset-classic`

## Troubleshooting

### Site not building

- Ensure you've installed the site generator: `npm install -D vitepress` or `npm install @docusaurus/core`
- Check for syntax errors in configuration files
- Run `docflow validate` to check DocFlow configuration

### Navigation not updating

- Delete `.vitepress/navigation.json` or `sidebars.js`
- Run `docflow site init --force` to regenerate

### Styles not applying

- Ensure `docflow.config.json` has valid colour values
- Clear browser cache
- Rebuild the site: `docflow site build --clean`

### GitHub Pages not deploying

- Verify GitHub Actions workflow is enabled
- Check repository Settings > Pages is set to "GitHub Actions"
- Review workflow logs in Actions tab

## Resources

- [VitePress Documentation](https://vitepress.dev/)
- [Docusaurus Documentation](https://docusaurus.io/)
- [DocFlow Documentation](https://github.com/TomsTech/docflow-template)

## Support

For issues or questions:

- GitHub Issues: https://github.com/TomsTech/docflow-template/issues
- Documentation: https://github.com/TomsTech/docflow-template#readme
