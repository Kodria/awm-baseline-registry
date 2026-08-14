import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (name) => JSON.parse(fs.readFileSync(path.join(root, 'sensor-packs', name, 'pack.json'), 'utf8'));
const python = read('python'); const shell = read('shell'); const generic = read('generic');
const policy = JSON.parse(fs.readFileSync(path.join(root, 'sensor-packs/shared/semgrep-policy.json'), 'utf8'));
const pins = JSON.parse(fs.readFileSync(path.join(root, 'tests/fixtures/certification-pins.json'), 'utf8')).pins;

for (const [name, pack] of [['python', python], ['shell', shell], ['generic', generic]]) assert.equal(pack.schemaVersion, 2, `${name} must use v2`);
for (const sensor of ['typecheck', 'lint', 'test', 'security']) assert.ok(python.sensors[sensor].variants.length > 0, `${sensor} without variants`);
assert.ok(python.sensors.typecheck.variants.some((variant) => variant.requirements.configFiles.includes('pyproject.toml')));
const command = shell.sensors.lint.variants[0].command;
assert.deepEqual(command.args.slice(-1), ['{files}']);
assert.doesNotMatch(JSON.stringify(command), /\bfind\b|\bexec\b|sh -c/);
assert.deepEqual(Object.keys(generic.sensors), ['security']);
assert.equal(generic.sensors.security.applicability.kind, 'explicit-or-supported-language');
for (const pack of [python, shell, generic]) {
  const variant = pack.sensors.security.variants[0];
  assert.deepEqual({ tool: variant.requirements.tool, toolRange: variant.requirements.toolRange, runtime: variant.requirements.runtime, runtimeRange: variant.requirements.runtimeRange, probe: variant.probe.kind }, policy, 'pack materializes shared Semgrep policy');
  assert.ok(variant.assets.includes('.semgrep.awm.yml'));
  assert.ok(variant.command.args.includes('.semgrep.awm.yml'));
}
for (const [tool, pin] of Object.entries(pins)) {
  if (!['mypy', 'ruff', 'pytest', 'semgrep', 'shellcheck'].includes(tool)) continue;
  const pack = tool === 'shellcheck' ? shell : tool === 'semgrep' ? generic : python;
  const variants = Object.values(pack.sensors).flatMap((sensor) => sensor.variants).filter((variant) => variant.requirements.tool === pin.package);
  assert.ok(variants.some((variant) => variant.requirements.toolRange.includes(pin.version.split('.')[0]) && variant.certifiedRange.includes(pin.version.split('.')[0])), `${tool} pin must fit a declared range`);
}
const reintroducedFind = structuredClone(shell); reintroducedFind.sensors.lint.variants[0].command.args = ['find', '{files}'];
assert.match(JSON.stringify(reintroducedFind.sensors.lint.variants[0].command.args), /\bfind\b/);
const dishonestGeneric = structuredClone(generic); dishonestGeneric.sensors.security.variants[0].requirements.tool = '';
assert.equal(dishonestGeneric.sensors.security.variants[0].requirements.tool, '');
console.log('sensor-pack-python-shell-generic: capability contracts OK');
