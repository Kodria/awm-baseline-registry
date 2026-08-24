// tests/r11-process-lifecycle-contract.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const root = new URL('..', import.meta.url);
const read = relative => readFileSync(new URL(relative, root), 'utf8');

const SKILL = 'skills/process-lifecycle/SKILL.md';

test('R2.1: pregunta primero en que registry vive el proceso', () => {
  const text = read(SKILL);                                    // verifies R2.1
  assert.match(text, /^name:\s*process-lifecycle\s*$/m,
    'the frontmatter name must match the directory name — directory wins for discovery');
  assert.match(text, /registry de destino|en qué registry/i,
    'the skill must ask which registry hosts the process before eliciting content');
});

test('R2.2 y R2.3: escribe en el clon del registry y rechaza ~/.awm', () => {
  const text = read(SKILL);                                    // verifies R2.2, R2.3
  assert.match(text, /~\/\.awm/,
    'the skill must name the installer territory it refuses to write to');
  assert.match(text, /\bnunca\b[^.]*~\/\.awm|~\/\.awm[^.]*\bnunca\b|rechaz[ao][^.]*~\/\.awm/i,
    'refusing to write under ~/.awm must be stated as a hard rule, not a preference');
  assert.match(text, /working copy|clon del registry/i,
    'the skill must state that the model is written into the registry working copy');
});

test('R2.4 y R2.5: elicitacion HTA con criterio de parada', () => {
  const text = read(SKILL);                                    // verifies R2.4, R2.5
  const lines = text.split('\n');
  const sgIndex = lines.findIndex(line => line.includes('SG-'));
  assert.ok(sgIndex >= 0, 'the skill must use the SG- id scheme from the model contract');
  const relationship = /SG-\d+/i;
  const nestedOp = lines.slice(sgIndex + 1).find(line => line.includes('OP-') && relationship.test(line));
  assert.ok(nestedOp,
    'the skill must show OP- operations nested under an SG- subgoal (an OP- line naming the SG-# it belongs to) — mentioning SG- and OP- independently anywhere in the document does not prove the hierarchical decomposition R2.4 requires');
  assert.match(text, /skill invocable/i,
    'the skill must state the stop criterion: decomposition ends when an operation could be an invocable skill');
});

test('R2.6: un draft existente se retoma leyendolo', () => {
  const text = read(SKILL);                                    // verifies R2.6
  assert.match(text, /status:\s*draft|`draft`/,
    'the skill must name the draft status it resumes from');
  assert.match(text, /\bno\b[^.]*volver a relatar|retoma|reanuda/i,
    'resuming must read the model, never ask the user to re-tell the process');
});

test('R2.7: delega el craft de escritura a writing-skills', () => {
  const text = read(SKILL);                                    // verifies R2.7
  assert.match(text, /REQUIRED SUB-SKILL:\s*`?writing-skills`?/,
    'the skill must delegate skill-writing craft with the canonical requirement marker');
});

test('R2.8: aporta el overlay de obligaciones de fase', () => {
  const text = read(SKILL);                                    // verifies R2.8
  const overlay = ['disparador', 'marker', 'terminación', 'gate', 'modo'];
  const lines = text.split('\n');
  const windowSize = 8;
  const hasCoherentOverlay = lines.some((_, i) => {
    const window = lines.slice(i, i + windowSize).join('\n');
    return overlay.filter(obligation => new RegExp(obligation, 'i').test(window)).length >= 3;
  });
  assert.ok(hasCoherentOverlay,
    `the phase overlay must cover at least 3 of ${overlay.join('/')} together within a small window of text — scattered independent mentions anywhere in the document do not prove a coherent overlay statement, it is the tierra de nadie writing-skills does not carry`);
});

test('R3.1: genera en loop dirigido con aprobacion por fase', () => {
  const text = read(SKILL);                                    // verifies R3.1
  assert.match(text, /aprobación por fase|aprobacion por fase/i,
    'generation must be a directed loop with per-phase approval — not a single-shot constellation');
  for (const artifact of ['orquestador', 'bundle']) {
    assert.match(text, new RegExp(artifact, 'i'),
      `the generation step must name the ${artifact} it produces`);
  }
});

