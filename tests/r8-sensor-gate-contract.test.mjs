import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const root = new URL('..', import.meta.url);
const read = relative => readFileSync(new URL(relative, root), 'utf8');

const EXECUTION_SKILLS = [
  'skills/executing-plans/SKILL.md',
  'skills/subagent-driven-development/SKILL.md',
  'skills/verification-before-completion/SKILL.md',
];

const TIMEOUT_REMEDIATION_SKILLS = [
  'skills/executing-plans/SKILL.md',
  'skills/subagent-driven-development/SKILL.md',
  'skills/verification-before-completion/SKILL.md',
];

const REGISTRY_CLOSURE_POLICY = 'skills/setup-sensors/references/registry-closure-policy-r8.md';

function assertEmpiricalUnattendedHandoff(text) {
  const staticPreflight = text.indexOf('awm preflight');
  const empiricalPreflight = text.indexOf('awm preflight --verify-sensors');
  const unattended = text.lastIndexOf('`desatendido`', empiricalPreflight);
  assert.ok(staticPreflight >= 0, 'interactive planning must retain static `awm preflight`');
  assert.ok(empiricalPreflight > staticPreflight, 'empirical preflight must add to, not replace, static preflight');
  assert.ok(unattended >= 0 && empiricalPreflight > unattended,
    'empirical preflight must be required specifically before an unattended handoff');
  const handoff = text.slice(empiricalPreflight, empiricalPreflight + 900);
  assert.match(handoff, /non-zero[\s\S]{0,400}(?:stop|block)[\s\S]{0,400}Do not offer the execution\s+choice/i,
    'an empirical preflight non-pass must stop before offering unattended execution');
}

function assertStopsNonPassBeforeProgression(text, filename) {
  const gate = text.match(/(?:continue|progress|advance|proceed)[\s\S]{0,160}?(?:only|únicamente)[\s\S]{0,160}?overall:\s*pass|overall:\s*pass[\s\S]{0,160}?(?:only|únicamente)[\s\S]{0,160}?(?:continue|progress|advance|proceed)/i)?.[0];
  assert.ok(gate, `${filename} must permit progression only after overall pass`);
  for (const verdict of ['fail', 'not_certified', 'skipped']) {
    assert.match(text, new RegExp(`\\b${verdict}\\b`), `${filename} must name ${verdict} as a blocking verdict`);
  }
  assert.match(text, /systematic-debugging/, `${filename} must invoke systematic-debugging for a non-pass`);
  assert.match(text, /(?:do not|must not)[\s\S]{0,160}(?:mark|advance)[\s\S]{0,160}(?:complete|QA|retro|PR)|(?:QA|retro|PR)[\s\S]{0,160}(?:do not|must not)/i,
    `${filename} must prohibit completion or downstream QA/retro/PR after a non-pass`);
}

function assertTimeoutRemediation(text) {
  assert.match(text, /healthy progressing process/i,
    'only a healthy progressing process may receive timeout remediation');
  assert.match(text, /finite[\s\S]{0,180}(?:override|timeout)[\s\S]{0,180}justif/i,
    'timeout remediation must record a finite justified override');
  assert.match(text, /(?:conclusive rerun|rerun[\s\S]{0,120}overall:\s*pass)/i,
    'timeout remediation must require a conclusive passing rerun');
}

function assertRegistryClosurePolicy(text) {
  assert.match(text, /^# Registry Sensor Closure Policy \(R8 v1\)$/m,
    'the R8 policy reference must have a versioned identity');
  assert.match(text, /one or more applicable sensors[\s\S]{0,220}overall:\s*pass/i,
    'the owner must retain absolute overall pass whenever any sensor is applicable');
  assert.match(text, /only\s+when\s+all\s+declared\s+sensors\s+are\s+explicitly\s+disabled/i,
    'the owner must limit registry closure to every declared sensor being explicitly disabled');
  assert.match(text, /not_certified[\s\S]{0,180}skipped[\s\S]{0,180}never\s+call\s+either\s+verdict\s+`pass`/i,
    'the owner must preserve local non-pass verdicts without renaming them pass');
  assert.match(text, /versioned R8 evidence[\s\S]{0,180}candidate SHA[\s\S]{0,180}validate[\s\S]{0,180}auto-tag/i,
    'the owner must require versioned R8 evidence for the candidate SHA in validate and auto-tag');
  assert.match(text, /`fail`,\s*`inconclusive`,\s*missing CI evidence, or any applicable sensor[\s\S]{0,180}(?:never|cannot|must not)[\s\S]{0,120}exception/i,
    'the owner must deny the exception to fail, inconclusive, missing CI evidence, and applicable sensors');
}

