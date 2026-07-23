# Flow-Cleanup de Skills de Arquitectura y Advisory — Implementation Plan

<!-- awm-qa-complete: 2026-07-23 -->

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Limpiar referencias muertas y ambigüedades en las skills de arquitectura/advisory, activar el gate de specialists en brainstorming, retirar cicd-proposal-builder, llevar mermaid-diagrams al registry y formalizar el patrón environment-port con trazabilidad en issues.

**Architecture:** 8 tareas secuenciales sobre contenido markdown/JSON del registry. Spec: `docs/plans/2026-07-23-architecture-flow-cleanup-design.md` (R1–R7). Sin código ejecutable; verificación por grep/lint estructural + lectura dirigida.

**Tech Stack:** Markdown (SKILL.md formato baseline), JSON de bundles/catalog, GitHub MCP para issues.

**Modo de ejecución:** desatendido

> Mandato de ejecución desatendida: ejecución completa sin pausas de check-in
> entre tareas, ni de confirmación entre fases (development-process rutea
> automáticamente y subagent-driven-development no pregunta si continuar con
> el cierre). harness-retro triagea con criterio propio del agente (solo valor
> real, recurrente o sistémico — descarta el resto sin preguntar).
> post-implementation-qa corrige TODOS los hallazgos que surjan, no solo algunos.
> finishing-a-development-branch crea el PR directamente (opción "push + PR"),
> sin presentar el menú de 4 opciones.

---

**Convenciones para TODOS los tasks:**

- Rama: `claude/awm-v1-4-0-frontend-upgrade-bcd3gq`. Commit conventional por task. Idioma del contenido: inglés.
- Regla de sesión previa (CONSTITUTION "Revisión de código"): al referenciar un artefacto compartido mutable (bundle.json, otra SKILL.md), releerlo con Read/grep en su estado ACTUAL antes de afirmar algo sobre él — no confiar en los números de línea de este plan si el archivo cambió en un task anterior.
- Lint estructural para skills nuevas:
  ```bash
  f=skills/<nombre>/SKILL.md
  head -1 "$f" | grep -qx -- '---' && grep -q '^name: <nombre>$' "$f" && grep -q '^version:' "$f" && grep -q '^description:' "$f" && grep -q '^## Termination' "$f" && grep -q '^## Cross-Cutting Rules' "$f" && echo LINT-OK
  ```

---

### Task 1: `mermaid-diagrams` al registry

_Requirements: R4_

**Files:**
- Create: `skills/mermaid-diagrams/SKILL.md`
- Create: `skills/mermaid-diagrams/references/` (7 archivos copiados)
- Modify: `bundles/dev/bundle.json` (agregar entrada on-signal)
- Read: `~/.claude/skills/mermaid-diagrams/SKILL.md` (fuente, 217 líneas) y `~/.claude/skills/mermaid-diagrams/references/*.md` (7 archivos)

- [ ] **Step 1: Copiar las references tal cual.** `cp ~/.claude/skills/mermaid-diagrams/references/*.md skills/mermaid-diagrams/references/` — los 7 archivos (advanced-features, architecture-diagrams, c4-diagrams, class-diagrams, erd-diagrams, flowcharts, sequence-diagrams) son contenido genérico correcto; no se editan.

- [ ] **Step 2: Adaptar `SKILL.md`.** Partir del SKILL.md personal (leerlo completo) conservando TODO su contenido técnico (tipos de diagrama, guía de sintaxis, punteros a references), y adaptar al formato baseline:
  - Frontmatter: `name: mermaid-diagrams`, `version: "1.0.0"`, y la description del personal (ya es activadora y en inglés — conservarla).
  - Añadir `## Cross-Cutting Rules` con: (1) *"Diagrams are always delivered as Mermaid text blocks — version-controllable, never as rendered images";* (2) *"When invoked by another skill (architecture-extraction, architecture-assessment, architecture-advisor, brainstorming), return the diagram to the invoker and end — never take over the flow or produce a standalone artifact the invoker didn't ask for."*
  - Añadir `## Termination`: devuelve el/los diagramas al invocador (modo contextual) o los entrega inline en la conversación (modo directo); nunca orquesta ni invoca otras skills.

