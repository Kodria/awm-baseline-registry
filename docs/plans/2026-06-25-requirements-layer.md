# Capa de requisitos (EARS + IDs + trazabilidad) — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development o executing-plans para implementar tarea por tarea. Los pasos usan checkbox (`- [ ]`).

**Goal:** Añadir una capa de requisitos estructurada (criterios EARS + IDs de requisito + trazabilidad spec→tarea→test) al espinazo de skills de AWM, tier-able y agnóstica al proveedor.

**Architecture:** Edición de contenido de skills en `awm-baseline-registry`. Tres skills del espinazo ganan secciones nuevas; cuatro plantillas de prompt acompañantes se endurecen. Sin tooling nuevo: EARS es gramática de texto, los IDs son convención de nombres, el check `analyze` es un checklist. Todo gateado por el principio tier (obligatorio en features multi-archivo/riesgosas, salteable en diffs triviales).

**Tech Stack:** Markdown (SKILL.md + frontmatter semver), bundles/dev/bundle.json. Verificación = validez estructural (frontmatter, version bump, referencias que resuelven) + grep de los marcadores nuevos.

**Sustento:** `docs/plans/2026-06-25-spec-audit-improvements-design.md` (Cambio 3) y `docs/research/2026-06-25-agentic-harness-market-audit.md` (Eje 3) en el repo `agentic-workflow`.

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

---

## File Structure

| Archivo | Responsabilidad | Requisitos |
|---------|-----------------|------------|
| `skills/brainstorming/SKILL.md` | Sección `## Requisitos` en el template del design doc; checklist; spec self-review extendido; clarify gate | R1, R2, R3, R4, R8, R10 |
| `skills/brainstorming/spec-document-reviewer-prompt.md` | El revisor verifica EARS + IDs + no-ambigüedad | R1, R2, R3, R4 |
| `skills/writing-plans/SKILL.md` | Tag de IDs por Task; Self-Review → matriz de trazabilidad; check analyze | R5, R6, R8, R10 |
| `skills/writing-plans/plan-document-reviewer-prompt.md` | El revisor verifica trazabilidad y huérfanos | R5, R6 |
| `skills/post-implementation-qa/SKILL.md` | IDs como checklist de completitud en deep-review | R7, R10 |
| `skills/post-implementation-qa/deep-review-prompt.md` | El deep-review chequea cada ID implementado + tests | R7 |

> **Nota de verificación:** el registry no tiene tests automatizados. La "prueba" de cada tarea es estructural: (a) el marcador nuevo existe (grep), (b) `version` bumpeado, (c) ninguna referencia de bundle se rompe. No hay TDD de código aquí; hay *verification-before-completion* sobre el contenido.

---

## Task 1: `brainstorming` — sección `## Requisitos` (EARS) + tier

**Files:**
- Modify: `skills/brainstorming/SKILL.md`

- [ ] **Step 1: Añadir el template de la sección de requisitos** en "After the Design / Documentation", antes de la escritura del design doc. Incluir las 5 plantillas EARS + la forma compleja, con énfasis en IF/THEN para casos borde (R1, R2). Numeración con IDs `R1`, `R1.1` (R4).
- [ ] **Step 2: Añadir el guardrail tier** (R8): EARS+IDs obligatorios para features multi-archivo/riesgosas, salteables para diffs triviales; requisitos tersos (bullets), no prosa. Reusar el lenguaje de "Anti-Pattern: Too Simple" ya presente.
- [ ] **Step 3: Actualizar el Checklist** (paso 7 "Write design doc") para nombrar la sección `## Requisitos` como parte del doc.
- [ ] **Step 4: Bump version** `1.0.0` → `1.1.0` en el frontmatter (R10).
- [ ] **Step 5: Verificar** — `grep -c "THE .* SHALL" skills/brainstorming/SKILL.md` ≥ 5 (las plantillas presentes); `grep '^version' SKILL.md` muestra `1.1.0`.
- [ ] **Step 6: Commit** — `docs(brainstorming): add EARS requirements section + tier guardrail`

## Task 2: `brainstorming` — clarify gate + spec self-review

**Files:**
- Modify: `skills/brainstorming/SKILL.md`

- [ ] **Step 1: Clarify gate** (R3) — en "Ask clarifying questions" / antes de "Present design", añadir gate explícito: no avanzar a diseño mientras queden ambigüedades abiertas en los requisitos. Reutiliza el "one question at a time" ya existente.
- [ ] **Step 2: Extender Spec Self-Review** — añadir ítem: "cada requisito está en EARS y es 1:1 testeable; cada uno tiene ID estable" (R1, R4).
- [ ] **Step 3: Verificar** — grep del nuevo ítem de self-review y del clarify gate.
- [ ] **Step 4: Commit** — `docs(brainstorming): add clarify gate and EARS check to spec self-review`

## Task 3: `brainstorming` — endurecer spec-document-reviewer-prompt

**Files:**
- Modify: `skills/brainstorming/spec-document-reviewer-prompt.md`

