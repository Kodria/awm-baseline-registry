import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const legacyFixture = path.join(root, 'tests/fixtures/context-kernel-v1/legacy');
const candidateFixture = path.join(root, 'tests/fixtures/context-kernel-v1/candidate');
const awm = process.env.AWM_R3A_BIN || 'awm';
const disabledGenericSensors = JSON.stringify({ pack: 'generic', sensors: { security: { enabled: false } } }, null, 2) + '\n';

function copyProject(source, destination) {
  cpSync(source, destination, { recursive: true });
  const sensorDirectory = path.join(destination, '.awm');
  mkdirSync(sensorDirectory, { recursive: true });
  const sensorFile = path.join(sensorDirectory, 'sensors.json');
  if (!existsSync(sensorFile)) writeFileSync(sensorFile, disabledGenericSensors);
}

function installRegistry(home) {
  const registry = path.join(home, 'registries', 'baseline');
  mkdirSync(registry, { recursive: true });
  for (const item of ['awm-registry.json', 'catalog.json', 'bundles', 'skills', 'sensor-packs']) {
    cpSync(path.join(root, item), path.join(registry, item), { recursive: true });
  }
  writeFileSync(path.join(home, 'registries.json'), JSON.stringify([{ name: 'baseline', remote: 'local-fixture' }], null, 2) + '\n');
}

function runPreflight(cwd, home) {
  return spawnSync(awm, ['preflight', '--cwd', cwd], {
    cwd,
    env: { ...process.env, AWM_HOME: home },
    encoding: 'utf8',
  });
}

function requirePublishedR3a() {
  const version = execFileSync(awm, ['--version'], { encoding: 'utf8' }).trim();
  assert.equal(version, '9.4.1', 'acceptance must execute the declared published compatible CLI');
}

function removeSandbox(sandbox, remove = rmSync) {
  const options = { recursive: true, force: true, maxRetries: 3, retryDelay: 100 };
  for (let attempt = 0; attempt <= options.maxRetries; attempt += 1) {
    try {
      remove(sandbox, options);
      return;
    } catch (error) {
      if (error?.code !== 'ENOTEMPTY' || attempt === options.maxRetries) throw error;
    }
  }
}

test('R3.12: temporary acceptance sandbox retries a transient ENOTEMPTY cleanup', () => {
  let attempts = 0;
  removeSandbox('/tmp/awm-r14-test', (target, options) => {
    assert.equal(target, '/tmp/awm-r14-test');
    assert.deepEqual(options, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
    attempts += 1;
    if (attempts === 1) {
      const error = new Error('directory not empty');
      error.code = 'ENOTEMPTY';
      throw error;
    }
  });
  assert.equal(attempts, 2);
});

test('R3.1/R3.2/R3.3/R3.12: published CLI preserves legacy and rejects a partial kernel', () => {
  requirePublishedR3a();
  const sandbox = mkdtempSync(path.join(os.tmpdir(), 'awm-r14-'));
  try {
    const home = path.join(sandbox, 'home');
    const legacy = path.join(sandbox, 'legacy');
    const candidate = path.join(sandbox, 'candidate');
    copyProject(legacyFixture, legacy);
    copyProject(candidateFixture, candidate);
    installRegistry(home);

    const legacyResult = runPreflight(legacy, home);
    assert.equal(legacyResult.status, 0, legacyResult.stdout + legacyResult.stderr);
    assert.match(legacyResult.stdout, /context-kernel[\s\S]*legacy full context/i);

    const candidateResult = runPreflight(candidate, home);
    assert.equal(candidateResult.status, 0, candidateResult.stdout + candidateResult.stderr);
    assert.match(candidateResult.stdout, /context-kernel[\s\S]*valid/i);

    rmSync(path.join(candidate, '.awm/context/index.json'));
    const partialResult = runPreflight(candidate, home);
    assert.notEqual(partialResult.status, 0, partialResult.stdout + partialResult.stderr);
    assert.match(partialResult.stdout, /context-kernel[\s\S]*(degraded|invalid|partial|missing)/i);
  } finally {
    removeSandbox(sandbox);
  }
});