- [ ] **Step 3: Agregar al bundle `dev`.** En `bundles/dev/bundle.json`, en el array `skills`, agregar tras la entrada de `technology-evaluator`:

```json
    {
      "name": "mermaid-diagrams",
      "onSignal": true
    }
```

(NO bumpear `version` aquí — eso es Task 7.)

- [ ] **Step 4: Verificar**

Run: `f=skills/mermaid-diagrams/SKILL.md; head -1 "$f" | grep -qx -- '---' && grep -q '^name: mermaid-diagrams$' "$f" && grep -q '^## Termination' "$f" && grep -q '^## Cross-Cutting Rules' "$f" && ls skills/mermaid-diagrams/references/ | wc -l && python3 -c "import json; json.load(open('bundles/dev/bundle.json')); print('JSON-OK')"`
Expected: 7 references + `JSON-OK` (y el lint pasa silencioso)

- [ ] **Step 5: Commit**

```bash
git add skills/mermaid-diagrams/ bundles/dev/bundle.json
git commit -m "feat(dev): mermaid-diagrams native in registry — adapted from personal skill (#6)"
```

---

### Task 2: Cortar Fases 6 muertas en las 3 advisory

_Requirements: R1, R1.1, R1.2, R4.1_

**Files:**
- Modify: `skills/architecture-advisor/SKILL.md` (Phase 6 ~línea 111-121; fila de diagramas ~línea 132; nota contextual ~línea 135)
- Modify: `skills/technology-evaluator/SKILL.md` (modo contextual ~línea 20; Phase 6 ~línea 102-110)
- Modify: `skills/nfr-checklist-generator/SKILL.md` (Phase 5 ~línea 108-116)

- [ ] **Step 1: `architecture-advisor`.** Reemplazar la tabla de Phase 6 (destinos `docs-brainstorming`/`docs-system-orchestrator`/`docs-assistant`) y la "Important note on diagrams" por entrega directa:

```markdown
### Phase 6: Generate design artifact

Compile all decisions into a structured artifact and deliver it directly:

| Invoked from | Artifact | Who executes |
|---|---|---|
| `brainstorming` | Result returned to `brainstorming` to integrate into the design | `brainstorming` continues its flow (writes design doc, then calls `writing-plans`) |
| Standalone | Architecture document — a single portable `.md` | This skill delivers it directly: in an AWM repo, offer to save under `docs/` or download; standalone, deliver the file for the user to place |

**Note on diagrams:** when the architecture document benefits from diagrams (context, container, key flows), invoke `mermaid-diagrams` (registry skill, dev bundle) to produce them as Mermaid text blocks embedded in the document.
```

  Además: en la tabla de Contextual Mode, la fila `"I need diagrams for this" | Delegate directly to c4-architecture...` cambia a `"I need diagrams for this" | Invoke mermaid-diagrams with the architectural context`.

- [ ] **Step 2: `technology-evaluator`.** (a) En la fila de Contextual Mode (~línea 20), `(brainstorming, docs-brainstorming, discovery-assistant)` → `(brainstorming, architecture-advisor, or any skill that already has context)` (corregido post-review: `architecture-advisor` SÍ la invoca — advisor:95; `architecture-assessment` no la invoca desde ningún lado). (b) Reemplazar la tabla de Phase 6 por el mismo patrón de entrega directa (invocador → devolver resultado; standalone → `.md` portable entregado por esta skill, repo→docs/ o descarga).

- [ ] **Step 3: `nfr-checklist-generator`.** Reemplazar la tabla de Phase 5 igual: invocador → devolver; standalone → "Prioritized NFR document with timing matrix" como `.md` portable entregado directamente.

- [ ] **Step 4: Verificar (R1.1)**

Run: `grep -rn "docs-assistant\|docs-brainstorming\|docs-system-orchestrator\|c4-architecture\|discovery-assistant" skills/architecture-advisor/ skills/technology-evaluator/ skills/nfr-checklist-generator/ | wc -l`
Expected: `0`

Run: `grep -c "mermaid-diagrams" skills/architecture-advisor/SKILL.md`
Expected: ≥ 2 (nota de Phase 6 + fila contextual)