function assertRegistryClosureConsumer(text, filename) {
  const section = text.match(/## Registry-content closure exception \(R8\)[\s\S]*?(?=\n## |\s*$)/)?.[0];
  assert.ok(section, `${filename} must link the R8 registry-closure policy`);
  assert.match(section, /\[Registry Sensor Closure Policy \(R8 v1\)\]\(\.\.\/setup-sensors\/references\/registry-closure-policy-r8\.md\)/,
    `${filename} must link the single R8 policy owner`);
  assert.match(section, /do not restate/i, `${filename} must keep the policy out of the consumer skill`);
  for (const phrase of ['all declared sensors', 'candidate SHA', 'inconclusive', 'never call either verdict']) {
    assert.doesNotMatch(section, new RegExp(phrase, 'i'), `${filename} must not restate ${phrase}`);
  }
}

function assertR8EvidenceRunsForCandidateSha(workflow, filename, { release = false } = {}) {
  const scope = release
    ? workflow.match(/- name: Verify registry before tagging[\s\S]*?(?=\n\s*- name: Compute and push next tag)/)?.[0]
    : workflow.match(/jobs:\n[\s\S]*?portability:[\s\S]*?(?=\n\s{2}[a-z][\w-]*:|\s*$)/)?.[0];
  assert.ok(scope, `${filename} must expose the registry validation scope`);
  assert.match(scope, /node tests\/r8-sensor-gate-contract\.test\.mjs/,
    `${filename} must execute versioned R8 evidence for the candidate SHA`);
}

function assertStrictCurrentness(text, filename, { advisory = false } = {}) {
  assert.match(text, /awm preflight --require-current/,
    `${filename} must require strict currentness`);
  if (advisory) {
    assert.match(text, /advisory[\s\S]{0,180}(?:one line|one bounded line)/i,
      `${filename} must make entry currentness advisory and bounded`);
    assert.match(text, /no writes|without writes/i,
      `${filename} must not write while checking entry currentness`);
    assert.match(text, /do not repeatedly recheck/i,
      `${filename} must not repeat the entry check in one phase`);
  } else {
    assert.match(text, /missing strict flag[\s\S]{0,180}(?:block|stop)/i,
      `${filename} must block handoff when strict currentness is unsupported`);
    assert.match(text, /(?:stale|non-zero)[\s\S]{0,180}(?:block|stop)/i,
      `${filename} must block stale currentness at handoff`);
  }
}

test('writing-plans requires empirical preflight before unattended handoff (R7.3)', () => {
  assertEmpiricalUnattendedHandoff(read('skills/writing-plans/SKILL.md'));
});

for (const file of EXECUTION_SKILLS) {
  test(`${file} stops every non-pass before progression (R8)`, () => {
    assertStopsNonPassBeforeProgression(read(file), file);
  });
}

for (const file of TIMEOUT_REMEDIATION_SKILLS) {
  test(`${file} keeps timeout remediation finite, justified, and conclusive (R8.1)`, () => {
    assertTimeoutRemediation(read(file));
  });
}

for (const file of EXECUTION_SKILLS) {
  test(`${file} links the single R8 registry-closure policy owner`, () => {
    assertRegistryClosureConsumer(read(file), file);
  });
}

test('R8 keeps the complete registry-closure policy in its single versioned owner', () => {
  assertRegistryClosurePolicy(read(REGISTRY_CLOSURE_POLICY));
});

test('plan reviewer rejects an unattended plan without empirical preflight (R7.3)', () => {
  const text = read('skills/writing-plans/plan-document-reviewer-prompt.md');
  assert.match(text, /unattended[\s\S]{0,400}awm preflight --verify-sensors[\s\S]{0,400}(?:non-pass|non-zero)[\s\S]{0,400}(?:block|stop)/i);
});

test('development entry makes strict currentness advisory and bounded (R4-CUR-6)', () => {
  assertStrictCurrentness(read('skills/development-process/SKILL.md'), 'development-process', { advisory: true });
});

test('writing-plans blocks compact handoff on stale or unsupported strict currentness (R4-CUR-6)', () => {
  assertStrictCurrentness(read('skills/writing-plans/SKILL.md'), 'writing-plans');
});

test('runs versioned R8 evidence for the candidate SHA in validation and release', () => {
  assertR8EvidenceRunsForCandidateSha(read('.github/workflows/validate.yml'), 'validate.yml');
  assertR8EvidenceRunsForCandidateSha(read('.github/workflows/auto-tag.yml'), 'auto-tag.yml', { release: true });
});

test('RED mutation: removing not_certified makes an execution gate contract fail', () => {
  const original = read(EXECUTION_SKILLS[0]);
  const weakened = original.replace(/not_certified/g, 'unconfigured');
  assert.throws(() => assertStopsNonPassBeforeProgression(weakened, EXECUTION_SKILLS[0]), /not_certified/);
});

test('RED mutation: weakening all-disabled makes the registry closure contract fail', () => {
  const original = read(REGISTRY_CLOSURE_POLICY);
  const weakened = original.replace(/only\s+when\s+all\s+declared\s+sensors\s+are\s+explicitly\s+disabled/i, 'when some declared sensors are disabled');
  assert.notEqual(weakened, original, 'mutation must change the all-disabled rule');
  assert.throws(() => assertRegistryClosurePolicy(weakened), /every declared sensor/);
});

test('RED mutation: removing candidate-SHA R8 evidence makes the registry closure contract fail', () => {
  const original = read(REGISTRY_CLOSURE_POLICY);
  const weakened = original.replace(/Versioned R8 evidence for the candidate SHA\s+must\s+run in both `validate` and `auto-tag`/i, 'R8 evidence may be recorded locally');
  assert.notEqual(weakened, original, 'mutation must change the candidate-SHA evidence rule');
  assert.throws(() => assertRegistryClosurePolicy(weakened), /candidate SHA/);
});

test('RED mutation: accepting fail or inconclusive makes the registry closure contract fail', () => {
  const original = read(REGISTRY_CLOSURE_POLICY);
  const weakened = original.replace(/`fail`,\s*`inconclusive`,\s*missing CI evidence, or any applicable sensor/, '`pass`, `inconclusive`, missing CI evidence, or any applicable sensor');
  assert.notEqual(weakened, original, 'mutation must change the fail/inconclusive denial');
  assert.throws(() => assertRegistryClosurePolicy(weakened), /fail, inconclusive/);
});

test('RED mutation: reporting a local non-pass verdict as green makes the registry closure contract fail', () => {
  const original = read(REGISTRY_CLOSURE_POLICY);
  const weakened = original.replace(/never\s+call\s+either\s+verdict\s+`pass`/i, 'report either verdict as green');
  assert.notEqual(weakened, original, 'mutation must change the local-verdict preservation rule');
  assert.throws(() => assertRegistryClosurePolicy(weakened), /without renaming them pass/);
});

test('RED mutation: restating the R8 policy in a consumer is rejected', () => {
  const original = read(EXECUTION_SKILLS[0]);
  const weakened = original.replace('do not restate the policy here.', 'do not restate the link. Only when all declared sensors are explicitly disabled.');
  assert.notEqual(weakened, original, 'mutation must replace the consumer non-restatement guard');
  assert.throws(() => assertRegistryClosureConsumer(weakened, EXECUTION_SKILLS[0]), /must not restate all declared sensors/);
});

test('RED mutation: removing the R8 owner link from a consumer is rejected', () => {
  const original = read(EXECUTION_SKILLS[0]);
  const weakened = original.replace(/\[Registry Sensor Closure Policy \(R8 v1\)\]\(\.\.\/setup-sensors\/references\/registry-closure-policy-r8\.md\)/, 'the policy');
  assert.notEqual(weakened, original, 'mutation must remove the policy-owner link');
  assert.throws(() => assertRegistryClosureConsumer(weakened, EXECUTION_SKILLS[0]), /single R8 policy owner/);
});

test('RED mutation: removing R8 evidence from release validation fails', () => {
  const original = read('.github/workflows/auto-tag.yml');
  const weakened = original.replace('          node tests/r8-sensor-gate-contract.test.mjs\n', '');
  assert.throws(() => assertR8EvidenceRunsForCandidateSha(weakened, 'auto-tag.yml', { release: true }), /versioned R8 evidence/);
});

test('RED mutation: removing timeout remediation from an execution skill is rejected', () => {
  const original = read('skills/subagent-driven-development/SKILL.md');
  const weakened = original.replace(/\n\*\*Timeout remediation is narrow\.\*[\s\S]*?(?=\n## )/, '\n');
  assert.throws(() => assertTimeoutRemediation(weakened), /healthy progressing process/i);
});

test('RED mutation: omitting strict currentness blocks the compact handoff contract', () => {
  const original = read('skills/writing-plans/SKILL.md');
  const weakened = original.replace('awm preflight --require-current', 'awm preflight');
  assert.throws(() => assertStrictCurrentness(weakened, 'writing-plans'), /strict currentness/);
});
