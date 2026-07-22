# Retire Stitch design artifacts on branch finish — Design

Resuelve [awm-baseline-registry#8](https://github.com/Kodria/awm-baseline-registry/issues/8).

## Requirements

- R1: WHEN `finishing-a-development-branch` ejecuta un camino de integración (Opción 1 merge local u Opción 2 push+PR) AND la rama contiene artefactos `.stitch/designs/` de pantallas marcadas `completed` en la tabla `## UI Screens` de un design doc, THE skill SHALL retirar esos artefactos en un commit de limpieza (`git rm .stitch/designs/<slug>.{html,png}`) ANTES del merge/push.
- R2: THE skill SHALL retirar artefactos SOLO de pantallas cuya fila `## UI Screens` tenga `Status: completed`; las pantallas `pending`/en progreso conservan sus artefactos.
- R3: WHEN retira los artefactos de una pantalla, THE skill SHALL reescribir la celda `Artifacts` de esa fila en el design doc a `retired post-merge · <stitch-project-ref>` en el mismo commit de limpieza, para que la tabla no quede apuntando a archivos borrados.
- R4: THE skill SHALL NO retirar artefactos en la Opción 3 (keep as-is) ni en la Opción 4 (discard).
- R5: WHERE el modo es `desatendido`, THE skill SHALL ejecutar el retiro automáticamente como parte del path de auto-PR (Opción 2), sin prompt.
- R6: THE retiro SHALL limitarse a `.stitch/designs/*.{html,png}`; los tokens `design-system/<slug>/` y la evidencia `.stitch/verification/` NO se tocan.
- R7: IF no hay artefactos `.stitch/designs/` en la rama OR ninguna pantalla `completed`, THEN THE skill SHALL saltar el retiro en silencio (sin prompt ni ruido nuevo).

## Contexto y decisión clave

`finishing-a-development-branch` **no necesita releer el veredicto de design-fidelity** (que vive en un reporte markdown de la QA o como findings efímeros del ledger, ya archivado por `harness-retro` para cuando `finishing` corre). Razón: en el flujo de `development-process`, `finishing` solo se alcanza con los markers `awm-qa-complete` y `awm-retro-complete` presentes — es decir, la QA (incluido el lens design-fidelity y su completion gate) **ya pasó**. Por eso el gate del retiro es simplemente `Status: completed` en la tabla (señal que `ui-design` ya setea), no una re-derivación del veredicto. Esto elimina la parte frágil del issue original.

Fuente de verdad tras el retiro: el proyecto Stitch en la nube (`> Stitch Project: projects/<id>` que `ui-design` escribe como header de la sección `## UI Screens`). El `<stitch-project-ref>` de R3 sale de ahí.

## Approach

Editar un solo archivo: `skills/finishing-a-development-branch/SKILL.md`.

1. **Nuevo Step 4.0 "Retire design artifacts (integration paths only)"** — insertado dentro del Step 4, ejecutado por las Opciones 1 y 2 antes de su merge/push. Detecta artefactos + pantallas `completed`, ofrece (interactivo) / auto-ejecuta (desatendido) el `git rm` + reescritura de celda + commit de limpieza. Skip silencioso si no aplica (R7).
2. **Modo desatendido**: extender la sección existente para mencionar que el path de auto-PR incluye el retiro automático (R5).
3. **Secciones normativas** (lección de `AGENTS.md`): revisar y actualizar `Quick Reference`, `Common Mistakes`, `Red Flags` para que ninguna contradiga el paso nuevo. En particular, el paso nuevo agrega un commit y toca el working tree en el path de integración — verificar que no choque con "Never: Force-push without explicit request" (no hay force-push) ni con la disciplina de Opción 3/4 (no aplica ahí).
4. **Bump** de `version` en el frontmatter: `1.1.0 → 1.2.0` (feature aditiva, retrocompatible).

## Out of scope

- Migrar/retirar artefactos de ramas viejas ya committeadas.
- Retirar tokens `design-system/` o evidencia `.stitch/verification/` (R6).
- Bump del bundle `dev` en `catalog.json` y el tag de release `vX.Y.Z`: es una decisión de release que se confirma con el humano tras mergear el cambio de la skill (flujo AWM: editar → commit → tag → `awm update`).

## Testing

Repo de contenido sin `.awm/sensors.json` → no hay gate de sensores. Verificación = coherencia del markdown:
- La skill sigue teniendo exactamente los 4 options del menú interactivo (el retiro es un sub-paso de ejecución, no una 5ta opción).
- Ninguna línea de `Common Mistakes`/`Red Flags`/`Quick Reference` contradice el paso nuevo.
- El paso nuevo declara explícitamente su condición de skip (R7) y su exclusión de Opciones 3/4 (R4).
