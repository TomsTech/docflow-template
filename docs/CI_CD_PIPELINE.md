# CI/CD Pipeline Documentation

> Best practices GitHub Actions workflow template with parallel execution pattern

## Overview

This template implements a **parallel fast checks + long tests** pattern that provides:

1. **Fast feedback** - Developers get lint/format errors within ~90 seconds
2. **Efficient execution** - Long-running jobs don't block quick wins
3. **Reduced total time** - Parallel execution vs sequential
4. **Clear gate** - Single pass/fail status for branch protection

## Architecture

```
                         ┌──────────────────┐
                         │     TRIGGER      │
                         │  push/PR/manual  │
                         └────────┬─────────┘
                                  │
               ┌──────────────────┴──────────────────┐
               │                                     │
               ▼                                     ▼
     ┌─────────────────────┐             ┌─────────────────────┐
     │    FAST CHECKS      │             │    LONG TESTS       │
     │    (< 2 minutes)    │             │    (2-10 minutes)   │
     ├─────────────────────┤             ├─────────────────────┤
     │ • Mega-Linter       │             │ • Unit Tests        │
     │ • TruffleHog        │             │ • Trivy SCA         │
     │ • Format Validation │             │ • Semgrep SAST      │
     └──────────┬──────────┘             └──────────┬──────────┘
               │                                     │
               └──────────────────┬──────────────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │  QUALITY GATE   │
                         │  (Aggregation)  │
                         └────────┬────────┘
                                  │
                    (only if gate passes)
                                  │
                                  ▼
                         ┌─────────────────┐
                         │  BUILD/DEPLOY   │
                         │   (optional)    │
                         └─────────────────┘
```

## Tooling Selection

| Category | Tool | Why This Tool? |
|----------|------|----------------|
| **Linting** | Mega-Linter | Aggregates 50+ linters, better customisation than Super-Linter |
| **Secret Scanning** | TruffleHog | Scans git history (not just current code), verifies secrets |
| **SCA (Dependencies)** | Trivy | Swiss army knife: OS packages, libraries, containers |
| **SAST (Code)** | Semgrep | Fast, customisable, excellent community rules |
| **Unit Testing** | Native | Jest/Pytest/Go test with coverage reporting |

### Why Not...?

| Alternative | Reason Not Used |
|-------------|-----------------|
| Super-Linter | Less customisable, slower, harder to configure |
| GitHub Secret Scanning | Only scans current commit, not git history |
| Dependabot alone | Limited to PRs, doesn't scan containers/OS packages |
| CodeQL | Slower, more complex setup, overkill for many projects |

## Workflow Files

```
.github/workflows/
├── docflow-ci.yml            # Main CI pipeline (use this)
├── reusable-lint.yml         # Reusable: Mega-Linter
├── reusable-security.yml     # Reusable: TruffleHog + Trivy + Semgrep
├── reusable-test.yml         # Reusable: Multi-language testing
├── docflow-security-scan.yml # Extended security (OWASP ZAP, etc.)
├── docflow-release.yml       # Release management
└── docflow-generate-docs.yml # Documentation generation
```

## Configuration Files

| File | Purpose |
|------|---------|
| `.mega-linter.yml` | Mega-Linter configuration |
| `.semgrepignore` | Files/patterns Semgrep should skip |
| `semgrep.yml` | Custom Semgrep rules |

## Quick Start

### 1. Copy the Workflow

Copy `.github/workflows/docflow-ci.yml` to your repository.

### 2. Enable GitHub Security Features

Go to **Settings > Security > Code security and analysis**:
- Enable **Dependency graph**
- Enable **Dependabot alerts**
- Enable **Dependabot security updates**

### 3. Set Branch Protection

Go to **Settings > Branches > Branch protection rules**:
- Require status check: `Quality Gate`
- Require branches to be up to date

### 4. (Optional) Configure Tools

Copy and customise:
- `.mega-linter.yml` for linting preferences
- `.semgrepignore` for files to skip in SAST
- `semgrep.yml` for custom security rules

## Detailed Configuration

### Mega-Linter

The `.mega-linter.yml` file controls which linters run and how.

**Enable only specific linters:**
```yaml
ENABLE_LINTERS:
  - JAVASCRIPT_ES
  - TYPESCRIPT_ES
  - PYTHON_PYLINT
  - MARKDOWN_MARKDOWNLINT
```

**Disable noisy linters:**
```yaml
DISABLE_LINTERS:
  - SPELL_CSPELL
  - COPYPASTE_JSCPD
```

**Enable auto-fix:**
```yaml
APPLY_FIXES: true
APPLY_FIXES_EVENT: pull_request
```

### TruffleHog

TruffleHog scans git history for verified secrets. It runs with:
- `--only-verified`: Only report secrets that are confirmed valid
- Full git history scan (not just the current commit)

**Customisation:** Create a `.trufflehog.yaml` file:
```yaml
detectors:
  - name: AWS
    verify: true
  - name: GitHub
    verify: true
exclude:
  paths:
    - "**/*_test.go"
    - "**/testdata/**"
```

### Trivy

Trivy scans for vulnerabilities in:
- OS packages (if Dockerfile present)
- Language dependencies (package.json, requirements.txt, go.mod)
- Container images
- IaC misconfigurations

**Severity threshold:** The workflow fails on CRITICAL and HIGH by default.

To change, modify `.github/workflows/docflow-ci.yml`:
```yaml
severity: 'CRITICAL'  # Only fail on critical
```

