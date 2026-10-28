import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// R5 (S1) smoke. S2 extends this file with R1–R4 content asserts.

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8').replace(/\r\n/g, '\n');

const DESIGN = 'docs/plans/2026-10-28-systematic-debugging-data-over-time-design.md';
const PKG = 'package.json';
const SCRIPT = 'test:systematic-debugging-data-over-time';
const CONTRACT = 'tests/r19-systematic-debugging-data-over-time-contract.test.mjs';

test('R5: design pointer exists and names R1', () => {
  assert.equal(existsSync(path.join(root, DESIGN)), true, `${DESIGN} must exist`);
  assert.match(read(DESIGN), /\bR1\b/, 'design must mention R1');
});

test('R5: package.json wires test:systematic-debugging-data-over-time to this contract', () => {
  const pkg = JSON.parse(read(PKG));
  assert.ok(pkg.scripts && typeof pkg.scripts === 'object', 'package.json must declare scripts');
  const cmd = pkg.scripts[SCRIPT];
  assert.equal(typeof cmd, 'string', `scripts.${SCRIPT} must be a string`);
  assert.match(cmd, /node --test/, `scripts.${SCRIPT} must run node --test`);
  assert.ok(cmd.includes(CONTRACT) || cmd.includes('r19-systematic-debugging-data-over-time-contract'),
    `scripts.${SCRIPT} must point at ${CONTRACT}`);
  assert.equal(existsSync(path.join(root, CONTRACT)), true, `${CONTRACT} must exist`);
});
