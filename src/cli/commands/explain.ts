import { getRuleById } from '../../rules/index.js';
import { colors } from '../../utils/colors.js';

export async function runExplainCommand(ruleId: string): Promise<number> {
  const rule = getRuleById(ruleId.toLowerCase());

  if (!rule) {
    console.error(`${colors.red('✖')} Unknown rule: "${ruleId}". Run 'repodoctor rules' to see all rules.`);
    return 1;
  }

  console.log('');
  console.log(`${colors.bold(colors.cyan(rule.id))}: ${colors.bold(rule.title)}`);
  console.log(colors.dim('─'.repeat(70)));
  console.log('');
  console.log(`${colors.bold('Category:')} ${rule.category}`);
  console.log(`${colors.bold('Default Severity:')} ${rule.defaultSeverity}`);
  console.log(`${colors.bold('Auto-fixable:')} ${rule.fixable ? colors.green('Yes') : 'No'}`);
  console.log('');
  console.log(colors.bold('Description:'));
  console.log(`  ${rule.description}`);
  console.log('');
  console.log(colors.bold('Why It Matters:'));
  console.log(`  ${rule.docs.whyItMatters}`);
  console.log('');

  if (rule.docs.badExample) {
    console.log(colors.bold(colors.red('Non-Compliant Example:')));
    for (const line of rule.docs.badExample.split('\n')) {
      console.log(`  ${colors.red('│')} ${line}`);
    }
    console.log('');
  }

  if (rule.docs.goodExample) {
    console.log(colors.bold(colors.green('Compliant Example:')));
    for (const line of rule.docs.goodExample.split('\n')) {
      console.log(`  ${colors.green('│')} ${line}`);
    }
    console.log('');
  }

  console.log(colors.bold('Remediation Guide:'));
  console.log(`  ${rule.docs.remediationGuide}`);
  console.log('');

  return 0;
}
