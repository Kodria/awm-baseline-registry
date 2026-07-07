# Modo de Ejecución Desatendida + Contratos de Salida de Subagentes — Design

**Fecha:** 2026-07-06
**Origen:** issue [Kodria/agentic-workflow#5](https://github.com/Kodria/agentic-workflow/issues/5) (modo desatendido) + investigación del patrón caveman/cavecrew (contratos de salida).
**Alcance:** cambio de contenido puro en `awm-baseline-registry`. Sin cambios en el CLI ni en `~/.awm`.

## Contexto

Hoy el patrón "Ejecución Desatendida" funciona solo si el agente recuerda un mandato en prosa escrito en el header del plan — frágil en sesiones largas. Este diseño lo formaliza como campo estructurado que 5 skills leen de forma determinística.

En paralelo, los reportes de subagentes de la cadena SDD/QA vuelven al contexto del controlador como prosa libre. Adoptamos el patrón cavecrew (contratos de salida compactos, greppables) de forma **nativa en los prompt templates** — sin dependencia del plugin caveman externo.

Dos decisiones de reconciliación con el estado actual del registry:

1. `subagent-driven-development` v1.2.0 **ya ejecuta continuo** entre tareas (el issue asumía que pausaba). El modo NO cambia eso: en SDD solo gobierna la TERMINATION_PHASE.
2. El issue lista 4 skills, pero el orquestador `development-process` tiene su propia pausa de aprobación entre fases. Se agrega como 5° lector — sin él, el mandato no se cumple de punta a punta.

## Requirements

### R1 — Campo `Modo de ejecución` en el header del plan

- **R1.1** THE template de header de `writing-plans` SHALL incluir el campo `**Modo de ejecución:** interactivo | desatendido` (default: `interactivo`), ubicado después de `**Tech Stack:**`.
- **R1.2** WHERE el modo es `desatendido`, THE header del plan SHALL incluir automáticamente el texto canónico del mandato (blockquote del issue #5) inmediatamente después del campo. El texto canónico vive solo en el template de `writing-plans`; los lectores parsean únicamente la línea del campo.
- **R1.3** IF el campo está ausente en un plan, THEN los skills lectores SHALL operar en modo `interactivo`.
- **R1.4** IF el campo contiene un valor distinto de `interactivo` o `desatendido`, THEN el skill lector SHALL tratar el plan como `interactivo` y avisar al usuario del valor inválido (fail-safe hacia el humano).

### R2 — Lector: `development-process`

- **R2.1** WHEN el plan activo declara `desatendido`, THE `development-process` SHALL rutear automáticamente entre fases post-plan (ejecución → QA → retro → finishing) sin pedir aprobación al usuario.
- **R2.2** THE `development-process` SHALL mantener interactivas las fases previas a la existencia del plan (brainstorming, ui-design, writing-plans), en ambos modos.

### R3 — Lector: `subagent-driven-development`

- **R3.1** WHEN el modo es `desatendido`, THE TERMINATION_PHASE de SDD SHALL invocar `post-implementation-qa` y devolver control al orquestador sin preguntar "¿quieres continuar con el cierre?".
- **R3.2** THE SDD SHALL mantener la ejecución continua entre tareas en ambos modos (comportamiento v1.2.0 sin cambios).
- **R3.3** IF un subagente reporta BLOCKED irresoluble o existe ambigüedad que impide el progreso, THEN SDD SHALL detenerse y escalar al usuario, incluso en modo `desatendido`.

### R4 — Lector: `post-implementation-qa`

- **R4.1** WHEN el modo es `desatendido`, THE `post-implementation-qa` SHALL omitir la confirmación del Step 4 ("¿procedemos con todos?") y corregir TODOS los hallazgos (blockers → important → minors), sin descartes.
- **R4.2** THE `post-implementation-qa` SHALL mantener el ledger gate, el sensor gate y `verification-before-completion` por fix, en ambos modos.

### R5 — Lector: `harness-retro`

- **R5.1** WHEN el modo es `desatendido`, THE `harness-retro` SHALL triagear con criterio propio en vez de presentar cada ítem: curar hallazgos recurrentes (≥2 en `awm ledger recurring`), de alta severidad o sistémicos; descartar el resto sin preguntar.
- **R5.2** WHEN descarta un hallazgo en modo `desatendido`, THE `harness-retro` SHALL documentar la razón del descarte en `docs/harness-retros.md`.
- **R5.3** THE `harness-retro` SHALL ejecutar la verificación de que la regla dispara, `awm ledger archive` y el marker `awm-retro-complete`, en ambos modos.

### R6 — Lector: `finishing-a-development-branch`

- **R6.1** WHEN el modo es `desatendido` y los tests pasan, THE `finishing-a-development-branch` SHALL ejecutar directamente la Opción 2 (push + PR) sin presentar el menú de 4 opciones.
- **R6.2** IF los tests fallan, THEN `finishing-a-development-branch` SHALL detenerse y reportar los fallos sin crear el PR, en ambos modos.
- **R6.3** WHILE el modo es `desatendido`, THE `finishing-a-development-branch` SHALL NOT ejecutar la opción Discard (acción destructiva; requiere humano siempre).

### R7 — Gates invariantes

- **R7.1** THE cinco gates (Sensor, Ledger, Reconciliation, Anti-bias reviewer separation, drift plan-vs-código) SHALL ejecutarse idénticos en ambos modos. El modo desatendido quita pausas, no controles.

### R8 — Contratos de salida de subagentes (patrón cavecrew, nativo)

- **R8.1** THE `implementer-prompt.md` SHALL reemplazar su "Report Format" por un Report Contract de campos fijos: `status` (enum actual sin cambios) / `files` / `tests` / `sensors` / `self-review` / `concerns`.
- **R8.2** THE `spec-reviewer-prompt.md` SHALL exigir un Report Contract: `verdict: compliant | issues` + líneas `<missing|extra|misread> — <R#> — file:line — ≤12 palabras` + línea `ledger:` con conteo de emisiones.
- **R8.3** THE `code-quality-reviewer-prompt.md` SHALL exigir un Report Contract: `verdict: approved | issues` + líneas `file:line — <severidad> — problema ≤12 palabras. fix ≤8 palabras.` + `totals` + `sensors` + `ledger` (reemplaza el retorno Strengths/Issues/Assessment).
- **R8.4** THE contratos SHALL conservar intactas las instrucciones de `awm ledger add` y del sensor gate existentes en cada template.
- **R8.5** IF el subagente reporta BLOCKED/NEEDS_CONTEXT, una advertencia de seguridad, o un punto donde el fragmento crea ambigüedad técnica, THEN el template SHALL instruir explicación en prosa normal a continuación del contrato (auto-clarity).
- **R8.6** THE contratos SHALL exigir código, comandos, errores y nombres técnicos byte-exactos, y SHALL prohibir abreviaciones inventadas (cfg/impl/req) y narración de proceso.
- **R8.7** THE `deep-review-prompt.md` (QA) SHALL mantener su formato JSON, agregando límites: `title` ≤12 palabras, `detail` ≤25 palabras, `detail` no repite `evidence`.
- **R8.8** THE contratos SHALL aplicar en ambos modos de ejecución (el ahorro de contexto es independiente del modo).

### R9 — Documentación y distribución

- **R9.1** THE cada skill lector (los 5) SHALL incluir una sección "Modo desatendido" documentando qué pausa omite y qué gates mantiene.
- **R9.2** THE release SHALL bumpear las versiones: `writing-plans` 1.1.0→1.2.0, `subagent-driven-development` 1.2.0→1.3.0, `harness-retro` 2.0.1→2.1.0, `post-implementation-qa` 1.1.0→1.2.0, `finishing-a-development-branch` 1.0.0→1.1.0, `development-process` 1.0.1→1.1.0; bundle y `catalog.json` 1.2.0→1.3.0; tag `v1.3.0` tras merge.

### R10 — Validación E2E (criterio de aceptación del issue)

- **R10.1** WHEN la versión nueva esté instalada vía `awm update`, THE shakedown SHALL ejecutar un plan pequeño real en modo `desatendido` en el proyecto de laboratorio `test-awm` y verificar: cero preguntas entre ejecución → QA → retro → finishing, PR creado automáticamente, sensores en verde, ledger creció y se archivó, markers `awm-qa-complete`/`awm-retro-complete` presentes, y reportes de subagentes en formato contrato.

## Diseño

### 1. Campo `Modo de ejecución`

Formato en el header del plan (template de `writing-plans`):

```markdown
**Modo de ejecución:** desatendido

> Mandato de ejecución desatendida: ejecución completa sin pausas de check-in
> entre tareas, ni de confirmación entre fases (development-process rutea
> automáticamente y subagent-driven-development no pregunta si continuar con
> el cierre). harness-retro triagea con criterio propio del agente (solo valor
> real, recurrente o sistémico — descarta el resto sin preguntar).
> post-implementation-qa corrige TODOS los hallazgos que surjan, no solo algunos.
> finishing-a-development-branch crea el PR directamente (opción "push + PR"),
> sin presentar el menú de 4 opciones.
```

Semántica por lector:

| Skill | En `desatendido` | Qué NO cambia |
|---|---|---|
| `development-process` | Rutea automático entre fases post-plan sin aprobación | Fases de diseño siguen interactivas |
| `subagent-driven-development` | TERMINATION_PHASE sin pregunta; encadena a QA y devuelve control | Ejecución continua (ya default); BLOCKED detiene |
| `post-implementation-qa` | Step 4 sin confirmación; corrige TODOS los hallazgos | Ledger/sensor gates, verification por fix |
| `harness-retro` | Triage con criterio propio; descartes documentados | Verify rule fires, archive, marker |
| `finishing-a-development-branch` | Directo a Opción 2 (push + PR) | Tests rojos → STOP; Discard inaccesible |

Pausas que NUNCA se saltan en ningún modo: BLOCKED irresoluble, ambigüedad que impide progreso, tests rojos en finishing, confirmaciones de acciones destructivas.

### 2. Contratos de salida

Contratos concretos por template (ver R8). Ejemplo del implementer:

```
status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
files: <path — cambio ≤10 palabras>          (una línea por archivo)
tests: <N pass / M fail — comando ejecutado>
sensors: overall: pass | fail | not_certified — new findings corregidos: N
self-review: clean | <≤3 bullets>
concerns: none | <≤3 bullets>
```

Racional: los retornos de subagentes se inyectan verbatim al contexto del controlador; en sesiones SDD largas (3 subagentes por tarea × N tareas) la prosa libre agota contexto. El patrón cavecrew reporta ~60% de reducción en el tool-result. El Reconciliation Gate del controlador (reconciliar reporte contra archivos) se vuelve más mecánico con campos greppables (`sensors:`, `ledger:`, `files:`).

Se adopta el patrón, no el plugin: cero dependencias externas; el registry sigue siendo autocontenido y agnóstico de agente.

### 3. Manejo de errores

- Campo ausente o inválido → interactivo + aviso (R1.3, R1.4). El harness falla hacia el humano, nunca hacia la autonomía.
- Escalaciones (BLOCKED/NEEDS_CONTEXT) y advertencias de seguridad se expresan en prosa normal aunque el contrato sea compacto (R8.5) — comprimir una escalación le quita al controlador información para decidir.
- Tests rojos en finishing bajo desatendido → STOP con reporte, nunca PR roto (R6.2).

### 4. Testing

- **Self-review estructural pre-merge:** greps que verifican presencia del campo y mandato en el template, sección "Modo desatendido" en los 5 lectores, Report Contract en los 3 templates SDD, y que las instrucciones `awm ledger add` + sensor gate siguen intactas en cada template (regresión conocida: perder la instrucción del ledger rompe el pipeline de aprendizaje).
- **Shakedown E2E** en `test-awm` (R10.1).

### 5. Fuera de alcance

- Modo caveman de cara al usuario, compresión de archivos de contexto (AGENTS.md/CONSTITUTION.md) e instalación del plugin caveman — evaluados y descartados en brainstorming.
- Cambios en el CLI (`agentic-workflow`) o en `~/.awm`.
- Restaurar pausas entre tareas en SDD modo interactivo (el continuo es el default correcto en ambos modos).
