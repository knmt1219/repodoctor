import path from 'node:path';
import fsp from 'node:fs/promises';
import { Rule, RuleResult } from '../../core/types.js';
import { fileExists, isPathInside } from '../../utils/fs.js';

export const git005: Rule = {
  id: 'git-005',
  title: 'No broken or escaping symbolic links in repository',
  description: 'Broken symbolic links point to non-existent target files, and escaping symlinks point outside the repository boundary, causing security risks or file-read errors during build and packaging.',
  category: 'git',
  defaultSeverity: 'error',
  fixable: false,
  docs: {
    whyItMatters: 'Broken symlinks fail silently or throw ENOENT errors when bundled, tested, or deployed. Escaping symlinks can cause accidental disclosure of host files during archive packaging.',
    badExample: 'A symlink pointing to a deleted file or to `../../../../etc/passwd`.',
    goodExample: 'All symlinks resolve to valid existing paths within the repository.',
    remediationGuide: 'Update the symlink target or remove the dead/escaping symlink.'
  },
  async check(context): Promise<RuleResult[]> {
    const results: RuleResult[] = [];
    const files = await context.listFiles();

    for (const filePath of files) {
      const fullPath = path.resolve(context.rootDir, filePath);
      try {
        const lstat = await fsp.lstat(fullPath);
        if (lstat.isSymbolicLink()) {
          const target = await fsp.readlink(fullPath);
          const resolvedTarget = path.isAbsolute(target) ? target : path.resolve(path.dirname(fullPath), target);

          // Check if symlink escapes repository boundary
          if (!isPathInside(context.rootDir, resolvedTarget)) {
            results.push({
              ruleId: 'git-005',
              ruleTitle: git005.title,
              category: 'git',
              severity: 'error',
              file: filePath,
              message: `Symbolic link "${filePath}" escapes repository root (points to "${target}")`,
              fixable: false,
              remediation: 'Ensure symbolic links only reference files within the repository boundary.'
            });
            continue;
          }

          // Check if destination exists
          const targetExists = await fileExists(resolvedTarget);
          if (!targetExists) {
            results.push({
              ruleId: 'git-005',
              ruleTitle: git005.title,
              category: 'git',
              severity: 'error',
              file: filePath,
              message: `Broken symbolic link "${filePath}" points to non-existent target "${target}"`,
              fixable: false,
              remediation: 'Fix the target destination or remove the broken symlink.'
            });
          }
        }
      } catch {
        // Ignore stat errors for non-existent virtual paths
      }
    }

    return results;
  }
};
