import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const count = (text, value) => text.split(value).length - 1;

const DIRECT_LEDGER_EMITTERS = [
  'skills/post-implementation-qa/deep-review-prompt.md',
  'skills/subagent-driven-development/code-quality-reviewer-prompt.md',
  'skills/subagent-driven-development/spec-reviewer-prompt.md',
  'skills/systematic-debugging/SKILL.md',
  'skills/verification-before-completion/SKILL.md',
];

const LEDGER_ADD_WITH_PHASE = /^\s*awm ledger add\s+--phase\b/m;
const LEDGER_EMITTER_ROOTS = ['docs', 'skills'];

function walkMarkdown(directory, projectRoot = root) {
  return fs.readdirSync(path.join(projectRoot, directory), { withFileTypes: true }).flatMap(entry => {
    const relative = path.posix.join(directory, entry.name);
    assert.ok(!entry.isSymbolicLink(),
      `Markdown discovery must fail closed on symlinks so ledger emitters cannot be hidden`);
    if (entry.isDirectory()) return walkMarkdown(relative, projectRoot);
    return entry.isFile() && entry.name.endsWith('.md') ? [relative] : [];
  });
}

function directLedgerEmitters(projectRoot = root) {
  return LEDGER_EMITTER_ROOTS.flatMap(directory => walkMarkdown(directory, projectRoot))
    .filter(relative => LEDGER_ADD_WITH_PHASE.test(fs.readFileSync(path.join(projectRoot, relative), 'utf8')))
    .sort();
}

function assertLedgerEmittersHaveCatalogGuidance(projectRoot = root) {
  for (const emitter of directLedgerEmitters(projectRoot)) {
    assertCatalogKnownOnlyGuidance(fs.readFileSync(path.join(projectRoot, emitter), 'utf8'), emitter);
  }
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

test('discovers every direct ledger emitter independently of defect-class guidance', () => {
  assert.deepEqual(directLedgerEmitters(), DIRECT_LEDGER_EMITTERS,
    'the authoritative direct-emitter catalog must track every actual `awm ledger add --phase` emitter');
  assertLedgerEmittersHaveCatalogGuidance();
});

test('RED mutation: a real ledger emitter without catalog guidance is rejected', () => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'r3-retro-emitter-'));
  const emitter = DIRECT_LEDGER_EMITTERS[0];
  try {
    fs.mkdirSync(path.join(fixture, 'docs'), { recursive: true });
    fs.mkdirSync(path.dirname(path.join(fixture, emitter)), { recursive: true });
    const command = read(emitter).match(/^\s*awm ledger add\s+--phase.*$/m)?.[0];
    assert.ok(command, `${emitter} must contain a direct phase-bearing ledger command`);
    fs.writeFileSync(path.join(fixture, emitter), `${command}\n`, 'utf8');

    assert.deepEqual(directLedgerEmitters(fixture), [emitter]);
    assert.throws(() => assertLedgerEmittersHaveCatalogGuidance(fixture),
      /must permit defect classes only for an exact active-catalog match/i);
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
});

test('RED mutation: a symlinked Markdown emitter fails closed instead of being skipped', () => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'r3-retro-symlink-'));
  try {
    fs.mkdirSync(path.join(fixture, 'docs'), { recursive: true });
    fs.mkdirSync(path.join(fixture, 'skills'), { recursive: true });
    fs.writeFileSync(path.join(fixture, 'target.md'),
      'awm ledger add --phase injected --source-skill fixture\n', 'utf8');
    fs.symlinkSync('../target.md', path.join(fixture, 'skills', 'linked.md'));

    assert.throws(() => directLedgerEmitters(fixture), /fail closed on symlinks/i);
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
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
