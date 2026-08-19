import { Rule } from '../core/types.js';

// Security Rules
import { sec001 } from './sec/sec-001.js';
import { sec002 } from './sec/sec-002.js';
import { sec003 } from './sec/sec-003.js';
import { sec004 } from './sec/sec-004.js';
import { sec005 } from './sec/sec-005.js';
import { sec006 } from './sec/sec-006.js';

// OSS Rules
import { oss001 } from './oss/oss-001.js';
import { oss002 } from './oss/oss-002.js';
import { oss003 } from './oss/oss-003.js';
import { oss004 } from './oss/oss-004.js';
import { oss005 } from './oss/oss-005.js';
import { oss006 } from './oss/oss-006.js';
import { oss007 } from './oss/oss-007.js';
import { oss008 } from './oss/oss-008.js';

// CI Rules
import { ci001 } from './ci/ci-001.js';
import { ci002 } from './ci/ci-002.js';
import { ci003 } from './ci/ci-003.js';
import { ci004 } from './ci/ci-004.js';

// Package Rules
import { pkg001 } from './pkg/pkg-001.js';
import { pkg002 } from './pkg/pkg-002.js';
import { pkg003 } from './pkg/pkg-003.js';
import { pkg004 } from './pkg/pkg-004.js';

// Git Rules
import { git001 } from './git/git-001.js';
import { git002 } from './git/git-002.js';
import { git003 } from './git/git-003.js';
import { git004 } from './git/git-004.js';
import { git005 } from './git/git-005.js';

// Docker Rules
import { docker001 } from './docker/docker-001.js';
import { docker002 } from './docker/docker-002.js';

export const ALL_RULES: Rule[] = [
  // Security
  sec001,
  sec002,
  sec003,
  sec004,
  sec005,
  sec006,

  // OSS & Community
  oss001,
  oss002,
  oss003,
  oss004,
  oss005,
  oss006,
  oss007,
  oss008,

  // CI/CD
  ci001,
  ci002,
  ci003,
  ci004,

  // Package
  pkg001,
  pkg002,
  pkg003,
  pkg004,

  // Git
  git001,
  git002,
  git003,
  git004,
  git005,

  // Docker
  docker001,
  docker002
];

export const RULES_MAP = new Map<string, Rule>(
  ALL_RULES.map(rule => [rule.id, rule])
);

export function getRuleById(id: string): Rule | undefined {
  return RULES_MAP.get(id);
}
