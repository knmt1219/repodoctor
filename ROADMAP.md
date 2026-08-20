# 🗺️ RepoDoctor Project Roadmap

This document outlines the planned direction, engineering milestones, and ecosystem enhancements for **RepoDoctor** over the next 3 to 6 months.

---

## 🎯 Strategic Focus

RepoDoctor aims to become the standard, zero-config repository governance and CI/CD security linter for open-source maintainers and developer teams. Our roadmap centers on:
1. **Developer Experience & Automation**: Saving maintainers time by turning diagnostics into automated, non-destructive fixes.
2. **Ecosystem & Platform Integrations**: Native support for GitHub, GitLab, pre-commit, and popular monorepo managers.
3. **Extensibility & Community Ecosystem**: Allowing teams to write custom company/org rules without forking.

---

## 📅 Milestones & Timeline

### Milestone 1: Core Maturation & Ecosystem Hooks (v0.1.x) — Current
- [x] **31 Built-in Production Rules**: Covering CI security, Action SHA pinning, secret ignores, OSS standards, lockfiles, and git hygiene.
- [x] **Idempotent Auto-Fixers**: Safe generation of missing governance files with `--dry-run` preview support.
- [x] **Multi-Format Reporting**: ANSI Terminal, OASIS SARIF v2.1.0, JSON, Markdown, and GitHub workflow command annotations (`::error::`).
- [x] **Compact PR Summary Reporter (`--summary` / `--format markdown-pr`)**: Ready for PR comments and `$GITHUB_STEP_SUMMARY`.
- [x] **GitHub Action (`action.yml`)**: Ready for GitHub Marketplace distribution.
- [x] **Pre-Commit Hook Integration (`.pre-commit-hooks.yaml`)**: Standard pre-commit hook support.
- [x] **Multi-OS & Multi-Node Verification**: Continuous validation across Linux, Windows, macOS on Node 18, 20, 22.

---

### Milestone 2: Automated PR Bot & GitHub Integration (v0.2.0) — Q3 2026
- [ ] **GitHub Action PR Commenter**:
  - Automatically comment formatted PR diagnosis with collapsible findings and Health Score changes directly on pull requests.
  - Collapse previous bot comments to keep PR timelines clean.
- [ ] **Automated GitHub Review Suggestions**:
  - For fixable errors (e.g. adding `.gitattributes` or fixing permissions), output suggested diff blocks that contributors can commit in 1 click.
- [ ] **Rules Expansion (35+ rules)**:
  - `sec-007`: Workflow script injection detection (`${{ github.event.issue.title }}` inside `run:`).
  - `ci-006`: Stale branch / PR cleanup action detection.
  - `oss-010`: Security advisories / private reporting enablement check.
  - `pkg-005`: Node engine constraint compatibility across dependencies.

---

### Milestone 3: Monorepo & Polyrepo Architecture (v0.3.0) — Q4 2026
- [ ] **Monorepo Workspace Graph Analyzer**:
  - Workspace support for `pnpm-workspace.yaml`, `lerna.json`, `nx.json`, Turborepo (`turbo.json`), Cargo workspaces, and Go multi-module repositories.
  - Cross-package dependency version consistency validation.
  - Circular workspace dependency detection.
- [ ] **GitLab CI & Bitbucket Pipelines Support**:
  - Specialized rule checks for `.gitlab-ci.yml` and `bitbucket-pipelines.yml`.
  - Code Quality artifact format output (GitLab Code Climate JSON).

---

### Milestone 4: Plugin Architecture & Custom Rule Engine (v0.4.0) — Early 2027
- [ ] **Pluggable Architecture (`@repodoctor/plugin-*`)**:
  - Allow organizations to package custom internal rules as npm packages or local TypeScript files.
  - Sandboxed, lightweight plugin execution API.
- [ ] **Custom Rule Declarative DSL**:
  - Support simple YAML-defined custom rules in `.repodoctor.yml` (e.g. requiring specific files or regex patterns).
- [ ] **Interactive Remediation Wizard (`repodoctor fix --interactive`)**:
  - CLI interactive prompts for configuring licenses, maintainer names in `CODEOWNERS`, and matrix configurations.

---

## 💡 How We Prioritize

We prioritize features based on:
1. **Direct Maintainer Time Savings**: Does this reduce manual PR triage and review fatigue?
2. **Zero-Config Performance**: Does the tool stay fast (<200ms) without heavy dependency bloat?
3. **Safety & Non-Destructive Behavior**: Can maintainers run it in CI with zero false positive disruptions?

---

## 🤝 Getting Involved

We welcome community feedback, feature requests, and rule contributions! Check out our [Contributing Guide](CONTRIBUTING.md) to get started.
