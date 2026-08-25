# R3b Context Kernel and Selective Retrieval Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `subagent-driven-development`
> (recommended) or `executing-plans` to implement this plan task-by-task. Steps
> use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar en el baseline el contrato Context Kernel v1, migración protegida y recuperación selectiva nativa por rol, reduciendo al menos 50% el contexto fijo del corpus real sin eliminar reglas ni gates de calidad.

**Architecture:** `project-context-init` es dueño de una única referencia normativa; las demás skills sólo la consumen. El registry activa el parser ya publicado por R3a mediante `projectContextSchema: 1` y `minCliVersion`; los roles reciben IDs/rutas/anchors dentro de la cápsula R2, pueden hacer un único batch de lectura nativa y pasan visiblemente a full context ante cualquier incertidumbre o riesgo.

**Tech Stack:** Markdown, JSON, Node.js 20 `node:test`, Git, AWM CLI R3a publicado. No se agregan servicios, modelos, embeddings, base de datos ni dependencias npm.

**Modo de ejecución:** desatendido

> Mandato de ejecución desatendida: completar todas las tareas, revisiones,
> QA, retro y creación del PR sin pausas entre fases. El triage de retro sólo
> materializa curas recurrentes, blocker o sistémicas; el resto se documenta
> como descarte. La aceptación post-merge queda como handoff verificable.

---

## Dependencia bloqueante y frontera

- Diseño aprobado: `Kodria/agentic-workflow@c81aab088d`, `docs/plans/2026-08-25-r3-context-kernel-selective-retrieval-design.md`.
- Issue/ledger rector: `Kodria/agentic-workflow#126`.
- Base del registry: `6ef3a797c7b4259c7ece7c3586a8b81ee510d0b9` (release `v3.8.0`).
- R3b comienza sólo cuando el `gitHead` npm publicado es el commit automático
  de release que contiene directamente el merge R3a. El publicador añade ese
  commit después del merge, por lo que igualdad literal sería un falso bloqueo.
  La versión y el SHA observados se escriben literalmente en `awm-registry.json`;
  no se anticipa ninguna versión.
- La release no migra proyectos. Tras instalarla, un proyecto legacy muestra advisory y sigue usando full context. La migración de `agentic-workflow` será una operación explícita y revisada antes de R4.
- El registry declara el opt-out shell versionado en `.awm/sensors.json`; por
  diseño `awm sensors run` queda `not_certified` y `preflight --verify-sensors`
  no es gate de este repo. Las pruebas Node y los workflows `validate.yml` y
  `auto-tag.yml` son los gates nativos de R3b. No se reconfiguran sensores por
  worktree para ocultar esa distinción.

## Requirements

- **R3.1** — El registry declara schema 1 sólo con un CLI compatible publicado.
- **R3.2** — Planning muestra el advisory legacy y ofrece migración explícita sin bloquear el camino full-context.
- **R3.3** — Migración parcial/inválida bloquea handoff y selecciona full context.
- **R3.4** — Cada kernel file tiene una región protegida v1 exacta e IDs estables para reglas incondicionales.
- **R3.5** — La primera migración mapea cada regla normativa legacy exactamente a un ID kernel/card antes de reducir texto.
- **R3.6** — Mantenimiento conserva el set de IDs; quitar uno exige aprobación y razón del owner.
- **R3.7** — Retro cura lecciones en cards/index y nunca edita automáticamente la región kernel.
- **R3.8** — Exceso de budget ofrece mantenimiento con owner presente; nunca autoriza poda o borrado.
- **R3.9** — Cápsula R2 inicial lleva IDs, rutas, anchors y evidencia de rol, no cards completas por defecto.
- **R3.10** — Un rol puede hacer como máximo un batch nativo y registra ID, fuente, razón y resultado.
- **R3.11** — Segundo batch, fuente inválida/ausente, incertidumbre o riesgo seleccionado activa `full-context` visible.
- **R3.12** — Legacy conserva contexto completo y todos los gates sin requerir migración.
- **R3.13** — Codex y Claude Code obedecen el mismo contrato y resultado de calidad.
- **R3.14** — El corpus congelado baja de 67,481 a máximo 33,740 bytes fijos con todas sus reglas trazables.
- **R3.15** — El camino no agrega invocaciones model-only, dependencias ni stores de prompts, fuentes, secretos o respuestas.
- **R3.16** — T2/T3 enlazan bytes, dispatches, retrievals/fallbacks, calidad, commits, release y PR desde issue #126 sin convertir bytes en ahorro facturado.

