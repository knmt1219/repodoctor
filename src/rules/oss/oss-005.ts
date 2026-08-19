import { Rule, RuleResult } from '../../core/types.js';

const SECURITY_CANDIDATES = [
  'SECURITY.md',
  '.github/SECURITY.md',
  'docs/SECURITY.md',
  'security.md'
];

export const oss005: Rule = {
  id: 'oss-005',
  title: 'Repository must have a SECURITY.md vulnerability reporting policy',
  description: 'A SECURITY.md policy informs security researchers how to responsibly disclose security vulnerabilities privately rather than filing public issues.',
  category: 'oss',
  defaultSeverity: 'warn',
  fixable: true,
  docs: {
    whyItMatters: 'Without a clear security policy, researchers might report critical zero-days in public issue trackers, exposing users to zero-day exploitation before a patch is ready.',
    badExample: 'No SECURITY.md in repo.',
    goodExample: 'SECURITY.md explaining supported versions and a private contact email or GitHub Security Advisory reporting link.',
    remediationGuide: 'Add a SECURITY.md with your supported versions table and vulnerability reporting email.'
  },
  async check(context): Promise<RuleResult[]> {
    const results: RuleResult[] = [];
    let found = false;

    for (const p of SECURITY_CANDIDATES) {
      if (await context.fileExists(p)) {
        found = true;
        break;
      }
    }

    if (!found) {
      results.push({
        ruleId: 'oss-005',
        ruleTitle: oss005.title,
        category: 'oss',
        severity: 'warn',
        message: 'Missing SECURITY.md vulnerability reporting policy',
        fixable: true,
        remediation: 'Create a SECURITY.md outlining how to responsibly report vulnerabilities.'
      });
    }

    return results;
  }
};
