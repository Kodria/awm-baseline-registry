# Capa de Producto (product-process) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir la capa de negocio de AWM: bundle `product` con 6 skills (orquestador + 4 modos + gate) y las ediciones de handoff/ruteo en `brainstorming`, `development-process` y `using-awm`.

**Architecture:** Orquestador `product-process` espejo de `development-process`, que rutea 5 caminos (discovery, brief, assessment, extraction, re-ingesta) y converge en `readiness-gate` antes del handoff. El brief es un `.md` portable con frontmatter contract. Spec: `docs/plans/2026-07-22-product-layer-design.md`.

**Tech Stack:** Contenido markdown (SKILL.md formato baseline: frontmatter + fases + cross-cutting rules + termination), JSON de bundles/catalog. Sin código ejecutable. Verificación por lint estructural (grep) + lectura.

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

- Los SKILL.md nuevos van en `skills/<nombre>/SKILL.md` de este repo (`awm-baseline-registry`), en inglés (idioma del baseline), frontmatter con `name`, `version: "1.0.0"` y `description` activadora (tercera persona, verbos de trigger, como las skills existentes).
- Todo SKILL.md nuevo termina con una sección `## Termination` que define su estado terminal explícito, y una `## Cross-Cutting Rules`.
- Verificación estructural mínima por skill (ejecutar tras crear el archivo):
  ```bash
  f=skills/<nombre>/SKILL.md
  head -1 "$f" | grep -qx -- '---' && grep -q '^name: <nombre>$' "$f" && grep -q '^version:' "$f" && grep -q '^description:' "$f" && grep -q '^## Termination' "$f" && grep -q '^## Cross-Cutting Rules' "$f" && echo LINT-OK
  ```
  Expected: `LINT-OK`
- Commit tras cada task con conventional commit. Rama: `claude/awm-v1-4-0-frontend-upgrade-bcd3gq`.

---

### Task 1: Auditoría de skills existentes

_Requirements: R12_

**Files:**
- Create: `docs/plans/2026-07-22-product-layer-audit.md`
- Read: `skills/architecture-advisor/SKILL.md`, `skills/technology-evaluator/SKILL.md`, `skills/nfr-checklist-generator/SKILL.md`, `~/.claude/skills/brief-spec/SKILL.md`, `~/.claude/skills/mermaid-diagrams/SKILL.md`

- [ ] **Step 1: Leer las 5 skills candidatas completas** (no solo frontmatter). Para cada una registrar: propósito real, fases, solapes con la capa nueva, señales de obsolescencia (referencias a flujos/paths que ya no existen, supuestos rotos).

- [ ] **Step 2: Escribir el informe de auditoría** en `docs/plans/2026-07-22-product-layer-audit.md` con esta tabla obligatoria (una fila por skill, veredicto único):

```markdown
# Auditoría de skills existentes — capa de producto (R12)

| Skill | Ubicación | Veredicto (reusar/adaptar/descartar) | Evidencia | Impacto en tasks |
|-------|-----------|--------------------------------------|-----------|------------------|
| architecture-advisor | skills/ | ... | ... | Task 6 (assessment) |
| technology-evaluator | skills/ | ... | ... | — |
| nfr-checklist-generator | skills/ | ... | ... | — |
| brief-spec (personal) | ~/.claude/skills/ | ... | ... | Task 3 (product-brief) |
| mermaid-diagrams (personal) | ~/.claude/skills/ | ... | ... | Task 5 (extraction) |
```

Notas obligatorias: (a) `brief-spec` referencia `references/plantilla-brief.md` que NO existe en la instalación — la plantilla se reconstruye desde las reglas del SKILL.md en Task 3; (b) si un veredicto es "adaptar", listar QUÉ se adapta; (c) ninguna skill de Tasks 2–7 referencia una skill existente cuyo veredicto sea "descartar".

- [ ] **Step 3: Verificar**

Run: `grep -c '| ' docs/plans/2026-07-22-product-layer-audit.md`
Expected: ≥ 7 (header + separador + 5 filas)

- [ ] **Step 4: Commit**

```bash
git add docs/plans/2026-07-22-product-layer-audit.md
git commit -m "docs(audit): clasificar skills existentes para reuso en capa de producto (#6)"
```

---

### Task 2: Contrato del brief + skill `readiness-gate`

_Requirements: R5, R5.2, R5.3, R7, R7.1, R7.2_

**Files:**
- Create: `skills/readiness-gate/SKILL.md`
- Create: `skills/readiness-gate/references/brief-contract.md`

- [ ] **Step 1: Escribir `references/brief-contract.md`** — la especificación canónica del artefacto. Contenido exacto del frontmatter (este bloque va literal en el doc):

