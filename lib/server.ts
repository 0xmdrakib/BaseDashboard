import { env } from 'cloudflare:workers';
import { eq, and } from 'drizzle-orm';
import { getDb } from '@/db';
import { apps, workspaceSettings } from '@/db/schema';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { defaultSettings, type WorkspaceSettings, type OrbitApp } from './types';

export function runtimeValue(name: string) { const value: unknown = Reflect.get(env, name); return typeof value === 'string' ? value : ''; }
export async function requireOwner() { const user = await getChatGPTUser(); if (!user) throw new HttpError(401, 'Sign in to manage your workspace.'); return user.userId; }
export class HttpError extends Error { constructor(public status: number, message: string) { super(message); } }
export function responseError(error: unknown) { if (error instanceof HttpError) return Response.json({ error: error.message }, { status: error.status }); console.error(JSON.stringify({ event: 'orbit_api_error', type: error instanceof Error ? error.name : 'unknown' })); return Response.json({ error: 'The request could not be completed. Please try again.' }, { status: 500 }); }
export function sameOrigin(request: Request) { const origin = request.headers.get('origin'); if (!origin || origin !== new URL(request.url).origin) throw new HttpError(403, 'This action must be made from your workspace.'); }
export async function readBody(request: Request): Promise<unknown> {
  const reader = request.body?.getReader(); if (!reader) throw new HttpError(400, 'A JSON body is required.');
  let size = 0; const chunks: Uint8Array[] = [];
  while (true) { const { done, value } = await reader.read(); if (done) break; size += value.length; if (size > 16384) { await reader.cancel(); throw new HttpError(413, 'Request is too large.'); } chunks.push(value); }
  const bytes = new Uint8Array(size); let offset = 0; for (const c of chunks) { bytes.set(c, offset); offset += c.length; }
  try { return JSON.parse(new TextDecoder().decode(bytes)); } catch { throw new HttpError(400, 'Invalid JSON.'); }
}
export async function getSettings(owner: string): Promise<WorkspaceSettings> {
  const row = await getDb().select().from(workspaceSettings).where(eq(workspaceSettings.owner, owner)).get();
  return { name: row?.name ?? defaultSettings.name, projectId: row?.projectId || runtimeValue('POSTHOG_PROJECT_ID'), publicKey: row?.publicKey || runtimeValue('POSTHOG_PUBLIC_KEY'), region: (row?.region || runtimeValue('POSTHOG_REGION')) === 'eu' ? 'eu' : 'us', defaultDays: row?.defaultDays ?? 30 };
}
export async function getApps(owner: string): Promise<OrbitApp[]> {
  const rows = await getDb().select().from(apps).where(eq(apps.owner, owner));
  return rows.map(({ owner: _owner, ...row }) => ({ ...row, category: row.category as OrbitApp['category'] }));
}
export const appWhere = (owner: string, id: string) => and(eq(apps.owner, owner), eq(apps.id, id));
