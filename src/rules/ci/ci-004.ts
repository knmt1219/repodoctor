import { Rule, RuleResult } from '../../core/types.js';

export const ci004: Rule = {
  id: 'ci-004',
  title: 'Multi-OS or multi-version matrices should configure fail-fast explicitly',
  description: 'When running test matrices across multiple platforms or Node/Python versions, setting `fail-fast: false` ensures all matrix combinations finish testing even if one platform fails, providing complete diagnostic feedback.',
  category: 'ci',
  defaultSeverity: 'info',
  fixable: false,
  docs: {
    whyItMatters: 'With the default `fail-fast: true`, the first failing OS immediately cancels all other OS jobs. You lose visibility into whether the failure is platform-specific (e.g. Windows only) or universal.',
    badExample: 'strategy:\n  matrix:\n    os: [ubuntu-latest, windows-latest, macos-latest]\n    node: [18, 20, 22]',
    goodExample: 'strategy:\n  fail-fast: false\n  matrix:\n    os: [ubuntu-latest, windows-latest, macos-latest]\n    node: [18, 20, 22]',
    remediationGuide: 'Add `fail-fast: false` under your `strategy:` definition if you want full matrix results.'
  },
  async check(context): Promise<RuleResult[]> {
    const results: RuleResult[] = [];
    const workflowFiles = await context.listFiles('.github/workflows/*');

    for (const filePath of workflowFiles) {
      if (!filePath.endsWith('.yml') && !filePath.endsWith('.yaml')) continue;

      const parsed = await context.readYaml<{
        jobs?: Record<string, {
          strategy?: {
            matrix?: Record<string, unknown[]>;
            'fail-fast'?: boolean;
          };
        }>;
      }>(filePath);

      if (!parsed || !parsed.jobs) continue;

      for (const [jobName, jobDef] of Object.entries(parsed.jobs)) {
        if (!jobDef || !jobDef.strategy || !jobDef.strategy.matrix) continue;

        const matrixKeys = Object.keys(jobDef.strategy.matrix);
        let totalCombinations = 1;
        for (const k of matrixKeys) {
          const val = jobDef.strategy.matrix[k];
          if (Array.isArray(val)) {
            totalCombinations *= val.length;
          }
        }

        if (totalCombinations >= 4 && jobDef.strategy['fail-fast'] === undefined) {
          results.push({
            ruleId: 'ci-004',
            ruleTitle: ci004.title,
            category: 'ci',
            severity: 'info',
            file: filePath,
            message: `Job "${jobName}" has a large matrix (${totalCombinations} jobs) without explicit 'fail-fast' configuration`,
            fixable: false,
            remediation: 'Explicitly configure `fail-fast: false` under `strategy:` to preserve cross-platform test results on failure.'
          });
        }
      }
    }

    return results;
  }
};
