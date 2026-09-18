import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

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
    assert.equal(existsSync(path.join(home, 'awm', 'journal.json')), false, 'read-only policy/resolve negatives must not create dispatch custody');
    assert.equal(candidate(oldBin, ['--version'], env).trim(), oldVersion, 'old negative-control binary must retain its declared published version');
    const oldContract = spawnSync(oldBin, ['model-policy', 'contract', '--json'], { cwd: root, encoding: 'utf8', env });
    if (oldContract.status === 0) {
      const legacy = JSON.parse(oldContract.stdout);
      assert.ok(!Array.isArray(legacy.supportedPlanSchemas) || !legacy.supportedPlanSchemas.includes('compact-slices/v2'), 'old published CLI must not be misrepresented as v2-compatible');
    } else {
      assert.notEqual(oldContract.status, 0, 'old published CLI must reject the routing contract command');
    }
    assert.ok(compareSemver(expectedVersion, oldVersion) > 0, 'the B3 candidate must be newer than the published CLI that lacks compact v2');
  } finally { rmSync(home, { recursive: true, force: true }); }
});
