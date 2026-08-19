/**
 * Redacts sensitive tokens or secrets so they can never be logged or output in full.
 */
export function redactSecret(secret: string, visiblePrefix = 4, visibleSuffix = 3): string {
  if (!secret) return '';
  const trimmed = secret.trim();
  if (trimmed.length <= visiblePrefix + visibleSuffix) {
    return '***[REDACTED]***';
  }
  const prefix = trimmed.slice(0, visiblePrefix);
  const suffix = trimmed.slice(-visibleSuffix);
  return `${prefix}${'*'.repeat(Math.min(12, Math.max(4, trimmed.length - visiblePrefix - visibleSuffix)))}${suffix}`;
}

export function containsSecretPattern(text: string): { match: boolean; patternName?: string; snippet?: string } {
  const PATTERNS: Array<{ name: string; regex: RegExp }> = [
    { name: 'GitHub Personal Access Token (classic)', regex: /ghp_[0-9a-zA-Z]{36}/g },
    { name: 'GitHub Fine-grained PAT', regex: /github_pat_[0-9a-zA-Z_]{82}/g },
    { name: 'GitHub OAuth Access Token', regex: /gho_[0-9a-zA-Z]{36}/g },
    { name: 'AWS Access Key ID', regex: /(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/g },
    { name: 'Slack Bot Token', regex: /xoxb-[0-9]{11,13}-[0-9]{11,13}-[a-zA-Z0-9]{24}/g },
    { name: 'Slack User Token', regex: /xoxp-[0-9]{11,13}-[0-9]{11,13}-[a-zA-Z0-9]{24}/g },
    { name: 'Private Key Header', regex: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g },
    { name: 'OpenAI API Key', regex: /sk-(?:proj-|live-)?[a-zA-Z0-9]{32,64}/g },
    { name: 'Google AI / Gemini API Key', regex: /AIzaSy[0-9A-Za-z-_]{33}/g },
    { name: 'Stripe Secret Key', regex: /sk_live_[0-9a-zA-Z]{24,34}/g },
    { name: 'Generic API Key Assignment', regex: /(?:api_key|apikey|secret_key|auth_token)\s*[:=]\s*["']([a-zA-Z0-9_\-]{20,})["']/i }
  ];

  for (const { name, regex } of PATTERNS) {
    const match = regex.exec(text);
    if (match) {
      const fullMatch = match[0];
      return {
        match: true,
        patternName: name,
        snippet: redactSecret(fullMatch)
      };
    }
  }

  return { match: false };
}
