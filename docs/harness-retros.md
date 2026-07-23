# Harness Retros

## 2026-07-23 — Flow-cleanup de skills de arquitectura/advisory (8 tareas, panel QA de 4 lentes)

- **Class:** structural (×1, nueva infraestructura de CI), process (×1)
- **Occurrences (ledger count):** ledger de la rama con entradas de revisiones de calidad de Tasks 2/3/4/6/7 y del panel post-implementation-qa (Track A fidelidad + Track B robustness/logic/tests). Dos patrones recurrentes identificados por lectura manual (signatures distintas por revisor, no agrupadas automáticamente por `awm ledger recurring`):
  - **Version bump olvidado en la misma tanda que la edición de contenido:** ≥5 ocurrencias en una sola sesión — 4 skills en la revisión de calidad de Task 7 (`architecture-extraction`, `architecture-advisor`, `technology-evaluator`, `nfr-checklist-generator`), y de nuevo `using-awm` en el panel de post-implementation-qa (confirmado independientemente por 4 lentes distintos: fidelity, robustness, logic, tests). Ocurrió pese a que la regla ya estaba escrita en `CONSTITUTION.md` — la primera vez que este repo demuestra que la prosa sola no basta.
  - **Invoker-list accuracy:** un `SKILL.md` afirma que otra skill lo invoca sin que eso sea cierto. Dos ocurrencias en la misma sesión: `technology-evaluator` citaba `architecture-assessment` (solo `architecture-advisor` lo invoca de verdad, Task 2); `mermaid-diagrams` listaba `brainstorming` como invocador cuando `brainstorming` nunca lo menciona (post-implementation-qa).
  - Adicional (no recurrente, blocker): el design doc y el plan quedaron desactualizados tras una corrección de bump (1.7.0→2.0.0 decidida en la revisión de calidad de Task 7) — el propio comando de verificación del plan quedó falso. Corregido junto con el resto del panel de QA.
- **Reglas:**
  - `scripts/check-skill-version-bumps.sh` + `.github/workflows/skill-version-check.yml` — **primer sensor real de este repo de contenido:** falla el PR si un `skills/*/SKILL.md` cambió de contenido sin bumpear su frontmatter `version`. Verificado: se manufacturó la falla exacta (revertir el bump de `using-awm` manteniendo su cambio de contenido), el script la atrapó, se revirtió y corrió limpio.
  - `CONSTITUTION.md` ("Revisión de código") — nueva entrada: una afirmación de invoker-list sobre otra skill debe verificarse leyendo el archivo real de esa skill, no aceptarse tal como está escrita (fusionada junto a la lección existente de artefactos compartidos mutables — misma familia de error, forma distinta: acá la lista nunca fue verificada al escribirla, no es que el otro archivo cambiara después).
  - `AGENTS.md` ("What works here") — bullet existente de bump-de-bundle extendido (no bullet nuevo) para señalar el nuevo backstop de CI.
- **Sensor:** `skill-version-check.yml` (GitHub Actions, dispara en PRs que tocan `skills/**/SKILL.md`). Actualiza la nota del retro anterior ("ninguno — repo sin infraestructura de lint aplicable"): este patrón SÍ era mecánicamente detectable (diff cambió el archivo, frontmatter no) pese a ser un repo markdown/JSON puro — no todo lo de este repo requiere disciplina de lectura, algunos patrones sí caben en un chequeo de git diff + grep.

**Descartes (modo desatendido):** dos hallazgos del panel de QA fueron investigados y confirmados NO accionables — (1) la mención de `docs-system-orchestrator` en `using-awm` ya estaba explícitamente adjudicada como legítima/fuera-de-alcance por la nota propia del Task 8 Step 1 del plan (entry point del registry de documentación opt-in, no una referencia muerta); (2) los links relativos `references/*.md` en `docs/ports/mermaid-diagrams.claude-ai.md` son intencionales según el propio header del archivo — resuelven contra la carpeta de skill personal existente del usuario en claude.ai, no contra este repo.

