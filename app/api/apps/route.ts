import { z } from 'zod';
import { getDb } from '@/db';
import { apps } from '@/db/schema';
import { appWhere, HttpError, readBody, requireOwner, responseError, sameOrigin } from '@/lib/server';
const schema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]{1,47}$/), name: z.string().trim().min(2).max(60),
  domain: z.string().trim().min(3).max(253).refine(d => { try { const u = new URL(d.includes('://') ? d : 'https://' + d); return ['http:', 'https:'].includes(u.protocol) && !u.username && !u.password && u.pathname === '/' && !u.search && !u.hash; } catch { return false; } }, 'Enter a domain only, such as my-app.com.'),
  category: z.enum(['DeFi', 'Collectibles', 'Social', 'Commerce', 'Utility', 'Other']), color: z.string().regex(/^#[a-fA-F0-9]{6}$/),
  chainId: z.number().int().positive().max(2147483647), description: z.string().trim().max(240).default(''), builderCode: z.string().trim().max(100).default(''), archived: z.boolean().default(false),
});
export async function POST(request: Request) {
  try { sameOrigin(request); const owner = await requireOwner(); const parsed = schema.safeParse(await readBody(request)); if (!parsed.success) throw new HttpError(400, parsed.error.issues[0].message); const app = parsed.data;
    const existing = await getDb().select().from(apps).where(appWhere(owner, app.id)).get(); if (existing) throw new HttpError(409, 'This app ID already exists. Choose a unique ID.');
    await getDb().insert(apps).values({ ...app, domain: new URL(app.domain.includes('://') ? app.domain : 'https://' + app.domain).host, owner, createdAt: new Date().toISOString() });
    return Response.json({ ok: true }, { status: 201 });
  } catch (error) { return responseError(error); }
}
export async function PATCH(request: Request) {
  try { sameOrigin(request); const owner = await requireOwner(); const parsed = schema.safeParse(await readBody(request)); if (!parsed.success) throw new HttpError(400, parsed.error.issues[0].message); const app = parsed.data;
    const existing = await getDb().select().from(apps).where(appWhere(owner, app.id)).get(); if (!existing) throw new HttpError(404, 'App not found.');
    await getDb().update(apps).set({ ...app, domain: new URL(app.domain.includes('://') ? app.domain : 'https://' + app.domain).host }).where(appWhere(owner, app.id)); return Response.json({ ok: true });
  } catch (error) { return responseError(error); }
}