## File Structure

| Archivo | Responsabilidad |
|---|---|
| `skills/project-context-init/references/context-kernel-v1.md` | Única definición normativa de creación, migración, selección, retrieval y fallback. |
| `skills/project-context-init/SKILL.md` | Crear/migrar índice, cards, trace y verificarlo con preflight. |
| `skills/project-constitution/SKILL.md` | Separar kernel incondicional de detalle recuperable. |
| `skills/harness-retro/SKILL.md` | Curar en cards, preservar región e inventario, escalar borrados. |
| `skills/writing-plans/SKILL.md` | Exponer advisory/degraded y mantenimiento controlado antes del handoff. |
| `skills/subagent-driven-development/SKILL.md` | Seleccionar IDs y ensamblar cápsulas R2 sin cuerpos de cards. |
| `skills/subagent-driven-development/references/evidence-capsule-v1.md` | Añadir campos contextuales y history/fallback sin duplicar el contrato kernel. |
| Tres prompts bajo `skills/subagent-driven-development/` | Obligaciones exactas de implementer/spec/code-quality. |
| `skills/post-implementation-qa/SKILL.md` y `deep-review-prompt.md` | Mismo contrato para Track A y lentes Track B. |
| `tests/fixtures/context-kernel-v1/legacy/` | Corpus inmutable real de `agentic-workflow@0e3ce7e`. |
| `tests/fixtures/context-kernel-v1/candidate/` | Migración revisable con kernel, cards, index y trace. |
| `tests/r14-context-kernel-contract.test.mjs` | Contrato, corpus, roles, paridad, privacidad y mutaciones. |
| `tests/r14-context-kernel-cli-acceptance.mjs` | Ejecutar el CLI R3a publicado contra legacy/valid/invalid. |
| `awm-registry.json`, `catalog.json`, `bundles/dev/bundle.json` | Activación y versiones de entrega. |
| Este plan | Ledger R3 T2/T3 y release evidence. |

## Contrato normativo que se debe escribir una sola vez

La referencia canónica contiene exactamente estas fronteras; las skills consumidoras enlazan el path y no copian sus tablas:

```markdown
# Context Kernel v1

This file is the sole normative Context Kernel v1 definition. Consumers MUST read it
before creating, migrating, maintaining, selecting, retrieving, or reviewing context.

## Protected Region
Each declared kernel file contains exactly one ordered pair:
<!-- AWM:CONTEXT-KERNEL:START v1 -->
<!-- AWM:CONTEXT-KERNEL:END v1 -->
Every unconditional rule inside has one unique `<!-- awm-context:CTX-... -->` anchor.
No automated maintenance edits or deletes this region.

## First Migration
Inventory every pre-migration normative rule before reducing source text. Map each
source rule to exactly one retained kernel/card ID in `docs/awm/context/migration-v1.md`.
The old and new ID inventories must compare equal. Removing an ID requires explicit
owner approval and a recorded reason.

## Selection and Retrieval
The initial Evidence Capsule v1 carries applicable context ID, repository-relative path,
anchor and role evidence; it excludes complete card bodies by default. A role may make
one native file-read batch inside its existing invocation. Retrieval history records each
ID, source, reason and result. A second batch is forbidden and selects full context.

## Full-context Triggers
second-context-request
missing-or-invalid-indexed-source
selection-uncertain
security-or-robustness
root-configuration
public-contract
uncertain-cross-cutting-impact
legacy-metadata
malformed-or-missing-evidence

Codex and Claude Code use the same obligations. Native reads do not create a new model
invocation. No prompt/source-body/secret/unrestricted-response store is permitted.
```

## Frozen corpus and measurement definition

El fixture legacy copia exactamente estos archivos desde `agentic-workflow@0e3ce7ea331647e007aebd369976aa3a12a22652`:

| Archivo | Bytes | SHA-256 |
|---|---:|---|
| `AGENTS.md` | 32,778 | `967d70c83cdbb69af36f1dcd313ac1b83f32ec5a2bff203706ada284597131d4` |
| `CONSTITUTION.md` | 30,164 | `db8751796453223e27357bf0593d84e83c0bc00d2700d05bff531e9c030723b7` |
| `CLAUDE.md` | 4,539 | `444f00ac58d96acf8d7cdbff909388279a1a46238ad83ba8fd2b63af6d5e6d22` |
| **Total legacy** | **67,481** | definición estructural T0 |

