import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const root = new URL('..', import.meta.url);
const read = relative => readFileSync(new URL(relative, root), 'utf8');

const DOCS = 'skills/post-implementation-docs/SKILL.md';

test('R6.1: el skill de documentacion se declara como fase entre QA y retro', () => {
  const text = read(DOCS);                                  // verifies R6.1
  assert.match(text, /^name:\s*post-implementation-docs\s*$/m,
    'the frontmatter name must match the directory name — directory wins for discovery');
  assert.match(text, /`post-implementation-qa`/,
    'the skill must name its predecessor phase');
  assert.match(text, /`harness-retro`/,
    'the skill must name its successor phase');
});

test('R6.4: la verificacion es contra el binario real, no contra la prosa', () => {
  const text = read(DOCS);                                  // verifies R6.4
  assert.match(text, /verify-cmd-source-before-documenting/,
    'the skill must cite the AGENTS.md pattern that mandates checking the source');
  assert.match(text, /runbook-as-script/,
    'the skill must cite the pattern that mandates executing the doc as a script');
  assert.match(text, /\bnunca\b[^.]*\bprosa\b|\bprosa\b[^.]*\bno\b/i,
    'the skill must state explicitly that reading the prose is not verification');
});

test('R6.5: la fase es resoluble sin humano presente', () => {
  const text = read(DOCS);                                  // verifies R6.5
  assert.match(text, /^\*\*Modo de ejecución:\*\*|## Modo de ejecución/m,
    'every post-plan phase skill must declare how it reads the execution mode');
  assert.match(text, /desatendido/,
    'the skill must describe its unattended behavior — it runs after the human boundary');
});

test('R6.6: sin el registry de documentacion la fase corre igual y no bloquea', () => {
  const text = read(DOCS);                                  // verifies R6.6
  assert.match(text, /awm-documentation-registry|registry de documentación/i,
    'the skill must name the optional documentation registry');
  assert.match(text, /\bnunca\b[^.]*\bbloquea|no bloquea|sin bloquear/i,
    'the skill must state that a missing documentation registry never blocks the branch');
});

test('R6.2: el marker de cierre es awm-docs-complete', () => {
  const text = read(DOCS);                                  // verifies R6.2
  assert.match(text, /<!--\s*awm-docs-complete:\s*YYYY-MM-DD\s*-->/,
    'the skill must show the literal closing marker it writes');
});

const DEV_PROCESS = 'skills/development-process/SKILL.md';

test('R6.1: development-process rutea la fase entre QA y retro', () => {
  const text = read(DEV_PROCESS);                           // verifies R6.1
  const qa = text.indexOf('"post-implementation-qa" -> "post-implementation-docs"');
  const retro = text.indexOf('"post-implementation-docs" -> "harness-retro"');
  assert.ok(qa >= 0, 'the lifecycle graph must route QA into the documentation phase');
  assert.ok(retro >= 0, 'the lifecycle graph must route the documentation phase into retro');
  assert.doesNotMatch(text, /"post-implementation-qa" -> "harness-retro"/,
    'the old direct QA -> retro edge must be gone, not merely supplemented');
});

test('R6.2: el estado Docs pending se gatea por el marker', () => {
  const text = read(DEV_PROCESS);                           // verifies R6.2
  assert.match(text, /awm-docs-complete/,
    'the state table must gate on the new marker');
  const docsRow = text.split('\n').find(line =>
    line.includes('awm-qa-complete') && line.includes('awm-docs-complete') && line.startsWith('|'));
  assert.ok(docsRow, 'a state row must require qa-complete present and docs-complete absent');
  assert.match(docsRow, /post-implementation-docs/,
    'that row must route to the documentation phase');
});

test('R6.2: retro ya no se dispara con solo qa-complete', () => {
  const text = read(DEV_PROCESS);                           // verifies R6.2
  const retroRow = text.split('\n').find(line =>
    line.startsWith('|') && line.includes('Invoke `harness-retro`'));
  assert.ok(retroRow, 'the retro routing row must still exist');
  assert.match(retroRow, /awm-docs-complete/,
    'retro must now be gated on docs-complete, not on qa-complete alone');
});

test('R6.1: QA le cede el control a la fase de documentacion, no a finishing', () => {
  const text = read('skills/post-implementation-qa/SKILL.md');   // verifies R6.1
  assert.match(text, /Ready for `post-implementation-docs`/,
    'the QA completion report must hand off to the documentation phase');
  assert.doesNotMatch(text, /Ready for `finishing-a-development-branch`/,
    'QA must no longer name finishing as its successor');
});

test('R6.1: retro se declara disparado por el marker de documentacion', () => {
  const text = read('skills/harness-retro/SKILL.md');            // verifies R6.1
  assert.match(text, /awm-docs-complete/,
    'harness-retro must state it is routed after the documentation phase');
  assert.match(text, /post-implementation-docs/,
    'harness-retro must name the documentation phase as its predecessor');
});
