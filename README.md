<div align="center">

# 🩺 RepoDoctor

**Fast, zero-config Repository Health, Security & CI Linter for modern open-source projects.**

[![CI](https://github.com/knmt1219/repodoctor/actions/workflows/ci.yml/badge.svg)](https://github.com/knmt1219/repodoctor/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
[![Coverage](https://img.shields.io/badge/coverage-%3E90%25-brightgreen)](https://github.com/knmt1219/repodoctor)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

</div>

---

## Table of Contents

- [Problem Statement](#problem-statement)
- [Key Features](#key-features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [CLI Usage & Commands](#cli-usage--commands)
- [Rule Catalog](#rule-catalog)
- [Configuration](#configuration)
- [Automated Remediation (Fixers)](#automated-remediation-fixers)
- [Output Formats & CI Integration](#output-formats--ci-integration)
  - [Terminal Reporter](#1-terminal-default)
  - [SARIF & GitHub Code Scanning](#2-sarif-v210-for-github-code-scanning)
  - [Markdown & GitHub Step Summary](#3-markdown-report)
  - [JSON Report](#4-json-machine-readable)
  - [GitHub Workflow Annotations](#5-github-annotations)
- [Architecture Overview](#architecture-overview)
- [Security Model](#security-model)
- [Limitations](#limitations)
- [Development & Testing](#development--testing)
- [Contributing](#contributing)
- [Roadmap](#roadmap)
- [License](#license)

---

## Problem Statement

As open-source repositories grow, they accumulate **hygiene decay, security vulnerabilities, and workflow misconfigurations**:
- GitHub Actions run unpinned floating tags (susceptible to supply-chain attacks).
- Workflows lack timeout bounds or concurrency cancellation, burning CI credits.
- Sensitive environment variables and keys lack `.gitignore` coverage.
- Missing OSS governance (LICENSE, SECURITY.md, issue templates, PR checklists) slows down contributions.
- Conflicting lockfiles or open version ranges break builds unpredictably.

Existing linters are fragmented: ESLint only checks JavaScript ASTs, Flake8 only checks Python, and heavy commercial security scanners require SaaS signups, cloud tokens, or complex setups.

**RepoDoctor** provides a single, instant, zero-config CLI tool that diagnoses 25+ cross-ecosystem repository health metrics, computes a deterministic **0-100 Repository Health Score (Grades A+ to F)**, auto-fixes common violations, and uploads standard **SARIF 2.1.0** reports directly to GitHub Code Scanning.

---

## Key Features

- ⚡ **Blazing Fast**: Evaluates an entire repository in under 50ms with zero network overhead.
- 🔒 **Security & Supply-Chain Hardened**: Detects unpinned GitHub Actions, dangerous `pull_request_target` usage, plaintext tokens, missing `.gitignore` secret rules, and `curl | sh` pipes.
- 📜 **OSS Standards Compliance**: Verifies LICENSE integrity, README completeness, CONTRIBUTING guides, CODE_OF_CONDUCT, and SECURITY.md policies.
- 🚦 **CI/CD Best Practices**: Validates workflow `timeout-minutes`, PR concurrency cancellation groups, and multi-OS matrix configurations.
- 📦 **Package & Lockfile Hygiene**: Checks for missing lockfiles, multiple conflicting lockfiles (e.g. npm + yarn), and unconstrained wildcard `*` dependencies.
- 🛠️ **One-Command Remediation (`repodoctor fix`)**: Automatically generates missing `.gitattributes`, `.gitignore` secret patterns, `SECURITY.md`, and PR templates.
- 📊 **Multi-Format Reporting**: Supports Terminal ANSI tables, JSON, Markdown, GitHub workflow annotations (`::error::`), and OASIS SARIF v2.1.0 for GitHub Security tab integration.
- 🎛️ **Extensible & Configurable**: Zero-config by default, with optional `.repodoctor.yml` for custom rules, severity overrides, and score thresholds.

---

## Installation

### Run instantly with `npx` (No installation required)

```bash
npx repodoctor check
```

### Global Installation

```bash
# Using npm
npm install -g repodoctor

# Using yarn
yarn global add repodoctor

# Using pnpm
pnpm add -g repodoctor
```

### Local Project Dependency

```bash
npm install --save-dev repodoctor
```

---

## Quick Start

Run a full health check on your current repository:

```bash
repodoctor
```

Sample output:

```text
RepoDoctor v0.1.0 — Repository Health & Security Diagnostics
──────────────────────────────────────────────────────────────────────

  WARN  [sec-002] Workflow ".github/workflows/ci.yml" does not declare top-level or job-level 'permissions:' block at .github/workflows/ci.yml:1:1
   └─ Fix: Add `permissions: read-all` or specific granular permissions at the top of the workflow

  WARN  [git-001] Missing .gitattributes file for cross-platform line ending normalization
   └─ Fix: Create a `.gitattributes` file containing `* text=auto eol=lf`.

──────────────────────────────────────────────────────────────────────
 Health Score: 92/100 (Grade: A)
 Category Breakdown: security: 90%  |  oss: 100%  |  ci: 100%  |  package: 100%  |  git: 90%  |  docker: 100%

 Summary: 2 warnings, 1 auto-fixable (27 rules evaluated in 38ms)
```

Auto-fix eligible issues immediately:

```bash
repodoctor fix
```

---

## CLI Usage & Commands

```bash
repodoctor [command] [options] [target-directory]
```

### Commands

| Command | Description |
| :--- | :--- |
| `repodoctor check [target]` | **(Default)** Run diagnostics and output report |
| `repodoctor fix [target]` | Automatically apply safe remediation fixes to the repository |
| `repodoctor init [target]` | Scaffold a standard `.repodoctor.yml` configuration file |
| `repodoctor rules [category]` | List all built-in rules, severities, and descriptions |
| `repodoctor explain <rule-id>` | Show in-depth rationale, non-compliant vs compliant code examples, and remediation steps |

### Flags & Options (`check` command)

| Option | Alias | Description | Default |
| :--- | :---: | :--- | :--- |
| `--format <format>` | `-f` | Output format: `terminal`, `json`, `sarif`, `markdown`, `github` | `terminal` |
| `--output <file>` | `-o` | Save the generated report to a file | `stdout` |
| `--config <path>` | `-c` | Custom path to configuration file | `.repodoctor.yml` |
| `--score-threshold <num>` | | Minimum acceptable health score (exits `1` if lower) | `75` |
| `--max-warnings <num>` | | Maximum allowed warnings before exiting with code `1` | `-1` (unlimited) |
| `--strict` | | Treat warnings as errors (fails if any warning exists) | `false` |
| `--fix` | | Automatically apply fixes before computing final score | `false` |
| `--version` | `-V` | Output installed version | |
| `--help` | `-h` | Display command help | |

---

## Rule Catalog

RepoDoctor includes **25+ production-grade rules** categorized across 6 core domains:

### 1. 🔒 Security & Supply Chain (`security`)
- **`sec-001`** *(error)*: **Action Commit SHA Pinning** — Ensures GitHub Actions use immutable 40-character commit hashes rather than mutable floating tags (`@v4`).
- **`sec-002`** *(warn)*: **Explicit Workflow Permissions** — Ensures workflows declare least-privilege `permissions:` blocks and avoids `permissions: write-all`.
- **`sec-003`** *(error, fixable)*: **Gitignore Secrets Coverage** — Validates that `.gitignore` prevents staging `.env`, `*.key`, `*.pem`, and credential files.
- **`sec-004`** *(error)*: **No Remote Pipe-to-Shell** — Flags dangerous `curl | sh` or `wget | bash` executions in CI workflows and package scripts.
- **`sec-005`** *(error)*: **Committed Secret Scanner** — Scans tracked files for high-entropy API keys (OpenAI, AWS, Slack, GitHub tokens) and private key headers with automatic redaction.
- **`sec-006`** *(warn)*: **Safe `pull_request_target` Usage** — Flags risky combinations of `pull_request_target` triggers checking out untrusted fork head code.

### 2. 📜 Open Source & Community Standards (`oss`)
- **`oss-001`** *(error)*: **Valid LICENSE File** — Checks for an OSI-compliant, non-empty LICENSE file.
- **`oss-002`** *(warn)*: **Comprehensive README** — Ensures README exists and provides structured documentation.
- **`oss-003`** *(warn)*: **CONTRIBUTING Guide** — Checks for `CONTRIBUTING.md` in root or `.github/`.
- **`oss-004`** *(info)*: **Code of Conduct** — Checks for `CODE_OF_CONDUCT.md`.
- **`oss-005`** *(warn, fixable)*: **SECURITY.md Policy** — Verifies a vulnerability reporting policy exists.
- **`oss-006`** *(info)*: **Issue Templates** — Checks for `.github/ISSUE_TEMPLATE/` forms.
- **`oss-007`** *(info, fixable)*: **Pull Request Template** — Checks for `.github/pull_request_template.md`.
- **`oss-008`** *(warn)*: **Package Metadata Completeness** — Verifies `description` and `repository` fields in package manifests.

### 3. 🚦 CI/CD Best Practices (`ci`)
- **`ci-001`** *(warn)*: **Workflow Job Timeouts** — Ensures all GitHub Actions jobs declare `timeout-minutes` to avoid runaway billing.
- **`ci-002`** *(warn)*: **PR Concurrency Cancellation** — Ensures PR workflows set `concurrency` with `cancel-in-progress: true` to prevent runner backlog.
- **`ci-003`** *(warn)*: **CI Workflow Presence** — Checks that at least one CI workflow is configured in `.github/workflows/`.
- **`ci-004`** *(info)*: **Matrix Fail-Fast Policy** — Recommends explicit `fail-fast` configuration on large test matrices.

### 4. 📦 Package & Dependency Hygiene (`package`)
- **`pkg-001`** *(error)*: **Committed Lockfile** — Ensures package manifests have matching lockfiles (`package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, `Cargo.lock`).
- **`pkg-002`** *(error)*: **No Conflicting Lockfiles** — Detects accidental co-existence of multiple lockfiles (e.g. `package-lock.json` AND `yarn.lock`).
- **`pkg-003`** *(warn)*: **No Wildcard Dependencies** — Flags dangerous `*` or `latest` unconstrained dependencies in `package.json`.
- **`pkg-004`** *(warn)*: **Standard Lifecycle Scripts** — Ensures `package.json#scripts` includes executable `test`, `build`, or `lint` scripts.

### 5. 📁 Git & File Structure Hygiene (`git`)
- **`git-001`** *(warn, fixable)*: **Cross-Platform `.gitattributes`** — Ensures `* text=auto eol=lf` is configured to prevent CRLF corruption.
- **`git-002`** *(error)*: **No Merge Conflict Markers** — Detects committed `<<<<<<<`, `=======`, `>>>>>>>` markers in tracked files.
- **`git-003`** *(warn)*: **Large Binary Tracking** — Warns on large binary files (>1MB) tracked without Git LFS.
- **`git-004`** *(error)*: **No Nested `.git` Directories** — Detects accidental embedded git repositories.
- **`git-005`** *(error)*: **No Broken Symbolic Links** — Detects dead symlinks pointing to deleted targets.

### 6. 🐳 Docker & Container Hygiene (`docker`)
- **`docker-001`** *(warn)*: **Base Image Pinning** — Warns on `:latest` or unpinned tags in `Dockerfile`.
- **`docker-002`** *(warn, fixable)*: **`.dockerignore` Presence** — Ensures `.dockerignore` exists when `Dockerfile` is present.

---

## Configuration

Initialize a configuration file with:

```bash
repodoctor init
```

This creates `.repodoctor.yml` in your repository root:

```yaml
# Minimum acceptable health score (0 - 100)
scoreThreshold: 85

# Maximum allowed warnings before exiting with code 1 (-1 for unlimited)
maxWarnings: 0

# Enable or disable categories
categories:
  security: true
  oss: true
  ci: true
  package: true
  git: true
  docker: true

# Custom rule severity overrides ('error', 'warn', 'info', 'off')
rules:
  sec-001: error  # Action SHA pinning
  sec-002: warn   # Workflow permissions
  ci-001: error   # Enforce timeouts as strict errors
  oss-004: off    # Disable Code of Conduct check

# Files and directories to ignore
ignore:
  - '**/legacy/**'
  - '**/fixtures/**'
```

RepoDoctor also supports `.repodoctor.json`, `.repodoctorrc`, or a `"repodoctor"` section in `package.json`.

---

## Automated Remediation (Fixers)

Run:

```bash
repodoctor fix
```

RepoDoctor will safely apply non-destructive fixes:
- Generates `.gitattributes` with `* text=auto eol=lf`.
- Appends `.env`, `.env.*`, `*.key`, and `*.pem` rules to `.gitignore`.
- Generates a standard `SECURITY.md` vulnerability reporting template.
- Generates a structured `.github/pull_request_template.md`.
- Generates `.dockerignore` ignoring node_modules, `.git`, and `.env`.

---

## Output Formats & CI Integration

### 1. Terminal (Default)

```bash
repodoctor check
```

### 2. SARIF v2.1.0 (for GitHub Code Scanning)

Integrate RepoDoctor directly with GitHub's Security / Code Scanning tab:

```yaml
# .github/workflows/repodoctor.yml
name: RepoDoctor Scan

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  contents: read
  security-events: write

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - uses: actions/setup-node@39370e3970a6d050c480ffad4ff0ed4d3fdee5af # v4.1.0
        with:
          node-version: 20
      - run: npm install -g repodoctor
      - run: repodoctor check . --format sarif --output results.sarif
        continue-on-error: true
      - uses: github/codeql-action/upload-sarif@6bb034f26f1da0b37c6335a3983f3333bed7a2ff # v3.28.11
        with:
          sarif_file: results.sarif
```

### 3. Markdown Report

Generate rich Markdown tables for `$GITHUB_STEP_SUMMARY` or PR comments:

```bash
repodoctor check --format markdown >> $GITHUB_STEP_SUMMARY
```

### 4. JSON (Machine-Readable)

```bash
repodoctor check --format json --output report.json
```

### 5. GitHub Annotations

Directly annotate pull request diffs using GitHub Actions workflow commands:

```bash
repodoctor check --format github
```

---

## Architecture Overview

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
  │  - CI (ci-*)          │                               │  - Category Breakdown │
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
                          │  - Markdown Summary      │
                          │  - JSON / GH Annotations │
                          └──────────────────────────┘
```

---

## Security Model

1. **Static Analysis Only**: RepoDoctor treats all repository files strictly as **data**. It never executes dynamic shell commands or imports untrusted JavaScript/Python/Ruby files from analyzed repositories.
2. **Offline & Air-Gapped**: RepoDoctor makes **zero network requests**. It operates entirely on local filesystem state.
3. **Secret Redaction**: Detected credentials and tokens are redacted with asterisks before being passed to any reporter, preventing accidental leakage in CI logs.

---

## Limitations

- AST parsing is focused on configuration structures (YAML, JSON, TOML, Dockerfiles, and Git attributes). Deep semantic AST analysis of language-specific logic (e.g. complex TypeScript control flow) is best paired with specialized linters like ESLint.
- Git historical scanning checks currently tracked files and `.git` config; full-history deep commit rewriting is recommended via tools like `git-filter-repo`.

---

## Development & Testing

### Run Tests

```bash
npm test
```

### Run Coverage Report

```bash
npm run test:coverage
```

### Self-Dogfooding

```bash
npm run doctor
```

---

## Contributing

Contributions are warmly welcome! Please read our [Contributing Guide](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md) before submitting a pull request.

---

## Roadmap

- [x] Initial release (v0.1.0) with 25+ production rules and SARIF 2.1.0 support
- [ ] Pre-commit git hook integration (`repodoctor hook install`)
- [ ] Custom community plugin architecture (`repodoctor-plugin-*`)
- [ ] Auto-remediation for GitHub Actions timeout injection
- [ ] Monorepo package boundary and workspace dependency analyzer
- [ ] Direct PR comment bot GitHub Action

---

## License

[MIT License](LICENSE) © 2026 RepoDoctor Contributors
