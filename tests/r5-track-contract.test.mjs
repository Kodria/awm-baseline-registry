import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const skill = async (name) => readFile(new URL(`../skills/${name}/SKILL.md`, import.meta.url), 'utf8');

test('compact v1 authoring returns planning-required for parallel tracks (RF-1.2)', async () => {
  const text = await skill('writing-plans');
  const start = text.indexOf('## Compact-only authoring');
  const end = text.indexOf('## Historical migration', start);
  const scope = text.slice(start, end);
  const rule = 'unsafe slice boundaries, or parallel tracks return `planning-required`; do not write an executable implementation plan.';
  assert.ok(scope.includes(rule));
  assert.doesNotMatch(text, /## Tracks|\*\*Integration argv:\*\*/);
  assert.ok(!scope.replace(rule, '').includes(rule), 'the actual parallel planning rejection is mutation-sensitive');
});

test('SDD track mode scopes tasks and skips plan writes/global QA (R2.2, R3.2-R3.5, C6)', async () => {
  const text = await skill('subagent-driven-development');
  for (const token of ['AWM-INTEGRATION: track-mode', 'trackContext.taskIds', 'computeTrackGate', 'planDigest', 'DO NOT modify the plan', 'DO NOT invoke', 'post-implementation-qa']) {
    assert.ok(text.includes(token), `subagent-driven-development missing ${token}`);
  }
});

test('post QA refuses track context and runs only after final merge (R3.4, R3.6, C3)', async () => {
  const text = await skill('post-implementation-qa');
  assert.ok(text.includes('AWM-INTEGRATION: final-head-only'));
  assert.ok(text.includes('.awm/track.json'));
  assert.ok(text.includes('MERGED_UNVERIFIED'));
  assert.ok(text.includes('clean committed HEAD'));
});
