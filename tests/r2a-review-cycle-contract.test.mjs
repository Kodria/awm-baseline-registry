import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const cyclePath = resolve(root, 'skills/subagent-driven-development/references/review-cycle-v1.md');
const packagePath = resolve(root, 'package.json');

function readCycle() { return readFileSync(cyclePath, 'utf8'); }
function section(text, heading) {
  const start = text.indexOf(heading);
  assert.notEqual(start, -1, `missing section: ${heading}`);
  const next = text.indexOf('\n## ', start + heading.length);
  return text.slice(start, next === -1 ? text.length : next).replace(/\s+/g, ' ');
}

const rules = [
  ['## Candidate and obligations', 'before any dispatch', /missing required evidence[\s\S]{0,100}block/i],
  ['## Candidate and obligations', 'plan identity, scope, declared roles and current verification obligations', /freezes that candidate/i],
  ['## Mechanical evidence', 'identical candidate, command argv, cwd and satisfies obligation', /equivalence[\s\S]{0,100}requires a real execution/i],
  ['## Finding reconciliation', 'not file:line alone', /finding → fix → test → new verdict/i],
  ['## Finding reconciliation', 'confirmed identical defects', /cause, related surfaces and shared test boundary/i],
  ['## Finding reconciliation', 'unconfirmed common cause means separate groups', /before correcting/i],
  ['## Administrative repair', 'complete received fields', /re-review code or invent a reviewer verdict/i],
  ['## Administrative repair', 'ledger-entries collection', /identity, verdict, finding or win polarity, class, signature, severity, description and reference/i],
  ['## Administrative repair', 'verifies it with ledger list', /must not infer them from a template/i],
  ['## Administrative repair', 'incomplete report fields require clarification', /remain open/i],
  ['## Coherent fix groups', 'focused RED/GREEN tests', /all applicable current gates once/i],
  ['## Coherent fix groups', 'Do not mix an unrelated refactor', /Every accepted finding remains open/i],
  ['## Independent revalidation', 'fresh independent specification reviewer and a fresh independent code-quality reviewer', /delta[\s\S]{0,100}prior findings[\s\S]{0,100}dependencies[\s\S]{0,100}introduced defects/i],
  ['## Independent revalidation', 'full relevant applicable scope', /each affected role obligation/i],
  ['## Invalidation', 'candidate or changed fingerprint', /invalidates an old PASS as current evidence/i],
  ['## Invalidation', 'Commit, staged-index or code changes are not exempt', /new current verdict for each affected obligation/i],
  ['## Failure classification', 'product, plan, missing context, environment, currentness, publication, persistence', /only the affected gate/i],
  ['## Failure classification', 'without a new diagnostic or changed obligation', /must not cause an extra/i],
  ['## Bounded measurement', 'dispatches, reviews, fix rounds, mechanical runs, administrative repairs, context fallbacks and reopening causes', /Unavailable counts remain unavailable/i],
  ['## Bounded measurement', 'never persist prompt, source or unrestricted response bodies', /bounded IDs, verdicts and provenance/i],
];

test('R2-A controller contract preserves every operative rule in its scoped section', () => {
  const text = readCycle();
  for (const [heading, literal, consequence] of rules) {
    const scoped = section(text, heading);
    assert.ok(scoped.includes(literal), `${heading} lacks ${literal}`);
    assert.match(scoped, consequence, `${heading} lacks consequence for ${literal}`);
  }
});

test('R2-A rejects targeted mutation of every operative rule', () => {
  const text = readCycle();
  for (const [heading, literal, consequence] of rules) {
    const scoped = section(text, heading);
    const weakened = scoped.replaceAll(literal, 'REMOVED OPERATIVE RULE');
    assert.notEqual(weakened, scoped, `fixture lacks ${literal}`);
    assert.throws(() => {
      assert.ok(weakened.includes(literal));
      assert.match(weakened, consequence);
    }, /AssertionError/, `${heading}: ${literal}`);
    const withoutConsequence = scoped.replace(consequence, 'REMOVED CONSEQUENCE');
    assert.notEqual(withoutConsequence, scoped, `fixture lacks consequence for ${literal}`);
    assert.throws(() => assert.match(withoutConsequence, consequence), /AssertionError/,
      `${heading}: consequence for ${literal}`);
  }
});

test('R2-A exposes its declared focused command through npm', () => {
  const pkg = JSON.parse(readFileSync(packagePath, 'utf8'));
  assert.equal(pkg.scripts['test:r2a'], 'node --test tests/r2a-review-cycle-contract.test.mjs');
});

