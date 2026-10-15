# BaseDashboard

BaseDashboard is an analytics dashboard for builders on Base. Understand wallet activity, transactions, and user journeys across the applications you build, all in one workspace.

Live app: [https://builders.rakibhq.xyz](https://builders.rakibhq.xyz)

---

## Overview

BaseDashboard is built for two core flows:

- **Multi-app analytics:** explore activity across your ecosystem or focus on an individual application.
- **Reusable event tracking:** measure wallet connections, swaps, mints, submissions, and other interactions through a shared PostHog SDK.

The dashboard brings together product and onchain interaction analytics, with clear views for events, transactions, conversion, retention, and acquisition.

## Features

- Guided application registration and management
- Ecosystem overview with active wallets, transactions, and success rates
- Searchable event explorer and CSV exports
- Transaction ledger with pending, confirmed, and failed states
- Funnel builder with saved conversion journeys
- Wallet retention cohorts and campaign attribution
- Shared application and date filters
- Reusable TypeScript SDK with React/wagmi support
- Responsive desktop and mobile interface

## Supported networks

- Base and Base Sepolia
- Ethereum
- Optimism
- Arbitrum
- Polygon
- Other EVM networks through a custom numeric chain ID

## Analytics behavior

### Wallets and transactions

Wallet addresses are normalized to lowercase. Account changes and disconnects reset analytics identity.

Transactions move through submitted, confirmed, and failed states. Confirmation requires a successful receipt; rejected requests, errors, and reverted receipts are recorded as failures.

### Product interactions

App opens, page views, wallet connections, form submissions, and custom interactions share one event model. Actions can describe swaps, mints, deposits, claims, votes, and other contract interactions.

### Funnels, retention, and attribution

Funnels measure ordered steps within an application. Retention shows returning wallet cohorts, while acquisition highlights referrers and campaign sources.

## Privacy

Wallet address is the only explicit end-user analytics identifier. Sensitive properties are filtered, autocapture is masked, and session recording is disabled. Form field values, emails, names, government IDs, payment details, and raw error messages are excluded from event tracking.

## Tech stack

- React 19 and TypeScript
- Next.js
- Tailwind CSS and custom CSS
- PostgreSQL and Drizzle ORM
- Vercel
- PostHog JavaScript SDK
- Recharts and Lucide icons

---

## License

This project is licensed under the [MIT License](LICENSE).