El test divide cada archivo legacy en bloques Markdown contiguos no vacíos, asigna IDs con patrón `LEGACY-FILENAME-NNN`, guarda hash/rango y exige una única fila de mapping por bloque. Es deliberadamente más fuerte que inventariar sólo lo que el migrador recuerde como “regla”: todo bloque fuente queda trazable. La equivalencia semántica se revisa además en spec review y Track A.

### Task 1: Vincular el CLI publicado y construir el gate R14 sobre corpus real

_Requirements: R3.1, R3.3, R3.5, R3.12, R3.14, R3.15_

**Files:**
- Create: `skills/project-context-init/references/context-kernel-v1.md`
- Create: `tests/fixtures/context-kernel-v1/legacy/AGENTS.md`
- Create: `tests/fixtures/context-kernel-v1/legacy/CONSTITUTION.md`
- Create: `tests/fixtures/context-kernel-v1/legacy/CLAUDE.md`
- Create: `tests/fixtures/context-kernel-v1/legacy/block-inventory.json`
- Create: `tests/r14-context-kernel-contract.test.mjs`
- Create: `tests/r14-context-kernel-cli-acceptance.mjs`
- Modify: `awm-registry.json`

- [ ] **Step 1: Demostrar la dependencia publicada antes de editar el manifest**

```bash
R3A_MERGE_SHA="$(gh pr list --repo Kodria/agentic-workflow --head feat/issue-126-r3a-context-kernel-preflight --state merged --json mergeCommit --jq '.[0].mergeCommit.oid')"
R3A_NPM_SHA="$(npm view agentic-workflow-manager gitHead)"
R3A_VERSION="$(npm view agentic-workflow-manager version)"
test -n "$R3A_MERGE_SHA"
test -n "$R3A_NPM_SHA"
gh api "repos/Kodria/agentic-workflow/commits/$R3A_NPM_SHA" --jq '.parents[].sha' | grep -qx "$R3A_MERGE_SHA"
test "$(awm --version)" = "$R3A_VERSION"
```

Expected: versión publicada, release commit y su padre merge verifican exit 0. Si falla una, R3b permanece bloqueado; no se sustituye por una versión local.

- [ ] **Step 2: Escribir el manifest con el valor observado y probarlo**

Usar `apply_patch` para reemplazar el `minCliVersion` vigente por la salida exacta de `$R3A_VERSION` obtenida en Step 1 y agregar `"projectContextSchema": 1`. El archivo final contiene sólo esas dos propiedades JSON; no conserva una variable ni una cadena simbólica. Verificar:

```bash
node -e 'const m=require("./awm-registry.json"); if(m.projectContextSchema!==1||m.minCliVersion!==process.argv[1]) process.exit(1)' "$R3A_VERSION"
```

Expected: exit 0. Esto verifica R3.1 sin adivinar versión.

- [ ] **Step 3: Congelar el corpus y su inventario determinista**

Copiar los tres blobs del commit inmutable indicado arriba. Generar `block-inventory.json` con un script dentro del test: normalizar sólo finales de línea LF, dividir por una o más líneas vacías, y guardar para cada bloque `{ id, file, startLine, endLine, sha256 }`. El test vuelve a derivar el inventario desde los blobs y exige igualdad exacta; el JSON committed es evidencia revisable, no una segunda fuente.

```js
test('R3.14: frozen corpus is exact and inventory covers every non-empty block', () => { // verifies R3.5, R3.14
  assert.deepEqual(bytesAndHashes(), {
    'AGENTS.md': [32778, '967d70c83cdbb69af36f1dcd313ac1b83f32ec5a2bff203706ada284597131d4'],
    'CONSTITUTION.md': [30164, 'db8751796453223e27357bf0593d84e83c0bc00d2700d05bff531e9c030723b7'],
    'CLAUDE.md': [4539, '444f00ac58d96acf8d7cdbff909388279a1a46238ad83ba8fd2b63af6d5e6d22'],
  });
  assert.deepEqual(readInventory(), deriveBlocksFromLegacy());
  assert.equal(totalLegacyBytes(), 67481);
});
```

- [ ] **Step 4: Crear la referencia canónica y los tests inicialmente rojos**

Escribir el contrato normativo de la sección superior más el schema/index completo del diseño. En R14, exigir:

```js
test('R3 contract has one owner and no infrastructure expansion', () => {    // verifies R3.15
  const reference = read('skills/project-context-init/references/context-kernel-v1.md');
  assert.match(reference, /sole normative Context Kernel v1 definition/);
  for (const trigger of FULL_CONTEXT_TRIGGERS) assert.match(reference, new RegExp(trigger));
  assert.doesNotMatch(reference, /embedding|vector database|retrieval service|model-only invocation/i);
  assert.equal(findDuplicateContractTables().length, 0);
});
```

