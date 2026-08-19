import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { containsSecretPattern, redactSecret } from '../src/utils/redact.js';

describe('Secret Redaction & Detection', () => {
  it('should redact sensitive strings leaving small prefix/suffix', () => {
    const raw = 'ghp_1234567890abcdefghijklmnopqrstuvwxyz';
    const redacted = redactSecret(raw);
    assert.ok(redacted.startsWith('ghp_'));
    assert.ok(redacted.endsWith('xyz'));
    assert.ok(redacted.includes('***'));
    assert.ok(!redacted.includes('1234567890'));
  });

  it('should detect classic GitHub Personal Access Tokens deterministically across consecutive runs', () => {
    const dummyClassic = 'ghp_' + 'A'.repeat(36);
    // Call multiple times to verify no stateful lastIndex bug
    for (let i = 0; i < 5; i++) {
      const result = containsSecretPattern(`export GITHUB_TOKEN="${dummyClassic}"`);
      assert.equal(result.match, true, `Failed on iteration ${i}`);
      assert.equal(result.patternName, 'GitHub Personal Access Token (classic)');
    }
  });

  it('should detect private key headers', () => {
    const text = '-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA0...';
    const result = containsSecretPattern(text);
    assert.equal(result.match, true);
    assert.equal(result.patternName, 'Private Key Header');
  });

  it('should detect OpenAI API key patterns', () => {
    const dummyKey = 'sk-proj-7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b';
    const text = `const key = "${dummyKey}";`;
    const result = containsSecretPattern(text);
    assert.equal(result.match, true);
    assert.equal(result.patternName, 'OpenAI API Key');
  });

  it('should ignore obvious placeholders without false positives', () => {
    const text1 = 'const key = "YOUR_API_KEY_HERE_REPLACE_ME";';
    assert.equal(containsSecretPattern(text1).match, false);

    const text2 = 'const key = "sk-placeholder-example-key-12345678";';
    assert.equal(containsSecretPattern(text2).match, false);
  });

  it('should not false positive on normal code', () => {
    const text = 'const apiUrl = "https://api.github.com/users";';
    const result = containsSecretPattern(text);
    assert.equal(result.match, false);
  });
});