### Semgrep

Semgrep runs SAST with community rules plus custom rules.

**Default rule packs:**
- `auto` - Language-appropriate rules
- `p/security-audit` - Security-focused rules
- `p/secrets` - Secret detection

**Custom rules:** Add to `semgrep.yml`:
```yaml
rules:
  - id: my-custom-rule
    patterns:
      - pattern: dangerous_function($X)
    message: "Don't use dangerous_function"
    severity: ERROR
    languages: [python]
```

## Understanding the Quality Gate

The Quality Gate job aggregates all check results into a single pass/fail status.

### Required Checks

| Check | Required | Reason |
|-------|----------|--------|
| Linting | Yes | Code quality baseline |
| Secret Scanning | Yes | Security critical |
| Format Validation | No | Nice to have |
| Unit Tests | No | May not exist yet |
| Trivy SCA | No | Informational |
| Semgrep SAST | No | Informational |

### Modifying Requirements

Edit the quality gate logic in `docflow-ci.yml`:
```yaml
# Make all security scans required
if [[ "$job" == *"Secret"* ]] || [[ "$job" == *"Trivy"* ]] || [[ "$job" == *"Semgrep"* ]]; then
  required="Yes"
```

## Workflow Triggers

| Trigger | When | Full Validation? |
|---------|------|------------------|
| `push` to main/develop | On merge | Yes (all files) |
| `pull_request` | PR opened/updated | Changed files only |
| `workflow_dispatch` | Manual run | Configurable |

### Manual Trigger Options

```yaml
inputs:
  skip_tests: false      # Skip test execution
  skip_security: false   # Skip security scans
  debug_mode: false      # Enable verbose output
```

## Concurrency Control

The workflow uses concurrency groups to:
- Cancel in-progress runs when a new commit is pushed
- Prevent multiple runs on the same branch

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

## Artefact Retention

| Artefact | Retention | Purpose |
|----------|-----------|---------|
| Mega-Linter reports | 30 days | Debugging lint failures |
| Coverage reports | 30 days | Coverage tracking |
| Security reports | 30 days | Audit trail |
| Build outputs | 30 days | Deployment |

## Extending the Pipeline

### Adding a New Language

1. Add to the test matrix in `docflow-ci.yml`:
```yaml
matrix:
  include:
    - lang: rust
      check: Cargo.toml
```

2. Add the setup and test steps:
```yaml
- name: Setup Rust
  if: steps.check.outputs.applicable == 'true' && matrix.lang == 'rust'
  uses: actions-rs/toolchain@v1
  with:
    toolchain: stable

- name: Test (Rust)
  if: steps.check.outputs.applicable == 'true' && matrix.lang == 'rust'
  run: cargo test --all-features
```

### Adding a New Check

1. Add a new job:
```yaml
my-check:
  name: "My Custom Check"
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - run: ./my-check-script.sh
```

2. Add to the quality gate `needs`:
```yaml
quality-gate:
  needs: [lint, secrets, format, test, trivy, semgrep, my-check]
```

3. Add to the gate evaluation:
```yaml
["My Custom Check"]="${{ needs.my-check.result }}"
```

### Using Reusable Workflows

For modularity, call the reusable workflows:

```yaml
jobs:
  lint:
    uses: ./.github/workflows/reusable-lint.yml
    with:
      validate-all: false

  security:
    uses: ./.github/workflows/reusable-security.yml
    with:
      run-secrets: true
      run-sca: true
      run-sast: true

  test:
    uses: ./.github/workflows/reusable-test.yml
    with:
      coverage-threshold: 70
```

## Troubleshooting

### Mega-Linter is too slow

1. Enable parallel execution:
   ```yaml
   PARALLEL: true
   ```

2. Reduce linters to only what you need:
   ```yaml
   ENABLE_LINTERS:
     - JAVASCRIPT_ES
     - PYTHON_PYLINT
   ```

3. Exclude large directories:
   ```yaml
   EXCLUDED_DIRECTORIES:
     - node_modules
     - vendor
     - .git
   ```

### TruffleHog false positives

Add to `.trufflehog.yaml`:
```yaml
exclude:
  paths:
    - "**/test/**"
    - "**/*.example"
```

Or add inline ignores:
```javascript
const api_key = "test-key-not-real"; // trufflehog:ignore
```

### Trivy reporting too many issues

1. Adjust severity threshold
2. Create `.trivyignore`:
   ```
   CVE-2023-12345
   CVE-2023-67890
   ```

### Semgrep rules too noisy

1. Add to `.semgrepignore`
2. Disable specific rules:
   ```yaml
   # In workflow
   semgrep scan --exclude-rule=my-noisy-rule
   ```

## Best Practices

1. **Start permissive, tighten later** - Begin with warnings, promote to errors once clean
2. **Use the quality gate** - Don't require individual checks, only the gate
3. **Keep fast checks fast** - Move slow checks to the long tests track
4. **Review security findings** - Don't just suppress; understand and fix
5. **Iterate on rules** - Add custom rules as you find patterns

## Further Reading

- [Mega-Linter Documentation](https://megalinter.io/)
- [TruffleHog Documentation](https://trufflesecurity.com/trufflehog)
- [Trivy Documentation](https://aquasecurity.github.io/trivy/)
- [Semgrep Documentation](https://semgrep.dev/docs/)
- [GitHub Actions Best Practices](https://docs.github.com/en/actions/learn-github-actions/best-practices-for-github-actions)
