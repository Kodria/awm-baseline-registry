import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pins = JSON.parse(fs.readFileSync(path.join(root, 'tests/fixtures/certification-pins.json'), 'utf8')).pins;
const pack = JSON.parse(fs.readFileSync(path.join(root, 'sensor-packs/js-ts/pack.json'), 'utf8'));
const mjs = fs.readFileSync(path.join(root, 'sensor-packs/js-ts/eslint.config.awm.mjs'), 'utf8');
const cjs = fs.readFileSync(path.join(root, 'sensor-packs/js-ts/eslint.config.awm.cjs'), 'utf8');
const workspaces = [];

function run(bin, args, cwd, environment = {}) {
  return spawnSync(bin, args, { cwd, encoding: 'utf8', timeout: 120_000, maxBuffer: 4 * 1024 * 1024, env: { ...process.env, ...environment } });
}

function fixture(pin, config, broken = false) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'awm-eslint-certification-'));
  workspaces.push(dir);
  fs.writeFileSync(path.join(dir, 'package.json'), config === 'eslintrc' ? '{}\n' : '{"type":"module"}\n');
  fs.writeFileSync(path.join(dir, 'sample.js'), 'function run() { return 1; }\nrun();\n');
  fs.writeFileSync(path.join(dir, 'eslint.config.awm.mjs'), mjs);
  fs.writeFileSync(path.join(dir, 'eslint.config.awm.cjs'), cjs);
  if (config === 'eslintrc') fs.writeFileSync(path.join(dir, '.eslintrc.js'), broken ? 'module.exports = {' : 'module.exports = { env: { node: true } };');
  if (broken) fs.writeFileSync(path.join(dir, 'eslint.config.js'), 'throw new Error("broken native config");');
  const install = run('npm', ['install', '--prefix', dir, '--no-save', '--no-package-lock', `eslint@${pin.version}`], dir);
  assert.equal(install.status, 0, `install ${pin.version}: ${install.stderr}`);
  return dir;
}

for (const [id, pinName, config, environment] of [
  ['eslint-8-eslintrc', 'eslint-8', 'eslintrc', { ESLINT_USE_FLAT_CONFIG: 'false' }],
  ['eslint-8-flat', 'eslint-8', 'flat', { ESLINT_USE_FLAT_CONFIG: 'true' }],
  ['eslint-9-flat', 'eslint-9', 'flat', {}],
  ['eslint-10-flat', 'eslint-10', 'flat', {}],
]) {
  const variant = pack.sensors.lint.variants.find((candidate) => candidate.id === id);
  assert.ok(variant, `${id} missing from manifest`);
  const dir = fixture(pins[pinName], config);
  const result = run(path.join(dir, 'node_modules/.bin/eslint'), ['sample.js', ...variant.command.args.slice(1), '--no-ignore'], dir, environment);
  assert.equal(result.status, 0, `${id} failed: ${result.stderr || result.stdout}`);
}

{
  const dir = fixture(pins['eslint-9'], 'flat', true);
  const result = run(path.join(dir, 'node_modules/.bin/eslint'), ['sample.js', '--config', 'eslint.config.awm.mjs', '--no-ignore'], dir);
  assert.notEqual(result.status, 0, 'a broken native flat config must fail');
}

for (const dir of workspaces) fs.rmSync(dir, { recursive: true, force: true });
console.log('sensor-pack-eslint: pinned ESLint 8/9/10 native config matrix OK');
