import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const count = (text, value) => text.split(value).length - 1;

const EMITTERS = [
  'skills/subagent-driven-development/spec-reviewer-prompt.md',
  'skills/subagent-driven-development/code-quality-reviewer-prompt.md',
  'skills/post-implementation-qa/deep-review-prompt.md',
  'skills/verification-before-completion/SKILL.md',
  'skills/systematic-debugging/SKILL.md',
];

test('runs coverage exactly once before archive (R6.4)', () => {
  const retro = read('skills/harness-retro/SKILL.md');
  assert.equal(count(retro, 'awm sensors coverage --json'), 1);
  assert.ok(retro.indexOf('awm sensors coverage --json') < retro.indexOf('awm ledger archive'));
});

test('keeps interactive and unattended authority distinct (R6.5)', () => {
  const retro = read('skills/harness-retro/SKILL.md');
  assert.match(retro, /interactive.*human.*remedy/is);
  assert.match(retro, /unattended.*existing.*triage/is);
  assert.match(retro, /coverage.*read-only/is);
});

for (const emitter of EMITTERS) {
  test(`${emitter} emits defect class only when known`, () => {
    const text = read(emitter);
    assert.match(text, /--defect-class/);
    assert.match(text, /omit.*when.*not.*known/is);
  });
}

test('keeps empirical coverage terminal and out of implementation QA (R6.7)', () => {
  assert.doesNotMatch(read('skills/post-implementation-qa/SKILL.md'), /awm sensors coverage/);
  assert.match(read('skills/harness-retro/SKILL.md'), /awm sensors coverage --json/);
});
