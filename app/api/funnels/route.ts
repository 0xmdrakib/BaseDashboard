import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { savedFunnels } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { HttpError, readBody, requireOwner, responseError, sameOrigin } from '@/lib/server';
const schema = z.object({ name: z.string().trim().min(2).max(60), steps: z.array(z.string().regex(/^[a-zA-Z_$][a-zA-Z0-9_$-]{1,79}$/)).min(2).max(6), windowHours: z.union([z.literal(1), z.literal(24), z.literal(168)]), appId: z.string().regex(/^$|^[a-z][a-z0-9-]{1,47}$/) });
export async function GET() { try { const user = await getCurrentUser(); if (!user) return Response.json([], { headers: { 'Cache-Control': 'no-store' } }); const rows = await getDb().select().from(savedFunnels).where(eq(savedFunnels.owner, user.userId)); return Response.json(rows.map(({ owner: _owner, steps, ...r }) => ({ ...r, steps: JSON.parse(steps) })), { headers: { 'Cache-Control': 'no-store' } }); } catch (error) { return responseError(error); } }
export async function POST(request: Request) { try { sameOrigin(request); const owner = await requireOwner(); const parsed = schema.safeParse(await readBody(request)); if (!parsed.success) throw new HttpError(400, parsed.error.issues[0].message); const row = { ...parsed.data, owner, id: crypto.randomUUID(), steps: JSON.stringify(parsed.data.steps), createdAt: new Date().toISOString() }; await getDb().insert(savedFunnels).values(row); return Response.json({ id: row.id }, { status: 201 }); } catch (error) { return responseError(error); } }
