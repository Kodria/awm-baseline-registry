// Structural gate: every tests/*.test.mjs must be named in some workflow.
// A check that nothing runs cannot go red — Kodria/awm-baseline-registry#61.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const testsDir = path.join(root, 'tests');
const workflowsDir = path.join(root, '.github', 'workflows');

function listTopLevelTestFiles() {
  return fs.readdirSync(testsDir)
    .filter(name => name.endsWith('.test.mjs'))
    .sort();
}

function workflowCorpus() {
  return fs.readdirSync(workflowsDir)
    .filter(name => name.endsWith('.yml') || name.endsWith('.yaml'))
    .map(name => ({
      name,
      text: fs.readFileSync(path.join(workflowsDir, name), 'utf8'),
    }));
}

function orphansAgainst(corpus, testFiles) {
  return testFiles.filter(file => !corpus.some(wf => wf.text.includes(file)));
}

test('every top-level tests/*.test.mjs is named in some GitHub workflow', () => {
  const testFiles = listTopLevelTestFiles();
  assert.ok(testFiles.includes('workflow-test-coverage.test.mjs'),
    'this gate must cover itself');
  const corpus = workflowCorpus();
  assert.ok(corpus.length > 0, 'expected at least one workflow file');
  const orphans = orphansAgainst(corpus, testFiles);
  assert.deepEqual(orphans, [],
    `ungated test files (named in no workflow):\n${orphans.map(f => `  - ${f}`).join('\n')}`);
});

test('coverage helper treats a basename missing from every workflow as orphan', () => {
  const corpus = [
    { name: 'validate.yml', text: 'node --test tests/alpha.test.mjs\n' },
    { name: 'auto-tag.yml', text: 'node tests/alpha.test.mjs\n' },
  ];
  assert.deepEqual(orphansAgainst(corpus, ['alpha.test.mjs', 'beta.test.mjs']), ['beta.test.mjs'],
    'a test file never named in any workflow must be reported as orphan');
  const stripped = corpus.map(wf => ({
    name: wf.name,
    text: wf.text.split('alpha.test.mjs').join('REMOVED'),
  }));
  assert.deepEqual(orphansAgainst(stripped, ['alpha.test.mjs']), ['alpha.test.mjs'],
    'removing the basename from every workflow must surface the file as orphan');
});
