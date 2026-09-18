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

test('B1 candidate validates v1/v2 plans and reports policy readiness fail-closed', () => {
  const bin = process.env.AWM_R2B_CLI_BIN;
  const source = process.env.AWM_R2B_CLI_SOURCE;
  const sha = process.env.AWM_R2B_CLI_SHA;
  assert.ok(bin, 'AWM_R2B_CLI_BIN must name the paired compiled/installed candidate binary');
  assert.ok(source && existsSync(source), 'AWM_R2B_CLI_SOURCE must name the checked-out candidate source');
  assert.match(sha ?? '', /^[a-f0-9]{40}$/, 'AWM_R2B_CLI_SHA must be the exact candidate commit');
  assert.equal(execFileSync('git', ['-C', source, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), sha, 'candidate source must match its declared SHA');
  const home = mkdtempSync(path.join(os.homedir(), '.awm-r2b-policy-'));
  const env = { ...process.env, HOME: home, AWM_HOME: path.join(home, 'awm'), AWM_NO_UPDATE_CHECK: '1' };
  try {
    const version = candidate(bin, ['--version'], env).trim();
    assert.match(version, /^\d+\.\d+\.\d+$/, 'candidate must report a semantic CLI version');
    const contract = JSON.parse(candidate(bin, ['model-policy', 'contract', '--json'], env));
    assert.equal(contract.schema, 'routing-protocol/v1');
    assert.match(contract.protocolDigest, /^[a-f0-9]{64}$/, 'candidate must attest its routing protocol digest');
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
  } finally { rmSync(home, { recursive: true, force: true }); }
});
