import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validatePackV2 } from './support/sensor-pack-v2-validator.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (name) => JSON.parse(fs.readFileSync(path.join(root, 'sensor-packs', name, 'pack.json'), 'utf8'));
const python = read('python'); const shell = read('shell'); const generic = read('generic');
const policy = JSON.parse(fs.readFileSync(path.join(root, 'sensor-packs/shared/semgrep-policy.json'), 'utf8'));
const pins = JSON.parse(fs.readFileSync(path.join(root, 'tests/fixtures/certification-pins.json'), 'utf8')).pins;

function parseVersion(version) {
  const match = String(version).match(/^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/);
  assert.ok(match, `certification pin '${version}' must be a release semantic version`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function compareVersions(left, right) {
  for (let index = 0; index < 3; index += 1) {
    if (left[index] !== right[index]) return left[index] < right[index] ? -1 : 1;
  }
  return 0;
}

function satisfies(version, range) {
  const parsed = parseVersion(version);
  const comparators = String(range).trim().split(/\s+/).map((comparator) => {
    const match = comparator.match(/^(>=|>|<=|<|=)?v?(0|[1-9]\d*)(?:\.(0|[1-9]\d*))?(?:\.(0|[1-9]\d*))?$/);
    assert.ok(match, `unsupported semver comparator '${comparator}' in '${range}'`);
    return { operator: match[1] ?? '=', version: [Number(match[2]), Number(match[3] ?? 0), Number(match[4] ?? 0)] };
  });
  assert.ok(comparators.length > 0, 'semver range must contain a comparator');
  return comparators.every(({ operator, version: boundary }) => {
    const result = compareVersions(parsed, boundary);
    return ({ '>': result > 0, '>=': result >= 0, '<': result < 0, '<=': result <= 0, '=': result === 0 })[operator];
  });
}

function variant(pack, tool) {
  const result = Object.values(pack.sensors).flatMap((sensor) => sensor.variants).filter((candidate) => (candidate.requirements ?? policy).tool === tool);
  assert.equal(result.length, 1, `expected exactly one ${tool} variant in ${pack.name}`);
  return result[0];
}

function assertPinFitsVariant(pack, toolPin, runtimePins) {
  const candidate = variant(pack, toolPin.package);
  const requirements = candidate.requirements ?? policy;
  assert.ok(satisfies(toolPin.version, requirements.toolRange), `${pack.name} ${toolPin.package} pin must satisfy toolRange`);
  assert.ok(satisfies(toolPin.version, candidate.certifiedRange), `${pack.name} ${toolPin.package} pin must satisfy certifiedRange`);
  for (const runtimePin of runtimePins) assert.ok(satisfies(runtimePin.version, requirements.runtimeRange), `${pack.name} ${toolPin.package} runtime pin ${runtimePin.version} must satisfy runtimeRange`);
}

for (const [name, pack] of [['python', python], ['shell', shell], ['generic', generic]]) assert.equal(pack.schemaVersion, 2, `${name} must use v2`);
for (const [name, pack] of [['python', python], ['shell', shell], ['generic', generic]]) {
  assert.doesNotThrow(() => validatePackV2(pack, path.join(root, 'sensor-packs', name)), `${name} policy-backed production pack must satisfy the v2 contract`);
}
for (const sensor of ['typecheck', 'lint', 'test', 'security']) assert.ok(python.sensors[sensor].variants.length > 0, `${sensor} without variants`);
assert.ok(python.sensors.typecheck.variants.some((variant) => variant.requirements.configFiles.includes('pyproject.toml')));
const command = shell.sensors.lint.variants[0].command;
for (const sensor of ['lint', 'security']) {
  assert.deepEqual(shell.sensors[sensor].applicability, { kind: 'explicit-or-supported-language' },
    `${sensor} applies when the shell pack is explicit or supported, not through literal glob paths`);
}
assert.deepEqual(command.args.slice(-1), ['{files}']);
assert.doesNotMatch(JSON.stringify(command), /\bfind\b|\bexec\b|sh -c/);
assert.deepEqual(Object.keys(generic.sensors), ['security']);
assert.equal(generic.sensors.security.applicability.kind, 'explicit-or-supported-language');
for (const pack of [python, shell, generic]) {
  const variant = pack.sensors.security.variants[0];
  assert.equal(variant.policyRef, 'shared/semgrep-policy.json', 'pack references the shared Semgrep policy');
  assert.ok(!Object.hasOwn(variant, 'requirements') && !Object.hasOwn(variant, 'probe'), 'policy-backed Semgrep variants cannot shadow shared policy fields');
  assert.ok(variant.assets.includes('.semgrep.awm.yml'));
  assert.ok(variant.command.args.includes('.semgrep.awm.yml'));
}
const pythonRuntimes = [pins['python-3-9'], pins['python-current']];
for (const tool of ['mypy', 'ruff', 'pytest']) assertPinFitsVariant(python, pins[tool], pythonRuntimes);
for (const pack of [python, shell, generic]) assertPinFitsVariant(pack, pins.semgrep, pythonRuntimes);
assertPinFitsVariant(shell, pins.shellcheck, [pins.shellcheck]);

const reintroducedFind = structuredClone(shell);
reintroducedFind.sensors.lint.variants[0].command.args = ['find', '{files}'];
assert.throws(
  () => validatePackV2(reintroducedFind, path.join(root, 'sensor-packs', 'shell')),
  /command.*find|find.*command/i,
  'a schema-shaped shell command cannot reintroduce find traversal',
);

const temporarySensorPacks = fs.mkdtempSync(path.join(os.tmpdir(), 'awm-generic-policy-'));
try {
  fs.cpSync(path.join(root, 'sensor-packs', 'generic'), path.join(temporarySensorPacks, 'generic'), { recursive: true });
  fs.cpSync(path.join(root, 'sensor-packs', 'shared'), path.join(temporarySensorPacks, 'shared'), { recursive: true });
  for (const tool of [undefined, '', '   ']) {
    const dishonestPolicy = structuredClone(policy);
    if (tool === undefined) delete dishonestPolicy.tool;
    else dishonestPolicy.tool = tool;
    fs.writeFileSync(path.join(temporarySensorPacks, 'shared', 'semgrep-policy.json'), JSON.stringify(dishonestPolicy));
    assert.throws(
      () => validatePackV2(generic, path.join(temporarySensorPacks, 'generic')),
      /tool required/i,
      'generic packs must reject missing tool requirements through the policy parser',
    );
  }
} finally {
  fs.rmSync(temporarySensorPacks, { recursive: true, force: true });
}
console.log('sensor-pack-python-shell-generic: capability contracts OK');
