import { EngineReport, FixResult } from '../core/types.js';

export function formatMarkdownReport(report: EngineReport, fixes?: FixResult[]): string {
  const lines: string[] = [];

  lines.push('## 🩺 RepoDoctor Health Report');
  lines.push('');

  const gradeEmoji = {
    'A+': '🟢 🏆',
    'A': '🟢',
    'B': '🔵',
    'C': '🟡',
    'D': '🟠',
    'F': '🔴'
  }[report.score.grade];

  lines.push(`**Health Score:** ${report.score.score}/100 (${gradeEmoji} Grade **${report.score.grade}**)`);
  lines.push('');

  // Category breakdown table
  lines.push('| Category | Score | Errors | Warnings | Infos |');
  lines.push('| :--- | :--- | :--- | :--- | :--- |');

  for (const [cat, data] of Object.entries(report.score.breakdown)) {
    lines.push(`| **${cat}** | ${data.score}% | ${data.errors} | ${data.warnings} | ${data.infos} |`);
  }
  lines.push('');

  if (fixes && fixes.length > 0) {
    lines.push('### 🛠️ Applied Fixes');
    lines.push('');
    for (const fix of fixes) {
      lines.push(`- ${fix.fixed ? '✅' : '❌'} **${fix.ruleId}**: ${fix.message}`);
    }
    lines.push('');
  }

  if (report.results.length === 0) {
    lines.push('🎉 **All checks passed!** No repository health or security issues detected.');
    lines.push('');
  } else {
    lines.push('### 📋 Findings');
    lines.push('');
    lines.push('| Severity | Rule | Message | Location | Remediation |');
    lines.push('| :---: | :--- | :--- | :--- | :--- |');

    for (const res of report.results) {
      const sevIcon = res.severity === 'error' ? '🔴 Error' : res.severity === 'warn' ? '🟡 Warn' : '🔵 Info';
      const loc = res.file ? `\`${res.file}${res.line ? `:${res.line}` : ''}\`` : '—';
      const fix = res.remediation ? res.remediation.replace(/\|/g, '\\|') : '—';
      const msg = res.message.replace(/\|/g, '\\|');
      lines.push(`| ${sevIcon} | \`${res.ruleId}\` | ${msg} | ${loc} | ${fix} |`);
    }
    lines.push('');
  }

  lines.push(`*Evaluated ${report.summary.rulesEvaluated} rules in ${report.elapsedMs}ms by RepoDoctor v${report.version}*`);

  return lines.join('\n');
}

export function formatMarkdownPrSummary(report: EngineReport, fixes?: FixResult[]): string {
  const lines: string[] = [];

  const gradeEmoji = {
    'A+': '🟢 🏆',
    'A': '🟢',
    'B': '🔵',
    'C': '🟡',
    'D': '🟠',
    'F': '🔴'
  }[report.score.grade];

  const statusBadge = report.summary.errors === 0 ? '✅ Pass' : '❌ Action Required';

  lines.push(`### 🩺 RepoDoctor PR Diagnostics — ${statusBadge}`);
  lines.push('');
  lines.push(`| Health Score | Grade | Errors | Warnings | Auto-Fixable |`);
  lines.push(`| :---: | :---: | :---: | :---: | :---: |`);
  lines.push(`| **${report.score.score}/100** | ${gradeEmoji} **${report.score.grade}** | ${report.summary.errors > 0 ? `🔴 ${report.summary.errors}` : '0'} | ${report.summary.warnings > 0 ? `🟡 ${report.summary.warnings}` : '0'} | ${report.summary.fixable > 0 ? `🛠️ ${report.summary.fixable}` : '0'} |`);
  lines.push('');

  if (fixes && fixes.length > 0) {
    lines.push('<details><summary><b>🛠️ Applied Fixes (' + fixes.length + ')</b></summary>');
    lines.push('');
    for (const fix of fixes) {
      lines.push(`- ${fix.fixed ? '✅' : '❌'} **${fix.ruleId}**: ${fix.message}`);
    }
    lines.push('');
    lines.push('</details>');
    lines.push('');
  }

  if (report.results.length === 0) {
    lines.push('> 🎉 **All checks passed!** Repository meets all security, CI, and OSS hygiene standards.');
  } else {
    lines.push('<details open><summary><b>📋 Findings & Action Items (' + report.results.length + ')</b></summary>');
    lines.push('');
    lines.push('| Severity | Rule | File | Remediation |');
    lines.push('| :---: | :--- | :--- | :--- |');

    for (const res of report.results) {
      const sev = res.severity === 'error' ? '🔴 Error' : res.severity === 'warn' ? '🟡 Warn' : '🔵 Info';
      const loc = res.file ? `\`${res.file}${res.line ? `:${res.line}` : ''}\`` : '—';
      const fix = res.remediation ? res.remediation.replace(/\|/g, '\\|') : res.message.replace(/\|/g, '\\|');
      lines.push(`| ${sev} | \`${res.ruleId}\` | ${loc} | ${fix} |`);
    }

    lines.push('');
    lines.push('</details>');
    lines.push('');
  }

  lines.push('<details><summary><b>📊 Category Breakdown</b></summary>');
  lines.push('');
  lines.push('| Category | Score | Status |');
  lines.push('| :--- | :---: | :--- |');
  for (const [cat, data] of Object.entries(report.score.breakdown)) {
    const status = data.errors > 0 ? '🔴 Errors' : data.warnings > 0 ? '🟡 Warnings' : '🟢 Healthy';
    lines.push(`| **${cat}** | ${data.score}% | ${status} |`);
  }
  lines.push('');
  lines.push('</details>');
  lines.push('');
  lines.push(`<sub>Scanned with <a href="https://github.com/knmt1219/repodoctor">RepoDoctor v${report.version}</a> in ${report.elapsedMs}ms</sub>`);

  return lines.join('\n');
}
