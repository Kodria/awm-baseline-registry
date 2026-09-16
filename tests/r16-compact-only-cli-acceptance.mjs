import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { requireCompatibleRuntime } from './compatible-cli-runtime.mjs';
import { runInstalledAdmissionAcceptance } from './installed-admission-acceptance.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const awm = process.env.AWM_R4A_BIN || 'awm';
const fixture = 'tests/fixtures/compact-slices-v1/reference-example.md';
const invoke = args => spawnSync(awm, args, { cwd: root, encoding: 'utf8', timeout: 30_000, maxBuffer: 20_000 });
test('RF-2.5 consumed registry rejects old/mismatched CLI before dispatch; installed pair must actually admit', async () => {
  requireCompatibleRuntime(awm, root);
  await runInstalledAdmissionAcceptance(awm, root, { negativesOnly: process.env.AWM_R16_INSTALLED_ACCEPTANCE !== '1', publishedRemote: process.env.AWM_R16_PUBLISHED_ACCEPTANCE === '1' });
  if (process.env.AWM_R16_INSTALLED_ACCEPTANCE !== '1') process.stderr.write('R16 installed matched-pair acceptance BLOCKED pending compatible published CLI; only prerelease negatives checked\n');
});
function parse(result, status, state) {
  assert.equal(result.status, status, result.stderr.slice(0, 2000));
  assert.ok((result.stdout + result.stderr).length < 15_000);
  const report = JSON.parse(result.stdout);
  assert.equal(report.state, state);
  return report;
}
test('RF-1.3/1.4/2.1/2.3 canonical reference is compiled-valid and all non-valid states fail closed', () => {
  requireCompatibleRuntime(awm, root);
  const valid = parse(invoke(['plan', 'validate', fixture, '--cwd', root, '--json']), 0, 'valid');
  assert.match(valid.planDigest, /^[a-f0-9]{64}$/);
  const sandbox = mkdtempSync(path.join(root, 'tests', '.r16-adversarial-'));
  try {
    const source = readFileSync(path.join(root, fixture), 'utf8');
    const cases = [
      ['unmarked', '# Historical plan\n- [x] Claimed completion\n', 'migration-required'],
      ['future', source.replace('"schema":"compact-slices/v1"', '"schema":"compact-slices/v99"'), 'unsupported'],
      ['missing', source.replace('#### Edge cases', '#### Removed'), 'invalid'],
      ['duplicate', source.replace('#### Evidence', '#### Evidence\nDuplicated evidence.\n#### Evidence'), 'invalid'],
      ['malformed', source.replace('"schema":', '"schema"'), 'invalid'],
    ];
    for (const [name, body, state] of cases) {
      const file = path.join(sandbox, `${name}.md`); writeFileSync(file, body);
      parse(invoke(['plan', 'validate', file, '--cwd', root, '--json']), 2, state);
      const admission = parse(invoke(['plan', 'admit', file, '--provider', 'codex', '--cwd', root, '--require-current', '--verify-sensors', '--json']), 2, 'blocked');
      assert.equal(admission.planState, state);
    }
  } finally { rmSync(sandbox, { recursive: true, force: true }); }
});

test('RF-1.5 documented read-only lifecycle commands exist on the paired compiled CLI', () => {
  requireCompatibleRuntime(awm, root);
  const sandbox = mkdtempSync(path.join(os.tmpdir(), 'awm-r16-public-'));
  try {
    const git = spawnSync('git', ['init', '-q', sandbox], { encoding:'utf8', timeout:5000 });
    assert.equal(git.status,0,git.stderr);
    const status = spawnSync(awm, ['watch','journal-status','--json'], { cwd:sandbox, encoding:'utf8', timeout:15_000, maxBuffer:10_000 });
    const report=parse(status,0,'missing');
    assert.equal(report.bootstrapUnused,false);
    for (const command of [['watch','archive-unused','--help'],['plan','migration-facts','--help']]) {
      const result=invoke(command); assert.equal(result.status,0,result.stderr);
      assert.match(result.stdout,/Usage:/);
    }
  } finally { rmSync(sandbox,{recursive:true,force:true}); }
});
