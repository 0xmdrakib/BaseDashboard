import handler from 'vinext/server/fetch-handler';

// PostHog is queried directly by the authenticated API routes. No connector
// service or additional preview Worker is needed for this application.
export default {
  fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext) {
    return handler.fetch(request, env, ctx);
  },
} satisfies ExportedHandler<Cloudflare.Env>;
