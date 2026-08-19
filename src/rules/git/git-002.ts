import { Rule, RuleResult } from '../../core/types.js';
import { parseLines } from '../../utils/parsers.js';

const CONFLICT_START = /^<{7}(?:\s+.*)?$/m;
const CONFLICT_MID = /^={7}$/m;
const CONFLICT_END = /^>{7}(?:\s+.*)?$/m;

export const git002: Rule = {
  id: 'git-002',
  title: 'No unresolved git merge conflict markers in tracked files',
  description: 'Detects unresolved merge conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`) accidentally committed to the repository.',
  category: 'git',
  defaultSeverity: 'error',
  fixable: false,
  docs: {
    whyItMatters: 'Committed merge conflict markers result in instant syntax errors, broken builds, or corrupted data files in production.',
    badExample: '<<<<<<< HEAD\nconst x = 1;\n=======\nconst x = 2;\n>>>>>>> feature-branch',
    goodExample: 'const x = 2; // Resolved properly',
    remediationGuide: 'Locate the conflict markers, resolve the conflicting changes, and remove all marker lines.'
  },
  async check(context): Promise<RuleResult[]> {
    const results: RuleResult[] = [];
    const files = await context.listFiles();

    for (const filePath of files) {
      // Skip test fixtures or markdown rule documentation that intentionally shows examples
      if (filePath.includes('test') || filePath.includes('fixture') || filePath.endsWith('git-002.ts')) {
        continue;
      }

      const content = await context.readFile(filePath);
      if (!content) continue;

      const hasStart = CONFLICT_START.test(content);
      const hasEnd = CONFLICT_END.test(content);
      const hasMid = CONFLICT_MID.test(content);

      if (hasStart && (hasEnd || hasMid)) {
        const lines = parseLines(content);
        let firstLine = 1;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i]!.startsWith('<<<<<<<')) {
            firstLine = i + 1;
            break;
          }
        }

        results.push({
          ruleId: 'git-002',
          ruleTitle: git002.title,
          category: 'git',
          severity: 'error',
          file: filePath,
          line: firstLine,
          column: 1,
          message: `Unresolved git merge conflict markers found in "${filePath}"`,
          fixable: false,
          remediation: 'Resolve the git conflict and remove all `<<<<<<<`, `=======`, and `>>>>>>>` markers.'
        });
      }
    }

    return results;
  }
};
