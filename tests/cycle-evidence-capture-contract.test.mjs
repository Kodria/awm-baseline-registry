import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

const read = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
function closure(skill) {
  const start = skill.indexOf('### 11. Capture and close the retro');
  const end = skill.indexOf('## Anti-patterns', start);
  assert.ok(start >= 0 && end > start);
  return skill.slice(start, end);
}
const required = [
  'Use only the explicit admitted active_plan and its CLI identity; never resolve another plan by filename, mtime, marker, or checkbox scans.',
  'Read minCliVersion only when this project contains awm-registry.json; a CLI project without registry metadata must not invent that file or fail merely because it is absent.',
  'Query the current branch with `awm watch journal-status --json`; a global .awm/journal directory is never evidence of an active branch journal.',
  'Only a present, non-bootstrapUnused journal with cycleState COMPLETE and a passing current interlock permits cycle evidence capture.',
  'Missing journal skips capture explicitly with manual/native QA evidence and no fabricated cycle; an unattended native session without durable custody legitimately has no journal, and awm-routed work never dispatches without one.',
  'Corrupt, nonterminal, or mismatched journal blocks capture and archive; unused bootstrap state is administrative abandonment, never completed execution.',
];
function assertClosure(skill) {
  const body = closure(skill);
  for(const rule of required) assert.ok(body.includes(rule), `missing closure rule: ${rule}`);
  assert.ok(body.includes('awm evidence capture --plan "$active_plan" || {'), 'failed capture blocks archive');
  assert.ok(body.includes('awm ledger archive'), 'archive remains mandatory');
  assert.ok(body.includes('awm ledger list'), 'archive must be verified');
  assert.ok(!body.includes('ls -t "$PLANS_DIR"'), 'no heuristic active-plan resolver');
  assert.ok(!body.includes('[ -d "$JOURNAL_DIR" ]'), 'no global journal-presence test');
}
test('RF-3.1/3.2/5.5 retro has project-aware compatibility and current-branch capture', () => assertClosure(read('skills/harness-retro/SKILL.md')));
test('RED mutation rejects every exact closure sentence independently', () => {
  const text = read('skills/harness-retro/SKILL.md'); assertClosure(text);
  for(const rule of required) assert.throws(() => assertClosure(text.replace(rule, '')), /missing closure rule/);
});
test('RF-2.5 executable registry floor accepts no-registry CLI context and rejects malformed or old registry versions', () => {
  const body = closure(read('skills/harness-retro/SKILL.md'));
  const snippet = body.match(/<!-- retro-compatibility-script -->\n```bash\n([\s\S]*?)\n```/)[1];
  const sandbox = mkdtempSync(path.join(os.tmpdir(), 'awm-retro-floor-'));
  try {
    const run = version => spawnSync('bash', ['-c', `awm() { printf '%s\\n' '${version}'; }\n${snippet}`], { cwd:sandbox, encoding:'utf8', timeout:5000 });
    assert.equal(run('9.7.1').status, 0, 'CLI project without registry metadata cannot be blocked by a fabricated floor');
    writeFileSync(path.join(sandbox,'awm-registry.json'), JSON.stringify({minCliVersion:'invalid'}));
    assert.notEqual(run('9.8.0').status, 0);
    writeFileSync(path.join(sandbox,'awm-registry.json'), JSON.stringify({minCliVersion:'9.8.0'}));
    const old=run('9.7.1'); assert.notEqual(old.status,0); assert.match(old.stderr,/does not meet required/);
    assert.equal(run('9.8.0').status,0);
    assert.equal(run('10.0.0').status,0);
  } finally { rmSync(sandbox,{recursive:true,force:true}); }
});
test('RF-6.1 actual validation and release jobs retain this executable contract', () => {
  for (const workflow of ['validate.yml','auto-tag.yml']) assert.ok(read(`.github/workflows/${workflow}`).includes('node tests/cycle-evidence-capture-contract.test.mjs'));
});
test('RF-3.2 executable missing-current-branch recipe never captures retained global journals', () => {
  const body = closure(read('skills/harness-retro/SKILL.md'));
  const snippet = body.match(/```bash\n(test -n "\$active_plan"[\s\S]*?)\n```/)[1];
  const run = state => spawnSync('bash', ['-c', `
active_plan=docs/plans/current.md
active_provider=codex
manual_qa_evidence=durable-manual-review-reference
awm() {
  if [ "$1 $2" = "watch journal-status" ]; then printf '%s\\n' '${state}';
  elif [ "$1 $2" = "evidence capture" ]; then printf 'CAPTURE_CALLED\\n';
  else return 0; fi
}
${snippet}`], { encoding:'utf8', timeout:5000, maxBuffer:10000 });
  const missing=run('{"state":"missing"}');
  assert.equal(missing.status,0,missing.stderr);
  assert.doesNotMatch(missing.stdout,/CAPTURE_CALLED/);
  assert.match(missing.stderr,/Skipping cycle evidence capture/);
  assert.notEqual(run('{"state":"corrupt"}').status,0);
  assert.notEqual(run('{"state":"present","cycleState":"IN_PROGRESS","bootstrapUnused":true}').status,0);
  const complete=run('{"state":"present","cycleState":"COMPLETE","bootstrapUnused":false}');
  assert.equal(complete.status,0,complete.stderr); assert.match(complete.stdout,/CAPTURE_CALLED/);
});
