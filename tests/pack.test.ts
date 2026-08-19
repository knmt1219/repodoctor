import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { RepoDoctorEngine } from '../src/core/engine.js';
import { resolveConfig } from '../src/config/loader.js';
import { fileExists } from '../src/utils/fs.js';
import path from 'node:path';

describe('Package & Export Smoke Test', () => {
  it('dist/index.js entry point should exist after build', async () => {
    const distIndex = path.resolve(process.cwd(), 'dist', 'index.js');
    assert.equal(await fileExists(distIndex), true);
  });

  it('dist/cli/index.js should exist for bin script execution', async () => {
    const distCli = path.resolve(process.cwd(), 'dist', 'cli', 'index.js');
    assert.equal(await fileExists(distCli), true);
  });

  it('engine should evaluate successfully from programmatic API', async () => {
    const config = resolveConfig({});
    const engine = new RepoDoctorEngine({
      rootDir: path.resolve(process.cwd()),
      config
    });
    const { report } = await engine.run();
    assert.equal(report.score.score, 100);
    assert.equal(report.score.grade, 'A+');
  });
});
