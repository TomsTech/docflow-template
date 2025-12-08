# Master Standard Document

> Single Source of Truth for Project Standards

**Version**: 1.0.0
**Last Updated**: {{DATE}}
**Owner**: {{OWNER}}

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Naming Conventions](#naming-conventions)
3. [Folder Structure](#folder-structure)
4. [Code Standards](#code-standards)
5. [Documentation Standards](#documentation-standards)
6. [Branding & Colours](#branding--colours)
7. [Version Control](#version-control)
8. [CI/CD Standards](#cicd-standards)
9. [Security Standards](#security-standards)
10. [Testing Standards](#testing-standards)

---

## Executive Summary

This document defines the unified standards for {{PROJECT_NAME}}. All team members and contributors must adhere to these standards to ensure consistency, maintainability, and quality across the codebase.

### Principles

1. **Consistency**: Same patterns everywhere
2. **Clarity**: Self-documenting code and structure
3. **Security**: Security-first approach
4. **Automation**: Automate everything possible
5. **Documentation**: If it's not documented, it doesn't exist

---

## Naming Conventions

### Files

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `UserProfile.tsx`, `DataTable.vue` |
| Utilities | kebab-case | `format-date.ts`, `api-client.js` |
| Styles | kebab-case | `main-layout.css`, `button-styles.scss` |
| Tests | `*.test.*` or `*.spec.*` | `UserProfile.test.tsx`, `api.spec.js` |
| Config | kebab-case | `eslint-config.json`, `webpack.config.js` |
| Scripts | PascalCase | `Deploy-Application.ps1`, `Build-Project.ps1` |

### Folders

| Type | Convention | Example |
|------|------------|---------|
| Source folders | kebab-case | `user-management/`, `api-client/` |
| Component folders | PascalCase | `UserProfile/`, `DataTable/` |
| Test folders | lowercase | `tests/`, `__tests__/` |

### Variables & Functions

| Language | Variables | Functions | Constants | Classes |
|----------|-----------|-----------|-----------|---------|
| JavaScript/TypeScript | camelCase | camelCase | SCREAMING_SNAKE | PascalCase |
| Python | snake_case | snake_case | SCREAMING_SNAKE | PascalCase |
| PowerShell | PascalCase | Verb-Noun | $SCREAMING_SNAKE | PascalCase |
| SQL | snake_case | snake_case | - | - |

### Git Branches

| Type | Format | Example |
|------|--------|---------|
| Feature | `feature/{ticket}-{description}` | `feature/123-add-user-auth` |
| Bugfix | `fix/{ticket}-{description}` | `fix/456-login-redirect` |
| Hotfix | `hotfix/{description}` | `hotfix/security-patch` |
| Release | `release/v{version}` | `release/v1.2.0` |

---

## Folder Structure

```
.
├── .github/                    # GitHub configuration
│   ├── workflows/              # CI/CD pipelines
│   │   ├── docflow-*.yml       # DocFlow workflows
│   │   └── custom-*.yml        # Project-specific workflows
│   ├── ISSUE_TEMPLATE/         # Issue templates
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── baselines/              # Regression baselines
│
├── .design/                    # Design specifications
│   ├── MASTER_STANDARD.md      # This document
│   ├── templates/              # Documentation templates
│   └── assets/                 # Design assets
│
├── docs/                       # Documentation
│   ├── generated/              # Auto-generated docs
│   ├── architecture/           # Architecture docs
│   ├── api/                    # API documentation
│   └── guides/                 # User guides
│
├── src/                        # Source code
│   ├── components/             # UI components
│   ├── services/               # Business logic
│   ├── utils/                  # Utilities
│   └── types/                  # Type definitions
│
├── tests/                      # Test files
│   ├── unit/                   # Unit tests
│   ├── integration/            # Integration tests
│   └── e2e/                    # End-to-end tests
│
├── scripts/                    # Automation scripts
│   ├── build/                  # Build scripts
│   ├── deploy/                 # Deployment scripts
│   └── utils/                  # Utility scripts
│
├── config/                     # Configuration files
│
├── CLAUDE.md                   # AI assistant context
├── README.md                   # Project readme
├── CHANGELOG.md                # Release history
├── CONTRIBUTING.md             # Contribution guide
├── LICENSE                     # License file
└── docflow.config.json         # DocFlow configuration
```

---

## Code Standards

### General Principles

1. **DRY** (Don't Repeat Yourself)
2. **KISS** (Keep It Simple, Stupid)
3. **YAGNI** (You Aren't Gonna Need It)
4. **Single Responsibility Principle**

### JavaScript/TypeScript

```typescript
// Use const/let, never var
const MAX_RETRIES = 3;
let currentAttempt = 0;

// Use arrow functions for callbacks
const items = data.map((item) => item.name);

// Use async/await over promises
async function fetchData(): Promise<Data> {
  const response = await fetch(url);
  return response.json();
}

// Export types explicitly
export interface UserProps {
  name: string;
  email: string;
}
```

### Python

```python
# Use type hints
def process_data(items: list[str]) -> dict[str, int]:
    """Process items and return counts."""
    return {item: len(item) for item in items}

# Use dataclasses for data structures
@dataclass
class User:
    name: str
    email: str
    active: bool = True

# Use context managers
with open("file.txt") as f:
    content = f.read()
```

### PowerShell

```powershell
# Use approved verbs
function Get-UserData {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$UserId
    )

    # Use splatting for readability
    $params = @{
        Uri = "https://api.example.com/users/$UserId"
        Method = 'Get'
        Headers = $headers
    }

    Invoke-RestMethod @params
}
```

---

## Documentation Standards

### README Structure

1. **Title** - Project name with badges
2. **Overview** - Brief description with diagram
3. **Features** - Key features list
4. **Quick Start** - Installation and basic usage
5. **Configuration** - Configuration options
6. **API Reference** - API documentation (if applicable)
7. **Contributing** - How to contribute
8. **License** - License information

### Code Comments

```typescript
/**
 * Calculates the total price including tax.
 *
 * @param basePrice - The base price before tax
 * @param taxRate - The tax rate as a decimal (e.g., 0.1 for 10%)
 * @returns The total price including tax
 *
 * @example
 * const total = calculateTotal(100, 0.1); // Returns 110
 */
function calculateTotal(basePrice: number, taxRate: number): number {
  return basePrice * (1 + taxRate);
}
```

### Mermaid Diagrams

Use Mermaid for all diagrams:

```markdown
## Architecture

​```mermaid
graph TB
    A[User] --> B[Frontend]
    B --> C[API Gateway]
    C --> D[Backend Service]
    D --> E[(Database)]
​```
```

---

## Branding & Colours

### Colour Palette

| Name | Hex | Usage |
|------|-----|-------|
| Primary | `#072151` | Headers, primary actions |
| Secondary | `#2978c7` | Links, secondary actions |
| Accent | `#14b8a6` | Success states, highlights |
| Background | `#ccd5e7` | Light backgrounds |
| Success | `#10B981` | Success messages |
| Warning | `#F59E0B` | Warning messages |
| Error | `#EF4444` | Error messages |
| Gray | `#6B7280` | Neutral, disabled |

### Status Colours

| Status | Colour | Hex |
|--------|--------|-----|
| Draft | Gray | `#6B7280` |
| Pending | Amber | `#F59E0B` |
| Active | Green | `#10B981` |
| Completed | Blue | `#2978c7` |
| Error | Red | `#EF4444` |

---

## Version Control

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance
- `perf`: Performance
- `ci`: CI/CD changes

**Examples**:
```
feat(auth): add OAuth2 support

fix(api): resolve timeout issue on large requests

docs: update API reference for v2 endpoints
```

### Pull Requests

1. Use descriptive titles following commit conventions
2. Include description of changes
3. Reference related issues
4. Ensure all checks pass
5. Request review from appropriate team members

---

## CI/CD Standards

### Pipeline Stages

1. **Quality Gates** (blocking)
   - Linting
   - Type checking
   - Unit tests

2. **Security** (non-blocking, creates issues)
   - CodeQL analysis
   - Dependency scanning
   - Secret detection

3. **Build**
   - Compile/transpile
   - Generate assets

4. **Test**
   - Integration tests
   - E2E tests (optional)

5. **Deploy**
   - Staging (automatic)
   - Production (manual approval)

### Workflow Naming

```
docflow-{purpose}.yml
custom-{purpose}.yml
```

Examples:
- `docflow-quality-gates.yml`
- `docflow-security-scan.yml`
- `custom-deploy-azure.yml`

---

## Security Standards

### Secrets Management

- **NEVER** commit secrets to repository
- Use environment variables or secret management
- Rotate secrets regularly
- Use least-privilege access

### Code Security

- Validate all user inputs
- Sanitise outputs
- Use parameterised queries
- Implement proper authentication/authorisation
- Keep dependencies updated

### Security Scanning

| Scan Type | Frequency | Tool |
|-----------|-----------|------|
| Static Analysis | Every PR | CodeQL |
| Dependency Scan | Every PR | npm audit, Snyk |
| Secret Detection | Every PR | Custom patterns |
| API Security | Weekly | OWASP ZAP |
| Full Security | Monthly | OWASP ZAP Full |

---

## Testing Standards

### Test Coverage

| Type | Minimum | Target |
|------|---------|--------|
| Unit Tests | 70% | 85% |
| Integration | 50% | 70% |
| E2E | Critical paths | All user journeys |

### Test Naming

```typescript
describe('UserService', () => {
  describe('getUser', () => {
    it('should return user when valid ID provided', () => {});
    it('should throw error when user not found', () => {});
    it('should handle network errors gracefully', () => {});
  });
});
```

### Test Organisation

```
tests/
├── unit/
│   └── services/
│       └── user-service.test.ts
├── integration/
│   └── api/
│       └── user-api.test.ts
└── e2e/
    └── flows/
        └── user-registration.test.ts
```

---

## Appendix

### Quick Reference Card

| Item | Standard |
|------|----------|
| Language | Australian English |
| Line length | 100 characters |
| Indentation | 2 spaces (JS/TS), 4 spaces (Python, PS) |
| Quotes | Single (JS/TS), Double (Python) |
| Semicolons | No (JS/TS) |
| Trailing commas | Yes |
| Branch protection | main, develop |
| Required reviews | 1 minimum |

### Useful Commands

```bash
# Lint all files
npm run lint

# Run all tests
npm test

# Generate documentation
gh workflow run docflow-generate-docs.yml

# Create release
gh workflow run docflow-release.yml -f version=1.0.0
```

---

*This document is the single source of truth. Any deviations must be approved and documented.*
