import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { findLineAndColumn, parseJsonSafe, parseLines, parseYamlSafe } from '../src/utils/parsers.js';

describe('Safe Parsers', () => {
  it('should safely parse valid JSON', () => {
    const res = parseJsonSafe<{ name: string }>('{"name": "repodoctor"}');
    assert.equal(res.success, true);
    if (res.success) {
      assert.equal(res.data.name, 'repodoctor');
    }
  });

  it('should safely return failure on malformed JSON without crashing', () => {
    const res = parseJsonSafe('{ invalid json');
    assert.equal(res.success, false);
    if (!res.success) {
      assert.ok(res.error.length > 0);
    }
  });

  it('should safely parse valid YAML', () => {
    const yamlStr = 'name: repodoctor\nversion: 0.1.0\nsteps:\n  - run: npm test\n';
    const res = parseYamlSafe<{ name: string; version: string }>(yamlStr);
    assert.equal(res.success, true);
    if (res.success) {
      assert.equal(res.data.name, 'repodoctor');
      assert.equal(res.data.version, '0.1.0');
    }
  });

  it('should safely return failure on invalid YAML without throwing', () => {
    const badYaml = 'key: [unclosed list';
    const res = parseYamlSafe(badYaml);
    assert.equal(res.success, false);
  });

  it('should accurately find line and column of substring', () => {
    const text = 'line one\nline two contains TARGET\nline three';
    const loc = findLineAndColumn(text, 'TARGET');
    assert.deepEqual(loc, { line: 2, column: 19 });
  });

  it('should split lines correctly across CRLF and LF', () => {
    const text = 'line 1\r\nline 2\nline 3';
    const lines = parseLines(text);
    assert.deepEqual(lines, ['line 1', 'line 2', 'line 3']);
  });
});
