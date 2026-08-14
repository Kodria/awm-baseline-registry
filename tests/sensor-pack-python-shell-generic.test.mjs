import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (name) => JSON.parse(fs.readFileSync(path.join(root, 'sensor-packs', name, 'pack.json'), 'utf8'));
const python = read('python'); const shell = read('shell'); const generic = read('generic');

for (const [name, pack] of [['python', python], ['shell', shell], ['generic', generic]]) assert.equal(pack.schemaVersion, 2, `${name} must use v2`);
for (const sensor of ['typecheck', 'lint', 'test', 'security']) assert.ok(python.sensors[sensor].variants.length > 0, `${sensor} without variants`);
assert.ok(python.sensors.typecheck.variants.some((variant) => variant.requirements.configFiles.includes('pyproject.toml')));
const command = shell.sensors.lint.variants[0].command;
assert.deepEqual(command.args.slice(-1), ['{files}']);
assert.doesNotMatch(JSON.stringify(command), /\bfind\b|\bexec\b|sh -c/);
assert.deepEqual(Object.keys(generic.sensors), ['security']);
assert.equal(generic.sensors.security.applicability.kind, 'explicit-or-supported-language');
console.log('sensor-pack-python-shell-generic: capability contracts OK');
