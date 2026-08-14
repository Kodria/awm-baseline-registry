import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderSensorSupport } from '../scripts/render-sensor-support-matrix.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packNames = ['generic', 'js-ts', 'python', 'shell'];
const packs = packNames.map((name) => JSON.parse(fs.readFileSync(path.join(root, 'sensor-packs', name, 'pack.json'), 'utf8')));
const pins = JSON.parse(fs.readFileSync(path.join(root, 'tests/fixtures/certification-pins.json'), 'utf8'));
const support = fs.readFileSync(path.join(root, 'sensor-packs/SUPPORT.md'), 'utf8');

assert.match(support, /<!-- BEGIN GENERATED: sensor-pack-support -->/);
assert.match(support, /<!-- END GENERATED: sensor-pack-support -->/);
assert.equal(support, renderSensorSupport(packs, pins), 'SUPPORT.md must be byte-for-byte renderer output');
assert.match(support, /\| Pack \| Sensor \| Variant \| Tool \| Certified range \| Supported OS \| OS certification evidence \| Status \| Evidence \|/);
assert.match(support, /\| `generic` \| `security` \| `semgrep-generic` \| `semgrep` \| `>=1\.0\.0` \| Ubuntu, macOS, Windows \| Ubuntu: real tool; macOS\/Windows: contract \| certified \|/,
  'SUPPORT.md must not imply Semgrep ran as a real tool outside Ubuntu');
assert.match(support, /\| `shell` \| `lint` \| `shellcheck-files` \| `shellcheck` \| `>=0\.9\.0` \| Ubuntu, macOS, Windows \| Ubuntu: real tool; macOS\/Windows: contract \| certified \|/,
  'SUPPORT.md must not imply ShellCheck ran as a real tool outside Ubuntu');
assert.match(support, /\| `python` \| `lint` \| `ruff-native` \| `ruff` \| `>=0\.1\.0` \| Ubuntu, macOS, Windows \| Ubuntu: 3\.9 \+ 3\.12 real; macOS\/Windows: 3\.12 smoke \| certified \|/,
  'SUPPORT.md must distinguish Python minimum certification from current cross-platform smoke');
assert.match(support, /\| Certification status \| Derived variant count \| Meaning \|/, 'SUPPORT.md must contain a derived certification-status summary');
for (const status of ['certified', 'compatible-unverified', 'not-applicable']) {
  assert.match(support, new RegExp(`\\| ${status} \\| \\d+ \\|`), `SUPPORT.md must derive a status row for ${status}`);
}
for (const required of ['eslint', 'semgrep', '>=8.57.0 <9.0.0', 'Ubuntu, macOS, Windows', pins.resolvedAt, 'eslint@8.57.1']) assert.match(support, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
assert.equal((support.match(/BEGIN GENERATED: sensor-pack-support/g) ?? []).length, 1, 'must have one generated support section');
assert.equal((support.match(/END GENERATED: sensor-pack-support/g) ?? []).length, 1, 'must have one generated support section');
assert.throws(() => renderSensorSupport([], pins), /packs.*non-empty/i);
assert.throws(() => renderSensorSupport(packs, { pins: {} }), /resolvedAt/i);

const noToolContract = {
  name: 'fixture',
  sensors: { advisory: { variants: [{ id: 'no-tool-contract', certifiedRange: '>=1.0.0' }] } },
};
assert.match(renderSensorSupport([noToolContract], pins), /\| `fixture` \| `advisory` \| `no-tool-contract` \| `—` \| `>=1\.0\.0` \| Ubuntu, macOS, Windows \| Ubuntu\/macOS\/Windows: contract \| not-applicable \| no matching pinned tool \|/);

console.log('sensor-pack-support-matrix: generated support is fresh and complete');
