---
name: post-implementation-docs
version: "1.0.0"
license: Apache-2.0
description: Use after post-implementation-qa closes and before harness-retro — updates the user-facing documentation that this cycle's changes made stale, verifying every claim against the real binary rather than against prose. Writes the awm-docs-complete marker.
---

# Post-Implementation Docs

**Announce at start:** "I'm using the post-implementation-docs skill to bring the user-facing documentation in line with what this cycle shipped."

## Overview

La documentación de usuario final no deriva de golpe: deriva un cambio por vez, cada uno demasiado chico como para justificar una pasada de documentación propia. Esta fase existe para que ese costo se pague en el ciclo que lo causa, cuando el diff todavía está fresco y quien lo hizo sabe qué cambió.

**Core principle:** Documentar contra el binario, nunca contra la prosa.

Esta fase corre **después** de `post-implementation-qa` y **antes** de `harness-retro`. Ese orden no es estético: `harness-retro` es la fase terminal de aprendizaje, y un hueco de documentación encontrado acá es exactamente el tipo de hallazgo que el retro sabe curar. Documentar antes del retro convierte el drift en material de aprendizaje en vez de perderlo.

## Modo de ejecución (lectura del campo)

Al arrancar, localiza el plan activo (`docs/plans/*-plan.md` de la rama actual) y lee su línea `**Modo de ejecución:**`:

- Ausente o `interactivo` → modo interactivo (default): presentá el inventario del Step 2 y esperá confirmación antes de editar.
- `desatendido` → aplicá la sección **Modo desatendido** de este skill.
- Cualquier otro valor → tratalo como `interactivo` y avisá: "Valor inválido en `Modo de ejecución`: `<valor>` — usando modo interactivo."

### Modo desatendido

WHEN el modo es `desatendido`, no presentes el inventario ni pidas confirmación: actualizá **toda** la documentación que el inventario del Step 2 marque como afectada, con la verificación del Step 3 corriendo igual sobre cada afirmación. Al terminar, escribí el marker y devolvé el control al orquestador.

Esta fase es post-plan, así que corre del lado desatendido de la frontera — está diseñada para ser resoluble por un agente solo. IF una afirmación no se puede verificar contra el binario porque el comando no existe o falla, THEN no la escribas: registrá el hueco como hallazgo del ciclo (`awm ledger add`) y seguí. Inventar output de CLI es peor que no documentar.

## Degradación

Este skill **no depende** del registry de documentación (`awm-documentation-registry`, opt-in). IF ese registry está instalado y aporta skills de documentación, THEN usalos. IF no está instalado, THEN esta fase corre igual con las instrucciones de este documento y **nunca bloquea** el cierre de la rama — la ausencia de un registry opcional no es un fallo.

## The Process

### Step 1: Leer qué cambió

```bash
git diff main...HEAD --stat
git log main...HEAD --oneline
```

El diff es la única fuente de qué documentar. No documentes de memoria ni de lo que el plan prometía — documentá lo que efectivamente entró.

### Step 2: Inventario de documentación afectada

Para cada cambio del diff, identificá qué documentación de usuario final lo describe hoy. Buscá por el símbolo, no por el tema:

```bash
# Un comando o flag nuevo/cambiado
grep -rn "<comando>" docs/ README.md

# Un archivo de configuración cambiado
grep -rn "<clave-de-config>" docs/ README.md

# Un comportamiento descripto en una guía
grep -rln "<término>" docs/guides/
```

Presentá el inventario como tabla: qué cambió · qué doc lo describe · qué dice hoy · qué debería decir. **En modo interactivo, esperá confirmación acá** — es el punto más barato para que alguien te diga "eso no hace falta documentarlo".

Un cambio sin documentación afectada es un resultado válido y frecuente (un refactor interno, un test). Decilo y seguí.

### Step 3: Verificar contra el binario antes de escribir

**Este es el paso que hace que la fase valga algo.** `AGENTS.md` de este repo documenta el patrón `verify-cmd-source-before-documenting` con ocurrencias confirmadas repetidas: narrativa de comandos que sobrevivió spec-review Y code-quality-review con errores factuales, porque nadie ejecutó nada.

Para cada afirmación que vayas a escribir:

- **Un comando, sus flags, sus keywords** → leé la fuente del comando en el repo del CLI que documentás (en `agentic-workflow`, típicamente `cli/src/commands/<cmd>.ts`) y corré el comando.
- **Output de ejemplo** → pegá el output real, nunca uno plausible.
- **Una secuencia de pasos** → ejecutala literalmente, en orden, en un entorno limpio. Es el patrón `runbook-as-script`: el doc se escribe como hipótesis y se corre como test; las divergencias se corrigen en el doc.

**Al auto-verificar el CLI de AWM durante su propio desarrollo**, `awm` del PATH puede ser una instalación global publicada, desconectada del working tree. Usá `npm run build && node dist/src/index.js <comando>` desde `cli/`.

Leer la prosa **nunca** es verificación. Si no ejecutaste, no lo escribas.

### Step 4: Actualizar

Editá la documentación afectada. Reglas:

- **Corregí, no apiles.** Si un doc dice algo que dejó de ser cierto, se reemplaza — no se le agrega un párrafo nuevo que lo contradiga.
- **Un cambio de comportamiento sin doc que lo describa** puede necesitar sección nueva, o puede no necesitar nada. No inventes documentación para justificar la fase.
- **No toques `AGENTS.md`, `CONSTITUTION.md` ni `CLAUDE.md`.** Esos son contexto de agente y los cura `harness-retro`, que corre después. Esta fase es documentación **de usuario final**.

### Step 5: Verificar de nuevo

```bash
awm sensors run
```

Correr desde la raíz del repo. `overall: pass` o no cerrás. Si el repo tiene link-checking o lint de markdown, corrélo también.

### Step 6: Commit

```bash
git add docs/ README.md
git commit -m "docs: <qué se puso al día y por qué cambió>"
```

### Step 7: Escribir el marker

Agregá al plan activo, junto a los otros markers de ciclo:

```markdown
<!-- awm-docs-complete: YYYY-MM-DD -->
```

Reportá: "Documentación al día. N documentos actualizados, M afirmaciones verificadas contra el binario. Listo para `harness-retro`."

## Red Flags

| Tentación | Realidad |
|---|---|
| "El cambio es interno, no afecta docs" | Puede ser cierto. Corré el inventario del Step 2 igual y decilo con evidencia |
| "El output de ejemplo se ve bien" | Pegá el real. Es la fuente de error más común en documentación de comandos |
| "Agrego una nota aclaratoria" | Si la doc quedó falsa, se corrige. Una nota que contradice el párrafo de arriba es peor que nada |
| "Actualizo AGENTS.md de paso" | Eso es del retro, que corre después. Esta fase es documentación de usuario |
| "No está el registry de documentación, salteo la fase" | La fase corre igual. El registry es opcional y su ausencia nunca bloquea |

## Integration

| Skill | Rol |
|---|---|
| `post-implementation-qa` | Fase anterior; le cede el control con `awm-qa-complete` puesto |
| `harness-retro` | Fase siguiente; se dispara con `awm-docs-complete` presente |
| `development-process` | Rutea a esta fase y exige su marker para avanzar |
| `verification-before-completion` | Gate antes de declarar la fase cerrada |
