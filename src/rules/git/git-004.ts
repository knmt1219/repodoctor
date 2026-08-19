import path from 'node:path';
import fsp from 'node:fs/promises';
import { Rule, RuleResult } from '../../core/types.js';
import { fileExists, normalizePath } from '../../utils/fs.js';

const IGNORED_DIRS = new Set([
  'node_modules',
  'dist',
  'dist-test',
  'build',
  'coverage',
  '.next',
  '.turbo',
  'vendor',
  'target'
]);

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

    // Recursively scan subdirectories for nested .git
    async function scanDir(currentDir: string, currentRel: string, depth: number): Promise<void> {
      if (depth > 6) return; // Prevent excessive recursion depth

      try {
        const entries = await fsp.readdir(currentDir, { withFileTypes: true });
        for (const entry of entries) {
          if (IGNORED_DIRS.has(entry.name)) continue;

          const fullPath = path.join(currentDir, entry.name);
          const relPath = currentRel ? `${currentRel}/${entry.name}` : entry.name;
          const normalizedRel = normalizePath(relPath);

          if (entry.isDirectory()) {
            if (entry.name === '.git') {
              // Root .git is valid; any nested .git is a violation unless registered
              if (currentRel && !registeredSubmodules.has(normalizePath(currentRel))) {
                results.push({
                  ruleId: 'git-004',
                  ruleTitle: git004.title,
                  category: 'git',
                  severity: 'error',
                  file: `${normalizedRel}`,
                  message: `Unregistered nested .git directory detected in "${currentRel}"`,
                  fixable: false,
                  remediation: `Remove "${normalizedRel}" or register it as a formal git submodule.`
                });
              }
              continue; // Do not recurse inside .git
            }

            // Also check if this subdirectory contains a .git file (e.g. submodule pointer)
            const nestedGitFile = path.join(fullPath, '.git');
            if (await fileExists(nestedGitFile)) {
              if (!registeredSubmodules.has(normalizedRel)) {
                results.push({
                  ruleId: 'git-004',
                  ruleTitle: git004.title,
                  category: 'git',
                  severity: 'error',
                  file: `${normalizedRel}/.git`,
                  message: `Unregistered nested .git submodule file detected in "${normalizedRel}"`,
                  fixable: false,
                  remediation: `Register "${normalizedRel}" in .gitmodules or remove the nested .git file.`
                });
              }
            }

            await scanDir(fullPath, relPath, depth + 1);
          }
        }
      } catch {
        // Ignore unreadable directories
      }
    }

    await scanDir(context.rootDir, '', 0);

    return results;
  }
};
