import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
function load(path, dependencies, globals = {}) {
  const source = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  vm.runInNewContext(source, { exports, require: name => { if (!(name in dependencies)) throw new Error(`Unexpected import: ${name}`); return dependencies[name]; }, Error, URL, AbortController, setTimeout, clearTimeout, ...globals });
  return exports;
}
const settings = { macOllamaUrl: 'http://192.168.1.52:11434', cloudAiEnabled: true, useOfflineAIFallback: true, basicOfflineHelp: true };
const success = data => ({ ok: true, json: async () => data });
function client(preferences, fetchImpl, key = 'test-google-key') {
  return load('src/features/ai/services/aiService.ts', {
    './streamAnswer': { streamAnswer: load('src/features/ai/services/streamAnswer.ts', { 'expo/fetch': { fetch: fetchImpl } }, { TextDecoder }).streamAnswer },
    './contextBuilder': { buildAcademicContext: () => ({ subjects: [] }) },
    './localAssistant': { askLocalAssistant: async () => ({ reply: 'Offline calculations', isFallback: true }) },
    '@/stores/useSettingsStore': { useSettingsStore: { getState: () => preferences } },
    '@/platform/googleApiKey': { getGoogleApiKey: async () => key },
  }, { fetch: fetchImpl }).askCampusIQAI;
}

