import { Rule, RuleResult } from '../../core/types.js';

const PR_TEMPLATE_CANDIDATES = [
  '.github/pull_request_template.md',
  '.github/PULL_REQUEST_TEMPLATE.md',
  'pull_request_template.md',
  'docs/pull_request_template.md'
];

export const oss007: Rule = {
  id: 'oss-007',
  title: 'Repository should have a Pull Request template',
  description: 'A pull request template ensures that authors describe their changes, link related issues, and complete a testing checklist before submission.',
  category: 'oss',
  defaultSeverity: 'info',
  fixable: true,
  docs: {
    whyItMatters: 'Standard PR checklists ensure contributors verify automated tests pass, documentation is updated, and breaking changes are noted.',
    badExample: 'No pull_request_template.md in .github/',
    goodExample: '.github/pull_request_template.md with a brief checklist.',
    remediationGuide: 'Create `.github/pull_request_template.md` with summary, linked issues, and checklist.'
  },
  async check(context): Promise<RuleResult[]> {
    const results: RuleResult[] = [];
    let found = false;

    for (const p of PR_TEMPLATE_CANDIDATES) {
      if (await context.fileExists(p)) {
        found = true;
        break;
      }
    }

    if (!found) {
      results.push({
        ruleId: 'oss-007',
        ruleTitle: oss007.title,
        category: 'oss',
        severity: 'info',
        message: 'Missing Pull Request template (.github/pull_request_template.md)',
        fixable: true,
        remediation: 'Create .github/pull_request_template.md with a description prompt and testing checklist.'
      });
    }

    return results;
  }
};
