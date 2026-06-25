<!-- awm-plan-complete: 2026-06-25 — executed inline; brainstorming/writing-plans/post-implementation-qa bumped to 1.1.0 -->

# Capa de requisitos (EARS + IDs + trazabilidad) + QA multi-lente — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development o executing-plans para implementar tarea por tarea. Los pasos usan checkbox (`- [ ]`).

**Goal:** Añadir una capa de requisitos estructurada (criterios EARS + IDs de requisito + trazabilidad spec→tarea→test) al espinazo de skills de AWM, tier-able y agnóstica al proveedor; **y, en la misma pasada, refundar `post-implementation-qa`** en dos pistas (fidelidad por IDs + panel de calidad multi-lente que reemplaza al Type C), absorbiendo las notas anti-sesgo del Eje 2.

**Architecture:** Edición de contenido de skills en `awm-baseline-registry`. Tres skills del espinazo ganan secciones nuevas; cuatro plantillas de prompt acompañantes se endurecen. Sin tooling nuevo: EARS es gramática de texto, los IDs son convención de nombres, el check `analyze` es un checklist. Todo gateado por el principio tier (obligatorio en features multi-archivo/riesgosas, salteable en diffs triviales).

> **Nota de alcance (por qué este plan crece más allá de "capa de requisitos").** La Task 6 (`post-implementation-qa`) realiza **tres cambios del design doc en una sola edición de la skill**: Cambio 3 (IDs como checklist — Pista A), Cambio 4 (panel multi-lente plan-agnóstico — Pista B, **reemplaza al Type C**) y Cambio 2 (notas anti-sesgo en las plantillas). Se pliegan deliberadamente para **no tocar la skill de QA tres veces**. Los requisitos R11–R15 gobiernan esa parte; R1–R10 gobiernan la capa de requisitos en `brainstorming`/`writing-plans`.

**Tech Stack:** Markdown (SKILL.md + frontmatter semver), bundles/dev/bundle.json. Verificación = validez estructural (frontmatter, version bump, referencias que resuelven) + grep de los marcadores nuevos.

**Sustento:** `docs/plans/2026-06-25-spec-audit-improvements-design.md` (Cambios 2, 3 y 4) y `docs/research/2026-06-25-agentic-harness-market-audit.md` (Ejes 2 y 3) en el repo `agentic-workflow`.

---

## Requisitos (EARS)

> *Esta sección es el dogfood del propio cambio: especificamos la mejora con la notación que estamos introduciendo.*

- **R1 — Artefacto de requisitos.** WHEN `brainstorming` escribe el design doc, THE skill SHALL incluir una sección `## Requisitos` con criterios de aceptación en notación EARS, ubicada antes de las secciones de diseño.
- **R2 — Priorizar comportamiento no deseado.** WHERE el feature tiene casos borde o entradas inválidas, THE sección de requisitos SHALL expresar al menos un criterio con la plantilla `IF <trigger>, THEN THE <system> SHALL <response>`.
- **R3 — Gate de clarify.** WHILE existan ambigüedades abiertas en los requisitos, THE skill `brainstorming` SHALL NOT pasar a la fase de diseño.
- **R4 — IDs de requisito.** THE sección `## Requisitos` SHALL numerar cada requisito con un ID estable (`R1`, `R1.1`, …).
- **R5 — Trazabilidad en el plan.** WHEN `writing-plans` define una Task, THE skill SHALL taggear los IDs de requisito que la Task satisface.
- **R6 — Matriz de trazabilidad.** THE Self-Review de `writing-plans` SHALL producir una matriz requisito→tarea→test y reportar requisitos sin tarea/test (forward) y tareas/tests sin requisito (backward).
- **R7 — Checklist de completitud en QA.** WHEN `post-implementation-qa` corre su deep-review, THE skill SHALL usar los IDs de requisito como checklist de completitud.
- **R8 — Tier (anti-waterfall).** WHERE el cambio es un diff trivial de un solo archivo, THE capa de requisitos (EARS + IDs + trazabilidad) SHALL ser salteable; IF el cambio toca múltiples archivos o es de corrección crítica, THEN SHALL ser obligatoria.
- **R9 — Agnóstico al proveedor.** THE implementación SHALL NOT depender de features propietarias de ningún harness (solo archivos, texto, prompts de subagente).
- **R10 — Versionado.** WHEN se edita el contenido de una skill, THE frontmatter `version` SHALL incrementarse en semver.

> *Requisitos R11–R15 — refundación de `post-implementation-qa` (Cambios 4 + 2). Realizados junto a R7 en la Task 6 para editar la skill una sola vez.*

