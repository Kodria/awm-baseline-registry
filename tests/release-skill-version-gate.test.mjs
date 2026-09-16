import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const root = new URL('..', import.meta.url);
const read = relative => readFileSync(new URL(relative, root), 'utf8');

function assertReleaseVersionGate(workflow) {
  const verificationStart = workflow.indexOf('- name: Verify registry before tagging');
  const tagStart = workflow.indexOf('- name: Compute and push next tag');
  assert.ok(verificationStart >= 0 && tagStart > verificationStart,
    'auto-tag must verify the registry before computing a delivery tag');

  const verification = workflow.slice(verificationStart, tagStart);
  assert.match(verification,
    /^\s*\.\/scripts\/check-skill-version-bumps\.sh "\$\{\{ github\.event\.before \}\}" HEAD\s*$/m,
    'the release verification step must execute the version/bundle gate against the pushed commit range');
}

test('auto-tag executes the version and bundle gate before creating a delivery tag', () => {
  assertReleaseVersionGate(read('.github/workflows/auto-tag.yml'));
});

test('validation and release workflows run the release version-gate contract', () => {
  for (const workflow of ['validate.yml', 'auto-tag.yml']) {
    assert.match(read(`.github/workflows/${workflow}`), /node tests\/release-skill-version-gate\.test\.mjs/,
      `${workflow} must run the release version-gate contract`);
  }
});

test('RED mutation: commenting out the release command is rejected', () => {
  const original = read('.github/workflows/auto-tag.yml');
  const weakened = original.replace(
    './scripts/check-skill-version-bumps.sh "${{ github.event.before }}" HEAD',
    '# ./scripts/check-skill-version-bumps.sh "${{ github.event.before }}" HEAD',
  );
  assert.throws(() => assertReleaseVersionGate(weakened), /must execute the version\/bundle gate/i);
});

test('RF-6.1 release gate actually executes on native Bash including macOS 3.2', () => {
  const result = spawnSync('/bin/bash', ['scripts/check-skill-version-bumps.sh', 'origin/main'], {
    cwd: fileURLToPath(root), encoding: 'utf8', timeout: 30_000, maxBuffer: 10_000,
  });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /every edited SKILL.md and affected bundle\/catalog version advanced/);
});

test('RF-6.1 Bash gate rejects actual unbumped skills and bundle/catalog mismatches', () => {
  const sandbox = mkdtempSync(path.join(os.tmpdir(), 'awm-bash-release-'));
  const command = (program, args) => spawnSync(program, args, { cwd: sandbox, encoding: 'utf8', timeout: 10_000, maxBuffer: 10_000 });
  const git = args => { const result=command('git',args); assert.equal(result.status,0,result.stderr); return result.stdout.trim(); };
  const put = (file, content) => writeFileSync(path.join(sandbox,file),content);
  try {
    mkdirSync(path.join(sandbox,'skills/demo'),{recursive:true});
    mkdirSync(path.join(sandbox,'bundles/dev'),{recursive:true});
    git(['init','-q']); git(['config','user.name','Release gate test']); git(['config','user.email','gate@example.invalid']);
    const skill = version => `---\nname: demo\nversion: "${version}"\n---\n# Demo\n`;
    const bundle = version => JSON.stringify({name:'dev',version,skills:['demo']});
    const catalog = version => JSON.stringify({bundles:[{name:'dev',version}]});
    put('skills/demo/SKILL.md',skill('1.0.0')); put('bundles/dev/bundle.json',bundle('1.0.0')); put('catalog.json',catalog('1.0.0'));
    git(['add','.']); git(['commit','-qm','baseline']); const base=git(['rev-parse','HEAD']);
    put('skills/demo/SKILL.md',skill('2.0.0')+'New process behavior.\n'); put('bundles/dev/bundle.json',bundle('2.0.0')); put('catalog.json',catalog('2.0.0'));
    git(['add','.']); git(['commit','-qm','feature']);
    const gate = () => command('/bin/bash',[fileURLToPath(new URL('scripts/check-skill-version-bumps.sh',root)),base]);
    assert.equal(gate().status,0);
    put('skills/demo/SKILL.md',skill('1.0.0')+'New process behavior.\n'); const missing=gate();
    assert.notEqual(missing.status,0); assert.match(missing.stdout,/version is unchanged/);
    put('skills/demo/SKILL.md',skill('2.0.0')); put('catalog.json',catalog('1.0.0')); const mismatch=gate();
    assert.notEqual(mismatch.status,0); assert.match(mismatch.stdout,/version differs/);
    put('catalog.json',catalog('2.0.0')); assert.equal(gate().status,0);
  } finally { rmSync(sandbox,{recursive:true,force:true}); }
});
