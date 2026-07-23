# Environment Ports

## Qué es un environment port

El usuario trabaja también en entornos **sin filesystem ni AWM instalado** — claude.ai web,
Cowork móvil/web — donde las skills de este registry no se pueden instalar vía symlinks
(`awm init` / `awm update`). Un **environment port** es la solución puente: una copia
adaptada, lista para pegar como custom skill personal, de una skill canónica del registry.

Un port:

- Es un **artefacto derivado**, nunca la fuente de verdad. La skill canónica en
  `skills/<nombre>/SKILL.md` manda; el port la sigue.
- Se genera con `awm export` (transform mecánico) o vive como override
  `skills/<name>/port.claude-ai.md` junto a la skill canónica, auditable vía git.
- Preserva la metodología de la canónica completa; solo cae lo específico de AWM que no
  aplica sin filesystem (p. ej. el campo `version` del frontmatter, o cross-cutting rules
  que nombran invokers del registry).

## Cómo exportar (flujo vigente)

Las skills que funcionan standalone en claude.ai se marcan `portable: true` en su
frontmatter. El comando `awm export --target claude-ai <skill>` (ver
[agentic-workflow#9](https://github.com/Kodria/agentic-workflow/issues/9), implementado
en agentic-workflow#11) genera el artefacto subible — una carpeta con `SKILL.md` +
`references/` más un `.zip` cuando hay binario `zip`:

| Skill (registry) | Comando de export | Adaptación |
|---|---|---|
| `product-discovery` | `awm export --target claude-ai product-discovery` | Transform mecánico |
| `product-brief` | `awm export --target claude-ai product-brief` | Override self-contained (`skills/product-brief/port.claude-ai.md`) |
| `mermaid-diagrams` | `awm export --target claude-ai mermaid-diagrams` | Transform mecánico |

El **transform mecánico** quita los campos internos de AWM del frontmatter (`version`,
`portable`) y agrega una línea de deferencia a la `description`. Cuando una skill defiere
contenido a un archivo de otra skill (que no viaja en el export), lleva un **override**
`skills/<name>/port.claude-ai.md` self-contained que `awm export` usa verbatim.

## Pacto de sincronización

No existe API para subir o actualizar skills en claude.ai; el paso de subir sigue siendo
manual. Lo que cambió: ya no se mantiene una copia pegada a mano en `docs/ports/`. El flujo
vigente es:

1. Al editar la skill canónica en `skills/<nombre>/` (y su override si lo tiene), bumpear
   la versión según la convención de `CONSTITUTION.md`.
2. Re-exportar con `awm export --target claude-ai <skill>` y re-subir el artefacto a
   claude.ai manualmente.
3. La latencia entre "skill actualizada en el repo" y "artefacto re-subido en claude.ai" es
   esperada — no se automatiza el upload. El comando elimina el paso de copiar/pegar y
   adaptar a mano, no el de subir.

## Dirección futura

El **bundle exportable** que esta capa preveía ya está **implementado**: el comando
`awm export --target claude-ai <skill>` empaqueta la skill del registry en un formato
subible a claude.ai (carpeta + `.zip`), eliminando el paso manual de copiar y pegar. Ver
[Kodria/agentic-workflow#9](https://github.com/Kodria/agentic-workflow/issues/9)
(implementado en agentic-workflow#11 — merged).

## Trabajo relacionado diferido

Dos partes del issue original de esta capa (`awm-baseline-registry#6`) quedaron
explícitamente diferidas y trazadas en issues propios en vez de implementarse acá:

- Capa de presentación HTML (Parte 4) — [`awm-baseline-registry#12`](https://github.com/Kodria/awm-baseline-registry/issues/12), con criterio de activación explícito.
- Soporte Hermes como agente target (Parte 5) — [`agentic-workflow#10`](https://github.com/Kodria/agentic-workflow/issues/10).
