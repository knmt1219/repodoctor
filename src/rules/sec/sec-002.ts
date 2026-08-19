import { Rule, RuleResult } from '../../core/types.js';
import { findLineAndColumn } from '../../utils/parsers.js';

export const sec002: Rule = {
  id: 'sec-002',
  title: 'GitHub Actions workflows must declare explicit minimal permissions',
  description: 'Workflows without explicit `permissions:` block inherit default repository token permissions which may include broad write access. Explicitly declare `permissions: read-all` or job-level permissions.',
  category: 'security',
  defaultSeverity: 'warn',
  fixable: true,
  docs: {
    whyItMatters: 'By default, GITHUB_TOKEN in workflows might have write access to issues, pull requests, contents, or packages. If a compromised dependency runs during CI, it could abuse write permissions. Following the principle of least privilege limits blast radius.',
    badExample: 'name: CI\non: [push]\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps: [...]',
    goodExample: 'name: CI\non: [push]\npermissions:\n  contents: read\njobs:\n  build:\n    ...',
    remediationGuide: 'Add a top-level `permissions: read-all` or `permissions: { contents: read }` to your workflow file.'
  },
  async check(context): Promise<RuleResult[]> {
    const results: RuleResult[] = [];
    const workflowFiles = await context.listFiles('.github/workflows/*.yml');
    const yamlWorkflowFiles = await context.listFiles('.github/workflows/*.yaml');
    const allWorkflows = Array.from(new Set([...workflowFiles, ...yamlWorkflowFiles]));

    for (const filePath of allWorkflows) {
      const content = await context.readFile(filePath);
      if (!content) continue;

      const parsed = await context.readYaml<Record<string, unknown>>(filePath);
      if (!parsed || typeof parsed !== 'object') continue;

      // Check top-level permissions
      const hasTopLevelPerms = 'permissions' in parsed;
      const jobs = (parsed.jobs as Record<string, Record<string, unknown>>) || {};

      let hasAllJobPerms = Object.keys(jobs).length > 0;
      for (const jobName of Object.keys(jobs)) {
        const job = jobs[jobName];
        if (!job || typeof job !== 'object' || !('permissions' in job)) {
          hasAllJobPerms = false;
          break;
        }
      }

      if (!hasTopLevelPerms && !hasAllJobPerms) {
        results.push({
          ruleId: 'sec-002',
          ruleTitle: sec002.title,
          category: 'security',
          severity: 'warn',
          file: filePath,
          line: 1,
          column: 1,
          message: `Workflow "${filePath}" does not declare top-level or job-level 'permissions:' block`,
          fixable: true,
          remediation: 'Add `permissions: read-all` or specific granular permissions at the top of the workflow'
        });
      }

      // Check if permissions is "write-all"
      if (parsed.permissions === 'write-all') {
        const loc = findLineAndColumn(content, /permissions:\s*write-all/);
        results.push({
          ruleId: 'sec-002',
          ruleTitle: sec002.title,
          category: 'security',
          severity: 'warn',
          file: filePath,
          line: loc?.line,
          column: loc?.column,
          message: `Workflow "${filePath}" declares dangerous 'permissions: write-all'`,
          fixable: false,
          remediation: 'Restrict permissions to only the scopes required by the workflow (e.g. contents: read, issues: write)'
        });
      }
    }

    return results;
  }
};
