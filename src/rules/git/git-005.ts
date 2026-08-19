import path from 'node:path';
import fsp from 'node:fs/promises';
import { Rule, RuleResult } from '../../core/types.js';
import { fileExists } from '../../utils/fs.js';

export const git005: Rule = {
  id: 'git-005',
  title: 'No broken symbolic links in repository',
  description: 'Broken symbolic links point to non-existent target files, causing file-read errors during build and packaging.',
  category: 'git',
  defaultSeverity: 'error',
  fixable: false,
  docs: {
    whyItMatters: 'Broken symlinks fail silently or throw ENOENT errors when bundled, tested, or deployed.',
    badExample: 'A symlink pointing to a deleted file or non-existent path.',
    goodExample: 'All symlinks resolve to valid existing paths.',
    remediationGuide: 'Update the symlink target or remove the dead symlink.'
  },
  async check(context): Promise<RuleResult[]> {
    const results: RuleResult[] = [];
    const files = await context.listFiles();

    for (const filePath of files) {
      const fullPath = path.join(context.rootDir, filePath);
      try {
        const lstat = await fsp.lstat(fullPath);
        if (lstat.isSymbolicLink()) {
          const target = await fsp.readlink(fullPath);
          const resolvedTarget = path.isAbsolute(target) ? target : path.resolve(path.dirname(fullPath), target);
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