```yaml
---
awm: product-brief          # discriminator: AWM product-layer artifact
schema: 1                   # contract version
title: <short name>
mode: discovery | brief | assessment | extraction
readiness: draft | ready    # written ONLY by readiness-gate
created: YYYY-MM-DD
updated: YYYY-MM-DD
open_decisions: [DA-1, DA-3]
project: <slug or null>
---
```

Más las reglas del contrato (redactarlas como reglas normativas, una por bullet): (1) re-ingesta reconoce por discriminador `awm: product-brief`, nunca por heurística de contenido; (2) `schema` es entero y solo crece; versiones futuras del gate leen todo `schema` anterior; (3) `readiness` lo escribe solo `readiness-gate` (R5.2); (4) informes de assessment/extraction usan el mismo frontmatter con su `mode` (R5.3); (5) secciones requeridas del cuerpo (R5.1, **11 secciones** — amendado en Task 2 al detectar que G2/G5 del gate no tenían sección de origen): Business need (N#), Users & context, Constraints, Non-assumption mandate (lista de lo NO verificado), Glossary, Processes (PR-#), Requirements (RF-x.y / RNF-x.y, redacción EARS-compatible), Open decisions (tabla DA-# con columna "blocks"), Out of scope, Releases (valor independiente), Risks.

- [ ] **Step 2: Escribir `skills/readiness-gate/SKILL.md`** con:
  - Frontmatter: `name: readiness-gate`, `version: "1.0.0"`, description activadora: *"Use when a product brief must be certified ready for development, or re-verified at the crossing point into development-process. Evaluates the G1–G9 Definition-of-Ready checklist against the brief's actual content — never against its stored seal."*
  - **Fase 1 — Load & lint:** parsear frontmatter contra `references/brief-contract.md`; si el documento no tiene frontmatter válido, devolver el control al invocador indicando "not a brief — offer adoption" (no es error del gate).
  - **Fase 2 — Checklist G1–G9** (tabla literal en la skill, cada criterio con su pregunta de verificación):

| # | Criterio | Verifica |
|---|----------|----------|
| G1 | Problem defined | N# con dueño del dolor y costo de no resolverlo |
| G2 | Users identified | quién usa/sufre, en qué contexto |
| G3 | Scope bounded | Out-of-scope explícito y no vacío |
| G4 | Business cases enumerated | catálogo de casos, excepciones y reglas |
| G5 | Constraints declared | técnicas, costo, privacidad, infraestructura intocable |
| G6 | Risks known | tabla riesgo/impacto/mitigación presente |
| G7 | Requirements traceable | todo RF/RNF con ID estable y redacción testeable |
| G8 | Open decisions managed | cada DA-# con "blocks"; ninguna DA bloquea el primer release |
| G9 | Non-assumption intact | lista de lo NO verificado presente; nada afirmado sin fuente |

  - **Fase 3 — Veredicto:** por criterio ✓/✗ con evidencia (cita del vacío). Todos ✓ → escribir `readiness: ready` y `updated:` en el frontmatter. Algún ✗ → `readiness: draft` + lista accionable. **Regla literal:** *"There is no override. A draft brief does not cross into development; the path is closing the gaps, not forcing the gate."* (R7.1)
  - **Cross-Cutting Rules:** el gate evalúa contenido, nunca el sello (R7); en el cruce a desarrollo se re-ejecuta siempre aunque el sello diga ready, y si discrepa, bloquea mostrando la discrepancia (R7.2); el gate no edita contenido del brief — solo frontmatter (`readiness`, `updated`).
  - **Termination:** devuelve veredicto + brief actualizado al orquestador; nunca invoca otras skills.

- [ ] **Step 3: Lint estructural** (comando de convenciones) sobre `skills/readiness-gate/SKILL.md`.
Expected: `LINT-OK`. Además: `grep -c 'G[1-9]' skills/readiness-gate/SKILL.md` ≥ 9 y `grep -q 'awm: product-brief' skills/readiness-gate/references/brief-contract.md && echo OK` → `OK`.

- [ ] **Step 4: Commit**

```bash
git add skills/readiness-gate/
git commit -m "feat(product): readiness-gate skill + brief contract spec (#6)"
```

---

### Task 3: Skill `product-brief`

_Requirements: R5.1, R4, R4.1_

**Files:**
- Create: `skills/product-brief/SKILL.md`
- Create: `skills/product-brief/references/brief-template.md`
- Read: `~/.claude/skills/brief-spec/SKILL.md` (semilla), `docs/plans/2026-07-22-product-layer-audit.md` (veredicto)

- [ ] **Step 1: Escribir `SKILL.md`** adoptando la metodología brief-spec (traducir al inglés, conservar TODAS estas reglas — son el corazón y no se diluyen):
  - Frontmatter: `name: product-brief`, description: *"Use when a matured idea must be structured into a formal, portable product brief for handoff to development — or when a discovery session concludes and its findings must crystallize. Produces a single self-describing .md following the brief contract."*
  - **Flujo:** (1) recolectar antes de escribir — necesidad, proceso actual punta a punta según el dueño, restricciones duras, acuerdos ya cerrados; falta algo → preguntar, una por turno; (2) **índice antes de redactar** — presentar secciones propuestas marcando decidido vs decisión abierta, esperar aprobación; (3) redactar sobre `references/brief-template.md`; (4) señalar desviaciones al entregar; (5) entrega según contexto: en repo AWM ofrecer `docs/` o descarga; standalone entregar archivo (R4) — nunca bootstrapear repos ni asumir almacenamiento (R4.1); (6) invocar `readiness-gate` al cierre.
  - **Reglas no negociables** (heredadas de brief-spec, cada una con su redacción normativa): mandato de no-asunción como primera sección con lista exhaustiva de lo NO verificado; lenguaje calibrado en certeza ("verify in R0", nunca certeza sin fuente); procesos agnósticos de implementación; releases independientemente productivos con justificación de valor en una línea; R0 siempre descubrimiento solo-lectura; trazabilidad por IDs (N#, PR-#, RF-x.y, RNF-x.y, RNF-T.#, CA-x.y, DA-#) — sin `P#` (principios): no tiene sección de origen en el contrato de 11 secciones, se descarta por YAGNI en vez de inventar una; DAs en tabla con columnas "blocks" y "known positions"; secuencia de releases por valor de negocio con justificación escrita; fuera-de-alcance con la misma seriedad que el alcance.
  - **Extensiones nuevas sobre brief-spec:** frontmatter contract (bloque YAML literal de Task 2 Step 1, con `mode: brief`); requisitos redactados EARS-compatibles — regla literal: *"Write each RF/RNF so the development-engine brainstorming can derive its EARS `## Requirements` without rework: one testable SHALL-style claim per ID."*
  - **Anti-patrones** (lista literal de brief-spec): esquemas/rutas/firmas "tentativas" con sintaxis de certeza; CA no ejecutables o solo verificables con mocks; releases que solo tienen sentido si el siguiente existe; resolver ambigüedades del dueño en el doc en vez de DA-#; omitir fuera-de-alcance.
  - **Termination:** brief entregado + gate ejecutado; devuelve control al orquestador con el estado del sello.

- [ ] **Step 2: Escribir `references/brief-template.md`** — esqueleto completo del brief: frontmatter (bloque de Task 2) + las 11 secciones de R5.1 en orden (ver `skills/readiness-gate/references/brief-contract.md` para el orden exacto y la redacción de Users & context / Constraints), cada una con 1-2 líneas de guía inline (`<!-- guidance -->`) y ejemplos de ID. Reconstruida desde las reglas (la plantilla original no existe — hallazgo de Task 1).

- [ ] **Step 3: Lint** (convenciones) + `grep -q 'mode: brief' skills/product-brief/SKILL.md && grep -q 'DA-' skills/product-brief/references/brief-template.md && echo OK` → `OK`

- [ ] **Step 4: Commit**

```bash
git add skills/product-brief/
git commit -m "feat(product): product-brief skill — brief-spec methodology adopted into AWM (#6)"
```

---

### Task 4: Skill `product-discovery`

_Requirements: R2, R2.1_

**Files:**
- Create: `skills/product-discovery/SKILL.md`

- [ ] **Step 1: Escribir `SKILL.md`:**
  - Frontmatter: `name: product-discovery`, description: *"Use when the user brings a raw idea, an intuition about a module or product, or a problem without a formed requirement. Guides problem-space discovery (problem framing + JTBD) one question at a time — business level, never technical solutioning."*
  - **Fases** (cada una con sus preguntas guía concretas):
    1. **The problem** — quién lo sufre, cuándo aparece, qué cuesta hoy (tiempo/dinero/riesgo), qué pasa si no se resuelve.
    2. **Job to be done** — qué "contrata" el usuario al usar esto; el progreso que busca, no la feature.
    3. **Business cases** — catálogo de casos, excepciones, reglas y variantes; la skill insiste hasta agotar ("what else? which edge case would embarrass us in production?"). Este es el catálogo que hoy llega tarde al desarrollo (G4 del gate).
    4. **Constraints & context** — qué existe, qué no se puede tocar, presupuesto, privacidad, plazos.
    5. **Alternatives** — al menos 2 caminos, incluida siempre "build nothing / process change".
  - **Mecánica conversacional:** una pregunta por mensaje, multiple choice cuando aplica (misma disciplina que `brainstorming`, citarla como referencia de estilo).
  - **Cross-Cutting Rules:** disciplina de espacio de problema — regla literal: *"This skill never proposes technical solutions, architectures, or stacks. If the conversation drifts to HOW, park it as a note for the brief and return to WHAT/WHY."*; nada se afirma sin que el usuario lo confirme.
  - **Termination:** problem-space cubierto (las 5 fases con respuestas) → encadena explícitamente a `product-brief` (R2.1); si el usuario corta antes, entrega resumen parcial como `.md` con `mode: discovery` y `readiness: draft`.

- [ ] **Step 2: Lint** (convenciones) + `grep -qi 'job.to.be.done\|JTBD' skills/product-discovery/SKILL.md && echo OK` → `OK`

- [ ] **Step 3: Commit**

```bash
git add skills/product-discovery/
git commit -m "feat(product): product-discovery skill — problem framing + JTBD (#6)"
```

---

### Task 5: Skill `architecture-extraction`

_Requirements: R11, R11.1, R11.2, R5.3_

**Files:**
- Create: `skills/architecture-extraction/SKILL.md`

- [ ] **Step 1: Escribir `SKILL.md`:**
  - Frontmatter: `name: architecture-extraction`, description: *"Use when the current architecture of an existing system must be extracted, documented, or prepared for extension — reverse-engineering from code into a portable architecture document (arc42-lite + C4 views). Brownfield rule: document before touching."*
  - **Layered access** (tabla literal, patrón `ui-design`/Stitch):

| Layer | Condition | Behavior |
|-------|-----------|----------|
| 1. Graphify | `graphify` CLI available, or installs trivially (`uv tool install graphifyy` or `pip install graphifyy`, bounded attempt) | Run on repo → use `graph.json` / `GRAPH_REPORT.md` as verified structural base. EXTRACTED edges → "verified"; INFERRED edges → "inferred — confirm with owner". |
| 2. Manual | Graphify absent or install fails/times out | Agent-driven repo reconnaissance. Everything is "inferred" unless cited to file:line. |

  - **Regla de dependencias literal** (R11/R11.1/R11.2): *"Layer 2 is the contract: this skill is fully functional with zero external tools. Graphify is an opportunistic accelerator — if unavailable, degrade silently, never error, never ask the user to install anything as a prerequisite. No paid services, no mandatory auth, nothing that cannot run in a sandboxed cloud environment."*
  - **Fases:** (1) reconocimiento — stack, módulos, límites, puntos de entrada; (2) extracción de vistas — contexto y contenedores (C4), flujos clave, modelo de datos, decisiones visibles en el código (ADR arqueológico); (3) validación con el usuario — todo lo inferido se marca inferido y se confirma o corrige; (4) entrega — architecture doc portable con frontmatter (`mode: extraction`, R5.3) + registro de deuda/extensión.
  - **Cross-Cutting Rules:** certeza calibrada (verified vs inferred, herencia brief-spec); solo-lectura — la skill jamás modifica el sistema analizado; sin repo accesible, pedir el insumo (repo agregado, ruta, docs) en vez de inventar.
  - **Termination:** doc entregado; si el objetivo era extender → encadena a `product-brief` con la arquitectura como contexto verificado (R2.1); si reveló deuda → ofrecer `architecture-assessment`.

- [ ] **Step 2: Lint** (convenciones) + `grep -q 'EXTRACTED' skills/architecture-extraction/SKILL.md && grep -qi 'degrade silently' skills/architecture-extraction/SKILL.md && echo OK` → `OK`

- [ ] **Step 3: Commit**

```bash
git add skills/architecture-extraction/
git commit -m "feat(product): architecture-extraction skill — arc42/C4 with optional Graphify layer (#6)"
```

---

### Task 6: Skill `architecture-assessment`

_Requirements: R2, R2.1, R5.3, R12_

**Files:**
- Create: `skills/architecture-assessment/SKILL.md`
- Read: `docs/plans/2026-07-22-product-layer-audit.md` (veredicto sobre `architecture-advisor`)

- [ ] **Step 1: Escribir `SKILL.md`:**
  - Frontmatter: `name: architecture-assessment`, description: *"Use when an existing architecture must be evaluated, critiqued, or diagnosed — scenario-based assessment (lightweight ATAM) producing prioritized findings with severity. Assessment only: it changes nothing."*
  - **Fases:** (1) drivers — qué atributos de calidad importan aquí (elicitar con el usuario: escalabilidad, operabilidad, costo, seguridad, evolucionabilidad…) y su prioridad; (2) escenarios concretos por driver (formato estímulo→entorno→respuesta esperada: "si el volumen se triplica en 6 meses, el sistema debe…"); (3) análisis del sistema real contra cada escenario — leyendo código si hay repo (citas archivo:línea), o sobre documentación aportada si no; (4) hallazgos — riesgos, trade-offs, puntos de sensibilidad, cada uno con severidad (alta/media/baja) y evidencia; (5) recomendaciones priorizadas por severidad×esfuerzo.
  - **Reuso de `architecture-advisor`:** SOLO según el veredicto de la auditoría (Task 1). Si el veredicto fue reusar/adaptar → invocarla en modo contextual como consultor puntual; si fue descartar → la skill es autónoma y no la menciona. Escribir la versión que corresponda al veredicto real.
  - **Cross-Cutting Rules:** assessment no modifica nada; sin sistema accesible → pedir insumos, no inventar; escenarios siempre concretos y medibles, nunca "should scale well".
  - **Termination:** informe portable con frontmatter (`mode: assessment`, R5.3); si los hallazgos derivan en trabajo → ofrecer encadenar a `product-brief` (R2.1).

- [ ] **Step 2: Lint** (convenciones) + `grep -qi 'severity\|severidad' skills/architecture-assessment/SKILL.md && echo OK` → `OK`

- [ ] **Step 3: Commit**

```bash
git add skills/architecture-assessment/
git commit -m "feat(product): architecture-assessment skill — scenario-based lightweight ATAM (#6)"
```

---

### Task 7: Skill `product-process` (orquestador)

_Requirements: R1, R1.1, R2, R2.1, R3, R4, R6, R6.1, R10, R10.1, R8.3_

**Files:**
- Create: `skills/product-process/SKILL.md`

- [ ] **Step 1: Escribir `SKILL.md`** (espejo estructural de `skills/development-process/SKILL.md` — leerla como referencia de formato):
  - Frontmatter: `name: product-process`, description: *"Use when a session starts with an idea or need WITHOUT a formed requirement, a request to evaluate or extract an architecture, or an existing product brief to resume. The business-layer orchestrator: routes to discovery, brief, assessment, extraction, or re-ingestion — and hands off to development-process via a certified brief. Not for concrete code requirements (that is development-process)."*
  - **Step 0 — Context detection (R3):** ¿repo con AWM (docs/, CONSTITUTION, sensores) o standalone? Determina dónde pueden vivir los artefactos (versionados vs archivo entregado, R4) y si los modos 3/4 tienen código para leer.
  - **Step 0.5 — Brief detection (R6):** si el usuario aporta un documento (adjunto, MCP, pegado, archivo): con `awm: product-brief` en frontmatter → ruta re-ingesta; sin frontmatter válido → ofrecer adopción: convertir al contrato preservando contenido (R6.1).
  - **Step 1 — Routing por señal** (tabla literal):

| User signal | Route |
|---|---|
| "I have an idea / not sure yet what I want" | `product-discovery` |
| "I know what I want, help me structure it" | `product-brief` |
| "Evaluate / critique this architecture" | `architecture-assessment` |
| "Document / extract the current architecture" | `architecture-extraction` |
| Existing brief detected | Re-ingestion: structural lint → show state ("brief of X, readiness: draft, N open decisions") → ask: continue maturing, or hand off to development? |

  Regla literal (R1.1): *"If the signal is ambiguous between maturing the idea and building it, ASK — never guess the mode."* Encadenamientos válidos (R2.1): discovery→brief; extraction→assessment; extraction→brief; assessment→brief. Siempre secuenciales y explícitos.
  - **Step 2 — Convergence:** todo camino que produce brief invoca `readiness-gate` antes de cerrar. Entrega: `.md` + estado del sello + oferta ("save to repo / download / hand off to development now?").
  - **Step 3 — Handoff:** usuario elige desarrollo + gate re-ejecutado en `ready` → invocar `development-process`. Gate en `draft` → mostrar vacíos y ofrecer volver al modo que los madura. **Regla literal (R8.3):** *"If the dev engine (development-process) is not installed, the handoff terminates by delivering the .md — no error."*
  - **Cross-Cutting Rules (R10, R10.1):** *"Single active orchestrator: product-process ends in an explicit terminal state (artifact delivered or development-process invoked) — no nesting, no co-existence."*; *"The brief is the baton: context crosses between orchestrators only inside the artifact. What is not in the brief did not cross."*; el orquestador no hace el trabajo de los modos — rutea y garantiza fases (mismo principio que development-process).
  - **Checklist** de items (formato development-process): detección de contexto → detección de brief → ruteo → modo(s) ejecutado(s) → gate → entrega/handoff.
  - **Termination:** entrega del artefacto o invocación de `development-process`. Nunca invoca `writing-plans`, `brainstorming` ni skills del motor directamente.

- [ ] **Step 2: Lint** (convenciones) + `grep -q 'development-process' skills/product-process/SKILL.md && grep -qi 'never guess' skills/product-process/SKILL.md && echo OK` → `OK`

- [ ] **Step 3: Commit**

```bash
git add skills/product-process/
git commit -m "feat(product): product-process orchestrator — 5 routes, gate convergence, handoff (#6)"
```

---

### Task 8: Edición `brainstorming` — modo precargado

_Requirements: R8, R8.1, R8.2, R9.1_

**Files:**
- Modify: `skills/brainstorming/SKILL.md` (frontmatter líneas 3-4; checklist ~línea 25; nueva sección tras "## Overview")

- [ ] **Step 1: Bump + description (R9.1).** En el frontmatter: `version: "1.1.0"` → `"1.2.0"`; a la description existente añadir al final: *" Explores SOLUTION space and is invoked via development-process; a raw business idea with no brief and no decision to build goes to product-process first."*

- [ ] **Step 2: Nueva sección `## Brief Preload Mode`** inmediatamente después de `## Overview`, con este contenido normativo:
  - Detección: al arrancar, si el contexto contiene un artefacto `awm: product-brief`, invocar `readiness-gate` para re-verificar (nunca confiar en el sello). Sello re-verificado `ready` → modo precargado. `draft` → informar y sugerir `product-process`; continuar solo si el usuario insiste (el brief se trata como notas, no como fuente).
  - Mapeo (R8): N#/business cases → contexto y propósito; RF/RNF → semilla de `## Requirements` (EARS); out-of-scope → no-objetivos; DA-# abiertas → primeras preguntas de clarificación.
  - Regla operativa literal (R8.1): *"Before asking any clarifying question, check whether the brief already answers it. If it does, record the answer as sourced from the brief (traceable by ID: 'from brief N3') and do NOT ask it."*
  - Gates intactos (R8.2): validación técnica contra el repo real, aprobación de diseño, spec self-review — regla literal: *"The brief accelerates; it never exempts."* Sin brief → comportamiento actual sin cambios.

- [ ] **Step 3: Checklist item.** En el checklist numerado, insertar como item 1.5 (renumerar o usar "1b"): *"**Brief preload check** — if an `awm: product-brief` artifact is in context, enter Brief Preload Mode (see section)"*.

- [ ] **Step 4: Verificar**

Run: `grep -q 'Brief Preload Mode' skills/brainstorming/SKILL.md && grep -q 'version: "1.2.0"' skills/brainstorming/SKILL.md && grep -q 'product-process first' skills/brainstorming/SKILL.md && echo OK`
Expected: `OK`

- [ ] **Step 5: Commit**

```bash
git add skills/brainstorming/SKILL.md
git commit -m "feat(dev): brainstorming brief-preload mode + solution-space precedence (#6)"
```

---

### Task 9: Edición `development-process` — entrada por brief + vuelta atrás

_Requirements: R8, R10.2_

**Files:**
- Modify: `skills/development-process/SKILL.md` (frontmatter línea 3; grafo/estado inicial; sección de estados)

- [ ] **Step 1: Bump.** `version: "1.2.0"` → `"1.3.0"`.

- [ ] **Step 2: Entrada por brief.** Donde el lifecycle define `"New task / idea" -> "brainstorming"`, añadir el estado de entrada alternativo: una línea en el digraph (`"Brief ready (product layer)" [shape=doublecircle];` + `"Brief ready (product layer)" -> "brainstorming" [label="preloaded"];`) y en la tabla/lista de detección de estado la fila: brief `ready` presente en contexto → invocar `brainstorming` (entrará en Brief Preload Mode).

- [ ] **Step 3: Vuelta atrás (R10.2).** En la sección de reglas del orquestador, añadir regla literal: *"Business gap during development: if a business-level unknown appears mid-development (a missing business case, an unresolved product decision), do NOT improvise the answer. Record it as an open decision (DA-#) in the source brief and offer the user to return to product-process to mature it. The boundary is always crossed through the door."*

- [ ] **Step 4: Verificar**

Run: `grep -q 'version: "1.3.0"' skills/development-process/SKILL.md && grep -q 'Brief ready' skills/development-process/SKILL.md && grep -qi 'product-process' skills/development-process/SKILL.md && echo OK`
Expected: `OK`

- [ ] **Step 5: Commit**

```bash
git add skills/development-process/SKILL.md
git commit -m "feat(dev): development-process brief-ready entry + business-gap return rule (#6)"
```

---

### Task 10: Edición `using-awm` — frontera entre orquestadores

_Requirements: R9, R9.1, R10_

**Files:**
- Modify: `skills/using-awm/SKILL.md` (frontmatter línea 3; sección "## Orchestration", hoy ~línea 56-60)

- [ ] **Step 1: Bump.** `version: "1.1.1"` → `"1.2.0"`.

- [ ] **Step 2: Reescribir la sección `## Orchestration`.** Reemplazar el párrafo actual ("For development tasks, your default entry point is the `development-process` skill…") por la frontera de dos orquestadores (tabla literal):

```markdown
## Orchestration

AWM has two sibling orchestrators with an explicit boundary. Route by what the session starts with:

| The session starts with… | Orchestrator |
|---|---|
| An idea/need WITHOUT a formed requirement ("I have an idea", "let's explore a new module"), an architecture evaluation or extraction request, or an existing brief to resume | `product-process` |
| A concrete requirement over code (defined feature, bug, refactor), or a certified-`ready` brief handed off to build | `development-process` |
| Ambiguous | ASK: "mature the idea (product layer) or build now (development)?" — never guess |

Precedence rule: `brainstorming` explores SOLUTION space and is invoked via `development-process` — never as the entry point for a raw business idea. `product-discovery` explores PROBLEM space.

Anti-loss rules: one orchestrator active at a time; the brief is the baton between them (context crosses only inside the artifact); returning from development to product happens explicitly through `product-process`, never by improvising business answers mid-development.

For documentation tasks, the equivalent entry point is `docs-system-orchestrator`.
```

  (Conservar la última línea de docs tal como está hoy.)

- [ ] **Step 3: Spine list.** En las listas de skills spine (líneas ~9 y ~42 donde enumera `development-process, brainstorming, …`), añadir `product-process` a la enumeración de orquestadores a considerar siempre.

- [ ] **Step 4: Verificar**

Run: `grep -q 'version: "1.2.0"' skills/using-awm/SKILL.md && grep -q 'two sibling orchestrators' skills/using-awm/SKILL.md && grep -c 'product-process' skills/using-awm/SKILL.md`
Expected: `OK` implícito + count ≥ 3

- [ ] **Step 5: Commit**

```bash
git add skills/using-awm/SKILL.md
git commit -m "feat(dev): using-awm two-orchestrator boundary + precedence rules (#6)"
```

---

### Task 11: Empaquetado — bundle `product`, catalog, bump `dev`

_Requirements: R13, R13.1, R13.2_

**Files:**
- Create: `bundles/product/bundle.json`
- Modify: `catalog.json`
- Modify: `bundles/dev/bundle.json` (solo `version`)
- Create: `CHANGELOG.md`

- [ ] **Step 1: Crear `bundles/product/bundle.json`** (contenido exacto):

```json
{
  "name": "product",
  "version": "1.0.0",
  "description": "Business layer: product discovery, briefs, architecture assessment/extraction, and readiness gate — matures ideas before they enter the development engine.",
  "scope": "baseline",
  "dependsOn": [],
  "skills": [
    "product-process",
    "product-discovery",
    "product-brief",
    "architecture-assessment",
    "architecture-extraction",
    "readiness-gate"
  ],
  "workflows": [],
  "agents": []
}
```

- [ ] **Step 2: Actualizar `catalog.json`.** Añadir la fila del bundle y bumpear dev (1.5.0 → 1.6.0):

```json
{
  "version": 1,
  "bundles": [
    { "name": "dev",       "source": "./bundles/dev",       "version": "1.6.0", "scope": "baseline" },
    { "name": "product",   "source": "./bundles/product",   "version": "1.0.0", "scope": "baseline" },
    { "name": "frontend",  "source": "./bundles/frontend",  "version": "2.0.0", "scope": "project" },
    { "name": "authoring", "source": "./bundles/authoring", "version": "1.0.0", "scope": "project" }
  ]
}
```

- [ ] **Step 3: Bump `bundles/dev/bundle.json`** — solo el campo `"version": "1.5.0"` → `"1.6.0"` (las skills editadas ya pertenecen al bundle; no se añade ninguna).

- [ ] **Step 4: Crear `CHANGELOG.md`** con la entrada inicial:

```markdown
# Changelog

## product 1.0.0 / dev 1.6.0 — 2026-07-22

### Added — bundle `product` (new)
- `product-process`: business-layer orchestrator (5 routes: discovery, brief, assessment, extraction, re-ingestion).
- `product-discovery`: problem framing + JTBD, problem-space only.
- `product-brief`: brief-spec methodology adopted into AWM; portable brief with frontmatter contract.
- `architecture-assessment`: scenario-based lightweight ATAM.
- `architecture-extraction`: arc42-lite + C4, optional Graphify layer with silent manual fallback.
- `readiness-gate`: G1–G9 Definition-of-Ready; seal is informative, gate is the authority.

### Changed — bundle `dev` 1.6.0
- `brainstorming` 1.2.0: Brief Preload Mode + solution-space precedence.
- `development-process` 1.3.0: brief-ready entry state + business-gap return rule.
- `using-awm` 1.2.0: two-orchestrator boundary, precedence and anti-loss rules.

Design: docs/plans/2026-07-22-product-layer-design.md (issue #6, Partes 2+3).
```

- [ ] **Step 5: Verificar JSON válido**

Run: `python3 -c "import json; [json.load(open(f)) for f in ['catalog.json','bundles/product/bundle.json','bundles/dev/bundle.json']]; print('JSON-OK')"`
Expected: `JSON-OK`

- [ ] **Step 6: Commit**

```bash
git add bundles/product/bundle.json catalog.json bundles/dev/bundle.json CHANGELOG.md
git commit -m "feat(product): bundle product 1.0.0 + dev 1.6.0 — catalog y changelog (#6)"
```

---

### Task 12: Verificación E2E estructural

_Requirements: R1–R13.2 (verificación de conjunto)_

**Files:**
- Read: todos los creados/modificados

- [ ] **Step 1: Lint de las 6 skills nuevas** — correr el comando de convenciones sobre cada una:

```bash
for s in product-process product-discovery product-brief architecture-assessment architecture-extraction readiness-gate; do
  f=skills/$s/SKILL.md
  head -1 "$f" | grep -qx -- '---' && grep -q "^name: $s$" "$f" && grep -q '^version:' "$f" && grep -q '^description:' "$f" && grep -q '^## Termination' "$f" && grep -q '^## Cross-Cutting Rules' "$f" && echo "$s LINT-OK" || echo "$s FAIL"
done
```
Expected: 6 × `LINT-OK`, 0 × `FAIL`

- [ ] **Step 2: Recorrido de los 5 caminos del orquestador** (lectura dirigida, no ejecución): verificar en `skills/product-process/SKILL.md` que cada fila de la tabla de ruteo apunta a una skill que existe en `skills/`, que la re-ingesta cubre lint+estado+dos ofertas, y que los tres estados terminales (entrega, handoff, vuelta a modo por draft) están escritos.

- [ ] **Step 3: Coherencia de contrato:** el bloque YAML del frontmatter en `readiness-gate/references/brief-contract.md`, `product-brief/SKILL.md` y `product-brief/references/brief-template.md` es idéntico campo a campo:

Run: `for f in skills/readiness-gate/references/brief-contract.md skills/product-brief/SKILL.md skills/product-brief/references/brief-template.md; do grep -o 'awm: product-brief\|schema: 1\|open_decisions' $f | sort | uniq -c; done`
Expected: los tres archivos contienen los tres marcadores

- [ ] **Step 4: Anti-confusión:** verificar que la precedencia está en ambos lados:

Run: `grep -qi 'solution space' skills/brainstorming/SKILL.md && grep -qi 'problem space\|PROBLEM space' skills/using-awm/SKILL.md && echo BOUNDARY-OK`
Expected: `BOUNDARY-OK`

- [ ] **Step 5: Commit final si hubo correcciones; si no, no-op.**

```bash
git add -A && git diff --cached --quiet || git commit -m "fix(product): correcciones de verificación E2E estructural (#6)"
```

---

## Traceability Matrix

| Req | Task(s) | Verificación |
|------|---------|-------------|
| R1, R1.1 | T7 | T7-S2 grep `never guess`; T12-S2 recorrido rutas |
| R2, R2.1 | T4, T5, T6, T7 | T12-S2 (rutas apuntan a skills existentes; encadenamientos escritos) |
| R3 | T7 | T12-S2 (Step 0 context detection presente) |
| R4, R4.1 | T3, T7 | Lectura T12-S2 (entrega en repo vs standalone; sin bootstrap) |
| R5, R5.2 | T2 | T2-S3 greps contrato; T12-S3 coherencia campo a campo |
| R5.1 | T3 | T3-S3 grep template (secciones + DA-) |
| R5.3 | T5, T6 | T12-S1 + lectura: `mode: extraction`/`mode: assessment` en Termination |
| R6, R6.1 | T7 | T12-S2 (re-ingesta: lint + estado + adopción) |
| R7, R7.1, R7.2 | T2 | T2-S3 grep `G[1-9]`≥9; lectura de "no override" y re-run en cruce |
| R8, R8.1, R8.2 | T8 | T8-S4 greps (`Brief Preload Mode`, versión, precedencia) |
| R8.3 | T7 | Lectura T12-S2 (handoff sin dev instalado → entrega .md) |
| R9 | T10 | T10-S4 grep `two sibling orchestrators` |
| R9.1 | T8, T10 | T8-S4 grep `product-process first`; T12-S4 `BOUNDARY-OK` |
| R10, R10.1 | T7, T10 | T12-S4 + lectura reglas baton/single-orchestrator |
| R10.2 | T9 | T9-S4 greps (`Brief ready`, `product-process`) |
| R11, R11.1, R11.2 | T5 | T5-S2 greps (`EXTRACTED`, `degrade silently`) |
| R12 | T1 | T1-S3 grep tabla ≥7 filas; T6 lee el veredicto |
| R13, R13.1 | T11 | T11-S5 `JSON-OK` + versiones exactas en catalog |
| R13.2 | T2–T7 | T12-S1 lint 6× `LINT-OK` |

**Analyze gate:** todos los R tienen ≥1 task y ≥1 verificación; ningún task carece de R (T12 es verificación de conjunto). Sin gaps. Nota de precisión: los greps son proxies estructurales; los claims semánticos (R4, R8.3, R10.1) se verifican por lectura dirigida en T12-S2, declarado en la matriz.
