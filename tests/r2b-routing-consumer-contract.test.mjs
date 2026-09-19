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
    ['skills/architecture-advisor/SKILL.md', 'routed architecture obligation'],
    ['skills/architecture-assessment/SKILL.md', 'routed architecture obligation'],
    ['skills/architecture-extraction/SKILL.md', 'routed architecture obligation'],
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
  for (const clause of ['current CLI resolution', 'applied ack', 'mismatch blocks', 'unknown dispatch outcome requires custody reconciliation', 'Emission receipts are not applied acks', 'Generation and plan identity never reset', 'omitted effort blocks', 'Unverified capability never satisfies routing', 'R2-A ledger/review', 'QA, documentation, retro, and finishing']) assert.match(reference, new RegExp(clause), `reference must retain ${clause}`);
  for (const role of ['specification-reviewer', 'code-quality-reviewer', 'final-reviewer', 'architecture', 'track-a-qa', 'track-b-qa', 'controller']) assert.match(reference, new RegExp(`\`${role}\``), `reference must retain full role ${role}`);
  for (const target of ['claude-code', 'codex', 'opencode', 'cursor', 'copilot', 'antigravity']) assert.match(reference, new RegExp(`\`${target}\``), `reference must retain target ${target}`);
  assert.match(reference, /documented native control is not native acceptance/i);
  assert.doesNotMatch(reference, /vendor-specific|provider fork/i, 'routing reference must not create provider forks');
  for (const clause of ['applied ack', 'mismatch blocks', 'unknown dispatch outcome requires custody reconciliation', 'Generation and plan identity never reset', 'omitted effort blocks', 'Unverified capability never satisfies routing']) assert.throws(() => assert.match(reference.replaceAll(clause, ''), new RegExp(clause)), `removing ${clause} must fail`);
  const fixture = read('tests/fixtures/compact-slices-v2/reference-example.md');
  // Assert the real document, then self-test the detector. The previous form injected a
  // field into a copy and asserted it was there, which proves String.replace, not the fixture.
  const concreteField = /"(model|vendor|provider|selector)"\s*:/;
  assert.doesNotMatch(fixture, concreteField, 'semantic v2 fixture must not configure a concrete model/vendor/provider/selector');
  for (const field of ['model', 'vendor', 'provider', 'selector']) {
    const mutated = fixture.replace('"implementerProfile":"mechanical"', `"implementerProfile":"mechanical","${field}":"forbidden"`);
    assert.notEqual(mutated, fixture, `mutation fixture for ${field} must actually apply`);
    assert.match(mutated, concreteField, `detector must catch an injected ${field} field`);
  }
  const implementer = read('skills/subagent-driven-development/implementer-prompt.md');
  const concreteRouting = /gpt-5\.6-sol|claude-opus|(?:codex|claude-code)=/;
  // Same correction: the documents themselves must be clean — appending a string to a copy
  // and finding it again asserted nothing about what ships.
  assert.doesNotMatch(reference, concreteRouting, 'routing reference must not name a concrete model or map a target to one');
  assert.doesNotMatch(implementer, concreteRouting, 'implementer prompt must not name a concrete model or map a target to one');
  for (const injected of ['gpt-5.6-sol', 'claude-opus', 'codex=gpt-5.6-sol', 'claude-code=claude-opus']) {
    assert.match(`${reference}\n${injected}`, concreteRouting, `detector must catch injected routing: ${injected}`);
  }
});

// Textual `includes` accepted a commented-out invocation, `indexOf` ordering accepted a
// step moved into another job, and the no-skip regex only caught conditions that happened
// to name AWM_R2B. These helpers answer the real question — does this command run
// unconditionally, in this job, before the tag — and each is proven by mutation below.

