import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const shapeGate = fs.readFileSync(path.join(root, 'tests/sensor-pack-shape.test.mjs'), 'utf8');
assert.match(shapeGate, /import '\.\/sensor-pack-js-ts-variants\.test\.mjs';/, 'shape gate must execute the js-ts v2 variant contract');
const pack = JSON.parse(fs.readFileSync(path.join(root, 'sensor-packs/js-ts/pack.json'), 'utf8'));

assert.equal(pack.schemaVersion, 2, 'js-ts is the first v2 pack');
assert.deepEqual(
  Object.fromEntries(Object.entries(pack.sensors).map(([name, sensor]) => [name, sensor.timeout])),
  { lint: 30_000, typecheck: 120_000, security: 120_000, depcheck: 120_000, format: 30_000, test: 600_000, mutation: 600_000 },
  'every js-ts sensor must declare a finite cost-appropriate timeout',
);
assert.deepEqual(pack.sensors.lint.variants.map((variant) => variant.id).sort(), ['eslint-8-eslintrc', 'eslint-8-flat', 'eslint-9-flat', 'eslint-10-flat'].sort());
assert.deepEqual(
  pack.sensors.lint.variants.find((variant) => variant.id === 'eslint-8-eslintrc').requirements.configFiles,
  ['.eslintrc', '.eslintrc.json', '.eslintrc.js', '.eslintrc.cjs', '.eslintrc.yml', '.eslintrc.yaml'],
  'ESLint 8 eslintrc must declare its native config evidence',
);
assert.deepEqual(
  pack.sensors.lint.variants.find((variant) => variant.id === 'eslint-8-eslintrc').requirements.packageJsonFields,
  ['eslintConfig'],
  'ESLint 8 eslintrc must declare package.json eslintConfig evidence',
);
assert.deepEqual(
  pack.sensors.lint.variants.find((variant) => variant.id === 'eslint-8-flat').requirements.configFiles,
  ['eslint.config.js', 'eslint.config.mjs', 'eslint.config.cjs', 'eslint.config.ts', 'eslint.config.mts', 'eslint.config.cts'],
  'ESLint 8 flat must declare its native config evidence',
);

const typecheck = pack.sensors.typecheck;
assert.deepEqual(typecheck.applicability.anyFiles, ['tsconfig.json', 'tsconfig.*.json']);
assert.ok(typecheck.variants.every((variant) => !variant.assets.includes('tsconfig.awm.json')));
assert.deepEqual(pack.hardening['typescript-strict'].assets, ['tsconfig.awm.json']);

for (const sensor of Object.values(pack.sensors)) for (const variant of sensor.variants) {
  assert.equal(typeof variant.command.executable, 'string');
  assert.ok(!['npx', 'pnpx'].includes(variant.command.executable.toLowerCase()));
  assert.ok(Array.isArray(variant.command.args));
}
for (const sensorName of ['lint', 'security']) {
  for (const variant of pack.sensors[sensorName].variants) {
    assert.ok(variant.changedCommand, `${sensorName}.${variant.id} must opt into safe changed-file execution`);
    assert.equal(variant.changedCommand.args.filter((arg) => arg === '{files}').length, 1);
    assert.deepEqual(variant.changedCommand.fileInput.extensions, ['.js', '.jsx', '.ts', '.tsx']);
  }
}
for (const sensorName of ['typecheck', 'depcheck', 'format', 'test', 'mutation']) {
  assert.ok(pack.sensors[sensorName].variants.every((variant) => !variant.changedCommand), `${sensorName} must remain whole-project in changed scope`);
}
assert.deepEqual(pack.sensors.test.variants.map((variant) => variant.id).sort(), ['bun-script', 'npm-script', 'pnpm-script', 'yarn-script']);

for (const [id, executable] of [['npm-script', 'npm'], ['pnpm-script', 'pnpm'], ['yarn-script', 'yarn'], ['bun-script', 'bun']]) {
  const variant = pack.sensors.test.variants.find((candidate) => candidate.id === id);
  assert.equal(variant.command.executable, executable);
  assert.equal(variant.command.packageManager, executable);
}

console.log('sensor-pack-js-ts-variants: v2 variants, native TypeScript, and local script argv OK');
