import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatGitHubAnnotations,
  formatJsonReport,
  formatMarkdownReport,
  formatMarkdownPrSummary,
  formatSarifReport,
  formatTerminalReport
} from '../src/reporters/index.js';
import { EngineReport } from '../src/core/types.js';

describe('Reporters', () => {
  const mockReport: EngineReport = {
    timestamp: '2026-08-19T00:00:00.000Z',
    targetDir: '/mock/repo',
    version: '0.1.4',
    results: [
      {
        ruleId: 'sec-001',
        ruleTitle: 'Action Pinning',
        category: 'security',
        severity: 'error',
        message: 'Action not pinned to SHA',
        file: '.github/workflows/ci.yml',
        line: 12,
        column: 9,
        fixable: false,
        remediation: 'Pin to commit SHA'
      },
      {
        ruleId: 'git-001',
        ruleTitle: 'Gitattributes',
        category: 'git',
        severity: 'warn',
        message: 'Missing .gitattributes',
        fixable: true,
        remediation: 'Create .gitattributes'
      }
    ],
    score: {
      score: 85,
      grade: 'A',
      breakdown: {
        security: { score: 75, totalChecked: 6, violations: 1, errors: 1, warnings: 0, infos: 0 },
        oss: { score: 100, totalChecked: 9, violations: 0, errors: 0, warnings: 0, infos: 0 },
        ci: { score: 100, totalChecked: 5, violations: 0, errors: 0, warnings: 0, infos: 0 },
        package: { score: 100, totalChecked: 4, violations: 0, errors: 0, warnings: 0, infos: 0 },
        git: { score: 90, totalChecked: 5, violations: 1, errors: 0, warnings: 1, infos: 0 },
        docker: { score: 100, totalChecked: 2, violations: 0, errors: 0, warnings: 0, infos: 0 }
      }
    },
    summary: {
      total: 2,
      errors: 1,
      warnings: 1,
      infos: 0,
      fixable: 1,
      passed: 29,
      rulesEvaluated: 31
    },
    elapsedMs: 42
  };

  it('should format terminal report with colors and score', () => {
    const output = formatTerminalReport(mockReport);
    assert.ok(output.includes('RepoDoctor'));
    assert.ok(output.includes('sec-001'));
    assert.ok(output.includes('git-001'));
    assert.ok(output.includes('85/100'));
  });

  it('should format JSON report matching schema', () => {
    const output = formatJsonReport(mockReport);
    const parsed = JSON.parse(output);
    assert.equal(parsed.report.version, '0.1.4');
    assert.equal(parsed.report.summary.errors, 1);
    assert.equal(parsed.report.results.length, 2);
  });

  it('should format valid SARIF v2.1.0 output', () => {
    const output = formatSarifReport(mockReport);
    const sarif = JSON.parse(output);
    assert.equal(sarif.version, '2.1.0');
    assert.equal(sarif.runs[0].tool.driver.name, 'RepoDoctor');
    assert.ok(sarif.runs[0].results.length >= 2);
    assert.equal(sarif.runs[0].results[0].ruleId, 'sec-001');
    assert.equal(sarif.runs[0].results[0].level, 'error');
  });

  it('should format Markdown report for GitHub summaries', () => {
    const output = formatMarkdownReport(mockReport);
    assert.ok(output.includes('## 🩺 RepoDoctor Health Report'));
    assert.ok(output.includes('| **security** | 75% | 1 | 0 | 0 |'));
    assert.ok(output.includes('`sec-001`'));
  });

  it('should format compact Markdown PR summary', () => {
    const output = formatMarkdownPrSummary(mockReport);
    assert.ok(output.includes('RepoDoctor PR Diagnostics'));
    assert.ok(output.includes('Action Required'));
    assert.ok(output.includes('85/100'));
    assert.ok(output.includes('<details open>'));
    assert.ok(output.includes('`sec-001`'));
    assert.ok(output.includes('<details><summary><b>📊 Category Breakdown</b></summary>'));
  });

  it('should format GitHub workflow command annotations and escape special characters', () => {
    const reportWithSpecialChars: EngineReport = {
      ...mockReport,
      results: [
        {
          ruleId: 'sec-001',
          ruleTitle: 'Rule: With, Colons % More',
          category: 'security',
          severity: 'error',
          message: 'Multi-line\nmessage with % percent\r\nand linebreaks',
          file: 'src/special,file:name.ts',
          line: 1,
          column: 1,
          fixable: false,
          remediation: 'Fix\nnewline'
        }
      ]
    };

    const output = formatGitHubAnnotations(reportWithSpecialChars);
    // Ensure newlines and % are escaped
    assert.ok(!output.includes('\nmessage'));
    assert.ok(output.includes('%25 percent'));
    assert.ok(output.includes('%0A'));
    assert.ok(output.includes('file=src/special%2Cfile%3Aname.ts'));
  });
});
