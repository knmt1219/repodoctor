import { RuleContext } from '../src/core/types.js';
import { parseJsonSafe, parseYamlSafe } from '../src/utils/parsers.js';

export function createMockContext(files: Record<string, string>, options: { isGitRepo?: boolean; branch?: string } = {}): RuleContext {
  const filePaths = Object.keys(files);

  return {
    rootDir: '/mock/project',
    files: filePaths,
    isGitRepo: options.isGitRepo ?? true,
    gitBranch: options.branch ?? 'main',
    options: {},

    fileExists: async (relPath: string) => {
      return relPath in files;
    },

    dirExists: async (relPath: string) => {
      return filePaths.some(f => f.startsWith(relPath + '/') || f.startsWith(relPath + '\\'));
    },

    readFile: async (relPath: string) => {
      return files[relPath] ?? null;
    },

    readJson: async <T = unknown>(relPath: string) => {
      const content = files[relPath];
      if (!content) return null;
      const parsed = parseJsonSafe<T>(content);
      return parsed.success ? parsed.data : null;
    },

    readYaml: async <T = unknown>(relPath: string) => {
      const content = files[relPath];
      if (!content) return null;
      const parsed = parseYamlSafe<T>(content);
      return parsed.success ? parsed.data : null;
    },

    listFiles: async (pattern?: string) => {
      if (!pattern) return [...filePaths];
      if (pattern.startsWith('*.')) {
        const ext = pattern.slice(1);
        return filePaths.filter(f => f.endsWith(ext));
      }
      if (pattern.includes('*')) {
        const regex = new RegExp('^' + pattern.replace(/\./g, '\\.').replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*') + '$');
        return filePaths.filter(f => regex.test(f));
      }
      return filePaths.filter(f => f === pattern || f.endsWith('/' + pattern));
    }
  };
}
