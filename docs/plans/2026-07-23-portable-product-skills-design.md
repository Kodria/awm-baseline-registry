# Skills exportables a claude.ai — Design Doc

**Fecha:** 2026-07-23 · **Relacionado:** [agentic-workflow#9](https://github.com/Kodria/agentic-workflow/issues/9) (comando `awm export`, ya mergeado en agentic-workflow#11) · **Estado:** aprobado en brainstorming

Marca `portable: true` en las skills que funcionan standalone en claude.ai (sin filesystem/AWM), para que `awm export --target claude-ai` produzca artefactos subibles y funcionales. Reemplaza el patrón manual de "environment ports" (`docs/ports/`) por el flujo automatizado del comando.

**Decisiones del dueño (brainstorming):** solo se marcan las skills que funcionan solas: `product-discovery`, `product-brief` (bundle `product`) y `mermaid-diagrams` (bundle `dev`). NO se preservan los nombres/contenidos de los ports personales existentes — el transform mecánico del comando (quita `version`/`portable`, agrega línea de deferencia) es suficiente; no se escriben overrides `port.claude-ai.md` a medida. `docs/ports/` se retira por completo (su contenido queda obsoleto: el comando lo regenera on-demand). Las skills que dependen de filesystem/git/orquestación (`product-process`, `architecture-extraction`, `architecture-assessment`, `readiness-gate`) NO se marcan portables — no funcionarían standalone.

## Requirements

### F1 — Marcado de portabilidad

- **R1** — THE skills `product-discovery`, `product-brief` y `mermaid-diagrams` SHALL declarar `portable: true` en su frontmatter.
- **R1.1** — THE description de cada una de esas 3 skills SHALL permanecer single-line y bien formada (el transform mecánico de `awm export` lanza error ante block scalars o comillas mal cerradas — verificable: cada `description:` es una sola línea con comillas balanceadas o sin comillas).
- **R1.2** — THE skills que dependen de filesystem/git/orquestación (`product-process`, `architecture-extraction`, `architecture-assessment`, `readiness-gate`) SHALL permanecer sin `portable: true` (no se exportan).

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

Edición trivial de frontmatter: agregar la línea `portable: true` y bumpear `version` en cada una de las 3 skills. El cuerpo de las skills NO se toca — las referencias cruzadas entre `product-discovery` y `product-brief` funcionan en claude.ai si se exportan juntas (ambas cargadas), y las referencias a `readiness-gate` o a paths `skills/<x>/SKILL.md` son ruido cosmético tolerable, no rompen carga ni función (decisión explícita del dueño: funcionalidad, no pulido). Bumps de bundle en los dos lugares que los duplican.

### F3 — Retiro de `docs/ports/`

`git rm -r docs/ports/`. `docs/environment-ports.md` se reescribe: la sección "Ports vigentes" (tabla que apunta a `docs/ports/`) se reemplaza por "Cómo exportar" (instrucciones de `awm export product-discovery|product-brief|mermaid-diagrams --target claude-ai` → subir el zip a claude.ai). El pacto de sincronización manual se reformula: ya no es "editar el port en el mismo PR", ahora es "re-exportar y re-subir tras cambiar la skill canónica". La dirección futura (bundle exportable) ya no es futura — se marca como implementada (agentic-workflow#9/#11).

### Verificación E2E (sin tocar `~/.awm`)

El comando `awm export` lee del registry instalado (`~/.awm/registries/`), que es territorio del instalador y refleja el tag publicado, no este working copy — por eso no se puede correr `awm export` directo contra la rama. Verificación alternativa: el motor de export ya está buildeado en `/home/user/agentic-workflow/cli/dist/` (mergeado en agentic-workflow#11); un script throwaway que importe `runExport` y le inyecte `roots: ['<working copy>']` produce el artefacto real contra este contenido sin tocar `~/.awm`. Confirma que las 3 skills exportan, el transform no lanza, y el frontmatter resultante es válido. (Alternativa mínima si el script no es viable: verificación estructural — `portable: true` presente, description single-line, frontmatter parseable.)

## Fuera de alcance

- Marcar portables las skills filesystem/orquestación-dependientes (no funcionan standalone).
- Escribir overrides `port.claude-ai.md` a medida (el transform mecánico alcanza; el pulido de referencias cruzadas se difiere si alguna vez se necesita).
- Subir efectivamente los artefactos a claude.ai (acción manual del dueño, sin API).

## Referencias

- Comando consumidor: [agentic-workflow#9](https://github.com/Kodria/agentic-workflow/issues/9) / PR #11 (mergeado).
- Contrato del brief (lo respeta `product-brief`): `skills/readiness-gate/references/brief-contract.md`.
- Estado previo del patrón manual: `docs/environment-ports.md` (se reescribe en R3.1).
