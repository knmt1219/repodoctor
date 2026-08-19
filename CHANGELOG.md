# Changelog

All notable changes to **RepoDoctor** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1] - 2026-08-20

### Fixed
- **Cross-Platform Test Execution**: Introduced a dedicated sequential test runner script (`scripts/test-runner.js`) ensuring resilient execution and detailed per-suite diagnostic reports across Windows, macOS, and Linux runners.
- **Safe Filesystem Boundaries**: Enhanced `writeFileSafe` path resolution in `src/utils/fs.ts` to support environments with symlinked root directories (such as macOS `/var` -> `/private/var`) and Windows 8.3 short paths while maintaining strict physical containment.
- **CI Workflows & Artifacts**: Updated `RepoDoctor Security & Health Scan` workflow permissions and pinned `actions/upload-artifact` to verified release commit SHA for consistent SARIF report storage.

## [0.1.0] - 2026-08-19

### Added
- **Core Engine & Architecture**:
  - High-performance, zero-config rule evaluation engine with contextual caching and zero network calls.
  - Multi-tiered Health Score system (0-100 score, letter grades A+ to F).
  - Category-weighted score deductions for security, CI, OSS standards, packages, git, and docker.
  - Dynamic weight scaling when individual categories are disabled (and deterministic 100 score if all categories disabled).
- **Rule Catalog (29 Built-in Production Rules)**:
  - `sec-001`: GitHub Action commit SHA pinning detector.
  - `sec-002`: Minimal workflow permissions validator.
  - `sec-003`: `.gitignore` secrets and private keys pattern validator.
  - `sec-004`: `curl | sh` pipe-to-shell execution scanner.
  - `sec-005`: High-entropy committed secret & private key scanner with automatic token redaction and `checkTrackedOnly` support.
  - `sec-006`: Risky `pull_request_target` checkout detector.
  - `oss-001` to `oss-008`: Community & OSS standards (LICENSE, README, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY.md, issue templates, PR template, metadata).
  - `ci-001` to `ci-004`: CI best practices (job timeout-minutes, full PR concurrency cancellation with group and `cancel-in-progress: true`, CI workflow existence, matrix fail-fast).
  - `pkg-001` to `pkg-004`: Package hygiene (lockfile presence, conflicting lockfiles, wildcard versions, lifecycle scripts with configurable `requiredScripts`).
  - `git-001` to `git-005`: Repository structure & git hygiene (.gitattributes, conflict markers, configurable `maxBinarySizeKb` binaries, recursive nested git with submodule detection, broken/escaping symlinks).
  - `docker-001` to `docker-002`: Container hygiene (base image pinning, .dockerignore).
- **Reporters & Output Formats**:
  - Rich ANSI colored Terminal reporter with Health Score gauge and issue cards.
  - Machine-readable JSON output (`--format json`).
  - SARIF v2.1.0 standard reporter for GitHub Code Scanning integration (`--format sarif`).
  - Formatted Markdown reporter for GitHub Step Summary and PR comments (`--format markdown`).
  - GitHub Workflow command annotations (`::error::`, `::warning::`) with complete character escaping (`%`, CR, LF, colons, commas).
- **Security & Filesystem Hardening**:
  - Strict path boundary validation (`isPathInside`) across all filesystem readers and writers to prevent path traversal.
  - Hardened `writeFileSafe` against write-through symlinks and non-canonical parent directory escapes.
  - Stateless regular expression matching in secret scanner to eliminate regex `lastIndex` mutation across consecutive checks.
  - Placeholder token filtering (`YOUR_API_KEY`, dummy tokens) to prevent false positives.
  - Safe argument-array child-process Git integration (`git ls-files -z`) for tracked-only mode with deterministic fallback.
- **Automated Fixers (`repodoctor fix`)**:
  - Strictly idempotent auto-remediation across multiple consecutive runs.
  - Safe scaffolding for `.gitattributes`, `.gitignore` secrets, `SECURITY.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `.github/ISSUE_TEMPLATE/`, `.github/pull_request_template.md`, and `.dockerignore`.
- **Testing & CI**:
  - 118 automated tests across 22 test suites with 100% pass rate.
  - Clean `tsconfig.json` build separation ensuring seamless execution from npm packages.
  - GitHub Actions CI workflow for multi-OS validation (Linux, Windows, macOS) and automated self-dogfooding.
