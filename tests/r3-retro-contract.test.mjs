import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const count = (text, value) => text.split(value).length - 1;

const TYPED_LEDGER_EMITTERS = [
  'skills/post-implementation-qa/deep-review-prompt.md',
  'skills/subagent-driven-development/code-quality-reviewer-prompt.md',
  'skills/subagent-driven-development/spec-reviewer-prompt.md',
  'skills/systematic-debugging/SKILL.md',
  'skills/verification-before-completion/SKILL.md',
];

function walkMarkdown(directory) {
  return fs.readdirSync(path.join(root, directory), { withFileTypes: true }).flatMap(entry => {
    const relative = path.posix.join(directory, entry.name);
    if (entry.isDirectory()) return walkMarkdown(relative);
    return entry.isFile() && entry.name.endsWith('.md') ? [relative] : [];
  });
}

function typedLedgerEmitters() {
  return walkMarkdown('skills').filter(relative => {
    const text = read(relative);
    return /^\s*awm ledger add\b/m.test(text) && text.includes('--defect-class <exact-catalog-id>');
  }).sort();
}

function assertCatalogKnownOnlyGuidance(text, emitter) {
  assert.match(text,
    /Append `--defect-class <exact-catalog-id>` only when the .+ maps to an exact class in the active sensor-pack coverage catalog\. Omit the flag when the class is not known; do not infer it from .+\./s,
    `${emitter} must permit defect classes only for an exact active-catalog match and forbid inference`);
}

function assertRetroAuthority(text) {
  const coverage = text.indexOf('awm sensors coverage --json');
  const archive = text.indexOf('awm ledger archive');
  assert.equal(count(text, 'awm sensors coverage --json'), 1, 'coverage must be run exactly once');
  assert.ok(text.indexOf('awm ledger list') < coverage, 'coverage must follow ledger reading');
  assert.ok(coverage < archive, 'coverage must be read before the ledger is archived');
  assert.match(text, /Coverage is read-only: it reports outcomes and does not apply remedies or mutate the project\./,
    'coverage may not authorize remedies or mutation');
  assert.match(text, /Present each item interactively[\s\S]*?for each remedy, the human decides:/,
    'interactive retros require a human decision for every remedy');
  assert.match(text, /Unattended mode uses only existing triage rules; it records any recommendation that needs new authority instead of applying it\./,
    'unattended mode may use existing triage only and must not gain new authority');
}

test('discovers every typed ledger emitter and requires exact catalog-known-only guidance', () => {
  assert.deepEqual(typedLedgerEmitters(), TYPED_LEDGER_EMITTERS,
    'the authoritative typed-emitter catalog must track every actual ledger emitter');
  for (const emitter of typedLedgerEmitters()) assertCatalogKnownOnlyGuidance(read(emitter), emitter);
});

test('retro authority keeps coverage read-only, human approval interactive, and unattended triage bounded', () => {
  assertRetroAuthority(read('skills/harness-retro/SKILL.md'));
});

test('RED mutation: weakening unattended authority is rejected', () => {
  const weakened = read('skills/harness-retro/SKILL.md').replace(
    'Unattended mode uses only existing triage rules; it records any recommendation that needs new authority instead of applying it.',
    'Unattended mode may apply any new remedy it recommends.',
  );
  assert.throws(() => assertRetroAuthority(weakened), /unattended mode may use existing triage only/i);
});

test('keeps empirical coverage terminal and out of implementation QA (R6.7)', () => {
  assert.doesNotMatch(read('skills/post-implementation-qa/SKILL.md'), /awm sensors coverage/);
  assert.match(read('skills/harness-retro/SKILL.md'), /awm sensors coverage --json/);
});
