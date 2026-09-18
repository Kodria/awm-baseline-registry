import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
test('B1 v2 producer is semantic and preserves v1 fallback', () => {
  const skill = read('skills/writing-plans/SKILL.md');
  const v2 = read('skills/writing-plans/references/compact-slices-v2.md');
  const consumer = read('skills/subagent-driven-development/references/model-routing-v1.md');
  const sdd = read('skills/subagent-driven-development/SKILL.md');
  const fixture = read('tests/fixtures/compact-slices-v2/reference-example.md');
  for (const profile of ['mechanical', 'integration', 'judgment']) assert.match(v2, new RegExp(`\\b${profile}\\b`));
  assert.match(skill, /never a concrete model or vendor/i);
  assert.match(skill, /author valid compact v1.*routing unavailable/i);
  assert.match(consumer, /blocked result means zero dispatch/i);
  assert.match(consumer, /applied acknowledgement/i);
  assert.match(consumer, /awm job routing-report --json/, 'consumer must invoke the public aggregate report contract');
  assert.match(consumer, /compact-slices\/v2/i, 'consumer must require explicit v2 contract support');
  assert.match(consumer, /policy.*capability.*otherwise.*zero dispatch/is, 'consumer must make routing readiness fail closed');
  assert.match(sdd, /references\/model-routing-v1\.md/, 'loaded SDD consumer must name sole routing reference');
  assert.match(sdd, /compact-slices\/v1` or `compact-slices\/v2/, 'loaded SDD consumer must support both schemas');
  assert.doesNotMatch(sdd, /Do not add semantic profiles/i, 'loaded SDD must not retain the obsolete v2 prohibition');
  assert.throws(() => assert.match(sdd.replace('references/model-routing-v1.md', ''), /references\/model-routing-v1\.md/), 'removing the loaded reference must fail');
  assert.throws(() => assert.match(consumer.replace(/policy.*capability.*otherwise.*zero dispatch/is, ''), /policy.*capability.*otherwise.*zero dispatch/is), 'removing the readiness consequence must fail');
  for (const profile of ['mechanical', 'integration', 'judgment']) assert.match(fixture, new RegExp(`"implementerProfile":"${profile}"`));
  assert.throws(() => assert.match(v2.replaceAll('integration', 'vendor-x'), /\bintegration\b/));
});

test('B2 native consumers preserve the sole routing reference and role custody', () => {
  const consumers = [
    ['skills/subagent-driven-development/implementer-prompt.md', 'routed implementer obligation'],
    ['skills/subagent-driven-development/spec-reviewer-prompt.md', 'routed specification-reviewer obligation'],
    ['skills/subagent-driven-development/code-quality-reviewer-prompt.md', 'routed code-quality-reviewer obligation'],
    ['skills/executing-plans/SKILL.md', 'routed controller obligation'],
    ['skills/development-process/SKILL.md', 'routed controller obligation'],
    ['skills/post-implementation-qa/SKILL.md', 'routed track-a-qa obligation'],
    ['skills/post-implementation-qa/deep-review-prompt.md', 'routed track-b-qa obligation'],
    ['skills/verification-before-completion/SKILL.md', 'routed final-reviewer obligation'],
    ['skills/post-implementation-docs/SKILL.md', 'routed documentation obligation'],
    ['skills/harness-retro/SKILL.md', 'routed retro obligation'],
    ['skills/finishing-a-development-branch/SKILL.md', 'routed finishing obligation'],
  ];
  for (const [file, obligation] of consumers) {
    const body = read(file);
    assert.match(body, /references\/model-routing-v1\.md/, `${file} must load the sole routing reference`);
    assert.match(body, new RegExp(obligation), `${file} must bind its own routing role`);
    assert.throws(() => assert.match(body.replace('references/model-routing-v1.md', ''), /references\/model-routing-v1\.md/), `${file} must reject a missing routing reference`);
  }
  const reference = read('skills/subagent-driven-development/references/model-routing-v1.md');
  for (const clause of ['current CLI resolution', 'applied ack', 'mismatch blocks', 'unknown dispatch outcome requires custody reconciliation', 'Emission receipts are not applied acks']) assert.match(reference, new RegExp(clause), `reference must retain ${clause}`);
  for (const role of ['specification-reviewer', 'code-quality-reviewer', 'final-reviewer', 'architecture', 'track-a-qa', 'track-b-qa', 'controller']) assert.match(reference, new RegExp(`\`${role}\``), `reference must retain full role ${role}`);
  for (const target of ['claude-code', 'codex', 'opencode', 'cursor', 'copilot', 'antigravity']) assert.match(reference, new RegExp(`\`${target}\``), `reference must retain target ${target}`);
  assert.match(reference, /documented native control is not native acceptance/i);
  assert.doesNotMatch(reference, /vendor-specific|provider fork/i, 'routing reference must not create provider forks');
});
