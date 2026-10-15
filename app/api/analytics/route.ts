import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { queryCache } from '@/db/schema';
import { getApps, getSettings, HttpError, requireOwner, responseError, runtimeValue } from '@/lib/server';
import { appIdPattern } from '@/lib/app-config';
import type { DataResponse, OrbitEvent } from '@/lib/types';
import { cleanProperties } from '@/packages/sdk/src/privacy';
import { readPostHogJson } from '@/lib/posthog-response';
const allowed = ['action', 'tx_hash', 'original_tx_hash', 'chain_id', 'connector', 'utm_source', 'utm_medium', 'utm_campaign', 'referrer', 'form_id', 'outcome', 'target', 'route', 'error_message', 'environment', 'sdk_version', 'interaction_type'];
export async function GET(request: Request) {
  try {
    const owner = await requireOwner(); const settings = await getSettings(owner); const secret = runtimeValue('POSTHOG_PERSONAL_API_KEY');
    if (!secret || !settings.projectId) throw new HttpError(409, 'Connect PostHog in Settings to load your real analytics.');
    const url = new URL(request.url); const days = Number(url.searchParams.get('days') || 30); if (![7, 30, 90].includes(days)) throw new HttpError(400, 'Invalid date range.');
    const app = url.searchParams.get('app') || ''; if (app && !/^[a-z][a-z0-9-]{1,47}$/.test(app)) throw new HttpError(400, 'Invalid app ID.');
    const registered = (await getApps(owner)).map(a => a.id).filter(id => appIdPattern.test(id)).sort();
    if (app && !registered.includes(app)) throw new HttpError(404, 'Register this application in your workspace first.');
    const key = `v3:${owner}:${settings.region}:${settings.projectId}:${days}:${app}:${registered.join(',')}`;
    const cached = url.searchParams.get('refresh') === '1' ? undefined : (await getDb().select().from(queryCache).where(eq(queryCache.key, key)).limit(1))[0];
    if (cached && cached.expiresAt > Date.now()) return Response.json({ ...JSON.parse(cached.payload), cached: true }, { headers: { 'Cache-Control': 'private, no-store' } });
    const from = new Date(Date.now() - Math.max(days * 2, 90) * 86400000).toISOString(); const to = new Date().toISOString();
    const appFilter = app ? `properties.app_id = '${app}'` : registered.length ? `properties.app_id IN (${registered.map(id => `'${id}'`).join(',')})` : '1 = 0';
    const query = `SELECT uuid, event, distinct_id, timestamp, properties, person_id FROM events WHERE timestamp >= toDateTime('${from.slice(0, 19).replace('T', ' ')}') AND properties.environment = 'production' AND ${appFilter} ORDER BY timestamp DESC LIMIT 50000`;
    const result = await fetch(`https://${settings.region}.posthog.com/api/projects/${settings.projectId}/query/`, { method: 'POST', headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ query: { kind: 'HogQLQuery', query }, name: 'Orbit workspace analytics' }), signal: AbortSignal.timeout(25000) });
    if (!result.ok) { if ([401, 403].includes(result.status)) throw new HttpError(502, 'PostHog access was denied. Check your project ID, region, and read-key permissions.'); if (result.status === 429) throw new HttpError(429, 'PostHog is rate limiting requests. Wait a moment and refresh.'); throw new HttpError(502, 'PostHog could not run this query. Try again shortly.'); }
    let body: { results?: unknown[][]; query_status?: { complete?: boolean } };
    try { body = await readPostHogJson(result); } catch (error) { throw new HttpError(502, error instanceof Error ? error.message : 'PostHog response could not be read.'); }
    if (!Array.isArray(body.results)) throw new HttpError(502, 'PostHog did not return a completed result. Please refresh.');
    const events: OrbitEvent[] = body.results.flatMap(row => {
      try {
        const raw: Record<string, unknown> = typeof row[4] === 'string' ? JSON.parse(row[4]) : row[4] as Record<string, unknown>;
        if (!raw || typeof raw.app_id !== 'string') return [];
        const keys = new Set([...allowed, ...Object.keys(raw).filter(k => /^[a-z][a-z0-9_]{0,47}$/i.test(k) && k !== 'app_id')]);
        const properties = cleanProperties(raw, keys);
        // Do not expose anonymous analytics identifiers as wallet addresses.
        return [{ id: String(row[0]), event: String(row[1]), distinctId: String(row[2]), personId: row[5] ? String(row[5]) : undefined, timestamp: new Date(String(row[3]).replace(' ', 'T') + (/Z$|[+-]\d\d:\d\d$/.test(String(row[3])) ? '' : 'Z')).toISOString(), appId: raw.app_id, properties }];
      } catch { return []; }
    });
    const payload: DataResponse = { events, truncated: body.results.length >= 50000, cached: false, fetchedAt: new Date().toISOString(), from, to };
    const serialized = JSON.stringify(payload);
    // Keep cached payloads small; large datasets still return normally.
    if (new TextEncoder().encode(serialized).byteLength < 1000000) await getDb().insert(queryCache).values({ key, payload: serialized, expiresAt: Date.now() + 120000 }).onConflictDoUpdate({ target: queryCache.key, set: { payload: serialized, expiresAt: Date.now() + 120000 } });
    return Response.json(payload, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return responseError(error); }
}
