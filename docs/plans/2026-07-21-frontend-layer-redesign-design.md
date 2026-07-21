# Rediseño de la capa frontend — artifact-first, acceso por capas, gate de fidelidad

**Fecha:** 2026-07-21
**Estado:** diseño aprobado en brainstorming, pendiente de plan
**Repo afectado:** `awm-baseline-registry` (solo contenido; cero cambios en el CLI de AWM)

## Problema

Los resultados de UI/UX de los agentes divergen fuertemente de los diseños de Stitch (evidencia: pantalla "Equipo" implementada sin header/search/avatar, celdas con chips numéricos en vez de tarjetas tituladas, sin cards de stats). Causas verificadas:

1. `ui-design` guarda solo referencias `screens/{id}` en el design doc ("References only" — `skills/ui-design/SKILL.md:205`); el implementador nunca ve el HTML/PNG del diseño.
2. La cadena de subagentes no propaga skills: `writing-plans` no declara skills por tarea, `implementer-prompt.md` no menciona skills ni artefactos, `using-awm` tiene `<SUBAGENT-STOP>` que apaga todo para subagentes, y el bundle `frontend` (project-scope) frecuentemente no está instalado.
3. El MCP de Stitch es inconfigurable en los entornos cloud de Anthropic (el conector personalizado solo soporta OAuth; Stitch autentica con API key) → frontend solo funciona en un PC.
4. La skill `code-to-design` está rota desde su origen (referencia 3 skills inexistentes).

Se integra además la skill nueva `ui-ux-pro-max` (motor BM25 offline en Python stdlib, ~1.8MB de CSVs: estilos, paletas, tipografía, UX guidelines, 22 stacks) como base de conocimiento de diseño de la capa.

## Requirements

### R1 — Integración de ui-ux-pro-max
- **R1.1** THE registry SHALL incluir la skill `ui-ux-pro-max` (copia física desde `agentic-workflow/.agents/skills/ui-ux-pro-max`) con `version` en el frontmatter.
- **R1.2** WHEN la skill se invoca desde cualquier instalación soportada (`~/.claude/skills/`, `.claude/skills/`, `.agents/skills/`, vía symlink AWM), THE SKILL.md SHALL resolver la ruta de sus scripts sin `${CLAUDE_PLUGIN_ROOT}` y ejecutar con `python3` + stdlib únicamente.
- **R1.3** IF `python3` no está en PATH, THEN THE skill SHALL indicar el fallback (`python`, `py -3`) sin referenciar documentación inexistente.

### R2 — Acceso a Stitch por capas (ui-design v2)
- **R2.1** WHEN los tools MCP de Stitch están disponibles, THE ui-design SHALL usarlos (capa 1).
- **R2.2** IF no hay MCP AND existen `STITCH_API_KEY` y `npx`, THEN THE ui-design SHALL operar vía CLI `npx -y @_davideast/stitch-mcp tool <name>` por Bash (capa 2), con la sintaxis verificada por el spike previo.
- **R2.3** IF no hay MCP ni CLI viable, THEN THE ui-design SHALL entrar en modo offline (capa 3) — SHALL NOT abortar por falta de Stitch.
- **R2.4** THE ui-design SHALL anunciar al usuario la capa seleccionada al inicio de la fase.
- **R2.5** IF una llamada de la capa 2 falla, THEN THE ui-design SHALL degradar a capa 3 anunciándolo (nunca en silencio).

### R3 — Contrato artifact-first
- **R3.1** WHEN una pantalla es aprobada por el usuario, THE ui-design SHALL materializar `.stitch/designs/<slug>.html` y `.stitch/designs/<slug>.png` antes de marcarla `completed`.
- **R3.2** IF los artefactos de una pantalla no existen en disco, THEN THE ui-design SHALL NOT marcarla `completed`.
- **R3.3** THE tabla `## UI Screens` del design doc SHALL incluir una columna `Artifacts` con los paths de ambos archivos.
- **R3.4** WHEN la fase de diseño termina, THE ui-design SHALL commitear design doc + `.stitch/designs/` + `design-system/`.
- **R3.5** IF el `.gitignore` del proyecto excluye `.stitch/`, THEN THE ui-design SHALL detectarlo y resolverlo con el usuario antes de continuar.
- **R3.6** WHEN se crea el design system o se genera una pantalla, THE ui-design SHALL consultar `ui-ux-pro-max` (product type, industria, tono del design doc) para alimentar `create_design_system` y enriquecer cada prompt de `generate_screen_from_text`.
- **R3.7** THE fase de implementación SHALL consumir únicamente los artefactos commiteados — SHALL NOT requerir acceso a Stitch (MCP ni CLI).

