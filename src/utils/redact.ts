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

const PLACEHOLDER_STRINGS = [
  'your_api_key',
  'replace_me',
  'placeholder',
  'example',
  'dummy_token',
  'insert_token',
  'xxxx',
  '0000',
  '12345678',
  'abcdefgh'
];

function isLikelyPlaceholder(value: string): boolean {
  const lower = value.toLowerCase();
  for (const p of PLACEHOLDER_STRINGS) {
    if (lower.includes(p)) return true;
  }
  // Check if string is composed of identical repeated characters (e.g. AAAAAAAAAAAAAAAAAAAA)
  if (/^(.)\1+$/.test(value)) return true;
  return false;
}

export function containsSecretPattern(text: string): { match: boolean; patternName?: string; snippet?: string } {
  // Regex patterns without /g to avoid stateful regex.lastIndex mutation across calls
  const PATTERNS: Array<{ name: string; regex: RegExp }> = [
    { name: 'GitHub Personal Access Token (classic)', regex: /ghp_[0-9a-zA-Z]{36}/ },
    { name: 'GitHub Fine-grained PAT', regex: /github_pat_[0-9a-zA-Z_]{82}/ },
    { name: 'GitHub OAuth Access Token', regex: /gho_[0-9a-zA-Z]{36}/ },
    { name: 'AWS Access Key ID', regex: /(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/ },
    { name: 'Slack Bot Token', regex: /xoxb-[0-9]{11,13}-[0-9]{11,13}-[a-zA-Z0-9]{24}/ },
    { name: 'Slack User Token', regex: /xoxp-[0-9]{11,13}-[0-9]{11,13}-[a-zA-Z0-9]{24}/ },
    { name: 'Private Key Header', regex: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/ },
    { name: 'OpenAI API Key', regex: /sk-(?:proj-|live-)?[a-zA-Z0-9]{32,64}/ },
    { name: 'Google AI / Gemini API Key', regex: /AIzaSy[0-9A-Za-z-_]{33}/ },
    { name: 'Stripe Secret Key', regex: /sk_live_[0-9a-zA-Z]{24,34}/ },
    { name: 'Generic API Key Assignment', regex: /(?:api_key|apikey|secret_key|auth_token)\s*[:=]\s*["']([a-zA-Z0-9_\-]{20,})["']/i }
  ];

  for (const { name, regex } of PATTERNS) {
    const match = regex.exec(text);
    if (match) {
      const fullMatch = match[1] || match[0];
      if (isLikelyPlaceholder(fullMatch)) {
        continue;
      }
      return {
        match: true,
        patternName: name,
        snippet: redactSecret(fullMatch)
      };
    }
  }

  return { match: false };
}
