import { RepoDoctorConfig } from './types.js';

export const DEFAULT_CONFIG: RepoDoctorConfig = {
  scoreThreshold: 75,
  maxWarnings: -1, // -1 means unlimited
  ignore: [
    '**/node_modules/**',
    '**/.git/**',
    '**/dist/**',
    '**/build/**',
    '**/coverage/**',
    '**/.next/**',
    '**/.turbo/**',
    '**/vendor/**',
    '**/target/**',
    '**/*.min.js',
    '**/*.min.css',
    '**/*.map'
  ],
  categories: {
    security: true,
    oss: true,
    ci: true,
    package: true,
    git: true,
    docker: true
  },
  rules: {
    // Security & Secrets
    'sec-001': 'error', // Action SHA pinning
    'sec-002': 'warn',  // Explicit workflow permissions
    'sec-003': 'error', // .gitignore secrets pattern
    'sec-004': 'error', // No curl | sh execution
    'sec-005': 'error', // No committed private keys or secrets
    'sec-006': 'warn',  // Safe pull_request_target usage

    // OSS & Community Standards
    'oss-001': 'error', // License file exists
    'oss-002': 'warn',  // Comprehensive README
    'oss-003': 'warn',  // CONTRIBUTING.md guide
    'oss-004': 'info',  // CODE_OF_CONDUCT.md
    'oss-005': 'warn',  // SECURITY.md
    'oss-006': 'info',  // Issue templates
    'oss-007': 'info',  // Pull request template
    'oss-008': 'warn',  // Repository metadata (description, repository URL)

    // CI/CD Best Practices
    'ci-001': 'warn',   // Workflow timeout-minutes
    'ci-002': 'warn',   // Concurrency cancellation
    'ci-003': 'warn',   // CI workflow exists
    'ci-004': 'info',   // Matrix fail-fast policy

    // Package & Dependency Hygiene
    'pkg-001': 'error', // Lockfile exists
    'pkg-002': 'error', // No conflicting lockfiles
    'pkg-003': 'warn',  // No wildcard '*' dependencies
    'pkg-004': 'warn',  // Standard scripts (test, build, lint)

    // Git & File Structure Hygiene
    'git-001': 'warn',  // .gitattributes exists
    'git-002': 'error', // Merge conflict markers
    'git-003': 'warn',  // Large binary files
    'git-004': 'error', // Nested .git repositories
    'git-005': 'error', // Broken symlinks

    // Docker & Container Hygiene
    'docker-001': 'warn', // Base image pinning
    'docker-002': 'warn'  // .dockerignore exists if Dockerfile is present
  },
  options: {
    maxBinarySizeKb: 1024, // 1MB threshold for non-LFS binaries
    allowedLicenses: ['MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC', 'MPL-2.0', 'GPL-3.0', 'LGPL-3.0', 'AGPL-3.0', 'Unlicense', 'CC0-1.0'],
    requiredScripts: ['test', 'build', 'lint']
  }
};
