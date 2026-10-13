export const appIdPattern = /^[a-z][a-z0-9-]{1,47}$/;
export const networks = [
  { id: 8453, name: 'Base' }, { id: 84532, name: 'Base Sepolia' },
  { id: 1, name: 'Ethereum' }, { id: 10, name: 'Optimism' },
  { id: 42161, name: 'Arbitrum' }, { id: 137, name: 'Polygon' },
];
export const networkName = (id: number) => networks.find(n => n.id === id)?.name ?? `Chain ${id}`;

// Accept a pasted app URL, but retain only its hostname and optional port.
export function normalizeAppDomain(value: string): string {
  const raw = value.trim();
  if (!raw || /[\s\\]/.test(raw)) throw new Error('Enter your app’s domain or a full https:// URL.');
  let url: URL;
  try { url = new URL(raw.includes('://') ? raw : `https://${raw}`); }
  catch { throw new Error('Enter a valid app URL, such as https://your-app.com.'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('Use an http or https URL without a username or password.');
  }
  const hostname = url.hostname.toLowerCase().replace(/\.$/, '');
  const isIpv6 = hostname.startsWith('[');
  const validLabels = hostname.split('.').every(label => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label));
  if (hostname.length > 253 || !hostname || (!isIpv6 && (!validLabels || !hostname.includes('.') && hostname !== 'localhost'))) {
    throw new Error('Enter a complete domain, such as your-app.com.');
  }
  return hostname + (url.port ? `:${url.port}` : '');
}

export function suggestAppId(name: string, domain = '', existing: string[] = []): string {
  const slug = (value: string) => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  let base = slug(name);
  if (!base) {
    try { base = slug(normalizeAppDomain(domain).split('.')[0]); } catch { /* The name can be entered first. */ }
  }
  if (!base) base = 'my-app';
  if (!/^[a-z]/.test(base)) base = 'app-' + base;
  if (base.length < 2) base += '-app';
  base = base.slice(0, 48).replace(/-+$/, '');
  const used = new Set(existing);
  let candidate = base;
  for (let suffix = 2; used.has(candidate); suffix++) {
    const ending = '-' + suffix;
    candidate = base.slice(0, 48 - ending.length).replace(/-+$/, '') + ending;
  }
  return candidate;
}