/** Lines that actually invoke `command`: a commented-out line is not an invocation. */
function invocations(workflow, command) {
  return workflow.split('\n')
    .map((line, index) => ({ line, index }))
    .filter(entry => entry.line.includes(command) && !/^\s*#/.test(entry.line));
}

/** The `  jobName:` header governing a line, so ordering is compared within one job. */
function jobOf(workflow, index) {
  const lines = workflow.split('\n');
  for (let i = index; i >= 0; i -= 1) {
    const header = /^ {2}([A-Za-z0-9_-]+):\s*$/.exec(lines[i]);
    if (header) return header[1];
  }
  return null;
}

/** Any conditional or failure-swallowing key between this line and its job header.
 *  Catches step-level and job-level `if:` / `continue-on-error:` in every spelling. */
function guardedBy(workflow, index) {
  const lines = workflow.split('\n');
  const found = [];
  for (let i = index; i >= 0; i -= 1) {
    if (/^ {2}[A-Za-z0-9_-]+:\s*$/.test(lines[i])) break;
    if (/^\s*#/.test(lines[i])) continue;
    if (/^\s*if:/.test(lines[i])) found.push(lines[i].trim());
    if (/^\s*continue-on-error:/.test(lines[i])) found.push(lines[i].trim());
  }
  return found;
}

function runsUnconditionally(workflow, command) {
  const hits = invocations(workflow, command);
  return hits.length > 0 && hits.every(hit => guardedBy(workflow, hit.index).length === 0);
}

test('B3 both CI surfaces run the routing contract and paired installed acceptance, tag-producing job before the tag', () => {
  const validate = read('.github/workflows/validate.yml');
  const autoTag = read('.github/workflows/auto-tag.yml');
  const CONTRACT = 'tests/r2b-routing-consumer-contract.test.mjs';
  const INSTALLED = 'tests/r2b-routing-cli-acceptance.mjs';
  const GATE = 'scripts/r2b-release-gate.mjs';

  for (const [name, workflow] of [['validate.yml', validate], ['auto-tag.yml', autoTag]]) {
    for (const command of [CONTRACT, INSTALLED, GATE]) {
      assert.ok(runsUnconditionally(workflow, command), `${name} must run ${command} unconditionally`);
    }
    assert.match(workflow, /AWM_R2B_CLI_SHA[:=]\s*"?[a-f0-9]{40}"?/, `${name} must pin the exact published candidate SHA`);
    assert.match(workflow, /AWM_R2B_PROTOCOL_DIGEST[:=]\s*"?[a-f0-9]{64}"?/, `${name} must pin the immutable protocol digest`);
    assert.ok(workflow.includes('AWM_R2B_OLD_CLI_BIN'), `${name} must exercise the unmodified published negative control`);
  }

  // The tag job must run the acceptance before pushing, and in that same job.
  const push = autoTag.split('\n').findIndex(line => line.includes('Compute and push next tag'));
  const gateLine = invocations(autoTag, INSTALLED)[0];
  assert.ok(gateLine.index < push, 'paired acceptance must run before the tag is pushed');
  assert.equal(jobOf(autoTag, gateLine.index), jobOf(autoTag, push), 'paired acceptance must live in the tag-producing job itself');

  // Mutation proofs: each realistic way of defeating the gate must be rejected.
  const commentedOut = autoTag.replace(`          node --test ${INSTALLED}`, `          # node --test ${INSTALLED}`);
  assert.equal(runsUnconditionally(commentedOut, INSTALLED), false, 'a commented-out invocation must not count as running');

  const acceptanceStep = '      - name: Paired published CLI routing acceptance (candidate + unmodified negative control)';
  assert.ok(validate.includes(acceptanceStep), 'mutation fixtures must track the real step name');
  const conditioned = validate.replace(acceptanceStep, `${acceptanceStep}\n        if: github.event_name == 'schedule'`);
  assert.equal(runsUnconditionally(conditioned, INSTALLED), false, 'a conditional step must not count as running');

  const tolerated = validate.replace('        run: |\n          set -euo pipefail', "        continue-on-error: 'true'\n        run: |\n          set -euo pipefail");
  assert.equal(runsUnconditionally(tolerated, INSTALLED), false, 'a failure-swallowing step must not count as running');

  const movedAway = autoTag.replace(`          node --test ${INSTALLED}\n`, '') +
    `\n  r2b-late:\n    needs: tag\n    steps:\n      - run: node --test ${INSTALLED}\n`;
  const moved = invocations(movedAway, INSTALLED)[0];
  assert.notEqual(jobOf(movedAway, moved.index), jobOf(movedAway, push), 'an acceptance moved into another job must not satisfy the ordering check');

  const removed = validate.replaceAll(`node --test ${CONTRACT}`, '');
  assert.equal(runsUnconditionally(removed, CONTRACT), false, 'removing the invocation must be rejected');
});

test('B3 acceptance document keeps its honesty labels and cannot be silently relabelled', () => {
  const doc = read('docs/acceptance/r2b-native-routing.md');
  // Nothing read this document before, so UNTESTED/BLOCKED could have been flipped to
  // PASS with the whole suite still green. These labels are the honesty contract of R2B-B7.
  const native = doc.split('## 5. Native runtime')[1] ?? '';
  const publicTag = doc.split('## 4. Public tag')[1]?.split('## 5.')[0] ?? '';
  assert.match(native, /\*\*UNTESTED\.\*\*/, 'native runtime level must stay labelled UNTESTED');
  assert.match(native, /fixture evidence is never native certification/i, 'native level must refuse fixture evidence as certification');
  // The condition this guard named has been met: registry tag v4.3.0 exists at
  // e17f5e30, pushed by the tag-producing job after the acceptances ran. So the
  // BLOCKED assertion is replaced by the invariant that outlives it — a PASS at
  // this level must rest on an exact immutable pair, never a bare claim, which
  // is precisely what a local fixture tag could never supply.
  assert.match(publicTag, /`v\d+\.\d+\.\d+`/, 'public-tag PASS must name the exact published registry tag');
  assert.match(publicTag, /[a-f0-9]{40}/, 'public-tag PASS must name the exact published commit SHA');
  assert.match(publicTag, /level 5 below remains untested/i, 'public-tag level must refuse to carry native-runtime evidence');
  assert.doesNotMatch(native, /\bPASS\b/, 'native runtime level must never claim PASS');

  // The five levels must stay separate and named.
  for (const level of ['## 1. Structural', '## 2. Compiled', '## 3. Installed', '## 4. Public tag', '## 5. Native runtime']) {
    assert.ok(doc.includes(level), `acceptance doc must keep the ${level} level`);
  }
  // R8: the local verdict is preserved, never relabelled.
  assert.match(doc, /not_certified/, 'acceptance doc must record the preserved not_certified verdict');
  assert.doesNotMatch(doc, /sensors?[^.\n]{0,40}\bpass\b/i, 'acceptance doc must never relabel the sensor verdict as pass');

  // Mutation proofs: relabelling either level must be rejected.
  assert.throws(() => assert.match(native.replace('**UNTESTED.**', '**PASS.**'), /\*\*UNTESTED\.\*\*/), 'flipping UNTESTED to PASS must fail');
  // A PASS stripped of its commit SHA is exactly the bare claim this level
  // refuses, so removing the provenance must be rejected.
  assert.throws(() => assert.match(publicTag.replace(/[a-f0-9]{40}/, 'somewhere'), /[a-f0-9]{40}/), 'a public-tag PASS without its exact commit must fail');
  assert.throws(() => assert.match(publicTag.replace(/`v\d+\.\d+\.\d+`/, '`latest`'), /`v\d+\.\d+\.\d+`/), 'a public-tag PASS resting on a mutable ref must fail');
});
