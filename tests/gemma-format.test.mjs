import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const exports = {};
vm.runInNewContext(ts.transpileModule(readFileSync('src/features/ai/services/answerFormat.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports });
const { parseAnswer, inlineParts } = exports;

test('timetables become structured tables preserving empty cells and literal angle brackets', () => {
  const blocks = parseAnswer('The timetable for **Class 5A3**:\n\n| Day | 8:00 | 9:00 |\n| :--- | ---: | --- |\n| **MON** | | AI [403] |\n| TUE | <PE> | CN |');
  assert.equal(blocks[0].kind, 'paragraph');
  assert.equal(blocks[1].kind, 'table');
  assert.equal(blocks[1].headers.length, 3);
  assert.equal(blocks[1].rows[0][1], '');
  assert.equal(blocks[1].rows[1][1], '<PE>');
});
test('table splitting preserves escaped and inline-code pipes', () => {
  const table = parseAnswer('| A | B |\n| --- | --- |\n| x\\|y | `a|b` |')[0];
  assert.equal(table.rows[0][0], 'x|y');
  assert.equal(table.rows[0][1], '`a|b`');
});
test('headings, numbered lists and code have distinct presentation blocks', () => {
  const blocks = parseAnswer('## Monday\n1. **AI** at 8:00\n- Bring notes\n\n```text\n| literal |\n```');
  assert.equal(blocks[0].kind, 'heading');
  assert.equal(blocks[1].marker, '1.');
  assert.equal(blocks[2].marker, '•');
  assert.equal(blocks[3].kind, 'code');
  assert.equal(blocks[3].text, '| literal |');
});
test('inline emphasis removes delimiters while keeping text and code literal', () => {
  const parts = inlineParts('Hello **Class 5A3**, use `**literal**` and *notes*.');
  assert.equal(parts.map(p => p.text).join(''), 'Hello Class 5A3, use **literal** and notes.');
  assert.equal(parts[1].style, 'bold');
  assert.equal(parts[3].style, 'code');
});
