import type { OrbitApp, OrbitEvent } from './types';
export const demoApps: OrbitApp[] = [
  { id: 'tideswap', name: 'TideSwap', domain: 'tideswap.example', category: 'DeFi', color: '#157b72', chainId: 8453, description: 'A simpler way to swap on Base.', builderCode: 'tideswap', archived: false, createdAt: '2026-01-01' },
  { id: 'mintstudio', name: 'Mint Studio', domain: 'mintstudio.example', category: 'Collectibles', color: '#8b79b7', chainId: 8453, description: 'Create and collect something original.', builderCode: 'mintstudio', archived: false, createdAt: '2026-01-01' },
  { id: 'vaultbase', name: 'Vaultbase', domain: 'vaultbase.example', category: 'DeFi', color: '#d2934f', chainId: 8453, description: 'Put your assets to work.', builderCode: 'vaultbase', archived: false, createdAt: '2026-01-01' },
  { id: 'commons', name: 'Commons', domain: 'commons.example', category: 'Social', color: '#5f91ad', chainId: 8453, description: 'Small communities. Meaningful connections.', builderCode: '', archived: false, createdAt: '2026-01-01' },
];
// Deterministic, explicitly illustrative data. Never persisted or mixed with live data.
export function makeDemoEvents(now = new Date()): OrbitEvent[] {
  let seed = 12345;
  const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const events: OrbitEvent[] = [];
  const start = new Date(now); start.setUTCHours(0, 0, 0, 0); start.setUTCDate(start.getUTCDate() - 179);
  let sequence = 0;
  for (let day = 0; day < 180; day++) {
    const sessions = Math.floor(30 + day * 0.55 + random() * 28);
    for (let s = 0; s < sessions; s++) {
      const app = demoApps[Math.floor(random() * 4)];
      const uid = Math.floor(random() * (180 + day * 9));
      const wallet = '0x' + uid.toString(16).padStart(40, '0');
      const time = start.getTime() + day * 86400000 + Math.floor(random() * 86400000);
      if (time > now.getTime()) continue;
      const source = ['base-app', 'farcaster', 'direct', 'x', 'newsletter'][Math.floor(random() * 5)];
      const props = { chain_id: 8453, utm_source: source, utm_medium: source === 'direct' ? 'none' : 'social', utm_campaign: 'ecosystem', referrer: source === 'direct' ? '' : source + '.example' };
      const push = (event: string, offset: number, extra: OrbitEvent['properties'] = {}) => events.push({ id: 'demo-' + sequence++, event, appId: app.id, distinctId: wallet, timestamp: new Date(time + offset).toISOString(), properties: { ...props, ...extra } });
      push('app_opened', 0); push('$pageview', 500, { route: '/' });
      if (random() < 0.73) {
        push('wallet_connected', 3000, { connector: ['Coinbase Wallet', 'MetaMask', 'Rainbow'][Math.floor(random() * 3)] });
        if (random() < 0.7) {
          const action = app.id === 'tideswap' ? 'swap' : app.id === 'mintstudio' ? 'mint' : app.id === 'vaultbase' ? 'deposit' : 'vote';
          const tx_hash = '0x' + sequence.toString(16).padStart(64, '0');
          push('tx_submitted', 6000, { action, tx_hash });
          const success = random() > 0.07;
          push(success ? 'tx_confirmed' : 'tx_failed', 12000, { action, tx_hash, ...(success ? {} : { error_message: 'Transaction reverted' }) });
        }
      }
      if (random() < 0.2) push('form_submitted', 15000, { form_id: 'feedback', outcome: 'success' });
      if (random() < 0.35) push('interaction', 17000, { action: 'view_details', target: 'asset_card' });
    }
  }
  return events.filter(e => new Date(e.timestamp) <= now).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}