- **R11 — Dos pistas.** WHEN `post-implementation-qa` corre su revisión, THE skill SHALL separar explícitamente la **Pista A** (fidelidad anclada al plan, dirigida por los IDs de requisito) de la **Pista B** (calidad plan-agnóstica).
- **R12 — Panel multi-lente reemplaza al Type C.** THE Pista B SHALL despachar lentes distintas (robustez/seguridad, corrección lógica, tests) como **subagentes separados de contexto aislado**, cada una con criterio plan-agnóstico, en lugar del cubo Type C monolítico; THE skill SHALL NOT conservar la clasificación Type C.
- **R13 — Robustez como lente de primera clase.** THE lente de robustez/seguridad SHALL evaluar el piso (`Infinity`/`NaN`/`undefined` silenciosos, crash en borde/entrada inválida, validación en fronteras) **independientemente del scope declarado** en el plan.
- **R14 — Anti-sesgo en las plantillas (Cambio 2).** THE plantilla de cada lente SHALL (a) declarar que el contexto fresco atenúa pero no neutraliza el sesgo y que **ante conflicto lente-vs-sensor gana el sensor determinista**, y (b) exigir **evidencia concreta** (test que falla / ID de regla de sensor / `archivo:línea`) por hallazgo, descartando los que no la traigan.
- **R15 — Tier del panel + gate determinista.** WHERE el cambio es un diff trivial, THE Pista B SHALL reducirse a la sola lente de robustez (el piso nunca se saltea); IF el cambio es multi-archivo o de corrección crítica, THEN SHALL correr el panel completo. THE panel SHALL NOT declarar "limpio" mientras `awm sensors run` reporte fallas.

---

## File Structure

| Archivo | Responsabilidad | Requisitos |
|---------|-----------------|------------|
| `skills/brainstorming/SKILL.md` | Sección `## Requisitos` en el template del design doc; checklist; spec self-review extendido; clarify gate | R1, R2, R3, R4, R8, R10 |
| `skills/brainstorming/spec-document-reviewer-prompt.md` | El revisor verifica EARS + IDs + no-ambigüedad | R1, R2, R3, R4 |
| `skills/writing-plans/SKILL.md` | Tag de IDs por Task; Self-Review → matriz de trazabilidad; check analyze | R5, R6, R8, R10 |
| `skills/writing-plans/plan-document-reviewer-prompt.md` | El revisor verifica trazabilidad y huérfanos | R5, R6 |
| `skills/post-implementation-qa/SKILL.md` | Refundación dos pistas: Pista A (IDs como checklist) + Pista B (panel multi-lente que reemplaza al Type C); tier + gate determinista | R7, R10, R11, R12, R13, R15 |
| `skills/post-implementation-qa/deep-review-prompt.md` | Reestructura en plantilla de dos pistas; una lente por subagente; notas anti-sesgo + evidencia concreta por hallazgo | R7, R11, R12, R13, R14 |

> **Nota de verificación:** el registry no tiene tests automatizados. La "prueba" de cada tarea es estructural: (a) el marcador nuevo existe (grep), (b) `version` bumpeado, (c) ninguna referencia de bundle se rompe. No hay TDD de código aquí; hay *verification-before-completion* sobre el contenido.

---

## Task 1: `brainstorming` — sección `## Requisitos` (EARS) + tier

**Files:**
- Modify: `skills/brainstorming/SKILL.md`

- [x] **Step 1: Añadir el template de la sección de requisitos** en "After the Design / Documentation", antes de la escritura del design doc. Incluir las 5 plantillas EARS + la forma compleja, con énfasis en IF/THEN para casos borde (R1, R2). Numeración con IDs `R1`, `R1.1` (R4).
- [x] **Step 2: Añadir el guardrail tier** (R8): EARS+IDs obligatorios para features multi-archivo/riesgosas, salteables para diffs triviales; requisitos tersos (bullets), no prosa. Reusar el lenguaje de "Anti-Pattern: Too Simple" ya presente.
- [x] **Step 3: Actualizar el Checklist** (paso 7 "Write design doc") para nombrar la sección `## Requisitos` como parte del doc.
- [x] **Step 4: Bump version** `1.0.0` → `1.1.0` en el frontmatter (R10).
- [x] **Step 5: Verificar** — `grep -c "THE .* SHALL" skills/brainstorming/SKILL.md` ≥ 5 (las plantillas presentes); `grep '^version' SKILL.md` muestra `1.1.0`.
- [x] **Step 6: Commit** — `docs(brainstorming): add EARS requirements section + tier guardrail`

## Task 2: `brainstorming` — clarify gate + spec self-review

**Files:**
- Modify: `skills/brainstorming/SKILL.md`

