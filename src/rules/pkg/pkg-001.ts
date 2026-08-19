import { Rule, RuleResult } from '../../core/types.js';

export const pkg001: Rule = {
  id: 'pkg-001',
  title: 'Project manifest must have a corresponding lockfile',
  description: 'Deterministic builds require a committed lockfile (e.g. package-lock.json, pnpm-lock.yaml, yarn.lock, Cargo.lock, poetry.lock). Missing lockfiles cause non-reproducible CI failures when transitive dependencies release breaking changes.',
  category: 'package',
  defaultSeverity: 'error',
  fixable: false,
  docs: {
    whyItMatters: 'Without a lockfile, every installation pulls the latest matching semver ranges, leading to the "works on my machine" phenomenon and unexpected build breaks.',
    badExample: 'package.json exists, but no package-lock.json or yarn.lock is committed.',
    goodExample: 'package-lock.json or pnpm-lock.yaml is checked into Git alongside package.json.',
    remediationGuide: 'Run `npm install`, `pnpm install`, or `yarn install` and commit the generated lockfile.'
  },
  async check(context): Promise<RuleResult[]> {
    const results: RuleResult[] = [];

    // Node.js
    if (await context.fileExists('package.json')) {
      const lockfiles = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb', 'bun.lock'];
      let foundLockfile = false;
      for (const lf of lockfiles) {
        if (await context.fileExists(lf)) {
          foundLockfile = true;
          break;
        }
      }
      if (!foundLockfile) {
        results.push({
          ruleId: 'pkg-001',
          ruleTitle: pkg001.title,
          category: 'package',
          severity: 'error',
          file: 'package.json',
          message: 'package.json found without a committed lockfile (package-lock.json, pnpm-lock.yaml, yarn.lock)',
          fixable: false,
          remediation: 'Run `npm install` or your package manager install command and commit the resulting lockfile.'
        });
      }
    }

    // Rust
    if (await context.fileExists('Cargo.toml')) {
      if (!(await context.fileExists('Cargo.lock'))) {
        results.push({
          ruleId: 'pkg-001',
          ruleTitle: pkg001.title,
          category: 'package',
          severity: 'warn',
          file: 'Cargo.toml',
          message: 'Cargo.toml found without a committed Cargo.lock',
          fixable: false,
          remediation: 'Run `cargo generate-lockfile` and commit Cargo.lock.'
        });
      }
    }

    return results;
  }
};
