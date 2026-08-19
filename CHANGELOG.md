# Changelog

All notable changes to **RepoDoctor** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-08-19

### Added
- **Core Engine & Architecture**:
  - High-performance, zero-config rule evaluation engine with contextual caching.
  - Multi-tiered Health Score system (0-100 score, letter grades A+ to F).
  - Category-weighted score deductions for security, CI, OSS standards, packages, git, and docker.
- **Rule Catalog (25+ Built-in Rules)**:
  - `sec-001`: GitHub Action commit SHA pinning detector.
  - `sec-002`: Minimal workflow permissions validator.
  - `sec-003`: `.gitignore` secrets and private keys pattern validator.
  - `sec-004`: `curl | sh` pipe-to-shell execution scanner.
  - `sec-005`: High-entropy committed secret & private key scanner with automatic token redaction.
  - `sec-006`: Risky `pull_request_target` checkout detector.
  - `oss-001` to `oss-008`: Community & OSS standards (LICENSE, README, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY.md, issue templates, PR template, metadata).
  - `ci-001` to `ci-004`: CI best practices (job timeout-minutes, PR concurrency cancellation, CI workflow existence, matrix fail-fast).
  - `pkg-001` to `pkg-004`: Package hygiene (lockfile presence, conflicting lockfiles, wildcard versions, lifecycle scripts).
  - `git-001` to `git-005`: Repository structure & git hygiene (.gitattributes, conflict markers, large binaries, nested git, broken symlinks).
  - `docker-001` to `docker-002`: Container hygiene (base image pinning, .dockerignore).
- **Reporters & Output Formats**:
  - Rich ANSI colored Terminal reporter with Health Score gauge and issue cards.
  - Machine-readable JSON output (`--format json`).
  - SARIF v2.1.0 standard reporter for GitHub Code Scanning integration (`--format sarif`).
  - Formatted Markdown reporter for GitHub Step Summary and PR comments (`--format markdown`).
  - GitHub Workflow command annotations (`::error::`, `::warning::`).
- **Automated Fixers (`repodoctor fix`)**:
  - Auto-scaffolds `.gitattributes`, missing `.gitignore` secret patterns, `SECURITY.md`, `.github/pull_request_template.md`, and `.dockerignore`.
- **CLI Commands**:
  - `repodoctor check [path]`: Run diagnostics with exit code policies (`--strict`, `--score-threshold`, `--max-warnings`).
  - `repodoctor fix [path]`: Run automated remediation.
  - `repodoctor init`: Generate `.repodoctor.yml` template.
  - `repodoctor rules [category]`: Browse catalog with severity and descriptions.
  - `repodoctor explain <rule-id>`: Deep dive documentation, rationale, bad/good code examples, and remediation steps.
- **Testing & CI**:
  - 100% genuine test suite with 75+ automated unit and integration tests.
  - Over 90% test code coverage.
  - GitHub Actions CI workflow for multi-OS validation and automated self-dogfooding.
