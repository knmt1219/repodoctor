import path from 'node:path';
import { loadConfig } from '../../config/loader.js';
import { RepoDoctorEngine } from '../../core/engine.js';
import {
  formatGitHubAnnotations,
  formatJsonReport,
  formatMarkdownReport,
  formatSarifReport,
  formatTerminalReport
} from '../../reporters/index.js';
import { writeFileSafe } from '../../utils/fs.js';

export interface CheckCliOptions {
  config?: string;
  format?: 'terminal' | 'json' | 'sarif' | 'markdown' | 'github';
  output?: string;
  scoreThreshold?: string;
  maxWarnings?: string;
  strict?: boolean;
  fix?: boolean;
}

export async function runCheckCommand(target = '.', options: CheckCliOptions = {}): Promise<number> {
  const rootDir = path.resolve(process.cwd(), target);

  try {
    const config = await loadConfig(rootDir, options.config);

    const engine = new RepoDoctorEngine({
      rootDir,
      config
    });

    let report;
    let fixes;

    if (options.fix) {
      const fixRes = await engine.fix();
      report = fixRes.report;
      fixes = fixRes.fixes;
    } else {
      const runRes = await engine.run();
      report = runRes.report;
    }

    const format = options.format || 'terminal';
    let outputText = '';

    switch (format) {
      case 'json':
        outputText = formatJsonReport(report, fixes);
        break;
      case 'sarif':
        outputText = formatSarifReport(report);
        break;
      case 'markdown':
        outputText = formatMarkdownReport(report, fixes);
        break;
      case 'github':
        outputText = formatGitHubAnnotations(report);
        break;
      case 'terminal':
      default:
        outputText = formatTerminalReport(report, fixes);
        break;
    }

    if (options.output) {
      const outPath = path.resolve(process.cwd(), options.output);
      await writeFileSafe(outPath, outputText);
      console.log(`Report written to ${outPath}`);
    } else {
      console.log(outputText);
    }

    // Determine exit code
    const scoreThreshold = options.scoreThreshold !== undefined ? parseInt(options.scoreThreshold, 10) : config.scoreThreshold ?? 75;
    const maxWarnings = options.maxWarnings !== undefined ? parseInt(options.maxWarnings, 10) : config.maxWarnings ?? -1;

    // Fail conditions
    if (report.summary.errors > 0) {
      return 1;
    }

    if (options.strict && report.summary.warnings > 0) {
      return 1;
    }

    if (maxWarnings >= 0 && report.summary.warnings > maxWarnings) {
      return 1;
    }

    if (report.score.score < scoreThreshold) {
      return 1;
    }

    return 0;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Error during RepoDoctor check: ${message}`);
    return 2;
  }
}
