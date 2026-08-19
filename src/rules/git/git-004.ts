import { Rule, RuleResult } from '../../core/types.js';

export const git004: Rule = {
  id: 'git-004',
  title: 'No nested .git directories (untracked submodules or cloned repos)',
  description: 'Detects nested `.git` folders inside subdirectories. These usually happen when cloning a repository inside another repository without properly registering it as a Git submodule, causing files inside to be ignored or untracked.',
  category: 'git',
  defaultSeverity: 'error',
  fixable: false,
  docs: {
    whyItMatters: 'Git treats any subdirectory containing `.git` as an embedded repository and ignores its files, leading to missing source files in the parent repo.',
    badExample: 'A nested `.git` directory at `packages/subpkg/.git/` that is not a submodule.',
    goodExample: 'All nested packages are part of the root git repo or registered as proper `.gitmodules`.',
    remediationGuide: 'Remove the nested `.git` directory or register it as a formal submodule using `git submodule add`.'
  },
  async check(context): Promise<RuleResult[]> {
    const results: RuleResult[] = [];
    const files = await context.listFiles();

    for (const filePath of files) {
      if (filePath.includes('/.git/') || filePath.endsWith('/.git') || filePath.includes('\\.git\\')) {
        results.push({
          ruleId: 'git-004',
          ruleTitle: git004.title,
          category: 'git',
          severity: 'error',
          file: filePath,
          message: `Nested .git path detected at "${filePath}"`,
          fixable: false,
          remediation: 'Remove nested .git folder or convert to a submodule.'
        });
      }
    }

    return results;
  }
};
