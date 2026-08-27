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

test('runs the R8 workflow contract before validation and release', () => {
  for (const workflow of ['validate.yml', 'auto-tag.yml']) {
    assert.match(read(`.github/workflows/${workflow}`), /node tests\/r8-sensor-gate-contract\.test\.mjs/,
      `${workflow} must execute the R8 workflow contract before accepting or releasing registry content`);
  }
});

test('RED mutation: removing not_certified makes an execution gate contract fail', () => {
  const original = read(EXECUTION_SKILLS[0]);
  const weakened = original.replace('not_certified', 'unconfigured');
  assert.throws(() => assertStopsNonPassBeforeProgression(weakened, EXECUTION_SKILLS[0]), /not_certified/);
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
