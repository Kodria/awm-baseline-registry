# Skills exportables a claude.ai — Implementation Plan

<!-- awm-qa-complete: 2026-07-23 -->

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Marcar `portable: true` en `product-discovery`, `product-brief` y `mermaid-diagrams` para que `awm export --target claude-ai` produzca artefactos funcionales, con un override self-contained para `product-brief`, y retirar el patrón manual `docs/ports/`.

**Architecture:** Repo de contenido (markdown + JSON), sin suite jest. La verificación es structural (grep, parseo JSON/YAML) más una verificación E2E real usando el motor `runExport` ya buildeado en `/home/user/agentic-workflow/cli/dist/` (agentic-workflow#11, mergeado) inyectándole `roots: ['<este working copy>']` — sin tocar `~/.awm`.

**Tech Stack:** Markdown, JSON (catalog.json / bundle.json), YAML frontmatter, Node (solo para el script E2E throwaway).

**Modo de ejecución:** desatendido

> Mandato de ejecución desatendida: ejecución completa sin pausas de check-in
> entre tareas, ni de confirmación entre fases (development-process rutea
> automáticamente y subagent-driven-development no pregunta si continuar con
> el cierre). harness-retro triagea con criterio propio del agente (solo valor
> real, recurrente o sistémico — descarta el resto sin preguntar).
> post-implementation-qa corrige TODOS los hallazgos que surjan, no solo algunos.
> finishing-a-development-branch crea el PR directamente (opción "push + PR"),
> sin presentar el menú de 4 opciones.

**Diseño:** `docs/plans/2026-07-23-portable-product-skills-design.md` (relacionado agentic-workflow#9).

---

### Task 1: Marcar portabilidad + bump de versión en las 3 skills

_Requirements: R1, R1.1, R2_

**Files:**
- Modify: `skills/product-discovery/SKILL.md` (frontmatter: agregar `portable: true`, `version` 1.0.0→1.1.0)
- Modify: `skills/product-brief/SKILL.md` (idem)
- Modify: `skills/mermaid-diagrams/SKILL.md` (idem)

Este repo no tiene jest; la "prueba" es la verificación structural del Step 3.

- [ ] **Step 1: Editar los 3 frontmatter**

En cada uno de los 3 archivos, el frontmatter arranca con `---` y tiene una línea `version: "1.0.0"`. Hacer dos cambios en cada uno:
1. Cambiar `version: "1.0.0"` → `version: "1.1.0"`.
2. Agregar una línea nueva `portable: true` inmediatamente después de la línea `version:`.

Ejemplo del resultado esperado en `skills/product-discovery/SKILL.md` (primeras líneas):

```yaml
---
name: product-discovery
version: "1.1.0"
portable: true
description: "Use when the user brings a raw idea, ..."
---
```

Aplicar el mismo par de cambios a `skills/product-brief/SKILL.md` y `skills/mermaid-diagrams/SKILL.md`. **No tocar el body de ninguna de las 3** — solo el frontmatter.

- [ ] **Step 2: Verificar que las descriptions siguen siendo single-line**

El transform mecánico de `awm export` lanza error ante descriptions multi-línea o con comillas mal cerradas. Las 3 ya son single-line; confirmar que la edición del frontmatter no las rompió.

Run:
```bash
for f in product-discovery product-brief mermaid-diagrams; do
  python3 -c "
import sys
raw = open('skills/$f/SKILL.md').read()
assert raw.startswith('---\n'), '$f: no arranca con ---'
end = raw.index('\n---\n', 4)
fm = raw[4:end]
lines = fm.split('\n')
desc = [l for l in lines if l.startswith('description:')]
assert len(desc) == 1, '$f: description no es exactamente 1 línea'
assert 'portable: true' in fm, '$f: falta portable: true'
assert 'version: \"1.1.0\"' in fm, '$f: version no es 1.1.0'
print('$f OK')
"
done
```
Expected: `product-discovery OK` / `product-brief OK` / `mermaid-diagrams OK` (3 líneas, sin AssertionError)

- [ ] **Step 3: Verificar grep de portabilidad**

Run: `grep -l "^portable: true" skills/product-discovery/SKILL.md skills/product-brief/SKILL.md skills/mermaid-diagrams/SKILL.md | wc -l`
Expected: `3`

- [ ] **Step 4: Commit**

```bash
git add skills/product-discovery/SKILL.md skills/product-brief/SKILL.md skills/mermaid-diagrams/SKILL.md
git commit -m "feat(product): mark product-discovery/product-brief/mermaid-diagrams portable + version bump (#9)"
```

---

### Task 2: Override self-contained de `product-brief`

_Requirements: R1.3_

**Files:**
- Create: `skills/product-brief/port.claude-ai.md`
- Reference (leer, no modificar aún — se borra en Task 4): `docs/ports/brief-spec.claude-ai.md`

- [ ] **Step 1: Construir el override desde el body del port existente**

El archivo `docs/ports/brief-spec.claude-ai.md` ya es self-contained en su body (inlinea el contrato completo y las 12 secciones). El nuevo override reutiliza ESE body, con dos ajustes obligatorios:

1. **Debe arrancar en `---` (byte 0).** `awm export` usa el override verbatim como SKILL.md; si empieza con el comentario HTML `<!-- ... -->` que trae el port actual, claude.ai no detecta el frontmatter. Por eso el override NO lleva el comentario HTML de cabecera. La documentación del patrón vive en `docs/environment-ports.md` (Task 4), no en el archivo del port.

2. **Limpiar las citas de procedencia a paths externos.** El body cita `skills/readiness-gate/references/brief-contract.md` (línea ~12 del body) y `skills/product-brief/references/brief-template.md` (línea ~47) como fuente. El contenido que esas citas referencian ya está inline; los paths apuntan a archivos que no existen en claude.ai. Reemplazar las dos citas para conservar el sentido sin el path muerto:
   - `(contrato normativo: \`skills/readiness-gate/references/brief-contract.md\` en \`awm-baseline-registry\`)` → `(contrato normativo de la capa de producto de AWM, reproducido inline abajo)`
   - `(orden normativo del contrato; fuente canónica del esqueleto: \`skills/product-brief/references/brief-template.md\` en \`awm-baseline-registry\`)` → `(orden normativo del contrato, reproducido inline abajo)`

   Las menciones a `readiness-gate` como *skill* (no como path de archivo) que explican quién escribe el campo `readiness` se conservan tal cual — son parte de la metodología (le dicen al agente "no escribas `ready` vos"), no dependencias de archivo.

El frontmatter del override (primeras líneas del archivo, exactamente):

```yaml
---
name: product-brief
description: Metodología para construir briefs spec-driven destinados a handoff a un agente implementador (Claude Code), sin asumir nada del estado actual del sistema. Usar SIEMPRE que el usuario pida construir, redactar o cerrar un "brief", "spec", "documento de requerimientos" o "handoff para Claude Code" de una funcionalidad, módulo, pipeline o integración — incluso si no usa la palabra "brief" pero pide documentar un diseño acordado para que otro agente lo implemente. También usar cuando pida convertir una conversación de diseño/arquitectura en un documento ejecutable por releases. En entornos con AWM instalado (Claude Code), deferir a product-process/product-brief — este port es para entornos sin filesystem (claude.ai web, Cowork móvil/web).
---
```

(El `name:` es `product-brief` para coincidir con la carpeta de la skill exportada; el dueño no preserva el nombre `brief-spec` viejo. La `description` es la del port existente — activadora, en español, con la línea de deferencia al final.)

Después del frontmatter, pegar el body completo de `docs/ports/brief-spec.claude-ai.md` (desde `# brief-spec — Construcción de briefs spec-driven para handoff` hasta el final), con las dos citas de procedencia reemplazadas según el punto 2. El título `# brief-spec — ...` del body puede quedar como está (es texto de contenido, no el `name` del frontmatter) o renombrarse a `# product-brief — ...`; renombrarlo es preferible por consistencia, sin efecto funcional.

- [ ] **Step 2: Verificar que el override es válido y self-contained**

Run:
```bash
python3 -c "
raw = open('skills/product-brief/port.claude-ai.md').read()
assert raw.startswith('---\n'), 'no arranca con --- (byte 0)'
end = raw.index('\n---\n', 4)
fm = raw[4:end]
assert 'name:' in fm and 'description:' in fm, 'frontmatter incompleto'
assert 'version:' not in fm, 'el override no debe llevar version (lo maneja el registry, no claude.ai)'
print('frontmatter OK')
"
grep -n "skills/readiness-gate/references\|skills/product-brief/references\|references/brief-contract\|references/brief-template" skills/product-brief/port.claude-ai.md
echo "grep-exit: $?  (1 = sin matches = self-contained, esperado)"
```
Expected: `frontmatter OK`, luego el grep imprime nada y `grep-exit: 1`.

- [ ] **Step 3: Confirmar que el contrato quedó inline (no se perdió contenido al limpiar citas)**

Run: `grep -c "awm: product-brief\|schema: 1\|Business Need\|Business Cases\|Non-Assumption Mandate\|Open Decisions" skills/product-brief/port.claude-ai.md`
Expected: `≥6` (el bloque de frontmatter-contrato inline + los nombres de las 12 secciones siguen presentes).

- [ ] **Step 4: Commit**

```bash
git add skills/product-brief/port.claude-ai.md
git commit -m "feat(product): self-contained claude.ai override for product-brief (inline contract, no external refs) (#9)"
```

---

### Task 3: Bump de bundles + catalog + CHANGELOG

_Requirements: R2.1, R4_

**Files:**
- Modify: `bundles/product/bundle.json` (`version` 1.1.0→1.2.0)
- Modify: `bundles/dev/bundle.json` (`version` 2.0.0→2.1.0)
- Modify: `catalog.json` (product 1.1.0→1.2.0, dev 2.0.0→2.1.0)
- Modify: `CHANGELOG.md` (entrada nueva arriba)

- [ ] **Step 1: Bumps de versión**

Releer los 3 archivos primero (Task 1 no los tocó, pero confirmar el valor de partida). Cambiar:
- `bundles/product/bundle.json`: `"version": "1.1.0"` → `"version": "1.2.0"`
- `bundles/dev/bundle.json`: `"version": "2.0.0"` → `"version": "2.1.0"`
- `catalog.json`: la entrada `product` de `"1.1.0"` → `"1.2.0"` y la entrada `dev` de `"2.0.0"` → `"2.1.0"`.

- [ ] **Step 2: CHANGELOG (insertar tras la línea "Newest entry on top...")**

```markdown
## dev 2.1.0 / product 1.2.0 — 2026-07-23

### Added — exportabilidad a claude.ai (`awm export --target claude-ai`)
- `product-discovery` 1.1.0, `product-brief` 1.1.0 (bundle `product`) y `mermaid-diagrams` 1.1.0 (bundle `dev`) marcadas `portable: true`: ahora se exportan como custom skills subibles a claude.ai vía el comando `awm export` (agentic-workflow#9/#11).
- `skills/product-brief/port.claude-ai.md`: override self-contained para `product-brief` — el SKILL.md canónico defiere el contrato del brief a `skills/readiness-gate/references/brief-contract.md`, un archivo que no viaja en el export; el override reproduce el contrato inline para que el port funcione standalone en claude.ai. `product-discovery` y `mermaid-diagrams` no necesitan override (son self-contained por transform mecánico).

### Removed
- `docs/ports/` (ports manuales `brief-spec.claude-ai.md` y `mermaid-diagrams.claude-ai.md`): reemplazados por el flujo automatizado de `awm export`. `docs/environment-ports.md` reescrito para documentar el comando en vez del pegado manual. El contenido de `brief-spec.claude-ai.md` se migró a `skills/product-brief/port.claude-ai.md`.

Diseño: docs/plans/2026-07-23-portable-product-skills-design.md (relacionado agentic-workflow#9).
```

- [ ] **Step 3: Verificar JSON + versiones + CHANGELOG**

Run:
```bash
python3 -c "
import json
c = json.load(open('catalog.json'))
d = {b['name']: b['version'] for b in c['bundles']}
assert d['product']=='1.2.0' and d['dev']=='2.1.0', d
p = json.load(open('bundles/product/bundle.json'))['version']
dv = json.load(open('bundles/dev/bundle.json'))['version']
assert p=='1.2.0' and dv=='2.1.0', (p,dv)
print('VERSIONS-OK')
" && grep -q 'dev 2.1.0 / product 1.2.0' CHANGELOG.md && echo CHANGELOG-OK
```
Expected: `VERSIONS-OK` + `CHANGELOG-OK`

- [ ] **Step 4: Commit**

```bash
git add bundles/product/bundle.json bundles/dev/bundle.json catalog.json CHANGELOG.md
git commit -m "feat(product): bump product 1.2.0 + dev 2.1.0 — portable skills changelog (#9)"
```

---

### Task 4: Retirar `docs/ports/` + reescribir `docs/environment-ports.md`

_Requirements: R3, R3.1, R3.2_

**Files:**
- Delete: `docs/ports/brief-spec.claude-ai.md`, `docs/ports/mermaid-diagrams.claude-ai.md` (todo el dir `docs/ports/`)
- Modify: `docs/environment-ports.md` (reescritura de secciones)

- [ ] **Step 1: Borrar el directorio de ports**

```bash
git rm -r docs/ports/
```

- [ ] **Step 2: Reescribir `docs/environment-ports.md`**

Reemplazar la sección `## Ports vigentes` (la tabla que enlaza a `docs/ports/`) y la sección `## Pacto de sincronización` por lo siguiente. Conservar intactas las secciones `## Qué es un environment port` (con un ajuste menor: ya no dice que el port "vive en `docs/ports/`"), `## Dirección futura` (se marca implementada) y `## Trabajo relacionado diferido`.

Nueva sección que reemplaza "Ports vigentes":

```markdown
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
```

Nueva sección que reemplaza "Pacto de sincronización":

```markdown
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
```

En la sección `## Dirección futura`, reemplazar el texto que describe el bundle exportable como "dirección prevista"/futura por una nota de que **ya está implementado** (el comando `awm export`, agentic-workflow#9/#11), conservando el enlace al issue.

- [ ] **Step 3: Verificar que no quedan referencias colgadas a `docs/ports/`**

Run: `grep -rn "docs/ports" . --include="*.md" --include="*.json" | grep -v "docs/plans/2026-07-23-portable-product-skills"`
Expected: sin output (las únicas menciones permitidas son los dos design/plan docs de este ciclo, que narran el retiro).

- [ ] **Step 4: Verificar que environment-ports.md refleja el flujo nuevo**

Run: `grep -q 'awm export --target claude-ai' docs/environment-ports.md && ! grep -q 'ports/brief-spec.claude-ai.md' docs/environment-ports.md && echo ENV-PORTS-OK`
Expected: `ENV-PORTS-OK`

- [ ] **Step 5: Commit**

```bash
git add docs/environment-ports.md docs/ports/
git commit -m "docs: retire docs/ports/, rewrite environment-ports.md for awm export flow (#9)"
```

---

### Task 5: Verificación E2E real (motor de export contra este working copy)

_Requirements: R1.1, R1.3, R1.4 (verificación de conjunto)_

**Files:**
- Temp (crear y borrar): `/tmp/claude-0/-home-user/16994feb-6fcb-5f5d-b4e6-cc712cd943f9/scratchpad/verify-export.js`

- [ ] **Step 1: Escribir el script E2E throwaway**

El motor `runExport` está buildeado en `/home/user/agentic-workflow/cli/dist/src/core/export/index.js` y exporta `runExport(opts)`. Inyectarle `roots: ['/home/user/awm-baseline-registry']` (este working copy) y un `zip` fake para no depender del binario, exportando las 3 skills a un tmpdir. Crear el archivo:

```javascript
// verify-export.js — throwaway, se borra tras verificar
const fs = require('fs');
const path = require('path');
const os = require('os');
const { runExport } = require('/home/user/agentic-workflow/cli/dist/src/core/export/index.js');

const ROOT = '/home/user/awm-baseline-registry';
const out = fs.mkdtempSync(path.join(os.tmpdir(), 'awm-export-verify-'));
const okZip = (cwd, zipName) => { fs.writeFileSync(path.join(cwd, zipName), 'z'); return { ok: true, missing: false }; };

let failures = 0;
function check(cond, msg) { if (!cond) { console.log('FAIL:', msg); failures++; } else { console.log('ok:', msg); } }

for (const skill of ['product-discovery', 'product-brief', 'mermaid-diagrams']) {
  let summary;
  try {
    summary = runExport({ name: skill, out, roots: [ROOT], zip: okZip });
  } catch (e) {
    console.log('FAIL: runExport threw for', skill, '-', e.message);
    failures++;
    continue;
  }
  const skillMd = path.join(out, 'claude-ai', skill, 'SKILL.md');
  check(fs.existsSync(skillMd), `${skill}: SKILL.md written`);
  const content = fs.readFileSync(skillMd, 'utf-8');
  check(content.startsWith('---\n'), `${skill}: output starts with frontmatter`);
}

// product-brief usa override verbatim: su SKILL.md exportado NO debe tener la línea de
// deferencia mecánica (esa la agrega el transform, no el override) y SÍ el contrato inline.
const briefMd = fs.readFileSync(path.join(out, 'claude-ai', 'product-brief', 'SKILL.md'), 'utf-8');
check(briefMd.includes('awm: product-brief'), 'product-brief: contract inline present (override used)');
check(!briefMd.includes('skills/readiness-gate/references'), 'product-brief: no dead external ref in export');

// mermaid usa transform mecánico: SÍ debe tener la línea de deferencia y sus references/ deben viajar.
const mermaidMd = fs.readFileSync(path.join(out, 'claude-ai', 'mermaid-diagrams', 'SKILL.md'), 'utf-8');
check(mermaidMd.includes('defer to the registry'), 'mermaid-diagrams: deference line appended (mechanical transform)');
check(fs.existsSync(path.join(out, 'claude-ai', 'mermaid-diagrams', 'references')), 'mermaid-diagrams: references/ travelled');

// product-discovery: transform mecánico, deference line presente.
const discMd = fs.readFileSync(path.join(out, 'claude-ai', 'product-discovery', 'SKILL.md'), 'utf-8');
check(discMd.includes('defer to the registry'), 'product-discovery: deference line appended (mechanical transform)');

fs.rmSync(out, { recursive: true, force: true });
console.log(failures === 0 ? 'E2E-EXPORT-OK' : `E2E-EXPORT-FAILED (${failures})`);
process.exit(failures === 0 ? 0 : 1);
```

- [ ] **Step 2: Correr el script**

Run: `node /tmp/claude-0/-home-user/16994feb-6fcb-5f5d-b4e6-cc712cd943f9/scratchpad/verify-export.js`
Expected: varias líneas `ok:` y una final `E2E-EXPORT-OK` (exit 0).

Si `runExport` no fuera importable (dist ausente/movido), caer a la verificación structural mínima: confirmar `portable: true` en las 3, override empieza con `---` y sin refs externas (ya cubierto en Tasks 1-2 Steps), y anotar en el reporte que el E2E real no pudo correr y por qué. NO marcar la task completa sin una u otra evidencia.

- [ ] **Step 3: Borrar el script throwaway**

```bash
rm /tmp/claude-0/-home-user/16994feb-6fcb-5f5d-b4e6-cc712cd943f9/scratchpad/verify-export.js
```

- [ ] **Step 4: Commit (si el script dejó algún artefacto rastreable; si no, no-op)**

```bash
git add -A && git diff --cached --quiet || git commit -m "chore: E2E export verification (#9)"
```
(Normalmente no-op: el script vive fuera del repo y se borra. Este step existe por si algo quedó staged.)

---

## Traceability Matrix

| Req  | Task(s) | Verificación |
|------|---------|-------------|
| R1   | T1 | T1-S3 grep `portable: true` = 3 |
| R1.1 | T1, T5 | T1-S2 assert description single-line en las 3; T5 export no lanza (el transform valida single-line en runtime) |
| R1.2 | — | (Requisito negativo: las skills filesystem-dependientes NO se marcan. Verificable por ausencia: `grep -L "^portable: true"` sobre product-process/architecture-*/readiness-gate — no se agrega task porque no se editan; se confirma en T5 que solo las 3 esperadas exportan) |
| R1.3 | T2 | T2-S2 grep refs externas = 0 + frontmatter válido sin `version`; T2-S3 contrato inline ≥6 marcadores; T5 product-brief usa override verbatim con contrato inline y sin ref muerta |
| R1.4 | T5 | T5 product-discovery/mermaid llevan línea de deferencia (transform mecánico) y references/ de mermaid viajan |
| R2   | T1 | T1-S2 assert `version: "1.1.0"` en las 3 |
| R2.1 | T3 | T3-S3 `VERSIONS-OK` (product 1.2.0, dev 2.1.0 en catalog + ambos bundle.json) |
| R3   | T4 | T4-S1 `git rm -r docs/ports/`; T4-S3 grep sin referencias colgadas |
| R3.1 | T4 | T4-S4 `ENV-PORTS-OK` (menciona `awm export`, ya no enlaza al port viejo) |
| R3.2 | T4 | T4-S3 `grep -rn "docs/ports"` = 0 fuera de los docs de este ciclo |
| R4   | T3 | T3-S3 `CHANGELOG-OK` (entrada `dev 2.1.0 / product 1.2.0`) |

**Analyze gate:** R1, R1.1, R1.3, R1.4, R2, R2.1, R3, R3.1, R3.2, R4 tienen ≥1 task y ≥1 verificación. R1.2 es un requisito negativo (ausencia de marcado) verificado por construcción en T5 (solo exportan las 3 esperadas) — declarado explícitamente, sin task propia porque no implica edición. Ningún task carece de requirement. Sin gaps.
