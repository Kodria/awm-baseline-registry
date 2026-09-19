import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { chmodSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const gate = path.join(root, 'scripts/r2b-release-gate.mjs');
const protocolDigest = 'a'.repeat(64);

function run(program, args, cwd) {
  return execFileSync(program, args, { cwd, encoding: 'utf8' }).trim();
}

function makeFixture() {
  const sandbox = mkdtempSync(path.join(os.tmpdir(), 'awm-r2b-prepublication-'));
  const source = path.join(sandbox, 'cli-source');
  const registry = path.join(sandbox, 'registry');
  const bin = path.join(sandbox, 'paired-cli.mjs');
  mkdirSync(source); mkdirSync(registry);
  run('git', ['init', '-q'], source);
  run('git', ['config', 'user.name', 'R2B gate'], source);
  run('git', ['config', 'user.email', 'r2b@example.invalid'], source);
  writeFileSync(path.join(source, 'README.md'), 'candidate\n');
  run('git', ['add', '.'], source); run('git', ['commit', '-qm', 'candidate'], source);
  const sha = run('git', ['rev-parse', 'HEAD'], source);
  run('git', ['-c', 'tag.gpgSign=false', 'tag', 'v9.9.0'], source);
  writeFileSync(path.join(registry, 'awm-registry.json'), JSON.stringify({ minCliVersion: '9.8.0', projectContextSchema: 1 }));
  writeFileSync(bin, `#!/usr/bin/env node
const digest = '${protocolDigest}';
if (process.argv[2] === '--version') process.stdout.write('9.9.0\\n');
else if (process.argv[2] === 'model-policy' && process.argv[3] === 'contract' && process.argv[4] === '--json') process.stdout.write(JSON.stringify({ schema: 'routing-protocol/v1', protocolDigest: digest, supportedPlanSchemas: ['compact-slices/v1', 'compact-slices/v2'], roles: ['implementer'], implementerProfiles: ['mechanical', 'integration', 'judgment'] }));
else process.exitCode = 64;
`);
  chmodSync(bin, 0o755);
  const env = {
    ...process.env,
    AWM_R2B_CLI_BIN: bin,
    AWM_R2B_CLI_SOURCE: source,
    AWM_R2B_CLI_SHA: sha,
    AWM_R2B_CLI_VERSION: '9.9.0',
    AWM_R2B_PROTOCOL_DIGEST: protocolDigest,
    AWM_R2B_REGISTRY_ROOT: registry,
  };
  return { sandbox, registry, env };
}

test('B3 prepublication gate proves paired provenance and leaves the current floor unchanged', () => {
  const fixture = makeFixture();
  try {
    const before = readFileSync(path.join(fixture.registry, 'awm-registry.json'), 'utf8');
    const result = spawnSync(process.execPath, [gate, '--mode', 'prepublication'], { cwd: root, encoding: 'utf8', env: fixture.env });
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(JSON.parse(result.stdout), {
      mode: 'prepublication',
      cliVersion: '9.9.0',
      sourceSha: fixture.env.AWM_R2B_CLI_SHA,
      protocolDigest,
      registryFloor: '9.8.0',
      floorUpdateRequired: true,
    });
    assert.equal(readFileSync(path.join(fixture.registry, 'awm-registry.json'), 'utf8'), before, 'prepublication verification must not edit minCliVersion');
  } finally { rmSync(fixture.sandbox, { recursive: true, force: true }); }
});

test('B3 published gate rejects a guessed floor or mutable provenance before a registry release', () => {
  const fixture = makeFixture();
  try {
    const published = spawnSync(process.execPath, [gate, '--mode', 'published'], {
      cwd: root,
      encoding: 'utf8',
      env: { ...fixture.env, AWM_R2B_CLI_TAG: 'v9.9.0' },
    });
    assert.notEqual(published.status, 0);
    assert.match(published.stderr, /minCliVersion.*observed published CLI version/i);
    const badProvenance = spawnSync(process.execPath, [gate, '--mode', 'prepublication'], {
      cwd: root,
      encoding: 'utf8',
      env: { ...fixture.env, AWM_R2B_CLI_SHA: 'b'.repeat(40) },
    });
    assert.notEqual(badProvenance.status, 0);
    assert.match(badProvenance.stderr, /source SHA/i);
  } finally { rmSync(fixture.sandbox, { recursive: true, force: true }); }
});
