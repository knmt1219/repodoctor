import path from 'node:path';
import { loadConfig } from '../../config/loader.js';
import { RepoDoctorEngine } from '../../core/engine.js';
import {
  formatGitHubAnnotations,
  formatJsonReport,
  formatMarkdownPrSummary,
  formatMarkdownReport,
  formatSarifReport,
  formatTerminalReport
} from '../../reporters/index.js';
import { dirExists, writeFileSafe } from '../../utils/fs.js';

export interface CheckCliOptions {
  config?: string;
  format?: 'terminal' | 'json' | 'sarif' | 'markdown' | 'markdown-pr' | 'github';
  output?: string;
  scoreThreshold?: string;
  maxWarnings?: string;
  strict?: boolean;
  fix?: boolean;
  summary?: boolean;
}

export async function runCheckCommand(target = '.', options: CheckCliOptions = {}): Promise<number> {
  const rootDir = path.resolve(process.cwd(), target);

  try {
    if (!(await dirExists(rootDir))) {
      console.error(`Error: Target directory does not exist: "${target}" (resolved to: "${rootDir}")`);
      return 2;
    }

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

    let format = options.summary ? 'markdown-pr' : (options.format || 'terminal');

    let outputText = '';

    switch (format) {
      case 'json':
        outputText = formatJsonReport(report, fixes);
        break;
      case 'sarif':
        outputText = formatSarifReport(report);
        break;
      case 'markdown-pr':
        outputText = formatMarkdownPrSummary(report, fixes);
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
      const written = await writeFileSafe(outPath, outputText);
      if (!written) {
        console.error(`Error: Failed to write report output to "${options.output}" (resolved to: "${outPath}")`);
        return 2;
      }
      console.log(`Report written to ${outPath}`);
    } else {
      console.log(outputText);
    }

    // Determine exit code
    let scoreThreshold = config.scoreThreshold ?? 75;
    if (options.scoreThreshold !== undefined) {
      const parsed = parseInt(options.scoreThreshold, 10);
      if (!isNaN(parsed)) scoreThreshold = parsed;
    }

    let maxWarnings = config.maxWarnings ?? -1;
    if (options.maxWarnings !== undefined) {
      const parsed = parseInt(options.maxWarnings, 10);
      if (!isNaN(parsed)) maxWarnings = parsed;
    }

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