## 2026-07-22 — Capa de producto: contrato compartido entre 6 skills nuevas + 3 editadas (12 tareas, revisión de sistema completo, panel QA de 4 lentes)

- **Class:** process (×1), agent/win (×1)
- **Occurrences (ledger count):** 159 entradas (48 findings, 111 wins) sobre 12 tareas SDD + 1 revisión de sistema completo + 1 panel QA de 4 lentes. Patrón dominante: contenido que hereda/referencia un artefacto compartido y mutable (`brief-contract.md`, principalmente) sin re-verificarlo contra su estado ACTUAL — detectado en 8/10 tareas SDD, la revisión de sistema completo (5 hallazgos), y el lente Tests de QA (7 hallazgos sobre metodología de verificación débil). `awm ledger recurring --min 2` no agrupa este patrón como un solo cluster porque cada incidencia usó una signature distinta (conteos, criterios de gate huérfanos, afirmaciones de alcance) — la recurrencia es conceptual, confirmada por lectura manual del ledger completo, no por la herramienta mecánica.
- **Reglas:**
  - `CONSTITUTION.md` ("Revisión de código") — nueva entrada fusionada con la lección existente de verbatim-copy: releer artefactos compartidos mutables en su estado actual antes de afirmar algo sobre ellos, barrer el repo tras cualquier fix de contrato compartido, y tratar la revisión final de sistema completo como no-opcional.
  - `AGENTS.md` ("What works here") — nueva entrada: correr una revisión de sistema completo (journeys end-to-end) tras completar todas las tareas por-tarea de un plan multi-fase, no confiar en que la suma de revisiones individuales sea equivalente.
- **Sensor:** ninguno — repo de contenido markdown/JSON puro, sin `.awm/sensors.json` ni infraestructura de lint/semgrep/tests aplicable. La regla es de disciplina de lectura, no sensor-catchable; el paso "verificar que la regla dispara" del checklist no aplica en este tipo de repo (documentado aquí en vez de fabricar un chequeo).

**Corregidos durante la sesión (no requieren regla nueva propia, ya resueltos en su commit correspondiente):** conteo de skills desactualizado en la auditoría (Task 1), criterios G2/G5 sin sección de origen + español residual (Task 2), orden de sección desactualizado + IDs huérfanos P#/U#/C# (Task 3), contradicción Step1/Step3 sobre handoff de `mode: discovery` + regla de writer del contrato ambigua (Task 7/QA), scoping de checklist + marcador de lista inválido (Task 8), contradicción "default entry point" auto-detectada y corregida (Task 10), convención de CHANGELOG (Task 11), terminología de "estado terminal" (Task 12), y en la revisión de sistema completo: criterio G4 sin sección de origen (mismo bug que G2/G5, no detectado antes), lista de consumidores del contrato desactualizada, `product-brief` sin mecanismo para ingerir contexto verificado de extraction/assessment (fallaba el Journey B), validación de output de Graphify + consentimiento de auto-instalación, lista de skip de SUBAGENT-POLICY sin los 5 skills nuevos, y colisión de trigger entre `architecture-assessment` y `architecture-advisor`.

**Descartados sin regla (menores, ya razonados durante las revisiones):** duplicados de entrada en el ledger con `desc: "test"` (ruido de auto-verificación de un subagente al confirmar la sintaxis de `awm ledger add` antes de emitir el hallazgo real — cosmético, no una segunda ocurrencia genuina); 6 de los 7 hallazgos del lente Tests de QA sobre debilidad metodológica de checks históricos ya ejecutados en el plan (existencia vs corrección) — verificados independientemente contra el contenido real y confirmados SIN defecto oculto detrás del check débil; `.gitignore` sin requirement asociado (higiene de infra legítima, justificada por su propio mensaje de commit).

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