- [x] **Step 1: Clarify gate** (R3) — en "Ask clarifying questions" / antes de "Present design", añadir gate explícito: no avanzar a diseño mientras queden ambigüedades abiertas en los requisitos. Reutiliza el "one question at a time" ya existente.
- [x] **Step 2: Extender Spec Self-Review** — añadir ítem: "cada requisito está en EARS y es 1:1 testeable; cada uno tiene ID estable" (R1, R4).
- [x] **Step 3: Verificar** — grep del nuevo ítem de self-review y del clarify gate.
- [x] **Step 4: Commit** — `docs(brainstorming): add clarify gate and EARS check to spec self-review`

## Task 3: `brainstorming` — endurecer spec-document-reviewer-prompt

**Files:**
- Modify: `skills/brainstorming/spec-document-reviewer-prompt.md`

- [x] **Step 1: Leer** el prompt actual del revisor para encajar el estilo.
- [x] **Step 2: Añadir criterios** al revisor: (a) ¿toda requisito en EARS?, (b) ¿IDs estables presentes?, (c) ¿algún requisito ambiguo o no testeable? Exigir evidencia concreta (cita el requisito) por hallazgo (R1–R4).
- [x] **Step 3: Verificar + Commit** — `docs(brainstorming): spec reviewer checks EARS, IDs, testability`

## Task 4: `writing-plans` — tags de ID + matriz de trazabilidad + analyze

**Files:**
- Modify: `skills/writing-plans/SKILL.md`

- [x] **Step 1: Tag de requisitos en Task Structure** — añadir línea `_Requirements: R1.1, R2.3_` al bloque `### Task N` y referenciar IDs en los tests (R5). *(El string del tag va en inglés: los skills están normalizados a inglés — F-10 — y el tag es contenido que se emite en los planes de los usuarios.)*
- [x] **Step 2: Self-Review §1 → matriz de trazabilidad** — reemplazar "Spec coverage" por una matriz requisito→tarea→test; reportar forward gaps (requisito sin tarea/test) y backward gaps (tarea/test sin requisito = scope creep / código huérfano) (R6).
- [x] **Step 3: Check analyze pre-handoff** — añadir gate antes del Execution Handoff: todo ID tiene ≥1 tarea y ≥1 test; ninguna tarea/test carece de ID (R6).
- [x] **Step 4: Tier** (R8) — nota de que la matriz aplica a planes multi-tarea; diffs triviales la saltean.
- [x] **Step 5: Bump version** `1.0.0` → `1.1.0` (R10).
- [x] **Step 6: Verificar** — grep `_Requirements:` y de la matriz; version `1.1.0`.
- [x] **Step 7: Commit** — `docs(writing-plans): add requirement-ID traceability matrix and analyze gate`

## Task 5: `writing-plans` — endurecer plan-document-reviewer-prompt

**Files:**
- Modify: `skills/writing-plans/plan-document-reviewer-prompt.md`

- [x] **Step 1: Leer** el prompt actual.
- [x] **Step 2: Añadir criterios** — el revisor verifica que cada Task tagea IDs, que la matriz cubre todos los requisitos, y flaggea huérfanos (R5, R6).
- [x] **Step 3: Verificar + Commit** — `docs(writing-plans): plan reviewer checks traceability and orphans`

## Task 6: `post-implementation-qa` — refundación dos pistas (Cambios 3 + 4 + 2, edición única)

> **Por qué una sola task para la skill de QA:** R7 (IDs, Cambio 3), R11–R13/R15 (panel multi-lente, Cambio 4) y R14 (anti-sesgo, Cambio 2) tocan los **mismos dos archivos**. Se editan juntos para no reescribir la skill tres veces y dejar el modelo mental coherente (Pista A / Pista B) en una pasada.

**Files:**
- Modify: `skills/post-implementation-qa/SKILL.md`
- Modify: `skills/post-implementation-qa/deep-review-prompt.md`

- [x] **Step 1: SKILL.md — refundar el modelo de hallazgos en dos pistas** (R11, R12):
  - Reemplazar la tabla "Finding Types (B / C)" por **Pista A — Fidelidad** (ex-Type B, anclada al plan) y **Pista B — Calidad** (panel de lentes plan-agnósticas). **Eliminar la clasificación Type C** (R12: la skill no la conserva); su contenido se redistribuye en las lentes.
  - Convertir la nota al pie "Security lens (scope ≠ exemption)" en la **lente de robustez/seguridad de primera clase** de la Pista B (R13).