Run: `node tests/r14-context-kernel-contract.test.mjs`

Expected: FAIL porque aún no existe candidate ni consumers.

- [ ] **Step 5: Crear aceptación del CLI publicado, no un segundo parser**

`r14-context-kernel-cli-acceptance.mjs` crea un `AWM_HOME` temporal, copia el registry candidate mínimo (`awm-registry.json`, `catalog.json`, `bundles/`, `skills/`), escribe `registries.json`, y ejecuta el binario de `$AWM_R3A_BIN` o `awm` con `cwd` en tres copias descartables:

```js
assert.equal(runPreflight(legacy).status, 0);                 // verifies R3.2, R3.12
assert.match(runPreflight(legacy).stdout, /context-kernel.*legacy full context/s);
assert.equal(runPreflight(candidate).status, 0);              // verifies R3.1
assert.match(runPreflight(candidate).stdout, /context-kernel/);
removeOne(candidate, '.awm/context/index.json');
assert.notEqual(runPreflight(candidate).status, 0);           // verifies R3.3
assert.match(runPreflight(candidate).stdout, /degraded|invalid|partial/i);
```

El fixture incluye `.awm/sensors.json` con todos los sensores generic declarados `enabled:false`, decisión explícita para que este test mida sólo kernel y no dependa de herramientas del host.

- [ ] **Step 6: Commit**

```bash
git add awm-registry.json skills/project-context-init/references/context-kernel-v1.md tests/fixtures/context-kernel-v1/legacy tests/r14-context-kernel-contract.test.mjs tests/r14-context-kernel-cli-acceptance.mjs
git commit -m "test(context): freeze context kernel v1 contract"
```

### Task 2: Migración inicial, kernel protegido y constitución recuperable

_Requirements: R3.3, R3.4, R3.5, R3.6, R3.14_

**Files:**
- Modify: `skills/project-context-init/SKILL.md`
- Modify: `skills/project-constitution/SKILL.md`
- Create: `tests/fixtures/context-kernel-v1/candidate/AGENTS.md`
- Create: `tests/fixtures/context-kernel-v1/candidate/CONSTITUTION.md`
- Create: `tests/fixtures/context-kernel-v1/candidate/CLAUDE.md`
- Create: `tests/fixtures/context-kernel-v1/candidate/.awm/context/index.json`
- Create: `tests/fixtures/context-kernel-v1/candidate/.awm/sensors.json`
- Create: `tests/fixtures/context-kernel-v1/candidate/docs/awm/context/migration-v1.md`
- Create: `tests/fixtures/context-kernel-v1/candidate/docs/awm/context/process.md`
- Create: `tests/fixtures/context-kernel-v1/candidate/docs/awm/context/release.md`
- Create: `tests/fixtures/context-kernel-v1/candidate/docs/awm/context/sensors.md`
- Create: `tests/fixtures/context-kernel-v1/candidate/docs/awm/context/review.md`
- Create: `tests/fixtures/context-kernel-v1/candidate/docs/awm/context/operations.md`
- Modify: `tests/r14-context-kernel-contract.test.mjs`

- [ ] **Step 1: Añadir tests rojos de trace, markers e IDs**

```js
test('R3.4-R3.6: migration is complete, unique, and protected', () => {       // verifies R3.4, R3.5, R3.6
  const index = readCandidateIndex();
  assert.equal(index.schema, 1);
  assert.equal(new Set(index.entries.map(e => e.id)).size, index.entries.length);
  assertProtectedRegions(index);
  const mapping = readMigrationTable();
  assert.deepEqual(sort(mapping.map(x => x.legacyBlock)), sort(readInventory().map(x => x.id)));
  for (const block of readInventory()) assert.equal(mapping.filter(x => x.legacyBlock === block.id).length, 1);
  for (const row of mapping) assert.ok(index.entries.some(e => e.id === row.contextId));
  assert.deepEqual(beforeIdsFromTrace(), afterIdsFromIndex());
});

test('R3.14: fixed bytes fall by at least half without losing trace', () => { // verifies R3.14
  const bytes = ['AGENTS.md', 'CONSTITUTION.md', 'CLAUDE.md'].reduce((n, f) => n + size(candidate(f)), 0);
  assert.ok(bytes <= 33740, `candidate fixed bytes ${bytes} exceed 33740`);
  assert.ok(1 - bytes / 67481 >= 0.5);
});
```

