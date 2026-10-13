/** Bound provider responses before JSON parsing to protect the Worker memory limit. */
export async function readPostHogJson<T>(response: Response, maxBytes = 8 * 1024 * 1024): Promise<T> {
  const reader = response.body?.getReader(); if (!reader) throw new Error('PostHog returned an empty response.');
  const decoder = new TextDecoder(); let bytes = 0; let text = '';
  while (true) {
    const { done, value } = await reader.read(); if (done) break;
    bytes += value.byteLength;
    if (bytes > maxBytes) { await reader.cancel(); throw new Error('PostHog result is too large. Select a shorter period or a single app.'); }
    text += decoder.decode(value, { stream: true });
  }
  text += decoder.decode();
  try { return JSON.parse(text) as T; } catch { throw new Error('PostHog returned an invalid response. Please try again.'); }
}
