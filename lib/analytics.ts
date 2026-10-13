import { walletPattern, type OrbitEvent } from './types';
export const dayMs = 86400000;
export const number = (n: number) => new Intl.NumberFormat('en-US').format(n);
export const compact = (n: number) => new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
export const percent = (n: number) => `${n.toFixed(1)}%`;
export const shortAddress = (s: string) => s.length > 18 ? `${s.slice(0, 6)}…${s.slice(-4)}` : s;
export const isWallet = (e: OrbitEvent) => walletPattern.test(e.distinctId);
export const identity = (e: OrbitEvent) => e.personId && e.personId !== '00000000-0000-0000-0000-000000000000' ? e.personId : e.distinctId.toLowerCase();
export function selectEvents(events: OrbitEvent[], appId: string, from: Date, to = new Date()) {
  return events.filter(e => (!appId || e.appId === appId) && Date.parse(e.timestamp) >= from.getTime() && Date.parse(e.timestamp) <= to.getTime());
}
export function metrics(events: OrbitEvent[]) {
  const wallets = new Set(events.filter(isWallet).map(e => e.distinctId.toLowerCase())).size;
  const submitted = events.filter(e => e.event === 'tx_submitted').length;
  const confirmed = events.filter(e => e.event === 'tx_confirmed').length;
  const failed = events.filter(e => e.event === 'tx_failed').length;
  return { wallets, events: events.length, submitted, confirmed, failed, success: confirmed + failed ? confirmed / (confirmed + failed) * 100 : 0, connections: events.filter(e => e.event === 'wallet_connected').length };
}
export function trend(events: OrbitEvent[], days: number, now = new Date()) {
  const map = new Map<string, { date: string; wallets: Set<string>; transactions: number; failed: number; events: number }>();
  for (let i = days - 1; i >= 0; i--) { const d = new Date(now); d.setUTCDate(d.getUTCDate() - i); const date = d.toISOString().slice(0, 10); map.set(date, { date, wallets: new Set(), transactions: 0, failed: 0, events: 0 }); }
  for (const e of events) { const d = map.get(e.timestamp.slice(0, 10)); if (!d) continue; d.events++; if (isWallet(e)) d.wallets.add(e.distinctId.toLowerCase()); if (e.event === 'tx_confirmed') d.transactions++; if (e.event === 'tx_failed') d.failed++; }
  return [...map.values()].map(d => ({ date: new Date(d.date + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }), wallets: d.wallets.size, transactions: d.transactions, events: d.events, success: d.transactions + d.failed ? d.transactions / (d.transactions + d.failed) * 100 : 0 }));
}
export function delta(current: number, previous: number) { return previous ? (current - previous) / previous * 100 : current ? null : 0; }
// Ordered, same-app, same-identity funnel. Repeated starts are allowed within the conversion window.
export function funnel(events: OrbitEvent[], steps: string[], windowHours = 24) {
  const identities = new Map<string, OrbitEvent[]>();
  for (const e of events) { const key = `${e.appId}:${identity(e)}`; const rows = identities.get(key) ?? []; rows.push(e); identities.set(key, rows); }
  const counts = steps.map(() => 0);
  for (const rows of identities.values()) {
    rows.sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
    let best = 0; const starts: (number | null)[] = steps.map(() => null);
    for (const row of rows) {
      const time = Date.parse(row.timestamp);
      for (let stage = steps.length - 1; stage >= 1; stage--) {
        const started = starts[stage - 1];
        if (row.event === steps[stage] && started !== null && time - started <= windowHours * 3600000) {
          starts[stage] = Math.max(starts[stage] ?? 0, started); best = Math.max(best, stage + 1);
        }
      }
      if (row.event === steps[0]) { starts[0] = time; best = Math.max(best, 1); }
      if (best === steps.length) break;
    }
    for (let i = 0; i < best; i++) counts[i]++;
  }
  return steps.map((event, i) => ({ event, count: counts[i], conversion: counts[0] ? counts[i] / counts[0] * 100 : 0, dropoff: i ? counts[i - 1] - counts[i] : 0 }));
}
export function retention(events: OrbitEvent[], now = new Date()) {
  const identities = new Map<string, Set<number>>();
  const known = new Set(events.filter(isWallet).map(e => `${e.appId}:${identity(e)}`));
  for (const e of events) { const key = `${e.appId}:${identity(e)}`; if (!known.has(key)) continue; const set = identities.get(key) ?? new Set<number>(); set.add(Math.floor(Date.parse(e.timestamp) / dayMs)); identities.set(key, set); }
  const cohorts = new Map<number, { first: number; days: Set<number> }[]>();
  for (const days of identities.values()) { const first = Math.min(...days); const week = first - (new Date(first * dayMs).getUTCDay() + 6) % 7; const entries = cohorts.get(week) ?? []; entries.push({ first, days }); cohorts.set(week, entries); }
  const today = Math.floor(now.getTime() / dayMs);
  return [...cohorts].sort(([a], [b]) => b - a).slice(0, 8).map(([week, users]) => { const counts = [1, 3, 7, 14, 30].map(day => { const eligible = users.filter(u => u.first + day < today); return { eligible: eligible.length, returned: eligible.filter(u => u.days.has(u.first + day)).length }; }); return { week: new Date(week * dayMs).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }), size: users.length, counts, cells: counts.map(c => c.eligible ? c.returned / c.eligible * 100 : null) }; });
}
export function transactions(events: OrbitEvent[]) {
  const map = new Map<string, { id: string; appId: string; wallet: string; action: string; hash: string; chainId: number; timestamp: string; status: 'confirmed' | 'failed' | 'pending'; error: string }>();
  for (const e of [...events].sort((a, b) => a.timestamp.localeCompare(b.timestamp))) {
    if (!['tx_submitted', 'tx_confirmed', 'tx_failed'].includes(e.event)) continue;
    const hash = String(e.properties.tx_hash ?? ''); const key = `${e.appId}:${e.properties.chain_id ?? 8453}:${String(e.properties.original_tx_hash || hash || e.id)}`;
    const prior = map.get(key);
    if (prior?.status === 'confirmed' || prior?.status === 'failed' && e.event === 'tx_submitted') continue;
    map.set(key, { id: key, appId: e.appId, wallet: e.distinctId, action: String(e.properties.action ?? 'contract_interaction'), hash, chainId: Number(e.properties.chain_id ?? 8453), timestamp: e.timestamp, status: e.event === 'tx_confirmed' ? 'confirmed' : e.event === 'tx_failed' ? 'failed' : 'pending', error: String(e.properties.error_message ?? '') });
  }
  return [...map.values()].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}
