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
