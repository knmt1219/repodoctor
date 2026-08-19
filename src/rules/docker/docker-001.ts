import path from 'node:path';
import { Rule, RuleResult } from '../../core/types.js';
import { findLineAndColumn, parseLines } from '../../utils/parsers.js';

function isDockerfile(filePath: string): boolean {
  const base = path.basename(filePath).toLowerCase();
  return base === 'dockerfile' || base.startsWith('dockerfile.') || base.endsWith('.dockerfile');
}

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
    const dockerFiles = files.filter(isDockerfile);

    for (const filePath of dockerFiles) {
      const content = await context.readFile(filePath);
      if (!content) continue;

      const lines = parseLines(content);
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]!;
        const trimmed = line.trim();
        if (trimmed.startsWith('#')) continue;

        // Match FROM with optional --platform flag and AS alias
        const fromMatch = /^FROM\s+(?:--platform=\S+\s+)?([^\s]+)(?:\s+AS\s+\S+)?/i.exec(trimmed);
        if (!fromMatch) continue;

        const fullImage = fromMatch[1]!;
        // Skip scratch or local stage aliases (e.g. FROM builder AS app)
        if (fullImage.toLowerCase() === 'scratch') continue;

        // Check if image has tag or sha
        if (fullImage.includes(':latest') || (!fullImage.includes(':') && !fullImage.includes('@'))) {
          const loc = findLineAndColumn(content, fromMatch[0]);
          results.push({
            ruleId: 'docker-001',
            ruleTitle: docker001.title,
            category: 'docker',
            severity: 'warn',
            file: filePath,
            line: loc?.line ?? (i + 1),
            column: loc?.column ?? 1,
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
