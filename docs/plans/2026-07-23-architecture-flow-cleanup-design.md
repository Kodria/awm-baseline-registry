# Flow-Cleanup de Skills de Arquitectura y Advisory — Design Doc

**Fecha:** 2026-07-23 · **Issue:** [awm-baseline-registry#6](https://github.com/Kodria/awm-baseline-registry/issues/6) (Parte 1, reformulada como limpieza de flujos — NO desacople a registry aparte) · **Estado:** aprobado en brainstorming

Elimina redundancias, referencias muertas y ambigüedades de triggering en las skills de arquitectura/advisory, arregla la causa raíz de que las specialists nunca disparen desde `brainstorming`, y formaliza el patrón "environment port" para las skills personales de claude.ai.

**Hallazgo raíz (evidencia de esta sesión):** la sección "Specialist Skills Awareness" de `brainstorming` es una nota al pie ("you *may* invoke") que su checklist menciona cero veces — por eso el usuario nunca la vio disparar en sesiones reales. Las 4 advisory están cableadas pero funcionalmente muertas en la práctica. Además, sus Fases 6 delegan a skills que no existen en este registry (`docs-assistant`, `docs-brainstorming`, `docs-system-orchestrator`, `c4-architecture` — viven en el documentation registry, opt-in y semi-legacy, que el usuario no instala hace tiempo).

Fuera de alcance: mover skills a un registry aparte (descartado explícitamente); automatizar la sincronización de ports (futuro, se registra como issue); Parte 4 (HTML) y Parte 5 (Hermes) del issue #6 (se registran como issues propios).

## Requirements

### F1 — Cortar las Fases 6 muertas

- **R1** — THE skills `architecture-advisor`, `technology-evaluator` y `nfr-checklist-generator` SHALL entregar su artefacto final directamente (`.md` portable; en repo AWM ofrecer `docs/` o descarga; standalone entregar archivo), sin delegar a skills de documentación.
- **R1.1** — THE referencias a `docs-assistant`, `docs-brainstorming`, `docs-system-orchestrator`, `c4-architecture` y `discovery-assistant` SHALL estar ausentes de las tres advisory (verificable: grep = 0 ocurrencias en `skills/architecture-advisor/`, `skills/technology-evaluator/`, `skills/nfr-checklist-generator/`).
- **R1.2** — WHILE en modo contextual, THE advisory SHALL devolver su resultado al invocador sin generar artefacto standalone (comportamiento actual, se preserva).

### F2 — Gate activo de specialists

- **R2** — THE checklist de `brainstorming` (paso "Propose 2-3 approaches") SHALL incluir un sub-paso obligatorio de gate: evaluar explícitamente si el diseño involucra elección de patrón arquitectónico, selección de tecnología, o definición de NFRs; IF sí, THEN invocar la specialist correspondiente en modo contextual e integrar su output en los enfoques; IF no, THEN declarar explícitamente "no aplica" (el silencio no es un resultado válido del gate).
- **R2.1** — THE sección pasiva "Specialist Skills Awareness" SHALL ser absorbida por el gate activo (desaparece el "you may invoke"); la fila de `cicd-proposal-builder` SHALL eliminarse de la tabla.
- **R2.2** — THE invocación del advisor en `architecture-assessment` Fase 3 SHALL usar la misma formulación de gate explícito (evaluar → invocar o declarar "no aplica").
- **R2.3** — THE versiones SHALL bumpearse: `brainstorming` 1.2.0 → 1.3.0; `architecture-assessment` 1.0.0 → 1.1.0.

### F3 — Retiro de `cicd-proposal-builder`

- **R3** — THE skill `cicd-proposal-builder` SHALL eliminarse del bundle `dev`, del gate de specialists de `brainstorming`, y su directorio SHALL borrarse del repo (git history la preserva).
- **R3.1** — THE rationale del retiro SHALL documentarse en CHANGELOG: sin consumidor real, sin trigger natural en diseño de features; si se necesita en el futuro, se rediseña con trigger real (probablemente en setup de proyecto, no en brainstorming).

### F4 — `mermaid-diagrams` nativa en el registry

- **R4** — THE registry SHALL incluir una skill `mermaid-diagrams` en el bundle `dev` (on-signal), adaptada de la skill personal del usuario (`~/.claude/skills/mermaid-diagrams/`) al formato baseline (frontmatter `name`/`version`/`description`, `## Cross-Cutting Rules`, `## Termination`), conservando los 9 tipos de diagrama y sus archivos `references/*.md`.
- **R4.1** — THE nota de diagramas de `architecture-advisor` SHALL referenciar `mermaid-diagrams` (registry) en lugar de la extinta `c4-architecture`.
- **R4.2** — THE referencias de capa 1 en `architecture-extraction` (Step 0b) y `architecture-assessment` SHALL apuntar a la skill del registry; los fallbacks inline SHALL preservarse (defensa ante instalaciones parciales).

### F5 — Patrón "environment port" + trazabilidad en issues

- **R5** — THE registry SHALL documentar el patrón environment-port en `docs/environment-ports.md`: definición (copia adaptada de una skill canónica del registry para entornos sin AWM/filesystem — claude.ai web, Cowork móvil/web), tabla de ports vigentes, pacto de sincronización manual (actualizar el port tras cambiar la canónica es responsabilidad del dueño), y dirección futura (bundle exportable).
- **R5.1** — THE ciclo SHALL crear issues de GitHub para el trabajo diferido: (a) bundle exportable para claude.ai en `Kodria/agentic-workflow` (feature del CLI, pariente de Hermes); (b) Parte 4 del issue #6 (capa de presentación HTML) en `Kodria/awm-baseline-registry`, diferida con criterio de activación explícito (Hermes soportado, o dolor real presentando briefs a stakeholders); (c) Parte 5 del issue #6 (soporte Hermes) en `Kodria/agentic-workflow`.
- **R5.2** — WHEN el PR de este ciclo se integre, THE issue #6 SHALL cerrarse con un comentario que enlace lo entregado (Partes 2+3 en PR #11, Parte 1 reformulada en este ciclo) y los issues nuevos de (a)/(b)/(c).

### F6 — Ports personales actualizados (entregables para el usuario)

- **R6** — THE ciclo SHALL producir el contenido listo-para-pegar de los dos ports personales de claude.ai, versionado en `docs/ports/`: `brief-spec.claude-ai.md` (alineado al frontmatter contract de `brief-contract.md`, con línea de deferencia: "in AWM environments, defer to product-process/product-brief") y `mermaid-diagrams.claude-ai.md` (port de la skill del registry, con la misma línea de deferencia).
- **R6.1** — THE actualización efectiva en claude.ai SHALL quedar como acción manual del usuario (no existe API); el ciclo entrega los textos y `docs/environment-ports.md` documenta el paso.

### F7 — Empaquetado

- **R7** — THE bundle `dev` SHALL bumpear 1.6.0 → 2.0.0 y THE bundle `product` SHALL bumpear 1.0.0 → 1.1.0 (gate nuevo en `architecture-assessment` = minor, + referencias de capa 1 en `architecture-extraction`); `catalog.json` y `bundles/*/bundle.json` consistentes; entrada nueva en CHANGELOG (newest-on-top). Nota post-implementación: el bump de `dev` se corrigió de minor (1.7.0) a major (2.0.0) durante la revisión de calidad de Task 7 — retirar `cicd-proposal-builder` es una ruptura de contrato per la convención semver de `CONSTITUTION.md`, sin excepción por "cero consumidores conocidos".

## Diseño

### F1 — Entrega directa en las advisory

Las tres advisory reemplazan su tabla de Fase 6 ("quién ejecuta el artefacto") por el patrón de entrega de la capa de producto: el artefacto se escribe como `.md` portable y se ofrece según contexto (repo → `docs/` o descarga; standalone → archivo). El modo contextual no cambia (ya devuelve al invocador sin artefacto). Nota en el design doc, no en las skills: si el documentation registry revive, la delegación puede reintroducirse como layered-access — hoy es YAGNI.

### F2 — El gate activo

El texto del gate en `brainstorming` (sub-paso del paso 4, redacción normativa): *"Before presenting approaches, evaluate each specialist domain explicitly — architecture pattern choice (`architecture-advisor`), technology selection (`technology-evaluator`), NFR definition (`nfr-checklist-generator`). For each: if the design involves it, invoke the specialist in contextual mode and integrate its output into the approaches; if it does not, state 'not applicable' for that domain. Silence is not a valid gate outcome."* La tabla pasiva se convierte en la referencia del gate (qué skill cubre qué dominio) y pierde el "you may invoke". En `architecture-assessment`, la frase "when Phase 3 would benefit" se reformula con la misma estructura evaluar→invocar-o-declarar. Nota post-implementación (revisión de calidad de Task 3): el gate exige además que los tres verdicts sean **user-visible** — el mensaje que presenta los enfoques debe abrir con el resultado del gate (una línea por dominio); una evaluación que ocurre solo "en la cabeza del agente" es indistinguible de que el gate nunca corrió. Ver `skills/brainstorming/SKILL.md`, sección "Specialist Gate", para el texto exacto.

### F3 — Retiro

`git rm -r skills/cicd-proposal-builder/`, edición de `bundles/dev/bundle.json` (quitar la entrada on-signal), y la fila de la tabla de specialists de brainstorming. CHANGELOG con rationale.

### F4 — Adaptación de mermaid

Se copia el contenido de `~/.claude/skills/mermaid-diagrams/` (SKILL.md + references/) a `skills/mermaid-diagrams/`, adaptando: frontmatter al formato baseline, description activadora en tercera persona, secciones Cross-Cutting/Termination agregadas (Termination: devuelve el diagrama al invocador o lo entrega inline; nunca orquesta). Los consumidores actualizan su capa 1: `architecture-extraction` Step 0b tabla ("Listed among available skills" → referencia al registry), `architecture-assessment` sección equivalente, `architecture-advisor` nota de diagramas.

### F5/F6 — Ports y trazabilidad

`docs/environment-ports.md` (corta, ~40 líneas) + `docs/ports/*.claude-ai.md` (contenido completo de cada port). Issues: 3 nuevos con cuerpo accionable (contexto, criterio de activación, referencias al design doc), y cierre de #6 al mergear.

### Orden de implementación

1. F4 (mermaid al registry — desbloquea las referencias de F1/F4.1).
2. F1 (Fases 6 muertas, incluye R4.1 en advisor).
3. F2 (gate activo en brainstorming + assessment).
4. F3 (retiro cicd).
5. F6 (ports en `docs/ports/`).
6. F5 (environment-ports.md + creación de issues).
7. F7 (empaquetado + CHANGELOG).
8. Verificación E2E: grep de referencias muertas = 0 en todo `skills/`, lint estructural de `mermaid-diagrams`, JSON válido, gate presente en ambos archivos.

## Referencias

- Auditoría previa: `docs/plans/2026-07-22-product-layer-audit.md` (veredictos advisor/mermaid: "adaptar")
- Capa de producto (consumidores actuales): `docs/plans/2026-07-22-product-layer-design.md`, PR #11
- Contrato del brief (los ports lo adoptan): `skills/readiness-gate/references/brief-contract.md`
- Evidencia del defecto de triggering: checklist de `brainstorming` menciona specialists 0 veces; sección pasiva en línea 286
