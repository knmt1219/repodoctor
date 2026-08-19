import { Rule, RuleResult } from '../../core/types.js';

const STANDARD_SCRIPTS = ['test'];

export const pkg004: Rule = {
  id: 'pkg-004',
  title: 'package.json should define standard lifecycle scripts (test, build, lint)',
  description: 'Standard lifecycle scripts (especially "test") provide an unambiguous interface for contributors and CI pipelines to execute validation suites.',
  category: 'package',
  defaultSeverity: 'warn',
  fixable: true,
  docs: {
    whyItMatters: 'Contributors and automated tools rely on standard `npm test` and `npm run build` commands to verify changes. Missing scripts require contributors to guess commands.',
    badExample: '{\n  "scripts": {}\n}',
    goodExample: '{\n  "scripts": {\n    "test": "node --test",\n    "build": "tsc"\n  }\n}',
    remediationGuide: 'Define standard scripts in `package.json#scripts`.'
  },
  async check(context): Promise<RuleResult[]> {
    const results: RuleResult[] = [];
    const pkg = await context.readJson<{ scripts?: Record<string, string> }>('package.json');

    if (!pkg) return results;

    const scripts = pkg.scripts || {};
    const missing: string[] = [];

    for (const script of STANDARD_SCRIPTS) {
      if (!scripts[script] || scripts[script]?.trim().length === 0 || scripts[script]?.includes('no test specified')) {
        missing.push(script);
      }
    }

    if (missing.length > 0) {
      results.push({
        ruleId: 'pkg-004',
        ruleTitle: pkg004.title,
        category: 'package',
        severity: 'warn',
        file: 'package.json',
        message: `package.json is missing standard executable script(s): ${missing.join(', ')}`,
        fixable: true,
        remediation: `Add a functional "${missing[0]}" script in package.json.`
      });
    }

    return results;
  }
};
