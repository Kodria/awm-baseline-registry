import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const normalizeLf = text => text.replace(/\r\n/g, '\n');
const read = relative => normalizeLf(fs.readFileSync(path.join(root, relative), 'utf8'));

function block(text, indent, key) {
  const lines = text.split(/\r?\n/);
  const opening = new RegExp(`^ {${indent}}${key}:\\s*(?:#.*)?$`);
  const start = lines.findIndex(line => opening.test(line));
  assert.notEqual(start, -1, `missing ${' '.repeat(indent)}${key}: YAML node`);
  const next = lines.slice(start + 1).findIndex(line => line.trim() && !line.startsWith(' '.repeat(indent + 1)));
  return lines.slice(start + 1, next === -1 ? undefined : start + 1 + next).join('\n');
}

test('RF-1.1: validate.yml on: is pull_request only', () => {
  const raw = read('.github/workflows/validate.yml');
  const on = block(raw, 0, 'on');
  assert.match(on, /^ {2}pull_request:\s*$/m);
  assert.doesNotMatch(on, /^ {2}push:\s*$/m);
  assert.doesNotMatch(on, /branches:\s*\[\s*main\s*\]/);
});

test('RF-1.2: validate.yml concurrency cancels superseded PR runs', () => {
  const concurrency = block(read('.github/workflows/validate.yml'), 0, 'concurrency');
  assert.match(concurrency, /^ {2}group: validate-\$\{\{ github\.ref \}\}\s*$/m);
  assert.match(concurrency, /^ {2}cancel-in-progress: true\s*$/m);
});

test('RF-1.3: auto-tag.yml still pushes on main and never cancels in-flight tags', () => {
  const raw = read('.github/workflows/auto-tag.yml');
  const on = block(raw, 0, 'on');
  assert.match(on, /^ {2}push:\s*$/m);
  assert.match(on, /^ {4}branches:\s*\[\s*main\s*\]\s*$/m);
  const concurrency = block(raw, 0, 'concurrency');
  assert.match(concurrency, /^ {2}group: auto-tag\s*$/m);
  assert.match(concurrency, /^ {2}cancel-in-progress: false\s*$/m);
});
