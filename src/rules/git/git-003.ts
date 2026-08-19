import path from 'node:path';
import { Rule, RuleResult } from '../../core/types.js';
import { getFileSize } from '../../utils/fs.js';

const BINARY_EXTENSIONS = new Set([
  '.exe', '.dll', '.so', '.dylib', '.bin', '.iso', '.tar', '.gz', '.zip',
  '.7z', '.rar', '.mp4', '.mov', '.avi', '.mkv', '.mp3', '.wav', '.flac',
  '.psd', '.ai', '.sqlite', '.db', '.parquet'
]);

export const git003: Rule = {
  id: 'git-003',
  title: 'Tracked large binary files should use Git LFS or be excluded',
  description: 'Committing large binary files (>1MB) directly into Git permanently inflates clone sizes for all contributors. Use Git LFS or object storage for binary assets.',
  category: 'git',
  defaultSeverity: 'warn',
  fixable: false,
  docs: {
    whyItMatters: 'Git stores entire revisions of binary files without delta compression. A few large binary commits permanently bloat the .git history.',
    badExample: 'Tracking 20MB video or executable files in git repository.',
    goodExample: 'Configuring Git LFS via `.gitattributes` (`*.mp4 filter=lfs diff=lfs merge=lfs -text`).',
    remediationGuide: 'Remove large binaries from git history and track them via Git LFS or release attachments.'
  },
  async check(context): Promise<RuleResult[]> {
    const results: RuleResult[] = [];
    const files = await context.listFiles();
    const maxSizeKb = 1024; // 1MB threshold

    for (const filePath of files) {
      const ext = path.extname(filePath).toLowerCase();
      if (!BINARY_EXTENSIONS.has(ext)) continue;

      const fullPath = path.join(context.rootDir, filePath);
      const sizeBytes = await getFileSize(fullPath);
      const sizeKb = Math.round(sizeBytes / 1024);

      if (sizeKb > maxSizeKb) {
        results.push({
          ruleId: 'git-003',
          ruleTitle: git003.title,
          category: 'git',
          severity: 'warn',
          file: filePath,
          message: `Large binary file "${filePath}" (${sizeKb} KB) exceeds the ${maxSizeKb} KB threshold`,
          fixable: false,
          remediation: 'Consider tracking this binary file with Git LFS (Large File Storage) or hosting it as a release asset.',
          details: { sizeKb, thresholdKb: maxSizeKb }
        });
      }
    }

    return results;
  }
};
