import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { compareSemver } from '../scripts/semver.mjs';
import { validatePackV2 } from './support/sensor-pack-v2-validator.mjs';

// RF-R.0 (S1) + RF-1.9 / RF-3.1 / RF-7.* (S2). S3 extends skill asserts in this file.

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8').replace(/\r\n/g, '\n');

const DESIGN_POINTER = 'docs/plans/2026-10-27-sensor-execution-optimization-design.md';
const PKG = 'package.json';
const SCRIPT = 'test:sensor-execution-optimization';
const CONTRACT = 'tests/r18-sensor-execution-optimization-contract.test.mjs';

/** Published CLI that first parses pack `inputs` / sensor `closureOnly` (RF-7.2). */
const FIRST_CLI_WITH_INPUTS = '9.22.0';

const ALWAYS_EXECUTE = new Set(['format', 'test', 'mutation', 'security', 'depcheck']);
const DIR_ANCHORED = /(?:^|\/)(?:src|lib|app|apps|packages|test|tests|scripts)(?:\/|$)/;

function loadPacks() {
  const packsDir = path.join(root, 'sensor-packs');
  return readdirSync(packsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const packPath = path.join(packsDir, entry.name, 'pack.json');
      return { name: entry.name, packPath };
    })
    .filter(({ packPath }) => existsSync(packPath))
    .map(({ name, packPath }) => ({
      name,
      packPath,
      pack: JSON.parse(read(path.relative(root, packPath))),
    }));
}

function isDirectoryAnchoredGlob(glob) {
  // RF-1.9: reject pack-default globs with a source-dir segment before ** (e.g. src/**/*.ts).
  const starStar = glob.indexOf('**');
  if (starStar < 0) return DIR_ANCHORED.test(glob);
  const before = glob.slice(0, starStar);
  return DIR_ANCHORED.test(before);
}

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

test('RF-1.9 / RF-3.1: pack defaults are extension-bound; format/test/mutation/security have no inputs; mutation is closureOnly', () => {
  const packs = loadPacks();
  assert.ok(packs.length > 0, 'expected shipped sensor packs');
  let sawTypecheckInputs = false;
  let sawLintInputs = false;
  let sawMutationClosure = false;

  for (const { name, pack, packPath } of packs) {
    validatePackV2(pack, path.dirname(packPath));
    for (const [sensorId, sensor] of Object.entries(pack.sensors)) {
      const variantInputs = sensor.variants.map((variant) => variant.inputs).filter(Boolean);
      if (ALWAYS_EXECUTE.has(sensorId)) {
        assert.equal(variantInputs.length, 0, `${name}/${sensorId} must ship without default inputs`);
      }
      if (sensorId === 'mutation') {
        assert.equal(sensor.closureOnly, true, `${name}/mutation must set closureOnly: true`);
        sawMutationClosure = true;
      }
      for (const inputs of variantInputs) {
        for (const glob of inputs) {
          assert.equal(isDirectoryAnchoredGlob(glob), false,
            `${name} pack-default glob must not be directory-anchored: ${glob}`);
          assert.ok(!glob.includes('{') && !glob.includes('}'), `brace expansion forbidden: ${glob}`);
        }
        if (sensorId === 'typecheck') sawTypecheckInputs = true;
        if (sensorId === 'lint') sawLintInputs = true;
      }
    }
  }

  assert.equal(sawTypecheckInputs, true, 'at least one pack must declare typecheck inputs');
  assert.equal(sawLintInputs, true, 'at least one pack must declare lint inputs');
  assert.equal(sawMutationClosure, true, 'at least one pack must declare mutation.closureOnly');
});

test('RF-7.1 / RF-7.2: minCliVersion and certifiedCli.version are at least FIRST_CLI_WITH_INPUTS', () => {
  const registry = JSON.parse(read('awm-registry.json'));
  const cert = JSON.parse(read('cli-certification.json'));
  assert.equal(FIRST_CLI_WITH_INPUTS, '9.22.0', 'FIRST_CLI_WITH_INPUTS must track published N');
  assert.ok(compareSemver(registry.minCliVersion, FIRST_CLI_WITH_INPUTS, 'minCliVersion', 'FIRST_CLI_WITH_INPUTS') >= 0,
    `minCliVersion ${registry.minCliVersion} must be >= ${FIRST_CLI_WITH_INPUTS}`);
  assert.ok(compareSemver(cert.certifiedCli.version, registry.minCliVersion, 'certifiedCli.version', 'minCliVersion') >= 0,
    `certifiedCli.version ${cert.certifiedCli.version} must be >= minCliVersion ${registry.minCliVersion}`);

  const packs = loadPacks();
  const declaresNewFields = packs.some(({ pack }) => Object.values(pack.sensors).some((sensor) => (
    sensor.closureOnly === true || sensor.variants.some((variant) => Array.isArray(variant.inputs))
  )));
  assert.equal(declaresNewFields, true, 'packs declare inputs/closureOnly so the floor must hold');
});

test('RF-7.4: schema allows inputs/closureOnly; mirror validator enforces RF-1.5', () => {
  const schema = JSON.parse(read('sensor-packs/pack.schema.json'));
  assert.ok(schema.$defs.sensor.properties.closureOnly, 'schema must allow sensor.closureOnly');
  assert.ok(schema.$defs.variant.properties.inputs, 'schema must allow variant.inputs');
  assert.ok(schema.$defs.inputGlob, 'schema must define inputGlob');

  const fixtureRoot = path.join(root, 'tests/fixtures/sensor-packs/valid/js-ts');
  const base = JSON.parse(read('tests/fixtures/sensor-packs/valid/js-ts/pack.json'));
  const good = structuredClone(base);
  good.sensors.lint.variants[0].inputs = ['**/*.ts'];
  good.sensors.lint.closureOnly = true;
  validatePackV2(good, fixtureRoot);

  const badBrace = structuredClone(base);
  badBrace.sensors.lint.variants[0].inputs = ['**/*.{ts,tsx}'];
  assert.throws(() => validatePackV2(badBrace, fixtureRoot), /brace/);
});
