import { getCurrentUser } from '@/lib/auth';
import { getApps, getSettings, runtimeValue, responseError } from '@/lib/server';
import { defaultSettings } from '@/lib/types';
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return Response.json({ apps: [], settings: defaultSettings, connection: { configured: false, hasReadKey: false, hasPublicKey: false, region: 'us', projectId: '' }, authenticated: false }, { headers: { 'Cache-Control': 'no-store' } });
    const [apps, settings] = await Promise.all([getApps(user.userId), getSettings(user.userId)]);
    const hasReadKey = Boolean(runtimeValue('POSTHOG_PERSONAL_API_KEY'));
    return Response.json({ apps, settings, connection: { configured: hasReadKey && Boolean(settings.projectId), hasReadKey, hasPublicKey: Boolean(settings.publicKey), region: settings.region, projectId: settings.projectId }, authenticated: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return responseError(error); }
}
