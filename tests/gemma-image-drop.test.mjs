import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
function loader(result = 'data:image/png;base64,iVBORw0KGgoAAA==', fail = false) {
  const exports = {};
  let reads = 0;
  class FileReader {
    result = result;
    readAsDataURL() { reads++; if (fail) this.onerror(); else this.onload(); }
  }
  vm.runInNewContext(ts.transpileModule(readFileSync('src/platform/imageDrop.web.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports, FileReader });
  return { read: exports.readDroppedImage, reads: () => reads };
}
const image = { type: 'image/png', size: 100 };
test('dropped image is serialized for inference and the composer preview', async () => {
  const { read } = loader();
  const attached = await read([image]);
  assert.equal(attached.mimeType, 'image/png');
  assert.equal(attached.data, 'iVBORw0KGgoAAA==');
  assert.equal(attached.uri, 'data:image/png;base64,iVBORw0KGgoAAA==');
});
test('unsupported, oversized, and multiple files are rejected before reading', async () => {
  const { read, reads } = loader();
  await assert.rejects(read([{ type: 'application/pdf', size: 100 }]), /JPEG, PNG, or WebP/);
  await assert.rejects(read([{ ...image, size: 3 * 1024 * 1024 + 1 }]), /3 MB/);
  await assert.rejects(read([image, image]), /one image/);
  await assert.rejects(read([]), /one image/);
  assert.equal(reads(), 0);
});
test('file read errors and invalid image signatures do not create attachments', async () => {
  await assert.rejects(loader('', true).read([image]), /Could not read/);
  await assert.rejects(loader('data:image/png;base64,bm90YW5pbWFnZQ==').read([image]), /valid JPEG/);
});

function dropZone(disabled = false) {
  let attached;
  let prevented = false;
  let calls = 0;
  const react = {
    createElement: (type, props, ...children) => ({ type, props, children }),
    useEffect: effect => effect(), useRef: value => ({ current: value }), useState: initial => [initial, () => {}],
  };
  const exports = {};
  vm.runInNewContext(ts.transpileModule(readFileSync('src/platform/ImageDropZone.web.tsx', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React, esModuleInterop: true } }).outputText, {
    exports, require: name => {
      if (name === 'react') return react;
      if (name === '@/theme') return { useTheme: () => ({ colors: {} }) };
      if (name === './imageDrop.web') return { readDroppedImage: async () => { calls++; return { uri: 'preview', data: 'image' }; } };
      throw new Error(name);
    },
  });
  const tree = exports.default({ disabled, onImage: image => { attached = image; }, onError: () => {}, children: null });
  return {
    drop: () => tree.props.onDrop({ dataTransfer: { types: ['Files'], files: [image] }, preventDefault: () => { prevented = true; }, stopPropagation: () => {} }),
    paste: (files = [image], items = []) => tree.props.onPasteCapture({ clipboardData: { files, items }, preventDefault: () => { prevented = true; }, stopPropagation: () => {} }),
    result: () => ({ attached, prevented, calls }),
  };
}
test('browser drop prevents navigation and attaches the image without sending a message', async () => {
  const zone = dropZone();
  zone.drop();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(zone.result().prevented, true);
  assert.equal(zone.result().attached.uri, 'preview');
});
test('dropping while an answer is loading does not replace the attachment', async () => {
  const zone = dropZone(true);
  zone.drop();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(zone.result().prevented, true);
  assert.equal(zone.result().calls, 0);
});

test('pasting a clipboard photo attaches a preview and prevents image data entering the text field', async () => {
  const zone = dropZone(); zone.paste();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(zone.result().prevented, true);
  assert.equal(zone.result().attached.uri, 'preview');
});
test('text paste is preserved and loading blocks image paste', async () => {
  const text = dropZone(); text.paste([], [{ kind: 'string' }]);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(text.result().prevented, false); assert.equal(text.result().calls, 0);
  const blocked = dropZone(true); blocked.paste();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(blocked.result().prevented, true); assert.equal(blocked.result().calls, 0);
});
test('clipboard file items are supported even when the files list is empty', async () => {
  const zone = dropZone(); zone.paste([], [{ kind: 'file', getAsFile: () => image }]);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(zone.result().attached.uri, 'preview');
});

function pastedImageParser() {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(readFileSync('src/platform/pastedImage.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports });
  return exports.parsePastedImage;
}
test('native clipboard data URLs become bounded model images and composer previews', () => {
  const parse = pastedImageParser();
  const uri = 'data:image/jpeg;base64,/9j/AA==';
  const image = parse(uri);
  assert.equal(image.data, '/9j/AA=='); assert.equal(image.mimeType, 'image/jpeg'); assert.equal(image.uri, uri);
  assert.throws(() => parse('data:image/png;base64,/9j/AA=='), /Could not read/);
  assert.throws(() => parse('data:text/plain;base64,dGVzdA=='), /JPEG/);
  assert.throws(() => parse('data:image/jpeg;base64,/9j/' + 'A'.repeat(4194304)), /3 MB/);
});


function nativeImageReader({ size = 100, exists = true, data = '/9j/AA==' } = {}) {
  const exports = {}; let reads = 0;
  class File { constructor(uri) { this.uri = uri; this.size = size; this.exists = exists; } async base64() { reads++; return data; } }
  vm.runInNewContext(ts.transpileModule(readFileSync('src/platform/nativePastedImage.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, {
    exports, require: name => name === 'expo-file-system' ? { File } : { parsePastedImage: pastedImageParser() },
  });
  return { read: exports.readNativePastedImage, reads: () => reads };
}
test('keyboard image files become a preview and provider-ready image without a separate paste button', async () => {
  const { read } = nativeImageReader();
  const photo = await read(['file:///tmp/keyboard-photo.jpeg']);
  assert.equal(photo.mimeType, 'image/jpeg'); assert.equal(photo.data, '/9j/AA==');
  assert.equal(photo.uri, 'data:image/jpeg;base64,/9j/AA==');
});
test('native paste rejects remote, multiple, missing or oversized files before reading them', async () => {
  const reader = nativeImageReader();
  await assert.rejects(reader.read(['https://example.com/photo.jpg']), /local/);
  await assert.rejects(reader.read(['file:///a.png', 'file:///b.png']), /one image/);
  assert.equal(reader.reads(), 0);
  const large = nativeImageReader({ size: 4 * 1024 * 1024 });
  await assert.rejects(large.read(['file:///a.png']), /3 MB/); assert.equal(large.reads(), 0);
  await assert.rejects(nativeImageReader({ exists: false }).read(['file:///a.png']), /no longer available/);
});

function keyboardWrapper(disabled = false, available = true, reader = async () => ({ uri: 'preview', mimeType: 'image/jpeg', data: '/9j/AA==' })) {
  const exports = {}; let attached; let error; let reads = 0;
  const react = { createElement: (type, props, ...children) => ({ type, props, children }), useRef: value => ({ current: value }), useEffect: effect => effect() };
  vm.runInNewContext(ts.transpileModule(readFileSync('src/platform/ChatPasteWrapper.tsx', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true } }).outputText, {
    exports, require: name => {
      if (name === 'react') return react;
      if (name === 'react-native') return { View: 'View' };
      if (name === 'expo') return { requireOptionalNativeModule: () => available ? {} : null };
      if (name === 'expo-paste-input') return { TextInputWrapper: 'NativeWrapper' };
      if (name === './nativePastedImage') return { readNativePastedImage: uris => { reads++; return reader(uris); } };
      throw new Error(name);
    },
  });
  const tree = exports.default({ children: 'text input', disabled, onImage: image => { attached = image; }, onError: message => { error = message; } });
  return { tree, result: () => ({ attached, error, reads }) };
}
test('keyboard paste events attach images while leaving ordinary text paste to the native input', async () => {
  const wrapper = keyboardWrapper();
  wrapper.tree.props.onPaste({ type: 'text', value: 'hello' });
  assert.equal(wrapper.result().reads, 0);
  wrapper.tree.props.onPaste({ type: 'images', uris: ['file:///photo.jpeg'] });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(wrapper.result().attached.uri, 'preview');
});
test('keyboard image paste is blocked during a request and native module absence preserves text input', () => {
  const blocked = keyboardWrapper(true);
  blocked.tree.props.onPaste({ type: 'images', uris: ['file:///photo.jpeg'] });
  assert.equal(blocked.result().reads, 0);
  const old = keyboardWrapper(false, false);
  assert.equal(old.tree.type, 'View'); assert.equal(old.tree.children[0], 'text input');
});