- [x] **Step 2: SKILL.md — Pista A dirigida por IDs** (R7): el deep-review de fidelidad usa los IDs de requisito del spec como checklist de completitud; cada ID implementado y testeado; flaggea forward gaps (ID sin código/test) y backward gaps (código sin ID = scope creep).
- [x] **Step 3: SKILL.md — Pista B multi-lente** (R12, R15): el proceso despacha **un subagente por lente** (robustez/seguridad, corrección lógica, tests) en contexto aislado; **dedup** de hallazgos solapados (mismo `archivo:línea`) antes de presentar. Actualizar el diagrama `dot` y los pasos "Dispatch" para reflejar el fan-out por lente.
- [x] **Step 4: SKILL.md — tier + gate determinista** (R15): diff trivial → solo lente de robustez (el piso nunca se saltea) + Pista A si hay IDs; multi-archivo/crítico → panel completo. Reafirmar que ninguna lente declara "limpio" con `awm sensors run` rojo (ya existe el Iron Law; extenderlo a las lentes).
- [x] **Step 5: deep-review-prompt.md — reestructura en plantilla de dos pistas** (R7, R11–R14):
  - Sección **Pista A**: "verificá que cada ID de requisito esté implementado y tenga test; reportá IDs faltantes y código sin ID. Reportá huecos, no estilo."
  - Sección **Pista B**: una sub-plantilla por lente (robustez/seguridad, corrección lógica, tests), cada una con su criterio plan-agnóstico explícito.
  - **Cabecera anti-sesgo común a todas las lentes** (R14): "El contexto fresco atenúa pero no neutraliza el sesgo de auto-preferencia; ante conflicto entre tu juicio y un sensor/test determinista, gana el sensor. Cada hallazgo DEBE citar evidencia concreta (test que falla / ID de regla de sensor / `archivo:línea`); descartá los hallazgos sin evidencia."
  - Conservar el bloque "Record to the ledger" (no romper el ledger gate del Step 4 de la skill).
- [x] **Step 6: Bump version** de la skill `1.0.0` → `1.1.0` (R10).
- [x] **Step 7: Verificar** — `grep -i "Pista A\|Pista B\|Track A\|Track B" SKILL.md` presente; **ausencia** de "Type C" como clasificación viva (`grep -c "Type C" SKILL.md` solo en notas históricas, no en la tabla de tipos); `grep` de la cabecera anti-sesgo y de "evidencia concreta" en el prompt; `grep '^version'` muestra `1.1.0`; ledger block intacto.
- [x] **Step 8: Commit** — `docs(post-implementation-qa): two-track QA — ID-driven fidelity + plan-agnostic lens panel (replaces Type C)`

## Task 7: Validación estructural integral + push

- [x] **Step 1:** Confirmar que todas las skills tocadas tienen `version` bumpeado y frontmatter válido.
- [x] **Step 2:** Confirmar que `bundles/dev/bundle.json` sigue resolviendo (no se añadió skill nueva en este Cambio, solo ediciones — sin cambios al bundle).
- [x] **Step 3:** `git push -u origin claude/agentic-workflow-spec-audit-gnihpu` (con retry exponencial).

---

## Self-Review (matriz de trazabilidad)

| Req | Tarea(s) | Verificación |
|-----|----------|--------------|
| R1 | T1, T3 | grep EARS templates en SKILL + reviewer |
| R2 | T1 | grep IF/THEN template |
| R3 | T2 | grep clarify gate |
| R4 | T1, T2, T3 | grep IDs en template + self-review + reviewer |
| R5 | T4, T5 | grep `_Requirements:` + reviewer |
| R6 | T4, T5 | grep matriz + analyze gate |
| R7 | T6 | grep checklist en QA + deep-review-prompt |
| R8 | T1, T4 | grep tier guardrail |
| R9 | (todas) | revisión: sin dependencias propietarias |
| R10 | T1, T4, T6 | grep `version` bumpeado |
| R11 | T6 | grep "Pista A/Pista B" en SKILL + prompt |
| R12 | T6 | grep ausencia de Type C como tipo vivo; fan-out por lente |
| R13 | T6 | grep lente de robustez/seguridad de primera clase |
| R14 | T6 | grep cabecera anti-sesgo + "evidencia concreta" en prompt |
| R15 | T6 | grep tier del panel + gate determinista |

Forward: todos los requisitos (R1–R15) tienen tarea. Backward: ninguna tarea sin requisito. Sin huérfanos.

---

## Execution Handoff

Dos opciones de ejecución:
1. **Subagent-Driven (recomendado)** — subagente fresco por tarea, review entre tareas. *Caveat Eje 2: el review hereda sesgo residual; gateamos con verificación estructural determinista (grep + version), no con juicio del modelo.*
2. **Inline** — ejecución en esta sesión con checkpoints.

Dado que las tareas son ediciones de markdown acopladas (varias tocan el mismo SKILL.md), **recomiendo inline con checkpoint por skill**: T1+T2+T3 (brainstorming) → checkpoint → T4+T5 (writing-plans) → checkpoint → **T6 (qa — la task más pesada: refundación dos pistas, Cambios 3+4+2 en una edición)** → T7 (push).
