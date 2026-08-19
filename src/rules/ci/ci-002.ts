import { Rule, RuleResult } from '../../core/types.js';

export const ci002: Rule = {
  id: 'ci-002',
  title: 'Pull request workflows should configure concurrency cancellation',
  description: 'Workflows triggered on pull requests should define `concurrency` with `cancel-in-progress: true` to automatically cancel redundant older builds when a new commit is pushed to the PR branch.',
  category: 'ci',
  defaultSeverity: 'warn',
  fixable: false,
  docs: {
    whyItMatters: 'Pushing rapid commits to an open pull request queues multiple full CI runs. Without concurrency cancellation, your CI backlog swells and consumes unnecessary runner bandwidth.',
    badExample: 'on: [pull_request]\njobs:\n  ...',
    goodExample: 'on: [pull_request]\nconcurrency:\n  group: ${{ github.workflow }}-${{ github.ref }}\n  cancel-in-progress: true\njobs:\n  ...',
    remediationGuide: 'Add a top-level `concurrency` block with `cancel-in-progress: true` to your workflow.'
  },
  async check(context): Promise<RuleResult[]> {
    const results: RuleResult[] = [];
    const workflowFiles = await context.listFiles('.github/workflows/*');

    for (const filePath of workflowFiles) {
      if (!filePath.endsWith('.yml') && !filePath.endsWith('.yaml')) continue;

      const parsed = await context.readYaml<Record<string, unknown>>(filePath);
      if (!parsed) continue;

      const onTrigger = parsed.on ?? parsed.True; // yaml parser might parse 'on' as boolean true
      let triggersOnPR = false;

      if (typeof onTrigger === 'string' && onTrigger === 'pull_request') {
        triggersOnPR = true;
      } else if (Array.isArray(onTrigger) && onTrigger.includes('pull_request')) {
        triggersOnPR = true;
      } else if (typeof onTrigger === 'object' && onTrigger !== null && 'pull_request' in onTrigger) {
        triggersOnPR = true;
      }

      if (triggersOnPR) {
        const hasConcurrency = 'concurrency' in parsed;
        if (!hasConcurrency) {
          results.push({
            ruleId: 'ci-002',
            ruleTitle: ci002.title,
            category: 'ci',
            severity: 'warn',
            file: filePath,
            message: `Workflow "${filePath}" triggers on pull_request but does not configure 'concurrency' cancellation`,
            fixable: false,
            remediation: 'Add `concurrency: { group: "${{ github.workflow }}-${{ github.ref }}", cancel-in-progress: true }`'
          });
        }
      }
    }

    return results;
  }
};
