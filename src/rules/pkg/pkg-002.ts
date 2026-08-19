import { Rule, RuleResult } from '../../core/types.js';

export const pkg002: Rule = {
  id: 'pkg-002',
  title: 'Multiple conflicting lockfiles detected in repository root',
  description: 'Having multiple lockfiles (e.g. both package-lock.json and yarn.lock or pnpm-lock.yaml) causes confusion about which package manager is authoritative and leads to inconsistent dependency resolution in CI.',
  category: 'package',
  defaultSeverity: 'error',
  fixable: false,
  docs: {
    whyItMatters: 'If developers use different package managers on the same project, lockfiles drift out of sync, leading to phantom bugs and broken CI pipelines.',
    badExample: 'Repository contains both `package-lock.json` and `yarn.lock`.',
    goodExample: 'Repository contains only one authoritative lockfile matching the chosen package manager.',
    remediationGuide: 'Delete the secondary lockfile(s) and standardize on one package manager across your team.'
  },
  async check(context): Promise<RuleResult[]> {
    const results: RuleResult[] = [];
    const jsLockfiles = [
      { file: 'package-lock.json', name: 'npm' },
      { file: 'yarn.lock', name: 'yarn' },
      { file: 'pnpm-lock.yaml', name: 'pnpm' },
      { file: 'bun.lockb', name: 'bun' },
      { file: 'bun.lock', name: 'bun' }
    ];

    const presentLockfiles: string[] = [];
    for (const item of jsLockfiles) {
      if (await context.fileExists(item.file)) {
        presentLockfiles.push(item.file);
      }
    }

    if (presentLockfiles.length > 1) {
      results.push({
        ruleId: 'pkg-002',
        ruleTitle: pkg002.title,
        category: 'package',
        severity: 'error',
        message: `Multiple conflicting package lockfiles found: ${presentLockfiles.join(', ')}`,
        fixable: false,
        remediation: `Choose one package manager and remove the redundant lockfile(s) (${presentLockfiles.join(', ')}).`,
        details: { lockfiles: presentLockfiles }
      });
    }

    return results;
  }
};
