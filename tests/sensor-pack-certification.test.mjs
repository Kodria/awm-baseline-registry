import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { classifyCertification } from '../scripts/render-sensor-support-matrix.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workflow = fs.readFileSync(path.join(root, '.github/workflows/sensor-pack-certification.yml'), 'utf8');
const validate = fs.readFileSync(path.join(root, '.github/workflows/validate.yml'), 'utf8');
const autoTag = fs.readFileSync(path.join(root, '.github/workflows/auto-tag.yml'), 'utf8');
const pins = JSON.parse(fs.readFileSync(path.join(root, 'tests/fixtures/certification-pins.json'), 'utf8'));

assert.match(workflow, /^name: Sensor pack certification/m);
assert.match(workflow, /workflow_call:/, 'certification must be reusable');
for (const runner of ['ubuntu-latest', 'macos-latest', 'windows-latest']) assert.match(workflow, new RegExp(runner));
for (const command of ['node tests/sensor-pack-python-shell-generic.test.mjs', 'node tests/sensor-pack-certification.test.mjs', 'node scripts/render-sensor-support-matrix.mjs --check', 'node tests/sensor-pack-support-matrix.test.mjs']) assert.match(workflow, new RegExp(command.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
assert.match(workflow, /semgrep==1\.173\.0/, 'Ubuntu certification must exercise the pinned real security tool');
assert.match(workflow, /shellcheck/, 'Ubuntu certification must exercise the pinned real shell tool');
assert.match(validate, /sensor-certification:\s*\n\s*uses: \.\/\.github\/workflows\/sensor-pack-certification\.yml/m, 'validate must call certification');
assert.match(autoTag, /sensor-certification:\s*\n\s*uses: \.\/\.github\/workflows\/sensor-pack-certification\.yml/m, 'auto-tag must call certification');
assert.match(autoTag, /tag:\s*\n\s*needs: sensor-certification/m, 'tag must wait for certification');

const future = { requirements: { tool: 'eslint', toolRange: '>=11.0.0 <12.0.0' }, certifiedRange: '>=11.0.0 <12.0.0' };
assert.equal(classifyCertification(future, pins.pins), 'compatible-unverified', 'a future compatible tool is never presented as certified');

console.log('sensor-pack-certification: reusable three-OS release gate contracts OK');
