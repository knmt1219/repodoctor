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

  it('should detect classic GitHub Personal Access Tokens', () => {
    const dummyClassic = 'ghp_' + 'A'.repeat(36);
    const result = containsSecretPattern(`export GITHUB_TOKEN="${dummyClassic}"`);
    assert.equal(result.match, true);
    assert.equal(result.patternName, 'GitHub Personal Access Token (classic)');
  });

  it('should detect private key headers', () => {
    const text = '-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA0...';
    const result = containsSecretPattern(text);
    assert.equal(result.match, true);
    assert.equal(result.patternName, 'Private Key Header');
  });

  it('should detect OpenAI API key patterns', () => {
    const dummyKey = 'sk-proj-' + 'B'.repeat(36);
    const text = `const key = "${dummyKey}";`;
    const result = containsSecretPattern(text);
    assert.equal(result.match, true);
    assert.equal(result.patternName, 'OpenAI API Key');
  });

  it('should not false positive on normal code', () => {
    const text = 'const apiUrl = "https://api.github.com/users";';
    const result = containsSecretPattern(text);
    assert.equal(result.match, false);
  });
});
