import { Rule, RuleResult } from '../../core/types.js';

const LICENSE_CANDIDATES = [
  'LICENSE',
  'LICENSE.md',
  'LICENSE.txt',
  'LICENCE',
  'LICENCE.md',
  'LICENCE.txt'
];

export const oss001: Rule = {
  id: 'oss-001',
  title: 'Open-source repository must have a valid LICENSE file',
  description: 'Without an explicit open source license (such as MIT, Apache-2.0, or BSD), code defaults to exclusive copyright and cannot be safely used or contributed to by the community.',
  category: 'oss',
  defaultSeverity: 'error',
  fixable: false,
  docs: {
    whyItMatters: 'A missing license creates legal ambiguity. Developers and organizations cannot adopt or contribute to the project without clear licensing permissions.',
    badExample: 'Repository has no LICENSE file.',
    goodExample: 'Repository has an OSI-approved LICENSE file (e.g. MIT, Apache-2.0).',
    remediationGuide: 'Add a LICENSE file in the repository root containing your chosen open source license.'
  },
  async check(context): Promise<RuleResult[]> {
    const results: RuleResult[] = [];
    let found = false;
    let empty = false;
    let foundPath = '';

    for (const name of LICENSE_CANDIDATES) {
      if (await context.fileExists(name)) {
        found = true;
        foundPath = name;
        const content = await context.readFile(name);
        if (!content || content.trim().length < 20) {
          empty = true;
        }
        break;
      }
    }

    if (!found) {
      results.push({
        ruleId: 'oss-001',
        ruleTitle: oss001.title,
        category: 'oss',
        severity: 'error',
        message: 'No LICENSE file found in repository root',
        fixable: false,
        remediation: 'Create a LICENSE file (e.g., MIT or Apache-2.0) in the root directory.'
      });
    } else if (empty) {
      results.push({
        ruleId: 'oss-001',
        ruleTitle: oss001.title,
        category: 'oss',
        severity: 'error',
        file: foundPath,
        message: `License file "${foundPath}" is empty or too short`,
        fixable: false,
        remediation: 'Fill in the full text of your chosen license (including year and copyright holder).'
      });
    }

    return results;
  }
};
