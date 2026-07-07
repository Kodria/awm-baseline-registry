# AWM Baseline Registry — Constitution

Reglas de proceso para el desarrollo del contenido de este registry (skills, bundles, prompt templates). Todo agente que trabaje en este repo debe leerlas y aplicarlas.

---

## Revisión de código

- **Cuando una tarea especifica contenido verbatim (texto exacto a copiar desde un plan/spec) en un archivo, el spec-reviewer DEBE comparar el resultado carácter por carácter contra el texto exacto requerido — no basta con confirmar que aparecen palabras clave, que el conteo de líneas coincide, o una lectura general de "se ve bien".** Un subagente implementador truncó silenciosamente la última oración de un párrafo largo al copiarlo desde el plan (`implementer-prompt.md`, la oración "Never compress an escalation — the controller needs the full picture to decide."), y el primer spec-reviewer reportó "compliant" sin detectarlo — solo lo atrapó una revisión de calidad de código independiente, en un ángulo de revisión distinto. Un review que solo verifica presencia aproximada de contenido no cumple su propósito de gate cuando la tarea es "copiar este texto exacto". **Cómo aplicar:** al revisar una tarea de tipo "reemplazar/insertar EXACTAMENTE este bloque", el spec-reviewer debe leer cada oración del bloque requerido contra el archivo real, prestando atención especial a la ÚLTIMA oración de cada párrafo (el punto más fácil de truncar silenciosamente al copiar un bloque largo).
