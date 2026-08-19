import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { pkg001 } from '../../src/rules/pkg/pkg-001.js';
import { pkg002 } from '../../src/rules/pkg/pkg-002.js';
import { pkg003 } from '../../src/rules/pkg/pkg-003.js';
import { pkg004 } from '../../src/rules/pkg/pkg-004.js';
import { createMockContext } from '../helpers.js';

describe('Package & Dependency Hygiene Rules (pkg-001 to pkg-004)', () => {
  it('pkg-001: should flag package.json without committed lockfile', async () => {
    const ctx = createMockContext({
      'package.json': JSON.stringify({ name: 'pkg' })
    });
    const res = await pkg001.check(ctx);
    assert.equal(res.length, 1);
    assert.equal(res[0]?.ruleId, 'pkg-001');
  });

  it('pkg-001: should pass package.json with package-lock.json', async () => {
    const ctx = createMockContext({
      'package.json': JSON.stringify({ name: 'pkg' }),
      'package-lock.json': '{"name": "pkg", "lockfileVersion": 3}'
    });
    const res = await pkg001.check(ctx);
    assert.equal(res.length, 0);
  });

  it('pkg-001: should check pyproject.toml for poetry.lock or uv.lock', async () => {
    const ctxMissing = createMockContext({
      'pyproject.toml': '[project]\nname = "my-app"\n'
    });
    const res1 = await pkg001.check(ctxMissing);
    assert.equal(res1.length, 1);
    assert.ok(res1[0]?.message.includes('pyproject.toml'));

    const ctxPass = createMockContext({
      'pyproject.toml': '[project]\nname = "my-app"\n',
      'poetry.lock': '# poetry lockfile\n'
    });
    const res2 = await pkg001.check(ctxPass);
    assert.equal(res2.length, 0);
  });

  it('pkg-001: should check go.mod for go.sum', async () => {
    const ctxMissing = createMockContext({
      'go.mod': 'module github.com/example/app\ngo 1.22\n'
    });
    const res1 = await pkg001.check(ctxMissing);
    assert.equal(res1.length, 1);

    const ctxPass = createMockContext({
      'go.mod': 'module github.com/example/app\ngo 1.22\n',
      'go.sum': 'github.com/stretchr/testify v1.8.4 ...\n'
    });
    const res2 = await pkg001.check(ctxPass);
    assert.equal(res2.length, 0);
  });

  it('pkg-002: should flag multiple conflicting lockfiles across different managers', async () => {
    const ctx = createMockContext({
      'package.json': JSON.stringify({ name: 'pkg' }),
      'package-lock.json': '{}',
      'yarn.lock': '# yarn lockfile v1'
    });
    const res = await pkg002.check(ctx);
    assert.equal(res.length, 1);
    assert.equal(res[0]?.ruleId, 'pkg-002');
  });

  it('pkg-002: should not flag dual Bun lockfiles (bun.lock and bun.lockb)', async () => {
    const ctx = createMockContext({
      'package.json': JSON.stringify({ name: 'pkg' }),
      'bun.lock': 'lockfile',
      'bun.lockb': 'binary'
    });
    const res = await pkg002.check(ctx);
    assert.equal(res.length, 0);
  });

  it('pkg-003: should flag wildcard * dependencies', async () => {
    const ctx = createMockContext({
      'package.json': JSON.stringify({
        name: 'pkg',
        dependencies: {
          lodash: '*'
        }
      })
    });
    const res = await pkg003.check(ctx);
    assert.equal(res.length, 1);
    assert.equal(res[0]?.ruleId, 'pkg-003');
  });

  it('pkg-004: should flag missing test script', async () => {
    const ctx = createMockContext({
      'package.json': JSON.stringify({
        name: 'pkg',
        scripts: {
          build: 'tsc'
        }
      })
    });
    const res = await pkg004.check(ctx);
    assert.equal(res.length, 1);
    assert.equal(res[0]?.ruleId, 'pkg-004');
  });

  it('pkg-004: should check custom requiredScripts from config', async () => {
    const ctx = createMockContext({
      'package.json': JSON.stringify({
        name: 'pkg',
        scripts: {
          test: 'node --test',
          build: 'tsc'
        }
      })
    });
    // Add requiredScripts: ['test', 'build', 'lint']
    ctx.options.config = { requiredScripts: ['test', 'build', 'lint'] };

    const res = await pkg004.check(ctx);
    assert.equal(res.length, 1);
    assert.ok(res[0]?.message.includes('lint'));
  });
});
