const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(path, globals = {}, dependencies = {}) {
  const source = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  vm.runInNewContext(source, { exports, require: key => { if (!(key in dependencies)) throw new Error(`Unexpected import: ${key}`); return dependencies[key]; }, ...globals }, { filename: path });
  return exports;
}

test('web storage is safe during static rendering', async () => {
  const { zustandStorage } = load('src/stores/storage.web.ts');
  assert.equal(await zustandStorage.getItem('settings'), null);
  await zustandStorage.setItem('settings', 'value');
  assert.equal(await zustandStorage.getItem('settings'), null);
});

test('browser data survives store reloads and removes correctly', async () => {
  const values = new Map();
  const window = { localStorage: { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) } };
  const first = load('src/stores/storage.web.ts', { window });
  await first.zustandStorage.setItem('attendance', '{"present":12}');
  const second = load('src/stores/storage.web.ts', { window });
  assert.equal(await second.zustandStorage.getItem('attendance'), '{"present":12}');
  await second.zustandStorage.removeItem('attendance');
  assert.equal(await second.zustandStorage.getItem('attendance'), null);
});

test('blocked browser storage keeps the session usable and reports failed persistence', async () => {
  const window = { localStorage: { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('quota'); }, removeItem() { throw new Error('blocked'); } } };
  const adapter = load('src/stores/storage.web.ts', { window });
  const errors = [];
  adapter.setStorageErrorListener((operation, key) => errors.push([operation, key]));
  await adapter.zustandStorage.setItem('subjects', 'saved');
  assert.equal(await adapter.zustandStorage.getItem('subjects'), 'saved');
  await adapter.zustandStorage.removeItem('subjects');
  assert.equal(await adapter.zustandStorage.getItem('subjects'), null);
  assert.ok(errors.some(([operation]) => operation === 'set'));
});

test('JSON export/import round trips without native filesystem access', async () => {
  const adapter = load('src/platform/fileSystem.web.ts');
  const uri = adapter.cacheDirectory + 'subjects.json';
  const json = JSON.stringify({ subjects: [{ name: 'Math', credits: 4 }] });
  await adapter.writeAsStringAsync(uri, json);
  assert.equal(await adapter.readAsStringAsync(uri), json);
});

test('file importer accepts only local document URLs', async () => {
  const adapter = load('src/platform/fileSystem.web.ts', { fetch: async uri => ({ ok: true, text: async () => `read:${uri}` }) });
  assert.equal(await adapter.readAsStringAsync('blob:local-file'), 'read:blob:local-file');
  await assert.rejects(adapter.readAsStringAsync('https://example.com/private'), /local JSON/);
});

test('browser connection defaults contain no provider credentials', () => {
  const adapter = load('src/platform/aiDefaults.web.ts');
  assert.deepEqual(Object.values(adapter.aiDefaults), ['', '']);
});

test('JSON sharing downloads a named file and releases its temporary contents', async () => {
  const files = new Map([['campusiq-export://subjects.json', { content: '{"subjects":[]}', mimeType: 'application/json' }]]);
  let clicked = false;
  const anchor = { click() { clicked = true; }, remove() {} };
  const adapter = load('src/platform/sharing.web.ts', {
    Blob, URL: { createObjectURL: () => 'blob:export', revokeObjectURL() {} }, setTimeout() {},
    document: { createElement: () => anchor, body: { append() {} } },
  }, { './fileSystem.web': { exportFiles: files } });
  await adapter.shareAsync('campusiq-export://subjects.json');
  assert.equal(anchor.download, 'subjects.json');
  assert.ok(clicked);
  assert.equal(files.size, 0);
});

test('print reports are sandboxed and invoke the browser PDF/print flow', async () => {
  let printed = false;
  const attributes = {};
  const frame = { style: {}, setAttribute(k,v) { attributes[k] = v; }, remove() {}, contentWindow: { addEventListener() {}, focus() {}, print() { printed = true; } } };
  const files = new Map([['report', { content: '<h1>Grades</h1>', mimeType: 'text/html' }]]);
  const adapter = load('src/platform/sharing.web.ts', { setTimeout() {}, document: { createElement: () => frame, body: { append() { frame.onload(); } } } }, { './fileSystem.web': { exportFiles: files } });
  await adapter.shareAsync('report');
  assert.ok(printed);
  assert.equal(frame.srcdoc, '<h1>Grades</h1>');
  assert.equal(attributes.sandbox, 'allow-same-origin allow-modals');
});

test('unsupported phone capabilities never claim success on the web', async () => {
  const auth = load('src/platform/localAuthentication.web.ts');
  const notifications = load('src/utils/notifications.web.ts');
  assert.equal(await auth.hasHardwareAsync(), false);
  assert.equal(await auth.authenticateAsync().then(r => r.success), false);
  assert.equal(await notifications.requestNotificationPermissions(), false);
});

test('Render configuration includes the SPA rewrite and a secret-free build', () => {
  const render = readFileSync('render.yaml', 'utf8');
  assert.match(render, /runtime: static/);
  assert.match(render, /npm ci && npm run build:web/);
  assert.match(render, /destination: \/index.html/);
  const config = JSON.parse(readFileSync('app.json', 'utf8'));
  assert.equal(config.expo.web.output, 'single');
});

test('demo assistant uses the saved attendance target and never calls a provider', async () => {
  const context = { currentSemester: 'Semester 4', sgpa: 8.5, cgpa: 8.2, subjects: [{ name: 'Mathematics', credits: 4, grade: 'A', attendance: { present: 18, totalClasses: 20, absent: 2, percentage: 90, target: 75 } }] };
  const pure = load('src/lib/pureAttendanceUtils.ts');
  const service = load('src/features/ai/services/localAssistant.ts', { fetch() { throw new Error('Cloud request must not occur'); } }, {
    './contextBuilder': { buildAcademicContext: () => context },
    '@/lib/pureAttendanceUtils': pure,
    '@/stores/useTimetableStore': { useTimetableStore: { getState: () => ({ entries: [], events: {} }) } },
    '@/stores/useSubjectStore': { useSubjectStore: { getState: () => ({ subjects: [] }) } },
  });
  const answer = await service.askLocalAssistant('How many Mathematics classes can I skip?');
  assert.equal(answer.isFallback, true);
  assert.match(answer.reply, /target 75%/);
  assert.match(answer.reply, /miss 4 more classes/);
  assert.match(answer.reply, /without a cloud AI model/);
  const unknown = await service.askLocalAssistant('Write my essay');
  assert.match(unknown.reply, /connect your Gemma server/);
});
