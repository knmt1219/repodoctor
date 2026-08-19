import { Rule, RuleResult } from '../../core/types.js';
import { findLineAndColumn } from '../../utils/parsers.js';

const PIPE_EXEC_REGEX = /(?:curl|wget)\s+[^\n|;]+\|\s*(?:ba)?sh/i;

export const sec004: Rule = {
  id: 'sec-004',
  title: 'Avoid piping remote scripts directly to shell execution (curl | sh)',
  description: 'Piping untrusted remote scripts directly into bash/sh (e.g. `curl -fsSL https://... | sh`) in CI or package scripts bypasses integrity verification and opens the repository to code execution exploits.',
  category: 'security',
  defaultSeverity: 'error',
  fixable: false,
  docs: {
    whyItMatters: 'If the remote endpoint is compromised, undergoes DNS spoofing, or experiences a network interruption mid-stream, partial or malicious code may execute directly on your runner.',
    badExample: 'run: curl -fsSL https://example.com/install.sh | bash',
    goodExample: 'run: |\n  curl -fsSL -o install.sh https://example.com/install.sh\n  echo "<expected-sha256> install.sh" | sha256sum --check\n  bash install.sh',
    remediationGuide: 'Download the script to a file, verify its checksum, and then execute it, or use a dedicated verified GitHub Action.'
  },
  async check(context): Promise<RuleResult[]> {
    const results: RuleResult[] = [];

    // Check workflows
    const workflowFiles = await context.listFiles('.github/workflows/*');
    for (const filePath of workflowFiles) {
      if (!filePath.endsWith('.yml') && !filePath.endsWith('.yaml')) continue;
      const content = await context.readFile(filePath);
      if (!content) continue;

      if (PIPE_EXEC_REGEX.test(content)) {
        const loc = findLineAndColumn(content, PIPE_EXEC_REGEX);
        results.push({
          ruleId: 'sec-004',
          ruleTitle: sec004.title,
          category: 'security',
          severity: 'error',
          file: filePath,
          line: loc?.line,
          column: loc?.column,
          message: `Insecure remote script pipe-to-shell detected in workflow "${filePath}"`,
          fixable: false,
          remediation: 'Download the file first, verify its hash/signature, and execute locally.'
        });
      }
    }

    // Check package.json scripts
    const pkg = await context.readJson<{ scripts?: Record<string, string> }>('package.json');
    if (pkg && pkg.scripts) {
      for (const [scriptName, scriptCmd] of Object.entries(pkg.scripts)) {
        if (typeof scriptCmd === 'string' && PIPE_EXEC_REGEX.test(scriptCmd)) {
          const content = (await context.readFile('package.json')) || '';
          const loc = findLineAndColumn(content, scriptName);
          results.push({
            ruleId: 'sec-004',
            ruleTitle: sec004.title,
            category: 'security',
            severity: 'error',
            file: 'package.json',
            line: loc?.line,
            column: loc?.column,
            message: `Insecure remote script pipe-to-shell detected in package.json script "${scriptName}"`,
            fixable: false,
            remediation: 'Remove pipe-to-shell from package script; use a locked dependency or checked-in script.'
          });
        }
      }
    }

    return results;
  }
};
