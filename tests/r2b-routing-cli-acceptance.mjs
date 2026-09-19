import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { assertNoDispatchCustody } from './installed-admission-acceptance.mjs';

const root = path.resolve(new URL('..', import.meta.url).pathname);

function candidate(bin, args, env, cwd = root) {
  return execFileSync(bin, args, { encoding: 'utf8', cwd, env: { ...env, AWM_NO_UPDATE_CHECK: '1' } });
}

function compareSemver(left, right) {
  const a = left.split('.').map(Number); const b = right.split('.').map(Number);
  for (let index = 0; index < 3; index += 1) if (a[index] !== b[index]) return a[index] - b[index];
  return 0;
}

test('B3 paired candidate preserves v1, blocks unready v2, and is immutable', () => {
  const bin = process.env.AWM_R2B_CLI_BIN;
  const source = process.env.AWM_R2B_CLI_SOURCE;
  const sha = process.env.AWM_R2B_CLI_SHA;
  const expectedVersion = process.env.AWM_R2B_CLI_VERSION;
  const expectedProtocolDigest = process.env.AWM_R2B_PROTOCOL_DIGEST;
  const oldBin = process.env.AWM_R2B_OLD_CLI_BIN;
  const oldVersion = process.env.AWM_R2B_OLD_CLI_VERSION;
  assert.ok(bin, 'AWM_R2B_CLI_BIN must name the paired compiled/installed candidate binary');
  assert.ok(source && existsSync(source), 'AWM_R2B_CLI_SOURCE must name the checked-out candidate source');
  assert.match(sha ?? '', /^[a-f0-9]{40}$/, 'AWM_R2B_CLI_SHA must be the exact candidate commit');
  assert.match(expectedVersion ?? '', /^\d+\.\d+\.\d+$/, 'AWM_R2B_CLI_VERSION must be immutable semantic provenance');
  assert.match(expectedProtocolDigest ?? '', /^[a-f0-9]{64}$/, 'AWM_R2B_PROTOCOL_DIGEST must be immutable protocol provenance');
  assert.ok(oldBin, 'AWM_R2B_OLD_CLI_BIN must name the unmodified published negative-control binary');
  assert.match(oldVersion ?? '', /^\d+\.\d+\.\d+$/, 'AWM_R2B_OLD_CLI_VERSION must identify the published negative control');
  assert.equal(execFileSync('git', ['-C', source, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), sha, 'candidate source must match its declared SHA');
  const home = mkdtempSync(path.join(os.homedir(), '.awm-r2b-policy-'));
  const env = { ...process.env, HOME: home, AWM_HOME: path.join(home, 'awm'), AWM_NO_UPDATE_CHECK: '1' };
  try {
    const version = candidate(bin, ['--version'], env).trim();
    assert.equal(version, expectedVersion, 'candidate --version must equal its declared immutable provenance');
    const contract = JSON.parse(candidate(bin, ['model-policy', 'contract', '--json'], env));
    assert.equal(contract.schema, 'routing-protocol/v1');
    assert.equal(contract.protocolDigest, expectedProtocolDigest, 'candidate protocol digest must equal its declared immutable provenance');
    assert.deepEqual(contract.supportedPlanSchemas, ['compact-slices/v1', 'compact-slices/v2'], 'candidate must retain v1 and explicitly advertise v2');
    assert.ok(Array.isArray(contract.roles) && contract.roles.includes('implementer'), 'candidate must expose routing roles');
    assert.deepEqual(contract.implementerProfiles, ['mechanical', 'integration', 'judgment'], 'candidate must expose semantic profiles only');
    assert.ok(!Object.hasOwn(contract, 'profiles'), 'candidate must not expose the obsolete ambiguous profile field');
    for (const [fixture, schema] of [
      ['tests/fixtures/compact-slices-v1/reference-example.md', 'compact-slices/v1'],
      ['tests/fixtures/compact-slices-v2/reference-example.md', 'compact-slices/v2'],
    ]) {
      const report = JSON.parse(candidate(bin, ['plan', 'validate', fixture, '--cwd', root, '--json'], env));
      assert.equal(report.state, 'valid', `${fixture} must validate with the candidate`);
      assert.equal(report.schema, schema);
    }
    const status = spawnSync(bin, ['model-policy', 'status', '--provider', 'codex', '--runtime-kind', 'native', '--runtime-version', '1.0.0', '--account-scope-digest', 'a'.repeat(64), '--cwd', root, '--json'], { cwd: root, encoding: 'utf8', env: { ...process.env, HOME: home, AWM_HOME: path.join(home, 'awm'), AWM_NO_UPDATE_CHECK: '1' } });
    assert.equal(status.status, 2, 'missing policy/receipt must remain visibly not ready');
    assert.deepEqual(JSON.parse(status.stdout), { policy: { state: 'absent' }, capability: { state: 'absent' } });
    const v1 = spawnSync(bin, ['plan', 'resolve', 'tests/fixtures/compact-slices-v1/reference-example.md', '--provider', 'codex', '--runtime-kind', 'native', '--runtime-version', '1.0.0', '--account-scope-digest', 'a'.repeat(64), '--role', 'final-reviewer', '--cwd', root, '--json'], { cwd: root, encoding: 'utf8', env });
    assert.equal(v1.status, 0, v1.stderr);
    assert.deepEqual(JSON.parse(v1.stdout), { state: 'not-required', reason: 'v1-without-opt-in' }, 'v1 must preserve the un-routed fallback');
    const v2 = spawnSync(bin, ['plan', 'resolve', 'tests/fixtures/compact-slices-v2/reference-example.md', '--provider', 'codex', '--runtime-kind', 'native', '--runtime-version', '1.0.0', '--account-scope-digest', 'a'.repeat(64), '--role', 'implementer', '--slice', 'S1', '--cwd', root, '--json'], { cwd: root, encoding: 'utf8', env });
    assert.equal(v2.status, 2, v2.stderr);
    const blocked = JSON.parse(v2.stdout);
    assert.equal(blocked.state, 'blocked', 'v2 without current approval/receipt must be zero-dispatch blocked');
    assert.ok(Array.isArray(blocked.diagnostics) && blocked.diagnostics.length > 0, 'v2 block must retain actionable diagnostics');
    // Dispatch custody lives at <repoRoot>/.awm/journal, never at $AWM_HOME/journal.json.
    // The previous path was one the CLI never writes, so this assertion could not fail.
    // assertNoDispatchCustody owns that location; --cwd above is `root`.
    assertNoDispatchCustody(root);
    // Exercise `model-policy approve` on the real binary. Only the fail-closed path is
    // provable from here: --expected-digest is mandatory and the CLI never reveals the
    // canonical digest, so approving for real would mean duplicating the CLI's digest
    // algorithm in the registry — the second parser the contract forbids.
    const policy = path.join(home, 'candidate-policy.json');
    writeFileSync(policy, JSON.stringify({ schema: 'model-policy/v1', mappings: [], implementationBudget: { maxAttempts: 3, escalation: ['mechanical', 'integration', 'judgment'], judgmentEfforts: ['medium', 'high'] } }));
    const approve = spawnSync(bin, ['model-policy', 'approve', '--file', policy, '--scope', 'user', '--expected-digest', 'a'.repeat(64), '--cwd', root, '--json'], { cwd: root, encoding: 'utf8', env });
    assert.equal(approve.error, undefined, 'approve must actually execute on the candidate');
    assert.match(`${approve.stdout}${approve.stderr}`, /digest/i, 'approve must reject a mismatched expected digest by naming the digest boundary');
    const afterApprove = spawnSync(bin, ['model-policy', 'status', '--provider', 'codex', '--runtime-kind', 'native', '--runtime-version', '1.0.0', '--account-scope-digest', 'a'.repeat(64), '--cwd', root, '--json'], { cwd: root, encoding: 'utf8', env });
    assert.deepEqual(JSON.parse(afterApprove.stdout), { policy: { state: 'absent' }, capability: { state: 'absent' } }, 'a rejected approve must leave no approved policy behind');
    assertNoDispatchCustody(root);

    assert.equal(candidate(oldBin, ['--version'], env).trim(), oldVersion, 'old negative-control binary must retain its declared published version');
    const oldContract = spawnSync(oldBin, ['model-policy', 'contract', '--json'], { cwd: root, encoding: 'utf8', env });
    // Both outcomes must assert something falsifiable. The previous `else` re-stated
    // its own branch condition, so the only path CI reaches proved nothing.
    assert.equal(oldContract.error, undefined, 'old published CLI must actually execute, not fail to spawn');
    if (oldContract.status === 0) {
      const legacy = JSON.parse(oldContract.stdout);
      assert.ok(!Array.isArray(legacy.supportedPlanSchemas) || !legacy.supportedPlanSchemas.includes('compact-slices/v2'), 'old published CLI must not be misrepresented as v2-compatible');
    } else {
      // It rejected the command: prove it is a real rejection of an unknown verb and
      // that it never advertised v2 anywhere in its output.
      assert.doesNotMatch(`${oldContract.stdout}${oldContract.stderr}`, /compact-slices\/v2/, 'old published CLI must never advertise v2');
      assert.match(`${oldContract.stdout}${oldContract.stderr}`, /model-policy/, 'rejection must name the unsupported routing command');
    }
    assert.ok(compareSemver(expectedVersion, oldVersion) > 0, 'the B3 candidate must be newer than the published CLI that lacks compact v2');
  } finally { rmSync(home, { recursive: true, force: true }); }
});
