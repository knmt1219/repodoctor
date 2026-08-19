import { Rule, RuleResult } from '../../core/types.js';

const REQUIRED_SECRET_PATTERNS = [
  { pattern: '.env', label: '.env files' },
  { pattern: '*.key', label: 'private key files (*.key)' },
  { pattern: '*.pem', label: 'certificate/key files (*.pem)' }
];

export const sec003: Rule = {
  id: 'sec-003',
  title: '.gitignore must ignore sensitive environment files and private keys',
  description: 'Repositories must have a .gitignore that prevents accidental staging of .env files, private keys (*.key), and certificate keys (*.pem).',
  category: 'security',
  defaultSeverity: 'error',
  fixable: true,
  docs: {
    whyItMatters: 'Accidentally committing secrets, tokens, and .env files to Git is one of the most common vectors for security breaches. Ensuring .gitignore has robust rules reduces this risk.',
    badExample: '# Empty or missing .gitignore\nnode_modules/',
    goodExample: '.env\n.env.local\n.env.*.local\n*.key\n*.pem\nnode_modules/',
    remediationGuide: 'Add `.env`, `.env.*`, `*.key`, and `*.pem` to your `.gitignore`.'
  },
  async check(context): Promise<RuleResult[]> {
    const results: RuleResult[] = [];
    const gitignoreExists = await context.fileExists('.gitignore');

    if (!gitignoreExists) {
      results.push({
        ruleId: 'sec-003',
        ruleTitle: sec003.title,
        category: 'security',
        severity: 'error',
        message: 'Missing .gitignore file in repository root',
        fixable: true,
        remediation: 'Create a .gitignore file ignoring node_modules, .env, *.key, and *.pem'
      });
      return results;
    }

    const content = await context.readFile('.gitignore');
    if (!content) return results;

    const lines = content.split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('#'));
    const missingPatterns: string[] = [];

    for (const { pattern, label } of REQUIRED_SECRET_PATTERNS) {
      const hasMatch = lines.some(l => {
        if (l === pattern) return true;
        if (pattern === '.env' && (l === '.env*' || l === '*.env' || l === '.env.local')) return true;
        if (l.includes(pattern)) return true;
        return false;
      });

      if (!hasMatch) {
        missingPatterns.push(label);
      }
    }

    if (missingPatterns.length > 0) {
      results.push({
        ruleId: 'sec-003',
        ruleTitle: sec003.title,
        category: 'security',
        severity: 'error',
        file: '.gitignore',
        message: `.gitignore is missing recommended secret ignore patterns: ${missingPatterns.join(', ')}`,
        fixable: true,
        remediation: 'Add `.env`, `.env.*`, `*.pem`, and `*.key` to `.gitignore`'
      });
    }

    return results;
  }
};
