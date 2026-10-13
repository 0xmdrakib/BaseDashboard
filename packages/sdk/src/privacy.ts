export const forbiddenKey = /email|name|phone|address|password|secret|token|payment|card|ssn|passport|government|message|content|body|value|input|signature|calldata/i;
const safeText = /^[a-zA-Z0-9_ .:/-]{0,120}$/;
export function cleanProperties(input: Record<string, unknown>, allowed: Set<string>) {
  const output: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(input)) {
    if (!allowed.has(key) || forbiddenKey.test(key) && key !== 'error_message') continue;
    if (key === 'error_message' && !['User rejected the request', 'Transaction reverted', 'Insufficient funds', 'Confirmation timed out', 'Network error', 'Transaction request failed'].includes(String(value))) continue;
    if (typeof value === 'number' && Number.isFinite(value) || typeof value === 'boolean' || value === null) output[key] = value as number | boolean | null;
    else if (typeof value === 'string' && safeText.test(value) && !/@|\b\d{13,19}\b/.test(value)) output[key] = value;
  }
  return output;
}
export function safeError(error: unknown) {
  const e = error as { code?: number; name?: string; message?: string; cause?: { code?: number } } | null;
  if (e?.code === 4001 || e?.cause?.code === 4001 || /reject|denied|cancel/i.test(e?.message ?? '')) return 'User rejected the request';
  if (/revert/i.test(e?.name ?? '') || /revert/i.test(e?.message ?? '')) return 'Transaction reverted';
  if (/insufficient funds/i.test(e?.message ?? '')) return 'Insufficient funds';
  if (/timeout|timed out/i.test(e?.message ?? '')) return 'Confirmation timed out';
  if (/network|fetch/i.test(e?.message ?? '')) return 'Network error';
  return 'Transaction request failed';
}
