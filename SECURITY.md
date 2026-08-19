# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Security Guarantees & Safe Execution

RepoDoctor is designed from the ground up to safely inspect repositories without executing untrusted code:

1. **Zero Dynamic Code Execution**: RepoDoctor parses repository files strictly as **static data** (using AST, JSON, YAML, and safe text scanners). It never evaluates, imports, or executes scripts found in analyzed repositories.
2. **Local and Offline First**: Diagnostics run 100% locally on your machine or CI runner. No repository code, file names, or metadata are ever transmitted over the network.
3. **Secret Redaction**: Detected API keys, private keys, and tokens are automatically masked (e.g. `ghp_***...1234`) and are never printed in full to terminal logs, SARIF artifacts, or CI annotations.

## Reporting a Vulnerability

If you discover a potential security vulnerability in **RepoDoctor**, please report it responsibly:

- **Preferred**: Open a private **GitHub Security Advisory** directly on the GitHub repository.
- **Alternative**: Contact the security team via email at `security@repodoctor.dev`.

Please include:
- A description of the vulnerability and affected versions
- Minimal steps or a reproduction repository
- Potential impact or proof of concept

We acknowledge receipt of reports within **48 hours** and aim to release patches for confirmed vulnerabilities within **7 business days**.