test('phone calls Google directly with no Mac configured or contacted', async () => {
  let count = 0;
  const reply = await client({ ...settings, macOllamaUrl: '' }, async (url, options) => {
    count++;
    assert.equal(url, 'https://generativelanguage.googleapis.com/v1beta/models/gemma-4-26b-a4b-it:generateContent');
    assert.equal(options.headers['x-goog-api-key'], 'test-google-key');
    assert.ok(!options.body.includes('test-google-key'));
    return success({ candidates: [{ content: { parts: [{ thought: true, text: 'hidden' }, { text: 'Hello' }] } }] });
  })('Hello', true);
  assert.equal(count, 1);
  assert.equal(reply.provider, 'gemma-api');
  assert.equal(reply.isFallback, false);
  assert.ok(!reply.reply.includes('Gemma API ·'));
  assert.ok(!reply.reply.includes('hidden'));
});
for (const failure of ['quota', 'network', 'empty']) {
  test(`${failure} on Google falls back directly to Mac without sending Google key`, async () => {
    let count = 0;
    const reply = await client(settings, async (url, options) => {
      if (++count === 1) {
        if (failure === 'network') throw new Error('No internet');
        return failure === 'empty' ? success({}) : { ok: false, status: 429 };
      }
      assert.equal(url, settings.macOllamaUrl + '/api/chat');
      assert.equal(options.headers['x-goog-api-key'], undefined);
      assert.ok(!options.body.includes('test-google-key'));
      assert.equal(JSON.parse(options.body).model, 'gemma4:e4b-it-qat');
      return success({ message: { content: 'Local plan' } });
    })('Plan my study week');
    assert.equal(count, 2);
    assert.equal(reply.provider, 'gemma-local');
    assert.ok(!reply.reply.includes('gemma4:'));
    assert.ok(!reply.reply.includes('Google AI is switched off'));
  });
}
test('manual local mode never calls Google', async () => {
  const reply = await client({ ...settings, cloudAiEnabled: false }, async url => {
    assert.ok(url.startsWith(settings.macOllamaUrl));
    return success({ message: { content: 'Local only' } });
  })('Hello');
  assert.equal(reply.provider, 'gemma-local');
});
test('disabling fallback prevents any Mac calls', async () => {
  let count = 0;
  await assert.rejects(client({ ...settings, useOfflineAIFallback: false, basicOfflineHelp: false }, async url => {
    count++; assert.ok(url.startsWith('https://generativelanguage.googleapis.com/'));
    return { ok: false, status: 429 };
  })('Hello'), /HTTP 429/);
  assert.equal(count, 1);
});
test('no credentials or Mac gives labeled calculations without network requests', async () => {
  const reply = await client({ ...settings, macOllamaUrl: '' }, () => { throw new Error('must not call'); }, '')('Attendance');
  assert.equal(reply.provider, 'calculations');
  assert.match(reply.notice, /Add your Google AI Studio key/);
});
test('images reach Google and Mac in their respective formats', async () => {
  const image = { mimeType: 'image/png', data: 'iVBORw0KGgo=' };
  let count = 0;
  const reply = await client(settings, async (_url, options) => {
    const body = JSON.parse(options.body);
    if (++count === 1) {
      assert.deepEqual(body.contents[0].parts[1].inline_data, { mime_type: image.mimeType, data: image.data });
      return { ok: false, status: 429 };
    }
    assert.deepEqual(body.messages[0].images, [image.data]);
    return success({ message: { content: 'A notice' } });
  })('Read image', false, image);
  assert.equal(reply.provider, 'gemma-local');
});
test('failed images are never answered using deterministic calculations', async () => {
  await assert.rejects(client({ ...settings, macOllamaUrl: '' }, () => {}, '')('Read image', false,
    { mimeType: 'image/png', data: 'iVBORw0KGgo=' }), /image was not analyzed/);
});
test('invalid image types are rejected before contacting any provider', async () => {
  await assert.rejects(client(settings, () => { throw new Error('must not call'); })('Read image', false,
    { mimeType: 'image/svg+xml', data: 'abcd' }), /JPEG, PNG, or WebP/);
});
test('non-local HTTP cannot receive academic data', async () => {
  const reply = await client({ ...settings, cloudAiEnabled: false, macOllamaUrl: 'http://example.com' }, () => { throw new Error('must not call'); })('Hello');
  assert.equal(reply.provider, 'calculations');
});
test('settings migration preserves preferences and removes old backend configuration', () => {
  let options;
  load('src/stores/useSettingsStore.ts', {
    '@/platform/aiDefaults': { aiDefaults: { macOllamaUrl: '' } },
    'zustand': { create: () => initializer => initializer },
    'zustand/middleware': { persist: (initializer, config) => { options = config; return initializer; }, createJSONStorage: fn => fn() },
    '@/constants': { DEFAULTS: { attendanceTarget: 75, reminderMinutesBefore: 10 } },
    './storage': { zustandStorage: {} },
  });
  const migrated = options.migrate({ attendanceTarget: 80, theme: 'dark', aiServerUrl: 'http://localhost:8787', aiServerToken: 'old-token', geminiKey: 'old-key' });
  assert.equal(migrated.attendanceTarget, 80);
  assert.equal(migrated.theme, 'dark');
  assert.equal(migrated.macOllamaUrl, '');
  for (const key of ['geminiKey', 'aiServerUrl', 'aiServerToken']) assert.ok(!(key in migrated));
});
test('native Google key is stored in SecureStore and can be removed', async () => {
  const values = new Map();
  const keys = load('src/platform/googleApiKey.ts', { 'expo-secure-store': {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'device-only', getItemAsync: async key => values.get(key),
    setItemAsync: async (key, value, options) => { assert.equal(options.keychainAccessible, 'device-only'); values.set(key, value); },
    deleteItemAsync: async key => values.delete(key),
  } });
  await keys.setGoogleApiKey(' my-key ');
  assert.equal(await keys.getGoogleApiKey(), 'my-key');
  await keys.setGoogleApiKey('');
  assert.equal(await keys.getGoogleApiKey(), '');
});
test('browser Google key stays in memory and is cleared by reload', async () => {
  const first = load('src/platform/googleApiKey.web.ts', {});
  await first.setGoogleApiKey('test-key');
  assert.equal(await first.getGoogleApiKey(), 'test-key');
  assert.equal(await load('src/platform/googleApiKey.web.ts', {}).getGoogleApiKey(), '');
});

test('basic offline help works independently of Mac fallback', async () => {
  const reply = await client({ ...settings, useOfflineAIFallback: false, basicOfflineHelp: true }, async url => {
    assert.ok(url.startsWith('https://generativelanguage.googleapis.com/'));
    return { ok: false, status: 429 };
  })('Attendance');
  assert.equal(reply.provider, 'calculations');
});

test('Mac-only mode does not return calculations when basic offline help is disabled', async () => {
  await assert.rejects(client({ ...settings, cloudAiEnabled: false, basicOfflineHelp: false }, async () => { throw new Error('Mac off'); })('Attendance'), /Cannot reach Ollama/);
});

