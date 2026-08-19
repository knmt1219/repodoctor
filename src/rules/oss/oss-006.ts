import { Rule, RuleResult } from '../../core/types.js';

export const oss006: Rule = {
  id: 'oss-006',
  title: 'Repository should have GitHub issue templates',
  description: 'Issue templates (e.g. bug_report.yml, feature_request.yml in .github/ISSUE_TEMPLATE/) guide users to submit structured and reproducible bug reports.',
  category: 'oss',
  defaultSeverity: 'info',
  fixable: true,
  docs: {
    whyItMatters: 'Structured issue templates prompt reporters for OS version, minimal reproduction steps, and logs, drastically reducing maintainer triage time.',
    badExample: 'No .github/ISSUE_TEMPLATE folder.',
    goodExample: '.github/ISSUE_TEMPLATE/bug_report.yml and feature_request.yml present.',
    remediationGuide: 'Add bug report and feature request templates in `.github/ISSUE_TEMPLATE/`.'
  },
  async check(context): Promise<RuleResult[]> {
    const results: RuleResult[] = [];
    const issueTemplateFiles = await context.listFiles('.github/ISSUE_TEMPLATE/*');
    const hasTemplates = issueTemplateFiles.length > 0;
    const hasSingleTemplate = await context.fileExists('.github/issue_template.md');

    if (!hasTemplates && !hasSingleTemplate) {
      results.push({
        ruleId: 'oss-006',
        ruleTitle: oss006.title,
        category: 'oss',
        severity: 'info',
        message: 'Missing GitHub Issue templates in .github/ISSUE_TEMPLATE/',
        fixable: true,
        remediation: 'Create .github/ISSUE_TEMPLATE/bug_report.yml and feature_request.yml.'
      });
    }

    return results;
  }
};
