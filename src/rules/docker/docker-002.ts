import path from 'node:path';
import { Rule, RuleResult } from '../../core/types.js';

function isDockerfile(filePath: string): boolean {
  const base = path.basename(filePath).toLowerCase();
  return base === 'dockerfile' || base.startsWith('dockerfile.') || base.endsWith('.dockerfile');
}

export const docker002: Rule = {
  id: 'docker-002',
  title: 'Repositories with Dockerfiles should include a .dockerignore file',
  description: 'Without a `.dockerignore`, building Docker images copies large local artifacts (like node_modules, .git, test coverage) into the build context, slowing down builds and potentially baking sensitive files into image layers.',
  category: 'docker',
  defaultSeverity: 'warn',
  fixable: true,
  docs: {
    whyItMatters: 'Docker build context without `.dockerignore` sends megabytes or gigabytes of unneeded files to the Docker daemon, degrading build speed and risking secret leakage.',
    badExample: 'Dockerfile exists, but no .dockerignore is present.',
    goodExample: '.dockerignore ignoring node_modules, .git, .env, and dist.',
    remediationGuide: 'Create a `.dockerignore` file ignoring `.git`, `node_modules`, `.env`, and build artifacts.'
  },
  async check(context): Promise<RuleResult[]> {
    const results: RuleResult[] = [];
    const files = await context.listFiles();
    const hasDockerfile = files.some(isDockerfile);

    if (hasDockerfile) {
      const hasDockerignore = await context.fileExists('.dockerignore');
      if (!hasDockerignore) {
        results.push({
          ruleId: 'docker-002',
          ruleTitle: docker002.title,
          category: 'docker',
          severity: 'warn',
          message: 'Dockerfile found but no .dockerignore file exists',
          fixable: true,
          remediation: 'Create a `.dockerignore` file ignoring node_modules, .git, .env, and coverage.'
        });
      }
    }

    return results;
  }
};
