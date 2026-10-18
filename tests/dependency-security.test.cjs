const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');

test('iOS project tooling keeps generating valid project IDs with patched UUID', () => {
  const project = require('xcode').project('security-test.pbxproj');
  project.hash = { project: { objects: { PBXFileReference: {} } } };
  const id = project.generateUuid();
  assert.match(id, /^[A-F0-9]{24}$/);
  const localRequire = createRequire(require.resolve('xcode'));
  assert.equal(localRequire('uuid/package.json').version, '11.1.1');
});

test('optional Expo tunnel tooling keeps its CommonJS UUID v4 API', () => {
  const tunnel = require('@expo/ngrok');
  assert.equal(typeof tunnel.connect, 'function');
  const localRequire = createRequire(require.resolve('@expo/ngrok'));
  assert.equal(localRequire('uuid/package.json').version, '11.1.1');
  assert.match(localRequire('uuid').v4(), /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
});
