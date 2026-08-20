import { Rule, RuleResult } from '../../core/types.js';

const CODEOWNERS_CANDIDATES = [
  '.github/CODEOWNERS',
  'CODEOWNERS',
  'docs/CODEOWNERS',
  '.gitlab/CODEOWNERS'
];

export const oss009: Rule = {
  id: 'oss-009',
  title: 'Repository should have a CODEOWNERS file for PR review routing',
  description: 'A CODEOWNERS file defines individuals or teams responsible for code in the repository, automatically assigning reviewers to pull requests and reducing maintainer triage overhead.',
  category: 'oss',
  defaultSeverity: 'warn',
  fixable: true,
  docs: {
    whyItMatters: 'Without a CODEOWNERS file, pull requests lack automatic reviewer assignment, increasing maintainer triage load and delaying critical reviews.',
    badExample: 'No CODEOWNERS file present in the repository.',
    goodExample: 'A .github/CODEOWNERS file mapping directory paths to GitHub usernames or teams (e.g. `* @maintainer`).',
    remediationGuide: 'Create a `.github/CODEOWNERS` file specifying code ownership rules.'
  },
  async check(context): Promise<RuleResult[]> {
    const results: RuleResult[] = [];
    let found = false;

    for (const p of CODEOWNERS_CANDIDATES) {
      if (await context.fileExists(p)) {
        found = true;
        break;
      }
    }

    if (!found) {
      results.push({
        ruleId: 'oss-009',
        ruleTitle: oss009.title,
        category: 'oss',
        severity: 'warn',
        message: 'Missing CODEOWNERS file for automated PR reviewer assignment and maintainer routing',
        fixable: true,
        remediation: 'Create a `.github/CODEOWNERS` file (e.g., `* @username`) to automatically request reviews on incoming PRs.'
      });
    }

    return results;
  }
};
