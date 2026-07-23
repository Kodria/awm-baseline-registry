# Environment Ports

## Qué es un environment port

El usuario trabaja también en entornos **sin filesystem ni AWM instalado** — claude.ai web,
Cowork móvil/web — donde las skills de este registry no se pueden instalar vía symlinks
(`awm init` / `awm update`). Un **environment port** es la solución puente: una copia
adaptada, lista para pegar como custom skill personal, de una skill canónica del registry.

Un port:

- Es un **artefacto derivado**, nunca la fuente de verdad. La skill canónica en
  `skills/<nombre>/SKILL.md` manda; el port en `docs/ports/` la sigue.
- Vive en este repo (`docs/ports/`), auditable vía git, aunque su destino de uso sea
  externo (pegado manualmente en la UI de claude.ai).
- Preserva la metodología de la canónica completa; solo cae lo específico de AWM que no
  aplica sin filesystem (p. ej. el campo `version` del frontmatter, o cross-cutting rules
  que nombran invokers del registry).

## Ports vigentes

| Port (claude.ai) | Skill canónica (registry) | Contenido listo |
|---|---|---|
| brief-spec | `skills/product-brief/` | [`docs/ports/brief-spec.claude-ai.md`](ports/brief-spec.claude-ai.md) |
| mermaid-diagrams | `skills/mermaid-diagrams/` | [`docs/ports/mermaid-diagrams.claude-ai.md`](ports/mermaid-diagrams.claude-ai.md) |

## Pacto de sincronización

No existe API para subir o actualizar skills en claude.ai. La sincronización es
**manual y responsabilidad del dueño del port**:

1. Al editar la skill canónica en `skills/<nombre>/`, actualizar el port correspondiente
   en `docs/ports/` **en el mismo PR** (no en un follow-up).
2. Re-subir (copiar/pegar) el contenido actualizado del port a claude.ai manualmente.
3. La latencia entre "port actualizado en el repo" y "port re-pegado en claude.ai" es
   esperada — no se automatiza. No hay gate que lo fuerce; el pacto es de disciplina.

## Dirección futura

Pegar contenido a mano no escala más allá de 1-2 skills personales. La dirección
prevista es un **bundle exportable**: un comando de CLI que empaquete un bundle del
registry en un formato subible a claude.ai (zip o carpeta), eliminando el paso manual
de copiar y pegar. Ver issue de seguimiento:
[Kodria/agentic-workflow#9](https://github.com/Kodria/agentic-workflow/issues/9).

## Trabajo relacionado diferido

Dos partes del issue original de esta capa (`awm-baseline-registry#6`) quedaron
explícitamente diferidas y trazadas en issues propios en vez de implementarse acá:

- Capa de presentación HTML (Parte 4) — [`awm-baseline-registry#12`](https://github.com/Kodria/awm-baseline-registry/issues/12), con criterio de activación explícito.
- Soporte Hermes como agente target (Parte 5) — [`agentic-workflow#10`](https://github.com/Kodria/agentic-workflow/issues/10).