test('mode selection atomically sets the routing switches while preserving offline help', () => {
  let initializer;
  load('src/stores/useSettingsStore.ts', {
    '@/platform/aiDefaults': { aiDefaults: { macOllamaUrl: '' } },
    'zustand': { create: () => fn => { initializer = fn; } },
    'zustand/middleware': { persist: fn => fn, createJSONStorage: fn => fn() },
    '@/constants': { DEFAULTS: { attendanceTarget: 75, reminderMinutesBefore: 10 } },
    './storage': { zustandStorage: {} },
  });
  let state;
  const set = update => { Object.assign(state, typeof update === 'function' ? update(state) : update); };
  state = initializer(set, () => state);
  for (const [mode, cloud, local] of [['google', true, false], ['mac', false, true], ['automatic', true, true]]) {
    state.setAiMode(mode);
    assert.equal(state.cloudAiEnabled, cloud);
    assert.equal(state.useOfflineAIFallback, local);
    assert.equal(state.basicOfflineHelp, true);
  }
});

test('Mac setup accepts a Wi-Fi address and fills the port, but rejects unsafe addresses', () => {
  const checks = load('src/features/ai/services/connectionChecks.ts', { './aiService': { CLOUD_MODEL: 'gemma-cloud', LOCAL_MODEL: 'gemma-local' } });
  assert.equal(checks.normalizeMacAddress('192.168.1.52'), 'http://192.168.1.52:11434');
  assert.equal(checks.normalizeMacAddress('http://192.168.1.52:11434/'), 'http://192.168.1.52:11434');
  assert.throws(() => checks.normalizeMacAddress('http://example.com'), /private Wi-Fi/);
  assert.throws(() => checks.normalizeMacAddress('http://192.168.1.52/api/chat'), /without a path/);
});

test('Mac check verifies installed Gemma without generating an answer', async () => {
  const checks = load('src/features/ai/services/connectionChecks.ts', { './aiService': { CLOUD_MODEL: 'gemma-cloud', LOCAL_MODEL: 'gemma-local' } }, { fetch: async (url, options) => {
    assert.equal(url, 'http://192.168.1.52:11434/api/tags');
    assert.equal(options.method, 'GET');
    return success({ models: [{ name: 'gemma-local' }] });
  } });
  assert.match(await checks.checkMacConnection('192.168.1.52'), /No answer was generated/);
});

test('Mac reachable but missing model is not incorrectly marked ready', async () => {
  const checks = load('src/features/ai/services/connectionChecks.ts', { './aiService': { CLOUD_MODEL: 'gemma-cloud', LOCAL_MODEL: 'gemma-local' } }, { fetch: async () => success({ models: [] }) });
  await assert.rejects(checks.checkMacConnection('192.168.1.52'), /not installed/);
});

test('Google connection check uses a generic test without academic records', async () => {
  const checks = load('src/features/ai/services/connectionChecks.ts', { './aiService': { CLOUD_MODEL: 'gemma-cloud', LOCAL_MODEL: 'gemma-local' } }, { fetch: async (_url, options) => {
    assert.equal(options.headers['x-goog-api-key'], 'key');
    assert.equal(JSON.parse(options.body).contents[0].parts[0].text, 'Reply with OK.');
    return success({ candidates: [{ content: { parts: [{ text: 'OK' }] } }] });
  } });
  assert.match(await checks.checkGoogleConnection('key'), /real Gemma response/);
});

