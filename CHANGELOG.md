# Changelog

All notable changes to **RepoDoctor** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.4] - 2026-08-20

### Added
- **New Built-in Rules (31 Total Rules)**:
  - `oss-009`: Checks for the presence of a `CODEOWNERS` file (`.github/CODEOWNERS`, `CODEOWNERS`, `docs/CODEOWNERS`) to ensure automated PR reviewer routing and reduce maintainer triage delays.
  - `ci-005`: Checks for automated dependency updates configuration via `.github/dependabot.yml` or Renovate (`renovate.json`, `.renovaterc.json`) to automate routine version updates and security patch bumps.
- **Auto-Fixers Expansion**:
  - Added safe scaffolding for `oss-009` (`.github/CODEOWNERS` template).
  - Added safe scaffolding for `ci-005` (`.github/dependabot.yml` for npm and GitHub Actions).
  - Added `--dry-run` simulation mode to `repodoctor fix --dry-run` and programmatic API `engine.fix({ dryRun: true })` to preview remediation actions without modifying the filesystem.
- **Reporting & CLI Improvements**:
  - Added `formatMarkdownPrSummary` reporter and `--summary` / `--format markdown-pr` flags for compact, collapsible PR diagnostic comment tables.
  - Improved CLI output and exit code determinism.
- **Ecosystem & Packaging**:
  - Added official GitHub Action manifest (`action.yml`) with GitHub Marketplace branding, inputs, and outputs.
  - Added standard pre-commit hook definition (`.pre-commit-hooks.yaml`).
  - Enriched `package.json` with devops/security keywords and enhanced description.
  - Added dedicated `ROADMAP.md` (3-6 month milestone plan) and `docs/CODEX-FOR-OSS-NOTES.md` application dossier.

### Changed
- Updated health score active rule count to 31 across all test suites and self-dogfooding checks.
- Rewrote documentation to focus on maintainer time savings, CI security risks, and explicit tool boundaries.

---

## [0.1.3] - 2026-08-20

### Fixed
- **Package Metadata & ESM Exports**: Configured standard ESM `exports` map, added `publishConfig` with public access, and normalized `./bin/repodoctor.js` binary path.
- **CLI Resolution**: Standardized `repodoctor` executable for clean invocation in consumer projects and via `npm exec`.
- **Version Synchronization**: Synchronized runtime CLI program version and diagnostic engine report metadata to `0.1.3`.

---

## [0.1.1] - 2026-08-20

### Fixed
- **Cross-Platform Test Execution**: Introduced a dedicated sequential test runner script (`scripts/test-runner.js`) ensuring resilient execution and detailed per-suite diagnostic reports across Windows, macOS, and Linux runners.
- **Safe Filesystem Boundaries**: Enhanced `writeFileSafe` path resolution in `src/utils/fs.ts` to support environments with symlinked root directories (such as macOS `/var` -> `/private/var`) and Windows 8.3 short paths while maintaining strict physical containment.
- **CI Workflows & Artifacts**: Updated `RepoDoctor Security & Health Scan` workflow permissions and pinned `actions/upload-artifact` to verified release commit SHA for consistent SARIF report storage.

---

## [0.1.0] - 2026-08-19

### Added
- **Core Engine & Architecture**:
  - High-performance, zero-config rule evaluation engine with contextual caching and zero network calls.
  - Multi-tiered Health Score system (0-100 score, letter grades A+ to F).
  - Category-weighted score deductions for security, CI, OSS standards, packages, git, and docker.
  - Dynamic weight scaling when individual categories are disabled.
- **Rule Catalog (29 Built-in Production Rules)**:
  - `sec-001` to `sec-006`: Security rules (Action SHA pinning, workflow permissions, `.gitignore` secrets, `curl | sh` pipes, secret leak detection, `pull_request_target` safety).
  - `oss-001` to `oss-008`: Community & OSS standards (LICENSE, README, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY.md, issue templates, PR template, metadata).
  - `ci-001` to `ci-004`: CI best practices (timeouts, concurrency cancellation, workflow existence, matrix fail-fast).
  - `pkg-001` to `pkg-004`: Package hygiene (lockfile presence, conflicting lockfiles, wildcard versions, lifecycle scripts).
  - `git-001` to `git-005`: Repository structure & git hygiene (.gitattributes, conflict markers, large binaries, nested git, broken symlinks).
  - `docker-001` to `docker-002`: Container hygiene (base image pinning, .dockerignore).
- **Reporters & Output Formats**:
  - ANSI colored Terminal reporter, JSON, OASIS SARIF v2.1.0, Markdown, and GitHub Workflow annotations (`::error::`).
- **Automated Fixers (`repodoctor fix`)**:
  - Safe, idempotent remediation for `.gitattributes`, `.gitignore`, `SECURITY.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `.github/ISSUE_TEMPLATE/`, `.github/pull_request_template.md`, and `.dockerignore`.
- **Testing & CI**:
  - Automated tests across multi-OS matrix (Ubuntu, Windows, macOS) with 100% pass rate.
