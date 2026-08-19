import { Rule, RuleResult } from '../../core/types.js';

export const pkg002: Rule = {
  id: 'pkg-002',
  title: 'Multiple conflicting lockfiles detected in repository root',
  description: 'Having multiple lockfiles from different package managers (e.g. both package-lock.json and yarn.lock or pnpm-lock.yaml) causes confusion about which package manager is authoritative and leads to inconsistent dependency resolution in CI.',
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
      { file: 'package-lock.json', manager: 'npm' },
      { file: 'yarn.lock', manager: 'yarn' },
      { file: 'pnpm-lock.yaml', manager: 'pnpm' },
      { file: 'bun.lockb', manager: 'bun' },
      { file: 'bun.lock', manager: 'bun' }
    ];

    const presentLockfiles: string[] = [];
    const managers = new Set<string>();

    for (const item of jsLockfiles) {
      if (await context.fileExists(item.file)) {
        presentLockfiles.push(item.file);
        managers.add(item.manager);
      }
    }

    // Only flag if lockfiles belong to more than 1 distinct package manager
    if (managers.size > 1) {
      results.push({
        ruleId: 'pkg-002',
        ruleTitle: pkg002.title,
        category: 'package',
        severity: 'error',
        message: `Multiple conflicting package lockfiles found: ${presentLockfiles.join(', ')} (${Array.from(managers).join(' vs ')})`,
        fixable: false,
        remediation: `Choose one package manager and remove the redundant lockfile(s) (${presentLockfiles.join(', ')}).`,
        details: { lockfiles: presentLockfiles, managers: Array.from(managers) }
      });
    }

    return results;
  }
};