- [ ] **Step 5: Commit**

```bash
git add skills/architecture-advisor/SKILL.md skills/technology-evaluator/SKILL.md skills/nfr-checklist-generator/SKILL.md
git commit -m "fix(dev): advisory skills deliver artifacts directly — dead docs-*/c4 routing removed (#6)"
```

---

### Task 3: Gate activo de specialists

_Requirements: R2, R2.1, R2.2, R2.3_

**Files:**
- Modify: `skills/brainstorming/SKILL.md` (frontmatter línea 3; checklist item 4 ~línea 58; sección "## Specialist Skills Awareness" ~línea 286)
- Modify: `skills/architecture-assessment/SKILL.md` (frontmatter línea 3; sección "Reuse of architecture-advisor" ~línea 126-145)

- [ ] **Step 1: Bump versions.** `brainstorming` `"1.2.0"` → `"1.3.0"`; `architecture-assessment` `"1.0.0"` → `"1.1.0"`.

- [ ] **Step 2: Checklist item 4 de brainstorming.** Cambiar a: `4. **Propose 2-3 approaches** — run the specialist gate first (see Specialist Gate section), then present trade-offs and your recommendation`.

- [ ] **Step 3: Reescribir la sección pasiva como gate.** Renombrar `## Specialist Skills Awareness` → `## Specialist Gate (mandatory sub-step of "Propose 2-3 approaches")` y reemplazar el párrafo "if you detect... you may invoke" por la redacción normativa del design doc:

```markdown
Before presenting approaches, evaluate each specialist domain explicitly — architecture pattern choice (`architecture-advisor`), technology selection (`technology-evaluator`), NFR definition (`nfr-checklist-generator`). For each: if the design involves it, invoke the specialist in contextual mode and integrate its output into the approaches; if it does not, state "not applicable" for that domain. Silence is not a valid gate outcome.
```

  La tabla de dominios se conserva como referencia del gate (qué skill cubre qué dominio) SIN la fila de `cicd-proposal-builder` (se elimina — R2.1/R3) y sin el lenguaje "may invoke". Las Rules existentes (solo complejidad significativa, modo contextual, output integrado, brainstorming mantiene el control) se conservan — siguen siendo válidas como criterios DE UMBRAL dentro del gate (un dominio puede "aplicar" pero ser trivial → declararlo así cuenta como resultado explícito del gate).

- [ ] **Step 4: Mismo endurecimiento en assessment.** En `skills/architecture-assessment/SKILL.md`, la frase "When Phase 3's analysis of the real system would benefit from a second, architecture-design-trained pass — ... — invoke `architecture-advisor`" se reformula como gate: al cerrar Phase 3, evaluar explícitamente si el análisis necesita una segunda opinión de diseño (¿hay hallazgos que cuestionan el diseño en sí, no solo su comportamiento ante escenarios?); si sí → invocar `architecture-advisor` en Contextual Mode (fila "Validate whether this architecture makes sense"); si no → declarar "advisor pass: not applicable" en el informe. El silencio no es un resultado válido.

- [ ] **Step 5: Verificar**

Run: `grep -q 'version: "1.3.0"' skills/brainstorming/SKILL.md && grep -q 'version: "1.1.0"' skills/architecture-assessment/SKILL.md && grep -q 'Silence is not a valid gate outcome' skills/brainstorming/SKILL.md && grep -qi 'not applicable' skills/architecture-assessment/SKILL.md && grep -c 'cicd-proposal-builder' skills/brainstorming/SKILL.md`
Expected: greps pasan + count `0`

- [ ] **Step 6: Commit**

```bash
git add skills/brainstorming/SKILL.md skills/architecture-assessment/SKILL.md
git commit -m "feat(dev): specialist gate is mandatory in brainstorming + assessment — silence is not an outcome (#6)"
```

---

### Task 4: Retiro de `cicd-proposal-builder`

_Requirements: R3, R3.1_

**Files:**
- Delete: `skills/cicd-proposal-builder/` (directorio completo)
- Modify: `bundles/dev/bundle.json` (quitar la entrada on-signal)

