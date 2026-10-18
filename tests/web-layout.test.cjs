const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

function load(path, dependencies) {
  const source = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const exports = {};
  vm.runInNewContext(source, { exports, require(name) {
    if (name === 'react' || name === 'react/jsx-runtime') return require(name);
    if (name in dependencies) return dependencies[name];
    throw new Error(`Unexpected dependency: ${name}`);
  } });
  return exports;
}

test('desktop screen measurements use phone width while retaining height and scale', () => {
  const size = { width: 1440, height: 900, scale: 2, fontScale: 1 };
  const dimensions = load('src/platform/dimensions.web.ts', {
    'react-native': { Dimensions: { get: () => size }, useWindowDimensions: () => size },
    './webLayout': { APP_WIDTH: 430 },
  });
  assert.equal(dimensions.Dimensions.get('window').width, 430);
  assert.equal(dimensions.useWindowDimensions().width, 430);
  assert.equal(dimensions.useWindowDimensions().height, 900);
  assert.equal(dimensions.useWindowDimensions().scale, 2);
  size.width = 390;
  assert.equal(dimensions.useWindowDimensions().width, 390);
});

test('closed drawer never mounts menu content outside the phone viewport', () => {
  let rendered = 0;
  const { Drawer } = load('src/platform/Drawer.web.tsx', {
    'react-native-drawer-layout': { Drawer: props => React.createElement('div', null, props.children, props.renderDrawerContent()) },
    './dimensions': { useWindowDimensions: () => ({ width: 390 }) },
  });
  const html = renderToStaticMarkup(React.createElement(Drawer, {
    open: false, onOpen() {}, onClose() {},
    renderDrawerContent: () => { rendered++; return 'More menu'; },
  }, 'App screen'));
  assert.equal(rendered, 0);
  assert.ok(html.includes('App screen'));
  assert.ok(!html.includes('More menu'));
});

test('opened drawer uses the same menu content inside phone-width bounds', () => {
  let drawerWidth;
  const { Drawer } = load('src/platform/Drawer.web.tsx', {
    'react-native-drawer-layout': { Drawer: props => { drawerWidth = props.drawerStyle[0].width; return React.createElement('div', null, props.renderDrawerContent()); } },
    './dimensions': { useWindowDimensions: () => ({ width: 390 }) },
  });
  const html = renderToStaticMarkup(React.createElement(Drawer, { open: true, onOpen() {}, onClose() {}, renderDrawerContent: () => 'More menu' }));
  assert.ok(html.includes('More menu'));
  assert.equal(drawerWidth, 334);
});
