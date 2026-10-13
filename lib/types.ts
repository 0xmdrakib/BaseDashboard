export type AppCategory = 'DeFi' | 'Collectibles' | 'Social' | 'Commerce' | 'Utility' | 'Other';
export type OrbitApp = { id: string; name: string; domain: string; category: AppCategory; color: string; chainId: number; description: string; builderCode: string; archived: boolean; createdAt: string };
export type OrbitEvent = { id: string; event: string; appId: string; distinctId: string; personId?: string; timestamp: string; properties: Record<string, string | number | boolean | null> };
export type WorkspaceSettings = { name: string; projectId: string; publicKey: string; region: 'us' | 'eu'; defaultDays: number; };
export const defaultSettings: WorkspaceSettings = { name: 'My workspace', projectId: '', publicKey: '', region: 'us', defaultDays: 30 };
export type Connection = { configured: boolean; hasReadKey: boolean; hasPublicKey: boolean; region: 'us' | 'eu'; projectId: string; };
export type ConfigResponse = { apps: OrbitApp[]; settings: WorkspaceSettings; connection: Connection; authenticated: boolean };
export type DataResponse = { events: OrbitEvent[]; fetchedAt: string; truncated: boolean; cached: boolean; from: string; to: string; };
export type SavedFunnel = { id: string; name: string; steps: string[]; windowHours: number; appId: string; createdAt: string };
export const walletPattern = /^0x[a-fA-F0-9]{40}$/;
export const actionNames = ['swap', 'mint', 'deposit', 'withdraw', 'stake', 'unstake', 'transfer', 'approve', 'purchase', 'claim', 'vote', 'bridge', 'contract_interaction', 'submit'];
export const eventCatalog = [
  { event: 'app_opened', category: 'Lifecycle', description: 'An app session starts, including campaign attribution.' },
  { event: '$pageview', category: 'Navigation', description: 'A page loads or a client-side route changes.' },
  { event: '$autocapture', category: 'Interaction', description: 'A click or interaction, with text and attributes masked.' },
  { event: 'wallet_connected', category: 'Wallet', description: 'A wallet connects or an account switches.' },
  { event: 'wallet_disconnected', category: 'Wallet', description: 'A connected wallet disconnects.' },
  { event: 'tx_submitted', category: 'Transaction', description: 'A wallet returns a transaction hash.' },
  { event: 'tx_confirmed', category: 'Transaction', description: 'A receipt confirms that execution succeeded.' },
  { event: 'tx_failed', category: 'Transaction', description: 'A request is rejected, errors, or reverts.' },
  { event: 'form_submitted', category: 'Submission', description: 'A form submits; field values are never collected.' },
  { event: 'interaction', category: 'Interaction', description: 'A named UI or contract interaction.' },
];
