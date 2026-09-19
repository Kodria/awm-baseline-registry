import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// This is real Git transport/CLI/sensor execution, not a mocked currentness verdict.
// The prepublication fixture tag is deliberately NOT public registry release proof.
export function assertNoDispatchCustody(cwd) {
  assert.equal(existsSync(path.join(cwd, '.awm', 'journal')), false, 'read-only admission must not create journal custody');
}
export async function runInstalledAdmissionAcceptance(bin, root, { negativesOnly = false, publishedRemote = false } = {}) {
  const sandbox = mkdtempSync(path.join(os.tmpdir(), 'awm-r16-installed-'));
  const operatorHome = mkdtempSync(path.join(os.tmpdir(), 'awm-r16-operator-'));
  const home = path.join(sandbox, 'installation');
  const registry = path.join(home, 'registries', 'baseline');
  let remote = 'https://github.com/Kodria/awm-baseline-registry.git';
  // npm writes cache/logs under HOME: operator state must not live in the
  // consumer worktree or read-only admission correctly rejects that mutation.
  const env = { ...process.env, HOME: operatorHome, NPM_CONFIG_CACHE: path.join(operatorHome, '.npm'), AWM_HOME: home, AWM_NO_UPDATE_CHECK: '1', GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_COUNT: '0' };
  const run = (program, args, cwd = sandbox) => spawnSync(program, args, { cwd, env, encoding: 'utf8', timeout: 30_000, maxBuffer: 30_000 });
  const ok = (program, args, cwd) => { const result = run(program, args, cwd); assert.equal(result.status, 0, `${program} ${args.join(' ')}: ${[(result.stdout ?? ''), (result.stderr ?? ''), (result.error?.message ?? '')].join('\n').slice(0, 4000)}`); return result.stdout.trim(); };
  const json = (args, status) => { const result = run(bin, args); assert.equal(result.status, status, [(result.stdout ?? ''), (result.stderr ?? ''), (result.error?.message ?? '')].join('\n').slice(0, 4000)); assert.ok(result.stdout.length < 20_000); return JSON.parse(result.stdout); };
  let server;
  try {
    mkdirSync(path.dirname(registry), { recursive: true });
    mkdirSync(path.join(sandbox, '.awm'));
    writeFileSync(path.join(home, 'preferences.json'), JSON.stringify({ defaultAgent: 'codex', enabledAgents: ['codex'], installMethod: 'copy', defaultScope: 'local' }));
    if (publishedRemote) {
      ok('git', ['clone', '--quiet', remote, registry]);
      // Explicit expected release tag is mandatory; never accept previous public content.
      assert.match(process.env.AWM_R16_RELEASE_TAG || '', /^v\d+\.\d+\.\d+$/);
      ok('git', ['checkout', '--quiet', process.env.AWM_R16_RELEASE_TAG], registry);
      assert.equal(readFileSync(path.join(registry, 'awm-registry.json'), 'utf8'), readFileSync(path.join(root, 'awm-registry.json'), 'utf8'));
    } else {
      mkdirSync(registry);
      for (const entry of ['skills', 'sensor-packs', 'bundles', 'catalog.json', 'awm-registry.json']) cpSync(path.join(root, entry), path.join(registry, entry), { recursive: true, filter: file => !file.includes('__pycache__') });
      ok('git', ['init', '--quiet'], registry);
      ok('git', ['-c', 'user.name=R16 fixture', '-c', 'user.email=r16@example.invalid', 'add', '.'], registry);
      ok('git', ['-c', 'user.name=R16 fixture', '-c', 'user.email=r16@example.invalid', 'commit', '--quiet', '-m', 'Actual candidate fixture'], registry);
      ok('git', ['tag', 'v99.0.0'], registry);
      ok('git', ['clone', '--quiet', '--bare', registry, path.join(sandbox, 'baseline.git')]);
      ok('git', ['update-server-info'], path.join(sandbox, 'baseline.git'));
      const key = path.join(sandbox, 'fixture-key.pem'); const cert = path.join(sandbox, 'fixture-cert.pem');
      ok('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '1', '-subj', '/CN=localhost', '-addext', 'subjectAltName=DNS:localhost,IP:127.0.0.1', '-keyout', key, '-out', cert]);
      env.GIT_SSL_CAINFO = cert;
      server = spawn(process.execPath, [path.join(root, 'tests/fixtures/compact-slices-v1/git-https-server.mjs'), sandbox, key, cert], { stdio: ['ignore', 'pipe', 'pipe'] });
      const port = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('fixture HTTPS server startup timed out')), 5000);
        server.once('error', reject); server.once('exit', code => reject(new Error(`fixture server exited ${code}`)));
        server.stdout.once('data', data => { clearTimeout(timeout); resolve(data.toString().trim()); });
      });
      assert.match(port, /^\d+$/);
      remote = `https://127.0.0.1:${port}/baseline.git`;
      ok('git', ['remote', 'add', 'origin', remote], registry);
    }
    writeFileSync(path.join(home, 'registries.json'), JSON.stringify([{ name: 'baseline', remote }]));
    const actual = ok(bin, ['--version']);
    const candidate = JSON.parse(readFileSync(path.join(root, 'awm-registry.json'), 'utf8')).minCliVersion;
    const sourceCommit = ok('git', ['rev-parse', 'HEAD'], root);
    const installedCommit = ok('git', ['rev-parse', 'HEAD'], registry);
    if (publishedRemote) assert.equal(installedCommit, sourceCommit, 'published registry tag must be the exact candidate commit');
    process.stderr.write(`R16 provenance=${publishedRemote ? 'published-remote' : 'local-git-fixture'} candidate=${sourceCommit} installed=${installedCommit} cli=${actual}; fixture transport is not public release evidence\n`);
    const plan = readFileSync(path.join(root, 'tests/fixtures/compact-slices-v1/reference-example.md'), 'utf8')
      .replace('"path":"skills/writing-plans/SKILL.md"', '"path":"installation/registries/baseline/skills/writing-plans/SKILL.md"');
    writeFileSync(path.join(sandbox, 'plan.md'), plan);
    ok('git', ['init', '--quiet'], sandbox);
    const args = ['plan', 'admit', 'plan.md', '--provider', 'codex', '--cwd', sandbox, '--require-current', '--verify-sensors', '--json'];
    const valid = json(['plan', 'validate', 'plan.md', '--cwd', sandbox, '--json'], 0);
    assert.equal(valid.state, 'valid');
    const oldBin = process.env.AWM_R16_OLD_CLI_BIN;
    if (!negativesOnly) assert.ok(oldBin, 'installed acceptance must include the unmodified published CLI 9.7.1 negative control');
    if (oldBin) {
      assert.equal(ok(oldBin, ['--version']), '9.7.1');
      // Published 9.7.1 predates plan admit: its public preflight is the real
      // compatibility diagnostic, not an invented invocation or modified artifact.
      const old = run(oldBin, ['preflight', '--cwd', sandbox, '--require-current', '--json']);
      assert.notEqual(old.status, 0);
      const report = JSON.parse(old.stdout);
      const compatibility = report.checks.find(check => check.id === 'compatibility');
      assert.ok(compatibility, JSON.stringify(report));
      assert.equal(compatibility.ok, false);
      assert.match(compatibility.detail, /baseline requires CLI >= 9\.9\.0/);
      assertNoDispatchCustody(sandbox);
    }
    const assertIncompatible = (minimum, expectedActual) => {
      const manifest = JSON.parse(readFileSync(path.join(registry, 'awm-registry.json'), 'utf8'));
      writeFileSync(path.join(registry, 'awm-registry.json'), JSON.stringify({ ...manifest, minCliVersion: minimum }));
      const report = json(args, 2);
      assert.equal(report.state, 'blocked'); assert.equal(report.planState, 'valid');
      assert.equal(report.planDigest, valid.planDigest);
      const diagnostic = report.diagnostics.find(item => item.code === 'ADMISSION_REGISTRY_CLI_INCOMPATIBLE');
      assert.ok(diagnostic, JSON.stringify(report));
      assert.ok(diagnostic.message.includes('registry:baseline'));
      assert.ok(diagnostic.message.includes(minimum)); assert.ok(diagnostic.message.includes(expectedActual));
      assertNoDispatchCustody(sandbox);
    };
    if (actual === '9.7.1') assertIncompatible(candidate, actual);
    assertIncompatible('99.0.0', actual);
    if (negativesOnly) return { kind: 'prerelease-negative-controls', actual, custody: 'journal-absent' };
    assert.equal(actual, candidate, 'matched installed acceptance requires the actual released compatible CLI; prerelease is not a PASS');
    assert.equal(ok('npm', ['--version']), '10.8.3', 'use the genuinely certified npm-script runtime');
    cpSync(path.join(root, 'tests/fixtures/npm-script-certification/package.json'), path.join(sandbox, 'package.json'));
    cpSync(path.join(root, 'tests/fixtures/npm-script-certification/test.mjs'), path.join(sandbox, 'test.mjs'));
    cpSync(path.join(root, 'awm-registry.json'), path.join(registry, 'awm-registry.json'));
    // This consumer selects only its project-owned npm test surface. Bootstrap
    // of the whole js-ts pack would require real lint/security/depcheck tools.
    // Use the exact installed npm artifact's internal resolver and serializer,
    // never a checkout, invented compatibility, or a modified sensor pack.
    const binPath = path.isAbsolute(bin) ? bin : (env.PATH || '').split(path.delimiter)
      .map(directory => path.join(directory, bin)).find(candidatePath => existsSync(candidatePath));
    assert.ok(binPath, 'installed CLI executable must resolve physically');
    const cliRoot = path.resolve(path.dirname(realpathSync(binPath)), '../..');
    assert.equal(JSON.parse(readFileSync(path.join(cliRoot, 'package.json'), 'utf8')).version, actual);
    const materialize = `
      const fs = require('fs'), path = require('path'), assert = require('assert/strict');
      const base = path.join(process.argv[1], 'dist/src/commands/sensors/compatibility');
      const {parseSensorPack} = require(path.join(base, 'contract.js'));
      const {resolvePackSource} = require(path.join(base, 'pack-source.js'));
      const {resolveParsedPackCompatibility} = require(path.join(base, 'live.js'));
      const {serializeManifestV3} = require(path.join(base, 'manifest.js'));
      const source = resolvePackSource('js-ts', {registries:[{name:'baseline', remote:'local', contentRoot:process.argv[2]}]});
      const pack = parseSensorPack(JSON.parse(source.content), source.path).pack;
      resolveParsedPackCompatibility(process.cwd(), pack).then(live => {
        const evidence = live.sensors.test;
        assert.equal(evidence.state, 'certified'); assert.equal(evidence.variantId, 'npm-script');
        assert.equal(evidence.toolVersion, '10.8.3');
        const sensor = live.pack.sensors.test, variant = sensor.variants.find(item => item.id === evidence.variantId);
        const manifest = {schemaVersion:3, mode:'project-sensors', pack:'js-ts', source:{registry:'baseline'}, sensors:{
          test:{enabled:true, fast:sensor.fast, timeout:sensor.timeout, variantId:variant.id,
            command:variant.command, assets:variant.assets, initializedCompatibility:evidence}}};
        process.stdout.write(serializeManifestV3(manifest));
      }).catch(error => {console.error(error); process.exitCode=1;});
    `;
    const sensorsPath = path.join(sandbox, '.awm', 'sensors.json');
    writeFileSync(sensorsPath, ok(process.execPath, ['-e', materialize, cliRoot, registry]));
    const sensors = JSON.parse(readFileSync(sensorsPath, 'utf8'));
    assert.equal(sensors.sensors.test.variantId, 'npm-script');
    assert.equal(sensors.sensors.test.initializedCompatibility.state, 'certified');
    assert.deepEqual(Object.keys(sensors.sensors), ['test']);
    ok('git', ['add', '.']);
    ok('git', ['-c', 'user.name=R16 fixture', '-c', 'user.email=r16@example.invalid', 'commit', '--quiet', '-m', 'Actual admitted project']);
    const admitted = json(args, 0);
    assert.equal(admitted.state, 'admitted'); assert.equal(admitted.planDigest, valid.planDigest);
    assert.equal(admitted.currentness, 'current'); assert.equal(admitted.sensors, 'pass');
    assertNoDispatchCustody(sandbox);
    // Negative control: npm logs inside the worktree are a real mutation, not
    // a mocked sensor verdict; admission must reject it without new custody.
    env.NPM_CONFIG_CACHE = path.join(sandbox, '.npm-mutation-negative');
    const mutated = json(args, 2);
    assert.equal(mutated.state, 'blocked'); assert.equal(mutated.sensors, 'not-certified');
    assert.ok(mutated.diagnostics.some(item => item.code === 'ADMISSION_SENSORS_BLOCKED'));
    assertNoDispatchCustody(sandbox);
    // This observes journal side effects, not the provider's native dispatch
    // mechanism. Supervisor zero-dispatch is covered by its actual gate tests.
    return { kind: publishedRemote ? 'published-remote' : 'local-git-fixture', actual, installedCommit, custody: 'journal-absent' };
  } finally {
    if (server && server.exitCode === null) { const exited = new Promise(resolve => server.once('exit', resolve)); server.kill(); await exited; }
    rmSync(sandbox, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
    rmSync(operatorHome, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  }
}
