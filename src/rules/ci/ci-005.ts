import { Rule, RuleResult } from '../../core/types.js';

const DEPENDENCY_UPDATE_CANDIDATES = [
  '.github/dependabot.yml',
  '.github/dependabot.yaml',
  'dependabot.yml',
  'dependabot.yaml',
  'renovate.json',
  '.renovaterc',
  '.renovaterc.json',
  'renovate.json5',
  '.github/renovate.json',
  '.github/renovate.json5'
];

export const ci005: Rule = {
  id: 'ci-005',
  title: 'Repository should configure automated dependency updates (Dependabot or Renovate)',
  description: 'Automated dependency update tools like Dependabot or Renovate keep dependencies and GitHub Actions pinned and up-to-date, reducing security vulnerabilities and maintainer update burden.',
  category: 'ci',
  defaultSeverity: 'warn',
  fixable: true,
  docs: {
    whyItMatters: 'Manual dependency auditing consumes significant maintainer time. Automated dependency updates create automated PRs for routine patch bumps and security advisories.',
    badExample: 'No .github/dependabot.yml or Renovate configuration present in the repository.',
    goodExample: 'A .github/dependabot.yml configured for npm and github-actions updates.',
    remediationGuide: 'Add a `.github/dependabot.yml` file to configure automated weekly version updates.'
  },
  async check(context): Promise<RuleResult[]> {
    const results: RuleResult[] = [];
    let found = false;

    for (const p of DEPENDENCY_UPDATE_CANDIDATES) {
      if (await context.fileExists(p)) {
        found = true;
        break;
      }
    }

    if (!found) {
      results.push({
        ruleId: 'ci-005',
        ruleTitle: ci005.title,
        category: 'ci',
        severity: 'warn',
        message: 'Missing automated dependency updates configuration (e.g. .github/dependabot.yml or Renovate)',
        fixable: true,
        remediation: 'Create a `.github/dependabot.yml` or `renovate.json` to automate package and GitHub Actions dependency updates.'
      });
    }

    return results;
  }
};
