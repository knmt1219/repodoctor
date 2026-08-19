import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { docker001 } from '../../src/rules/docker/docker-001.js';
import { docker002 } from '../../src/rules/docker/docker-002.js';
import { createMockContext } from '../helpers.js';

describe('Docker Hygiene Rules', () => {
  it('docker-001: should flag unpinned base images', async () => {
    const ctx = createMockContext({
      Dockerfile: 'FROM node:latest\nWORKDIR /app\n'
    });
    const res = await docker001.check(ctx);
    assert.equal(res.length, 1);
    assert.equal(res[0]?.ruleId, 'docker-001');
  });

  it('docker-001: should pass pinned base images', async () => {
    const ctx = createMockContext({
      Dockerfile: 'FROM node:20.17-alpine\nWORKDIR /app\n'
    });
    const res = await docker001.check(ctx);
    assert.equal(res.length, 0);
  });

  it('docker-002: should flag missing .dockerignore if Dockerfile exists', async () => {
    const ctx = createMockContext({
      Dockerfile: 'FROM node:20.17-alpine\n'
    });
    const res = await docker002.check(ctx);
    assert.equal(res.length, 1);
    assert.equal(res[0]?.ruleId, 'docker-002');
  });

  it('docker-002: should pass if .dockerignore exists alongside Dockerfile', async () => {
    const ctx = createMockContext({
      Dockerfile: 'FROM node:20.17-alpine\n',
      '.dockerignore': 'node_modules\n.git\n'
    });
    const res = await docker002.check(ctx);
    assert.equal(res.length, 0);
  });
});
