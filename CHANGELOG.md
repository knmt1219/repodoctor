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
- **Security & Filesystem Hardening**:
  - Strict path boundary validation (`isPathInside`) across all filesystem readers and writers to prevent path traversal.
  - Symlink escape detection preventing reading or archiving host files outside repository boundaries.
  - Stateless regular expression matching in secret scanner to eliminate regex `lastIndex` mutation across consecutive checks.
  - Placeholder token filtering (`YOUR_API_KEY`, dummy tokens) to prevent false positives.
  - File size and binary format guards in line scanners preventing high-memory overhead on large assets.
- **Rule Improvements & False-Positive Reductions**:
  - `git-003`: Integrates `.gitattributes` parser to respect configured Git LFS tracking rules (`filter=lfs`).
  - `sec-001` & `sec-004`: Ignores commented lines in YAML workflows and package scripts.
  - `pkg-001`: Expanded lockfile support for Python (`poetry.lock`, `Pipfile.lock`, `uv.lock`, `pdm.lock`) and Go (`go.sum`).
  - `oss-008`: Accounts for `private: true` package manifests.
- **Automated Fixers (`repodoctor fix`)**:
  - Strictly idempotent auto-remediation across multiple consecutive runs.
  - Safe scaffolding for `.gitattributes`, `.gitignore` secrets, `SECURITY.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `.github/ISSUE_TEMPLATE/`, `.github/pull_request_template.md`, and `.dockerignore`.
- **Testing & CI**:
  - 94 automated tests across 22 test suites with 100% pass rate.
  - Over 92% line coverage and 93% function coverage.
  - Clean `tsconfig.json` build separation ensuring seamless `npx repodoctor` execution from npm packages.
  - GitHub Actions CI workflow for multi-OS validation (Linux, Windows, macOS) and automated self-dogfooding.
