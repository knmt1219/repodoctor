import { Rule, RuleResult } from '../../core/types.js';

export const ci001: Rule = {
  id: 'ci-001',
  title: 'GitHub Actions workflow jobs must define timeout-minutes',
  description: 'Jobs without explicit timeout-minutes default to a 6-hour timeout (360 minutes). A stuck test suite or deadlocked network call can exhaust your monthly CI minutes and block runners.',
  category: 'ci',
  defaultSeverity: 'warn',
  fixable: false,
  docs: {
    whyItMatters: 'GitHub Actions default job timeout is 360 minutes (6 hours). If a test hangs or waits indefinitely for stdin/socket response, it will consume hundreds of billed runner minutes unless bounded by timeout-minutes.',
    badExample: 'jobs:\n  test:\n    runs-on: ubuntu-latest\n    steps: [...]',
    goodExample: 'jobs:\n  test:\n    runs-on: ubuntu-latest\n    timeout-minutes: 15\n    steps: [...]',
    remediationGuide: 'Add `timeout-minutes: 15` (or a reasonable limit) to each job definition in your workflow.'
  },
  async check(context): Promise<RuleResult[]> {
    const results: RuleResult[] = [];
    const workflowFiles = await context.listFiles('.github/workflows/*');

    for (const filePath of workflowFiles) {
      if (!filePath.endsWith('.yml') && !filePath.endsWith('.yaml')) continue;

      const parsed = await context.readYaml<{ jobs?: Record<string, { 'timeout-minutes'?: number }> }>(filePath);
      if (!parsed || !parsed.jobs || typeof parsed.jobs !== 'object') continue;

      for (const [jobName, jobDef] of Object.entries(parsed.jobs)) {
        if (!jobDef || typeof jobDef !== 'object') continue;

        if (typeof jobDef['timeout-minutes'] !== 'number') {
          results.push({
            ruleId: 'ci-001',
            ruleTitle: ci001.title,
            category: 'ci',
            severity: 'warn',
            file: filePath,
            message: `Job "${jobName}" in workflow "${filePath}" is missing 'timeout-minutes'`,
            fixable: false,
            remediation: `Add 'timeout-minutes: 15' under job "${jobName}".`,
            details: { job: jobName }
          });
        }
      }
    }

    return results;
  }
};
