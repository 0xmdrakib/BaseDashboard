# Orbit · Mini app analytics

A private, multi-app analytics workspace with a reusable PostHog SDK. Built with
React 19, TypeScript, Vinext, Cloudflare D1, Recharts and Sites.

[বাংলা quick start](docs/QUICKSTART.bn.md) · [Implementation map](docs/IMPLEMENTATION.md)

## Local development

Requires Node.js 22.13+. From this directory:

```sh
npm ci
npm run build
# Apply each local migration once, in order:
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_lame_fabian_cortez.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_solid_sheva_callister.sql
npm run dev
```

Open the printed URL. Local mock sign-in is `/signin-with-chatgpt?return_to=/`.
Hosted authentication is platform-owned; the Site is private.

## Connect PostHog

1. Create or select your PostHog project.
2. Save project ID, region and **public** project token in Orbit Settings.
3. Configure `POSTHOG_PERSONAL_API_KEY` as a **secret runtime environment variable**
   on this private Site, scoped to `query:read` for the intended PostHog project.
   Locally put it in ignored `.dev.vars` and restart the server.
4. Register an app and follow its Integration guide. Download the SDK archive and
   install it with `npm install ./orbit-analytics-sdk-1.0.0.tgz`, or serve the standalone
   `orbit.js` bundle from your own app. The package is not published to npm.
5. Use public app-side environment variables as shown in `.env.example`.
   Never put the private read key in a mini app or client bundle.
6. Use `environment: 'development'` or `'staging'` for non-production apps. Orbit reads
   only `'production'` events so local tests do not inflate live metrics.

## Verify events in PostHog

Open **Activity → Live events** in the matching project. Filter by `app_id` and check:

- App load: `app_opened`, sanitized referrer/UTM metadata and `$pageview`.
- Client route change: another `$pageview`.
- Wallet connect: `wallet_connected` and lowercase wallet identity. Disconnect and
  account switch reset identity without merging two wallets.
- Accepted request: `tx_submitted`. Successful receipt: `tx_confirmed`.
  Rejection/error/revert: one `tx_failed` with a safe message.
- Form submit: logical `form_id` and outcome only, without field values.
- Every event: correct `app_id`, `environment` and `sdk_version`.
- No email, display name, form body, payment details, URL query/path, DOM text,
  raw error or person-property payload. Configure PostHog's Discard IP data setting
  if you do not want PostHog to retain IP data.

Then select Your workspace in Orbit, set matching filters and refresh. Demo data is
isolated and never sent to PostHog. Test transactions should use testnet first.

## Quality checks

```sh
npm run typecheck
npm test
# With the local development server running:
npm run test:api
npm run build
```

SDK tests use a local PostHog double. API tests reject non-loopback targets, use
development mock auth and local records, archive test applications, and restore
workspace settings. Never target production with mutation tests.

## Publishing and limits

Use the Sites source helper to push and package, then its private deployment tool.
Sites applies production migrations. Preserve `.openai/hosting.json` identity and
owner-only audience. Configure secrets through the native runtime settings.

Queries return up to 50,000 events with an explicit warning when capped; retention is
first-observed in loaded history. See the implementation map for details. Actual
PostHog connectivity requires your project/read key and instrumentation of your apps.

Continue appending Base Builder Codes with your existing transaction library.
Orbit measures activity; it never sends or signs a transaction.
