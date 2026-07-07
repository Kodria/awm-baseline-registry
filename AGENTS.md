# AWM Baseline Registry — Agent Notes

Lecciones de estilo de trabajo y patrones que funcionan bien, agnósticas de qué modelo/agente esté operando en este repo.

## What works here

- **Al agregar contenido nuevo a un archivo que ya tiene secciones de reglas (Anti-patterns, Red Flags, Common Mistakes), revisar proactivamente si el contenido nuevo contradice alguna regla existente — antes de reportar DONE, no después de que un reviewer lo encuentre.** Confirmado: en una tarea que añadía un carve-out de modo a `finishing-a-development-branch/SKILL.md`, el implementer leyó las secciones "Common Mistakes"/"Red Flags" existentes por su cuenta, encontró que dos líneas ("Fix: Present exactly 4 structured options", "Always: Present exactly 4 options") quedarían contradichas por el cambio, y las corrigió en el mismo commit — evitando el ciclo extra de fix-and-rereview que sí ocurrió en tareas hermanas (`harness-retro/SKILL.md`, `subagent-driven-development/SKILL.md`) donde la misma clase de contradicción solo se detectó en la revisión de calidad de código, ya con el commit hecho. **Cuándo aplica:** cualquier edición que agregue una excepción/carve-out a un archivo con secciones normativas propias (reglas, anti-patrones, invariantes) — leer esas secciones enteras antes de reportar terminado.