- [ ] **Step 1: Leer** el prompt actual del revisor para encajar el estilo.
- [ ] **Step 2: Añadir criterios** al revisor: (a) ¿toda requisito en EARS?, (b) ¿IDs estables presentes?, (c) ¿algún requisito ambiguo o no testeable? Exigir evidencia concreta (cita el requisito) por hallazgo (R1–R4).
- [ ] **Step 3: Verificar + Commit** — `docs(brainstorming): spec reviewer checks EARS, IDs, testability`

## Task 4: `writing-plans` — tags de ID + matriz de trazabilidad + analyze

**Files:**
- Modify: `skills/writing-plans/SKILL.md`

- [ ] **Step 1: Tag de requisitos en Task Structure** — añadir línea `_Requisitos: R1.1, R2.3_` al bloque `### Task N` y referenciar IDs en los tests (R5).
- [ ] **Step 2: Self-Review §1 → matriz de trazabilidad** — reemplazar "Spec coverage" por una matriz requisito→tarea→test; reportar forward gaps (requisito sin tarea/test) y backward gaps (tarea/test sin requisito = scope creep / código huérfano) (R6).
- [ ] **Step 3: Check analyze pre-handoff** — añadir gate antes del Execution Handoff: todo ID tiene ≥1 tarea y ≥1 test; ninguna tarea/test carece de ID (R6).
- [ ] **Step 4: Tier** (R8) — nota de que la matriz aplica a planes multi-tarea; diffs triviales la saltean.
- [ ] **Step 5: Bump version** `1.0.0` → `1.1.0` (R10).
- [ ] **Step 6: Verificar** — grep `_Requisitos:` y de la matriz; version `1.1.0`.
- [ ] **Step 7: Commit** — `docs(writing-plans): add requirement-ID traceability matrix and analyze gate`

## Task 5: `writing-plans` — endurecer plan-document-reviewer-prompt

**Files:**
- Modify: `skills/writing-plans/plan-document-reviewer-prompt.md`

- [ ] **Step 1: Leer** el prompt actual.
- [ ] **Step 2: Añadir criterios** — el revisor verifica que cada Task tagea IDs, que la matriz cubre todos los requisitos, y flaggea huérfanos (R5, R6).
- [ ] **Step 3: Verificar + Commit** — `docs(writing-plans): plan reviewer checks traceability and orphans`

## Task 6: `post-implementation-qa` — IDs como checklist de completitud

**Files:**
- Modify: `skills/post-implementation-qa/SKILL.md`
- Modify: `skills/post-implementation-qa/deep-review-prompt.md`

- [ ] **Step 1: SKILL.md** — el deep-review usa los IDs de requisito del spec como checklist de completitud; cada ID debe estar implementado y testeado; flaggea backward gaps (R7).
- [ ] **Step 2: deep-review-prompt.md** — añadir al prompt del revisor de contexto fresco: "verificá que cada ID de requisito esté implementado y tenga test; reportá IDs faltantes y código sin ID. Reportá huecos, no estilo." (R7, cierra el hueco que la best-practice de Claude Code señala: sin IDs el revisor no tiene checklist).
- [ ] **Step 3: Bump version** de la skill (R10).
- [ ] **Step 4: Verificar + Commit** — `docs(post-implementation-qa): use requirement IDs as completeness checklist`

## Task 7: Validación estructural integral + push

- [ ] **Step 1:** Confirmar que todas las skills tocadas tienen `version` bumpeado y frontmatter válido.
- [ ] **Step 2:** Confirmar que `bundles/dev/bundle.json` sigue resolviendo (no se añadió skill nueva en este Cambio, solo ediciones — sin cambios al bundle).
- [ ] **Step 3:** `git push -u origin claude/agentic-workflow-spec-audit-gnihpu` (con retry exponencial).

---

## Self-Review (matriz de trazabilidad)

| Req | Tarea(s) | Verificación |
|-----|----------|--------------|
| R1 | T1, T3 | grep EARS templates en SKILL + reviewer |
| R2 | T1 | grep IF/THEN template |
| R3 | T2 | grep clarify gate |
| R4 | T1, T2, T3 | grep IDs en template + self-review + reviewer |
| R5 | T4, T5 | grep `_Requisitos:` + reviewer |
| R6 | T4, T5 | grep matriz + analyze gate |
| R7 | T6 | grep checklist en QA + deep-review-prompt |
| R8 | T1, T4 | grep tier guardrail |
| R9 | (todas) | revisión: sin dependencias propietarias |
| R10 | T1, T4, T6 | grep `version` bumpeado |

Forward: todos los requisitos tienen tarea. Backward: ninguna tarea sin requisito. Sin huérfanos.

---

## Execution Handoff

Dos opciones de ejecución:
1. **Subagent-Driven (recomendado)** — subagente fresco por tarea, review entre tareas. *Caveat Eje 2: el review hereda sesgo residual; gateamos con verificación estructural determinista (grep + version), no con juicio del modelo.*
2. **Inline** — ejecución en esta sesión con checkpoints.

Dado que las tareas son ediciones de markdown acopladas (varias tocan el mismo SKILL.md), **recomiendo inline con checkpoint por skill**: T1+T2+T3 (brainstorming) → checkpoint → T4+T5 (writing-plans) → checkpoint → T6 (qa) → T7 (push).
