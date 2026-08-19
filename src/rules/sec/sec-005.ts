import path from 'node:path';
import { Rule, RuleResult } from '../../core/types.js';
import { containsSecretPattern } from '../../utils/redact.js';
import { parseLines } from '../../utils/parsers.js';
import { getFileSize } from '../../utils/fs.js';

const SKIP_EXTENSIONS = new Set([
  '.lock', '.lockb', '.min.js', '.min.css', '.map',
  '.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf', '.zip', '.tar', '.gz',
  '.exe', '.dll', '.so', '.dylib', '.bin', '.parquet', '.db', '.sqlite'
]);

export const sec005: Rule = {
  id: 'sec-005',
  title: 'No plaintext credentials, tokens, or private keys in repository files',
  description: 'Scans tracked files for high-entropy tokens, API keys (OpenAI, AWS, Slack, GitHub tokens), and private key headers. Sensitive credentials must be injected via environment variables or secret managers.',
  category: 'security',
  defaultSeverity: 'error',
  fixable: false,
  docs: {
    whyItMatters: 'Committed secrets in version control are easily harvested by bots and malicious actors, leading to data breaches, unauthorized infrastructure charges, and account takeover.',
    badExample: 'const apiKey = "sk-proj-9876543210abcdef...";',
    goodExample: 'const apiKey = process.env.API_KEY;',
    remediationGuide: 'Immediately revoke/rotate the exposed credential, remove it from git history using git-filter-repo, and use environment secrets instead.'
  },
  async check(context): Promise<RuleResult[]> {
    const results: RuleResult[] = [];
    const files = await context.listFiles();

    for (const filePath of files) {
      // Skip test fixtures, lockfiles, minified files, binary extensions, or repodoctor rule files themselves
      const ext = path.extname(filePath).toLowerCase();
      if (
        SKIP_EXTENSIONS.has(ext) ||
        filePath.includes('test') ||
        filePath.includes('fixture') ||
        filePath.endsWith('redact.ts') ||
        filePath.endsWith('sec-005.ts')
      ) {
        continue;
      }

      const fullPath = path.resolve(context.rootDir, filePath);
      const size = await getFileSize(fullPath);
      if (size > 1024 * 1024) {
        // Skip files > 1MB from line-by-line regex scanning
        continue;
      }

      const content = await context.readFile(filePath);
      if (!content) continue;

      const lines = parseLines(content);
      for (let i = 0; i < lines.length; i++) {
        const lineText = lines[i]!;
        const secretCheck = containsSecretPattern(lineText);
        if (secretCheck.match) {
          results.push({
            ruleId: 'sec-005',
            ruleTitle: sec005.title,
            category: 'security',
            severity: 'error',
            file: filePath,
            line: i + 1,
            column: 1,
            message: `Potential hardcoded secret detected (${secretCheck.patternName}): ${secretCheck.snippet}`,
            fixable: false,
            remediation: 'Rotate this secret immediately and move it to an environment variable or secrets manager.'
          });
          // Limit to 1 report per file to avoid flooding
          break;
        }
      }
    }

    return results;
  }
};
