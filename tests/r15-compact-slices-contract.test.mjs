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
  assert.match(text, /existing full-quality Task\/Tracks route/i,
    'legacy plans must retain the complete quality route, not compact assumptions');
}

function assertSharedPayloadBoundary(text) {
  assert.match(text, /shared payload[\s\S]{0,180}(?:once|single)/i,
    'shared payload must be declared once by stable ID');
  assert.match(text, /do not repeat shared commands or source prose in every step/i,
    'shared commands and payload must not be duplicated in every step');
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

test('compact reference declares shared payload and commands once by ID (R4-CP-5)', () => {
  assertSharedPayloadBoundary(read('skills/writing-plans/references/compact-slices-v1.md'));
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
  assert.throws(() => assertSharedPayloadBoundary(reference.replace(
    'do not repeat shared commands or source prose in every step',
    'repeat shared commands and payload in every step',
  )), /must not be duplicated/);

  const writing = read('skills/writing-plans/SKILL.md');
  assert.throws(() => assertStrictHandoff(writing.replace('awm plan validate PLAN_PATH', 'plan validation later')), /validation/);
  assert.throws(() => assertCompactRouting(writing.replace(/(?:no marker|no schema)[\s\S]{0,180}legacy/i, 'future schema is legacy')), /unmarked plans/);
  assert.throws(() => assertCompactRouting(writing.replaceAll('Task Structure', 'Compact task structure')), /legacy Task syntax/);
  assert.throws(() => assertCompactRouting(writing.replace(
    'existing full-quality Task/Tracks route',
    'compact assumptions route',
  )), /complete quality route/);
});

const S2_SDD = 'skills/subagent-driven-development/SKILL.md';
const S2_EXEC = 'skills/executing-plans/SKILL.md';
const S2_REVIEW = 'skills/requesting-code-review/SKILL.md';
const S2_QA = 'skills/post-implementation-qa/SKILL.md';
const S2_TEMPLATES = [
  'skills/subagent-driven-development/implementer-prompt.md',
  'skills/subagent-driven-development/spec-reviewer-prompt.md',
  'skills/subagent-driven-development/code-quality-reviewer-prompt.md',
];

function assertS2CompactStateMachine(text) {
  for (const state of ['pending', 'implementing', 'spec-review', 'quality-review', 'complete']) {
    assert.match(text, new RegExp(`\\b${state}\\b`), `missing compact state ${state}`);
  }
  assert.match(text, /amendment-required/, 'plan defects must exit to amendment-required');
  assert.match(text, /fresh specification reviewer/i, 'spec reviewer must be fresh');
  assert.match(text, /fresh code-quality reviewer/i, 'quality reviewer must be fresh');
  assert.match(text, /both reviewers[^.]{0,120}clean/i, 'both clean reviewers gate completion');
  assert.match(text, /reconcile[^.]{0,180}(?:files|file-derived)[^.]{0,180}truth/i, 'completion must reconcile durable truth');
  assert.match(text, /same implementer[^.]{0,160}fix/i, 'the original implementer owns review fixes');
}

function assertS2AmendmentAndRisk(text) {
  assert.match(text, /omission|new requirement|incorrect boundary/i, 'discoveries must identify plan defects');
  assert.match(text, /durable amendment/i, 'plan defects require a durable amendment');
  assert.match(text, /revalidate|validate again/i, 'amended plans must be revalidated');
  assert.match(text, /deviation record/i, 'amended execution must record a deviation');
  assert.match(text, /code[^.]{0,120}(?:never|cannot)[^.]{0,120}close/i, 'code alone cannot close a plan defect');
  assert.match(text, /full relevant context/i, 'risk fallback must provide full relevant context');
  assert.match(text, /preserv(?:e|ing)[^.]{0,160}(?:roles|gates)/i, 'risk fallback must preserve roles and gates');
}

function assertS2RoleTemplates() {
  const [implementer, specification, quality] = S2_TEMPLATES.map(read);
  assert.match(implementer, /complete dependency-ready slice/i);
  assert.match(implementer, /declared sources|declared requirements|declared commands/i);
  assert.match(specification, /exact clauses[^.]{0,160}report[^.]{0,160}diff/i);
  assert.match(quality, /diff[^.]{0,160}(?:tests|sensors)[^.]{0,160}(?:constraints|robustness)/i);
  for (const source of [specification, quality]) {
    assert.match(source, /never receive a full plan|do not ask to read a full plan/i);
    assert.match(source, /chain-of-thought/i);
  }
}

test('S2 compact handoff dispatches only a validated dependency-ready slice and preserves the legacy route (R4-CS-3)', () => {
  const sdd = read(S2_SDD);
  assert.match(sdd, /complete dependency-ready slice/i);
  assert.match(sdd, /only declared sources, requirements, and commands/i);
  assert.match(sdd, /invalid or unsupported[^.]{0,180}(?:stop|block)/i);
  assert.match(sdd, /legacy[^.]{0,180}(?:unchanged|existing behavior)/i);
});

test('S2 state machine requires fresh spec and quality reviews before a compact slice advances (R4-CS-4)', () => {
  assertS2CompactStateMachine(read(S2_SDD));
});

test('S2 makes defects durable, revalidates them, and keeps risk fallbacks fully gated (R4-CS-5, R4-CS-6)', () => {
  assertS2AmendmentAndRisk(read(S2_SDD));
});

test('S2 templates keep the stable Evidence Capsule boundary while scoping each role (R4-CS-3, R4-CS-4)', () => {
  assertS2RoleTemplates();
  for (const source of S2_TEMPLATES) assert.equal((read(source).match(/## Evidence Capsule v1/g) ?? []).length, 1, `${source} marker must remain singular`);
});

test('S2 preserves execution reviews and global two-track QA instead of replacing them with slice review (R4-QUAL-1, R4-QUAL-2)', () => {
  const execution = read(S2_EXEC);
  const review = read(S2_REVIEW);
  const qa = read(S2_QA);
  assert.match(execution, /legacy batches\/checkpoints intact/i);
  assert.match(execution, /compact slice[^.]{0,160}(?:spec|quality)[^.]{0,160}review/i);
  assert.match(review, /each task[^.]{0,120}legacy or compact slice/i);
  assert.match(review, /never end-only/i);
  for (const token of ['Track A', 'Track B', 'one subagent per lens', 'full applicable verification', 'fix loop', 'post-implementation-docs', 'harness-retro', 'finishing-a-development-branch']) assert.match(qa, new RegExp(token), `missing QA continuity: ${token}`);
  assert.match(qa, /Track B receives no full plan/i);
});

test('S2 RED mutation matrix rejects compact-slice shortcuts and quality regressions', () => {
  const sdd = read(S2_SDD);
  assert.throws(() => assert.match(sdd.replace('fresh code-quality reviewer', 'reviewer'), /fresh code-quality reviewer/i),
    /fresh code-quality reviewer/);
  assert.throws(() => assert.match(sdd.replace(/both reviewers[^.]*clean/i, 'one reviewer clean'), /both reviewers[^.]{0,120}clean/i),
    /both reviewers/);
  assert.throws(() => assertS2AmendmentAndRisk(sdd.replace('durable amendment', 'note')),
    /durable amendment/);
  assert.throws(() => assertS2AmendmentAndRisk(sdd.replace('revalidate', 'defer validation')),
    /amended plans must be revalidated/);
  assert.throws(() => assertS2AmendmentAndRisk(sdd.replace('full relevant context', 'brief context')),
    /full relevant context/);
  assert.throws(() => assert.match(read(S2_TEMPLATES[2]).replaceAll('chain-of-thought', 'notes'), /chain-of-thought/),
    /chain-of-thought/);
  const execution = read(S2_EXEC);
  assert.throws(() => assert.match(execution.replace('Legacy batches/checkpoints intact', 'Legacy batches removed'), /legacy batches\/checkpoints intact/i));
  const qa = read(S2_QA);
  assert.throws(() => assert.match(qa.replace('one subagent per lens', 'one reviewer'), /one subagent per lens/));
  assert.throws(() => assert.match(qa.replace('Track B receives no full plan', 'Track B may receive the full plan'), /Track B receives no full plan/i));
});

test('S2 pressure mutations reject fragmented dispatch, hidden scope, report shortcuts, and removed final quality gates', () => {
  const sdd = read(S2_SDD);
  assert.match(sdd, /validate every report/i, 'controller must validate each report');
  assert.throws(() => assert.match(sdd.replace('complete dependency-ready slice', 'fragment'), /complete dependency-ready slice/i));
  assert.throws(() => assert.match(sdd.replace('branch history', 'history'), /branch history/i));
  assert.throws(() => assert.match(sdd.replace('fresh specification reviewer', 'existing reviewer'), /fresh specification reviewer/i));
  assert.throws(() => assert.match(sdd.replace('both reviewers are clean', 'a reviewer is clean'), /both reviewers are clean/i));
  assert.throws(() => assert.match(sdd.replace('only declared sources, requirements, and commands', 'declared sources and commands'), /only declared sources, requirements, and commands/i));
  assert.throws(() => assert.match(sdd.replace('full relevant context', 'brief context'), /full relevant context/i));
  assert.throws(() => assert.match(sdd.replace('slice clauses, tests, sensors, ledger', 'slice clauses, tests, ledger'), /slice clauses, tests, sensors, ledger/i));
  const qa = read(S2_QA);
  assert.throws(() => assert.match(qa.replaceAll('Track A', 'local review'), /Track A/i));
  assert.throws(() => assert.match(qa.replaceAll('Track B', 'local review'), /Track B/i));
});
