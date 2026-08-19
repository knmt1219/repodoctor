import { EngineReport } from '../core/types.js';

export function formatGitHubAnnotations(report: EngineReport): string {
  const lines: string[] = [];

  for (const res of report.results) {
    const command = res.severity === 'error' ? 'error' : res.severity === 'warn' ? 'warning' : 'notice';
    const fileParam = res.file ? `file=${res.file}` : '';
    const lineParam = res.line ? `line=${res.line}` : '';
    const colParam = res.column ? `col=${res.column}` : '';
    const titleParam = `title=[${res.ruleId}] ${res.ruleTitle}`;

    const params = [fileParam, lineParam, colParam, titleParam].filter(Boolean).join(',');
    lines.push(`::${command} ${params}::${res.message}${res.remediation ? ` (Fix: ${res.remediation})` : ''}`);
  }

  return lines.join('\n');
}
