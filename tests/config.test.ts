import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig, resolveConfig } from '../src/config/loader.js';
import os from 'node:os';
import path from 'node:path';
import fsp from 'node:fs/promises';

describe('Config Loader & Resolver', () => {
  it('should resolve default configuration when empty user config is provided', () => {
    const resolved = resolveConfig({});
    assert.equal(resolved.scoreThreshold, 75);
    assert.equal(resolved.maxWarnings, -1);
    assert.ok(resolved.ignorePatterns.includes('**/node_modules/**'));
    assert.equal(resolved.ruleSettings.get('sec-001')?.severity, 'error');
    assert.equal(resolved.ruleSettings.get('oss-001')?.severity, 'error');
  });

  it('should override rules with user specified severities', () => {
    const resolved = resolveConfig({
      scoreThreshold: 90,
      rules: {
        'sec-001': 'warn',
        'oss-001': 'off',
        'custom-001': { severity: 'error', max: 5 }
      }
    });

    assert.equal(resolved.scoreThreshold, 90);
    assert.equal(resolved.ruleSettings.get('sec-001')?.severity, 'warn');
    assert.equal(resolved.ruleSettings.get('oss-001')?.severity, 'off');
    assert.equal(resolved.ruleSettings.get('custom-001')?.severity, 'error');
    assert.deepEqual(resolved.ruleSettings.get('custom-001')?.options, { max: 5 });
  });

  it('should merge user ignore patterns with default patterns', () => {
    const resolved = resolveConfig({
      ignore: ['**/custom-build/**']
    });

    assert.ok(resolved.ignorePatterns.includes('**/custom-build/**'));
    assert.ok(resolved.ignorePatterns.includes('**/node_modules/**'));
  });

  it('should allow disabling entire categories', () => {
    const resolved = resolveConfig({
      categories: {
        docker: false,
        git: true
      }
    });

    assert.equal(resolved.categorySettings.get('docker'), false);
    assert.equal(resolved.categorySettings.get('git'), true);
  });

  it('should load config from a YAML file', async () => {
    const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'repodoctor-cfg-yaml-'));
    try {
      const cfgPath = path.join(tmpDir, '.repodoctor.yml');
      await fsp.writeFile(cfgPath, 'scoreThreshold: 95\nrules:\n  sec-001: warn\n');

      const config = await loadConfig(tmpDir);
      assert.equal(config.scoreThreshold, 95);
      assert.equal(config.ruleSettings.get('sec-001')?.severity, 'warn');
    } finally {
      await fsp.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('should load config from package.json repodoctor field', async () => {
    const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'repodoctor-cfg-pkg-'));
    try {
      const pkgPath = path.join(tmpDir, 'package.json');
      await fsp.writeFile(
        pkgPath,
        JSON.stringify({
          name: 'sample',
          repodoctor: {
            scoreThreshold: 88
          }
        })
      );

      const config = await loadConfig(tmpDir);
      assert.equal(config.scoreThreshold, 88);
    } finally {
      await fsp.rm(tmpDir, { recursive: true, force: true });
    }
  });
});
