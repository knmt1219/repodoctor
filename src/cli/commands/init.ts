import path from 'node:path';
import { fileExists, writeFileSafe } from '../../utils/fs.js';
import { colors } from '../../utils/colors.js';

export async function runInitCommand(target = '.'): Promise<number> {
  const rootDir = path.resolve(process.cwd(), target);
  const configPath = path.join(rootDir, '.repodoctor.yml');

  if (await fileExists(configPath)) {
    console.log(`${colors.yellow('!')} Configuration file already exists at ${configPath}`);
    return 0;
  }

  const sampleConfig = `# RepoDoctor Configuration (.repodoctor.yml)
# https://github.com/repodoctor/repodoctor

# Minimum acceptable health score (0 - 100)
scoreThreshold: 80

# Maximum allowed warnings before exiting with code 1 (-1 for unlimited)
maxWarnings: -1

# Enable / disable entire rule categories
categories:
  security: true
  oss: true
  ci: true
  package: true
  git: true
  docker: true

# Custom rule severity overrides ('error', 'warn', 'info', 'off')
rules:
  sec-001: error # GitHub Action SHA pinning
  sec-002: warn  # Explicit workflow permissions
  sec-003: error # .gitignore secrets
  sec-004: error # No curl | sh
  sec-005: error # No committed secrets
  ci-001: warn   # Workflow timeout-minutes
  ci-002: warn   # PR Concurrency
  pkg-001: error # Lockfile exists
  git-001: warn  # .gitattributes

# Paths to ignore during scanning
ignore:
  - '**/node_modules/**'
  - '**/.git/**'
  - '**/dist/**'
  - '**/build/**'
  - '**/coverage/**'
`;

  const ok = await writeFileSafe(configPath, sampleConfig);
  if (ok) {
    console.log(`${colors.green('✔')} Created RepoDoctor configuration at ${colors.bold(configPath)}`);
    return 0;
  } else {
    console.error(`${colors.red('✖')} Failed to write configuration file at ${configPath}`);
    return 1;
  }
}
