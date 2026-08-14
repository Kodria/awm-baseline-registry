import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { classifyCertification } from '../scripts/render-sensor-support-matrix.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const pins = JSON.parse(read('tests/fixtures/certification-pins.json'));
const packs = ['generic', 'js-ts', 'python', 'shell'].map((name) => JSON.parse(read(`sensor-packs/${name}/pack.json`)));
const pythonFixtureConfig = read('tests/fixtures/python-certification/pyproject.toml');
const ruffExcludedFixture = read('tests/fixtures/python-certification/ruff_only_excluded.py');

function block(text, indent, key) {
  const lines = text.split(/\r?\n/);
  const opening = new RegExp(`^ {${indent}}${key}:\\s*(?:#.*)?$`);
  const start = lines.findIndex(line => opening.test(line));
  assert.notEqual(start, -1, `missing ${' '.repeat(indent)}${key}: YAML node`);
  const next = lines.slice(start + 1).findIndex(line => line.trim() && !line.startsWith(' '.repeat(indent + 1)));
  return lines.slice(start + 1, next === -1 ? undefined : start + 1 + next).join('\n');
}

function childJobNames(jobs) {
  return [...jobs.matchAll(/^ {2}([A-Za-z][\w-]*):\s*(?:#.*)?$/gm)].map(match => match[1]);
}

function namedStep(workflow, name) {
  const lines = workflow.split(/\r?\n/);
  const start = lines.findIndex((line) => line === `      - name: ${name}`);
  assert.notEqual(start, -1, `missing certification step '${name}'`);
  const endOffset = lines.slice(start + 1).findIndex((line) => /^      - (?:name:|uses:)/.test(line));
  return lines.slice(start, endOffset === -1 ? undefined : start + 1 + endOffset).join('\n');
}

function assertReusableCertification(workflow) {
  const triggers = block(workflow, 0, 'on');
  assert.match(triggers, /^ {2}workflow_call:\s*(?:#.*)?$/m, 'certification must be a reusable workflow trigger');
  const jobs = block(workflow, 0, 'jobs');
  assert.deepEqual(childJobNames(jobs), ['certify'], 'certification must expose one scoped certify job');
  const certify = block(jobs, 2, 'certify');
  for (const command of [
    'node tests/sensor-pack-python-shell-generic.test.mjs',
    'node tests/sensor-pack-certification.test.mjs',
    'node scripts/render-sensor-support-matrix.mjs --check',
    'node tests/sensor-pack-support-matrix.test.mjs',
  ]) assert.match(certify, new RegExp(command.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${command} must run in certify`);
  assert.match(certify, /semgrep==1\.173\.0/, 'Ubuntu certification must exercise the pinned real security tool');
  assert.match(certify, /shellcheck/, 'Ubuntu certification must exercise the pinned real shell tool');
}

function assertPythonToolchainCertification(workflow) {
  const certify = block(block(workflow, 0, 'jobs'), 2, 'certify');
  const strategy = block(certify, 4, 'strategy');
  const matrix = block(strategy, 6, 'matrix');
  assert.match(matrix, /^ {8}include:\s*$/m, 'certification matrix must explicitly distinguish Python toolchains');
  for (const entry of [
    '- os: ubuntu-latest\n            python: "3.9"\n            python-profile: minimum',
    '- os: ubuntu-latest\n            python: "3.12"\n            python-profile: current',
    '- os: macos-latest\n            python: "3.12"\n            python-profile: current',
    '- os: windows-latest\n            python: "3.12"\n            python-profile: current',
  ]) assert.match(matrix, new RegExp(entry), `certification matrix must include ${entry.replaceAll('\n', ' ')}`);
  assert.match(certify, /actions\/setup-python@v5/, 'certification must install the selected Python runtime');
  assert.match(certify, /python-version: \$\{\{ matrix\.python \}\}/, 'certification must bind setup-python to the selected matrix runtime');
  const toolchain = ['mypy', 'ruff', 'pytest'];
  const commands = [
    'python -m mypy tests/fixtures/python-certification',
    'python -m ruff check tests/fixtures/python-certification --output-format json',
    'python -m pytest tests/fixtures/python-certification',
  ];
  for (const [profile, stepName] of Object.entries({
    minimum: 'Exercise pinned Python minimum toolchain',
    current: 'Smoke-test pinned Python current toolchain',
  })) {
    const step = namedStep(workflow, stepName);
    for (const tool of toolchain.map((name) => `${name}==${pins.pins[name].version}`)) {
      assert.match(step, new RegExp(tool.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${profile} Python step must install pinned ${tool}`);
    }
    for (const command of commands) {
      assert.match(step, new RegExp(command.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${profile} Python step must exercise ${command}`);
    }
  }
  assert.match(certify, /if: matrix\.python-profile == 'minimum'/, 'minimum Python execution must be limited to Ubuntu');
  assert.match(certify, /if: matrix\.python-profile == 'current'/, 'current Python execution must smoke-test every supported OS');
  assert.deepEqual(
    Object.fromEntries(toolchain.map((name) => [name, pins.pins[name].version])),
    { mypy: '1.18.2', ruff: '0.16.3', pytest: '8.4.2' },
    'the frozen Python toolchain must support the certified Python 3.9 minimum runtime',
  );
}

function assertShellCheckCertification(workflow) {
  const step = namedStep(workflow, 'Exercise Ubuntu security and shell tooling');
  const version = pins.pins.shellcheck.version;
  assert.match(step, new RegExp(`SHELLCHECK_VERSION=${version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`), 'Ubuntu certification must declare the frozen ShellCheck version');
  assert.match(step, /SHELLCHECK_ARCHIVE="shellcheck-v\$\{SHELLCHECK_VERSION\}\.linux\.x86_64\.tar\.xz"/, 'Ubuntu certification must derive the frozen ShellCheck archive');
  assert.match(step, /https:\/\/github\.com\/koalaman\/shellcheck\/releases\/download\/v\$\{SHELLCHECK_VERSION\}\/\$\{SHELLCHECK_ARCHIVE\}/, 'Ubuntu certification must download the declared ShellCheck release');
  assert.match(step, /shellcheck --version \| grep -F/, 'Ubuntu certification must verify the installed ShellCheck version');
  assert.match(step, /version: \$\{SHELLCHECK_VERSION\}/, 'Ubuntu certification must verify ShellCheck against its frozen version variable');
  assert.match(step, /shellcheck \/tmp\/awm-shellcheck-certification\.sh/, 'Ubuntu certification must execute ShellCheck against a controlled shell fixture');
}

function assertReusableCall(workflow, workflowName) {
  const jobs = block(workflow, 0, 'jobs');
  const certification = block(jobs, 2, 'sensor-certification');
  assert.match(certification, /^ {4}uses: \.\/\.github\/workflows\/sensor-pack-certification\.yml$/m,
    `${workflowName} must call the reusable certification workflow from its sensor-certification job`);
}

function assertAutoTagNeedsCertification(workflow) {
  const jobs = block(workflow, 0, 'jobs');
  const tag = block(jobs, 2, 'tag');
  assert.match(tag, /^ {4}needs: sensor-certification$/m,
    'the release-producing tag job must directly need certification');
}

const workflow = read('.github/workflows/sensor-pack-certification.yml');
const validate = read('.github/workflows/validate.yml');
const autoTag = read('.github/workflows/auto-tag.yml');

test('certification is a reusable, scoped three-OS workflow', () => {
  assertReusableCertification(workflow);
});

test('certification exercises the pinned Python pack toolchain on its supported runtimes', () => {
  assertPythonToolchainCertification(workflow);
  assert.match(pythonFixtureConfig, /^\[tool\.ruff\]$/m, 'the Python certification fixture must exercise native Ruff configuration');
  assert.match(pythonFixtureConfig, /^exclude = \["ruff_only_excluded\.py"\]$/m, 'the native Ruff fixture must exclude its dedicated lint fixture');
  assert.match(ruffExcludedFixture, /^import os$/m, 'the dedicated Ruff fixture must fail F401 if native config is ignored');
});

test('certification installs, verifies, and executes the frozen ShellCheck release', () => {
  assertShellCheckCertification(workflow);
});

test('RED mutation: removing ShellCheck execution invalidates shell certification', () => {
  const step = namedStep(workflow, 'Exercise Ubuntu security and shell tooling');
  assert.throws(
    () => assertShellCheckCertification(workflow.replace(step, step.replace('shellcheck /tmp/awm-shellcheck-certification.sh', 'echo skipped'))),
    /execute ShellCheck/,
  );
});

test('RED mutation: removing pytest execution invalidates Python certification', () => {
  const current = namedStep(workflow, 'Smoke-test pinned Python current toolchain');
  assert.throws(
    () => assertPythonToolchainCertification(workflow.replace(current, current.replace('python -m pytest tests/fixtures/python-certification', 'echo skipped'))),
    /current Python step must exercise.*pytest/,
  );
});

test('validate and auto-tag invoke certification as reusable jobs', () => {
  assertReusableCall(validate, 'validate');
  assertReusableCall(autoTag, 'auto-tag');
});

test('auto-tag waits for certification before tag publication', () => {
  assertAutoTagNeedsCertification(autoTag);
});

test('RED mutation: removing the release job dependency is rejected', () => {
  assert.throws(() => assertAutoTagNeedsCertification(autoTag.replace('needs: sensor-certification', 'needs: portability')),
    /must directly need certification/);
});

test('a future compatible tool is never presented as certified', () => {
  const future = { requirements: { tool: 'eslint', toolRange: '>=11.0.0 <12.0.0' }, certifiedRange: '>=11.0.0 <12.0.0' };
  assert.equal(classifyCertification(future, pins.pins), 'compatible-unverified');
});

test('every certified production variant is limited to its frozen tool evidence', () => {
  for (const pack of packs) for (const sensor of Object.values(pack.sensors)) for (const variant of sensor.variants) {
    if (classifyCertification(variant, pins.pins) !== 'certified') continue;
    const tool = variant.requirements?.tool ?? 'semgrep';
    const matchingPins = Object.values(pins.pins).filter((pin) => pin.package === tool);
    const matchingPin = matchingPins.find((pin) => variant.certifiedRange === `=${pin.version}`);
    assert.ok(matchingPin, `${pack.name}/${variant.id} must certify only an exact frozen ${tool} version`);

    const future = structuredClone(variant);
    if (!future.requirements) future.requirements = { tool, toolRange: variant.certifiedRange };
    future.certifiedRange = '=999.0.0';
    future.requirements.toolRange = '>=0.0.0';
    assert.equal(classifyCertification(future, pins.pins), 'compatible-unverified', `${pack.name}/${variant.id} must not certify a future ${tool} version`);
  }
});
