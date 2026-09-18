import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
test('B1 v2 producer is semantic and preserves v1 fallback', () => {
  const skill = read('skills/writing-plans/SKILL.md');
  const v2 = read('skills/writing-plans/references/compact-slices-v2.md');
  const consumer = read('skills/subagent-driven-development/references/model-routing-v1.md');
  for (const profile of ['mechanical', 'integration', 'judgment']) assert.match(v2, new RegExp(`\\b${profile}\\b`));
  assert.match(skill, /never a concrete model or vendor/i);
  assert.match(skill, /author valid compact v1.*routing unavailable/i);
  assert.match(consumer, /blocked result means zero dispatch/i);
  assert.match(consumer, /applied acknowledgement/i);
  assert.throws(() => assert.match(v2.replaceAll('integration', 'vendor-x'), /\bintegration\b/));
});
