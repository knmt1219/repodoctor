import { Rule, RuleResult } from '../../core/types.js';
import { findLineAndColumn } from '../../utils/parsers.js';

export const pkg003: Rule = {
  id: 'pkg-003',
  title: 'Dependencies should avoid wildcard "*" or unconstrained version ranges',
  description: 'Using "*" or "latest" as a dependency version disables semantic versioning safeguards, allowing arbitrary new breaking releases to be pulled into your build.',
  category: 'package',
  defaultSeverity: 'warn',
  fixable: false,
  docs: {
    whyItMatters: 'Wildcard versions allow breaking major releases or untested alpha versions to be installed without warning, leading to sudden build breakage and supply chain vulnerability risks.',
    badExample: '{\n  "dependencies": {\n    "lodash": "*"\n  }\n}',
    goodExample: '{\n  "dependencies": {\n    "lodash": "^4.17.21"\n  }\n}',
    remediationGuide: 'Replace wildcard version strings ("*" or "latest") with explicit semver ranges (e.g. ^1.2.0).'
  },
  async check(context): Promise<RuleResult[]> {
    const results: RuleResult[] = [];
    const pkg = await context.readJson<{
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    }>('package.json');

    if (!pkg) return results;

    const rawContent = (await context.readFile('package.json')) || '';
    const checkDeps = (deps: Record<string, string> | undefined, depType: string) => {
      if (!deps) return;
      for (const [depName, version] of Object.entries(deps)) {
        if (version === '*' || version === 'latest' || version === '') {
          const loc = findLineAndColumn(rawContent, `"${depName}"`);
          results.push({
            ruleId: 'pkg-003',
            ruleTitle: pkg003.title,
            category: 'package',
            severity: 'warn',
            file: 'package.json',
            line: loc?.line,
            column: loc?.column,
            message: `Dependency "${depName}" in ${depType} uses dangerous wildcard version "${version}"`,
            fixable: false,
            remediation: `Specify an explicit semantic version range for "${depName}" (e.g. ^1.0.0).`,
            details: { dependency: depName, version, section: depType }
          });
        }
      }
    };

    checkDeps(pkg.dependencies, 'dependencies');
    checkDeps(pkg.devDependencies, 'devDependencies');

    return results;
  }
};
