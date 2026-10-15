# Setup and verification

## Install and build

Use Node.js 22.13+ and npm. CI uses Node.js 24.

```sh
npm ci
npm run build
```

The build generates the SDK browser bundle and archive in `public/sdk/` and the Worker/client output in `dist/`. Generated output, local database files, and real environment values are ignored by Git.

## Prepare the local database

For a fresh checkout, apply each migration once, in order:

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_lame_fabian_cortez.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_solid_sheva_callister.sql
npm run dev
```

Open the printed local URL. Development sign-in is `/signin-with-chatgpt?return_to=/`. The local sign-in adapter only operates on loopback hosts; production authentication is provided by the hosting platform. Keep applied migration history intact when updating an existing database.

## Connect PostHog

1. Create or choose your PostHog project.
2. Save its project ID, region, and public project token in Orbit Settings.
3. Configure `POSTHOG_PERSONAL_API_KEY` as a secret dashboard runtime variable with `query:read` access to that project. Locally use an ignored `.dev.vars` file and restart the server.
4. Use **Connect app** to register an application. Expand **Customize application** for its network, category, color, or custom tracking ID.
5. Open the application's integration guide. Install the generated archive with `npm install ./orbit-analytics-sdk-1.0.0.tgz`, or serve `orbit.js` from your own app.
6. Initialize at client startup with the public environment variables shown in `.env.example`. Never expose the personal read key in a mini app.
7. Use `development` or `staging` for test environments. Orbit reads only `production` events.

## Verify in PostHog

Open **Activity → Live events** in the matching PostHog project. Filter by `app_id` and verify:

- App load: `app_opened` with sanitized referrer/UTM attribution and `$pageview`.
- Client-side navigation: another `$pageview`.
- Wallet connection: `wallet_connected` with lowercase wallet identity. Disconnect and account switching reset it.
- Accepted transaction: `tx_submitted`; successful receipt: `tx_confirmed`; rejection, error, or revert: `tx_failed`.
- Form submission: logical form ID and outcome, without field values.
- Every event: the correct `app_id`, `environment`, and SDK version.
- No email, name, message body, government ID, payment details, URL query string, DOM text, or raw exception payload.

Use testnet transactions first. Then check your application's **Check for events** action and refresh the dashboard. Manual refresh bypasses the short-lived server cache.

## Run checks

```sh
npm run typecheck
npm test
npm run build
# While npm run dev is serving the local app:
npm run test:api
```

API tests use local development authentication and disposable records, restore workspace settings, and archive their test application. They reject remote test targets. SDK tests use a local PostHog double; no real key is needed.
