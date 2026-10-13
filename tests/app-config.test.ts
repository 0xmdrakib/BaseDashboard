import { test } from 'node:test';
import assert from 'node:assert/strict';
import { appIdPattern, normalizeAppDomain, suggestAppId } from '../lib/app-config';
import { appSchema } from '../lib/app-schema';

test('a pasted app URL retains only the canonical domain', () => {
  assert.equal(normalizeAppDomain('  https://APP.Example.com/mint?ref=private#connect  '), 'app.example.com');
  assert.equal(normalizeAppDomain('app.example.com/collection'), 'app.example.com');
  assert.equal(normalizeAppDomain('https://app.example.com./'), 'app.example.com');
});
test('local app domains and custom ports are supported', () => {
  assert.equal(normalizeAppDomain('http://localhost:3000/'), 'localhost:3000');
  assert.equal(normalizeAppDomain('127.0.0.1:5173'), '127.0.0.1:5173');
});
test('credentials, unsafe protocols and malformed hosts are rejected', () => {
  for (const value of ['https://user:pass@app.example.com', 'ftp://app.example.com', 'javascript:alert(1)', 'not a domain', 'app', 'https://app_example.com', 'https://-app.example.com', 'https://app-.example.com', 'https:\\app.example.com']) assert.throws(() => normalizeAppDomain(value));
});
test('generated tracking IDs handle numeric, accented and non-Latin names', () => {
  assert.equal(suggestAppId('123 Mint'), 'app-123-mint');
  assert.equal(suggestAppId('Café Studio'), 'cafe-studio');
  assert.equal(suggestAppId('আমার অ্যাপ', 'mint.example.com'), 'mint');
  for (const name of ['A', '!!!', '9'.repeat(60), 'Long name '.repeat(15)]) assert.ok(appIdPattern.test(suggestAppId(name)));
});
test('tracking ID suggestions avoid existing and archived IDs within 48 characters', () => {
  assert.equal(suggestAppId('Mint', '', ['mint', 'mint-2']), 'mint-3');
  const base = 'a'.repeat(48); const id = suggestAppId(base, '', [base]);
  assert.equal(id.length, 48); assert.ok(id.endsWith('-2')); assert.ok(appIdPattern.test(id));
});
test('server validation normalizes URLs and supports any positive EVM chain', () => {
  const result = appSchema.parse({ id: 'my-app', name: ' My App ', domain: 'https://app.example.com/path?private=value', category: 'Other', color: '#157b72', chainId: 999, unexpected: 'discard' });
  assert.equal(result.domain, 'app.example.com'); assert.equal(result.name, 'My App'); assert.equal(result.chainId, 999); assert.equal('unexpected' in result, false);
  assert.equal(appSchema.safeParse({ ...result, chainId: 0 }).success, false);
});
