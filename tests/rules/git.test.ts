import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { git001 } from '../../src/rules/git/git-001.js';
import { git002 } from '../../src/rules/git/git-002.js';
import { git004 } from '../../src/rules/git/git-004.js';
import { createMockContext } from '../helpers.js';

describe('Git & Repository Hygiene Rules', () => {
  it('git-001: should flag missing .gitattributes', async () => {
    const ctx = createMockContext({});
    const res = await git001.check(ctx);
    assert.equal(res.length, 1);
    assert.equal(res[0]?.ruleId, 'git-001');
  });

  it('git-001: should pass if .gitattributes exists', async () => {
    const ctx = createMockContext({
      '.gitattributes': '* text=auto eol=lf\n'
    });
    const res = await git001.check(ctx);
    assert.equal(res.length, 0);
  });

  it('git-002: should detect unresolved merge conflict markers', async () => {
    const ctx = createMockContext({
      'src/file.ts': 'const a = 1;\n<<<<<<< HEAD\nconst b = 2;\n=======\nconst b = 3;\n>>>>>>> main\n'
    });
    const res = await git002.check(ctx);
    assert.equal(res.length, 1);
    assert.equal(res[0]?.ruleId, 'git-002');
  });

  it('git-004: should detect nested .git directories', async () => {
    const ctx = createMockContext({
      'packages/submodule/.git/config': '[core]'
    });
    const res = await git004.check(ctx);
    assert.equal(res.length, 1);
    assert.equal(res[0]?.ruleId, 'git-004');
  });
});
