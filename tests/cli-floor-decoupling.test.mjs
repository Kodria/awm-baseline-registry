import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { assertFloorSatisfied, environmentLines, readCliCertification } from '../scripts/cli-certification.mjs';
import { compareSemver, isBareSemver, satisfiesFloor } from '../scripts/semver.mjs';
import { requireCompatibleRuntime } from './compatible-cli-runtime.mjs';

// Kodria/agentic-workflow#164. `minCliVersion` used to carry three meanings at
// once — compatibility floor, certified provenance, and the exact version CI
// installs — so every CLI patch release turned this repository's CI red until
// two values were bumped by hand. These tests hold the three apart.
const root = path.resolve(new URL('..', import.meta.url).pathname);

function sandboxRegistry({ certification, manifest }) {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'awm-floor-'));
  writeFileSync(path.join(directory, 'cli-certification.json'), JSON.stringify(certification));
  writeFileSync(path.join(directory, 'awm-registry.json'), JSON.stringify(manifest));
  return directory;
}

const CERTIFIED = Object.freeze({
  schema: 'cli-certification/v1',
  certifiedCli: { version: '9.9.0', sourceSha: 'a'.repeat(40), protocolDigest: 'b'.repeat(64) },
  negativeControls: { routingCli: '9.7.0', admissionCli: '9.6.0' },
});
const MANIFEST = Object.freeze({ minCliVersion: '9.8.0', projectContextSchema: 1 });

function rejects(overrides, pattern) {
  const directory = sandboxRegistry({
    certification: { ...CERTIFIED, ...overrides.certification },
    manifest: { ...MANIFEST, ...overrides.manifest },
  });
  try { assert.throws(() => readCliCertification(directory), pattern); }
  finally { rmSync(directory, { recursive: true, force: true }); }
}

test('the shipped record declares a certified CLI at or above the floor and controls below it', () => {
  const certification = readCliCertification(root);
  const floor = JSON.parse(readFileSync(path.join(root, 'awm-registry.json'), 'utf8')).minCliVersion;
  assert.equal(certification.floor, floor, 'the floor is read from the consumed manifest, never restated');
  assert.ok(isBareSemver(certification.certified.version));
  assert.match(certification.certified.sourceSha, /^[a-f0-9]{40}$/);
  assert.match(certification.certified.protocolDigest, /^[a-f0-9]{64}$/);
  assert.ok(satisfiesFloor(certification.certified.version, floor), 'a certified CLI the registry declares too old to consume it is incoherent');
  for (const control of Object.values(certification.negativeControls)) {
    assert.ok(compareSemver(control, floor) < 0, `negative control ${control} must actually be below the floor ${floor}`);
  }
});

test('the record fails closed on every shape that would let an incoherent pair through', () => {
  rejects({ certification: { schema: 'cli-certification/v2' } }, /schema must be "cli-certification\/v1"/);
  rejects({ certification: { certifiedCli: { ...CERTIFIED.certifiedCli, version: '9.9' } } }, /certifiedCli\.version must be a bare semantic version/);
  rejects({ certification: { certifiedCli: { ...CERTIFIED.certifiedCli, version: 'v9.9.0' } } }, /certifiedCli\.version must be a bare semantic version/);
  rejects({ certification: { certifiedCli: { ...CERTIFIED.certifiedCli, sourceSha: 'A'.repeat(40) } } }, /sourceSha must be a 40-character lowercase commit SHA/);
  rejects({ certification: { certifiedCli: { ...CERTIFIED.certifiedCli, protocolDigest: 'b'.repeat(63) } } }, /protocolDigest must be a 64-character lowercase sha256 digest/);
  rejects({ certification: { certifiedCli: null } }, /certifiedCli must be a JSON object/);
  rejects({ certification: { negativeControls: { routingCli: 'latest', admissionCli: '9.6.0' } } }, /negativeControls\.routingCli must be a bare semantic version/);
  rejects({ manifest: { minCliVersion: 'next' } }, /minCliVersion must be a bare semantic version/);
  // The two directions the split must keep honest.
  rejects({ manifest: { minCliVersion: '9.9.1' } }, /certifiedCli\.version 9\.9\.0 is below the registry floor 9\.9\.1/);
  rejects({ certification: { negativeControls: { routingCli: '9.8.0', admissionCli: '9.6.0' } } }, /negativeControls\.routingCli 9\.8\.0 satisfies the registry floor 9\.8\.0/);
});

test('a published CLI newer than the floor satisfies it; an older one is named as the blocker', () => {
  assert.equal(assertFloorSatisfied('9.11.2', '9.10.2'), true);
  assert.equal(assertFloorSatisfied('9.10.2', '9.10.2'), true);
  assert.equal(assertFloorSatisfied('10.0.0', '9.10.2'), true, 'a two-digit minor must not sort below a one-digit one');
  assert.throws(() => assertFloorSatisfied('9.10.1', '9.10.2'), /published CLI 9\.10\.1 is below the registry floor 9\.10\.2/);
});