- [ ] **Step 2: Hacer que `project-context-init` sea el único writer/migrator**

Agregar un branch `Context Kernel v1` que:

1. Lee la referencia canónica completa y corre `awm preflight`.
2. Si no hay declaración activa, conserva el comportamiento legacy y no crea metadata.
3. Si hay advisory, inventaría bloques/rules antes de editar; propone kernel vs card, genera `migration-v1.md`, index y markers.
4. Compara sets de IDs pre/post y ejecuta `awm preflight`; sólo un valid/pass permite terminar.
5. Si detecta metadata parcial/invalid, no la regenera silenciosamente: reporta diagnóstico, conserva full context y exige reparación revisada.
6. Nunca edita `CLAUDE.md` salvo selección explícita del owner, aunque siempre lo cuenta en `maxFixedBytes`.

- [ ] **Step 3: Separar en `project-constitution` regla incondicional y detalle**

La skill conserva dentro de markers sólo no negociables de seguridad, robustez, release y proceso que aplican a toda tarea. Narrativa forense, ejemplos largos y reglas situacionales van a cards con IDs y `when`. Toda actualización relee el index actual y ejecuta igualdad de inventario; una eliminación requiere una entrada con formato `owner-approved removal: CTX-RELEASE-001 — superseded by CTX-RELEASE-002` registrada en migration/maintenance history.

- [ ] **Step 4: Construir y revisar el candidate fixture**

Migrar el corpus congelado siguiendo las skills ya editadas. Cada card usa anchors únicos; `migration-v1.md` tiene columnas `Legacy block | Source range/hash | Context ID | Destination | Rationale`. Antes de comprimir un bloque, su fila debe existir. Mantener `CLAUDE.md` byte-idéntico al legacy.

Run:

```bash
node tests/r14-context-kernel-contract.test.mjs
AWM_R3A_BIN="$(command -v awm)" node tests/r14-context-kernel-cli-acceptance.mjs
```

Expected: trace completo, candidate ≤33,740, CLI valid/pass.

- [ ] **Step 5: Commit**

```bash
git add skills/project-context-init skills/project-constitution tests/fixtures/context-kernel-v1/candidate tests/r14-context-kernel-contract.test.mjs
git add -f tests/fixtures/context-kernel-v1/candidate/.awm/context/index.json tests/fixtures/context-kernel-v1/candidate/.awm/sensors.json
git commit -m "feat(context): add protected kernel migration"
```

### Task 3: Mantenimiento seguro en planning y retro

_Requirements: R3.2, R3.3, R3.6, R3.7, R3.8, R3.12_

**Files:**
- Modify: `skills/harness-retro/SKILL.md`
- Modify: `skills/writing-plans/SKILL.md`
- Modify: `tests/r14-context-kernel-contract.test.mjs`

- [ ] **Step 1: Escribir tests rojos de las prohibiciones**

```js
test('R3.6-R3.8: maintenance cannot prune kernel or infer deletion authority', () => { // verifies R3.6, R3.7, R3.8
  const retro = read('skills/harness-retro/SKILL.md');
  const plans = read('skills/writing-plans/SKILL.md');
  assert.match(retro, /MUST NOT automatically edit.*protected kernel/s);
  assert.match(retro, /card and index entry/s);
  assert.match(retro, /before.*after.*ID.*equal/s);
  assert.match(retro, /explicit owner approval.*reason/s);
  assert.match(plans, /legacy full context.*advisory/s);
  assert.match(plans, /partial.*invalid.*blocking/s);
  assert.match(plans, /threshold.*does not authorize.*prun|budget.*never authorizes.*delet/s);
});
```

- [ ] **Step 2: Reemplazar merge-and-prune automático en proyecto migrado**

`harness-retro` bifurca por preflight:

- legacy → comportamiento existente sobre contexto completo;
- valid kernel → seleccionar card aplicable, merge/dedupe dentro de esa card, crear/actualizar entry+anchor, inventariar IDs antes/después, nunca tocar región protegida;
- partial/invalid → no curar ni podar hasta reparar, full-context y diagnóstico visible.

Una regla genuinamente incondicional se propone al owner; no se inserta automáticamente. Borrar ID/card requiere aprobación y razón explícitas.

- [ ] **Step 3: Añadir el gate humano correcto en `writing-plans`**

Después de `awm preflight`:

- advisory legacy: mostrar remedy y registrar si el owner migra ahora o ejecuta esta corrida con full context;
- invalid: conservar gate bloqueante existente;
- valid + context-budget excedido: ofrecer mantenimiento controlado, subir budget o continuar y anotarlo; ningún branch autoriza borrar/podar.

