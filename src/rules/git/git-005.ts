import path from 'node:path';
import fsp from 'node:fs/promises';
import { Rule, RuleResult } from '../../core/types.js';
import { fileExists, dirExists, isPathInside, normalizePath } from '../../utils/fs.js';

const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'dist-test',
  'build',
  'coverage',
  '.next',
  '.turbo',
  'vendor',
  'target'
]);

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
    const visitedSymlinks = new Set<string>();

    const canonicalRoot = await fsp.realpath(context.rootDir).catch(() => path.resolve(context.rootDir));

    async function inspectSymlink(fullPath: string, relPath: string): Promise<void> {
      const normalizedRel = normalizePath(relPath);
      if (visitedSymlinks.has(normalizedRel)) return;
      visitedSymlinks.add(normalizedRel);

      try {
        const target = await fsp.readlink(fullPath);
        const resolvedTarget = path.isAbsolute(target) ? target : path.resolve(path.dirname(fullPath), target);

        // Check if symlink escapes repository boundary
        if (!isPathInside(context.rootDir, resolvedTarget)) {
          results.push({
            ruleId: 'git-005',
            ruleTitle: git005.title,
            category: 'git',
            severity: 'error',
            file: normalizedRel,
            message: `Symbolic link "${normalizedRel}" escapes repository root (points to "${target}")`,
            fixable: false,
            remediation: 'Ensure symbolic links only reference files within the repository boundary.'
          });
          return;
        }

        // Canonical realpath check for chained escapes
        const realTarget = await fsp.realpath(resolvedTarget).catch(() => null);
        if (realTarget && !isPathInside(canonicalRoot, realTarget)) {
          results.push({
            ruleId: 'git-005',
            ruleTitle: git005.title,
            category: 'git',
            severity: 'error',
            file: normalizedRel,
            message: `Symbolic link "${normalizedRel}" resolves outside repository root`,
            fixable: false,
            remediation: 'Ensure symbolic links only reference files within the repository boundary.'
          });
          return;
        }

        // Check if destination exists
        const existsAsFile = await fileExists(resolvedTarget);
        const existsAsDir = await dirExists(resolvedTarget);
        if (!existsAsFile && !existsAsDir) {
          results.push({
            ruleId: 'git-005',
            ruleTitle: git005.title,
            category: 'git',
            severity: 'error',
            file: normalizedRel,
            message: `Broken symbolic link "${normalizedRel}" points to non-existent target "${target}"`,
            fixable: false,
            remediation: 'Fix the target destination or remove the broken symlink.'
          });
        }
      } catch {
        // Ignore readlink errors
      }
    }

    const visitedRealDirs = new Set<string>();

    async function scanDir(currentDir: string, currentRel: string): Promise<void> {
      const realCurrent = await fsp.realpath(currentDir).catch(() => null);
      if (!realCurrent || visitedRealDirs.has(realCurrent)) return;
      visitedRealDirs.add(realCurrent);

      try {
        const entries = await fsp.readdir(currentDir, { withFileTypes: true });
        for (const entry of entries) {
          if (IGNORED_DIRS.has(entry.name)) continue;

          const fullPath = path.join(currentDir, entry.name);
          const relPath = currentRel ? `${currentRel}/${entry.name}` : entry.name;

          if (entry.isSymbolicLink()) {
            await inspectSymlink(fullPath, relPath);
          } else if (entry.isDirectory()) {
            await scanDir(fullPath, relPath);
          }
        }
      } catch {
        // Ignore readdir errors
      }
    }

    // 1. Scan filesystem directly for all symlinks (including broken ones)
    await scanDir(context.rootDir, '');

    // 2. Also check files in context.files in case any virtual or custom file was passed
    const files = await context.listFiles();
    for (const filePath of files) {
      const fullPath = path.resolve(context.rootDir, filePath);
      try {
        const lstat = await fsp.lstat(fullPath);
        if (lstat.isSymbolicLink()) {
          await inspectSymlink(fullPath, filePath);
        }
      } catch {
        // Ignore
      }
    }

    return results;
  }
};
