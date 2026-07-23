# Skills exportables a claude.ai — Design Doc

**Fecha:** 2026-07-23 · **Relacionado:** [agentic-workflow#9](https://github.com/Kodria/agentic-workflow/issues/9) (comando `awm export`, ya mergeado en agentic-workflow#11) · **Estado:** aprobado en brainstorming

Marca `portable: true` en las skills que funcionan standalone en claude.ai (sin filesystem/AWM), para que `awm export --target claude-ai` produzca artefactos subibles y funcionales. Reemplaza el patrón manual de "environment ports" (`docs/ports/`) por el flujo automatizado del comando.

**Decisiones del dueño (brainstorming):** solo se marcan las skills que funcionan solas: `product-discovery`, `product-brief` (bundle `product`) y `mermaid-diagrams` (bundle `dev`). Las skills que dependen de filesystem/git/orquestación (`product-process`, `architecture-extraction`, `architecture-assessment`, `readiness-gate`) NO se marcan portables — no funcionarían standalone.

**Hallazgo de verificación (durante brainstorming):** el transform mecánico alcanza para `product-discovery` y `mermaid-diagrams`, pero NO para `product-brief`. `product-brief/SKILL.md` defiere las reglas normativas del contrato a `skills/readiness-gate/references/brief-contract.md` (líneas 15, 69, 102) — un archivo que vive en la carpeta de otra skill y que el export NO empaqueta (solo empaqueta la carpeta de la skill exportada + sus propias `references/`). Exportado mecánicamente, el port apuntaría a un archivo inexistente en claude.ai → briefs incompletos. Por eso `product-brief` necesita un override self-contained `skills/product-brief/port.claude-ai.md` (con el contrato inline), a diferencia de las otras dos. El port manual existente `docs/ports/brief-spec.claude-ai.md` ya es exactamente ese contenido self-contained — se adapta como base del override. `product-discovery` es mecánica sin problema: su dependencia principal (`product-brief`) se exporta al lado (ambas cargadas en claude.ai → la referencia resuelve), y su única referencia al contrato (rama "usuario para antes") ya trae el frontmatter inline en el propio body. `mermaid-diagrams` es mecánica: sus `references/*.md` viajan con ella.

## Requirements

### F1 — Marcado de portabilidad

- **R1** — THE skills `product-discovery`, `product-brief` y `mermaid-diagrams` SHALL declarar `portable: true` en su frontmatter.
- **R1.1** — THE description de cada una de esas 3 skills SHALL permanecer single-line y bien formada (el transform mecánico de `awm export` lanza error ante block scalars o comillas mal cerradas — verificable: cada `description:` es una sola línea con comillas balanceadas o sin comillas).
- **R1.2** — THE skills que dependen de filesystem/git/orquestación (`product-process`, `architecture-extraction`, `architecture-assessment`, `readiness-gate`) SHALL permanecer sin `portable: true` (no se exportan).
- **R1.3** — THE skill `product-brief` SHALL tener un override `skills/product-brief/port.claude-ai.md` self-contained: sin referencias a archivos fuera de la propia carpeta de la skill (verificable: `grep -n "skills/readiness-gate\|skills/product-brief/references\|invoke .readiness-gate" skills/product-brief/port.claude-ai.md` = 0; el contrato del brief y las 12 secciones van inline). El override lleva su propio frontmatter válido (`name` + `description`, sin `version`), usado verbatim por `awm export`.
- **R1.4** — THE skills `product-discovery` y `mermaid-diagrams` SHALL exportarse por transform mecánico (sin override), porque son self-contained standalone: `product-discovery` con `product-brief` cargado al lado + su frontmatter de contrato inline; `mermaid-diagrams` con sus `references/*.md` que viajan en el export.

### F2 — Versionado (convención CONSTITUTION.md)

- **R2** — THE versión de frontmatter de `product-discovery`, `product-brief` y `mermaid-diagrams` SHALL bumpear 1.0.0 → 1.1.0 (feature aditiva: la skill se vuelve exportable) en la misma tanda que la edición.
- **R2.1** — THE bundle `product` SHALL bumpear 1.1.0 → 1.2.0 y THE bundle `dev` SHALL bumpear 2.0.0 → 2.1.0, en `catalog.json` Y `bundles/<x>/bundle.json` (coincidentes).

### F3 — Retiro de ports manuales

- **R3** — THE directorio `docs/ports/` (con `brief-spec.claude-ai.md` y `mermaid-diagrams.claude-ai.md`) SHALL eliminarse del repo (git history lo preserva).
- **R3.1** — THE `docs/environment-ports.md` SHALL reescribirse para documentar el flujo `awm export` como el mecanismo vigente (reemplaza el pegado manual desde `docs/ports/`), conservando la explicación de qué es un environment port y el pacto de que subir a claude.ai sigue siendo manual (no hay API).
- **R3.2** — IF algún archivo del repo referencia `docs/ports/` (enlaces markdown, menciones en skills), THEN esas referencias SHALL actualizarse o eliminarse (verificable: `grep -rn "docs/ports" .` = 0 fuera de git history y de este design doc).

### F4 — CHANGELOG

- **R4** — THE `CHANGELOG.md` SHALL registrar una entrada nueva (newest-on-top) para `dev 2.1.0 / product 1.2.0` describiendo el marcado de portabilidad y el retiro de `docs/ports/`.

## Diseño

### F1/F2 — Cambios de contenido

Frontmatter de las 3 skills: agregar `portable: true` y bumpear `version` 1.0.0→1.1.0. El cuerpo de `product-discovery` y `mermaid-diagrams` NO se toca (self-contained por transform mecánico, R1.4). `product-brief` recibe además el override `skills/product-brief/port.claude-ai.md` (R1.3), adaptado del contenido self-contained de `docs/ports/brief-spec.claude-ai.md`: se ajusta su header-comment a la nueva ubicación/patrón y su `name:` puede quedar `product-brief` o `brief-spec` indistintamente (el dueño no preserva nombre). El SKILL.md canónico de `product-brief` NO cambia su cuerpo — sigue defiriendo al contrato para el entorno AWM (Claude Code); solo el port es self-contained. Bumps de bundle (`product` 1.1.0→1.2.0, `dev` 2.0.0→2.1.0) en `catalog.json` Y `bundles/<x>/bundle.json`.

### F3 — Retiro de `docs/ports/`

`git rm -r docs/ports/`. `docs/environment-ports.md` se reescribe: la sección "Ports vigentes" (tabla que apunta a `docs/ports/`) se reemplaza por "Cómo exportar" (instrucciones de `awm export product-discovery|product-brief|mermaid-diagrams --target claude-ai` → subir el zip a claude.ai). El pacto de sincronización manual se reformula: ya no es "editar el port en el mismo PR", ahora es "re-exportar y re-subir tras cambiar la skill canónica". La dirección futura (bundle exportable) ya no es futura — se marca como implementada (agentic-workflow#9/#11).

### Verificación E2E (sin tocar `~/.awm`)

El comando `awm export` lee del registry instalado (`~/.awm/registries/`), que es territorio del instalador y refleja el tag publicado, no este working copy — por eso no se puede correr `awm export` directo contra la rama. Verificación alternativa: el motor de export ya está buildeado en `/home/user/agentic-workflow/cli/dist/` (mergeado en agentic-workflow#11); un script throwaway que importe `runExport` y le inyecte `roots: ['<working copy>']` produce el artefacto real contra este contenido sin tocar `~/.awm`. Confirma que las 3 skills exportan, el transform no lanza, y el frontmatter resultante es válido. (Alternativa mínima si el script no es viable: verificación estructural — `portable: true` presente, description single-line, frontmatter parseable.)

## Fuera de alcance

- Marcar portables las skills filesystem/orquestación-dependientes (no funcionan standalone).
- Overrides para `product-discovery`/`mermaid-diagrams` (mecánico alcanza; solo `product-brief` necesita override por su dependencia externa real, R1.3).
- Subir efectivamente los artefactos a claude.ai (acción manual del dueño, sin API).

## Referencias

- Comando consumidor: [agentic-workflow#9](https://github.com/Kodria/agentic-workflow/issues/9) / PR #11 (mergeado).
- Contrato del brief (lo respeta `product-brief`): `skills/readiness-gate/references/brief-contract.md`.
- Estado previo del patrón manual: `docs/environment-ports.md` (se reescribe en R3.1).
