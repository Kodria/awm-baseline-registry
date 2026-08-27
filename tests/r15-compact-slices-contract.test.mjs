import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const root = new URL('..', import.meta.url);
const read = relative => readFileSync(new URL(relative, root), 'utf8');

const SLICE_SECTIONS = [
  '## Behavior and surfaces',
  '## Interfaces and sequence',
  '## Edge cases and evidence',
  '## Commands',
  '## Risks and fallback',
];

function assertCompactReference(text) {
  assert.match(text, /compact-slices\/v1/, 'manifest schema must be exact');
  for (const section of SLICE_SECTIONS) assert.ok(text.includes(section), `missing slice section: ${section}`);
  assert.match(text, /one requirement owner/i, 'each requirement needs one owner');
  assert.match(text, /source IDs?[\s\S]{0,180}authoritative/i, 'sources must be stable and authoritative');
  assert.match(text, /commands?[\s\S]{0,180}inert/i, 'commands must be inert');
  assert.match(text, /do not delegate[\s\S]{0,180}(?:inspect|discover)/i, 'unsafe delegated discovery must be rejected');
  assert.match(text, /shared payload[\s\S]{0,180}(?:once|single)/i, 'shared payload must be stated once');
}

function assertCompactRouting(text) {
  assert.match(text, /formed serial plan/i, 'compact routing needs a formed serial plan');
  assert.match(text, /explicitly sliceable requirements/i, 'compact routing needs explicitly sliceable requirements');
  assert.match(text, /compact-slices-v1\.md/, 'eligible compact plans must load the reference');
  assert.match(text, /inline[\s\S]{0,220}(?:insufficient|unavailable|unsafe)/i, 'insufficient sources must be inlined');
  assert.match(text, /awm plan validate PLAN_PATH/i, 'CLI validation must happen before handoff');
  assert.match(text, /(?:invalid|unsupported)[\s\S]{0,180}(?:block|stop)/i, 'invalid or unsupported compact plans must block');
  assert.match(text, /(?:no marker|no schema)[\s\S]{0,180}legacy/i, 'unmarked plans must retain legacy routing');
  assert.match(text, /Task Structure/, 'legacy Task syntax must remain');
  assert.match(text, /Parallel track declaration/, 'legacy parallel Tracks syntax must remain');
}

function assertStrictHandoff(text) {
  assert.match(text, /awm preflight --require-current/, 'strict currentness command is required');
  assert.match(text, /missing strict flag[\s\S]{0,180}(?:block|stop)/i, 'missing strict support must block handoff');
  assert.match(text, /validate PLAN_PATH[\s\S]{0,500}preflight --require-current[\s\S]{0,500}(?:handoff|execution)/i,
    'validation must precede strict currentness and handoff');
}

test('compact reference defines exact five-section serial slice contract (R4-CP-2, R4-CP-4, R4-CP-5)', () => {
  assertCompactReference(read('skills/writing-plans/references/compact-slices-v1.md'));
});

test('writing-plans routes only eligible compact plans and preserves legacy/parallel syntax (R4-CP-2, R4-CP-5)', () => {
  assertCompactRouting(read('skills/writing-plans/SKILL.md'));
});

test('writing-plans validates before strict currentness handoff (R4-CUR-6)', () => {
  assertStrictHandoff(read('skills/writing-plans/SKILL.md'));
});

test('plan reviewer rejects compact omissions, unsafe delegation, missing gates, legacy regressions, and structural-only efficiency claims (R4-CP-2, R4-CP-4, R4-CP-5, R4-CUR-6)', () => {
  const text = read('skills/writing-plans/plan-document-reviewer-prompt.md');
  for (const token of ['missing compact fields', 'unowned requirements', 'unsafe delegation', 'validation/currentness', 'legacy regression', 'structural evidence alone']) {
    assert.match(text, new RegExp(token, 'i'), `reviewer must reject ${token}`);
  }
});

test('development entry keeps strict currentness advisory while handoff owns the blocking rerun (R4-CUR-6)', () => {
  const text = read('skills/development-process/SKILL.md');
  assert.match(text, /awm preflight --require-current/);
  assert.match(text, /advisory[\s\S]{0,180}(?:one line|one bounded line)/i);
  assert.match(text, /without writes|no writes/i);
  assert.match(text, /do not repeatedly recheck/i);
  assert.match(text, /unattended handoff[\s\S]{0,220}(?:rerun|re-run)[\s\S]{0,180}(?:block|gate)/i);
});

test('RED mutations reject each compact-planning regression', () => {
  const reference = read('skills/writing-plans/references/compact-slices-v1.md');
  assert.throws(() => assertCompactReference(reference.replaceAll('## Commands', '## Removed commands')), /missing slice section/);
  assert.throws(() => assertCompactReference(reference.replace(/Do not delegate[\s\S]*?\n/, 'Delegate: go inspect the repo\n')), /unsafe delegated discovery/);
  assert.throws(() => assertCompactReference(reference.replace(/shared payload[\s\S]*?\n/i, '')), /shared payload/);

  const writing = read('skills/writing-plans/SKILL.md');
  assert.throws(() => assertStrictHandoff(writing.replace('awm plan validate PLAN_PATH', 'plan validation later')), /validation/);
  assert.throws(() => assertCompactRouting(writing.replace(/(?:no marker|no schema)[\s\S]{0,180}legacy/i, 'future schema is legacy')), /unmarked plans/);
  assert.throws(() => assertCompactRouting(writing.replaceAll('Task Structure', 'Compact task structure')), /legacy Task syntax/);
});
