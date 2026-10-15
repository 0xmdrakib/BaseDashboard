# Orbit Analytics SDK

Typed PostHog analytics for applications built by Base builders. Install the downloaded archive:

```sh
npm install ./orbit-analytics-sdk-1.0.0.tgz
```

The package is delivered locally, not published to npm. For plain JavaScript, copy
the standalone `orbit.js` bundle to your own app's public directory.

```ts
import { createOrbit } from '@orbit-analytics/sdk';
export const analytics = createOrbit({
  appId: 'my-app',
  projectKey: process.env.NEXT_PUBLIC_POSTHOG_KEY,
  apiHost: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  chainId: 8453,
  environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
});
```

Initialize once at browser startup. SSR and missing keys are safe no-ops. In Vite,
use `import.meta.env.VITE_POSTHOG_KEY` and `import.meta.env.VITE_POSTHOG_HOST`.

## Wallet lifecycle

```tsx
import { useAccount } from 'wagmi';
import { useOrbitWallet } from '@orbit-analytics/sdk/react';
export function WalletAnalytics() {
  useOrbitWallet(analytics, useAccount());
  return null;
}
```

Mount inside WagmiProvider. Addresses are lowercased; account changes and disconnects
reset identity; reconnecting states do not reset. Other frameworks can call
`identifyWallet(address, connectorName, chainId)` and `disconnectWallet()` directly.

## Transactions

```ts
await analytics.trackTransaction({
  action: 'swap', // mint, deposit, stake, approve, claim, vote, bridge, ...
  chainId: 8453,
  submit: () => writeContractAsync(existingRequest),
  waitForReceipt: hash => publicClient.waitForTransactionReceipt({ hash }),
});
```

A hash triggers `tx_submitted`; a successful receipt triggers `tx_confirmed`;
rejection/error/revert triggers `tx_failed`. Original errors are rethrown. A timeout
is a failure to confirm, not proof the transaction cannot settle later onchain.

Existing receipt handlers can use `transactionSubmitted(action, hash)`,
`transactionConfirmed(action, receipt, originalHash)`, and
`transactionFailed(action, error, optionalHash)`. Pass a chain ID as the final optional
argument. Supply the original hash when a transaction is replaced.

## Submissions and custom events

```ts
analytics.formSubmitted('contact_form', 'success');
analytics.interaction('view_asset', 'asset_card');
analytics.interaction('approve', 'staking_contract', 'contract');
analytics.track('proposal_created', { action: 'submit' });
```

Add custom non-personal metadata keys to `allowedProperties` at initialization.
Use developer-defined labels, never user-entered values. Sensitive key names,
email-like values, long digit sequences, nested objects and unapproved fields are
dropped. Errors are mapped to fixed safe messages. DOM text, attributes, URL paths,
queries, person-property payloads and session recordings are excluded. Public
ingestion tokens and SDK-generated session fields are preserved. Wallet address is
the only explicit user identity. Anonymous events use SDK-generated anonymous IDs.

Set `requireConsent: true` to wait for `analytics.optIn()`; `analytics.optOut()` stops
tracking. If IP retention is unwanted, configure PostHog's Discard IP data setting.

Continue appending Builder Codes with your app's transaction library. Orbit does
not modify, send, sign or request a transaction, and never needs a private wallet key.

## License

[MIT License](LICENSE) · Copyright (c) 2026 Md. Rakib.
