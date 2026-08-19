import { Rule, RuleResult } from '../../core/types.js';

export const oss008: Rule = {
  id: 'oss-008',
  title: 'Project manifest should contain description and repository URL metadata',
  description: 'Package manifests (package.json, pyproject.toml, Cargo.toml) should specify a concise description and a repository URL so users and package registries can link to source code.',
  category: 'oss',
  defaultSeverity: 'warn',
  fixable: false,
  docs: {
    whyItMatters: 'Missing repository metadata makes published packages difficult to audit, trace back to source repositories, or verify authenticity on registries like npm or PyPI.',
    badExample: '{\n  "name": "my-pkg",\n  "version": "1.0.0"\n}',
    goodExample: '{\n  "name": "my-pkg",\n  "description": "Awesome tool",\n  "repository": "https://github.com/org/repo"\n}',
    remediationGuide: 'Add `description` and `repository` fields to your package.json, pyproject.toml, or Cargo.toml.'
  },
  async check(context): Promise<RuleResult[]> {
    const results: RuleResult[] = [];

    // Check package.json if present
    if (await context.fileExists('package.json')) {
      const pkg = await context.readJson<{ description?: string; repository?: unknown; private?: boolean }>('package.json');
      if (pkg) {
        // If package is explicitly marked private, repository/description is less critical
        const isPrivate = pkg.private === true;

        if (!pkg.description || pkg.description.trim().length === 0) {
          results.push({
            ruleId: 'oss-008',
            ruleTitle: oss008.title,
            category: 'oss',
            severity: isPrivate ? 'info' : 'warn',
            file: 'package.json',
            message: 'package.json is missing a "description" field',
            fixable: false,
            remediation: 'Add a "description" string in package.json explaining the package purpose.'
          });
        }
        if (!pkg.repository && !isPrivate) {
          results.push({
            ruleId: 'oss-008',
            ruleTitle: oss008.title,
            category: 'oss',
            severity: 'warn',
            file: 'package.json',
            message: 'package.json is missing a "repository" field',
            fixable: false,
            remediation: 'Add a "repository" field in package.json pointing to your GitHub repository.'
          });
        }
      }
    }

    // Check pyproject.toml if present
    if (await context.fileExists('pyproject.toml')) {
      const content = await context.readFile('pyproject.toml');
      if (content) {
        if (!content.includes('description =')) {
          results.push({
            ruleId: 'oss-008',
            ruleTitle: oss008.title,
            category: 'oss',
            severity: 'warn',
            file: 'pyproject.toml',
            message: 'pyproject.toml appears to be missing a "description" entry in project metadata',
            fixable: false,
            remediation: 'Add `description = "..."` under `[project]` or `[tool.poetry]` in pyproject.toml.'
          });
        }
      }
    }

    return results;
  }
};
