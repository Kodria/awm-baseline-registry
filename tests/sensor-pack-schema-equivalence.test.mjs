// Execute the author-facing JSON Schema, then compare its verdict to the
// fail-closed validator on boundary inputs.  Ajv is intentionally not a
// registry dependency: this focused Draft 2020-12 subset exercises every
// keyword used by pack.schema.json.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validatePackV2 } from './support/sensor-pack-v2-validator.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixtureRoot = path.join(root, 'tests/fixtures/sensor-packs/valid/js-ts');
const schema = JSON.parse(fs.readFileSync(path.join(root, 'sensor-packs/pack.schema.json'), 'utf8'));
const base = JSON.parse(fs.readFileSync(path.join(fixtureRoot, 'pack.json'), 'utf8'));

function valid(value, definition) {
  if (definition.$ref) return valid(value, schema.$defs[definition.$ref.slice('#/$defs/'.length)]);
  if (definition.const !== undefined && value !== definition.const) return false;
  if (definition.enum && !definition.enum.includes(value)) return false;
  if (definition.type) {
    const types = { object: value && typeof value === 'object' && !Array.isArray(value), array: Array.isArray(value), string: typeof value === 'string', integer: Number.isInteger(value), boolean: typeof value === 'boolean' };
    if (!types[definition.type]) return false;
  }
  if (definition.pattern && (typeof value !== 'string' || !(new RegExp(definition.pattern).test(value)))) return false;
  if (definition.minLength && value.length < definition.minLength) return false;
  if (definition.minItems && value.length < definition.minItems) return false;
  if (definition.uniqueItems && new Set(value.map((item) => JSON.stringify(item))).size !== value.length) return false;
  if (definition.minProperties && Object.keys(value).length < definition.minProperties) return false;
  if (definition.required && !definition.required.every((key) => Object.hasOwn(value, key))) return false;
  if (definition.propertyNames && !Object.keys(value).every((key) => valid(key, definition.propertyNames))) return false;
  if (definition.properties) for (const [key, child] of Object.entries(definition.properties)) if (Object.hasOwn(value, key) && !valid(value[key], child)) return false;
  if (definition.additionalProperties === false && !Object.keys(value).every((key) => Object.hasOwn(definition.properties ?? {}, key))) return false;
  if (definition.additionalProperties && typeof definition.additionalProperties === 'object') {
    for (const key of Object.keys(value)) if (!Object.hasOwn(definition.properties ?? {}, key) && !valid(value[key], definition.additionalProperties)) return false;
  }
  if (definition.items && !value.every((item) => valid(item, definition.items))) return false;
  if (definition.allOf && !definition.allOf.every((child) => valid(value, child))) return false;
  if (definition.not && valid(value, definition.not)) return false;
  if (definition.if && valid(value, definition.if) && definition.then && !valid(value, definition.then)) return false;
  return true;
}

function clone() { return structuredClone(base); }
const native = clone();
native.sensors.lint.variants[0].assets = [];
native.sensors.lint.variants[0].command.args = ['.'];
const hardening = clone();
hardening.hardening = { 'strict-mode': { assets: ['eslint.config.awm.mjs'] } };
const badEnvironment = clone();
badEnvironment.sensors.lint.variants[0].command.environment = { NODE_OPTIONS: 'unsafe' };
const badManager = clone();
badManager.sensors.lint.variants[0].command = { executable: 'npm', resolution: 'path', args: ['run', 'lint'] };
const badCoverage = clone();
badCoverage.coverage.classes['lint-errors'] = { detectors: [{ sensor: 'lint' }] };
const shell = clone();
shell.sensors.lint.variants[0].command.executable = 'Bash.EXE';
const embeddedFiles = clone();
embeddedFiles.sensors.lint.variants[0].command.args = ['--files={files}'];

for (const [name, pack, expected] of [
  ['native', native, true], ['baseline', base, true], ['hardening', hardening, true],
  ['environment', badEnvironment, false], ['package manager', badManager, false], ['coverage', badCoverage, false],
  ['case-insensitive shell', shell, false], ['embedded files placeholder', embeddedFiles, false],
]) {
  assert.equal(valid(pack, schema), expected, `formal schema verdict for ${name}`);
  let failure;
  try { validatePackV2(pack, fixtureRoot); } catch (error) { failure = error; }
  assert.equal(!failure, expected, `validator verdict for ${name}`);
}

console.log('sensor-pack-schema-equivalence: formal schema and validator agree on v2 contract boundaries');
