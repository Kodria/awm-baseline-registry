import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { classifyCertification } from '../scripts/render-sensor-support-matrix.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const pins = JSON.parse(read('tests/fixtures/certification-pins.json'));

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

function assertReusableCertification(workflow) {
  const triggers = block(workflow, 0, 'on');
  assert.match(triggers, /^ {2}workflow_call:\s*(?:#.*)?$/m, 'certification must be a reusable workflow trigger');
  const jobs = block(workflow, 0, 'jobs');
  assert.deepEqual(childJobNames(jobs), ['certify'], 'certification must expose one scoped certify job');
  const certify = block(jobs, 2, 'certify');
  const strategy = block(certify, 4, 'strategy');
  const matrix = block(strategy, 6, 'matrix');
  assert.match(matrix, /^ {8}os: \[ubuntu-latest, macos-latest, windows-latest\]$/m,
    'certification must execute its single job on exactly the three supported OSes');
  for (const command of [
    'node tests/sensor-pack-python-shell-generic.test.mjs',
    'node tests/sensor-pack-certification.test.mjs',
    'node scripts/render-sensor-support-matrix.mjs --check',
    'node tests/sensor-pack-support-matrix.test.mjs',
  ]) assert.match(certify, new RegExp(command.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${command} must run in certify`);
  assert.match(certify, /semgrep==1\.173\.0/, 'Ubuntu certification must exercise the pinned real security tool');
  assert.match(certify, /shellcheck/, 'Ubuntu certification must exercise the pinned real shell tool');
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
