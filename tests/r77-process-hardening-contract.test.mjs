// #77 — QA worktree mutations, severity rubric, verify-cmd-source for skills/plans.
// Every assert runs on shipped text and on a mutation that must turn red.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');

function read(rel) {
  return readFileSync(resolve(root, rel), 'utf8');
}

function mutated(text, from, to) {
  assert.ok(text.includes(from), `mutation anchor not found: ${from}`);
  return text.split(from).join(to);
}

function section(text, heading) {
  const start = text.indexOf(heading);
  assert.notEqual(start, -1, `missing section: ${heading}`);
  const next = text.indexOf('\n## ', start + heading.length);
  return text.slice(start, next === -1 ? text.length : next);
}

const PROMPT = 'skills/post-implementation-qa/deep-review-prompt.md';
const WRITING_PLANS = 'skills/writing-plans/SKILL.md';
const WRITING_SKILLS = 'skills/writing-skills/SKILL.md';

const SEVERITY_ANCHOR =
  '`important` is only for what a real author would hit, or a real trust-boundary failure';
const WORKTREE_ANCHOR =
  'Run mutation probes only inside `git worktree add <scratch> HEAD`';
const PLANS_VERIFY_ANCHOR =
  'verify-cmd-source-before-documenting';
const PLANS_CLI_ANCHOR =
  'Before a plan asserts CLI flags, exits, or command semantics, read the matching `cli/src/commands/` source';
const SKILLS_CLI_ANCHOR =
  'Before a skill asserts CLI flags, exits, or command semantics, read the matching `cli/src/commands/` source';

test('deep-review-prompt defines important vs esoteric minor severity', () => {
  const text = read(PROMPT);
  const common = section(text, '## Severity rubric');
  assert.ok(common.includes(SEVERITY_ANCHOR), 'missing important rubric');
  assert.match(common, /esoteric[\s\S]{0,120}minor/i, 'esoteric cases must be at most minor');
  assert.throws(
    () => assert.ok(mutated(text, SEVERITY_ANCHOR, 'severity is a free judgment call').includes(SEVERITY_ANCHOR)),
    /AssertionError/,
    'removing the important rubric must fail',
  );
});

test('tests lens requires worktree-isolated mutation probes', () => {
  const text = read(PROMPT);
  const testsLens = section(text, '## Track B — Tests lens subagent');
  assert.ok(testsLens.includes(WORKTREE_ANCHOR), 'missing worktree mutation rule');
  assert.match(testsLens, /never[\s\S]{0,80}shared (worktree|working tree|checkout)/i);
  assert.match(testsLens, /remove|delete|rm[\s\S]{0,40}worktree/i);
  assert.throws(
    () => assert.ok(mutated(text, WORKTREE_ANCHOR, 'Mutate files in the shared checkout').includes(WORKTREE_ANCHOR)),
    /AssertionError/,
    'removing the worktree rule must fail',
  );
});

test('writing-plans extends verify-cmd-source to CLI assertions in plans', () => {
  const text = read(WRITING_PLANS);
  const scoped = section(text, '### Verify CLI facts');
  assert.ok(scoped.includes(PLANS_VERIFY_ANCHOR), 'must name the verify-cmd-source pattern');
  assert.ok(scoped.includes(PLANS_CLI_ANCHOR), 'must require reading cli/src before asserting CLI behavior');
  assert.throws(
    () => assert.ok(mutated(text, PLANS_CLI_ANCHOR, 'CLI facts may be inferred from memory').includes(PLANS_CLI_ANCHOR)),
    /AssertionError/,
    'removing the plans CLI verify rule must fail',
  );
  assert.throws(
    () => assert.ok(mutated(text, PLANS_VERIFY_ANCHOR, 'verify-docs-only').includes(PLANS_VERIFY_ANCHOR)),
    /AssertionError/,
    'removing the pattern name must fail',
  );
});

test('writing-skills extends verify-cmd-source to CLI assertions in skills', () => {
  const text = read(WRITING_SKILLS);
  const scoped = section(text, '## Verify CLI facts');
  assert.ok(scoped.includes(SKILLS_CLI_ANCHOR), 'must require reading cli/src before asserting CLI behavior');
  assert.match(scoped, /verify-cmd-source-before-documenting/);
  assert.throws(
    () => assert.ok(mutated(text, SKILLS_CLI_ANCHOR, 'CLI facts may be copied from a plan').includes(SKILLS_CLI_ANCHOR)),
    /AssertionError/,
    'removing the skills CLI verify rule must fail',
  );
});

test('r77 exposes its focused npm script', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.scripts['test:r77'], 'node --test tests/r77-process-hardening-contract.test.mjs');
});
