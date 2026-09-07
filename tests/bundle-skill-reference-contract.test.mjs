import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('..', import.meta.url);
const readJson = relative => JSON.parse(readFileSync(new URL(relative, root), 'utf8'));
const read = relative => readFileSync(new URL(relative, root), 'utf8');
const CONTRACT_COMMAND = 'node --test tests/bundle-skill-reference-contract.test.mjs';

const expected = [
  'using-awm', 'development-process', 'brainstorming', 'writing-plans', 'executing-plans',
  'subagent-driven-development', 'test-driven-development', 'requesting-code-review',
  'receiving-code-review', 'post-implementation-qa', 'post-implementation-docs',
  'finishing-a-development-branch', 'verification-before-completion', 'systematic-debugging',
  'dispatching-parallel-agents', 'using-git-worktrees', 'project-context-init',
  'project-constitution', 'setup-sensors', 'harness-retro', 'architecture-advisor',
  'nfr-checklist-generator', 'technology-evaluator', 'mermaid-diagrams',
];

function assertNoOnSignal(value, manifestPath) {
  if (Array.isArray(value)) {
    value.forEach(item => assertNoOnSignal(item, manifestPath));
    return;
  }
  if (value && typeof value === 'object') {
    assert.equal(
      Object.hasOwn(value, 'onSignal'),
      false,
      `${manifestPath} must not declare an onSignal property`,
    );
    Object.values(value).forEach(item => assertNoOnSignal(item, manifestPath));
  }
}

test('dev bundle uses the canonical ordered 24-string skill membership at 3.9.4', () => {
  const bundle = readJson('bundles/dev/bundle.json');
  const catalog = readJson('catalog.json');
  const catalogDev = catalog.bundles.find(entry => entry.name === 'dev');

  assert.equal(bundle.version, '3.9.4');
  assert.equal(catalogDev?.version, '3.9.4');
  assert.ok(bundle.skills.every(skill => typeof skill === 'string' && skill.length > 0),
    'every dev skill entry must be a non-empty string');
  assert.deepEqual(bundle.skills, expected);
});

test('active bundle manifests contain no onSignal metadata at any depth', () => {
  const catalog = readJson('catalog.json');

  for (const { name, source } of catalog.bundles) {
    assert.equal(typeof name, 'string');
    assert.equal(typeof source, 'string');
    assertNoOnSignal(readJson(`${source.replace(/^\.\//, '')}/bundle.json`), `${source}/bundle.json`);
  }
});

function assertReleaseGateRunsBundleContract(workflow, workflowName) {
  const command = workflow.indexOf(CONTRACT_COMMAND);
  const portability = workflow.indexOf('node scripts/validate-portability.mjs');
  assert.ok(command > portability,
    `${workflowName} must run the bundle-reference contract after portability validation`);

  if (workflowName === 'auto-tag.yml') {
    const tag = workflow.indexOf('- name: Compute and push next tag');
    assert.ok(tag > command, 'auto-tag must run the bundle-reference contract before creating a delivery tag');
  }
}

test('validation and release gates execute the bundle-reference contract', () => {
  for (const workflow of ['validate.yml', 'auto-tag.yml']) {
    assertReleaseGateRunsBundleContract(read(`.github/workflows/${workflow}`), workflow);
  }
});

test('RED mutation: removing bundle-reference release evidence blocks the gate contract', () => {
  const autoTag = read('.github/workflows/auto-tag.yml');
  assert.throws(
    () => assertReleaseGateRunsBundleContract(autoTag.replace(`          ${CONTRACT_COMMAND}\n`, ''), 'auto-tag.yml'),
    /must run the bundle-reference contract/,
  );
});
