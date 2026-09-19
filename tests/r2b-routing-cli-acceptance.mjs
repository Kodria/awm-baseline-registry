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

// The positive approval path was previously unreachable from this repository:
// `--expected-digest` is mandatory and no command revealed the canonical digest,
// so approving for real would have meant duplicating the CLI's digest algorithm
// here — the second parser the admission contract forbids. `model-policy digest`
// removes that obstacle: the digest comes from the candidate itself, so the
// registry still never computes one.
//
// What this proves is the CLI mechanism end to end on the real binary: digest →
// approve → resolve, for both the policy and the capability receipt. It proves
// NOTHING about native runtime behaviour. The receipt below is authored by this
// test, so its capability claims are fixture input, not attestation — level 5
// stays untested and this must never be read as evidence for it.
test('B3 candidate completes both approval paths and resolves routed v2 envelopes', () => {
  const bin = process.env.AWM_R2B_CLI_BIN;
  const expectedVersion = process.env.AWM_R2B_CLI_VERSION;
  assert.ok(bin, 'AWM_R2B_CLI_BIN must name the paired compiled/installed candidate binary');
  assert.match(expectedVersion ?? '', /^\d+\.\d+\.\d+$/, 'AWM_R2B_CLI_VERSION must be immutable semantic provenance');

  const home = mkdtempSync(path.join(os.homedir(), '.awm-r2b-approve-'));
  const env = { ...process.env, HOME: home, AWM_HOME: path.join(home, 'awm'), AWM_NO_UPDATE_CHECK: '1' };
  const run = (args) => spawnSync(bin, [...args, '--json'], { cwd: root, encoding: 'utf8', env });
  const sha = (char) => char.repeat(64);
  const model = (id, effort) => ({ selector: { kind: 'model', id }, effort: effort === null ? { kind: 'runtime-default' } : { kind: 'explicit', value: effort } });

  try {
    assert.equal(candidate(bin, ['--version'], env).trim(), expectedVersion, 'candidate --version must equal its declared provenance');

    // `codex`: effort is controllable, so routing must resolve natively.
    // `claude-code`: effort is not, so the mapping approves explicit degradation
    // while keeping model routing strict. One portable policy, two behaviours.
    const policyFile = path.join(home, 'policy.json');
    const mapping = (target, models, allowMissingEffortOverride) => ({
      target, runtimeKind: 'native',
      profiles: { mechanical: models[0], integration: models[1], judgment: models[2] },
      fullCapability: models[3],
      degradation: { allowMissingModelOverride: false, allowMissingEffortOverride, allowMissingObservedIdentity: true },
    });
    const policy = {
      schema: 'model-policy/v1',
      mappings: [
        mapping('codex', [model('cx-luna', 'low'), model('cx-terra', 'medium'), model('cx-sol', 'medium'), model('cx-sol', 'high')], false),
        mapping('claude-code', [model('cc-small', 'medium'), model('cc-mid', 'medium'), model('cc-large', 'high'), model('cc-large', 'high')], true),
      ],
      implementationBudget: { maxAttempts: 3, escalation: ['mechanical', 'integration', 'judgment'], judgmentEfforts: ['medium', 'high'] },
    };
    writeFileSync(policyFile, JSON.stringify(policy));

    // The digest comes from the candidate. The registry asserts only that the
    // value approval demands is the value the candidate disclosed.
    const disclosed = run(['model-policy', 'digest', '--file', policyFile, '--cwd', root]);
    assert.equal(disclosed.status, 0, disclosed.stderr);
    const policyDigest = JSON.parse(disclosed.stdout);
    assert.equal(policyDigest.schema, 'model-policy/v1', 'digest must report the schema it dispatched on');
    assert.match(policyDigest.digest, /^[a-f0-9]{64}$/, 'digest must be a canonical sha256');

    // Falsifiability: any other digest must still be refused, or the acceptance
    // below would pass against a binary that ignores --expected-digest entirely.
    const refused = run(['model-policy', 'approve', '--file', policyFile, '--scope', 'user', '--expected-digest', sha('f'), '--cwd', root]);
    assert.notEqual(refused.status, 0, 'a mismatched expected digest must still be refused');
    assert.deepEqual(JSON.parse(run(['model-policy', 'status', '--provider', 'codex', '--runtime-kind', 'native', '--runtime-version', '1.0.0', '--account-scope-digest', sha('a'), '--cwd', root]).stdout), { policy: { state: 'absent' }, capability: { state: 'absent' } }, 'a refused approve must leave nothing behind');

    const approved = run(['model-policy', 'approve', '--file', policyFile, '--scope', 'user', '--expected-digest', policyDigest.digest, '--cwd', root]);
    assert.equal(approved.status, 0, `the disclosed digest must be accepted by approve: ${approved.stderr}`);
    assert.equal(JSON.parse(approved.stdout).policy.contentDigest, policyDigest.digest, 'the approved policy must carry the disclosed digest');

    // Policy alone is not readiness: the receipt is still absent, so this stays
    // fail-closed and zero-dispatch.
    const halfway = run(['model-policy', 'status', '--provider', 'codex', '--runtime-kind', 'native', '--runtime-version', '1.0.0', '--account-scope-digest', sha('a'), '--cwd', root]);
    assert.equal(halfway.status, 2, 'an approved policy without a current receipt must remain not ready');
    assert.equal(JSON.parse(halfway.stdout).capability.state, 'absent');
    const stillBlocked = run(['plan', 'resolve', 'tests/fixtures/compact-slices-v2/reference-example.md', '--provider', 'codex', '--runtime-kind', 'native', '--runtime-version', '1.0.0', '--account-scope-digest', sha('a'), '--role', 'implementer', '--slice', 'S1', '--cwd', root]);
    assert.equal(stillBlocked.status, 2, 'policy without receipt must not resolve');
    assert.equal(JSON.parse(stillBlocked.stdout).diagnostics[0].code, 'ROUTING_CAPABILITY_ABSENT');

    const receiptFor = (target, selections, runtimeDefault, effortOverride, observedModelEvidence = 'unverified') => {
      const now = Date.now();
      return {
        schema: 'routing-capabilities/v1',
        runtime: { target, kind: 'native', version: '1.0.0', accountScopeDigest: sha('a') },
        recordedAt: new Date(now - 60_000).toISOString(),
        expiresAt: new Date(now + 6 * 3600_000).toISOString(),
        capabilities: { artifactDelivery: 'supported', interactiveExecution: 'supported', unattendedController: 'supported', nativeSubagents: 'supported', modelOverride: 'supported', effortOverride, observedModelEvidence, durableResume: 'unverified' },
        availableSelections: selections,
        runtimeDefaultSelection: runtimeDefault,
        evidence: [
          ...['nativeSubagents', 'modelOverride', 'artifactDelivery', 'interactiveExecution', 'unattendedController'].map((capability) => ({ capability, kind: 'native-dispatch', receiptDigest: sha('b') })),
          { capability: 'effortOverride', kind: effortOverride === 'supported' ? 'native-control' : 'unsupported', receiptDigest: sha('b') },
          ...(observedModelEvidence === 'supported' ? [{ capability: 'observedModelEvidence', kind: 'native-control', receiptDigest: sha('b') }] : []),
        ],
        approval: { approvalId: 'registry-acceptance', snapshotDigest: sha('c') },
      };
    };

    const approveReceipt = (name, receipt) => {
      const file = path.join(home, name);
      writeFileSync(file, JSON.stringify(receipt));
      const observed = run(['model-policy', 'digest', '--file', file, '--cwd', root]);
      assert.equal(observed.status, 0, observed.stderr);
      const { schema, digest } = JSON.parse(observed.stdout);
      assert.equal(schema, 'routing-capabilities/v1', 'digest must dispatch on the receipt schema, not the policy one');
      const result = run(['model-policy', 'capabilities', 'approve', '--file', file, '--expected-digest', digest, '--cwd', root]);
      assert.equal(result.status, 0, `the disclosed receipt digest must be accepted: ${result.stderr}`);
      return digest;
    };

    const codexDigest = approveReceipt('codex-receipt.json', receiptFor('codex', [model('cx-luna', 'low'), model('cx-terra', 'medium'), model('cx-sol', 'medium'), model('cx-sol', 'high')], model('cx-sol', 'high'), 'supported', 'supported'));

    const ready = run(['model-policy', 'status', '--provider', 'codex', '--runtime-kind', 'native', '--runtime-version', '1.0.0', '--account-scope-digest', sha('a'), '--cwd', root]);
    assert.equal(ready.status, 0, 'an approved policy and a current receipt must report ready');
    const readyReport = JSON.parse(ready.stdout);
    assert.equal(readyReport.policy.state, 'approved');
    assert.equal(readyReport.capability.state, 'current');
    assert.equal(readyReport.capability.digest, codexDigest, 'status must report the receipt digest the candidate disclosed');

    // The routed envelope: each semantic profile resolves to its own approved
    // model. The plan named a profile, never a model or a vendor.
    for (const [slice, id, profile] of [['S1', 'cx-luna', 'mechanical'], ['S2', 'cx-terra', 'integration'], ['S3', 'cx-sol', 'judgment']]) {
      const resolved = run(['plan', 'resolve', 'tests/fixtures/compact-slices-v2/reference-example.md', '--provider', 'codex', '--runtime-kind', 'native', '--runtime-version', '1.0.0', '--account-scope-digest', sha('a'), '--role', 'implementer', '--slice', slice, '--cwd', root]);
      assert.equal(resolved.status, 0, `${slice} must resolve once policy and receipt are current: ${resolved.stderr}`);
      const envelope = JSON.parse(resolved.stdout);
      assert.equal(envelope.state, 'resolved', `${slice} must produce a resolved envelope`);
      assert.equal(envelope.effectiveProfile, profile, `${slice} must keep its semantic profile`);
      assert.equal(envelope.selection.selector.id, id, `${slice} must carry its own approved model, not a collapsed default`);
      assert.equal(envelope.outcome, 'native', `${slice} must resolve natively when every capability is attested`);
      assert.equal(envelope.policyDigest, policyDigest.digest);
      assert.equal(envelope.capabilityDigest, codexDigest);
    }

    // A full role resolves as itself, to the approved full capability.
    const reviewer = run(['plan', 'resolve', 'tests/fixtures/compact-slices-v2/reference-example.md', '--provider', 'codex', '--runtime-kind', 'native', '--runtime-version', '1.0.0', '--account-scope-digest', sha('a'), '--role', 'final-reviewer', '--cwd', root]);
    assert.equal(reviewer.status, 0, reviewer.stderr);
    assert.equal(JSON.parse(reviewer.stdout).selection.selector.id, 'cx-sol', 'a full role must resolve to the approved full capability');

    // A runtime that cannot honour effort degrades visibly and KEEPS its routed
    // model. Collapsing every profile onto the full-capability model here would
    // make a mechanical slice silently run the judgment model.
    approveReceipt('claude-receipt.json', receiptFor('claude-code', [model('cc-small', null), model('cc-mid', null), model('cc-large', null)], model('cc-large', null), 'unsupported'));
    for (const [slice, id] of [['S1', 'cc-small'], ['S2', 'cc-mid'], ['S3', 'cc-large']]) {
      const degraded = run(['plan', 'resolve', 'tests/fixtures/compact-slices-v2/reference-example.md', '--provider', 'claude-code', '--runtime-kind', 'native', '--runtime-version', '1.0.0', '--account-scope-digest', sha('a'), '--role', 'implementer', '--slice', slice, '--cwd', root]);
      assert.equal(degraded.status, 0, `${slice} must resolve through approved degradation: ${degraded.stderr}`);
      const envelope = JSON.parse(degraded.stdout);
      assert.equal(envelope.outcome, 'degraded', `${slice} degradation must be visible, never silent`);
      assert.ok(envelope.unavailableEvidence.includes('effortOverride'), `${slice} must name effortOverride as the surrendered capability`);
      assert.equal(envelope.selection.selector.id, id, `${slice} must keep its routed model through effort degradation`);
      assert.equal(envelope.selection.effort.kind, 'runtime-default', `${slice} must fall back to runtime-default effort, not to another explicit effort`);
    }

    // Withdrawal is an operator act with lineage, never an installer one.
    const withdrawn = { ...policy, mappings: [policy.mappings[0]] };
    const withdrawnFile = path.join(home, 'withdrawn.json');
    writeFileSync(withdrawnFile, JSON.stringify(withdrawn));
    const withdrawnDigest = JSON.parse(run(['model-policy', 'digest', '--file', withdrawnFile, '--cwd', root]).stdout).digest;
    assert.notEqual(withdrawnDigest, policyDigest.digest, 'a different policy must have a different digest');
    const noPredecessor = run(['model-policy', 'approve', '--file', withdrawnFile, '--scope', 'user', '--expected-digest', withdrawnDigest, '--cwd', root]);
    assert.notEqual(noPredecessor.status, 0, 'replacing an existing policy without --replace-digest must be refused');
    const replaced = run(['model-policy', 'approve', '--file', withdrawnFile, '--scope', 'user', '--expected-digest', withdrawnDigest, '--replace-digest', policyDigest.digest, '--cwd', root]);
    assert.equal(replaced.status, 0, `withdrawal with an explicit predecessor must succeed: ${replaced.stderr}`);
    assert.equal(JSON.parse(replaced.stdout).policy.lineage.previousDigest, policyDigest.digest, 'withdrawal must record its predecessor');
    const afterWithdrawal = run(['plan', 'resolve', 'tests/fixtures/compact-slices-v2/reference-example.md', '--provider', 'claude-code', '--runtime-kind', 'native', '--runtime-version', '1.0.0', '--account-scope-digest', sha('a'), '--role', 'implementer', '--slice', 'S1', '--cwd', root]);
    assert.equal(afterWithdrawal.status, 2, 'the withdrawn mapping must stop resolving');
    assert.equal(JSON.parse(afterWithdrawal.stdout).diagnostics[0].code, 'ROUTING_POLICY_MAPPING_ABSENT');

    // Everything above is read-only with respect to dispatch: resolving is not
    // dispatching, and no custody may exist without a reservation.
    assertNoDispatchCustody(root);
  } finally { rmSync(home, { recursive: true, force: true }); }
});
