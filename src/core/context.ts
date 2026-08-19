import path from 'node:path';
import { dirExists, fileExists, isPathInside, normalizePath, readFileSafe, scanDirectory } from '../utils/fs.js';
import { parseJsonSafe, parseYamlSafe } from '../utils/parsers.js';
import { detectGitInfo } from '../utils/git.js';
import { RuleContext } from './types.js';

export interface ContextOptions {
  rootDir: string;
  ignorePatterns?: string[];
  fix?: boolean;
  verbose?: boolean;
  config?: Record<string, unknown>;
}

export async function createRuleContext(options: ContextOptions): Promise<RuleContext> {
  const rootDir = path.resolve(options.rootDir);
  const ignorePatterns = options.ignorePatterns || [];

  const files = await scanDirectory(rootDir, ignorePatterns);
  const fileSet = new Set(files);
  const gitInfo = await detectGitInfo(rootDir);

  // File cache for fast rule execution
  const textCache = new Map<string, Promise<string | null>>();
  const jsonCache = new Map<string, Promise<unknown>>();
  const yamlCache = new Map<string, Promise<unknown>>();

  const context: RuleContext = {
    rootDir,
    files,
    isGitRepo: gitInfo.isGitRepo,
    gitBranch: gitInfo.branch,
    options: {
      fix: options.fix,
      verbose: options.verbose,
      config: options.config
    },

    fileExists: async (relPath: string): Promise<boolean> => {
      const normalized = normalizePath(relPath);
      if (fileSet.has(normalized)) return true;
      const fullPath = path.resolve(rootDir, relPath);
      if (!isPathInside(rootDir, fullPath)) return false;
      return await fileExists(fullPath);
    },

    dirExists: async (relPath: string): Promise<boolean> => {
      const fullPath = path.resolve(rootDir, relPath);
      if (!isPathInside(rootDir, fullPath)) return false;
      return await dirExists(fullPath);
    },

    readFile: async (relPath: string): Promise<string | null> => {
      const normalized = normalizePath(relPath);
      const fullPath = path.resolve(rootDir, relPath);
      if (!isPathInside(rootDir, fullPath)) return null;

      if (!textCache.has(normalized)) {
        textCache.set(normalized, readFileSafe(fullPath, 10 * 1024 * 1024, rootDir));
      }
      return textCache.get(normalized)!;
    },

    readJson: async <T = unknown>(relPath: string): Promise<T | null> => {
      const normalized = normalizePath(relPath);
      if (!jsonCache.has(normalized)) {
        jsonCache.set(
          normalized,
          (async () => {
            const content = await context.readFile(relPath);
            if (!content) return null;
            const parsed = parseJsonSafe<T>(content);
            return parsed.success ? parsed.data : null;
          })()
        );
      }
      return (await jsonCache.get(normalized)) as T | null;
    },

    readYaml: async <T = unknown>(relPath: string): Promise<T | null> => {
      const normalized = normalizePath(relPath);
      if (!yamlCache.has(normalized)) {
        yamlCache.set(
          normalized,
          (async () => {
            const content = await context.readFile(relPath);
            if (!content) return null;
            const parsed = parseYamlSafe<T>(content);
            return parsed.success ? parsed.data : null;
          })()
        );
      }
      return (await yamlCache.get(normalized)) as T | null;
    },

    listFiles: async (pattern?: string): Promise<string[]> => {
      if (!pattern) return [...files];
      const normalizedPattern = normalizePath(pattern);

      if (normalizedPattern.includes('*') || normalizedPattern.includes('?')) {
        const escaped = normalizedPattern
          .replace(/[-/\\^$+.( )|[\]{}]/g, '\\$&')
          .replace(/\*\*/g, '.*')
          .replace(/\*/g, '[^/]*')
          .replace(/\?/g, '.');
        const regex = new RegExp('^' + escaped + '$', 'i');
        return files.filter(f => regex.test(f));
      }

      return files.filter(f => f === normalizedPattern || f.endsWith('/' + normalizedPattern));
    }
  };

  return context;
}
