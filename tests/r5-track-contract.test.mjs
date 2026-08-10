import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const skill = async (name) => readFile(new URL(`../skills/${name}/SKILL.md`, import.meta.url), 'utf8');

test('writing-plans emits mechanically parseable track contract (R1.1, R1.5, C4)', async () => {
  const text = await skill('writing-plans');
  for (const token of ['## Tracks', '**Track:**', '**Integration argv:**', '**Integration paths:**', 'JSON string[]']) {
    assert.ok(text.includes(token), `writing-plans missing ${token}`);
  }
  assert.ok(text.includes('| Track | Depends on | Shared resources |'));
  assert.match(text, /no dependency[^\n]*none|none[^\n]*no dependency/i);
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
