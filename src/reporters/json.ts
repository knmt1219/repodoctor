import { EngineReport, FixResult } from '../core/types.js';

export function formatJsonReport(report: EngineReport, fixes?: FixResult[]): string {
  return JSON.stringify(
    {
      $schema: 'https://raw.githubusercontent.com/repodoctor/repodoctor/main/schema/report.json',
      report,
      fixes: fixes || []
    },
    null,
    2
  );
}
