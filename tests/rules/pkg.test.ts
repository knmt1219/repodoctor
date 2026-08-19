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

  it('pkg-002: should flag multiple conflicting lockfiles', async () => {
    const ctx = createMockContext({
      'package.json': JSON.stringify({ name: 'pkg' }),
      'package-lock.json': '{}',
      'yarn.lock': '# yarn lockfile v1'
    });
    const res = await pkg002.check(ctx);
    assert.equal(res.length, 1);
    assert.equal(res[0]?.ruleId, 'pkg-002');
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
});
