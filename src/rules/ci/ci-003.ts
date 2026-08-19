import { Rule, RuleResult } from '../../core/types.js';

export const ci003: Rule = {
  id: 'ci-003',
  title: 'Repository should have automated CI workflows configured',
  description: 'Repositories should have at least one automated GitHub Actions workflow in `.github/workflows/` that validates builds, tests, or linting on push or pull requests.',
  category: 'ci',
  defaultSeverity: 'warn',
  fixable: false,
  docs: {
    whyItMatters: 'Automated CI guarantees that proposed changes do not break test suites or introduce regressions before merging.',
    badExample: 'No workflows in .github/workflows directory.',
    goodExample: '.github/workflows/ci.yml configured to run tests on push and pull_request.',
    remediationGuide: 'Create a `.github/workflows/ci.yml` workflow file running your build and test suites.'
  },
  async check(context): Promise<RuleResult[]> {
    const results: RuleResult[] = [];
    const workflowFiles = await context.listFiles('.github/workflows/*');
    const validWorkflows = workflowFiles.filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));

    if (validWorkflows.length === 0) {
      results.push({
        ruleId: 'ci-003',
        ruleTitle: ci003.title,
        category: 'ci',
        severity: 'warn',
        message: 'No GitHub Actions workflows found in .github/workflows/',
        fixable: false,
        remediation: 'Create `.github/workflows/ci.yml` to automatically run tests and linters.'
      });
    }

    return results;
  }
};
