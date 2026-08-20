import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { oss001 } from '../../src/rules/oss/oss-001.js';
import { oss002 } from '../../src/rules/oss/oss-002.js';
import { oss003 } from '../../src/rules/oss/oss-003.js';
import { oss004 } from '../../src/rules/oss/oss-004.js';
import { oss005 } from '../../src/rules/oss/oss-005.js';
import { oss006 } from '../../src/rules/oss/oss-006.js';
import { oss007 } from '../../src/rules/oss/oss-007.js';
import { oss008 } from '../../src/rules/oss/oss-008.js';
import { oss009 } from '../../src/rules/oss/oss-009.js';
import { createMockContext } from '../helpers.js';

describe('OSS Standards Rules (oss-001 to oss-009)', () => {
  it('oss-001: should detect missing LICENSE', async () => {
    const ctx = createMockContext({});
    const res = await oss001.check(ctx);
    assert.equal(res.length, 1);
    assert.equal(res[0]?.ruleId, 'oss-001');
  });

  it('oss-001: should pass valid LICENSE file', async () => {
    const ctx = createMockContext({
      LICENSE: 'MIT License\n\nCopyright (c) 2026 Author\n\nPermission is hereby granted...'
    });
    const res = await oss001.check(ctx);
    assert.equal(res.length, 0);
  });

  it('oss-002: should detect missing or short README', async () => {
    const ctxMissing = createMockContext({});
    const res1 = await oss002.check(ctxMissing);
    assert.equal(res1.length, 1);

    const ctxShort = createMockContext({
      'README.md': '# Hi'
    });
    const res2 = await oss002.check(ctxShort);
    assert.equal(res2.length, 1);
    assert.ok(res2[0]?.message.includes('very brief'));
  });

  it('oss-003: should detect missing CONTRIBUTING guide', async () => {
    const ctx = createMockContext({});
    const res = await oss003.check(ctx);
    assert.equal(res.length, 1);
    assert.equal(res[0]?.ruleId, 'oss-003');
  });

  it('oss-004: should detect missing CODE_OF_CONDUCT', async () => {
    const ctx = createMockContext({});
    const res = await oss004.check(ctx);
    assert.equal(res.length, 1);
    assert.equal(res[0]?.ruleId, 'oss-004');
  });

  it('oss-005: should detect missing SECURITY policy', async () => {
    const ctx = createMockContext({});
    const res = await oss005.check(ctx);
    assert.equal(res.length, 1);
    assert.equal(res[0]?.ruleId, 'oss-005');
  });

  it('oss-006: should detect missing issue templates', async () => {
    const ctx = createMockContext({});
    const res = await oss006.check(ctx);
    assert.equal(res.length, 1);
  });

  it('oss-007: should detect missing PR template', async () => {
    const ctx = createMockContext({});
    const res = await oss007.check(ctx);
    assert.equal(res.length, 1);
  });

  it('oss-008: should detect missing description or repository in package.json', async () => {
    const ctx = createMockContext({
      'package.json': JSON.stringify({ name: 'test-pkg', version: '1.0.0' })
    });
    const res = await oss008.check(ctx);
    assert.equal(res.length, 2); // description and repository
  });

  it('oss-009: should detect missing CODEOWNERS', async () => {
    const ctx = createMockContext({});
    const res = await oss009.check(ctx);
    assert.equal(res.length, 1);
    assert.equal(res[0]?.ruleId, 'oss-009');
    assert.equal(res[0]?.severity, 'warn');
  });

  it('oss-009: should pass when .github/CODEOWNERS exists', async () => {
    const ctx = createMockContext({
      '.github/CODEOWNERS': '* @maintainer\n'
    });
    const res = await oss009.check(ctx);
    assert.equal(res.length, 0);
  });

  it('oss-009: should pass when docs/CODEOWNERS exists', async () => {
    const ctx = createMockContext({
      'docs/CODEOWNERS': '* @lead-dev\n'
    });
    const res = await oss009.check(ctx);
    assert.equal(res.length, 0);
  });
});
