<div align="center">

# 🩺 RepoDoctor

**Fast, zero-config Repository Health, Security & CI Linter for modern open-source projects.**

[![CI](https://github.com/knmt1219/repodoctor/actions/workflows/ci.yml/badge.svg)](https://github.com/knmt1219/repodoctor/actions/workflows/ci.yml)
[![Health Score](https://img.shields.io/badge/Health%20Score-100%2F100%20(A%2B)-brightgreen.svg)](https://github.com/knmt1219/repodoctor)
[![Rules](https://img.shields.io/badge/Rules-31%20built--in-blue.svg)](https://github.com/knmt1219/repodoctor#rule-catalog)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

<p align="center">
  <a href="#quick-start">Quick Start</a> •
  <a href="#why-maintainers-use-repodoctor">Why RepoDoctor</a> •
  <a href="#rule-catalog">Rule Catalog (31 Rules)</a> •
  <a href="#output-formats--ci-integration">CI Integration</a> •
  <a href="#automated-remediation-fixers">Auto-Fixers</a> •
  <a href="#roadmap">Roadmap</a>
</p>

</div>

---

## The Maintainer Problem

As open-source repositories scale, they inevitably accumulate **hygiene decay, CI vulnerabilities, and governance debt**:

- **CI Supply Chain Vulnerabilities**: GitHub Actions use mutable floating tags (`@v4`) instead of immutable 40-character commit SHAs, exposing builds to tag hijacking.
- **Runaway CI Billing**: Workflows lack `timeout-minutes` (defaulting to 6 hours) or concurrent cancellation on PRs, burning free CI quota.
- **PR Review & Triage Overload**: Missing `CODEOWNERS`, issue templates, PR checklists, and automated dependency configs (`dependabot.yml` / Renovate) force maintainers to waste hours on manual triage.
- **Accidental Secret Leaks**: `.gitignore` files miss `.env`, `*.key`, `*.pem`, or `credentials.json` patterns, risking credential leaks.
- **Broken Packaging & Lockfiles**: Missing lockfiles or conflicting lockfiles (`package-lock.json` + `yarn.lock`) break downstream builds unpredictably.

Existing linters are fragmented: ESLint only looks at JS/TS ASTs, Flake8 only checks Python, and heavy security scanners require SaaS accounts, cloud tokens, or cumbersome setup.

**RepoDoctor** provides a single, zero-config CLI that diagnoses **31 cross-ecosystem repository health rules in under 200ms**, calculates a deterministic **0-100 Health Score (Grades A+ to F)**, auto-fixes common violations, and exports standard **SARIF 2.1.0** reports for GitHub Code Scanning.

---

## Why Maintainers Use RepoDoctor

1. **⚡ Zero-Config & Sub-Second**: Runs instantly with `npx @hominhtuan/repodoctor check` without writing a single line of configuration. Analyzes entire repositories in <200ms.
2. **🔒 CI & Supply-Chain Hardened**: Enforces immutable action pinning, least-privilege `permissions:`, safe `pull_request_target` usage, and secret pattern ignores out of the box.
3. **🤝 Reduces Review & Maintenance Load**: Automatically validates `CODEOWNERS`, PR templates, automated dependency updates (`dependabot.yml`), and standard OSS files to streamline incoming contributions.
4. **🛠️ Safe, Non-Destructive Remediation (`repodoctor fix`)**: Idempotently generates missing governance files and security patterns with `--dry-run` preview support.
5. **📊 GitHub Native Integration**: First-class support for SARIF 2.1.0 (GitHub Security tab), GitHub Workflow annotations (`::error::`), step summaries, and PR comments.

---

## What RepoDoctor is NOT

To maintain transparency and honesty about our scope:

- ❌ **Not a Deep Semantic Application SAST**: RepoDoctor does not analyze intra-procedural data flow or taint analysis in your application source code. It does not replace tools like **Semgrep**, **CodeQL**, or **SonarQube**.
- ❌ **Not a Dynamic Dependency Vulnerability Database**: While RepoDoctor checks for committed lockfiles, unpinned wildcards, and Dependabot/Renovate presence, it does not replace `npm audit` or Snyk CVE databases.
- ✅ **What it IS**: A specialized, blazingly fast **Repository Infrastructure, CI/CD Security, OSS Governance, and Configuration Linter**.

---

## Project Status & Adoption

> [!NOTE]
> RepoDoctor is actively developed (v0.1.x) with strict semantic versioning. We dogfood RepoDoctor on its own repository on every single commit across Linux, Windows, and macOS with a **100/100 Grade A+ score**. We welcome community issues, rules proposals, and PRs!

---

## Quick Start (3 Ways to Use)

### 1. Instant CLI (Zero Installation)

```bash
# Run repository health diagnostics
npx @hominhtuan/repodoctor check

# Preview auto-remediation fixes safely
npx @hominhtuan/repodoctor fix --dry-run

# Automatically scaffold missing repository files
npx @hominhtuan/repodoctor fix
```

### 2. GitHub Actions Workflow

Add `.github/workflows/repodoctor.yml` to run automated diagnostics on every push and pull request:

```yaml
name: RepoDoctor Health & Security Scan

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  contents: read
  security-events: write

jobs:
  repodoctor:
    name: RepoDoctor Diagnostics
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2

      - name: Setup Node.js
        uses: actions/setup-node@39370e3970a6d050c480ffad4ff0ed4d3fdee5af # v4.1.0
        with:
          node-version: 20

      - name: Run RepoDoctor & Export SARIF
        run: npx @hominhtuan/repodoctor check . --format sarif --output repodoctor-results.sarif
        continue-on-error: true

      - name: Upload SARIF to GitHub Code Scanning
        uses: github/codeql-action/upload-sarif@6bb034f26f1da0b37c6335a3983f3333bed7a2ff # v3.28.11
        with:
          sarif_file: repodoctor-results.sarif
```

### 3. Pre-Commit Hook

Add RepoDoctor to your `.pre-commit-config.yaml` to ensure local commits stay clean:

```yaml
repos:
  - repo: https://github.com/knmt1219/repodoctor
    rev: v0.1.4
    hooks:
      - id: repodoctor-check
```

---

## Real Terminal Output

```text
RepoDoctor v0.1.4 — Repository Health & Security Diagnostics
──────────────────────────────────────────────────────────────────────

  WARN  [sec-002] Workflow ".github/workflows/ci.yml" does not declare top-level or job-level 'permissions:' block at .github/workflows/ci.yml:1:1
   └─ Fix: Add `permissions: contents: read` or specific granular permissions at top of workflow

  WARN  [git-001] Missing .gitattributes file for cross-platform line ending normalization
   └─ Fix: Create a `.gitattributes` file containing `* text=auto eol=lf`.

  WARN  [oss-009] Missing CODEOWNERS file for automated PR reviewer assignment and maintainer routing
   └─ Fix: Create a `.github/CODEOWNERS` file (e.g. `* @username`) to automatically request reviews.

──────────────────────────────────────────────────────────────────────
 Health Score: 91/100 (Grade: A)
 Category Breakdown: security: 90%  |  oss: 90%  |  ci: 100%  |  package: 100%  |  git: 90%  |  docker: 100%

 Summary: 3 warnings, 2 auto-fixable (31 rules evaluated in 112ms)
```

---

## CLI Commands & Flags

```bash
repodoctor [command] [options] [target-directory]
```

### Commands

| Command | Description |
| :--- | :--- |
| `repodoctor check [target]` | **(Default)** Run health, security, and CI diagnostics |
| `repodoctor fix [target]` | Automatically apply remediation fixes to the repository |
| `repodoctor init [target]` | Scaffold a standard `.repodoctor.yml` configuration file |
| `repodoctor rules [category]` | List all built-in rules, severities, and descriptions |
| `repodoctor explain <rule-id>` | Show in-depth rationale, compliant vs non-compliant examples, and remediation steps |

### Flags for `check`

| Option | Alias | Description | Default |
| :--- | :---: | :--- | :--- |
| `-f, --format <fmt>` | `-f` | Output format: `terminal`, `json`, `sarif`, `markdown`, `markdown-pr`, `github` | `terminal` |
| `-o, --output <file>` | `-o` | Save the generated report to a file | `stdout` |
| `-c, --config <path>` | `-c` | Custom path to configuration file | `.repodoctor.yml` |
| `--summary` | | Render concise Markdown PR summary table (ideal for PR comments) | `false` |
| `--score-threshold <n>`| | Minimum acceptable health score (fails with exit code `1` if lower) | `75` |
| `--max-warnings <n>` | | Maximum allowed warnings before exiting with code `1` | `-1` (unlimited) |
| `--strict` | | Treat warnings as errors (fails if any warnings exist) | `false` |
| `--fix` | | Automatically apply fixes before computing final score | `false` |

### Flags for `fix`

| Option | Description | Default |
| :--- | :--- | :--- |
| `--dry-run` | Preview fixes that would be applied without modifying any files on disk | `false` |
| `--strict` | Treat remaining unfixable warnings as errors | `false` |
| `-c, --config <path>` | Path to custom configuration file | `.repodoctor.yml` |

---

## Rule Catalog (31 Built-in Production Rules)

RepoDoctor includes **31 rules** organized across 6 core domains:

| Rule ID | Category | Default | Fixable | Description |
| :--- | :--- | :---: | :---: | :--- |
| **`sec-001`** | Security | `error` | No | GitHub Actions must use immutable commit SHAs, not floating tags (`@v4`) |
| **`sec-002`** | Security | `warn` | No | Workflows must declare least-privilege `permissions:` and avoid `write-all` |
| **`sec-003`** | Security | `error` | **Yes** | `.gitignore` must ignore `.env`, `*.key`, `*.pem`, and credentials files |
| **`sec-004`** | Security | `error` | No | Prohibit dangerous `curl \| sh` or `wget \| bash` pipes in CI and package scripts |
| **`sec-005`** | Security | `error` | No | Detect hardcoded plaintext API keys/tokens with automatic secret masking |
| **`sec-006`** | Security | `warn` | No | Prevent unsafe `pull_request_target` checkouts of untrusted fork code |
| **`oss-001`** | OSS Standards | `error` | No | Repository must have a valid, OSI-compliant `LICENSE` file |
| **`oss-002`** | OSS Standards | `warn` | No | Repository must have a structured, non-empty `README.md` |
| **`oss-003`** | OSS Standards | `warn` | **Yes** | Repository must provide a `CONTRIBUTING.md` guide |
| **`oss-004`** | OSS Standards | `info` | **Yes** | Repository should provide a `CODE_OF_CONDUCT.md` |
| **`oss-005`** | OSS Standards | `warn` | **Yes** | Repository must have a `SECURITY.md` vulnerability reporting policy |
| **`oss-006`** | OSS Standards | `info` | **Yes** | Repository should provide GitHub Issue templates (`.github/ISSUE_TEMPLATE/`) |
| **`oss-007`** | OSS Standards | `info` | **Yes** | Repository should provide a PR template (`.github/pull_request_template.md`) |
| **`oss-008`** | OSS Standards | `warn` | No | `package.json` must include `description` and `repository` fields |
| **`oss-009`** | OSS Standards | `warn` | **Yes** | Repository should have a `CODEOWNERS` file for automated PR reviewer routing |
| **`ci-001`** | CI/CD | `warn` | No | All GitHub Actions jobs must specify explicit `timeout-minutes` |
| **`ci-002`** | CI/CD | `warn` | No | PR workflows must set `concurrency` with group and `cancel-in-progress: true` |
| **`ci-003`** | CI/CD | `warn` | No | Repository must have at least one active CI workflow in `.github/workflows/` |
| **`ci-004`** | CI/CD | `info` | No | Large matrix configurations should explicitly define `fail-fast` strategy |
| **`ci-005`** | CI/CD | `warn` | **Yes** | Configure automated dependency updates via Dependabot or Renovate |
| **`pkg-001`** | Package | `error` | No | Package manifests (`package.json`, `Cargo.toml`, etc.) must have committed lockfiles |
| **`pkg-002`** | Package | `error` | No | Repository must not commit conflicting lockfiles (e.g. `package-lock.json` + `yarn.lock`) |
| **`pkg-003`** | Package | `warn` | No | Prohibit unconstrained wildcard `*` or `latest` package dependencies |
| **`pkg-004`** | Package | `warn` | No | `package.json` must define required lifecycle scripts (e.g. `test`) |
| **`git-001`** | Git Hygiene | `warn` | **Yes** | Repository must have `.gitattributes` with `* text=auto eol=lf` |
| **`git-002`** | Git Hygiene | `error` | No | Detect unresolved Git merge conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`) |
| **`git-003`** | Git Hygiene | `warn` | No | Warn on large binary files (>1 MB) tracked without Git LFS |
| **`git-004`** | Git Hygiene | `error` | No | Detect accidental nested `.git` folders or unregistered submodules |
| **`git-005`** | Git Hygiene | `error` | No | Detect dangling or repository-escaping symbolic links |
| **`docker-001`** | Docker | `warn` | No | Dockerfiles must avoid floating `:latest` base image tags |
| **`docker-002`** | Docker | `warn` | **Yes** | Dockerfiles must have a corresponding `.dockerignore` file |

---

## Configuration (`.repodoctor.yml`)

RepoDoctor works with zero configuration by default. When customized rules or thresholds are needed, run `repodoctor init` to scaffold a `.repodoctor.yml` file:

```yaml
# Minimum acceptable health score (0 - 100)
scoreThreshold: 85

# Maximum allowed warnings before exiting with code 1 (-1 for unlimited)
maxWarnings: 0

# Category toggles
categories:
  security: true
  oss: true
  ci: true
  package: true
  git: true
  docker: true

# Rule severity overrides ('error', 'warn', 'info', 'off')
rules:
  sec-001: error  # Enforce commit SHA pinning as hard error
  ci-001: error   # Enforce CI job timeouts as hard error
  oss-004: off    # Disable Code of Conduct check

# Global analyzer options
options:
  checkTrackedOnly: false       # Scan only git-tracked files
  requiredScripts: ['test']      # Lifecycle scripts required by pkg-004
  maxBinarySizeKb: 1024          # Binary threshold in KB for git-003

# Ignore patterns
ignore:
  - '**/fixtures/**'
  - '**/vendor/**'
```

---

## Automated Remediation (Fixers)

Run `repodoctor fix` to safely generate compliant templates and fix configuration gaps:

```bash
# Preview what would be created without touching disk
npx @hominhtuan/repodoctor fix --dry-run

# Apply fixes
npx @hominhtuan/repodoctor fix
```

RepoDoctor fixers are **100% idempotent and non-destructive**:
- `git-001`: Generates `.gitattributes` with `* text=auto eol=lf`.
- `sec-003`: Appends `.env`, `.env.*`, `*.key`, `*.pem`, and `credentials.json` to `.gitignore`.
- `oss-003`: Scaffolds standard `CONTRIBUTING.md`.
- `oss-004`: Scaffolds `CODE_OF_CONDUCT.md`.
- `oss-005`: Scaffolds `SECURITY.md` coordinated disclosure policy.
- `oss-006`: Scaffolds `.github/ISSUE_TEMPLATE/bug_report.yml` and `feature_request.yml`.
- `oss-007`: Scaffolds `.github/pull_request_template.md`.
- `oss-009`: Scaffolds `.github/CODEOWNERS`.
- `ci-005`: Scaffolds `.github/dependabot.yml` for npm and GitHub Actions.
- `docker-002`: Scaffolds `.dockerignore`.

---

## Output Formats & CI Integration

### 1. Terminal Reporter (Default)
```bash
repodoctor check
```

### 2. SARIF v2.1.0 (for GitHub Security / Code Scanning Tab)
```bash
repodoctor check --format sarif --output results.sarif
```

### 3. Compact Markdown PR Summary
```bash
repodoctor check --summary
# or
repodoctor check --format markdown-pr
```

### 4. Standard Markdown Report (for `$GITHUB_STEP_SUMMARY`)
```bash
repodoctor check --format markdown >> $GITHUB_STEP_SUMMARY
```

### 5. GitHub Workflow Annotations
```bash
repodoctor check --format github
```

### 6. Machine-Readable JSON
```bash
repodoctor check --format json --output report.json
```

---

## Architecture

```
                          ┌──────────────────────────┐
                          │   CLI / Entry Point      │
                          │ (Commander, Flags, Args) │
                          └─────────────┬────────────┘
                                        │
                                        ▼
                          ┌──────────────────────────┐
                          │   Config Loader          │
                          │ (.repodoctor.yml, JSON)  │
                          └─────────────┬────────────┘
                                        │
                                        ▼
                          ┌──────────────────────────┐
                          │   RepoDoctor Engine      │
                          │  - Rule Context Cache    │
                          │  - Parallel Rule Runner  │
                          └─────────────┬────────────┘
                                        │
            ┌───────────────────────────┴───────────────────────────┐
            ▼                                                       ▼
  ┌───────────────────────┐                               ┌───────────────────────┐
  │     Rule Catalog      │                               │    Score Calculator   │
  │  - Security (sec-*)   │                               │  - 0-100 Score        │
  │  - OSS (oss-*)        │                               │  - Grade A+ to F      │
  │  - CI (ci-*)          │                               │  - Dynamic Scaling    │
  │  - Package (pkg-*)    │                               └───────────┬───────────┘
  │  - Git (git-*)        │                                           │
  │  - Docker (docker-*)  │                                           │
  └───────────┬───────────┘                                           │
              └─────────────────────────┬─────────────────────────────┘
                                        │
                                        ▼
                          ┌──────────────────────────┐
                          │   Reporters              │
                          │  - Terminal (ANSI)       │
                          │  - SARIF v2.1.0          │
                          │  - PR Markdown Summary   │
                          │  - JSON / GH Annotations │
                          └──────────────────────────┘
```

---

## Security Model

1. **Static Analysis Only**: RepoDoctor inspects files strictly as static text/AST data. It never imports, executes, or evaluates untrusted code.
2. **Local & Air-Gapped**: Runs 100% locally with zero outbound network requests.
3. **Strict Path Containment**: Enforces filesystem boundaries (`isPathInside`) preventing directory traversal and symlink write-through attacks.
4. **Secret Redaction**: Built-in regex filters automatically mask detected tokens (`ghp_***...1234`) to prevent log exposure.

---

## Development & Testing

```bash
# Clone repository
git clone https://github.com/knmt1219/repodoctor.git
cd repodoctor

# Install dependencies and build
npm install
npm run build

# Run complete test suite (16 suites, 100% pass)
npm test

# Run test coverage
npm run test:coverage

# Self-dogfooding health check
npm run doctor
```

---

## Contributing

We warmly welcome contributions! Please review our [Contributing Guide](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md) before submitting a PR.

---

## Roadmap

- [x] **v0.1.4**: 31 built-in production rules, SARIF 2.1.0, Auto-fixers with `--dry-run`, GitHub Action `action.yml`, Pre-commit hooks, and PR summary reporter.
- [ ] **v0.2.0**: Direct GitHub PR comment bot action with automated review suggestion diffs.
- [ ] **v0.3.0**: Monorepo workspace graph analyzer (pnpm-workspace, Cargo workspaces, Turborepo boundary checks).
- [ ] **v0.4.0**: Custom community rule plugin architecture (`@repodoctor/plugin-*`).

See [ROADMAP.md](ROADMAP.md) for full details.

---

## License

[MIT License](LICENSE) © 2026 RepoDoctor Contributors