export function acquisition(events: OrbitEvent[]) {
  const rows = new Map<string, { source: string; visitors: Set<string>; wallets: Set<string>; converted: Set<string> }>();
  const first = new Map<string, string>();
  for (const e of [...events].sort((a, b) => a.timestamp.localeCompare(b.timestamp))) {
    const key = `${e.appId}:${identity(e)}`;
    if (!first.has(key)) first.set(key, String(e.properties.utm_source || 'direct'));
    const source = first.get(key)!; const row = rows.get(source) ?? { source, visitors: new Set(), wallets: new Set(), converted: new Set() };
    row.visitors.add(key); if (isWallet(e)) row.wallets.add(key); if (e.event === 'tx_confirmed') row.converted.add(key); rows.set(source, row);
  }
  return [...rows.values()].map(r => ({ source: r.source, visitors: r.visitors.size, wallets: r.wallets.size, conversions: r.converted.size, rate: r.visitors.size ? r.converted.size / r.visitors.size * 100 : 0 })).sort((a, b) => b.visitors - a.visitors);
}
export function toCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return '';
  const keys = Object.keys(rows[0]);
  const escape = (value: unknown) => { let s = String(value ?? ''); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return '"' + s.replaceAll('"', '""') + '"'; };
  return [keys.map(escape).join(','), ...rows.map(r => keys.map(k => escape(typeof r[k] === 'object' ? JSON.stringify(r[k]) : r[k])).join(','))].join('\r\n');
}
