// tests/r11-process-lifecycle-contract.test.mjs
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = new URL('..', import.meta.url);
const rootPath = fileURLToPath(root);
const read = relative => readFileSync(new URL(relative, root), 'utf8');

const SKILL = 'skills/process-lifecycle/SKILL.md';

function section(text, heading) {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex(line => line === heading);
  assert.ok(start >= 0, `missing section: ${heading}`);
  const end = lines.findIndex((line, index) => index > start && /^## /.test(line));
  return lines.slice(start, end >= 0 ? end : lines.length).join('\n');
}

function assertTogether(text, terms, windowSize, message) {
  const lines = text.split(/\r?\n/);
  const found = lines.some((_, index) => {
    const window = lines.slice(index, index + windowSize).join('\n');
    return terms.every(term => term.test(window));
  });
  assert.ok(found, message);
}

function assertCliAcceptanceWiring(source, workflow) {
  const lines = source.split(/\r?\n/);
  const installStep = lines.findIndex(line =>
    /^\s*-\s+name:\s+Install Context Kernel compatible CLI\s*$/.test(line));
  const installCommand = lines.findIndex(line =>
    /^\s*npm install --global "agentic-workflow-manager@\$R3A_VERSION"\s*$/.test(line));
  const acceptance = lines.findIndex(line =>
    /^\s*(?:-\s+run:\s*)?node tests\/r11-process-lifecycle-cli-acceptance\.mjs\s*$/.test(line));
  assert.ok(installStep >= 0, `${workflow} must name the compatible published CLI install step`);
  assert.ok(installCommand > installStep,
    `${workflow} must install the compatible published CLI with an executable npm command`);
  assert.ok(acceptance > installCommand,
    `${workflow} must run the process-lifecycle CLI acceptance after installing the compatible CLI`);
}

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
  const sgLine = /^-\s+SG-(\d+)\s+—\s+\S/;
  const opLine = /^\s+-\s+OP-(\d+)\.\d+\s+—\s+\S/;
  const sgIndex = lines.findIndex(line => sgLine.test(line));
  assert.ok(sgIndex >= 0,
    'the skill must show a literal `- SG-N — text` line in the exact shape accepted by the CLI parser');
  const owner = sgLine.exec(lines[sgIndex])[1];
  const nestedOp = lines.slice(sgIndex + 1).find(line => {
    const match = opLine.exec(line);
    return match !== null && match[1] === owner;
  });
  assert.ok(nestedOp,
    'the skill must show an indented `- OP-N.x — text` accepted by the CLI parser, with a numeric prefix matching its SG-N parent and no redundant `(SG-N)` annotation');
  assert.match(text, /skill invocable/i,
    'the skill must state the stop criterion: decomposition ends when an operation could be an invocable skill');
});

