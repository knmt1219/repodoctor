import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateHealthScore } from '../src/core/score.js';
import { RuleResult } from '../src/core/types.js';

describe('Health Score Calculator', () => {
  const activeCounts = {
    security: 6,
    oss: 8,
    ci: 4,
    package: 4,
    git: 5,
    docker: 2
  };

  it('should return 100 and Grade A+ when there are no violations', () => {
    const score = calculateHealthScore([], activeCounts);
    assert.equal(score.score, 100);
    assert.equal(score.grade, 'A+');
    assert.equal(score.breakdown.security.score, 100);
    assert.equal(score.breakdown.oss.score, 100);
  });

  it('should calculate deductions for errors and warnings', () => {
    const violations: RuleResult[] = [
      {
        ruleId: 'sec-001',
        ruleTitle: 'Action pinning',
        category: 'security',
        severity: 'error',
        message: 'Violation',
        fixable: false
      },
      {
        ruleId: 'sec-002',
        ruleTitle: 'Workflow perms',
        category: 'security',
        severity: 'warn',
        message: 'Violation',
        fixable: true
      }
    ];

    const score = calculateHealthScore(violations, activeCounts);
    assert.ok(score.score < 100);
    assert.equal(score.breakdown.security.errors, 1);
    assert.equal(score.breakdown.security.warnings, 1);
    // Security score: 100 - (1*25 + 1*10) = 65
    assert.equal(score.breakdown.security.score, 65);
  });

  it('should recalculate weight distribution when some categories are disabled', () => {
    // Only 'security' is enabled (activeRules = 6), all others 0
    const partialCounts = {
      security: 6,
      oss: 0,
      ci: 0,
      package: 0,
      git: 0,
      docker: 0
    };

    const violations: RuleResult[] = [
      {
        ruleId: 'sec-001',
        ruleTitle: 'Action pinning',
        category: 'security',
        severity: 'error',
        message: 'Violation',
        fixable: false
      }
    ];

    const score = calculateHealthScore(violations, partialCounts);
    // Security score: 100 - 25 = 75. Since only security is active, total score is exactly 75!
    assert.equal(score.score, 75);
    assert.equal(score.grade, 'B');
  });

  it('should return 100 and Grade A+ when all categories are disabled', () => {
    const zeroCounts = {
      security: 0,
      oss: 0,
      ci: 0,
      package: 0,
      git: 0,
      docker: 0
    };

    const score = calculateHealthScore([], zeroCounts);
    assert.equal(score.score, 100);
    assert.equal(score.grade, 'A+');
  });

  it('should assign correct letter grades based on total score', () => {
    const categories: Array<RuleResult['category']> = ['security', 'oss', 'ci', 'package', 'git', 'docker'];
    const manyErrors: RuleResult[] = [];

    // Add 4 errors to every single category so all categories drop to 0%
    for (const cat of categories) {
      for (let i = 0; i < 4; i++) {
        manyErrors.push({
          ruleId: `${cat}-00${i}`,
          ruleTitle: 'Err',
          category: cat,
          severity: 'error',
          message: 'Err',
          fixable: false
        });
      }
    }

    const score = calculateHealthScore(manyErrors, activeCounts);
    assert.equal(score.score, 0);
    assert.equal(score.grade, 'F');
  });
});
