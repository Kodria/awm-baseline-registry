# Auto-tag registry releases on merge to main — Design

## Problema

Cerrar una rama de contenido contra `main` exige cortar un tag `vX.Y.Z` (ver `CONSTITUTION.md` → "Release de contenido"), porque `awm update` solo entrega el último tag. Hacerlo a mano es olvidable y, en entornos sandboxeados, a veces imposible (el push de `refs/tags/*` puede estar bloqueado por política del git server — 403). Automatizarlo en CI lo hace confiable y elude ese bloqueo: el `GITHUB_TOKEN` de GitHub Actions con `contents: write` sí puede pushear tags.

## Hallazgo clave: el tag es independiente de las versiones de los bundles

Verificado en el CLI (`cli/src/core/versioning.ts`, `registries.ts` del repo `agentic-workflow`):

- `awm update` resuelve el ref con `resolveTargetRef`: **pin declarado > último tag semver `vX.Y.Z` > HEAD**. Hace `git fetch --tags`, filtra `vX.Y.Z`, ordena semver, y checkoutea el último. **El tag ES la versión del registry** — es lo único que `awm update`/`awm pin` consumen.
- Las versiones de bundle en `catalog.json`/`bundle.json` **no participan en la entrega**: son metadata (`awm doctor`/`awm list`, `dependsOn`). No hay campo de "versión de registry" fuera del tag git.
- Prueba en los datos: en el tag `v1.4.0`, `dev`=1.4.0 pero `frontend`=2.0.0. Los ejes son independientes.

**Consecuencia:** el número del tag NO "sigue la versión de un bundle" (sería ambiguo con bundles divergentes). Es un contador de release del registry entero, independiente. La línea de `CONSTITUTION.md` que dice "el número del tag sigue la versión del bundle que subió" está mal y se corrige acá.

## Requirements

- R1: WHEN un push aterriza en `main` tocando contenido del registry, THE CI SHALL calcular el próximo tag `vX.Y.Z` bumpeando el último tag semver existente y pushearlo sobre ese commit.
- R2: THE nivel de bump SHALL derivarse por conventional commits del subject del commit de merge: `feat` → minor; `!`/`BREAKING CHANGE` → major; cualquier otro (`fix`, `chore`, `refactor`, …) → patch.
- R3: THE workflow SHALL NO tagear cuando el push solo toca `docs/**` o `.github/**` (planning interno / CI no son entregables) — vía `paths-ignore`.
- R4: IF el commit de `main` ya está exactamente en un tag `vX.Y.Z`, THEN THE workflow SHALL no hacer nada (idempotente, evita doble-tag).
- R5: IF no existe ningún tag `vX.Y.Z` previo, THEN THE workflow SHALL arrancar desde `v0.0.0` y aplicar el primer bump.
- R6: THE workflow SHALL usar solo el `GITHUB_TOKEN` con `permissions: contents: write` (sin PAT ni secretos extra).

## Approach

Un archivo nuevo: `.github/workflows/auto-tag.yml`.

- `on: push: branches: [main]` con `paths-ignore: ['docs/**', '.github/**']` (R3).
- Un job con `permissions: contents: write`, `fetch-depth: 0` + `fetch-tags: true` para ver todo el historial de tags.
- Pasos en bash:
  1. Si `git describe --tags --exact-match HEAD` matchea un `vX.Y.Z` → salir (R4).
  2. Último tag = mayor `vX.Y.Z` por semver, o `v0.0.0` si no hay (R5).
  3. Leer el subject del merge commit (`git log -1 --format=%s%n%b`) y derivar bump (R2).
  4. Calcular el próximo `vX.Y.Z` y `git tag -a` + `git push origin <tag>` (R1, R6).

## Secuencia / caveat de arranque

El contenido ya mergeado en `#9` (`dev` 1.5.0 + Step 4.0) quedó **sin tag** porque el push manual de `v1.5.0` falló (403 del sandbox). El workflow solo tagea merges *posteriores* a su propia incorporación. Por lo tanto:

1. **Antes/independiente de este PR:** crear `v1.5.0` a mano sobre `a066e0d` (el merge de #9) — desde una máquina con push access o la UI de GitHub.
2. Una vez este PR mergee, los merges de contenido futuros se taguean solos.

Sin el paso 1, el primer disparo del workflow bumpearía desde `v1.4.0` (último tag real) y produciría un `v1.4.x`/`v1.5.0` cuyo contenido ya incluye el 1.5.0 de #9 — desalineado. El paso 1 evita ese hueco.

## Out of scope

- Retagear retroactivamente #9 (se hace a mano, paso 1 de arriba).
- Sincronizar el número del tag con versiones de bundle (explícitamente rechazado por el hallazgo: son independientes).
- GitHub Releases (notas de release) — solo el tag git, que es lo que el CLI consume.

## Testing

Repo de contenido sin sensores → verificación = sintaxis YAML válida + lectura del bash. No hay forma de ejecutar Actions desde acá; el primer disparo real será al mergear este PR (que toca `CONSTITUTION.md`, no ignorado → debería taguear, asumiendo el paso 1 de secuencia hecho antes).
