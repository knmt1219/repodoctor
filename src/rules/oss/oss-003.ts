import { Rule, RuleResult } from '../../core/types.js';

const CONTRIBUTING_CANDIDATES = [
  'CONTRIBUTING.md',
  '.github/CONTRIBUTING.md',
  'docs/CONTRIBUTING.md',
  'CONTRIBUTING',
  'contributing.md'
];

export const oss003: Rule = {
  id: 'oss-003',
  title: 'Repository should have a CONTRIBUTING.md guide',
  description: 'A contribution guide helps new contributors understand how to set up the development environment, run tests, adhere to conventions, and submit PRs.',
  category: 'oss',
  defaultSeverity: 'warn',
  fixable: true,
  docs: {
    whyItMatters: 'Without a clear contributing guide, open source contributors often submit malformed PRs or get stuck trying to run the project locally.',
    badExample: 'No CONTRIBUTING.md present in repo.',
    goodExample: 'A CONTRIBUTING.md outlining development setup, testing commands, and PR guidelines.',
    remediationGuide: 'Add a CONTRIBUTING.md in the root or .github/ folder.'
  },
  async check(context): Promise<RuleResult[]> {
    const results: RuleResult[] = [];
    let found = false;

    for (const p of CONTRIBUTING_CANDIDATES) {
      if (await context.fileExists(p)) {
        found = true;
        break;
      }
    }

    if (!found) {
      results.push({
        ruleId: 'oss-003',
        ruleTitle: oss003.title,
        category: 'oss',
        severity: 'warn',
        message: 'Missing CONTRIBUTING.md guide for open-source contributors',
        fixable: true,
        remediation: 'Create a CONTRIBUTING.md file detailing local setup, test execution, and pull request workflow.'
      });
    }

    return results;
  }
};
