import { Rule, RuleResult } from '../../core/types.js';
import { findLineAndColumn } from '../../utils/parsers.js';

export const sec006: Rule = {
  id: 'sec-006',
  title: 'Dangerous pull_request_target checkout pattern detected',
  description: 'Combining `pull_request_target` trigger with checking out the head repository or PR reference (`ref: ${{ github.event.pull_request.head.sha }}`) can allow untrusted fork code to execute in a privileged context with repository write secrets.',
  category: 'security',
  defaultSeverity: 'warn',
  fixable: false,
  docs: {
    whyItMatters: '`pull_request_target` runs with access to target repository secrets and write tokens. Checking out untrusted PR head code allows malicious PRs to run arbitrary commands (via npm scripts, tests, etc.) that exfiltrate secrets.',
    badExample: 'on: pull_request_target\njobs:\n  build:\n    steps:\n      - uses: actions/checkout@v4\n        with:\n          ref: ${{ github.event.pull_request.head.sha }}',
    goodExample: 'on: pull_request\n# Or if using pull_request_target, never checkout or execute PR head code.',
    remediationGuide: 'Use `pull_request` instead, or avoid checking out and running code from untrusted forks inside `pull_request_target`.'
  },
  async check(context): Promise<RuleResult[]> {
    const results: RuleResult[] = [];
    const workflowFiles = await context.listFiles('.github/workflows/*');

    for (const filePath of workflowFiles) {
      if (!filePath.endsWith('.yml') && !filePath.endsWith('.yaml')) continue;

      const parsed = await context.readYaml<Record<string, unknown>>(filePath);
      if (!parsed) continue;

      const onTrigger = parsed.on ?? parsed.True;
      let triggersOnPRTarget = false;

      if (typeof onTrigger === 'string' && onTrigger === 'pull_request_target') {
        triggersOnPRTarget = true;
      } else if (Array.isArray(onTrigger) && onTrigger.includes('pull_request_target')) {
        triggersOnPRTarget = true;
      } else if (typeof onTrigger === 'object' && onTrigger !== null && 'pull_request_target' in onTrigger) {
        triggersOnPRTarget = true;
      }

      if (!triggersOnPRTarget) continue;

      const content = await context.readFile(filePath);
      if (!content) continue;

      const hasHeadCheckout = /github\.event\.pull_request\.head\.(?:sha|ref)/i.test(content);

      if (hasHeadCheckout) {
        const loc = findLineAndColumn(content, /github\.event\.pull_request\.head\.(?:sha|ref)/i);
        results.push({
          ruleId: 'sec-006',
          ruleTitle: sec006.title,
          category: 'security',
          severity: 'warn',
          file: filePath,
          line: loc?.line,
          column: loc?.column,
          message: `Dangerous pull_request_target checkout detected in "${filePath}"`,
          fixable: false,
          remediation: 'Do not checkout untrusted pull request head references in a pull_request_target workflow.'
        });
      }
    }

    return results;
  }
};