No cambiar la semántica existente de sensores ni el orden preflight → context-budget → handoff.

- [ ] **Step 4: Probar una mutación de poda y restaurar**

Quitar temporalmente `MUST NOT automatically edit` de `harness-retro`; ejecutar R14 y exigir FAIL con mensaje de protección. Restaurar y exigir PASS.

- [ ] **Step 5: Commit**

```bash
git add skills/harness-retro/SKILL.md skills/writing-plans/SKILL.md tests/r14-context-kernel-contract.test.mjs
git commit -m "feat(context): protect kernel during planning and retro"
```

### Task 4: Selección por rol, batch nativo único y fallback seguro

_Requirements: R3.3, R3.9, R3.10, R3.11, R3.12, R3.13, R3.15_

**Files:**
- Modify: `skills/subagent-driven-development/SKILL.md`
- Modify: `skills/subagent-driven-development/references/evidence-capsule-v1.md`
- Modify: `skills/subagent-driven-development/implementer-prompt.md`
- Modify: `skills/subagent-driven-development/spec-reviewer-prompt.md`
- Modify: `skills/subagent-driven-development/code-quality-reviewer-prompt.md`
- Modify: `skills/post-implementation-qa/SKILL.md`
- Modify: `skills/post-implementation-qa/deep-review-prompt.md`
- Modify: `tests/r13-role-evidence-capsule-contract.test.mjs`
- Modify: `tests/r14-context-kernel-contract.test.mjs`

- [ ] **Step 1: Extender primero los fixtures R13/R14**

La cápsula conserva su marcador v1 y orden actual; `sources` incorpora referencias compactas `ID | path | anchor`, y `retrieval history` registra `ID | source | reason | result`. No se agrega un segundo formato.

```js
test('R3.9-R3.11: role capsules are bounded and fail closed', () => {        // verifies R3.9, R3.10, R3.11
  const initial = assembleWithContextRefs(['CTX-PROCESS-001']);
  assert.match(initial, /CTX-PROCESS-001 \| CONSTITUTION.md \| awm-context:CTX-PROCESS-001/);
  assert.doesNotMatch(initial, /COMPLETE CONTEXT CARD BODY/);
  assert.equal(validateRetrieval(firstBatch()), null);
  assert.equal(validateRetrieval(secondBatch()), 'full-context: second-context-request');
  for (const trigger of FULL_CONTEXT_TRIGGERS) assert.equal(selectFallback(trigger), `full-context: ${trigger}`);
});

test('R3.12-R3.13: providers and legacy preserve identical obligations', () => { // verifies R3.12, R3.13
  assert.equal(dispatchContract('codex', migratedFixture), dispatchContract('claude-code', migratedFixture));
  assert.equal(dispatchContract('codex', legacyFixture).fallback, 'full-context: legacy-metadata');
  assert.deepEqual(existingQualityGateAnchors(), EXPECTED_R2_GATES);
});
```

- [ ] **Step 2: Implementar selección conservadora en el controller SDD**

Antes de cada dispatch, leer index validado por preflight y seleccionar entries cuyo `when`, surface y requirements aplican. La cápsula inicial contiene referencias, no cuerpos. Si no se puede demostrar aplicabilidad, seleccionar `full-context: selection-uncertain` antes del dispatch.

El rol puede responder una vez con `NEEDS_CONTEXT` nombrando IDs/fuentes; el controller hace un solo batch de reads nativos dentro de la misma invocación, actualiza history y re-dispatcha. Segundo pedido o cualquier trigger R3.11 toma full context. No hay comando CLI de retrieval ni llamada de medición.

- [ ] **Step 3: Aplicar el mismo contrato a todos los roles existentes**

Actualizar implementer, specification, code-quality, Track A y cada Track B lens. Track B conserva su exclusión de plan completo y recibe sólo cards relevantes a su lente. Todas las obligaciones previas de self-review, anti-bias, sensores, blockers, findings y design-fidelity permanecen.

Codex/Claude sólo difieren en el mecanismo nativo de lectura/dispatch; IDs, history, triggers, evidencia y verdict son idénticos.

- [ ] **Step 4: Ejecutar regresión y mutaciones**

```bash
node tests/r13-role-evidence-capsule-contract.test.mjs
node tests/r14-context-kernel-contract.test.mjs
```

Expected: PASS. Luego probar por separado y restaurar estas mutaciones: borrar un role; borrar `second-context-request`; insertar card completa en initial capsule; cambiar sólo Claude a dos batches; borrar un quality gate. Cada una debe producir exit no-cero y mensaje específico.