### R4 — Modo offline (capa 3)
- **R4.1** WHILE en capa 3, THE ui-design SHALL generar tokens con `ui-ux-pro-max --design-system --persist --output-dir <root>` (`design-system/<slug>/MASTER.md`).
- **R4.2** WHILE en capa 3, por cada pantalla pending THE ui-design SHALL producir un mockup HTML estático autocontenido en `.stitch/designs/<slug>.html` invocando `impeccable` con los tokens como brief (carve-out del HARD-GATE: el mockup es artefacto de diseño, no implementación).
- **R4.3** IF Playwright está disponible, THEN THE ui-design SHALL renderizar el PNG del mockup (`file://` + resize al device + screenshot); IF no, THEN SHALL registrar `png: n/a (offline)` en la tabla — degradación explícita.

### R5 — frontend-craft cableado a la capa
- **R5.1** WHEN existen artefactos `.stitch/designs/*` para la superficie a trabajar, THE frontend-craft SHALL tratarlos como ground truth visual y leerlos antes de cualquier inferencia.
- **R5.2** WHEN una decisión de color/tipografía/UX no tiene respuesta en el Design Direction, THE frontend-craft SHALL consultar `ui-ux-pro-max` (`--domain color|typography|ux`) antes de escalar a `impeccable`, pasando los resultados en el escalation contract.

### R6 — Gate de fidelidad visual (design-fidelity)
- **R6.1** THE registry SHALL incluir la skill nueva `design-fidelity`, invocable standalone y como lente de QA.
- **R6.2** WHEN se verifica una pantalla, THE design-fidelity SHALL construir un inventario estructural de elementos desde el HTML de diseño (header, search, cards, stats, …).
- **R6.3** WHEN hay browser (Playwright), THE design-fidelity SHALL capturar la implementación al ancho del diseño (`.stitch/verification/<slug>-impl.png`), comparar lado a lado con el PNG de diseño y clasificar cada elemento del inventario como `present | missing | diverged`.
- **R6.4** IF hay elementos `missing`/`diverged`, THEN THE design-fidelity SHALL conducir un fix loop hasta verdict `CONVERGED` o descarte explícito del usuario por elemento.
- **R6.5** IF no hay browser disponible, THEN THE verdict SHALL ser `NOT_CERTIFIED` con checklist HTML-vs-código — SHALL NOT aprobar sin evidencia.
- **R6.6** WHEN `post-implementation-qa` procesa un diff que toca UI y existe `.stitch/designs/`, THE QA SHALL invocar `design-fidelity` y sus findings SHALL entrar al fix loop de QA.

### R7 — Cadena de subagentes
- **R7.1** WHEN una tarea del plan crea/modifica UI de una pantalla diseñada, THE writing-plans SHALL exigir en esa tarea los campos `**Skills:**` y `**Design artifacts:**` (paths heredados de la tabla del design doc), con check en el self-review del plan.
- **R7.2** THE implementer-prompt SHALL incluir bloques `## Required Skills` (invocar cada skill declarada con el Skill tool ANTES de implementar) y `## Design Artifacts` (mirar el PNG y leer el HTML antes de codear; confirmar elemento por elemento antes de reportar DONE), poblados por el controller desde el plan.
- **R7.3** IF el Skill tool no está disponible en el contexto del subagente, THEN THE subagente SHALL reportarlo en concerns — SHALL NOT omitirlo en silencio.
- **R7.4** THE using-awm SHALL reemplazar `<SUBAGENT-STOP>` por `<SUBAGENT-POLICY>`: el subagente omite skills de orquestación pero SHALL invocar las declaradas en su prompt y las de craft/verificación que su tarea dispare.
- **R7.5** IF development-process detecta trabajo de UI (fase 1.5 pendiente o plan con `**Design artifacts:**`) AND las skills de frontend no están instaladas, THEN SHALL detenerse e instruir `awm update && awm init` (bundle frontend) — SHALL NOT improvisar la fase.

### R8 — Bundles, limpieza y versiones
- **R8.1** THE skill `code-to-design` SHALL eliminarse del registry y del bundle frontend (`extract-design-md` y `react-components` permanecen).
- **R8.2** THE bundle `frontend` SHALL pasar a v2.0.0 (entran `ui-ux-pro-max` y `design-fidelity`, sale `code-to-design`); THE bundle `dev` SHALL bumpearse (minor) por las skills de orquestación tocadas; `catalog.json` SHALL reflejar ambos.
- **R8.3** THE `awm-registry.json` (`minCliVersion: 2.0.0`) SHALL permanecer sin cambios — cero cambios de CLI.

## Diseño

### Arquitectura: contrato artifact-first

```
brainstorming ──► ui-design v2 ──► writing-plans ──► subagentes ──► post-implementation-qa
                     │                   │                │                │
                     ▼                   ▼                ▼                ▼
              .stitch/designs/     tareas declaran   prompt incluye   design-fidelity:
              <slug>.html + .png   Skills: y Design  artefactos +     screenshot vs PNG
              design-system/       artifacts:        skills a invocar  → CONVERGED / fix loop
              MASTER.md (tokens)
```

El punto de corte: la fase de diseño produce artefactos versionados con el código; la implementación es independiente de Stitch en cualquier entorno.

### Capas de acceso a Stitch (autodetección en ui-design Step 0)

