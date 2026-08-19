import { Rule, RuleResult } from '../../core/types.js';
import { findLineAndColumn } from '../../utils/parsers.js';

export const docker001: Rule = {
  id: 'docker-001',
  title: 'Dockerfiles should pin base images to specific version tags or digests',
  description: 'Using `FROM image:latest` or `FROM image` in Dockerfiles creates non-deterministic container builds and risks deploying untested breaking base image updates.',
  category: 'docker',
  defaultSeverity: 'warn',
  fixable: false,
  docs: {
    whyItMatters: 'The `:latest` tag in Docker registries mutates over time. Builds that succeeded yesterday may fail today if the upstream base image updates dependencies or OS libraries.',
    badExample: 'FROM node:latest\nFROM ubuntu',
    goodExample: 'FROM node:20.17-alpine\nFROM node@sha256:7f4c0...',
    remediationGuide: 'Pin your base image to a specific version or immutable digest tag.'
  },
  async check(context): Promise<RuleResult[]> {
    const results: RuleResult[] = [];
    const files = await context.listFiles();
    const dockerFiles = files.filter(f => f.toLowerCase().includes('dockerfile'));

    for (const filePath of dockerFiles) {
      const content = await context.readFile(filePath);
      if (!content) continue;

      const fromRegex = /^FROM\s+([^\s]+)/gim;
      let match: RegExpExecArray | null;

      while ((match = fromRegex.exec(content)) !== null) {
        const fullImage = match[1]!;
        // Check if image has tag or sha
        if (fullImage.includes(':latest') || (!fullImage.includes(':') && !fullImage.includes('@'))) {
          const loc = findLineAndColumn(content, match[0]);
          results.push({
            ruleId: 'docker-001',
            ruleTitle: docker001.title,
            category: 'docker',
            severity: 'warn',
            file: filePath,
            line: loc?.line,
            column: loc?.column,
            message: `Base image "${fullImage}" in "${filePath}" is unpinned or using ':latest'`,
            fixable: false,
            remediation: `Pin "${fullImage}" to a specific version tag or immutable SHA digest.`
          });
        }
      }
    }

    return results;
  }
};
