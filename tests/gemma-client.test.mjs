import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

function client(settings, fetchImpl) {
  const source = ts.transpileModule(readFileSync('src/features/ai/services/aiService.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const dependencies = {
    './contextBuilder': { buildAcademicContext: () => ({ subjects: [] }) },
    './localAssistant': { askLocalAssistant: async () => ({ reply: 'Offline calculations', isFallback: true }) },
    '@/stores/useSettingsStore': { useSettingsStore: { getState: () => settings } },
  };
  const exports = {};
  vm.runInNewContext(source, { exports, require: name => dependencies[name], fetch: fetchImpl, Error, URL, AbortController, setTimeout, clearTimeout });
  return exports.askCampusIQAI;
}
const settings = { aiServerUrl: 'http://127.0.0.1:8787', aiServerToken: 'access', cloudAiEnabled: true, useOfflineAIFallback: true };

test('client always retries API after fallback and sends preferences to backend only', async () => {
  const ask = client({ ...settings, cloudAiEnabled: false }, async (url, options) => {
    assert.equal(url, settings.aiServerUrl + '/api/chat');
    assert.equal(options.headers.Authorization, 'Bearer access');
    assert.equal(JSON.parse(options.body).allowCloud, false);
    assert.equal(JSON.parse(options.body).allowLocal, true);
    return { ok: true, json: async () => ({ reply: 'Plan', provider: 'gemma-local', model: 'gemma4:e4b-it-qat' }) };
  });
  const reply = await ask('Plan my week', true);
  assert.equal(reply.provider, 'gemma-local');
  assert.match(reply.reply, /Gemma on your Mac/);
});

test('unconfigured app makes no network request and labels deterministic fallback', async () => {
  const ask = client({ ...settings, aiServerUrl: '' }, () => { throw new Error('must not call'); });
  const reply = await ask('Attendance');
  assert.equal(reply.provider, 'calculations');
  assert.match(reply.reply, /Connect an AI Server URL/);
});

test('fallback disabled exposes connection failure instead of fabricating model output', async () => {
  const ask = client({ ...settings, useOfflineAIFallback: false }, async () => { throw new Error('Server down'); });
  await assert.rejects(ask('hello'), /Server down/);
});

test('non-local HTTP is rejected before sending academic data or token', async () => {
  const ask = client({ ...settings, aiServerUrl: 'http://example.com', useOfflineAIFallback: false }, () => { throw new Error('must not call'); });
  await assert.rejects(ask('hello'), /Use HTTPS/);
});

test('a genuine cloud response is labeled as Gemma API', async () => {
  const reply = await client(settings, async () => ({ ok: true, json: async () => ({ reply: 'Hi', provider: 'gemma-api' }) }))('hello');
  assert.equal(reply.isFallback, false);
  assert.match(reply.reply, /Gemma API/);
});

test('settings migration preserves academic preferences and removes legacy provider secrets', () => {
  const source = ts.transpileModule(readFileSync('src/stores/useSettingsStore.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  let options;
  const dependencies = {
    '@/platform/aiDefaults': { aiDefaults: { aiServerUrl: '', aiServerToken: '' } },
    'zustand': { create: () => initializer => initializer },
    'zustand/middleware': { persist: (initializer, config) => { options = config; return initializer; }, createJSONStorage: fn => fn() },
    '@/constants': { DEFAULTS: { attendanceTarget: 75, reminderMinutesBefore: 10 } },
    './storage': { zustandStorage: {} },
  };
  vm.runInNewContext(source, { exports: {}, require: name => dependencies[name] });
  const migrated = options.migrate({ attendanceTarget: 80, theme: 'dark', geminiKey: 'old-key', awsSecretKey: 'old-secret', aiModelPriority: ['aws'], demoModeEnabled: true });
  assert.equal(migrated.attendanceTarget, 80);
  assert.equal(migrated.theme, 'dark');
  assert.equal(migrated.aiServerUrl, '');
  for (const key of ['geminiKey', 'awsSecretKey', 'aiModelPriority', 'demoModeEnabled']) assert.ok(!(key in migrated));
  const setTheme = () => {};
  assert.equal(options.merge(migrated, { setTheme }).setTheme, setTheme);
});

test('image failures never produce deterministic calculations pretending to analyze the image', async () => {
  const ask = client({ ...settings, aiServerUrl: '' }, () => { throw new Error('must not call'); });
  await assert.rejects(ask('Read the image', false, { mimeType: 'image/png', data: 'iVBORw0KGgo=' }), /image was not analyzed/);
});
