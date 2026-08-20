import { Command } from 'commander';
import { runCheckCommand } from './commands/check.js';
import { runFixCommand } from './commands/fix.js';
import { runInitCommand } from './commands/init.js';
import { runRulesCommand } from './commands/rules.js';
import { runExplainCommand } from './commands/explain.js';

export function createCli(): Command {
  const program = new Command();

  program
    .name('repodoctor')
    .description('Zero-config Repository Health, Security & CI Linter for modern open-source projects')
    .version('0.1.4');

  program
    .command('check', { isDefault: true })
    .description('Run repository health and security diagnostics')
    .argument('[target]', 'Target repository directory', '.')
    .option('-c, --config <path>', 'Path to custom configuration file')
    .option('-f, --format <format>', 'Output format: terminal, json, sarif, markdown, markdown-pr, github', 'terminal')
    .option('-o, --output <file>', 'Save output report to file')
    .option('--summary', 'Output concise Markdown PR summary table (ideal for CI PR comments)')
    .option('--score-threshold <number>', 'Fail if health score is below threshold')
    .option('--max-warnings <number>', 'Fail if number of warnings exceeds limit')
    .option('--strict', 'Treat warnings as errors (exit with code 1 if any warnings exist)')
    .option('--fix', 'Automatically apply remediation fixes where possible')
    .action(async (target, options) => {
      const exitCode = await runCheckCommand(target, options);
      process.exitCode = exitCode;
    });

  program
    .command('fix')
    .description('Automatically apply remediation fixes to repository')
    .argument('[target]', 'Target repository directory', '.')
    .option('-c, --config <path>', 'Path to custom configuration file')
    .option('--dry-run', 'Preview fixes that would be applied without modifying files')
    .option('--strict', 'Treat remaining warnings as errors')
    .action(async (target, options) => {
      const exitCode = await runFixCommand(target, options);
      process.exitCode = exitCode;
    });

  program
    .command('init')
    .description('Scaffold a new .repodoctor.yml configuration file')
    .argument('[target]', 'Target repository directory', '.')
    .action(async (target) => {
      const exitCode = await runInitCommand(target);
      process.exitCode = exitCode;
    });

  program
    .command('rules')
    .description('List all available rules in catalog')
    .argument('[category]', 'Filter by category (security, oss, ci, package, git, docker)')
    .action(async (category) => {
      const exitCode = await runRulesCommand(category);
      process.exitCode = exitCode;
    });

  program
    .command('explain')
    .description('Show in-depth rationale, examples, and remediation for a specific rule')
    .argument('<rule-id>', 'Rule ID (e.g. sec-001, oss-001, ci-001)')
    .action(async (ruleId) => {
      const exitCode = await runExplainCommand(ruleId);
      process.exitCode = exitCode;
    });

  return program;
}

export async function runCli(): Promise<void> {
  const program = createCli();
  await program.parseAsync(process.argv);
}
