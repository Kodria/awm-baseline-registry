# Harness Retros

## 2026-07-07 — Modo desatendido + contratos de salida (13 tareas, panel QA de 4 lentes)

- **Class:** process (×2), agent (×1)
- **Occurrences (ledger count):** 82 entradas totales (26 findings, 56 wins) sobre 12 tareas SDD + 1 panel QA de 4 lentes. 11 clusters recurrentes (≥2), la mayoría el mismo hallazgo confirmado por dos revisores independientes, no repeticiones distintas.
- **Reglas:**
  - `CONSTITUTION.md:9` — spec-reviewer debe comparar texto verbatim carácter por carácter, no solo presencia aproximada.
  - `AGENTS.md:7` — reforzar chequeo proactivo de contradicciones con Anti-patterns/Red Flags existentes al agregar contenido nuevo.
  - `skills/writing-plans/SKILL.md` (Self-Review, sección Traceability matrix) — la verificación citada debe probar la afirmación específica del requirement, no un marcador genérico compartido.
- **Sensor:** ninguno (reglas de proceso/documentación, no sensor-catchable — no aplica sensor pack en este repo de contenido markdown).

**Corregidos durante la sesión (no requieren regla nueva, ya resueltos en el commit correspondiente):**
- Wording no ajustado al nuevo modo (Task 2: "Once approved"; Task 3: numeración de TERMINATION_PHASE) — fix inmediato tras code-quality-review.
- Contradicción con Anti-patterns preexistentes en `harness-retro/SKILL.md` (Task 5) — fix inmediato.
- Oración "Never compress an escalation" truncada silenciosamente en `implementer-prompt.md` (Task 7) — el spec-reviewer dio "compliant" sin detectarla; solo la atrapó el code-quality-reviewer. Curado como regla de proceso (ver arriba).
- Gap de ruteo: `development-process` podía rutear la fase Executing en modo desatendido hacia `executing-plans`, que no es mode-aware — hallado por el panel QA (3 lentes coincidieron), corregido.
- Blockquote canónico del mandato incompleto (mencionaba 3 de 5 skills lectores) — hallado por QA, corregido.

**Descartados sin regla (menores, ya razonados durante las revisiones de implementación):** ~19 entradas — wording heredado literalmente del plan aprobado, diferencias de formato deliberadas entre los 4 prompt templates, un edge case preexistente en un schema JSON no tocado esta sesión, y varias imprecisiones en los propios scripts de verificación del plan (grep de un marcador genérico en vez de la frase específica — el contenido real ya fue confirmado correcto por lectura directa de otro lente del panel QA).

**Descartes (modo desatendido):** ninguno — sesión corrió en modo interactivo, todos los ítems se presentaron y decidieron con el usuario.
