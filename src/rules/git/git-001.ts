import { Rule, RuleResult } from '../../core/types.js';

export const git001: Rule = {
  id: 'git-001',
  title: 'Repository should define a .gitattributes file for consistent line endings',
  description: 'Without a `.gitattributes` configuring `* text=auto eol=lf`, developers on Windows and Unix platforms will produce noisy diffs due to CRLF vs LF differences.',
  category: 'git',
  defaultSeverity: 'warn',
  fixable: true,
  docs: {
    whyItMatters: 'CRLF line endings on Windows can break shell scripts in Linux CI containers (e.g. `\r: command not found`), and cause massive false git diffs across PRs.',
    badExample: 'No .gitattributes file in repository root.',
    goodExample: '.gitattributes containing `* text=auto eol=lf`.',
    remediationGuide: 'Create a `.gitattributes` file in the root with `* text=auto eol=lf`.'
  },
  async check(context): Promise<RuleResult[]> {
    const results: RuleResult[] = [];
    const exists = await context.fileExists('.gitattributes');

    if (!exists) {
      results.push({
        ruleId: 'git-001',
        ruleTitle: git001.title,
        category: 'git',
        severity: 'warn',
        message: 'Missing .gitattributes file for cross-platform line ending normalization',
        fixable: true,
        remediation: 'Create a `.gitattributes` file containing `* text=auto eol=lf`.'
      });
    }

    return results;
  }
};