- [ ] **Step 5: Commit**

```bash
git add skills/subagent-driven-development skills/post-implementation-qa tests/r13-role-evidence-capsule-contract.test.mjs tests/r14-context-kernel-contract.test.mjs
git commit -m "feat(context): add bounded role retrieval"
```

### Task 5: Versiones, gates de release y ledger T2/T3

_Requirements: R3.1, R3.12, R3.14, R3.15, R3.16_

**Files:**
- Modify: `skills/project-context-init/SKILL.md`
- Modify: `skills/project-constitution/SKILL.md`
- Modify: `skills/harness-retro/SKILL.md`
- Modify: `skills/writing-plans/SKILL.md`
- Modify: `skills/subagent-driven-development/SKILL.md`
- Modify: `skills/post-implementation-qa/SKILL.md`
- Modify: `catalog.json`
- Modify: `bundles/dev/bundle.json`
- Modify: `.github/workflows/validate.yml`
- Modify: `.github/workflows/auto-tag.yml`
- Modify: `docs/plans/2026-08-25-r3b-context-kernel-retrieval-plan.md`

- [ ] **Step 1: Aplicar bumps coordinados**

Versiones exactas de contenido:

| Artefacto | Antes | Después |
|---|---:|---:|
| `project-context-init` | 1.0.1 | 1.1.0 |
| `project-constitution` | 1.1.2 | 1.2.0 |
| `harness-retro` | 2.6.3 | 2.7.0 |
| `writing-plans` | 1.8.0 | 1.9.0 |
| `subagent-driven-development` | 1.10.0 | 1.11.0 |
| `post-implementation-qa` | 1.7.0 | 1.8.0 |
| bundle `dev` en catálogo y bundle | 3.7.0 | 3.8.0 |

No fijar manualmente el tag del registry; `auto-tag.yml` lo deriva del título conventional del merge.

- [ ] **Step 2: Incorporar R14 en ambos jobs que protegen entrega**

Agregar, después de R13 y antes de version-gates, en `validate.yml` y en `auto-tag.yml`:

```yaml
- run: node tests/r14-context-kernel-contract.test.mjs
- run: node tests/r14-context-kernel-cli-acceptance.mjs
```

En ambos workflows cambiar `actions/setup-node` de Node 20 a Node 22, que es el engine mínimo del CLI publicado. Antes de R14 en `validate.yml` y antes del bloque `Verify registry before tagging` en `auto-tag.yml`, agregar este step, que lee la versión del manifest y no la duplica en YAML:

```yaml
- name: Install Context Kernel compatible CLI
  run: |
    R3A_VERSION="$(node -p "require('./awm-registry.json').minCliVersion")"
    npm install --global "agentic-workflow-manager@$R3A_VERSION"
```

- [ ] **Step 3: Completar T2/T3 con datos observados**

Agregar `## Release Evidence` con filas R3 T2 y T3: legacy/candidate bytes, porcentaje estructural, inventario/mapping counts, dispatches reales, retrievals/fallbacks naturales, hallazgos/correcciones/rollback, provider usage `unobservable`, owner quota sólo si fue entregada, commits, PR y tags/releases. Escribir expresamente `structural bytes are not billed-token or cost savings`.

Verificación:

```bash
rg -n '^\| R3 T2 |^\| R3 T3 |67,481|33,740|unobservable|structural bytes are not billed-token or cost savings|issue #126' docs/plans/2026-08-25-r3b-context-kernel-retrieval-plan.md
```

- [ ] **Step 4: Ejecutar una sola matriz local completa**

```bash
node scripts/validate-portability.mjs
node tests/validate-portability.test.mjs
for test_file in tests/r3-release-metadata.test.mjs tests/cycle-evidence-capture-contract.test.mjs tests/r3-retro-contract.test.mjs tests/r8-sensor-gate-contract.test.mjs tests/r9-declared-orchestrators-contract.test.mjs tests/r10-documentation-phase-contract.test.mjs tests/r11-process-lifecycle-contract.test.mjs tests/r12-context-footprint-contract.test.mjs tests/r13-role-evidence-capsule-contract.test.mjs tests/r14-context-kernel-contract.test.mjs tests/r14-context-kernel-cli-acceptance.mjs tests/release-skill-version-gate.test.mjs tests/codex-session-start.test.mjs tests/session-start.test.mjs tests/sensor-pack-eslint.test.mjs tests/sensor-pack-shape.test.mjs tests/sensor-pack-python-shell-generic.test.mjs tests/sensor-pack-variants.test.mjs tests/sensor-pack-coverage.test.mjs tests/sensor-pack-coverage-mutations.test.mjs; do node "$test_file"; done
node --test tests/sensor-pack-rules-fire.test.mjs
./scripts/check-skill-version-bumps.sh origin/main
git diff --check
```