test('R2.6: un draft existente se retoma leyendolo', () => {
  const text = read(SKILL);                                    // verifies R2.6
  assert.match(text, /status:\s*draft|`draft`/,
    'the skill must name the draft status it resumes from');
  const sentences = text.split(/(?<=\.)\s+/);
  const affirmsResumeByReading = sentences.some(sentence =>
    /\bretoma\b|\breanuda\b/i.test(sentence) && !/\bnunca\b/i.test(sentence));
  assert.ok(affirmsResumeByReading,
    'resuming must be stated as an affirmative claim — a sentence containing retoma/reanuda that does not also carry a nunca negation in the same sentence — never ask the user to re-tell the process; an ungrouped alternation would let a bare "retoma" inside a negated sentence satisfy this wrongly');
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

test('R2.9: solo la intención durable explícita activa el ciclo', () => {
  const applies = section(read(SKILL), '## Cuándo aplica');   // verifies R2.9
  assertTogether(applies, [/intenci[oó]n/i, /durable/i, /expl[ií]cit/i], 4,
    'the trigger must require explicit durable intent');
  assertTogether(applies, [/pasos|procedural|procedimiento/i, /no activa|no invoca/i], 4,
    'procedural-looking work alone must not trigger process-lifecycle');
});

test('R2.10-R2.13 y R2.18: la frontera de contexto es abierta, host-owned y no confiable', () => {
  const context = section(read(SKILL), '## Incorporación de contexto');
  // verifies R2.10, R2.11, R2.12, R2.13, R2.18
  assert.match(context, /cualquier capacidad disponible del host/i);
  assert.match(context, /ejemplos no exhaustivos|lista no exhaustiva/i);
  assertTogether(context, [/host/i, /obtiene|recupera|interpreta/i, /antes/i, /model/i], 6,
    'the host must obtain and interpret context before AWM modeling');
  assertTogether(context, [/sin contexto|ninguna fuente/i, /entrevista HTA/i], 5,
    'no-source creation must retain the HTA path');
  assertTogether(context, [/fuente|contenido/i, /datos/i, /no.*instrucciones/i], 5,
    'source material must be treated as data, never instructions');
  assertTogether(context, [/no implementa|sin/i, /adapter/i, /proveedor/i], 5,
    'the skill must reject provider-specific adapters');
});

test('R2.14-R2.17 y R2.19: reconcilia evidencia antes de persistir', () => {
  const context = section(read(SKILL), '## Incorporación de contexto');
  // verifies R2.14, R2.15, R2.16, R2.17, R2.19
  for (const category of ['respaldad', 'inferid', 'contradic', 'vacío']) {
    assert.match(context, new RegExp(category, 'i'), `missing evidence category ${category}`);
  }
  assertTogether(context, [/memoria|inferencia/i, /## Sin verificar|Sin verificar/i], 5,
    'memory and inferences must remain unverified');
  assertTogether(context, [/ef[ií]mer/i, /sesi[oó]n/i, /solo|[uú]nicamente/i, /modelo/i], 7,
    'normalized context must remain session-local and only the model durable');
  assertTogether(context, [/precarg/i, /vac[ií]os|contradicciones|decisiones/i, /pregunt/i], 6,
    'confirmed context must prefill the model and narrow questions to unresolved matters');
  assertTogether(context, [/contradic/i, /resolver|resoluci[oó]n/i, /antes de generar/i], 6,
    'contradictions must block generation until user resolution');
});

test('R3.1: genera en loop dirigido con aprobacion por fase', () => {
  const text = read(SKILL);                                    // verifies R3.1
  const lines = text.split('\n');
  const startIdx = lines.findIndex(line => /^## Paso 3 — Generación/.test(line));
  assert.ok(startIdx >= 0, 'the skill must have a "## Paso 3 — Generación" section');
  const endIdx = lines.findIndex((line, i) => i > startIdx && /^## /.test(line));
  const section = lines.slice(startIdx, endIdx >= 0 ? endIdx : lines.length).join('\n');
  assert.match(section, /aprobación por fase|aprobacion por fase/i,
    'generation must be a directed loop with per-phase approval — not a single-shot constellation');
  for (const artifact of ['orquestador', 'bundle']) {
    assert.match(section, new RegExp(artifact, 'i'),
      `the generation step must name the ${artifact} it produces, scoped to the Paso 3 section — an unrelated frontmatter/overview mention elsewhere in the document does not prove the generation loop actually produces it`);
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
  const lines = text.split('\n');
  const windowSize = 3;
  const hasPreWriteCollisionCheck = lines.some((_, i) => {
    const window = lines.slice(i, i + windowSize).join('\n');
    return /colisi[óo]n|collision/i.test(window) && /antes de escribir|before writing/i.test(window);
  });
  assert.ok(hasPreWriteCollisionCheck,
    'the skill must check the name against installed content specifically before writing — colisión/collision must co-occur with antes de escribir/before writing within a small window, not just appear anywhere in the document (e.g. the unattended-mode BLOCKED-escalation mention of colisión does not by itself prove a pre-write check exists)');
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

test('R3.7-R3.10 y R3.13-R3.14: verifica la forma real del registry destino', () => {
  const conformity = section(read(SKILL), '## Conformidad del registry destino');
  // verifies R3.7, R3.8, R3.9, R3.10, R3.13, R3.14
  for (const term of ['estructura', 'bundle', 'catalog.json', 'versionado', 'validadores']) {
    assert.match(conformity, new RegExp(term.replace('.', '\\.'), 'i'), `missing ${term}`);
  }
  assertTogether(conformity, [/modelo/i, /skills de fase/i, /bundle/i], 7, 'model and every phase skill must belong to the target bundle');
  assertTogether(conformity, [/bundle/i, /catalog\\.json/i, /declarad/i], 6, 'the bundle must be declared in catalog.json');
  assertTogether(conformity, [/version/i, /catalog\\.json/i, /bundle\\.json/i, /coincid/i], 6, 'bundle metadata versions must match');
  assertTogether(conformity, [/referencia/i, /resuelv|exist/i], 5, 'catalog and bundle references must resolve');
  assertTogether(conformity, [/pol[ií]tica/i, /bump/i], 5, 'version bumps must follow the target registry policy');
  assertTogether(conformity, [/ejecut/i, /validadores/i, /registry destino/i], 5, 'target-provided validators must run');
});

test('R3.11-R3.12 y R3.15: separa metadata de bundle y publicación autorizada', () => {
  const conformity = section(read(SKILL), '## Conformidad del registry destino');
  // verifies R3.11, R3.12, R3.15
  assertTogether(conformity, [/tag/i, /registry/i, /bundle/i, /independ/i], 6, 'registry tag and bundle versions must be independent counters');
  assertTogether(conformity, [/informa|reporta/i, /publicaci[oó]n/i, /pendiente/i], 5, 'the skill must report the pending publication mechanism');
  assertTogether(conformity, [/no crea|no empuja|nunca crea/i, /tag/i, /autorizad/i], 6, 'the skill must not publish tags outside the authorized flow');
});

test('R4.1: un modelo active se puede cargar, editar y regenerar', () => {
  const text = read(SKILL);                                    // verifies R4.1
  assert.match(text, /awm process show/,
    'loading an existing model must go through the CLI parser, never a second parser');
  assert.match(text, /regenera|regeneración/i,
    'the skill must describe regenerating the derived artifacts after an edit');
});

test('R4.2 y R4.4: extracción y retrospectiva usan el mismo flujo', () => {
  const context = section(read(SKILL), '## Incorporación de contexto');
  // verifies R4.2, R4.4
  assert.match(context, /skills.*documentos.*herramientas.*conversaci[oó]n.*memoria|combinaci[oó]n/i);
  assertTogether(context, [/retrospectiv|conversaci[oó]n/i, /mismo flujo/i], 5, 'retrospective capture must use the same reconciliation flow');
  assertTogether(context, [/retrospectiv|conversaci[oó]n/i, /sin|no/i, /adapter|artefacto|release/i], 7, 'retrospective capture must not introduce separate adapters, artifacts, or releases');
});

test('R4.3: el round-trip compara dimensiones funcionales y reporta pérdida', () => {
  const roundTrip = section(read(SKILL), '## Round-trip semántico'); // verifies R4.3
  for (const dimension of ['objetivo', 'aplicabilidad', 'jerarquía', 'ruteo', 'gates', 'terminación', 'modo de ejecución', 'obligaciones de fases']) {
    assert.match(roundTrip, new RegExp(dimension, 'i'), `missing round-trip dimension ${dimension}`);
  }
  assertTogether(roundTrip, [/p[eé]rdida/i, /report/i, /antes de publicar/i], 5, 'semantic loss must be reported before publication');
  assert.match(roundTrip, /development-process/);
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

test('el gate de aceptación CLI corre después de instalar el CLI en validación y release', () => {
  for (const workflow of ['.github/workflows/validate.yml', '.github/workflows/auto-tag.yml']) {
    assertCliAcceptanceWiring(read(workflow), workflow);
  }
});

test('el gate de workflow rechaza una aceptación presente solo como comentario', () => {
  const workflow = '.github/workflows/validate.yml';
  const source = read(workflow);
  const commented = source.replace(
    /^(\s*)- run: node tests\/r11-process-lifecycle-cli-acceptance\.mjs\s*$/m,
    '$1# node tests/r11-process-lifecycle-cli-acceptance.mjs',
  );
  assert.notEqual(commented, source, 'the mutation must comment out the executable acceptance step');
  assert.throws(() => assertCliAcceptanceWiring(commented, workflow),
    /must run the process-lifecycle CLI acceptance/,
    'a comment must not satisfy the executable workflow gate');
});

test('el gate de workflow rechaza una instalación del CLI presente solo como comentario', () => {
  for (const workflow of ['.github/workflows/validate.yml', '.github/workflows/auto-tag.yml']) {
    const source = read(workflow);
    const commented = source.replace(
      /^(\s*)npm install --global "agentic-workflow-manager@\$R3A_VERSION"\s*$/m,
      '$1# npm install --global "agentic-workflow-manager@$R3A_VERSION"',
    );
    assert.notEqual(commented, source, `the mutation must comment out the executable CLI install in ${workflow}`);
    assert.throws(() => assertCliAcceptanceWiring(commented, workflow),
      /must install the compatible published CLI/,
      'an install step name without its executable npm command must not satisfy the workflow gate');
  }
});

test('la aceptación CLI limita cuánto espera por un binario que no responde', () => {
  const sandbox = mkdtempSync(path.join(os.tmpdir(), 'awm-r11-timeout-'));
  try {
    const slowAwm = path.join(sandbox, 'slow-awm');
    writeFileSync(slowAwm, '#!/usr/bin/env node\nsetTimeout(() => process.exit(0), 750);\n');
    chmodSync(slowAwm, 0o755);

    const result = spawnSync(process.execPath, ['tests/r11-process-lifecycle-cli-acceptance.mjs'], {
      cwd: rootPath,
      env: {
        ...process.env,
        AWM_PROCESS_BIN: slowAwm,
        AWM_PROCESS_TIMEOUT_MS: '50',
      },
      encoding: 'utf8',
      timeout: 2_000,
    });
    const output = result.stdout + result.stderr;

    assert.notEqual(result.error?.code, 'ETIMEDOUT', 'the acceptance harness itself must finish');
    assert.notEqual(result.status, 0, 'the acceptance must fail when the CLI exceeds its deadline');
    assert.match(output, /timed out after 50ms/,
      'the failure must explain which CLI boundary timed out');
  } finally {
    rmSync(sandbox, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  }
});
