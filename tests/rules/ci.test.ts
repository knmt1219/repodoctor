import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ci001 } from '../../src/rules/ci/ci-001.js';
import { ci002 } from '../../src/rules/ci/ci-002.js';
import { ci003 } from '../../src/rules/ci/ci-003.js';
import { ci004 } from '../../src/rules/ci/ci-004.js';
import { createMockContext } from '../helpers.js';

describe('CI/CD Best Practices Rules (ci-001 to ci-004)', () => {
  it('ci-001: should flag workflow jobs missing timeout-minutes', async () => {
    const ctx = createMockContext({
      '.github/workflows/ci.yml': 'name: CI\njobs:\n  build:\n    runs-on: ubuntu-latest\n'
    });
    const res = await ci001.check(ctx);
    assert.equal(res.length, 1);
    assert.equal(res[0]?.ruleId, 'ci-001');
  });

  it('ci-001: should pass workflow jobs with timeout-minutes', async () => {
    const ctx = createMockContext({
      '.github/workflows/ci.yml': 'name: CI\njobs:\n  build:\n    runs-on: ubuntu-latest\n    timeout-minutes: 15\n'
    });
    const res = await ci001.check(ctx);
    assert.equal(res.length, 0);
  });

  it('ci-002: should flag pull_request workflows without concurrency', async () => {
    const ctx = createMockContext({
      '.github/workflows/pr.yml': 'name: PR\non: pull_request\njobs:\n  test:\n    runs-on: ubuntu-latest\n'
    });
    const res = await ci002.check(ctx);
    assert.equal(res.length, 1);
    assert.equal(res[0]?.ruleId, 'ci-002');
  });

  it('ci-002: should pass PR workflows with concurrency configured', async () => {
    const ctx = createMockContext({
      '.github/workflows/pr.yml': 'name: PR\non: pull_request\nconcurrency:\n  group: ${{ github.ref }}\n  cancel-in-progress: true\njobs:\n  test:\n    runs-on: ubuntu-latest\n'
    });
    const res = await ci002.check(ctx);
    assert.equal(res.length, 0);
  });

  it('ci-003: should flag repos with no CI workflows', async () => {
    const ctx = createMockContext({});
    const res = await ci003.check(ctx);
    assert.equal(res.length, 1);
  });

  it('ci-004: should check matrix fail-fast on large matrices', async () => {
    const ctx = createMockContext({
      '.github/workflows/matrix.yml': 'name: Matrix\njobs:\n  test:\n    strategy:\n      matrix:\n        os: [ubuntu-latest, windows-latest]\n        node: [18, 20]\n'
    });
    const res = await ci004.check(ctx);
    assert.equal(res.length, 1);
    assert.equal(res[0]?.ruleId, 'ci-004');
  });
});
