type Event = { event: string; properties: Record<string, unknown>; $set?: unknown; $set_once?: unknown };
export class PostHog {
  config: Record<string, unknown> = {}; events: Event[] = []; identified: string[] = []; resets = 0; optedOut = false; distinctId = 'anonymous-test';
  constructor() { const g = globalThis as typeof globalThis & { orbitTestClients: PostHog[] }; (g.orbitTestClients ??= []).push(this); }
  init(token: string, config: Record<string, unknown>) { this.config = { ...config, token }; this.optedOut = Boolean(config.opt_out_capturing_by_default); }
  capture(event: string, properties: Record<string, unknown> = {}) { if (this.optedOut) return; const e = { event, properties: { token: this.config.token, distinct_id: this.distinctId, $current_url: 'https://app.example/?email=secret@example.com', $elements: [{ text: 'Private Name' }], ...properties }, $set: { email: 'secret@example.com' } }; const sent = (this.config.before_send as (e: Event) => Event | null)(e); if (sent) this.events.push(sent); }
  identify(id: string) { this.identified.push(id); const old = this.distinctId; this.distinctId = id; this.capture('$identify', { distinct_id: id, $anon_distinct_id: old, $process_person_profile: true }); }
  reset() { this.resets++; this.distinctId = 'anonymous-test-' + this.resets; }
  get_distinct_id() { return this.distinctId; }
  has_opted_out_capturing() { return this.optedOut; }
  opt_in_capturing() { this.optedOut = false; }
  opt_out_capturing() { this.optedOut = true; }
}
