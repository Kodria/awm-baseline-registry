import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

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
