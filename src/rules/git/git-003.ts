import path from 'node:path';
import { Rule, RuleResult } from '../../core/types.js';
import { getFileSize } from '../../utils/fs.js';

const BINARY_EXTENSIONS = new Set([
  '.exe', '.dll', '.so', '.dylib', '.bin', '.iso', '.tar', '.gz', '.zip',
  '.7z', '.rar', '.mp4', '.mov', '.avi', '.mkv', '.mp3', '.wav', '.flac',
  '.psd', '.ai', '.sqlite', '.db', '.parquet'
]);

function parseGitattributesLfsPatterns(content: string): string[] {
  const lfsPatterns: string[] = [];
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    if (trimmed.includes('filter=lfs')) {
      const parts = trimmed.split(/\s+/);
      if (parts[0]) {
        lfsPatterns.push(parts[0]);
      }
    }
  }
  return lfsPatterns;
}

function matchesLfsPattern(filePath: string, lfsPatterns: string[]): boolean {
  for (const pattern of lfsPatterns) {
    if (pattern.startsWith('*.')) {
      const ext = pattern.slice(1);
      if (filePath.endsWith(ext)) return true;
    }
    if (filePath === pattern || filePath.endsWith('/' + pattern)) {
      return true;
    }
  }
  return false;
}

export const git003: Rule = {
  id: 'git-003',
  title: 'Tracked large binary files should use Git LFS or be excluded',
  description: 'Committing large binary files (>1MB) directly into Git permanently inflates clone sizes for all contributors. Use Git LFS or object storage for binary assets.',
  category: 'git',
  defaultSeverity: 'warn',
  fixable: false,
  docs: {
    whyItMatters: 'Git stores entire revisions of binary files without delta compression. A few large binary commits permanently bloat the .git history.',
    badExample: 'Tracking 20MB video or executable files in git repository without Git LFS.',
    goodExample: 'Configuring Git LFS via `.gitattributes` (`*.mp4 filter=lfs diff=lfs merge=lfs -text`).',
    remediationGuide: 'Configure Git LFS in `.gitattributes` or remove large binaries from git history and host them as release assets.'
  },
  async check(context): Promise<RuleResult[]> {
    const results: RuleResult[] = [];
    const files = await context.listFiles();
    const maxSizeKb = 1024; // 1MB threshold

    // Check if .gitattributes configures Git LFS
    let lfsPatterns: string[] = [];
    if (await context.fileExists('.gitattributes')) {
      const attrContent = await context.readFile('.gitattributes');
      if (attrContent) {
        lfsPatterns = parseGitattributesLfsPatterns(attrContent);
      }
    }

    for (const filePath of files) {
      const ext = path.extname(filePath).toLowerCase();
      if (!BINARY_EXTENSIONS.has(ext)) continue;

      // If file is covered by Git LFS, do not flag it
      if (matchesLfsPattern(filePath, lfsPatterns)) {
        continue;
      }

      const fullPath = path.resolve(context.rootDir, filePath);
      const sizeBytes = await getFileSize(fullPath);
      const sizeKb = Math.round(sizeBytes / 1024);

      if (sizeKb > maxSizeKb) {
        results.push({
          ruleId: 'git-003',
          ruleTitle: git003.title,
          category: 'git',
          severity: 'warn',
          file: filePath,
          message: `Large binary file "${filePath}" (${sizeKb} KB) exceeds the ${maxSizeKb} KB threshold and is not tracked via Git LFS`,
          fixable: false,
          remediation: 'Configure Git LFS in `.gitattributes` (e.g. `*.bin filter=lfs diff=lfs merge=lfs -text`) or host it as a release asset.',
          details: { sizeKb, thresholdKb: maxSizeKb }
        });
      }
    }

    return results;
  }
};
