import path from 'node:path';
import fsp from 'node:fs/promises';
import { Rule, RuleResult } from '../../core/types.js';
import { dirExists, normalizePath } from '../../utils/fs.js';

export const git004: Rule = {
  id: 'git-004',
  title: 'No nested .git directories (untracked submodules or cloned repos)',
  description: 'Detects nested `.git` folders inside subdirectories. These usually happen when cloning a repository inside another repository without properly registering it as a Git submodule, causing files inside to be ignored or untracked.',
  category: 'git',
  defaultSeverity: 'error',
  fixable: false,
  docs: {
    whyItMatters: 'Git treats any subdirectory containing `.git` as an embedded repository and ignores its files, leading to missing source files in the parent repo.',
    badExample: 'A nested `.git` directory at `packages/subpkg/.git/` that is not a submodule.',
    goodExample: 'All nested packages are part of the root git repo or registered as proper `.gitmodules`.',
    remediationGuide: 'Remove the nested `.git` directory or register it as a formal submodule using `git submodule add`.'
  },
  async check(context): Promise<RuleResult[]> {
    const results: RuleResult[] = [];

    // Parse .gitmodules to know registered submodules
    const registeredSubmodules = new Set<string>();
    if (await context.fileExists('.gitmodules')) {
      const gitmodules = await context.readFile('.gitmodules');
      if (gitmodules) {
        const pathMatches = gitmodules.matchAll(/^\s*path\s*=\s*(.+)$/gm);
        for (const match of pathMatches) {
          if (match[1]) {
            registeredSubmodules.add(normalizePath(match[1].trim()));
          }
        }
      }
    }

    // Inspect direct subdirectories in rootDir
    try {
      const entries = await fsp.readdir(context.rootDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && entry.name !== '.git' && entry.name !== 'node_modules' && entry.name !== 'dist') {
          const subDir = path.join(context.rootDir, entry.name);
          const nestedGit = path.join(subDir, '.git');
          const relSubDir = normalizePath(entry.name);

          if ((await dirExists(nestedGit)) && !registeredSubmodules.has(relSubDir)) {
            results.push({
              ruleId: 'git-004',
              ruleTitle: git004.title,
              category: 'git',
              severity: 'error',
              file: `${relSubDir}/.git`,
              message: `Unregistered nested .git directory detected in "${relSubDir}"`,
              fixable: false,
              remediation: `Remove "${relSubDir}/.git" or register it as a formal git submodule.`
            });
          }
        }
      }
    } catch {
      // Ignore directory read errors
    }

    return results;
  }
};
