import { Rule, RuleResult } from '../../core/types.js';

export const oss002: Rule = {
  id: 'oss-002',
  title: 'Repository must have an informative README.md',
  description: 'README is the landing page of any open source repository. It should include the project name, description, installation, and usage instructions.',
  category: 'oss',
  defaultSeverity: 'warn',
  fixable: false,
  docs: {
    whyItMatters: 'A missing or empty README prevents developers from understanding what the project does, how to install it, or how to run it.',
    badExample: '# My Project (empty)',
    goodExample: '# My Project\nA tool that does X.\n## Installation\n...\n## Usage\n...',
    remediationGuide: 'Create or expand README.md with clear problem description, installation guide, and usage examples.'
  },
  async check(context): Promise<RuleResult[]> {
    const results: RuleResult[] = [];
    const readmeCandidates = ['README.md', 'README', 'readme.md', 'README.txt'];
    let foundPath = '';
    let content: string | null = null;

    for (const name of readmeCandidates) {
      if (await context.fileExists(name)) {
        foundPath = name;
        content = await context.readFile(name);
        break;
      }
    }

    if (!foundPath || !content) {
      results.push({
        ruleId: 'oss-002',
        ruleTitle: oss002.title,
        category: 'oss',
        severity: 'warn',
        message: 'Missing README.md file in repository root',
        fixable: false,
        remediation: 'Create a README.md file introducing your project.'
      });
      return results;
    }

    if (content.trim().length < 80) {
      results.push({
        ruleId: 'oss-002',
        ruleTitle: oss002.title,
        category: 'oss',
        severity: 'warn',
        file: foundPath,
        message: `README.md is very brief (${content.trim().length} chars). Consider adding installation, usage, and quickstart documentation.`,
        fixable: false,
        remediation: 'Expand README.md with project features, install instructions, and examples.'
      });
    }

    // Check if it has at least a markdown heading
    if (!content.includes('#')) {
      results.push({
        ruleId: 'oss-002',
        ruleTitle: oss002.title,
        category: 'oss',
        severity: 'info',
        file: foundPath,
        message: 'README.md does not contain any Markdown headings',
        fixable: false,
        remediation: 'Structure README.md using Markdown headings (e.g. # Project Name, ## Features).'
      });
    }

    return results;
  }
};