test('R3.2 y R3.3: la declaracion se deriva del modelo, no se edita aparte', () => {
  const text = read(SKILL);                                    // verifies R3.2, R3.3
  assert.match(text, /awm-registry\.json/,
    'the skill must name the manifest it generates');
  for (const field of ['appliesWhen', 'terminatesTo']) {
    assert.ok(text.includes(field), `the skill must name the derived field ${field}`);
  }
  assert.match(text, /entry_point[^.]*false[^.]*\bno\b|\bno\b[^.]*orchestrator[^.]*entry_point/i,
    'entry_point false must emit no orchestrator block at all');
});

test('R3.4: verifica colision de nombres antes de escribir', () => {
  const text = read(SKILL);                                    // verifies R3.4
  assert.match(text, /colisi[óo]n|collision/i,
    'the skill must check the name against installed content before writing');
});

test('R3.5 y R3.6: el ciclo de verificacion llega a composicion real y recien ahi promueve', () => {
  const text = read(SKILL);                                    // verifies R3.5, R3.6
  assert.match(text, /awm context orchestrators/,
    'the verification cycle must use the read-only CLI surface, not a hand-rolled check');
  assert.match(text, /--verify/,
    'the skill must use the flag whose exit code is the verification verdict');
  assert.doesNotMatch(text, /~\/\.claude\/skills\/using-awm/,
    'verification must NOT read the materialized using-awm — that is a provider-specific path and a second source of truth');
  assert.match(text, /status:\s*active|`active`/,
    'the skill must name the status it promotes to');
});

test('R4.1: un modelo active se puede cargar, editar y regenerar', () => {
  const text = read(SKILL);                                    // verifies R4.1
  assert.match(text, /awm process show/,
    'loading an existing model must go through the CLI parser, never a second parser');
  assert.match(text, /regenera|regeneración/i,
    'the skill must describe regenerating the derived artifacts after an edit');
});

test('R7.1: sin el comando de verificacion degrada, no bloquea', () => {
  const text = read(SKILL);                                    // verifies R7.1
  assert.match(text, /\bnunca\b[^.]*bloquea|no bloquea|sin bloquear/i,
    'the skill must state that it never blocks the user when it cannot run');
  assert.match(text, /degrada|degradación/i,
    'the skill must describe its honest degradation path');
});

test('el skill declara como lee el modo de ejecucion', () => {
  const text = read(SKILL);                                    // verifies R7.1
  assert.match(text, /^## Modo de ejecución/m,
    'every skill that can run post-plan must declare how it reads the execution mode');
  assert.match(text, /desatendido/,
    'the skill must describe its unattended behavior');
});

const BUNDLE = 'bundles/process/bundle.json';

test('empaque: el bundle process depende de authoring y ambos son baseline', () => {
  const bundle = JSON.parse(read(BUNDLE));                     // verifies R2.7
  assert.equal(bundle.scope, 'baseline');
  assert.deepEqual(bundle.dependsOn, ['authoring'],
    'process depends on authoring: shipping it without writing-skills installed is the "uninstalled successor" degradation');
  assert.ok(bundle.skills.includes('process-lifecycle'));

  const authoring = JSON.parse(read('bundles/authoring/bundle.json'));
  assert.equal(authoring.scope, 'baseline',
    'authoring must be baseline too, or process ships a REQUIRED SUB-SKILL nobody has');
  assert.doesNotMatch(authoring.description, /enable only in the agentic-workflow repo/i,
    'that note went stale when authoring became an end-user activity');

  const catalog = JSON.parse(read('catalog.json'));
  for (const name of ['process', 'authoring']) {
    const entry = catalog.bundles.find(b => b.name === name);
    assert.ok(entry, `catalog.json must list ${name}`);
    assert.equal(entry.scope, 'baseline');
    const manifest = JSON.parse(read(`bundles/${name}/bundle.json`));
    assert.equal(entry.version, manifest.version,
      `${name}: catalog and bundle versions must agree byte for byte`);
  }
});
