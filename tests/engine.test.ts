import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { RepoDoctorEngine } from '../src/core/engine.js';
import { resolveConfig } from '../src/config/loader.js';
import path from 'node:path';

describe('RepoDoctor Engine', () => {
  it('should run diagnostics on repository directory and return structured report', async () => {
    const config = resolveConfig({});
    const rootDir = path.resolve(process.cwd());

    const engine = new RepoDoctorEngine({
      rootDir,
      config
    });

    const { report } = await engine.run();

    assert.equal(report.version, '0.1.4');
    assert.ok(typeof report.score.score === 'number');
    assert.ok(report.summary.rulesEvaluated > 0);
    assert.ok(Array.isArray(report.results));
  });

  it('should respect category disabling', async () => {
    const config = resolveConfig({
      categories: {
        docker: false,
        git: false
      }
    });

    const engine = new RepoDoctorEngine({
      rootDir: path.resolve(process.cwd()),
      config
    });

    const { report } = await engine.run();
    const dockerResults = report.results.filter(r => r.category === 'docker');
    const gitResults = report.results.filter(r => r.category === 'git');

    assert.equal(dockerResults.length, 0);
    assert.equal(gitResults.length, 0);
  });
});
