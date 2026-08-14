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

// v2 has three deliberately distinct asset states.  Native variants carry no
// pack assets, baseline variants carry the config they materialize, and future
// hardening choices carry their own contained assets at the top level.
{
  const native = readFixture('valid/js-ts');
  native.sensors.lint.variants[0].assets = [];
  native.sensors.lint.variants[0].command.args = ['.'];
  assert.doesNotThrow(() => validatePackV2(native, fixtureRoot('valid/js-ts')), 'native variant permits no assets');

  const baseline = readFixture('valid/js-ts');
  assert.doesNotThrow(() => validatePackV2(baseline, fixtureRoot('valid/js-ts')), 'baseline variant materializes its asset');

  const hardening = readFixture('valid/js-ts');
  hardening.hardening = { 'strict-mode': { assets: ['eslint.config.awm.mjs'] } };
  assert.doesNotThrow(() => validatePackV2(hardening, fixtureRoot('valid/js-ts')), 'hardening is a nonempty ID-to-contained-assets mapping');
}

for (const [name, mutate, message] of [
  ['missing package-manager declaration', (pack) => { pack.sensors.lint.variants[0].command = { executable: 'npm', resolution: 'path', args: ['run', 'lint'] }; }, /packageManager/],
  ['unsupported package manager', (pack) => { pack.sensors.lint.variants[0].command.packageManager = 'volta'; }, /packageManager/],
  ['mismatched package manager', (pack) => { pack.sensors.lint.variants[0].command = { executable: 'pnpm', resolution: 'path', args: ['lint'], packageManager: 'npm' }; }, /packageManager/],
  ['unallowlisted command environment', (pack) => { pack.sensors.lint.variants[0].command.environment = { NODE_OPTIONS: '--trace-warnings' }; }, /environment/],
  ['nonexact command environment', (pack) => { pack.sensors.lint.variants[0].command.environment = { ESLINT_USE_FLAT_CONFIG: 'invalid' }; }, /environment/],
  ['extra command environment key', (pack) => { pack.sensors.lint.variants[0].command.environment = { ESLINT_USE_FLAT_CONFIG: 'false', PATH: 'unsafe' }; }, /environment/],
  ['loose coverage class', (pack) => { pack.coverage.classes['lint-errors'] = { detectors: [{ sensor: 'lint' }] }; }, /coverage/],
]) {
  const pack = readFixture('valid/js-ts');
  mutate(pack);
  assert.throws(() => validatePackV2(pack, fixtureRoot('valid/js-ts')), message, `rejects ${name}`);
}

{
  const pack = readFixture('valid/js-ts');
  pack.sensors.lint.variants[0].command.environment = { ESLINT_USE_FLAT_CONFIG: 'true' };
  assert.doesNotThrow(() => validatePackV2(pack, fixtureRoot('valid/js-ts')), 'the flat-config environment explicitly allows true');
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

for (const name of ['generic', 'python', 'shell']) {
  const pack = JSON.parse(fs.readFileSync(path.join(root, 'sensor-packs', name, 'pack.json'), 'utf8'));
  assert.ok(!Object.hasOwn(pack, 'schemaVersion'), `${name} must remain legacy until T11`);
}

console.log('sensor-pack-variants: v2 fixtures rejected/accepted; 3 legacy packs accepted');
