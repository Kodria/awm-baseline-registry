import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('..', import.meta.url);
const readJson = relative => JSON.parse(readFileSync(new URL(relative, root), 'utf8'));
const read = relative => readFileSync(new URL(relative, root), 'utf8');
const CONTRACT_COMMAND = 'node --test tests/bundle-skill-reference-contract.test.mjs';
const VALIDATE_RUN_LINE = `      - run: ${CONTRACT_COMMAND}`;
const AUTO_TAG_RUN_LINE = `          ${CONTRACT_COMMAND}`;

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

test('dev bundle uses the canonical ordered 24-string skill membership at 4.2.0', () => {
  const bundle = readJson('bundles/dev/bundle.json');
  const catalog = readJson('catalog.json');
  const catalogDev = catalog.bundles.find(entry => entry.name === 'dev');

  assert.equal(bundle.version, '4.2.0');
  assert.equal(catalogDev?.version, '4.2.0');
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
  const isRelease = workflowName === 'auto-tag.yml';
  const scope = isRelease
    ? workflow.match(/- name: Verify registry before tagging[\s\S]*?(?=\n\s*- name: Compute and push next tag)/)?.[0]
    : workflow.match(/^  portability:\n[\s\S]*?(?=^  [\w-]+:|(?![\s\S]))/m)?.[0];
  const runLine = isRelease ? AUTO_TAG_RUN_LINE : VALIDATE_RUN_LINE;

  assert.ok(scope, `${workflowName} must expose the expected validation scope`);
  assert.match(scope, new RegExp(`^${runLine.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'm'),
    `${workflowName} must execute the bundle-reference contract as an active run line`);
  assert.ok(scope.indexOf(runLine) > scope.indexOf('node scripts/validate-portability.mjs'),
    `${workflowName} must run the bundle-reference contract after portability validation`);
}

test('validation and release gates execute the bundle-reference contract', () => {
  for (const workflow of ['validate.yml', 'auto-tag.yml']) {
    assertReleaseGateRunsBundleContract(read(`.github/workflows/${workflow}`), workflow);
  }
});

test('RED mutation: commenting out bundle-reference evidence blocks both gate contracts', () => {
  for (const [workflowName, runLine] of [
    ['validate.yml', VALIDATE_RUN_LINE],
    ['auto-tag.yml', AUTO_TAG_RUN_LINE],
  ]) {
    const workflow = read(`.github/workflows/${workflowName}`);
    assert.throws(
      () => assertReleaseGateRunsBundleContract(workflow.replace(runLine, `${runLine.slice(0, -CONTRACT_COMMAND.length)}# ${CONTRACT_COMMAND}`), workflowName),
      /must execute the bundle-reference contract as an active run line/,
    );
  }
});
