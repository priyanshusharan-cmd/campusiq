import test from 'node:test';
import assert from 'node:assert/strict';
import { generateReply, CLOUD_MODEL, LOCAL_MODEL } from '../server/gemma.mjs';
const input = { query: 'Help plan my revision', context: { subjects: [] } };
const config = { apiKey: 'test-secret', ollamaUrl: 'http://127.0.0.1:11434', cloudTimeout: 10, localTimeout: 10 };
const success = data => ({ ok: true, json: async () => data });

test('Gemma API has priority; the key stays in a header and no local call occurs', async () => {
  const calls = [];
  const result = await generateReply(input, config, async (url, options) => {
    calls.push(url);
    assert.equal(options.headers['x-goog-api-key'], 'test-secret');
    assert.ok(!options.body.includes('test-secret'));
    return success({ candidates: [{ content: { parts: [{ thought: true, text: 'private reasoning' }, { text: 'Plan' }] } }] });
  });
  assert.equal(calls.length, 1);
  assert.ok(calls[0].includes(CLOUD_MODEL));
  assert.equal(result.provider, 'gemma-api');
  assert.equal(result.reply, 'Plan');
});

for (const failure of ['quota', 'timeout', 'empty']) {
  test(`${failure} on API falls back to actual local Gemma without sending its API key`, async () => {
    const calls = [];
    const result = await generateReply(input, config, async (url, options) => {
      calls.push(url);
      if (calls.length === 1) {
        if (failure === 'timeout') throw new Error('timeout');
        return failure === 'empty' ? success({}) : { ok: false, status: 429 };
      }
      assert.equal(url, config.ollamaUrl + '/api/chat');
      assert.equal(options.headers['x-goog-api-key'], undefined);
      const body = JSON.parse(options.body);
      assert.equal(body.model, LOCAL_MODEL);
      assert.equal(body.stream, false);
      return success({ message: { content: 'Local plan' } });
    });
    assert.equal(result.provider, 'gemma-local');
    assert.equal(result.isFallback, true);
    assert.equal(calls.length, 2);
  });
}

test('cloud disabled never calls Google, even with a key configured', async () => {
  const result = await generateReply({ ...input, allowCloud: false }, config, async url => {
    assert.ok(url.startsWith(config.ollamaUrl));
    return success({ message: { content: 'Local only' } });
  });
  assert.equal(result.provider, 'gemma-local');
});

test('missing key skips Google; disabled local fallback makes no call', async () => {
  let calls = 0;
  await assert.rejects(generateReply({ ...input, allowLocal: false }, { ...config, apiKey: '' }, async () => { calls++; }), /not configured/);
  assert.equal(calls, 0);
});

test('both providers failing produces an explicit error without provider credentials', async () => {
  await assert.rejects(generateReply(input, config, async () => { throw new Error(config.apiKey); }), error => {
    assert.ok(error.message.includes('Local Gemma is unavailable'));
    assert.ok(!error.message.includes(config.apiKey));
    return true;
  });
});

test('image content reaches hosted Gemma as inline data and local Gemma as base64 images', async () => {
  const image = { mimeType: 'image/png', data: 'iVBORw0KGgo=' };
  let calls = 0;
  const result = await generateReply({ ...input, image }, config, async (_url, options) => {
    const body = JSON.parse(options.body);
    calls++;
    if (calls === 1) {
      assert.deepEqual(body.contents[0].parts[1].inline_data, { mime_type: image.mimeType, data: image.data });
      return { ok: false, status: 429 };
    }
    assert.deepEqual(body.messages[0].images, [image.data]);
    return success({ message: { content: 'A timetable' } });
  });
  assert.equal(result.provider, 'gemma-local');
});
