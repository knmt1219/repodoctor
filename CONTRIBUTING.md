# Contributing to RepoDoctor

Thank you for your interest in contributing to **RepoDoctor**! We welcome contributions from the community, whether it's adding new rules, improving diagnostic accuracy, refining documentation, or fixing bugs.

## Code of Conduct

All contributors and maintainers are expected to adhere to our [Code of Conduct](CODE_OF_CONDUCT.md).

## Development Setup

### Prerequisites

- **Node.js**: >= 18.0.0 (Node 20+ recommended)
- **npm**: >= 9.0.0
- **Git**

### Clone & Install

```bash
git clone https://github.com/knmt1219/repodoctor.git
cd repodoctor
npm install
```

### Available Scripts

- `npm run build`: Compile TypeScript to `dist/`
- `npm run build:watch`: Run TypeScript compiler in watch mode
- `npm run typecheck`: Run TypeScript type checking without emitting files
- `npm run lint`: Run type checking and code consistency verification
- `npm test`: Compile and run the complete test suite
- `npm run test:coverage`: Run test suite with experimental V8 code coverage
- `npm run doctor`: Run RepoDoctor on this repository (dogfooding)
- `npm run doctor:fix`: Auto-fix fixable issues on this repository

## Architecture Overview

RepoDoctor is organized into clean, isolated modules:

```
src/
├── cli/              # Commander CLI interface and subcommands
│   ├── commands/     # check, fix, init, rules, explain
│   └── index.ts
├── config/           # Configuration loader (.repodoctor.yml, json, package.json)
├── core/             # Core execution engine, score calculation, context caching, fixers
├── reporters/        # Output formatters (Terminal, JSON, SARIF 2.1.0, Markdown, GitHub)
├── rules/            # Production rule implementations
│   ├── ci/           # GitHub Actions CI best practices
│   ├── docker/       # Dockerfile and container hygiene
│   ├── git/          # Git and repository structure
│   ├── oss/          # Open-source community standards & metadata
│   ├── pkg/          # Package manifests & lockfiles
│   └── sec/          # Security, token leaks, and script execution
└── utils/            # Fast filesystem, git detection, parsers, and secret redaction
```

## Adding a New Rule

Adding a new rule is straightforward:

1. **Create the rule file** under the appropriate category directory in `src/rules/<category>/<rule-id>.ts`.
2. **Implement the `Rule` interface**:
   ```typescript
   import { Rule, RuleResult } from '../../core/types.js';

   export const myRule: Rule = {
     id: 'sec-007',
     title: 'Short descriptive title',
     description: 'Detailed description of what is checked.',
     category: 'security',
     defaultSeverity: 'warn',
     fixable: false,
     docs: {
       whyItMatters: 'Explanation of risk or architectural impact.',
       badExample: 'Non-compliant snippet',
       goodExample: 'Compliant snippet',
       remediationGuide: 'Step-by-step instructions to fix.'
     },
     async check(context): Promise<RuleResult[]> {
       // Inspect files via context.readFile(), context.readYaml(), context.listFiles()
       return [];
     }
   };
   ```
3. **Register the rule** in `src/rules/index.ts`.
4. **Add unit tests** in `tests/rules/<category>.test.ts` with both positive (compliant) and negative (violating) fixtures.
5. **Verify**: Run `npm test` to ensure all tests pass.

## Pull Request Checklist

Before submitting your PR, please verify:

- [ ] `npm run typecheck` passes with zero type errors.
- [ ] `npm test` runs with 100% passing tests.
- [ ] New rules include documentation (`whyItMatters`, examples, remediation) and unit tests.
- [ ] `npm run doctor` reports 100/100 (Grade A+) on the local repository.
- [ ] Commit messages are clear and follow semantic conventions (`feat: ...`, `fix: ...`, `docs: ...`).

Thank you for making open-source repositories safer and healthier!
