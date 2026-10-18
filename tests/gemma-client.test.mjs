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
const success = data => ({ ok: true, json: async () => data, ...(data.message?.content ? streamed(JSON.stringify({ ...data, done: true }) + '\n') : {}) });
function client(preferences, fetchImpl, key = 'test-google-key') {
  return load('src/features/ai/services/aiService.ts', {
    './conversation': load('src/features/ai/services/conversation.ts', {}),
    './requestControl': load('src/features/ai/services/requestControl.ts', {}),
    './streamAnswer': { streamAnswer: load('src/features/ai/services/streamAnswer.ts', { 'expo/fetch': { fetch: fetchImpl }, './conversation': load('src/features/ai/services/conversation.ts', {}), './requestControl': load('src/features/ai/services/requestControl.ts', {}) }, { TextDecoder }).streamAnswer },
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

test('greetings and general questions use the real model with optional personalization context', async () => {
  for (const question of ['hello', 'Hi there!', 'hello how are you', 'What is photosynthesis?', 'Explain CGPA', 'Write a poem']) {
    let prompt;
    const result = await client(settings, async (_url, options) => {
      prompt = JSON.parse(options.body).contents[0].parts[0].text;
      return success({ candidates: [{ content: { parts: [{ text: 'Model answer' }] } }] });
    })(question);
    assert.equal(result.provider, 'gemma-api');
    assert.equal(result.reply, 'Model answer');
    assert.ok(prompt.includes('"subjects":'));
    assert.ok(prompt.includes('If none are relevant, answer normally without mentioning the saved data.'));
    assert.ok(prompt.includes(`Student question:\n${question}`));
    assert.ok(prompt.includes('For greetings such as "hello", give a brief friendly greeting'));
    assert.ok(prompt.includes('Summarize the whole profile only if explicitly requested.'));
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
test('image questions include personalization but prioritize visible image content', async () => {
  for (const question of ['Extract the timetable from this image', 'Compare this image with my saved grades']) {
    await client({ ...settings, cloudAiEnabled: false }, async (_url, options) => {
      const prompt = JSON.parse(options.body).messages[0].content;
      assert.ok(prompt.includes('"subjects":[]'));
      assert.ok(prompt.includes('Do not replace image content with saved facts.'));
      assert.ok(prompt.includes('Compare with saved records only when asked.'));
      return success({ message: { content: 'Model answer' } });
    })(question, false, { mimeType: 'image/png', data: 'iVBORw0KGgo=' });
  }
});

test('structured app actions request JSON from Google and never use calculation fallback', async () => {
  const response = await client(settings, async (_url, options) => {
    const body = JSON.parse(options.body);
    assert.equal(body.generationConfig.responseMimeType, 'application/json');
    assert.ok(body.contents[0].parts[0].text.includes('APP ACTION REQUEST'));
    return success({ candidates: [{ content: { parts: [{ text: '{"subjects":[]}' }] } }] });
  })('Add math', false, undefined, undefined, { structuredInstruction: 'Return JSON only' });
  assert.equal(response.reply, '{"subjects":[]}');
  await assert.rejects(client({ ...settings, cloudAiEnabled: false, useOfflineAIFallback: false }, async () => {})('Add math', false, undefined, undefined, { structuredInstruction: 'Return JSON only' }), /Nothing was saved/);
});
test('structured local actions use JSON format and larger extraction budget', async () => {
  await client({ ...settings, cloudAiEnabled: false }, async (_url, options) => {
    const body = JSON.parse(options.body);
    assert.equal(body.format, 'json'); assert.equal(body.stream, true);
    assert.ok(body.options.num_predict > 512);
    return success({ message: { content: '{"subjects":[]}' } });
  })('Add math', false, undefined, undefined, { structuredInstruction: 'Return JSON only' });
});

for (const mode of ['cloud', 'local', 'fallback']) {
  test(`${mode} timetable image reaches extraction and produces a valid duplicate-safe subject/class plan`, async () => {
    const actions = load('src/features/ai/services/actionDraft.ts', {});
    const extracted = JSON.stringify({ subjects: [{ name: 'Mathematics', code: 'MA101', credits: null }], classes: [{ subject: 'MA101', day: 0, start: '09:00', end: '10:00', room: '201', type: 'lecture' }] });
    const image = { mimeType: 'image/png', data: 'iVBORw0KGgo=' };
    let calls = 0;
    const ask = client({ ...settings, cloudAiEnabled: mode !== 'local' }, async (url, options) => {
      calls++;
      const body = JSON.parse(options.body);
      if (url.includes('googleapis.com')) {
        assert.equal(body.contents[0].parts[1].inline_data.data, image.data);
        if (mode === 'fallback') return { ok: false, status: 429 };
        return success({ candidates: [{ content: { parts: [{ text: extracted }] } }] });
      }
      assert.equal(options.headers['x-goog-api-key'], undefined);
      assert.deepEqual(body.messages[0].images, [image.data]);
      assert.deepEqual(body.format, JSON.parse(JSON.stringify(actions.academicActionSchema)));
      return success({ message: { content: extracted } });
    });
    const reply = await ask('Add the subjects and update my timetable from this image', false, image, undefined,
      { structuredInstruction: 'Extract subjects and weekly classes for review.', structuredSchema: actions.academicActionSchema });
    assert.equal(reply.provider, mode === 'cloud' ? 'gemma-api' : 'gemma-local');
    assert.equal(calls, mode === 'fallback' ? 2 : 1);
    const before = { subjects: [], semesters: [], entries: [], gradeEntries: [], assignments: [], exams: [], records: [], gradeScheme: { boundaries: [] } };
    const draft = actions.parseActionDraft(reply.reply);
    assert.throws(() => actions.planAcademicActions(draft, before, 2, () => 'unused'), /Choose Theory/);
    // The reviewer explicitly chooses the type when extraction has no evidence.
    draft.subjects[0].type = 'theory';
    let next = 0;
    const plan = actions.planAcademicActions(draft, before, 2, () => `import-${++next}`);
    assert.equal(before.subjects.length, 0);
    assert.equal(plan.subjects[0].semesterId, '2');
    assert.equal(plan.entries[0].subjectId, plan.subjects[0].id);
    assert.equal(plan.entries[0].startTime, '09:00');
    const repeated = actions.planAcademicActions(draft, plan, 2, () => `import-${++next}`);
    assert.equal(repeated.subjects.length, 1);
    assert.equal(repeated.entries.length, 1);
  });
}

for (const mode of ['cloud', 'local', 'fallback']) {
  test(`${mode} prepares month attendance through the same action service with real saved class references`, async () => {
    const actions = load('src/features/ai/services/actionDraft.ts', {});
    const before = { currentSemester: 2, subjects: [{ id: 'math', name: 'Math', code: 'MA101', semesterId: '2', credits: 3 }], entries: [{ id: 'monday', subjectId: 'math', dayOfWeek: 0, startTime: '09:00', endTime: '10:00' }], assignments: [], exams: [], records: [], events: {}, semesters: [], gradeEntries: [], gradeScheme: { boundaries: [] } };
    const extracted = JSON.stringify({ attendanceRanges: [{ subject: 'MA101', from: '2026-10-01', to: '2026-10-31', status: 'absent' }] });
    const ask = client({ ...settings, cloudAiEnabled: mode !== 'local' }, async (url, options) => {
      const body = JSON.parse(options.body);
      const prompt = url.includes('googleapis.com') ? body.contents[0].parts[0].text : body.messages[0].content;
      assert.ok(prompt.includes('monday'));
      assert.ok(prompt.includes('\"id\":\"math\"'));
      assert.ok(prompt.includes('attendanceRanges'));
      assert.ok(prompt.includes('Never invent an ID'));
      if (url.includes('googleapis.com')) return mode === 'fallback' ? { ok: false, status: 429 } : success({ candidates: [{ content: { parts: [{ text: extracted }] } }] });
      assert.deepEqual(body.format, JSON.parse(JSON.stringify(actions.academicActionSchema)));
      assert.ok(body.options.num_ctx >= 16384);
      return success({ message: { content: extracted } });
    });
    const service = load('src/features/ai/services/academicActions.ts', {
      './aiService': { askCampusIQAI: ask }, './actionDraft': actions,
      './applyAcademicActions': { actionSnapshot: () => before },
      '@/stores/useProfileStore': { useProfileStore: { getState: () => ({ profile: { currentSemester: 2 } }) } },
      '@/stores/useSubjectStore': { useSubjectStore: { getState: () => before } },
    });
    const prepared = await service.prepareAcademicActions('Mark all my Math classes absent for October 2026');
    assert.equal(prepared.provider, mode === 'cloud' ? 'gemma-api' : 'gemma-local');
    let ids = 0;
    const plan = actions.planAcademicActions(prepared.draft, before, 2, () => `record-${++ids}`);
    assert.equal(plan.records.length, 4);
    assert.ok(plan.records.every(r => r.status === 'absent' && r.timetableEntryId === 'monday'));
    assert.equal(before.records.length, 0);
  });
}

for (const mode of ['cloud', 'local', 'fallback']) {
  test(`${mode} ordinary chat retains the original timetable and unresolved faculty question across follow-ups`, async () => {
    const image = { mimeType: 'image/png', data: 'iVBORw0KGgo=' };
    const history = [
      { id: 'welcome', role: 'assistant', content: 'Hello there.' },
      { role: 'user', content: 'Check this timetable and tell me its subjects', image },
      { role: 'assistant', content: 'Artificial Intelligence, Data Exploration.' },
      { role: 'user', content: 'What are the names of the faculty?' },
      { role: 'assistant', content: 'Please provide more context.' },
    ];
    const original = JSON.stringify(history); let calls = 0;
    const reply = await client({ ...settings, cloudAiEnabled: mode !== 'local' }, async (url, options) => {
      calls++;
      const body = JSON.parse(options.body);
      const google = url.includes('googleapis.com');
      const turns = google ? body.contents : body.messages;
      const text = turn => google ? turn.parts[0].text : turn.content;
      assert.equal(turns.length, 5);
      assert.equal(text(turns[0]), history[1].content);
      assert.equal(text(turns[2]), 'What are the names of the faculty?');
      assert.ok(text(turns.at(-1)).includes('Check from that timetable'));
      assert.ok(text(turns.at(-1)).includes('last unresolved user request'));
      if (google) {
        assert.deepEqual(turns.map(t => t.role), ['user', 'model', 'user', 'model', 'user']);
        assert.equal(body.generationConfig.responseMimeType, undefined);
        assert.equal(body.generationConfig.maxOutputTokens, 1024);
        assert.equal(turns.flatMap(t => t.parts).filter(p => p.inline_data).length, 1);
        assert.equal(turns[0].parts[1].inline_data.data, image.data);
        if (mode === 'fallback') return { ok: false, status: 429 };
        return success({ candidates: [{ content: { parts: [{ text: 'Faculty from the original timetable.' }] } }] });
      }
      assert.equal(body.format, undefined);
      assert.equal(turns.flatMap(t => t.images ?? []).length, 1);
      assert.equal(turns[0].images[0], image.data);
      assert.equal(body.options.num_ctx, 16384);
      return success({ message: { content: 'Faculty from the original timetable.' } });
    })('Check from that timetable', false, undefined, undefined, { history });
    assert.equal(reply.reply, 'Faculty from the original timetable.');
    assert.equal(calls, mode === 'fallback' ? 2 : 1);
    assert.equal(JSON.stringify(history), original);
  });
}

test('conversation bounds retain an older source image while excluding welcome, pending and failed answers', () => {
  const { buildAIConversation } = load('src/features/ai/services/conversation.ts', {});
  const image = { mimeType: 'image/png', data: 'iVBORw0KGgo=' };
  const history = [{ role: 'user', content: 'My timetable', image }];
  for (let n = 0; n < 30; n++) history.push({ role: n % 2 ? 'assistant' : 'user', content: 'x'.repeat(2000) });
  history.push({ role: 'assistant', id: 'welcome', content: 'WELCOME' }, { role: 'assistant', pending: true, content: 'PENDING' }, { role: 'assistant', failed: true, content: 'FAILED' });
  const turns = buildAIConversation(history, 'Who teaches those subjects?');
  assert.ok(turns.length <= 14);
  assert.ok(turns.reduce((sum, turn) => sum + turn.content.length, 0) < 15000);
  assert.equal(turns.filter(turn => turn.image).length, 1);
  assert.equal(turns[0].image.data, image.data);
  assert.ok(!JSON.stringify(turns).includes('WELCOME'));
  assert.ok(!JSON.stringify(turns).includes('PENDING'));
  assert.ok(!JSON.stringify(turns).includes('FAILED'));
  const newImage = { mimeType: 'image/jpeg', data: '/9j/AA==' };
  const updated = buildAIConversation(history, 'Use this corrected timetable', newImage);
  assert.equal(updated.filter(turn => turn.image).length, 1);
  assert.equal(updated.at(-1).image, newImage);
});

test('structured app changes also retain conversation roles and the earlier source image', async () => {
  const image = { mimeType: 'image/png', data: 'iVBORw0KGgo=' };
  await client({ ...settings, cloudAiEnabled: false }, async (_url, options) => {
    const body = JSON.parse(options.body);
    assert.equal(body.messages[0].images[0], image.data);
    assert.equal(body.messages[1].role, 'assistant');
    assert.ok(body.messages.at(-1).content.includes('Add those subjects'));
    assert.equal(body.format, 'json');
    return success({ message: { content: '{"subjects":[]}' } });
  })('Add those subjects', false, undefined, undefined, { structuredInstruction: 'Propose app changes only.', history: [{ role: 'user', content: 'Read my timetable', image }, { role: 'assistant', content: 'Math and Physics.' }] });
});

test('Google server error retries an import once without JSON MIME mode, preserving image and validation contract', async () => {
  let calls = 0;
  const image = { mimeType: 'image/png', data: 'iVBORw0KGgo=' };
  const reply = await client({ ...settings, useOfflineAIFallback: false }, async (url, options) => {
    calls++;
    assert.ok(url.includes('googleapis.com'));
    const body = JSON.parse(options.body);
    assert.equal(body.contents[0].parts[1].inline_data.data, image.data);
    assert.ok(body.contents[0].parts[0].text.includes('APP ACTION REQUEST'));
    if (calls === 1) {
      assert.equal(body.generationConfig.responseMimeType, 'application/json');
      return { ok: false, status: 500 };
    }
    assert.equal(body.generationConfig.responseMimeType, undefined);
    return success({ candidates: [{ content: { parts: [{ text: '{"subjects":[]}' }] } }] });
  })('Add the subjects from this timetable', false, image, undefined, { structuredInstruction: 'Return a JSON draft only.' });
  assert.equal(calls, 2); assert.equal(reply.provider, 'gemma-api');
});

test('persistent server failures stop after one retry and explain that Google-only mode cannot use the Mac', async () => {
  let calls = 0;
  await assert.rejects(client({ ...settings, useOfflineAIFallback: false }, async url => {
    calls++; assert.ok(url.includes('googleapis.com')); return { ok: false, status: 500 };
  })('Add Math', false, undefined, undefined, { structuredInstruction: 'Return JSON only.' }), /Google-only mode.*Mac was not contacted/);
  assert.equal(calls, 2);
});

test('an already cancelled request never contacts a provider', async () => {
  const controller = new AbortController(); controller.abort(); let calls = 0;
  await assert.rejects(client(settings, async () => { calls++; })('Hello', false, undefined, undefined, { signal: controller.signal }), { name: 'AbortError' });
  assert.equal(calls, 0);
});

test('closing during a cloud request aborts its transport and never starts fallback', async () => {
  const controller = new AbortController(); let ready; let calls = 0; let transportAborted = false;
  const started = new Promise(resolve => { ready = resolve; });
  const pending = client(settings, async (_url, options) => {
    calls++; ready();
    return new Promise((_resolve, reject) => options.signal.addEventListener('abort', () => {
      transportAborted = true; reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
    }, { once: true }));
  })('Add Math', false, undefined, undefined, { structuredInstruction: 'Return JSON only.', signal: controller.signal });
  await started; controller.abort();
  await assert.rejects(pending, { name: 'AbortError' });
  assert.equal(transportAborted, true); assert.equal(calls, 1);
});

test('closing a local structured import closes the response reader and aborts generation without calculations', async () => {
  const controller = new AbortController(); let ready; let finishRead; let cancelled = 0; let transportSignal;
  const started = new Promise(resolve => { ready = resolve; });
  const pending = client({ ...settings, cloudAiEnabled: false }, async (_url, options) => {
    const body = JSON.parse(options.body);
    assert.equal(body.stream, true); assert.equal(body.format, 'json'); transportSignal = options.signal;
    return { ok: true, body: { getReader: () => ({
      read: () => new Promise(resolve => { finishRead = resolve; ready(); }),
      cancel: async () => { cancelled++; finishRead?.({ done: true }); },
      releaseLock: () => {},
    }) } };
  })('Import the timetable', false, undefined, undefined, { structuredInstruction: 'Return JSON only.', signal: controller.signal });
  await started; controller.abort();
  await assert.rejects(pending, { name: 'AbortError' });
  assert.equal(transportSignal.aborted, true); assert.ok(cancelled >= 1);
});

test('cancelling streamed Google text stops progress and never contacts local fallback', async () => {
  const controller = new AbortController(); let calls = 0; let cancelled = false; const updates = [];
  const pending = client(settings, async () => {
    calls++;
    return { ok: true, body: new ReadableStream({
      start(stream) { stream.enqueue(new TextEncoder().encode('data: {"candidates":[{"content":{"parts":[{"text":"Partial"}]}}]}\n\n')); },
      cancel() { cancelled = true; },
    }) };
  })('Explain attendance', false, undefined, update => {
    updates.push(update.content);
    if (update.content === 'Partial') controller.abort();
  }, { signal: controller.signal });
  await assert.rejects(pending, { name: 'AbortError' });
  assert.equal(cancelled, true); assert.equal(calls, 1);
  assert.equal(updates.filter(content => content === 'Partial').length, 1);
});

test('cloud action requests stream readable message text while keeping change JSON hidden', async () => {
  const updates = [];
  const source = '{"message":"Preparing your timetable → review","classes":[]}';
  const ask = client(settings, async (url, options) => {
    assert.ok(url.includes(':streamGenerateContent'));
    assert.equal(JSON.parse(options.body).generationConfig.responseMimeType, 'application/json');
    return streamed('data: ' + JSON.stringify({ candidates: [{ content: { parts: [{ text: source.slice(0, 24) }] } }] }) + '\n\ndata: ' + JSON.stringify({ candidates: [{ content: { parts: [{ text: source.slice(24) }] }, finishReason: 'STOP' }] }) + '\n\n', 1);
  });
  const reply = await ask('Import timetable', false, undefined, update => updates.push(update), { structuredInstruction: 'Prepare app changes.' });
  assert.equal(reply.reply, source);
  assert.ok(updates.some(update => update.content === 'Preparing your timetable → review'));
  assert.ok(updates.every(update => !update.content.includes('"classes"') && !update.content.startsWith('{')));
});

test('partial action message decoding handles incomplete escapes and Unicode', () => {
  const { readActionMessage } = load('src/features/ai/services/conversation.ts', {});
  assert.equal(readActionMessage('{"classes":['), '');
  assert.equal(readActionMessage('{"message":"Hello\\nworld'), 'Hello\nworld');
  assert.equal(readActionMessage('{"message":"Lab \\u219'), 'Lab ');
  assert.equal(readActionMessage('{"message":"Lab \\u2192 Course","classes":[]}'), 'Lab → Course');
});

test('repetitive provider output is stopped without retry or local fallback', async () => {
  let calls = 0;
  const ask = client(settings, async () => {
    calls++;
    return streamed('data: ' + JSON.stringify({ candidates: [{ content: { parts: [{ text: 'de facto '.repeat(40) }] } }] }) + '\n\n');
  });
  await assert.rejects(() => ask('Hello', false, undefined, () => {}), /started repeating/);
  assert.equal(calls, 1);
  const { buildAIConversation } = load('src/features/ai/services/conversation.ts', {});
  const history = buildAIConversation([{ role: 'user', content: 'Hello' }, { role: 'assistant', content: 'de facto '.repeat(40) }], 'Try again');
  assert.ok(history.every(turn => !turn.content.includes('de facto')));
});