function streamed(text, chunkSize = 7) {
  const bytes = new TextEncoder().encode(text);
  let offset = 0;
  return { ok: true, body: { getReader: () => ({
    read: async () => offset >= bytes.length ? { done: true } : { done: false, value: bytes.slice(offset, offset += chunkSize) },
    releaseLock() {},
  }) } };
}
test('Google SSE streams visible text across chunk and UTF-8 boundaries without thoughts', async () => {
  const events = [];
  const reply = await client(settings, async (url, options) => {
    assert.ok(url.endsWith(':streamGenerateContent?alt=sse'));
    assert.equal(options.headers['x-goog-api-key'], 'test-google-key');
    return streamed(': keepalive\r\n\r\ndata: ' + JSON.stringify({ candidates: [{ content: { parts: [{ thought: true, text: 'hidden' }, { text: 'Hello 🎓' }] } }] }) + '\r\n\r\ndata: ' + JSON.stringify({ candidates: [{ content: { parts: [{ text: ' student' }] }, finishReason: 'STOP' }] }) + '\n\n', 1);
  })('Hello', false, undefined, value => events.push(value));
  assert.equal(reply.reply, 'Hello 🎓 student');
  assert.ok(events.some(e => e.content === 'Hello 🎓'));
  assert.ok(events.every(e => !e.content.includes('hidden')));
});
test('Ollama NDJSON streams answer content and ignores thinking fields', async () => {
  const updates = [];
  const reply = await client({ ...settings, cloudAiEnabled: false }, async (_url, options) => {
    assert.equal(JSON.parse(options.body).stream, true);
    return streamed('{"message":{"thinking":"private","content":"Your "},"done":false}\n{"message":{"content":"plan"},"done":true}', 3);
  })('Plan', false, undefined, value => updates.push(value));
  assert.equal(reply.reply, 'Your plan');
  assert.equal(updates.at(-1).content, 'Your plan');
});
test('interrupted cloud stream is replaced by local answer, never combined with it', async () => {
  let requests = 0;
  const updates = [];
  const reply = await client(settings, async () => ++requests === 1
    ? streamed('data: {"candidates":[{"content":{"parts":[{"text":"Partial cloud"}]}}]}\n\n')
    : streamed('{"message":{"content":"Complete local"},"done":true}\n'))('Plan', false, undefined, value => updates.push(value));
  assert.equal(reply.reply, 'Complete local');
  assert.ok(updates.some(e => e.provider === 'gemma-local' && e.content === ''));
  assert.ok(!updates.at(-1).content.includes('Partial'));
});
test('stream errors and incomplete local answers do not falsely report success', async () => {
  for (const response of ['{"error":"failed"}\n', '{"message":{"content":"Truncated"},"done":false}\n']) {
    await assert.rejects(client({ ...settings, cloudAiEnabled: false, basicOfflineHelp: false }, async () => streamed(response))('Hello', false, undefined, () => {}), /Cannot reach Ollama/);
  }
});

test('greetings and general questions reach Gemma without saved academic records', async () => {
  for (const question of ['hello', 'Hi there!', 'hello how are you', 'What is photosynthesis?', 'Explain CGPA', 'Write a poem']) {
    let prompt;
    const result = await client(settings, async (_url, options) => {
      prompt = JSON.parse(options.body).contents[0].parts[0].text;
      return success({ candidates: [{ content: { parts: [{ text: 'Model answer' }] } }] });
    })(question);
    assert.equal(result.provider, 'gemma-api');
    assert.equal(result.reply, 'Model answer');
    assert.ok(!prompt.includes('"subjects":'));
    assert.ok(prompt.includes(`Student question:\n${question}`));
    assert.ok(prompt.includes('For a greeting, greet briefly'));
  }
});
test('personal academic questions still receive saved facts', async () => {
  for (const question of ['Show my academic summary', 'How many classes can I skip?', 'What is my attendance?', 'attendance', 'Show grades']) {
    await client(settings, async (_url, options) => {
      assert.ok(JSON.parse(options.body).contents[0].parts[0].text.includes('"subjects":[]'));
      return success({ candidates: [{ content: { parts: [{ text: 'Model answer' }] } }] });
    })(question);
  }
});
test('image extraction does not attach unrelated records; explicit saved-data comparison does', async () => {
  for (const question of ['Extract the timetable from this image', 'Compare this image with my saved grades']) {
    await client({ ...settings, cloudAiEnabled: false }, async (_url, options) => {
      const prompt = JSON.parse(options.body).messages[0].content;
      assert.equal(prompt.includes('"subjects":[]'), question.includes('my saved'));
      return success({ message: { content: 'Model answer' } });
    })(question, false, { mimeType: 'image/png', data: 'iVBORw0KGgo=' });
  }
});
