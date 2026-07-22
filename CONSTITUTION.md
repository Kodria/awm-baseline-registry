# AWM Baseline Registry — Constitution

Reglas de proceso para el desarrollo del contenido de este registry (skills, bundles, prompt templates). Todo agente que trabaje en este repo debe leerlas y aplicarlas.

---

## Release de contenido — bump de bundle + tag son obligatorios al cerrar contra `main`

Cambiar el contenido de un bundle (una skill, un prompt template, un sensor-pack) **no está terminado hasta que el bundle sube de versión y se corta un tag** `vX.Y.Z`. Las skills instaladas en las máquinas de los usuarios son symlinks hacia el registry **taggeado** (`~/.awm/registries/<name>/`), y `awm update` solo trae el último tag — un cambio mergeado a `main` sin bump de bundle + tag **no llega a ningún consumidor**: queda invisible pese a estar en `main`.

**Dos versiones independientes — no las confundas:**

- **El tag `vX.Y.Z` es la versión del REGISTRY** y es lo ÚNICO que el CLI consume para entregar: `awm update`/`awm pin` resuelven `pin declarado > último tag semver > HEAD` (ver `cli/src/core/versioning.ts`). El tag es un contador de release del registry entero, **independiente de las versiones de los bundles**.
- **Las `version` de bundle** (en `catalog.json` y `bundles/<x>/bundle.json`) son metadata por-bundle (las muestra `awm doctor`/`awm list`, sirven para `dependsOn`); **no participan en la entrega**. Prueba: en el tag `v1.4.0`, `dev`=1.4.0 pero `frontend`=2.0.0 — ejes distintos. El número del tag NO "sigue" la versión de ningún bundle (sería ambiguo con bundles divergentes).

**Cómo aplicar, al cerrar cualquier rama que modifique contenido de un bundle contra `main`:**

1. Identificá qué bundle(s) toca el cambio (mirá qué `bundles/<x>/bundle.json` lista las skills/artefactos modificados).
2. Bumpeá la `version` de ese bundle **en los dos lugares que la duplican y deben coincidir**: `catalog.json` Y `bundles/<x>/bundle.json` (semver: feature aditiva → minor; fix → patch; ruptura de contrato → major). El propio `SKILL.md` editado también lleva su `version` en el frontmatter — subilo en la misma tanda. Esto es metadata del bundle; NO determina el número del tag.
3. **El tag de release lo corta automáticamente `.github/workflows/auto-tag.yml`** al mergear a `main` (bumpea el último tag `vX.Y.Z` según conventional commits del merge). No hace falta cortarlo a mano. Fallback manual (si CI no está disponible o el push de tags está bloqueado en tu entorno): `git tag vX.Y.Z && git push origin vX.Y.Z` sobre el merge commit, eligiendo el próximo `vX.Y.Z` = último tag + bump correspondiente.
4. Recién con el tag publicado el cambio es entregable vía `awm update`.

Esto aplica a TODA rama que modifique contenido de un bundle — no es opcional ni "se hace después cuando me acuerde". Un PR de contenido sin el bump de `catalog.json` + `bundle.json` está incompleto (aunque el tag lo ponga la CI, el bump de metadata del bundle sigue siendo tu responsabilidad).

## Revisión de código

- **Cuando una tarea especifica contenido verbatim (texto exacto a copiar desde un plan/spec) en un archivo, el spec-reviewer DEBE comparar el resultado carácter por carácter contra el texto exacto requerido — no basta con confirmar que aparecen palabras clave, que el conteo de líneas coincide, o una lectura general de "se ve bien".** Un subagente implementador truncó silenciosamente la última oración de un párrafo largo al copiarlo desde el plan (`implementer-prompt.md`, la oración "Never compress an escalation — the controller needs the full picture to decide."), y el primer spec-reviewer reportó "compliant" sin detectarlo — solo lo atrapó una revisión de calidad de código independiente, en un ángulo de revisión distinto. Un review que solo verifica presencia aproximada de contenido no cumple su propósito de gate cuando la tarea es "copiar este texto exacto". **Cómo aplicar:** al revisar una tarea de tipo "reemplazar/insertar EXACTAMENTE este bloque", el spec-reviewer debe leer cada oración del bloque requerido contra el archivo real, prestando atención especial a la ÚLTIMA oración de cada párrafo (el punto más fácil de truncar silenciosamente al copiar un bloque largo).
