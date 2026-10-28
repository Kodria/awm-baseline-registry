import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// RF-R.0 (S1): harness only — design pointer present + package script wired.
// S2/S3 extend this file with content asserts (same CMD-CONTRACT).

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8').replace(/\r\n/g, '\n');

const DESIGN_POINTER = 'docs/plans/2026-10-27-sensor-execution-optimization-design.md';
const PKG = 'package.json';
const SCRIPT = 'test:sensor-execution-optimization';
const CONTRACT = 'tests/r18-sensor-execution-optimization-contract.test.mjs';

test('RF-R.0: design pointer file exists', () => {
  assert.equal(existsSync(path.join(root, DESIGN_POINTER)), true, `${DESIGN_POINTER} must exist`);
  const text = read(DESIGN_POINTER);
  assert.match(text, /RF-R\.0/, 'design pointer must mention RF-R.0');
  assert.match(text, /single normative source|Normative source/i, 'design pointer must cite CLI normative source');
});

test('RF-R.0: package.json wires test:sensor-execution-optimization to this contract', () => {
  const pkg = JSON.parse(read(PKG));
  assert.ok(pkg.scripts && typeof pkg.scripts === 'object', 'package.json must declare scripts');
  const cmd = pkg.scripts[SCRIPT];
  assert.equal(typeof cmd, 'string', `scripts.${SCRIPT} must be a string`);
  assert.match(cmd, /node --test/, `scripts.${SCRIPT} must run node --test`);
  assert.ok(cmd.includes(CONTRACT) || cmd.includes('r18-sensor-execution-optimization-contract'),
    `scripts.${SCRIPT} must point at ${CONTRACT}`);
  assert.equal(existsSync(path.join(root, CONTRACT)), true, `${CONTRACT} must exist`);
});
