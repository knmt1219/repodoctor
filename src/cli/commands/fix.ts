import path from 'node:path';
import { loadConfig } from '../../config/loader.js';
import { RepoDoctorEngine } from '../../core/engine.js';
import { formatTerminalReport } from '../../reporters/index.js';
import { dirExists } from '../../utils/fs.js';

export interface FixCliOptions {
  config?: string;
  strict?: boolean;
}

export async function runFixCommand(target = '.', options: FixCliOptions = {}): Promise<number> {
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

    const { report, fixes } = await engine.fix();

    console.log(formatTerminalReport(report, fixes));

    if (report.summary.errors > 0) {
      return 1;
    }

    if (options.strict && report.summary.warnings > 0) {
      return 1;
    }

    return 0;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Error during RepoDoctor fix: ${message}`);
    return 2;
  }
}