| Capa | Condición | Mecanismo |
|------|-----------|-----------|
| 1 — MCP | Tools stitch disponibles | Flujo MCP actual (create_project, generate_screen_from_text, poll get_screen, edit_screens/generate_variants) |
| 2 — CLI | `STITCH_API_KEY` + `npx` | Mismas tools vía `npx -y @_davideast/stitch-mcp tool <name>` por Bash; sintaxis exacta la fija un **spike bloqueante** (riesgo #1: si el CLI no cubre generación, capa 2 queda solo para descarga y el diseño sin MCP cae a capa 3) |
| 3 — Offline | Ninguna | `ui-ux-pro-max` → tokens; `impeccable` → mockup HTML; Playwright → PNG (o `n/a` explícito) |

La descarga de artefactos usa una copia propia de `fetch-stitch.sh` (patrón de `react-components`, maneja redirects de GCS y el sufijo `=w{width}` para PNG a resolución completa).

### Componentes (archivos del registry)

| Componente | Acción | Claves |
|------------|--------|--------|
| `skills/ui-ux-pro-max/` | Crear (copia física) | Resolución portable de ruta (loop sobre `~/.claude/skills`, `.claude/skills`, `.agents/skills`), `python3`, sin `${CLAUDE_PLUGIN_ROOT}` ni README fantasma |
| `skills/ui-design/SKILL.md` + `scripts/fetch-stitch.sh` | Reescritura mayor (v2.0.0) | Step 0 capas; Step 2b consulta ui-ux-pro-max; Step 3e artefactos obligatorios; tabla con columna `Artifacts`; sección Offline; principio "Artifact-first" reemplaza "References only" |
| `skills/frontend-craft/SKILL.md` | Modificar (minor) | Ground truth `.stitch/designs/`; consulta a ui-ux-pro-max pre-escalación |
| `skills/design-fidelity/SKILL.md` | Crear | Inventario estructural + screenshot + comparación + fix loop; verdicts `CONVERGED / DIVERGENT / NOT_CERTIFIED` |
| `skills/post-implementation-qa/SKILL.md` | Modificar (minor) | Lente condicional design-fidelity + red flag "UI sin reporte de fidelidad" |
| `skills/writing-plans/SKILL.md` | Modificar (minor) | Campos `**Skills:**` / `**Design artifacts:**` por tarea |
| `skills/subagent-driven-development/` | Modificar | Bloques `## Required Skills` / `## Design Artifacts` en implementer-prompt.md; instrucción al controller en SKILL.md |
| `skills/using-awm/SKILL.md` | Modificar | `<SUBAGENT-STOP>` → `<SUBAGENT-POLICY>` |
| `skills/development-process/SKILL.md` | Modificar (minor) | Gate de instalación del bundle frontend; output de fase 1.5 actualizado |
| `skills/code-to-design/` | Eliminar | Rota desde origen; historia queda en git |
| `bundles/frontend/bundle.json`, `bundles/dev/bundle.json`, `catalog.json` | Modificar | frontend v2.0.0, dev minor bump |

### Manejo de errores

Todas las degradaciones son explícitas y anunciadas: fallo CLI → capa 3; `.gitignore` bloquea `.stitch/` → resolver con el usuario; sin Playwright → `png: n/a` / `NOT_CERTIFIED`; Skill tool ausente en subagente → concern reportado, decide el controller. Ninguna ruta permite "verde silencioso" sin evidencia.

### Testing y verificación E2E

En `/Users/cencosud/Developments/personal/test-awm`, antes del tag:
1. **Escenario capa 1 (MCP):** feature con 1 pantalla → artefactos commiteados → plan con campos nuevos → prompt del subagente con bloques nuevos → QA → `CONVERGED`.
2. **Escenario capa 2 (crítico):** sesión sin MCP, con `STITCH_API_KEY` → mismo contrato de artefactos vía CLI.
3. **Escenario capa 3:** sin MCP ni key → tokens + mockups + PNG.
4. **Prueba negativa:** implementar omitiendo el header del diseño → `design-fidelity` reporta `missing` y fuerza el fix loop.

Además: tests propios de ui-ux-pro-max en verde desde el registry (`validate_data.py`, `tests/test_core.py`) + humo de `--design-system`.

### Release

Rama `feature/frontend-redesign` → commits por fase → PR → merge a main → tag `v1.4.0` (serie de tags del registry) → `awm update` en las máquinas → `awm init` en cada proyecto frontend (bundle project-scope, decidido: se mantiene con gate de instalación en vez de promover a baseline).

## Fuera de alcance

- Reconstruir el flujo código→Stitch (`code-to-design` y sus 3 skills faltantes).
- Adaptar `react-components` al consumo de artefactos commiteados (hoy usa MCP directo; trabajo futuro).
- Cambios en el CLI de AWM (`agentic-workflow`), incluido cualquier mecanismo de inyección de contexto a subagentes vía hooks.
- Reglas específicas de proyecto (van vía `harness-retro` en cada proyecto, no en el framework).
