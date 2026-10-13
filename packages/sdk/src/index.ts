import { PostHog } from 'posthog-js';
import { cleanProperties, forbiddenKey, safeError } from './privacy';
export type OrbitOptions = { appId: string; projectKey?: string; apiHost?: string; environment?: 'production' | 'development' | 'staging'; chainId?: number; allowedProperties?: string[]; requireConsent?: boolean };
export type Receipt = { status: 'success' | 'reverted'; transactionHash?: `0x${string}` };
export type OrbitTracker = ReturnType<typeof makeTracker>;
const instances = new Map<string, OrbitTracker>();
const metadata = ['action', 'tx_hash', 'chain_id', 'connector', 'utm_source', 'utm_medium', 'utm_campaign', 'referrer', 'form_id', 'outcome', 'target', 'route', 'error_message', 'interaction_type', 'original_tx_hash'];
const walletRegex = /^0x[a-fA-F0-9]{40}$/;
const hashRegex = /^0x[a-fA-F0-9]{64}$/;
/** Initialize once at browser startup. SSR and missing project keys are safe no-ops. */
export function createOrbit(options: OrbitOptions): OrbitTracker {
  if (typeof window === 'undefined' || !options.projectKey) return makeTracker(null, options);
  const existing = instances.get(options.appId); if (existing) return existing;
  if (!/^[a-z][a-z0-9-]{1,47}$/.test(options.appId)) throw new Error('Orbit appId must be a lowercase slug.');
  const host = options.apiHost || 'https://us.i.posthog.com'; const parsedHost = new URL(host);
  if (parsedHost.protocol !== 'https:' && parsedHost.hostname !== 'localhost') throw new Error('Orbit requires an HTTPS analytics host.');
  const client = new PostHog();
  const allowed = new Set([...metadata, ...(options.allowedProperties ?? []).filter(k => !forbiddenKey.test(k))]);
  client.init(options.projectKey, {
    api_host: host, autocapture: true, capture_pageview: 'history_change',
    mask_all_text: true, mask_all_element_attributes: true, disable_session_recording: true,
    capture_dead_clicks: false, capture_performance: false, capture_exceptions: false,
    advanced_disable_feature_flags: true, disable_surveys: true,
    person_profiles: 'identified_only', respect_dnt: true,
    cross_subdomain_cookie: false, persistence_name: `orbit_${options.appId}`,
    opt_out_capturing_by_default: options.requireConsent ?? false,
    before_send: (event) => {
      if (!event) return null;
      const p = event.properties ?? {};
      const safe = cleanProperties(p, allowed);
      for (const key of ['distinct_id', '$device_id', '$session_id', '$window_id', '$anon_distinct_id', '$process_person_profile', '$is_identified', '$browser', '$browser_version', '$os', '$device_type', '$lib', '$lib_version']) {
        if (typeof p[key] === 'string' || typeof p[key] === 'number' || typeof p[key] === 'boolean') safe[key] = p[key];
      }
      // No URL paths, query strings, DOM text, field values, or person properties.
      safe.token = options.projectKey!;
      safe.$current_url = window.location.origin;
      safe.app_id = options.appId; safe.environment = options.environment ?? 'production'; safe.sdk_version = '1.0.0';
      if (safe.chain_id === undefined && options.chainId) safe.chain_id = options.chainId;
      delete event.$set; delete event.$set_once;
      event.properties = safe; return event;
    },
  });
  const tracker = makeTracker(client, options); instances.set(options.appId, tracker);
  tracker.appOpened(); return tracker;
}
function makeTracker(client: PostHog | null, options: OrbitOptions) {
  let wallet: string | null = null; let opened = false;
  const allowed = new Set([...metadata, ...(options.allowedProperties ?? []).filter(k => !forbiddenKey.test(k))]);
  const capture = (event: string, properties: Record<string, unknown> = {}) => {
    if (!client || !/^[a-zA-Z_$][a-zA-Z0-9_$-]{1,79}$/.test(event)) return;
    try { client.capture(event, { ...cleanProperties(properties, allowed), app_id: options.appId, environment: options.environment ?? 'production' }); } catch { /* Analytics must never interrupt app actions. */ }
  };
  const appOpened = () => {
    if (!client || opened || client.has_opted_out_capturing()) return;
    opened = true; const params = new URLSearchParams(window.location.search);
    let referrer = ''; try { referrer = document.referrer ? new URL(document.referrer).hostname : ''; } catch { /* Invalid referrers carry no attribution. */ }
    capture('app_opened', { referrer, utm_source: params.get('utm_source'), utm_medium: params.get('utm_medium'), utm_campaign: params.get('utm_campaign') });
  };
  const identifyWallet = (address: string, connector = 'unknown', chainId = options.chainId) => {
    if (!client || !walletRegex.test(address) || client.has_opted_out_capturing()) return;
    const lower = address.toLowerCase(); if (wallet === lower) return;
    const persisted = client.get_distinct_id();
    if (wallet || walletRegex.test(persisted) && persisted.toLowerCase() !== lower) client.reset(); wallet = lower; client.identify(lower);
    capture('wallet_connected', { connector, chain_id: chainId });
  };
  const disconnectWallet = () => { if (!client) return; const persistedWallet = walletRegex.test(client.get_distinct_id()); if (wallet || persistedWallet) capture('wallet_disconnected'); wallet = null; client.reset(); };
  const submitted = (action: string, hash: string, chainId = options.chainId) => { if (hashRegex.test(hash)) capture('tx_submitted', { action, tx_hash: hash, chain_id: chainId }); };
  const failed = (action: string, error: unknown, hash?: string, chainId = options.chainId) => capture('tx_failed', { action, error_message: safeError(error), ...(hash && hashRegex.test(hash) ? { tx_hash: hash } : {}), chain_id: chainId });
  const confirmed = (action: string, receipt: Receipt, originalHash?: string, chainId = options.chainId) => {
    const hash = receipt.transactionHash ?? originalHash;
    if (receipt.status === 'success' && hash && hashRegex.test(hash)) capture('tx_confirmed', { action, tx_hash: hash, chain_id: chainId, ...(originalHash && originalHash !== hash ? { original_tx_hash: originalHash } : {}) });
    else if (receipt.status === 'reverted') failed(action, new Error('Transaction reverted'), hash, chainId);
  };
  return {
    appOpened, identifyWallet, disconnectWallet, track: capture,
    transactionSubmitted: submitted, transactionConfirmed: confirmed, transactionFailed: failed,
    interaction: (action: string, target: string, interactionType: 'ui' | 'contract' = 'ui') => capture('interaction', { action, target, interaction_type: interactionType }),
    formSubmitted: (formId: string, outcome: 'success' | 'failed' = 'success') => capture('form_submitted', { form_id: formId, outcome }),
    async trackTransaction<T extends Receipt>(input: { action: string; submit: () => Promise<`0x${string}`>; waitForReceipt: (hash: `0x${string}`) => Promise<T>; chainId?: number }): Promise<T> {
      let hash: `0x${string}` | undefined; let reported = false;
      try { hash = await input.submit(); submitted(input.action, hash, input.chainId); const receipt = await input.waitForReceipt(hash);
        confirmed(input.action, receipt, hash, input.chainId); if (receipt.status !== 'success') { reported = true; throw new Error('Transaction reverted'); } return receipt;
      } catch (error) { if (!reported) failed(input.action, error, hash, input.chainId); throw error; }
    },
    optIn: () => { client?.opt_in_capturing(); appOpened(); },
    optOut: () => { wallet = null; client?.reset(); client?.opt_out_capturing(); },
    isEnabled: () => Boolean(client && !client.has_opted_out_capturing()),
  };
}
