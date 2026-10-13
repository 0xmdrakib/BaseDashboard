# Implementation map

| Files | Purpose |
| --- | --- |
| `app/page.tsx`, `app/layout.tsx`, `app/globals.css`, `public/favicon.svg` | Entry, metadata, responsive design and brand. |
| `components/orbit/dashboard.tsx` | Navigation, demo/live separation, filters, refresh, search, stale-request protection and responsive shell. |
| `components/orbit/overview.tsx` | Metrics, data-derived charts/sparklines, portfolio and activity stream. |
| `components/orbit/activity.tsx` | Events, details, transactions and source attribution. |
| `components/orbit/audiences.tsx` | Ordered funnels, saved journeys and mature-cohort retention. |
| `components/orbit/apps.tsx` | App registration, editing, archive and restore. |
| `components/orbit/integration.tsx` | App-specific SDK examples, downloads, event catalog and sandbox. |
| `components/orbit/settings.tsx` | Persisted workspace settings and connection diagnostics. |
| `components/orbit/ui.tsx` | Accessible dialogs, controls, exports and API client. |
| `lib/types.ts`, `lib/demo.ts`, `lib/analytics.ts`, `lib/server.ts` | Contracts, isolated samples, analytics calculations and authenticated server helpers. |
| `app/api/*/route.ts` | Owner-scoped configuration, apps, settings, funnels and private PostHog reads. |
| `db/schema.ts`, `drizzle/*.sql`, `drizzle/meta/*` | Owner-scoped schema and append-only migrations. |
| `packages/sdk/*` | Typed SDK, React/wagmi adapter, privacy filter and package documentation. |
| `scripts/build-sdk.mjs`, `public/sdk/*` | Reproducible browser bundle, ESM/types and downloadable package. |
| `tests/*` | SDK lifecycle/privacy, analytics and local API integration verification. |
| `.env.example`, `.gitignore`, `package.json`, `package-lock.json`, `vite.config.ts`, `.openai/hosting.json` | Configuration, dependency lock, runtime and private hosting. |
| `README.md`, `docs/*` | Setup, verification and Bengali quick start. |

Remaining files come from the maintained Sites/Vinext starter. Its platform-owned
authentication, Worker adapter and connector infrastructure are retained.

## Data boundaries

App settings and saved funnels live in owner-scoped D1 tables. PostHog is the event
source of truth. `POSTHOG_PERSONAL_API_KEY` stays on the server. Anonymous-to-wallet
stitching uses HogQL's resolved `person_id`. No personal profile properties are queried.
The private Site enforces owner access; mutations additionally check identity and
same-origin requests. Mini apps send directly to PostHog, not to the private dashboard.

## Operational limits

- Queries read up to 50,000 newest production events. A visible warning marks capped
  results; reduce the period or filter an app for more complete coverage.
- Provider response bodies are limited to 8 MB before parsing to protect Worker
  memory. Oversized responses ask for a shorter period or a single application.
- Loaded history is 90 days for 7/30-day views and 180 days for 90-day views. Retention
  is first-observed in that window, not lifetime acquisition.
- Live refresh is every 120 seconds. Payloads below 1 MB cache for 120 seconds; larger
  results bypass D1 cache. SDK blocking, PostHog quotas and ingestion delays apply.
- Client-side confirmation timeouts may be followed by eventual onchain success.
- Real PostHog credentials and mini-app sources are intentionally not preconfigured.

## Research references

- [PostHog SDK](https://posthog.com/docs/libraries/js)
- [PostHog API and regional hosts](https://posthog.com/docs/api)
- [PostHog identity](https://posthog.com/docs/data/persons)
- [PostHog projects](https://posthog.com/docs/settings/projects)
- [Workers best practices](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/)