- [ ] **Step 1: Eliminar del bundle.** En `bundles/dev/bundle.json`, quitar del array `skills` el objeto `{ "name": "cicd-proposal-builder", "onSignal": true }`.

- [ ] **Step 2: Borrar el directorio.** `git rm -r skills/cicd-proposal-builder/`

- [ ] **Step 3: Verificar**

Run: `ls skills/ | grep -c cicd; grep -rn "cicd-proposal-builder" skills/ bundles/ catalog.json | wc -l; python3 -c "import json; json.load(open('bundles/dev/bundle.json')); print('JSON-OK')"`
Expected: `0`, `0`, `JSON-OK`

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(dev)!: retire cicd-proposal-builder — no real consumer, no natural trigger (#6)"
```

(El `!` señala remoción de capacidad del bundle; el rationale completo va en CHANGELOG en Task 7.)

---

### Task 5: Ports personales en `docs/ports/`

_Requirements: R6, R6.1_

**Files:**
- Create: `docs/ports/brief-spec.claude-ai.md`
- Create: `docs/ports/mermaid-diagrams.claude-ai.md`
- Read: `~/.claude/skills/brief-spec/SKILL.md` (63 líneas, español), `skills/product-brief/SKILL.md`, `skills/readiness-gate/references/brief-contract.md`, `skills/mermaid-diagrams/SKILL.md` (creada en Task 1)

- [ ] **Step 1: Port de brief-spec.** Escribir `docs/ports/brief-spec.claude-ai.md`: contenido COMPLETO listo-para-pegar en claude.ai (frontmatter `name: brief-spec` + description). Base: el brief-spec personal actual (español, conservar el idioma — es el port del usuario), actualizado con: (a) el bloque de frontmatter contract de `brief-contract.md` (`awm: product-brief`, `schema: 1`, `mode: brief`, `readiness: draft`, etc.) como sección nueva "Contrato del artefacto" — los briefs que produzca este port SON re-ingeribles por `product-process`; (b) las 12 secciones del cuerpo en el orden del contrato (referenciar `brief-template.md` como fuente del orden); (c) línea de deferencia al final de la description: *"En entornos con AWM instalado (Claude Code), deferir a product-process/product-brief — este port es para entornos sin filesystem (claude.ai web, Cowork móvil/web)."*; (d) encabezado del archivo (comentario) explicando qué es un port y de qué skill canónica deriva (`skills/product-brief/SKILL.md`).

- [ ] **Step 2: Port de mermaid.** Escribir `docs/ports/mermaid-diagrams.claude-ai.md`: como la personal actual ya es idéntica en contenido a la del registry (Task 1 la adaptó DESDE ella), el port es la SKILL.md del registry sin las secciones AWM-specific (Cross-Cutting rule #2 sobre invocadores del registry se reemplaza por una genérica "when another skill or flow requests a diagram, return it and end") + la línea de deferencia en la description + el encabezado explicando la derivación (`skills/mermaid-diagrams/SKILL.md`). Nota inline: las references/*.md del personal NO necesitan cambio (idénticas a las del registry).

- [ ] **Step 3: Verificar**

Run: `grep -q 'awm: product-brief' docs/ports/brief-spec.claude-ai.md && grep -qi 'deferir a product-process\|defer to product-process' docs/ports/brief-spec.claude-ai.md && grep -qi 'defer\|deferir' docs/ports/mermaid-diagrams.claude-ai.md && echo PORTS-OK`
Expected: `PORTS-OK`

- [ ] **Step 4: Commit**

```bash
git add docs/ports/
git commit -m "docs(ports): ready-to-paste claude.ai ports for brief-spec and mermaid-diagrams (#6)"
```

---

### Task 6: `environment-ports.md` + issues de trazabilidad

_Requirements: R5, R5.1, R5.2_

**Files:**
- Create: `docs/environment-ports.md`
- Externo: 3 issues de GitHub (via MCP `issue_write`) + 1 comentario en issue #6

**Nota para el implementador:** los issues se crean con las tools MCP de GitHub (`mcp__github__issue_write`, método `create`; cargarlas vía ToolSearch si no están en contexto). Si las tools MCP no están disponibles en tu contexto de subagente, reporta BLOCKED indicando exactamente qué issues faltan crear — el controller los creará él mismo; NO uses `gh` CLI (no disponible en este entorno).

- [ ] **Step 1: Escribir `docs/environment-ports.md`** (~40 líneas): qué es un environment port (copia adaptada de una skill canónica del registry para entornos sin AWM/filesystem: claude.ai web, Cowork móvil/web); tabla de ports vigentes (| Port (claude.ai) | Skill canónica (registry) | Contenido listo | → brief-spec → `skills/product-brief/` → `docs/ports/brief-spec.claude-ai.md`; mermaid-diagrams → `skills/mermaid-diagrams/` → `docs/ports/mermaid-diagrams.claude-ai.md`); pacto de sincronización (al editar la canónica, actualizar el port en `docs/ports/` en el mismo PR y re-subirlo a claude.ai manualmente — responsabilidad del dueño; no hay API); dirección futura (bundle exportable, enlazar el issue creado en Step 2a).

- [ ] **Step 2: Crear los 3 issues:**
  - **(a)** `Kodria/agentic-workflow`: título `feat: bundle exportable para claude.ai (environment ports automatizados)` — cuerpo: contexto (registry distribuye vía git+symlinks, entornos sin filesystem quedan fuera; hoy se resuelve con ports manuales documentados en `awm-baseline-registry/docs/environment-ports.md`), propuesta (comando `awm export --target claude-ai <bundle>` que genere zip/carpeta subible), criterio de éxito, referencia al design doc del cleanup y a la Parte 5 (Hermes) como pariente.
  - **(b)** `Kodria/awm-baseline-registry`: título `feat: capa de presentación HTML para briefs/arquitecturas (Parte 4 de #6, diferida)` — cuerpo: alcance original de la Parte 4, decisión de diferirla y por qué (markdown+Mermaid se renderiza nativo en Claude; el dolor solo existe compartiendo fuera de Claude), **criterio de activación explícito**: retomar cuando (i) Hermes esté soportado, o (ii) exista dolor real presentando briefs a stakeholders; versión mínima acordada si se activa (`brief-presenter` md→HTML self-contained; el artifact-server con tunnel se descarta por YAGNI).
  - **(c)** `Kodria/agentic-workflow`: título `feat: soporte Hermes como agente target (Parte 5 de #6)` — cuerpo: las 5 acciones de la Parte 5 del issue #6 (copiar su texto), nota de que es trabajo de CLI (detección de agent en init, hooks, sensor-packs en runtime Hermes), y que desbloquea el criterio de activación de (b) y el caso de uso Chiara.

- [ ] **Step 3: Comentar en `Kodria/awm-baseline-registry#6`** (via `mcp__github__add_issue_comment`): resumen de qué partes quedaron dónde — Partes 2+3 entregadas en PR #11; Parte 1 reformulada como flow-cleanup en el PR de esta rama (enlazar design doc); Parte 4 → issue (b); Parte 5 → issue (c); bundle exportable (derivado nuevo) → issue (a). Nota: el PR de este ciclo llevará `Closes #6` para el cierre automático al mergear (R5.2).

- [ ] **Step 4: Actualizar `docs/environment-ports.md`** con los números reales de los issues creados (reemplazar los placeholders de enlaces del Step 1).

- [ ] **Step 5: Verificar**

Run: `grep -c 'docs/ports/' docs/environment-ports.md; grep -qE 'issues/[0-9]+' docs/environment-ports.md && echo ISSUE-LINKS-OK`
Expected: ≥ 2 + `ISSUE-LINKS-OK`

- [ ] **Step 6: Commit**

```bash
git add docs/environment-ports.md
git commit -m "docs: environment-port pattern + traceability issues for deferred work (#6)"
```

---

### Task 7: Empaquetado

_Requirements: R7_

**Files:**
- Modify: `bundles/dev/bundle.json` (solo `version`: `"1.6.0"` → `"2.0.0"` — corregido a major en la revisión de calidad, ver Step 4 nota)
- Modify: `bundles/product/bundle.json` (solo `version`: `"1.0.0"` → `"1.1.0"`)
- Modify: `catalog.json` (ambas versiones)
- Modify: `CHANGELOG.md` (entrada nueva arriba, bajo la línea de convención)

- [x] **Step 1: Bumps.** dev → 2.0.0 en `bundles/dev/bundle.json` y `catalog.json` (corregido de 1.7.0 a 2.0.0 en la revisión de calidad — retiro de `cicd-proposal-builder` es ruptura de contrato, per CONSTITUTION.md); product → 1.1.0 en `bundles/product/bundle.json` y `catalog.json`. (Releer los archivos primero — Task 1 y Task 4 los editaron.)

- [ ] **Step 2: CHANGELOG.** Insertar tras la línea "Newest entry on top...":

```markdown
## dev 2.0.0 / product 1.1.0 — 2026-07-23

### Added — bundle `dev`
- `mermaid-diagrams` 1.0.0 (on-signal): Mermaid diagram guide, native in the registry (adapted from a personal skill; claude.ai port in `docs/ports/`).

### Changed — bundle `dev`
- `brainstorming` 1.3.0: passive "Specialist Skills Awareness" replaced by a mandatory Specialist Gate — evaluate each domain explicitly, invoke or state "not applicable"; silence is not a valid outcome.
- `architecture-advisor`, `technology-evaluator`, `nfr-checklist-generator`: dead Phase 5/6 delegation to `docs-assistant`/`docs-brainstorming`/`docs-system-orchestrator`/`c4-architecture` removed — artifacts are now delivered directly; advisor's diagram path points to `mermaid-diagrams`.

### Removed — bundle `dev` (BREAKING)
- `cicd-proposal-builder`: retired. No real consumer (its only wiring was the passive specialist table that never fired) and no natural trigger in feature design. If pipeline design becomes a real need, a new skill will be designed with a real trigger (likely project setup, not brainstorming). Bundle bump is major (1.6.0→2.0.0) per this repo's semver convention (ruptura de contrato → major) — a capability leaving the bundle is a contract change regardless of whether any project was actually consuming it.

### Changed — bundle `product` 1.1.0
- `architecture-assessment` 1.1.0: advisor invocation hardened into an explicit gate (invoke or state "not applicable" in the report).
- `architecture-extraction`: diagram layer 1 now points to the registry `mermaid-diagrams` skill (inline fallbacks preserved).

Design: docs/plans/2026-07-23-architecture-flow-cleanup-design.md (issue #6, Parte 1 reformulada).
```

**Nota post-implementación (revisión de calidad de Task 7):** el bump de `dev` mostrado arriba (1.7.0 originalmente escrito en este plan) se corrigió a 2.0.0 antes del commit final — retirar `cicd-proposal-builder` es ruptura de contrato per CONSTITUTION.md, sin excepción por "cero consumidores conocidos". El CHANGELOG.md real también agrega bullets para `using-awm` y detalle de "visible verdicts" en `brainstorming`, ausentes del borrador de arriba — ver CHANGELOG.md para el texto final.

- [ ] **Step 3: Nota — `architecture-extraction` Step 0b.** El CHANGELOG menciona la capa 1 de extraction: verificar que Task 1-4 no la actualizaron aún (el design R4.2 la asigna a este ciclo). Si sigue diciendo "personal skill", actualizar la tabla de Step 0b (~línea 74-90): capa 1 condición `Listed among available skills` se mantiene, pero la descripción aclara que la skill ahora es parte del bundle `dev` del registry (garantizada en instalaciones estándar; el fallback inline cubre instalaciones parciales). Mismo ajuste en la sección equivalente de `architecture-assessment` si referencia la personal.

- [ ] **Step 4: Verificar**

Run: `python3 -c "import json; c=json.load(open('catalog.json')); d={b['name']:b['version'] for b in c['bundles']}; assert d['dev']=='2.0.0' and d['product']=='1.1.0', d; print('VERSIONS-OK')" && grep -q 'dev 2.0.0 / product 1.1.0' CHANGELOG.md && echo CHANGELOG-OK`
Expected: `VERSIONS-OK` + `CHANGELOG-OK`

- [ ] **Step 5: Commit**

```bash
git add bundles/dev/bundle.json bundles/product/bundle.json catalog.json CHANGELOG.md skills/architecture-extraction/SKILL.md skills/architecture-assessment/SKILL.md
git commit -m "feat(product): bump dev 2.0.0 + product 1.1.0 — changelog del flow-cleanup (#6)"
```

---

### Task 8: Verificación E2E

_Requirements: R1–R7 (verificación de conjunto)_

- [ ] **Step 1: Referencias muertas globales = 0**

Run: `grep -rn "docs-assistant\|docs-brainstorming\|c4-architecture\|discovery-assistant\|cicd-proposal-builder" skills/ bundles/ catalog.json | grep -v "docs-system-orchestrator" | wc -l`
Expected: `0`
Nota: `docs-system-orchestrator` se excluye del grep y se verifica aparte — tiene UNA mención legítima en `skills/using-awm/SKILL.md` (entry point de documentación, fuera del alcance de este ciclo). Verificar: `grep -rln "docs-system-orchestrator" skills/` → solo `skills/using-awm/SKILL.md`.

- [ ] **Step 2: Lint estructural de mermaid-diagrams** (comando de convenciones) → `LINT-OK`.

- [ ] **Step 3: Gates presentes.** `grep -q 'Silence is not a valid gate outcome' skills/brainstorming/SKILL.md && grep -qi 'not applicable' skills/architecture-assessment/SKILL.md && echo GATES-OK` → `GATES-OK`.

- [ ] **Step 4: JSON + versiones** (comando de Task 7 Step 4) → `VERSIONS-OK`.

- [ ] **Step 5: Recorrido dirigido.** Leer `skills/brainstorming/SKILL.md` paso 4 + Specialist Gate completo: ¿un agente que siga el checklist literalmente llega SIEMPRE al gate antes de presentar enfoques? Leer las 3 advisory: ¿la entrega standalone es autocontenida (sin invocar nada inexistente)? Leer `docs/environment-ports.md`: ¿los enlaces a issues son números reales?

- [ ] **Step 6: Commit final si hubo correcciones; si no, no-op.**

```bash
git add -A && git diff --cached --quiet || git commit -m "fix(dev): correcciones de verificación E2E del flow-cleanup (#6)"
```

---

## Traceability Matrix

| Req | Task(s) | Verificación |
|------|---------|-------------|
| R1, R1.2 | T2 | T8-S5 lectura dirigida (entrega directa autocontenida; contextual preservado) |
| R1.1 | T2 | T2-S4 grep = 0 en las 3 advisory; T8-S1 grep global = 0 |
| R2 | T3 | T3-S5 grep frase literal del gate; T8-S5 recorrido checklist→gate |
| R2.1 | T3 | T3-S5 grep `cicd-proposal-builder` en brainstorming = 0 |
| R2.2 | T3 | T3-S5 grep `not applicable` en assessment; T8-S3 |
| R2.3 | T3 | T3-S5 greps de versiones exactas 1.3.0/1.1.0 |
| R3 | T4 | T4-S3 (dir ausente, refs = 0, JSON-OK); T8-S1 |
| R3.1 | T7 | T7-S4 grep CHANGELOG + lectura de la sección Removed |
| R4 | T1 | T1-S4 lint + 7 references + JSON-OK; T8-S2 |
| R4.1 | T2 | T2-S4 grep `mermaid-diagrams` ≥2 en advisor |
| R4.2 | T7 | T7-S3 lectura + edición de Step 0b; T8-S5 |
| R5 | T6 | T6-S5 greps (ports referenciados + enlaces a issues reales) |
| R5.1 | T6 | T6-S2: 3 issues creados con número real (verificable en el output del MCP) |
| R5.2 | T6 | T6-S3 comentario en #6 + `Closes #6` en el PR body (lo aplica finishing) |
| R6, R6.1 | T5 | T5-S3 `PORTS-OK` (frontmatter contract + deferencia en ambos) |
| R7 | T7 | T7-S4 `VERSIONS-OK` + `CHANGELOG-OK` |

**Analyze gate:** todos los R tienen ≥1 task y ≥1 verificación; ningún task carece de R. Nota de precisión: R1/R4.2/R5.2 combinan check mecánico con lectura dirigida declarada (T8-S5, finishing) — declarado, no proxy silencioso. Sin gaps.
