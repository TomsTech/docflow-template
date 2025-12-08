# Contributing Guide

Thank you for your interest in contributing to this project! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## Getting Started

### Prerequisites

- Git installed
- GitHub account
- Development environment set up for the project's language(s)

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/REPO_NAME.git
   cd REPO_NAME
   ```
3. Add upstream remote:
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/REPO_NAME.git
   ```

### Install Dependencies

```bash
# Node.js projects
npm install

# Python projects
pip install -r requirements.txt

# PowerShell projects
# No installation needed
```

## Development Workflow

### 1. Create a Branch

```bash
# Sync with upstream
git fetch upstream
git checkout main
git merge upstream/main

# Create feature branch
git checkout -b feature/your-feature-name
```

### 2. Make Changes

- Follow the coding standards in `.design/MASTER_STANDARD.md`
- Write tests for new functionality
- Update documentation as needed

### 3. Commit Changes

Use [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git add .
git commit -m "feat: add new feature"
```

**Commit Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, semicolons, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### 4. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## Pull Request Guidelines

### PR Title

Follow the same conventions as commits:
```
feat: add user authentication
fix: resolve login redirect issue
docs: update API reference
```

### PR Description

Include:
- Summary of changes
- Related issue numbers (e.g., "Fixes #123")
- Testing performed
- Screenshots (for UI changes)

### PR Checklist

Before submitting:
- [ ] Code follows project style guidelines
- [ ] All tests pass locally
- [ ] Documentation updated (if applicable)
- [ ] CHANGELOG.md updated (for significant changes)
- [ ] No new linting warnings/errors

## Code Review Process

1. Automated checks must pass (linting, tests, security)
2. At least one approval required
3. Address all review comments
4. Squash commits if requested

## Testing

### Running Tests

```bash
# Node.js
npm test

# Python
pytest

# PowerShell
Invoke-Pester
```

### Writing Tests

- Test files should be named `*.test.*` or `*.spec.*`
- Aim for meaningful coverage, not 100%
- Test edge cases and error conditions

## Documentation

### Code Documentation

- Document all public functions/classes
- Use JSDoc, docstrings, or comment-based help as appropriate
- Include examples where helpful

### Project Documentation

- Update README.md for user-facing changes
- Update API documentation for API changes
- Add to docs/ folder for detailed guides

## Reporting Issues

### Bug Reports

Include:
1. Description of the bug
2. Steps to reproduce
3. Expected behaviour
4. Actual behaviour
5. Environment details (OS, version, etc.)
6. Screenshots/logs if applicable

### Feature Requests

Include:
1. Description of the feature
2. Use case / problem it solves
3. Proposed implementation (optional)
4. Alternatives considered

## Questions?

- Check existing issues and discussions
- Review documentation
- Open a new issue with the `question` label

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing! Your efforts help make this project better for everyone.
