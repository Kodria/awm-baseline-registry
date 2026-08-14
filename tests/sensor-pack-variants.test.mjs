import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validatePackV2 } from './support/sensor-pack-v2-validator.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixtures = path.join(root, 'tests', 'fixtures', 'sensor-packs');

function readFixture(name) {
  return JSON.parse(fs.readFileSync(path.join(fixtures, name, 'pack.json'), 'utf8'));
}

function fixtureRoot(name) {
  return path.join(fixtures, name);
}

{
  const pack = readFixture('valid/js-ts');
  assert.equal(pack.schemaVersion, 2);
  assert.equal(pack.coverage.schemaVersion, 1);
  assert.doesNotThrow(() => validatePackV2(pack, fixtureRoot('valid/js-ts')));
}

for (const [fixture, message] of [
  ['overlap', /equal-priority overlap/],
  ['asset-escape', /asset.*outside/],
  ['shell-command', /structured command/],
  ['future-schema', /schemaVersion/],
  ['unknown-probe', /probe/],
  ['missing-asset', /asset.*exists/],
]) {
  assert.throws(() => validatePackV2(readFixture(`invalid/${fixture}`), fixtureRoot(`invalid/${fixture}`)), message, `rejects ${fixture}`);
}

for (const name of ['generic', 'js-ts', 'python', 'shell']) {
  const pack = JSON.parse(fs.readFileSync(path.join(root, 'sensor-packs', name, 'pack.json'), 'utf8'));
  assert.ok(!Object.hasOwn(pack, 'schemaVersion'), `${name} must remain legacy until T11`);
}

console.log('sensor-pack-variants: v2 fixtures rejected/accepted; 4 legacy packs accepted');
