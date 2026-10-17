import test from 'node:test';
import assert from 'node:assert/strict';
import { createAIProxy } from '../server/index.mjs';

async function withServer(config, fn, generate = async body => ({ reply: body.query, provider: 'gemma-api' })) {
  const server = createAIProxy(config, generate);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try { await fn(`http://127.0.0.1:${server.address().port}`); }
  finally { await new Promise(resolve => server.close(resolve)); }
}
const post = (url, body, headers = {}) => fetch(url + '/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });

test('proxy rejects unauthorized callers and disallowed browser origins', async () => {
  await withServer({ token: 'secret' }, async url => {
    assert.equal((await post(url, {})).status, 401);
    assert.equal((await post(url, {}, { Origin: 'https://evil.example', Authorization: 'Bearer secret' })).status, 403);
    assert.equal((await fetch(url + '/health', { headers: { Authorization: 'Bearer secret' } })).status, 200);
    const preflight = await fetch(url + '/api/chat', { method: 'OPTIONS', headers: { Origin: 'http://localhost:4173' } });
    assert.equal(preflight.status, 204);
    assert.equal(preflight.headers.get('Access-Control-Allow-Origin'), 'http://localhost:4173');
  });
});

test('proxy validates input, caps payloads, and forwards privacy preferences', async () => {
  await withServer({}, async url => {
    assert.equal((await post(url, { query: '', context: {} })).status, 400);
    assert.equal((await post(url, { query: 'hello', context: {}, allowCloud: 'false' })).status, 400);
    assert.equal((await post(url, { query: 'hello', context: { extra: 'x'.repeat(33000) } })).status, 413);
    const response = await post(url, { query: 'hi', context: {}, allowCloud: false, allowLocal: true });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).provider, 'gemma-local');
  }, async body => { assert.equal(body.allowCloud, false); return { reply: 'Hi', provider: 'gemma-local' }; });
});

test('unavailable model returns 503 so the app can label calculations honestly', async () => {
  await withServer({}, async url => {
    const response = await post(url, { query: 'hi', context: {} });
    assert.equal(response.status, 503);
  }, async () => { throw new Error('Gemma unavailable'); });
});

test('proxy accepts one bounded image and rejects malformed or mismatched image content', async () => {
  const image = { mimeType: 'image/png', data: 'iVBORw0KGgo=' };
  await withServer({}, async url => {
    const base = { query: 'Read the notice', context: {}, image };
    assert.equal((await post(url, base)).status, 200);
    assert.equal((await post(url, { ...base, image: { ...image, mimeType: 'image/jpeg' } })).status, 400);
    assert.equal((await post(url, { ...base, image: { ...image, data: 'not base64!' } })).status, 400);
    assert.equal((await post(url, { ...base, image: { ...image, data: 'a'.repeat(4194308) } })).status, 400);
  }, async body => { assert.equal(body.image.data, image.data); return { reply: 'Notice', provider: 'gemma-api' }; });
});
