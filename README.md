# BaseDashboard

BaseDashboard, displayed in the app as **Orbit Analytics**, is a private analytics workspace for understanding wallets, transactions, and product activity across all your mini apps.

Live app: [Orbit Analytics](https://orbit-miniapp-intelligence.grand-jay-6428.chatgpt.site) · Owner sign-in is required.

---

## Overview

BaseDashboard is built for two core flows:

- **One workspace for every app:** register your applications and explore their real production activity together or individually.
- **One reusable integration:** use the included PostHog SDK to track wallet connections, swaps, mints, submissions, and other interactions in each app.

The dashboard keeps configuration and saved funnels in Cloudflare D1. Your apps send events directly to PostHog; the authenticated dashboard reads them using a server-only API key. Empty workspaces start with zero counts and no demo data.

## Features

- Guided application registration with URL normalization, unique tracking IDs, custom networks, and application colors
- Ecosystem overview with active wallets, confirmed transactions, success rates, and activity charts
- Searchable event explorer with event details and CSV exports
- Transaction ledger with pending, confirmed, and failed states
- Ordered funnel builder with saved journeys and conversion windows
- Wallet retention cohorts and campaign/source attribution
- Application editing, archiving, and restoration
- Shared app and date filters with UTC calendar ranges
- PostHog connection settings, event verification, and optional two-minute refresh
- Typed SDK, React/wagmi adapter, and a standalone browser bundle
- Responsive desktop and mobile interface with private workspace access

## Supported networks

- Base and Base Sepolia
- Ethereum
- Optimism
- Arbitrum
- Polygon
- Other EVM networks through a custom numeric chain ID

Analytics follows the events your application sends. BaseDashboard does not index a blockchain, execute transactions, sign wallet requests, or add Base Builder Codes to transactions.

## Analytics behavior

### Wallets and transactions

Wallet addresses are normalized to lowercase. Account changes and disconnects reset analytics identity. Reconnecting states do not reset it.

A submitted hash produces `tx_submitted`. A receipt with status `success` produces `tx_confirmed`. Rejected requests, errors, and reverted receipts produce `tx_failed` with a sanitized error message. Pending submissions are excluded from the resolved success rate.

### Product interactions

The SDK supports `app_opened`, history-based page views, masked autocapture, `wallet_connected`, `wallet_disconnected`, `form_submitted`, and named `interaction` events. Use actions such as `swap`, `mint`, `deposit`, `claim`, `vote`, or `contract_interaction` to describe what your app actually does.

### Funnels, retention, and attribution

Funnels require ordered events from the same visitor in the same app. Retention uses wallets first observed in the loaded history. Acquisition uses the first observed source within the selected period. Queries include only registered app IDs and production events, with a visible warning when the 50,000-event limit is reached.

## Privacy

Wallet address is the only explicit end-user analytics identifier. The SDK filters sensitive properties, masks DOM text and attributes, excludes form field values and URL query strings, and disables session recording. Emails, names, government IDs, payment details, and raw error messages must never be passed to analytics.

Your PostHog personal API key stays on the dashboard server. Public project tokens belong in each mini app's public environment variables. Configure PostHog's IP-discard setting separately if you do not want it to retain IP data.

## Tech stack

- React 19 and TypeScript
- Vinext, Vite, and Next.js-compatible application APIs
- Tailwind CSS and custom CSS
- Cloudflare Workers and D1
- Drizzle ORM
- PostHog JavaScript SDK
- Recharts and Lucide icons
- Node.js test runner and GitHub Actions

## Getting started

Requires Node.js 22.13 or newer and npm. CI uses Node.js 24.

```sh
git clone https://github.com/0xmdrakib/BaseDashboard.git
cd BaseDashboard
npm ci
npm run build
```

Apply the local database migrations once, then start the app. Follow the commands in [Setup and verification](docs/SETUP.md).

```sh
npm run dev
```

Register an application, configure your PostHog connection, and follow the personalized integration guide. The SDK downloads are generated during the build; they are not published to npm.

- [Setup and verification](docs/SETUP.md)
- [বাংলা quick start](docs/QUICKSTART.bn.md)
- [Deployment guide](docs/DEPLOYMENT.md)
- [SDK documentation](packages/sdk/README.md)
- [Implementation map](docs/IMPLEMENTATION.md)

## Quality checks

```sh
npm run typecheck
npm test
npm run build
# With the local development server running:
npm run test:api
```

GitHub Actions runs these checks against a fresh local database. API mutation tests reject non-loopback targets and never run against your production workspace.

## Deployment

GitHub hosts the source and CI workflow. The application requires a Cloudflare Workers-compatible server, a D1 database, and trusted authentication; GitHub Pages cannot run this backend.

The existing live workspace is hosted privately on Sites. Its source retains the hosting adapter and project identity needed for updates. See the [deployment guide](docs/DEPLOYMENT.md) before deploying your own instance.

---

## License

This project is licensed under the [MIT License](LICENSE). The retained Sites Vite adapter includes its [upstream MIT notice](build/sites-vite-plugin.LICENSE).

**© 2026 Md. Rakib • made with love and passion.**