test('R2-A consumers use the sole shared review-cycle contract', () => {
  const consumers = [
    'skills/subagent-driven-development/SKILL.md',
    'skills/subagent-driven-development/implementer-prompt.md',
    'skills/subagent-driven-development/spec-reviewer-prompt.md',
    'skills/subagent-driven-development/code-quality-reviewer-prompt.md',
    'skills/post-implementation-qa/SKILL.md',
    'skills/post-implementation-qa/deep-review-prompt.md',
    'skills/executing-plans/SKILL.md',
    'skills/verification-before-completion/SKILL.md',
  ];
  for (const file of consumers) {
    const body = readFileSync(resolve(root, file), 'utf8');
    assert.match(body, /review-cycle-v1\.md/,
      `${file} must defer review/fix control to review-cycle-v1`);
    assert.throws(() => assert.match(
      body.replaceAll('review-cycle-v1.md', 'removed-contract.md'),
      /review-cycle-v1\.md/,
    ), /AssertionError/, `${file} mutation must be rejected`);
  }
  assert.match(readFileSync(resolve(root, 'skills/subagent-driven-development/SKILL.md'), 'utf8'),
    /repair only that administrative record/i);
  const qa = readFileSync(resolve(root, 'skills/post-implementation-qa/SKILL.md'), 'utf8');
  const qaTemplate = readFileSync(resolve(root, 'skills/post-implementation-qa/deep-review-prompt.md'), 'utf8');
  assert.match(qa, /ledgerEntries/);
  assert.doesNotMatch(qa, /explicit `ledgerEntry`/);
  assert.match(qaTemplate, /"ledgerEntries":/);
  assert.doesNotMatch(qa, /may both flag the same `file:line`\. Merge overlapping findings/i);
  assert.doesNotMatch(qa, /verification-before-completion passed for each fix/i);
  assert.doesNotMatch(qa, /verification-before-completion per each fix/i);
});

test('R2-A keeps one plural ledger-entry schema across controller and consumers', () => {
  const cycle = readCycle();
  assert.match(cycle, /contains a ledger-entries collection with complete\s+received fields/i);
  assert.doesNotMatch(cycle, /contains a ledger-entry with complete received fields/i);
});

test('R2-A rejects removal of consumer-level control behavior', () => {
  const required = [
    ['skills/post-implementation-qa/SKILL.md', 'confirmed identical defects'],
    ['skills/post-implementation-qa/SKILL.md', 'repair only that administrative record'],
    ['skills/post-implementation-qa/SKILL.md', 'focused RED/GREEN plus applicable current gates once'],
    ['skills/subagent-driven-development/SKILL.md', 'repair only that administrative record'],
    ['docs/acceptance/r2a-claude-trial.md', 'exact reviewed registry SHA'],
    ['docs/acceptance/r2a-claude-trial.md', 'negative scenarios'],
  ];
  for (const [file, phrase] of required) {
    const body = readFileSync(resolve(root, file), 'utf8');
    assert.ok(body.includes(phrase), `${file} lacks ${phrase}`);
    assert.throws(() => assert.ok(body.replaceAll(phrase, 'REMOVED CONTROL').includes(phrase)),
      /AssertionError/, `${file} mutation must reject ${phrase}`);
  }
  const installed = readFileSync(resolve(root, 'tests/installed-admission-acceptance.mjs'), 'utf8');
  assert.match(installed, /AWM_NO_UPDATE_CHECK: '1'/);
  assert.throws(() => assert.match(installed.replace("AWM_NO_UPDATE_CHECK: '1'", 'REMOVED CONTROL'), /AWM_NO_UPDATE_CHECK: '1'/),
    /AssertionError/, 'cleanup race control mutation must fail');
});

test('R2-A documents an isolated Claude trial without claiming native acceptance', () => {
  const playbook = readFileSync(resolve(root, 'docs/acceptance/r2a-claude-trial.md'), 'utf8');
  assert.match(playbook, /READY-FOR-CLAUDE-TRIAL/);
  assert.match(playbook, /temporary HOME\/AWM_HOME/);
  assert.match(playbook, /must not claim CLAUDE-PASS/i);
  assert.match(playbook, /rollback/i);
  assert.match(playbook, /settings and dependencies/i);
  assert.match(playbook, /negative scenarios/i);
  assert.match(playbook, /block.*CLI|CLI.*block/i);
});
