import { z } from 'zod';
import { getDb } from '@/db';
import { workspaceSettings, queryCache } from '@/db/schema';
import { HttpError, readBody, requireOwner, responseError, sameOrigin } from '@/lib/server';
import { sql } from 'drizzle-orm';
const schema = z.object({ name: z.string().trim().min(2).max(60), projectId: z.string().regex(/^\d*$/, 'Project ID must be numeric.').max(20), publicKey: z.string().max(200).refine(v => !v || /^phc_[a-zA-Z0-9_-]+$/.test(v), 'Use a public project token starting with phc_. Never enter a personal API key here.'), region: z.enum(['us', 'eu']), defaultDays: z.union([z.literal(7), z.literal(30), z.literal(90)]) });
export async function PUT(request: Request) {
  try { sameOrigin(request); const owner = await requireOwner(); const parsed = schema.safeParse(await readBody(request)); if (!parsed.success) throw new HttpError(400, parsed.error.issues[0].message);
    await getDb().insert(workspaceSettings).values({ owner, ...parsed.data }).onConflictDoUpdate({ target: workspaceSettings.owner, set: parsed.data });
    await getDb().delete(queryCache).where(sql`${queryCache.expiresAt} < ${Date.now()}`);
    return Response.json({ ok: true });
  } catch (error) { return responseError(error); }
}
