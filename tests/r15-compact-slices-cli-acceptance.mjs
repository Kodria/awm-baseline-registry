import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixture = path.join(root, 'tests/fixtures/compact-slices-v1/valid-plan.md');
const awm = process.env.AWM_R4A_BIN || 'awm';
const expectedVersion = '9.4.1';

function validate(planPath) {
  return spawnSync(awm, ['plan', 'validate', planPath, '--cwd', root, '--json'], { cwd: root, encoding: 'utf8' });
}

function assertBoundedFailure(result) {
  assert.notEqual(result.status, 0, 'invalid compact plan must fail');
  assert.ok((result.stdout + result.stderr).length < 10_000, 'invalid compact-plan result must remain bounded');
}

test('published R4a CLI accepts the portable compact fixture and rejects partial/future manifests', () => {
  assert.equal(execFileSync(awm, ['--version'], { encoding: 'utf8' }).trim(), expectedVersion, 'acceptance must run the declared published R4a CLI');
  const valid = validate(fixture);
  assert.equal(valid.status, 0, valid.stdout + valid.stderr);
  const report = JSON.parse(valid.stdout);
  assert.deepEqual(
    { state: report.state, schema: report.schema, requirements: report.requirements, sources: report.sources, commands: report.commands, slices: report.slices, completeOwnership: report.completeOwnership },
    { state: 'valid', schema: 'compact-slices/v1', requirements: 14, sources: 12, commands: 14, slices: 3, completeOwnership: true },
  );

  const sandbox = mkdtempSync(path.join(os.tmpdir(), 'awm-r15-'));
  try {
    const source = readFileSync(fixture, 'utf8');
    const partial = path.join(sandbox, 'partial.md');
    const future = path.join(sandbox, 'future.md');
    writeFileSync(partial, source.replace('"reviewEvidence":["specification","code-quality"]', '"reviewEvidence":["specification"]'));
    writeFileSync(future, source.replace('"schema": "compact-slices/v1"', '"schema": "compact-slices/v2"'));
    assertBoundedFailure(validate(partial));
    assertBoundedFailure(validate(future));
  } finally {
    rmSync(sandbox, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  }
});
