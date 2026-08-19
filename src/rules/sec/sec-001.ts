import { Rule, RuleResult } from '../../core/types.js';
import { findLineAndColumn, parseLines } from '../../utils/parsers.js';

export const sec001: Rule = {
  id: 'sec-001',
  title: 'GitHub Actions should be pinned to full commit SHAs',
  description: 'Floating tags (like @v4 or @main) in GitHub Actions can be compromised if an upstream tag is maliciously mutated. Pinning to a 40-character commit SHA protects your build from supply chain attacks.',
  category: 'security',
  defaultSeverity: 'error',
  fixable: false,
  docs: {
    whyItMatters: 'If an attacker compromises an action author’s account or token, they can move a floating git tag (e.g. v3) to point to malicious code. Pinning to an immutable SHA-1 hash ensures you always run the exact reviewed code.',
    badExample: '- uses: actions/checkout@v4',
    goodExample: '- uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2',
    remediationGuide: 'Replace floating tags with the 40-character commit SHA of the action release, adding a comment indicating the semantic tag.'
  },
  async check(context): Promise<RuleResult[]> {
    const results: RuleResult[] = [];
    const workflowFiles = await context.listFiles('.github/workflows/*.yml');
    const yamlWorkflowFiles = await context.listFiles('.github/workflows/*.yaml');
    const allWorkflows = Array.from(new Set([...workflowFiles, ...yamlWorkflowFiles]));

    for (const filePath of allWorkflows) {
      const content = await context.readFile(filePath);
      if (!content) continue;

      const lines = parseLines(content);
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]!;
        const trimmed = line.trim();

        // Skip comments
        if (trimmed.startsWith('#')) continue;

        // Match `uses: <action>@<ref>`
        const usesMatch = /uses:\s*([a-zA-Z0-9_\-./]+)@([^\s#\r\n]+)/.exec(line);
        if (!usesMatch) continue;

        const fullAction = usesMatch[1]!;
        const ref = usesMatch[2]!;

        // Skip local actions (./) or docker actions (docker://)
        if (fullAction.startsWith('./') || fullAction.startsWith('docker://')) {
          continue;
        }

        // Check if ref is 40-char hex commit SHA
        const isCommitSha = /^[0-9a-f]{40}$/i.test(ref);
        if (!isCommitSha) {
          const loc = findLineAndColumn(content, usesMatch[0]);
          results.push({
            ruleId: 'sec-001',
            ruleTitle: sec001.title,
            category: 'security',
            severity: 'error',
            file: filePath,
            line: loc?.line ?? (i + 1),
            column: loc?.column ?? 1,
            message: `GitHub Action "${fullAction}@${ref}" is not pinned to a commit SHA`,
            fixable: false,
            remediation: `Pin "${fullAction}" to its 40-character commit SHA (e.g., uses: ${fullAction}@<commit-sha> # ${ref})`,
            details: { action: fullAction, ref }
          });
        }
      }
    }

    return results;
  }
};
