import { EngineReport, FixResult } from '../core/types.js';
import { colors } from '../utils/colors.js';

export function formatTerminalReport(report: EngineReport, fixes?: FixResult[]): string {
  const lines: string[] = [];

  lines.push('');
  lines.push(`${colors.bold(colors.cyan('RepoDoctor'))} ${colors.dim(`v${report.version}`)} — Repository Health & Security Diagnostics`);
  lines.push(colors.dim('─'.repeat(70)));
  lines.push('');

  // If fixes were applied, display them first
  if (fixes && fixes.length > 0) {
    lines.push(colors.bold(colors.green('Applied Fixes:')));
    for (const fix of fixes) {
      const statusIcon = fix.fixed ? colors.green('✔') : colors.red('✖');
      lines.push(`  ${statusIcon} [${colors.bold(fix.ruleId)}] ${fix.message}`);
    }
    lines.push('');
  }

  // Display findings
  if (report.results.length === 0) {
    lines.push(`  ${colors.green('✔')} ${colors.bold('All checks passed!')} No repository hygiene or security issues detected.`);
  } else {
    for (const res of report.results) {
      let badge = '';
      if (res.severity === 'error') {
        badge = colors.bgRed(colors.white(colors.bold(' ERROR ')));
      } else if (res.severity === 'warn') {
        badge = colors.bgYellow(colors.black(colors.bold(' WARN ')));
      } else {
        badge = colors.bgBlue(colors.white(colors.bold(' INFO ')));
      }

      const fileLoc = res.file
        ? colors.dim(` at ${colors.underline(res.file)}${res.line ? `:${res.line}` : ''}${res.column ? `:${res.column}` : ''}`)
        : '';

      lines.push(` ${badge} ${colors.bold(`[${res.ruleId}]`)} ${res.message}${fileLoc}`);
      if (res.remediation) {
        lines.push(`   ${colors.dim('└─ Fix:')} ${colors.italic(colors.cyan(res.remediation))}`);
      }
      lines.push('');
    }
  }

  lines.push(colors.dim('─'.repeat(70)));

  // Score and breakdown
  const score = report.score;
  let gradeColor = colors.green;
  if (score.grade === 'B') gradeColor = colors.cyan;
  else if (score.grade === 'C') gradeColor = colors.yellow;
  else if (score.grade === 'D' || score.grade === 'F') gradeColor = colors.red;

  lines.push(
    ` Health Score: ${gradeColor(colors.bold(`${score.score}/100`))} (Grade: ${gradeColor(colors.bold(score.grade))})`
  );

  const categories = Object.keys(score.breakdown) as Array<keyof typeof score.breakdown>;
  const catSummary = categories
    .map(cat => {
      const c = score.breakdown[cat];
      const catColor = c.errors > 0 ? colors.red : c.warnings > 0 ? colors.yellow : colors.green;
      return `${cat}: ${catColor(`${c.score}%`)}`;
    })
    .join('  |  ');

  lines.push(` Category Breakdown: ${catSummary}`);
  lines.push('');

  const summary = report.summary;
  const summaryParts: string[] = [];
  if (summary.errors > 0) summaryParts.push(colors.red(colors.bold(`${summary.errors} error${summary.errors > 1 ? 's' : ''}`)));
  if (summary.warnings > 0) summaryParts.push(colors.yellow(colors.bold(`${summary.warnings} warning${summary.warnings > 1 ? 's' : ''}`)));
  if (summary.infos > 0) summaryParts.push(colors.blue(`${summary.infos} info`));
  if (summary.fixable > 0) summaryParts.push(colors.green(`${summary.fixable} auto-fixable`));

  lines.push(
    ` Summary: ${summaryParts.length > 0 ? summaryParts.join(', ') : colors.green('0 issues')} (${summary.rulesEvaluated} rules evaluated in ${report.elapsedMs}ms)`
  );
  lines.push('');

  return lines.join('\n');
}
