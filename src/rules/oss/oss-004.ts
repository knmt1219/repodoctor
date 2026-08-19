import { Rule, RuleResult } from '../../core/types.js';

const COC_CANDIDATES = [
  'CODE_OF_CONDUCT.md',
  '.github/CODE_OF_CONDUCT.md',
  'docs/CODE_OF_CONDUCT.md',
  'code_of_conduct.md'
];

export const oss004: Rule = {
  id: 'oss-004',
  title: 'Repository should have a CODE_OF_CONDUCT.md',
  description: 'A Code of Conduct sets clear standards for community behavior, fostering an inclusive and welcoming environment for all contributors.',
  category: 'oss',
  defaultSeverity: 'info',
  fixable: true,
  docs: {
    whyItMatters: 'A Code of Conduct outlines expected behaviors and reporting procedures for abusive conduct, ensuring a safe community space.',
    badExample: 'No Code of Conduct in repository.',
    goodExample: 'Standard Contributor Covenant Code of Conduct present.',
    remediationGuide: 'Add a CODE_OF_CONDUCT.md (e.g. Contributor Covenant v2.1) with your contact email.'
  },
  async check(context): Promise<RuleResult[]> {
    const results: RuleResult[] = [];
    let found = false;

    for (const p of COC_CANDIDATES) {
      if (await context.fileExists(p)) {
        found = true;
        break;
      }
    }

    if (!found) {
      results.push({
        ruleId: 'oss-004',
        ruleTitle: oss004.title,
        category: 'oss',
        severity: 'info',
        message: 'Missing CODE_OF_CONDUCT.md file',
        fixable: true,
        remediation: 'Adopt a standard Code of Conduct such as the Contributor Covenant.'
      });
    }

    return results;
  }
};
