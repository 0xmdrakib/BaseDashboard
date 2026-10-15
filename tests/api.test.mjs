import { test } from 'node:test';
import assert from 'node:assert/strict';
const base = process.env.ORBIT_TEST_URL || 'http://127.0.0.1:5173';
if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(base)) throw new Error('API tests are restricted to a local server.');
const call = (path, method = 'GET', body, extra = {}) => fetch(base + path, {
  method, headers: { Origin: base, 'Content-Type': 'application/json', ...extra },
  ...(body ? { body: JSON.stringify(body) } : {}),
});
const forgedIdentity = { 'oai-authenticated-user-id': 'forged-owner', 'oai-authenticated-user-email': 'forged@example.com' };

test('an unconfigured workspace returns empty data without reading private configuration', async () => {
  const response = await call('/api/config'); const data = await response.json();
  assert.equal(response.status, 200); assert.equal(data.authenticated, false);
  assert.deepEqual(data.apps, []); assert.equal(data.connection.configured, false);
  assert.equal(data.connection.hasReadKey, false); assert.equal(data.connection.projectId, '');
  assert.match(response.headers.get('cache-control'), /no-store/);
});
test('client-supplied platform identity headers never authenticate a visitor', async () => {
  const response = await call('/api/config', 'GET', undefined, forgedIdentity);
  assert.equal((await response.json()).authenticated, false);
});
for (const [path, method] of [['/api/apps', 'POST'], ['/api/apps', 'PATCH'], ['/api/settings', 'PUT'], ['/api/funnels', 'POST']]) {
  test(`${method} ${path} rejects unauthenticated writes before accessing the database`, async () => {
    const response = await call(path, method, {}, forgedIdentity);
    assert.equal(response.status, 401); assert.match((await response.json()).error, /Sign-in is not configured/);
  });
}
test('analytics reads require a verified identity even with forged headers', async () => {
  assert.equal((await call('/api/analytics?days=7', 'GET', undefined, forgedIdentity)).status, 401);
});
test('anonymous funnel reads reveal no saved journeys', async () => {
  const response = await call('/api/funnels'); assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), []); assert.match(response.headers.get('cache-control'), /no-store/);
});
test('cross-origin writes are rejected', async () => {
  assert.equal((await call('/api/apps', 'POST', {}, { Origin: 'https://untrusted.example' })).status, 403);
});
test('the generated SDK download is served by the production application', async () => {
  const response = await call('/sdk/orbit-analytics-sdk-1.0.0.tgz');
  assert.equal(response.status, 200); assert.ok((await response.arrayBuffer()).byteLength > 1000);
});