Expected: todos PASS. No repetir la matriz si no cambia el commit.

- [ ] **Step 5: Commit y cierre normal hasta PR**

```bash
git add awm-registry.json catalog.json bundles/dev/bundle.json skills tests .github/workflows docs/plans/2026-08-25-r3b-context-kernel-retrieval-plan.md
git add -f tests/fixtures/context-kernel-v1/candidate/.awm/context/index.json tests/fixtures/context-kernel-v1/candidate/.awm/sensors.json
git commit -m "feat(context): release context kernel v1"
git status --short
```

Expected: árbol limpio. Ejecutar `post-implementation-qa` → `post-implementation-docs` → `harness-retro` → `finishing-a-development-branch`. El PR se titula `feat(context): release context kernel v1` para producir bump minor automático.

- [ ] **Step 6: Verificar release y checkpoint GitHub**

Después del merge autorizado:

```bash
gh run list --repo Kodria/awm-baseline-registry --workflow validate.yml --limit 3
gh run list --repo Kodria/awm-baseline-registry --workflow auto-tag.yml --limit 3
R3B_MERGE_SHA="$(gh pr list --repo Kodria/awm-baseline-registry --head feat/issue-126-r3b-context-kernel-retrieval --state merged --json mergeCommit --jq '.[0].mergeCommit.oid')"
R3B_TAG="$(git ls-remote --tags git@github.com:Kodria/awm-baseline-registry.git | awk -v sha="$R3B_MERGE_SHA" '$1==sha && $2 ~ /refs\/tags\/v[0-9]+\.[0-9]+\.[0-9]+$/ {sub("refs/tags/", "", $2); print $2}' | tail -1)"
test -n "$R3B_TAG"
```

Expected: validate/auto-tag success y tag resolviendo al merge. Comentar issue #126 con PR, merge, tag, CLI mínimo, T2/T3, bytes exactos, inventario, gates, retrieval/fallback y limitaciones. Verificar el comentario con `gh issue view 126 --repo Kodria/agentic-workflow --comments`.

## Traceability Matrix

| Req | Task(s) | Verificación específica |
|---|---|---|
| R3.1 | T1, T5 | ancestry release npm→merge, manifest schema/minCLI, aceptación published CLI |
| R3.2 | T1, T3 | legacy advisory ready en CLI y planning lo expone |
| R3.3 | T1, T2, T3, T4 | candidate parcial falla, migration repair, retro bloquea, fallback malformed |
| R3.4 | T2 | cardinalidad de markers y anchors dentro de región |
| R3.5 | T1, T2 | inventario derivado y mapping exactamente uno por bloque |
| R3.6 | T2, T3 | igualdad de sets y aprobación+razón para quitar ID |
| R3.7 | T3 | contract test fuerza card/index y prohíbe editar kernel |
| R3.8 | T3 | test específico prohíbe que budget autorice poda/borrado |
| R3.9 | T4 | cápsula contiene refs y excluye cuerpo completo |
| R3.10 | T4 | first-batch válido con history ID/source/reason/result |
| R3.11 | T1, T4 | second batch y lista completa de triggers seleccionan full-context |
| R3.12 | T1, T3, T4, T5 | legacy full-context, gates R2 preservados y regresión completa |
| R3.13 | T4 | igualdad exacta Codex/Claude y mutation de divergencia |
| R3.14 | T1, T2, T5 | hashes 67,481, candidate ≤33,740 y trace completo |
| R3.15 | T1, T4, T5 | no infraestructura/dependencias/stores; suite y release gates |
| R3.16 | T5 | T2/T3, evidencia exacta y comentario verificable en issue #126 |

Forward gaps: ninguno. Backward gaps: ninguno. El plan es serial: manifest/CLI, fixtures, referencia, skills y R14 son recursos compartidos y las tareas posteriores dependen del estado producido por las anteriores.

## Release Evidence

Durante Task 5 se agregan las filas observadas R3 T2 y T3. La medición cerrada de entrada es 67,481 bytes; el acceptance threshold es 33,740. Provider usage permanece `unobservable` salvo telemetría nativa y structural bytes are not billed-token or cost savings.
