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

assert.equal(commandForPlatform('npm', 'linux'), 'npm', 'POSIX must invoke npm without a command extension');
assert.equal(commandForPlatform('npm', 'win32'), 'npm.cmd', 'Windows must invoke npm through its command shim');
assert.equal(commandForPlatform('eslint', 'win32'), 'eslint.cmd', 'Windows must invoke local ESLint through its command shim');
assert.deepEqual(spawnOptionsForPlatform('linux'), { shell: false }, 'POSIX must spawn executables directly');
assert.deepEqual(spawnOptionsForPlatform('win32'), { shell: true }, 'Windows command shims must run through cmd.exe');

function commandForPlatform(command, platform = process.platform) {
  return platform === 'win32' ? `${command}.cmd` : command;
}

function spawnOptionsForPlatform(platform = process.platform) {
  return { shell: platform === 'win32' };
}

function run(bin, args, cwd, environment = {}, platform = process.platform) {
  return spawnSync(bin, args, {
    cwd,
    encoding: 'utf8',
    timeout: 120_000,
    maxBuffer: 4 * 1024 * 1024,
    env: { ...process.env, ...environment },
    ...spawnOptionsForPlatform(platform),
  });
}

function fixture(pinName, config, broken = false, cjsSource = cjs) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'awm-eslint-certification-'));
  workspaces.push(dir);
  fs.cpSync(path.join(root, 'tests/fixtures/eslint-certification', pinName), dir, { recursive: true });
  if (config === 'eslintrc' && !fs.existsSync(path.join(dir, '.eslintrc.js'))) {
    fs.writeFileSync(path.join(dir, '.eslintrc.js'), 'module.exports = { env: { node: true } };');
  }
  fs.writeFileSync(path.join(dir, 'sample.js'), 'function run() { return 1; }\nrun();\n');
  fs.writeFileSync(path.join(dir, 'eslint.config.awm.mjs'), mjs);
  fs.writeFileSync(path.join(dir, 'eslint.config.awm.cjs'), cjsSource);
  if (config === 'eslintrc' && broken) fs.writeFileSync(path.join(dir, '.eslintrc.js'), 'module.exports = {');
  if (broken) fs.writeFileSync(path.join(dir, 'eslint.config.js'), 'throw new Error("broken native config");');
  const install = run(commandForPlatform('npm'), ['ci', '--ignore-scripts'], dir);
  assert.equal(install.status, 0, `npm ci ${pinName}: ${install.stderr}`);
  return dir;
}

function eslint8OverlayReport(cjsSource = cjs) {
  const dir = fixture('eslint-8', 'eslintrc', false, cjsSource);
  const eslintBin = path.join(dir, 'node_modules/.bin', commandForPlatform('eslint'));
  const tscBin = path.join(dir, 'node_modules/.bin', commandForPlatform('tsc'));
  const typecheck = run(tscBin, ['--noEmit'], dir);
  assert.equal(typecheck.status, 0, `the TypeScript fixture must be valid: ${typecheck.stderr || typecheck.stdout}`);
  const result = run(eslintBin, ['.', '--config', 'eslint.config.awm.cjs', '--format', 'json'], dir, {
    ESLINT_USE_FLAT_CONFIG: 'false',
  });
  assert.ok(result.status === 0 || result.status === 1, `unexpected eslint exit ${result.status}: ${result.stderr}`);
  return JSON.parse(result.stdout);
}

{
  const report = eslint8OverlayReport();
  assert.equal(
    report.some((entry) => entry.filePath.endsWith('clean.ts') && entry.messages.some((message) => ['no-undef', 'no-unused-vars'].includes(message.ruleId))),
    false,
    'the overlay must preserve the project TypeScript rule configuration',
  );
  assert.equal(
    report.some((entry) => /[\\/]dist[\\/]/.test(entry.filePath)),
    false,
    'the overlay must ignore generated output',
  );
  assert.equal(
    report.some((entry) => entry.filePath.endsWith(path.join('scripts', 'unused.js')) && entry.messages.some((message) => message.ruleId === 'no-unused-vars')),
    true,
    'the overlay must retain base unused-variable detection for JavaScript',
  );
}

{
  const globalTypescriptRules = cjs.replace(
    "rules: {\n    'no-unreachable': 'error',",
    "rules: {\n    'no-unused-vars': ['error', { vars: 'all', args: 'after-used' }],\n    'no-undef': 'error',\n    'no-unreachable': 'error',",
  );
  const report = eslint8OverlayReport(globalTypescriptRules);
  assert.equal(
    report.some((entry) => entry.filePath.endsWith('clean.ts') && entry.messages.some((message) => ['no-undef', 'no-unused-vars'].includes(message.ruleId))),
    true,
    'mutation: globally re-enabling base rules must make the TypeScript certification fail',
  );
}

{
  const withoutOutputIgnores = cjs.replace("  ignorePatterns: ['dist/', 'build/', 'coverage/'],\n", '');
  const report = eslint8OverlayReport(withoutOutputIgnores);
  assert.equal(
    report.some((entry) => /[\\/]dist[\\/]/.test(entry.filePath)),
    true,
    'mutation: removing generated-output ignores must make the certification fail',
  );
}

for (const [id, pinName, config, environment] of [
  ['eslint-8-eslintrc', 'eslint-8', 'eslintrc', { ESLINT_USE_FLAT_CONFIG: 'false' }],
  ['eslint-8-flat', 'eslint-8', 'flat', { ESLINT_USE_FLAT_CONFIG: 'true' }],
  ['eslint-9-flat', 'eslint-9', 'flat', {}],
  ['eslint-10-flat', 'eslint-10', 'flat', {}],
]) {
  const variant = pack.sensors.lint.variants.find((candidate) => candidate.id === id);
  assert.ok(variant, `${id} missing from manifest`);
  assert.deepEqual(variant.command.environment ?? {}, environment, `${id} must declare the ESLint mode used by its command`);
  const dir = fixture(pinName, config);
  const result = run(path.join(dir, 'node_modules/.bin', commandForPlatform('eslint')), ['sample.js', ...variant.command.args.slice(1), '--no-ignore'], dir, environment);
  assert.equal(result.status, 0, `${id} failed: ${result.stderr || result.stdout}`);
}

{
  const dir = fixture('eslint-9', 'flat', true);
  const result = run(path.join(dir, 'node_modules/.bin', commandForPlatform('eslint')), ['sample.js', '--config', 'eslint.config.awm.mjs', '--no-ignore'], dir);
  assert.notEqual(result.status, 0, 'a broken native flat config must fail');
}

for (const dir of workspaces) fs.rmSync(dir, { recursive: true, force: true });
console.log('sensor-pack-eslint: pinned ESLint 8/9/10 native config matrix OK');