test('the declared pins reach CI as validated KEY=value lines and nothing else', () => {
  const lines = environmentLines(readCliCertification(root));
  assert.deepEqual(lines.map(line => line.split('=')[0]), [
    'AWM_REGISTRY_MIN_CLI_VERSION', 'AWM_CERTIFIED_CLI_VERSION', 'AWM_CERTIFIED_CLI_SHA',
    'AWM_CERTIFIED_CLI_PROTOCOL_DIGEST', 'AWM_R2B_OLD_CLI_VERSION', 'AWM_R16_OLD_CLI_VERSION',
  ]);
  for (const line of lines) {
    const value = line.slice(line.indexOf('=') + 1);
    assert.match(value, /^[a-f0-9.]+$/, `${line} must be pre-validated hex or semver, so it cannot forge an extra $GITHUB_ENV entry`);
  }
  const printed = spawnSync(process.execPath, [path.join(root, 'scripts/cli-certification.mjs'), '--env'], { cwd: root, encoding: 'utf8' });
  assert.equal(printed.status, 0, printed.stderr);
  assert.equal(printed.stdout, `${lines.join('\n')}\n`);
});

test('the runtime guard accepts any CLI at or above the floor and still demands source evidence below it', () => {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'awm-floor-runtime-'));
  const floor = JSON.parse(readFileSync(path.join(root, 'awm-registry.json'), 'utf8')).minCliVersion;
  const [major, minor, patch] = floor.split('.').map(Number);
  const fake = version => {
    const bin = path.join(directory, `awm-${version}.mjs`);
    writeFileSync(bin, `#!/usr/bin/env node\nprocess.stdout.write('${version}\\n');\n`);
    chmodSync(bin, 0o755);
    return bin;
  };
  const previousEvidence = process.env.AWM_R1_PRERELEASE_SOURCE_COMMIT;
  delete process.env.AWM_R1_PRERELEASE_SOURCE_COMMIT;
  try {
    for (const version of [floor, `${major}.${minor}.${patch + 1}`, `${major}.${minor + 1}.0`, `${major + 1}.0.0`]) {
      assert.deepEqual(requireCompatibleRuntime(fake(version), root), { kind: 'published-version', actual: version, floor });
    }
    const below = patch > 0 ? `${major}.${minor}.${patch - 1}` : `${major}.${minor - 1}.0`;
    assert.throws(() => requireCompatibleRuntime(fake(below), root), new RegExp(`runtime ${below.replace(/\./g, '\\.')} is below the registry floor ${floor.replace(/\./g, '\\.')}`));
  } finally {
    if (previousEvidence !== undefined) process.env.AWM_R1_PRERELEASE_SOURCE_COMMIT = previousEvidence;
    rmSync(directory, { recursive: true, force: true });
  }
});

// The workflows are the place the coupling actually bit: they installed the CLI
// at the floor and then admitted against it. Hold their shape, and hold the
// clear failure that replaces the confusing one when the floor outruns npm.
function assertInstallsPublishedLatest(name, workflow) {
  assert.match(workflow, /^\s*-\s+name:\s+Install the published CLI under test\s*$/m, `${name} must name the published-CLI install step`);
  assert.match(workflow, /^\s*LATEST="\$\(npm view agentic-workflow-manager version\)"\s*$/m, `${name} must resolve the version under test from npm at run time`);
  assert.match(workflow, /^\s*node scripts\/cli-certification\.mjs --assert-floor "\$LATEST"\s*$/m, `${name} must prove the resolved version satisfies the floor before installing it`);
  assert.match(workflow, /^\s*npm install --global "agentic-workflow-manager@\$LATEST"\s*$/m, `${name} must install exactly the resolved published version`);
  assert.match(workflow, /^\s*echo "AWM_INSTALLED_CLI_VERSION=\$LATEST" >> "\$GITHUB_ENV"\s*$/m, `${name} must declare the installed version so the acceptance can refuse a prerelease`);
  assert.doesNotMatch(workflow, /npm install --global "agentic-workflow-manager@\$R3A_VERSION"/, `${name} must not install the CLI at the compatibility floor`);
}

test('both CI surfaces install the published CLI, never the floor, and prove it clears the floor first', () => {
  for (const name of ['.github/workflows/validate.yml', '.github/workflows/auto-tag.yml']) {
    const workflow = readFileSync(path.join(root, name), 'utf8');
    assertInstallsPublishedLatest(name, workflow);

    const atTheFloor = workflow.replace('npm install --global "agentic-workflow-manager@$LATEST"', 'npm install --global "agentic-workflow-manager@$R3A_VERSION"');
    assert.notEqual(atTheFloor, workflow, 'the mutation must actually reinstate the install-at-the-floor step');
    assert.throws(() => assertInstallsPublishedLatest(name, atTheFloor), /must install exactly the resolved published version/);

    const alsoTheFloor = workflow.replace('npm install --global "agentic-workflow-manager@$LATEST"', 'npm install --global "agentic-workflow-manager@$LATEST"\n          npm install --global "agentic-workflow-manager@$R3A_VERSION"');
    assert.notEqual(alsoTheFloor, workflow, 'the mutation must actually add a second install at the floor');
    assert.throws(() => assertInstallsPublishedLatest(name, alsoTheFloor), /must not install the CLI at the compatibility floor/, 'installing at the floor as well must be rejected: the last install wins');

    const unproven = workflow.replace('node scripts/cli-certification.mjs --assert-floor "$LATEST"', 'true');
    assert.notEqual(unproven, workflow, 'the mutation must actually drop the floor proof');
    assert.throws(() => assertInstallsPublishedLatest(name, unproven), /must prove the resolved version satisfies the floor/);

    const undeclared = workflow.replace('echo "AWM_INSTALLED_CLI_VERSION=$LATEST" >> "$GITHUB_ENV"', 'true');
    assert.notEqual(undeclared, workflow, 'the mutation must actually drop the declared installed version');
    assert.throws(() => assertInstallsPublishedLatest(name, undeclared), /must declare the installed version/);
  }
});
