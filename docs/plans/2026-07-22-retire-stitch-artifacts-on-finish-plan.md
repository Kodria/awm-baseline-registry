# Retire Stitch Artifacts on Finish — Implementation Plan

**Goal:** Añadir a `finishing-a-development-branch` un paso que retira `.stitch/designs/` artefactos de pantallas `completed` antes de integrar (merge/PR), reescribiendo la celda `Artifacts` del design doc.

**Architecture:** Edición de un solo archivo markdown (`skills/finishing-a-development-branch/SKILL.md`). Paso nuevo dentro de Step 4 (solo Opciones 1 y 2); actualización de secciones normativas; bump de versión.

**Tech Stack:** Markdown skill (AWM baseline registry). Sin sensores (repo de contenido).

**Modo de ejecución:** interactivo

---

### Task 1: Editar SKILL.md — paso de retiro + coherencia normativa + version bump

_Requirements: R1, R2, R3, R4, R5, R6, R7_

**Files:**
- Modify: `skills/finishing-a-development-branch/SKILL.md`

Sub-cambios (todos en el mismo archivo, un commit):

1. **Frontmatter:** `version: "1.1.0"` → `version: "1.2.0"`.

2. **Insertar Step 4.0** al inicio del Step 4 (antes de `#### Option 1: Merge Locally`), con este contenido:

```markdown
#### Step 4.0: Retire design artifacts (Options 1 & 2 only)

**Runs only on the integration paths (Option 1 Merge, Option 2 PR), before the merge/push below. Skip entirely for Options 3 and 4.**

Reaching this skill means QA already passed — `development-process` gates `finishing` behind the `awm-qa-complete` + `awm-retro-complete` markers, so any screen marked `completed` in a design doc's `## UI Screens` table has already cleared the design-fidelity gate. Its `.stitch/designs/` artifacts (HTML + PNG) were consumed by implementation and QA and are dead weight in the merged history from here on. Stitch keeps the project (`> Stitch Project: projects/<id>` in the design doc) as the durable source of truth.

1. Detect applicability:

```bash
ls .stitch/designs/ 2>/dev/null || echo "no artifacts — skip retirement"
```

If `.stitch/designs/` does not exist, or no design doc has a `## UI Screens` table with at least one `Status: completed` row, **skip this step silently** (no prompt).

2. For each `## UI Screens` row with `Status: completed`, take its `<slug>` from the `Artifacts` cell paths and the project ref from the section's `> Stitch Project: projects/<id>` header.

3. **Interactive mode — offer once:**

```
These design artifacts already served implementation + QA and become dead weight after integrating:
  .stitch/designs/<slug>.html · .stitch/designs/<slug>.png   (<screen name>)
Remove them in a cleanup commit first? Stitch keeps the project (projects/<id>) as source of truth. [y/N]
```

**Unattended mode:** skip the prompt and perform the removal automatically.

4. On confirmation (or in unattended mode), for each `completed` screen:

```bash
git rm .stitch/designs/<slug>.html .stitch/designs/<slug>.png
```

Then rewrite that screen's `Artifacts` cell in the design doc from the path list to `retired post-merge · projects/<id>` (leave `Status: completed` and every other column unchanged). Commit the removals and the doc edit together:

```bash
git add docs/plans/<design-doc>.md
git commit -m "chore: retire Stitch design artifacts post-QA before integrating"
```

Only `completed` screens are retired — `pending`/in-progress screens keep their artifacts. Never remove `design-system/` tokens or `.stitch/verification/` evidence.

Then continue with the chosen option's merge/push below.
```

3. **Option 1 y Option 2:** agregar como primera línea de cada una (antes del bloque bash):
   - Option 1: `**First, run Step 4.0 (retire design artifacts).**`
   - Option 2: `**First, run Step 4.0 (retire design artifacts).**`

4. **Modo desatendido (línea ~29):** al final del párrafo, añadir: "El path de auto-PR incluye el retiro automático de artefactos de diseño (Step 4.0) sin prompt."

5. **Step 3 modo desatendido (línea ~66):** añadir mención de que la Opción 2 desatendida corre Step 4.0 primero.

6. **Quick Reference table:** añadir columna `Retire artifacts`:

```markdown
| Option | Merge | Push | Keep Worktree | Cleanup Branch | Retire artifacts |
|--------|-------|------|---------------|----------------|------------------|
| 1. Merge locally | ✓ | - | - | ✓ | ✓ (if any) |
| 2. Create PR | - | ✓ | ✓ | - | ✓ (if any) |
| 3. Keep as-is | - | - | ✓ | - | - |
| 4. Discard | - | - | - | ✓ (force) | - |
```

7. **Common Mistakes:** añadir entrada:

```markdown
**Retiring artifacts on keep/discard**
- **Problem:** Removing `.stitch/designs/` on Option 3 or 4 deletes design refs when work isn't being integrated
- **Fix:** Step 4.0 runs only on Options 1 & 2, and only for `completed` screens
```

8. **Red Flags → Never:** añadir `- Retire design artifacts on Option 3/4, or for non-`completed` screens`. **Always:** añadir `- Retire `completed`-screen `.stitch/designs/` artifacts before integrating (Options 1 & 2)`.

- [ ] **Step 1: Aplicar los 8 sub-cambios al archivo**

Editar `skills/finishing-a-development-branch/SKILL.md` con exactamente el contenido de arriba.

- [ ] **Step 2: Verificación de coherencia (lección AGENTS.md)**

Releer completas las secciones `Common Mistakes`, `Red Flags`, `Quick Reference` y `Modo desatendido` del archivo editado y confirmar:
- El menú interactivo sigue teniendo exactamente 4 opciones (el retiro NO es una 5ta opción). La línea "Present exactly 4 options" NO queda contradicha.
- Ninguna línea nueva contradice "Never: Force-push without explicit request" (Step 4.0 no hace force-push).
- Step 4.0 declara explícitamente skip silencioso (R7) y exclusión de Opciones 3/4 (R4).

Comando de chequeo:
```bash
grep -n "exactly 4\|4 options\|4 structured\|Force-push\|Step 4.0\|Retire" skills/finishing-a-development-branch/SKILL.md
```
Expected: las líneas de "4 options" siguen presentes y coherentes; "Step 4.0"/"Retire" aparecen en Step 4, Quick Reference, Common Mistakes, Red Flags.

- [ ] **Step 3: Commit**

```bash
git add skills/finishing-a-development-branch/SKILL.md
git commit -m "feat(finishing): retire Stitch design artifacts before integrating (#8)"
```

---

## Traceability Matrix

| Req | Task | Verificación |
|-----|------|--------------|
| R1  | T1 (Step 4.0 + Option 1/2 hooks) | grep "Step 4.0" en Step 4 + refs en Option 1/2 |
| R2  | T1 (Step 4.0 punto 2/4: solo `completed`) | lectura: "Only `completed` screens are retired" |
| R3  | T1 (Step 4.0 punto 4: reescritura celda) | lectura: "rewrite ... Artifacts cell ... retired post-merge" |
| R4  | T1 (encabezado Step 4.0 + Common Mistakes + Red Flags) | grep "Options 3 and 4" / "keep/discard" |
| R5  | T1 (modo desatendido puntos 4/5) | grep "auto-PR ... retiro automático" |
| R6  | T1 (Step 4.0 punto 4: never design-system/verification) | lectura: "Never remove `design-system/` ... `.stitch/verification/`" |
| R7  | T1 (Step 4.0 punto 1: skip silencioso) | lectura: "skip this step silently" |
