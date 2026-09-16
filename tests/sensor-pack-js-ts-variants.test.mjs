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
assert.equal(pack.sensors.format.applicability.kind, 'explicit-opt-in', 'format must not become a default gate without an explicit project opt-in');
assert.equal(pack.sensors.mutation.applicability.kind, 'explicit-opt-in', 'mutation must not become a default gate without an explicit project opt-in');
assert.notEqual(pack.sensors.test.applicability.kind, 'explicit-opt-in', 'test remains a mandatory project gate');
assert.notEqual(pack.sensors.security.applicability.kind, 'explicit-opt-in', 'security remains a mandatory project gate');
assert.equal(pack.sensors.security.variants[0].policyRef, 'shared/semgrep-policy.json',
  'Semgrep must inherit its verified registry-owned policy rather than duplicate security requirements');

// dependency-cruiser 17 dropped nothing this pack's command relies on (verified against
// the real 17.4.3 CLI: same --config/args argv, same exit-code and violation-detection
// behavior), so both majors share one command shape — only the version boundary differs.
assert.deepEqual(pack.sensors.depcheck.variants.map((variant) => variant.id).sort(), ['dependency-cruiser', 'dependency-cruiser-17']);
for (const [id, toolRange] of [['dependency-cruiser', '>=16.0.0 <17.0.0'], ['dependency-cruiser-17', '>=17.0.0 <18.0.0']]) {
  const variant = pack.sensors.depcheck.variants.find((candidate) => candidate.id === id);
  assert.equal(variant.requirements.toolRange, toolRange, `${id} must stay bounded to its own major`);
  assert.deepEqual(variant.command.args, ['--config', '.dep-cruiser.awm.js', 'src'], `${id} must keep the shared command argv`);
}

for (const [id, executable] of [['npm-script', 'npm'], ['pnpm-script', 'pnpm'], ['yarn-script', 'yarn'], ['bun-script', 'bun']]) {
  const variant = pack.sensors.test.variants.find((candidate) => candidate.id === id);
  assert.equal(variant.command.executable, executable);
  assert.equal(variant.command.packageManager, executable);
  assert.deepEqual(variant.probe, { kind: 'package-script-present', script: 'test' }, `${id} must require the project test script`);
}
const npm = pack.sensors.test.variants.find((variant) => variant.id === 'npm-script');
assert.equal(npm.certifiedRange, '=10.8.3', 'npm certification must name the exact manager version exercised in CI');
assert.deepEqual(npm.command.args, ['test'], 'npm must invoke the project test script without appending runner-specific flags');

console.log('sensor-pack-js-ts-variants: v2 variants, native TypeScript, and local script argv OK');
