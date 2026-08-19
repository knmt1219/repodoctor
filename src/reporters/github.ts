import { EngineReport } from '../core/types.js';

function escapeWorkflowData(str: string): string {
  return str
    .replace(/%/g, '%25')
    .replace(/\r/g, '%0D')
    .replace(/\n/g, '%0A');
}

function escapeWorkflowProperty(str: string): string {
  return str
    .replace(/%/g, '%25')
    .replace(/\r/g, '%0D')
    .replace(/\n/g, '%0A')
    .replace(/:/g, '%3A')
    .replace(/,/g, '%2C');
}

export function formatGitHubAnnotations(report: EngineReport): string {
  const lines: string[] = [];

  for (const res of report.results) {
    const command = res.severity === 'error' ? 'error' : res.severity === 'warn' ? 'warning' : 'notice';
    const fileParam = res.file ? `file=${escapeWorkflowProperty(res.file)}` : '';
    const lineParam = res.line ? `line=${res.line}` : '';
    const colParam = res.column ? `col=${res.column}` : '';
    const titleParam = `title=${escapeWorkflowProperty(`[${res.ruleId}] ${res.ruleTitle}`)}`;

    const paramList = [fileParam, lineParam, colParam, titleParam].filter(Boolean);
    const paramStr = paramList.length > 0 ? ` ${paramList.join(',')}` : '';
    const rawMessage = `${res.message}${res.remediation ? ` (Fix: ${res.remediation})` : ''}`;
    lines.push(`::${command}${paramStr}::${escapeWorkflowData(rawMessage)}`);
  }

  return lines.join('\n');
}
