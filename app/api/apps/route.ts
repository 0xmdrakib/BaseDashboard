import { appSchema as schema } from '@/lib/app-schema';
import { getDb } from '@/db';
import { apps } from '@/db/schema';
import { appWhere, HttpError, readBody, requireOwner, responseError, sameOrigin } from '@/lib/server';
export async function POST(request: Request) {
  try { sameOrigin(request); const owner = await requireOwner(); const parsed = schema.safeParse(await readBody(request)); if (!parsed.success) throw new HttpError(400, parsed.error.issues[0].message); const app = parsed.data;
    const [existing] = await getDb().select().from(apps).where(appWhere(owner, app.id)).limit(1); if (existing) throw new HttpError(409, 'This app ID already exists. Choose a unique ID.');
    await getDb().insert(apps).values({ ...app, owner, createdAt: new Date().toISOString() });
    return Response.json({ ok: true, appId: app.id }, { status: 201 });
  } catch (error) { return responseError(error); }
}
export async function PATCH(request: Request) {
  try { sameOrigin(request); const owner = await requireOwner(); const parsed = schema.safeParse(await readBody(request)); if (!parsed.success) throw new HttpError(400, parsed.error.issues[0].message); const app = parsed.data;
    const [existing] = await getDb().select().from(apps).where(appWhere(owner, app.id)).limit(1); if (!existing) throw new HttpError(404, 'App not found.');
    await getDb().update(apps).set(app).where(appWhere(owner, app.id)); return Response.json({ ok: true });
  } catch (error) { return responseError(error); }
}
