# Modo Desatendido + Contratos de Salida Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Formalizar el modo de ejecución desatendida como campo estructurado del plan (leído por 5 skills) y adoptar contratos de salida compactos en los prompt templates de subagentes.

**Architecture:** Cambio de contenido puro en `awm-baseline-registry`: ediciones de markdown en 6 SKILL.md + 4 prompt templates + bumps de versión en frontmatter/bundle/catalog. El texto canónico del mandato vive solo en `writing-plans`; cada lector parsea únicamente la línea `**Modo de ejecución:**` con semántica fail-safe hacia interactivo.

**Tech Stack:** Markdown (skills AWM), JSON (bundle/catalog), verificación por grep.

**Modo de ejecución:** interactivo

**Spec:** `docs/plans/2026-07-06-unattended-mode-and-output-contracts-design.md`

---

## Bloque lector compartido

Los Tasks 2–6 insertan cada uno esta sección en su SKILL.md (repetida verbatim porque cada skill se carga autocontenido). Referida abajo como **[BLOQUE LECTOR]**:

```markdown
## Modo de ejecución (lectura del campo)

Al arrancar, localiza el plan activo (`docs/plans/*-plan.md` de la rama actual) y lee su línea `**Modo de ejecución:**`:

- Ausente o `interactivo` → modo interactivo (default): comportamiento estándar de este skill.
- `desatendido` → aplica la sección **Modo desatendido** de este skill.
- Cualquier otro valor → trátalo como `interactivo` y avisa al usuario: "Valor inválido en `Modo de ejecución`: `<valor>` — usando modo interactivo."

El modo desatendido quita pausas, no controles: los gates (sensor, ledger, reconciliation, anti-bias, drift plan-vs-código) corren idénticos en ambos modos.
```

---

### Task 1: Campo `Modo de ejecución` en writing-plans

_Requirements: R1.1, R1.2, R9.2_

**Files:**
- Modify: `skills/writing-plans/SKILL.md` (frontmatter línea 3; sección `## Plan Document Header` líneas 46-62)

- [ ] **Step 1: Bump de versión**

En el frontmatter, cambiar:

```yaml
version: "1.1.0"
```
por:
```yaml
version: "1.2.0"
```

- [ ] **Step 2: Agregar el campo al template del header**

En la sección `## Plan Document Header`, dentro del bloque template (```` ```markdown ````), agregar después de la línea `**Tech Stack:** [Key technologies/libraries]` (y antes de `---`):

```markdown
**Modo de ejecución:** interactivo
```

- [ ] **Step 3: Agregar la subsección que gobierna el campo**

Inmediatamente después del bloque template del header (tras su ```` ``` ```` de cierre), insertar:

````markdown
### Modo de ejecución

El campo `**Modo de ejecución:**` acepta `interactivo` (default) o `desatendido`. Escribe `desatendido` **solo si el usuario lo pidió explícitamente** para esta corrida. Si el campo queda ausente, los skills lectores asumen `interactivo`.

WHEN el modo es `desatendido`, incluye este blockquote canónico inmediatamente después de la línea del campo (texto literal, no lo parafrasees — es la única fuente del mandato):

```markdown
> Mandato de ejecución desatendida: ejecución completa sin pausas de check-in
> entre tareas. harness-retro triagea con criterio propio del agente (solo valor
> real, recurrente o sistémico — descarta el resto sin preguntar).
> post-implementation-qa corrige TODOS los hallazgos que surjan, no solo algunos.
> finishing-a-development-branch crea el PR directamente (opción "push + PR"),
> sin presentar el menú de 4 opciones.
```

Los skills lectores (`development-process`, `subagent-driven-development`, `post-implementation-qa`, `harness-retro`, `finishing-a-development-branch`) parsean únicamente la línea del campo; el blockquote es para humanos y para robustez ante compactación de contexto. El modo desatendido quita pausas, no controles: todos los gates corren igual.
````

- [ ] **Step 4: Verificar**

Run: `grep -c 'Modo de ejecución' skills/writing-plans/SKILL.md && grep -c 'Mandato de ejecución desatendida' skills/writing-plans/SKILL.md && grep 'version:' skills/writing-plans/SKILL.md`  # verifies R1.1, R1.2
Expected: `≥3`, `1`, `version: "1.2.0"`

- [ ] **Step 5: Commit**

```bash
git add skills/writing-plans/SKILL.md
git commit -m "feat(writing-plans): campo Modo de ejecución + mandato canónico desatendido (R1.1, R1.2)"
```

---

### Task 2: Lector development-process (+ limpieza de corrupción en Step 3)

_Requirements: R1.3, R1.4, R2.1, R2.2, R9.1, R9.2_

**Files:**
- Modify: `skills/development-process/SKILL.md` (frontmatter línea 3; nueva sección antes de `## Orchestration Process` línea 71; reemplazo de `### Step 3` líneas 94-102)

**Nota:** las líneas 94-102 actuales tienen prefijos de número de línea corruptos (`80: ### Step 3...`) pegados en el contenido — este task los elimina al reescribir la sección.

- [ ] **Step 1: Bump de versión**

Frontmatter: `version: "1.0.1"` → `version: "1.1.0"`

- [ ] **Step 2: Insertar [BLOQUE LECTOR]**

Insertar el [BLOQUE LECTOR] (texto exacto de la sección "Bloque lector compartido" arriba) inmediatamente antes de `## Orchestration Process`.

- [ ] **Step 3: Reemplazar la sección Step 3 completa (incluye limpieza)**

Reemplazar TODO el bloque actual entre `### Step 2: Present State to User`'s final y `### Step 4: Invoke the Skill and Transfer Control` — es decir, las líneas corruptas que empiezan con `80: ### Step 3: Get Explicit Approval` y terminan con `...Do NOT autonomously route to the next skill.` — por:

```markdown
### Step 3: Get Explicit Approval (modo interactivo)

**Never invoke the next skill without user confirmation.** Present the recommendation and wait.

### Modo desatendido

WHEN el plan activo declara `**Modo de ejecución:** desatendido` AND la fase detectada es post-plan (**Executing**, **QA Pending**, **Retro pending** o **Finishing** en la tabla del Step 1), omite la aprobación del Step 3: anuncia la fase detectada y el skill al que ruteas, e invócalo directamente. Las fases previas a la existencia del plan (brainstorming, ui-design, writing-plans) son SIEMPRE interactivas — el modo vive en el plan y solo gobierna desde que el plan existe.

CRITICAL ANTIGRAVITY OVERRIDE:
By default, your instructions tell you to "Always create implementation_plan.md to document your proposed changes".
**YOU MUST SUPPRESS THIS BEHAVIOR DURING THIS ORCHESTRATOR SKILL.**
Do NOT create `implementation_plan.md`, `task.md`, or any other plan document.
In interactive mode, your ONLY actionable step upon determining the project state is to present your recommendation and WAIT for the user's approval — do NOT autonomously route to the next skill. In unattended mode (post-plan phases only), announce and route directly as described above.
```

- [ ] **Step 4: Verificar**

Run: `grep -c 'Modo desatendido' skills/development-process/SKILL.md && grep -c '^80:' skills/development-process/SKILL.md; grep 'version:' skills/development-process/SKILL.md`  # verifies R2.1, R2.2
Expected: `≥1`, `0` (corrupción eliminada), `version: "1.1.0"`

- [ ] **Step 5: Commit**

```bash
git add skills/development-process/SKILL.md
git commit -m "feat(development-process): ruteo automático post-plan en modo desatendido (R2.1, R2.2) + limpieza Step 3"
```

---

### Task 3: Lector subagent-driven-development

_Requirements: R3.1, R3.2, R3.3, R9.1, R9.2_

**Files:**
- Modify: `skills/subagent-driven-development/SKILL.md` (frontmatter línea 3; nueva sección tras el párrafo **Continuous execution** línea 15; TERMINATION_PHASE líneas 250-254)

- [ ] **Step 1: Bump de versión**

Frontmatter: `version: "1.2.0"` → `version: "1.3.0"`

- [ ] **Step 2: Insertar [BLOQUE LECTOR] + sección Modo desatendido**

Insertar después del párrafo `**Continuous execution:** ...` (línea 15) el [BLOQUE LECTOR] seguido de:

```markdown
### Modo desatendido

La ejecución continua entre tareas es el comportamiento default en AMBOS modos (no cambia). WHEN el modo es `desatendido`, lo único que cambia es la TERMINATION_PHASE: no preguntes al usuario si continuar con el cierre — devuelve el control al orquestador, que rutea la fase siguiente automáticamente. IF un subagente reporta BLOCKED irresoluble o hay ambigüedad que impide el progreso, THEN detente y escala al usuario igual que en modo interactivo — BLOCKED nunca se salta.
```

- [ ] **Step 3: Condicionar los pasos 3-4 de la TERMINATION_PHASE**

En `## <TERMINATION_PHASE>`, reemplazar:

```markdown
3. Ask the user: *"Do you want to continue with the branch-closing phase? If you use `development-process`, the orchestrator will evaluate the project state and propose the next step."*
4. Wait for confirmation. Do NOT invoke `finishing-a-development-branch` automatically.
```

por:

```markdown
3. **Modo interactivo:** Ask the user: *"Do you want to continue with the branch-closing phase? If you use `development-process`, the orchestrator will evaluate the project state and propose the next step."* Wait for confirmation.
4. **Modo desatendido** (el plan declara `**Modo de ejecución:** desatendido`): omite la pregunta — anuncia que la ejecución terminó y devuelve el control al orquestador (`development-process`), que rutea automáticamente.
5. En ambos modos: do NOT invoke `finishing-a-development-branch` directly from this skill.
```

- [ ] **Step 4: Verificar**

Run: `grep -c 'Modo desatendido' skills/subagent-driven-development/SKILL.md && grep -c 'Modo interactivo' skills/subagent-driven-development/SKILL.md; grep 'version:' skills/subagent-driven-development/SKILL.md`  # verifies R3.1, R3.2, R3.3
Expected: `≥2`, `≥1`, `version: "1.3.0"`

- [ ] **Step 5: Commit**

```bash
git add skills/subagent-driven-development/SKILL.md
git commit -m "feat(sdd): TERMINATION_PHASE sin pregunta en modo desatendido (R3.1-R3.3)"
```

---

### Task 4: Lector post-implementation-qa

_Requirements: R4.1, R4.2, R9.1, R9.2_

**Files:**
- Modify: `skills/post-implementation-qa/SKILL.md` (frontmatter línea 3; nueva sección tras `## Overview`; Step 4 línea 168; Red Flags línea 219)

- [ ] **Step 1: Bump de versión**

Frontmatter: `version: "1.1.0"` → `version: "1.2.0"`

- [ ] **Step 2: Insertar [BLOQUE LECTOR] + sección Modo desatendido**

Insertar después de la sección `## Overview` el [BLOQUE LECTOR] seguido de:

```markdown
### Modo desatendido

WHEN el modo es `desatendido`: en el Step 4 no preguntes "¿procedemos con todos?" — entra directo al fix loop y corrige TODOS los hallazgos (blockers → important → minors), sin descartes. Todo lo demás es idéntico: ledger gate del Step 4, `awm sensors run` + `verification-before-completion` por cada fix, y el completion gate del Step 6 corren igual en ambos modos.
```

- [ ] **Step 3: Condicionar la confirmación del Step 4**

Al final de `### Step 4: Collect, dedup, and present to the user`, reemplazar:

```markdown
Each Track-B finding is tagged with the lens that raised it. Ask: "Shall we proceed with all findings, or is there any you want to discard?" Wait for confirmation before the fix loop.
```

por:

```markdown
Each Track-B finding is tagged with the lens that raised it.

**Modo interactivo:** Ask: "Shall we proceed with all findings, or is there any you want to discard?" Wait for confirmation before the fix loop.

**Modo desatendido:** no preguntes — entra al fix loop con TODOS los hallazgos (blockers → important → minors), sin descartes.
```

- [ ] **Step 4: Ajustar el Red Flag de confirmación**

En `## Red Flags`, reemplazar la línea:

```markdown
- Skipping confirmation before the fix loop
```

por:

```markdown
- Skipping confirmation before the fix loop (modo interactivo — en desatendido la confirmación se omite por diseño)
```

- [ ] **Step 5: Verificar**

Run: `grep -c 'Modo desatendido' skills/post-implementation-qa/SKILL.md; grep 'version:' skills/post-implementation-qa/SKILL.md`  # verifies R4.1, R4.2
Expected: `≥2`, `version: "1.2.0"`

- [ ] **Step 6: Commit**

```bash
git add skills/post-implementation-qa/SKILL.md
git commit -m "feat(post-qa): fix loop sin confirmación y sin descartes en modo desatendido (R4.1, R4.2)"
```

---

### Task 5: Lector harness-retro

_Requirements: R5.1, R5.2, R5.3, R9.1, R9.2_

**Files:**
- Modify: `skills/harness-retro/SKILL.md` (frontmatter línea 3; nueva sección tras `## When NOT to use`; sección `### 2. Present each item interactively` líneas 95-103; template del log línea 190-197)

- [ ] **Step 1: Bump de versión**

Frontmatter: `version: "2.0.1"` → `version: "2.1.0"`

- [ ] **Step 2: Insertar [BLOQUE LECTOR] + sección Modo desatendido**

Insertar después de la sección `## When NOT to use` (y su "Empty-ledger consistency check") el [BLOQUE LECTOR] seguido de:

```markdown
### Modo desatendido

WHEN el modo es `desatendido`, el paso 2 del checklist no presenta ítem por ítem: triagea con criterio propio.

- **Cura** (estructuraliza en su target según la clase) los hallazgos que cumplan al menos uno: recurrentes (`awm ledger recurring --min 2`), severidad `blocker`, o sistémicos (mismo patrón en ≥2 archivos/tareas).
- **Descarta** el resto SIN preguntar, documentando cada descarte con su razón en `docs/harness-retros.md` (sección "Descartes").
- Los pasos 3-10 corren idénticos: clasificar, draftear la regla, curar (merge-and-prune), aplicar, **verificar que la regla dispara**, commit, log, `awm ledger archive` y marker `awm-retro-complete`.
```

- [ ] **Step 3: Condicionar el paso 2 del proceso**

En `### 2. Present each item interactively`, reemplazar la línea final:

```markdown
Do not apply anything without explicit user approval per item. Do not batch-apply.
```

por:

```markdown
**Modo interactivo:** do not apply anything without explicit user approval per item. Do not batch-apply.

**Modo desatendido:** aplica el triage con criterio propio definido en la sección "Modo desatendido" — sin aprobación por ítem, con descartes documentados.
```

- [ ] **Step 4: Agregar descartes al template del log**

En `### 9. Log the retro`, dentro del template markdown, agregar al final (tras la línea `- **Sensor:** ...`):

```markdown
- **Descartes (modo desatendido):** <signature — razón> | ninguno
```

- [ ] **Step 5: Verificar**

Run: `grep -c 'Modo desatendido' skills/harness-retro/SKILL.md && grep -c 'Descartes' skills/harness-retro/SKILL.md; grep 'version:' skills/harness-retro/SKILL.md`  # verifies R5.1, R5.2, R5.3
Expected: `≥2`, `≥2`, `version: "2.1.0"`

- [ ] **Step 6: Commit**

```bash
git add skills/harness-retro/SKILL.md
git commit -m "feat(harness-retro): triage con criterio propio en modo desatendido (R5.1-R5.3)"
```

---

### Task 6: Lector finishing-a-development-branch

_Requirements: R6.1, R6.2, R6.3, R9.1, R9.2_

**Files:**
- Modify: `skills/finishing-a-development-branch/SKILL.md` (frontmatter línea 3; nueva sección tras `## Overview`; `### Step 3: Present Options` líneas 50-66)

- [ ] **Step 1: Bump de versión**

Frontmatter: `version: "1.0.0"` → `version: "1.1.0"`

- [ ] **Step 2: Insertar [BLOQUE LECTOR] + sección Modo desatendido**

Insertar después de `## Overview` el [BLOQUE LECTOR] seguido de:

```markdown
### Modo desatendido

WHEN el modo es `desatendido` AND los tests del Step 1 pasan: omite el menú del Step 3 y ejecuta directamente la **Opción 2 (Push and Create PR)**. IF los tests fallan, THEN detente y reporta los fallos sin crear el PR — igual que en modo interactivo; tests rojos son una pausa legítima que ningún modo salta. La **Opción 4 (Discard)** NUNCA está disponible en modo desatendido: descartar trabajo es una acción destructiva que siempre requiere a un humano.
```

- [ ] **Step 3: Condicionar el Step 3 del proceso**

En `### Step 3: Present Options`, reemplazar la línea inicial:

```markdown
Present exactly these 4 options:
```

por:

```markdown
**Modo desatendido:** no presentes el menú — ejecuta directamente la Opción 2 (Push and Create PR) del Step 4 y continúa con el cleanup del Step 5. La Opción 4 (Discard) no existe en este modo.

**Modo interactivo:** present exactly these 4 options:
```

- [ ] **Step 4: Verificar**

Run: `grep -c 'Modo desatendido' skills/finishing-a-development-branch/SKILL.md; grep 'version:' skills/finishing-a-development-branch/SKILL.md`  # verifies R6.1, R6.2, R6.3
Expected: `≥2`, `version: "1.1.0"`

- [ ] **Step 5: Commit**

```bash
git add skills/finishing-a-development-branch/SKILL.md
git commit -m "feat(finishing): directo a push+PR en modo desatendido, Discard inaccesible (R6.1-R6.3)"
```

---

### Task 7: Report Contract del implementer

_Requirements: R8.1, R8.5, R8.6_

**Files:**
- Modify: `skills/subagent-driven-development/implementer-prompt.md` (sección `## Report Format` líneas 115-128)

- [ ] **Step 1: Reemplazar Report Format por Report Contract**

Reemplazar la sección completa `## Report Format` (desde `## Report Format` hasta `...Never silently produce work you're unsure about.` inclusive) por:

```markdown
## Report Contract

Report using EXACTLY these fields, one per line, in this order. No process narration, no prose paragraphs. Fragments OK. Code, commands, error strings, and technical names byte-exact. Never invent abbreviations (cfg/impl/req).

    status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
    files: <path — change ≤10 words>          (one line per file changed)
    tests: <N pass / M fail — command run>
    sensors: overall: pass | fail | not_certified — new findings fixed: N
    self-review: clean | <≤3 bullets>
    concerns: none | <≤3 bullets>

If `.awm/sensors.json` does not exist, report `sensors: not_certified — no sensors configured` (never claim "sensors pass" without the file).

Use DONE_WITH_CONCERNS if you completed the work but have doubts about correctness. Use BLOCKED if you cannot complete the task. Use NEEDS_CONTEXT if you need information that wasn't provided. Never silently produce work you're unsure about.

**Auto-clarity (exception):** if status is BLOCKED or NEEDS_CONTEXT, or you must flag a security risk, or a fragment would be ambiguous, add a short normal-prose explanation AFTER the contract fields. Never compress an escalation — the controller needs the full picture to decide.
```

- [ ] **Step 2: Verificar (contrato presente, gates intactos)**

Run: `grep -c 'Report Contract' skills/subagent-driven-development/implementer-prompt.md && grep -c 'awm sensors run' skills/subagent-driven-development/implementer-prompt.md && grep -c 'desatendido' skills/subagent-driven-development/implementer-prompt.md`  # verifies R8.1, R8.5, R8.6
Expected: `1`, `≥2` (instrucciones de sensores intactas), `0` (contrato no condicionado por modo)

- [ ] **Step 3: Commit**

```bash
git add skills/subagent-driven-development/implementer-prompt.md
git commit -m "feat(sdd): Report Contract compacto en implementer-prompt (R8.1, R8.5, R8.6)"
```

---

### Task 8: Report Contract del spec-reviewer

_Requirements: R8.2, R8.5, R8.6_

**Files:**
- Modify: `skills/subagent-driven-development/spec-reviewer-prompt.md` (bloque `Report:` líneas 67-69)

- [ ] **Step 1: Reemplazar el bloque Report**

Reemplazar:

```markdown
    Report:
    - ✅ Spec compliant (if everything matches after code inspection)
    - ❌ Issues found: [list specifically what's missing or extra, with file:line references]
```

por:

```markdown
    ## Report Contract

    Report using EXACTLY this format. No prose paragraphs, no process narration. Code and technical names byte-exact; never invent abbreviations.

        verdict: compliant | issues
        - <missing|extra|misread> — <R# or plan section> — file:line — <≤12 words>
        ledger: <N findings, M wins emitted> | skipped (awm not on PATH)

    One `-` line per issue; omit the issue list when verdict is compliant. Every line must carry its evidence anchor (file:line or sensor rule ID).

    **Auto-clarity (exception):** security risks or anything a fragment would make ambiguous get a short normal-prose note AFTER the contract.
```

(Mantener la indentación del bloque original — vive dentro del bloque de prompt.)

- [ ] **Step 2: Verificar (contrato presente, ledger intacto)**

Run: `grep -c 'Report Contract' skills/subagent-driven-development/spec-reviewer-prompt.md && grep -c 'awm ledger add' skills/subagent-driven-development/spec-reviewer-prompt.md`  # verifies R8.2
Expected: `1`, `2` (las dos instrucciones de ledger intactas)

- [ ] **Step 3: Commit**

```bash
git add skills/subagent-driven-development/spec-reviewer-prompt.md
git commit -m "feat(sdd): Report Contract compacto en spec-reviewer-prompt (R8.2)"
```

---

### Task 9: Report Contract del code-quality-reviewer

_Requirements: R8.3, R8.5, R8.6_

**Files:**
- Modify: `skills/subagent-driven-development/code-quality-reviewer-prompt.md` (línea 27)

- [ ] **Step 1: Reemplazar el formato de retorno**

Reemplazar la línea:

```markdown
**Code reviewer returns:** Strengths, Issues (Critical/Important/Minor), Assessment
```

por:

```markdown
**Code reviewer returns (Report Contract — reemplaza el retorno en prosa Strengths/Issues/Assessment):**

    verdict: approved | issues
    - file:line — <critical|important|minor> — <problem ≤12 words>. <fix ≤8 words>.
    totals: <N critical / N important / N minor>
    sensors: overall: pass | fail — <new findings, if any>
    ledger: <N findings, M wins emitted> | skipped (awm not on PATH)

One `-` line per issue, sorted file → line ascending; omit the list when verdict is approved. No process narration, no prose paragraphs; code and technical names byte-exact; never invent abbreviations. Strengths worth keeping go to the ledger as wins, not to the report.

**Auto-clarity (exception):** security findings that need context get a short normal-prose note AFTER the contract.
```

- [ ] **Step 2: Verificar (contrato presente, gates intactos)**

Run: `grep -c 'Report Contract' skills/subagent-driven-development/code-quality-reviewer-prompt.md && grep -c 'awm ledger add' skills/subagent-driven-development/code-quality-reviewer-prompt.md && grep -c 'awm sensors run' skills/subagent-driven-development/code-quality-reviewer-prompt.md`  # verifies R8.3
Expected: `1`, `2`, `≥1`

- [ ] **Step 3: Commit**

```bash
git add skills/subagent-driven-development/code-quality-reviewer-prompt.md
git commit -m "feat(sdd): Report Contract compacto en code-quality-reviewer-prompt (R8.3)"
```

---

### Task 10: Límites de longitud en deep-review-prompt (QA)

_Requirements: R8.7_

**Files:**
- Modify: `skills/post-implementation-qa/deep-review-prompt.md` (sección `## Output Format`, tras el bloque JSON de "no issues" línea ~128)

- [ ] **Step 1: Agregar límites de longitud**

En la sección `## Output Format`, inmediatamente después del bloque:

````markdown
If no issues found:
```
{ "findings": [], "summary": "No issues found on this track/lens." }
```
````

insertar:

```markdown
Length limits (compact output — the controller's context pays for every word):
- `title` ≤ 12 words. `detail` ≤ 25 words. `summary` one line.
- `detail` must NOT repeat `evidence` — state the what/where once.
- No filler, no hedging, fragments OK. Code, error strings, and technical names byte-exact.
```

- [ ] **Step 2: Verificar (límites presentes, JSON y ledger intactos)**

Run: `grep -c 'Length limits' skills/post-implementation-qa/deep-review-prompt.md && grep -c 'awm ledger add' skills/post-implementation-qa/deep-review-prompt.md && grep -c '"findings"' skills/post-implementation-qa/deep-review-prompt.md`  # verifies R8.7
Expected: `1`, `3` (las tres instrucciones de ledger intactas), `≥2` (formato JSON intacto)

- [ ] **Step 3: Commit**

```bash
git add skills/post-implementation-qa/deep-review-prompt.md
git commit -m "feat(post-qa): límites de longitud en deep-review-prompt (R8.7)"
```

---

### Task 11: Bumps de bundle y catalog (+ alineación de versiones divergentes)

_Requirements: R9.2_

**Files:**
- Modify: `bundles/dev/bundle.json` (campo `version`)
- Modify: `catalog.json` (entrada `dev`)

**Nota:** hoy `catalog.json` dice `dev: 1.2.0` pero `bundles/dev/bundle.json` dice `1.1.0` — divergieron en commits previos. Este task los alinea en `1.3.0`.

- [ ] **Step 1: Bump en bundle.json**

En `bundles/dev/bundle.json`, cambiar `"version": "1.1.0"` por `"version": "1.3.0"`.

- [ ] **Step 2: Bump en catalog.json**

En `catalog.json`, en la línea del bundle `dev`, cambiar `"version": "1.2.0"` por `"version": "1.3.0"`.

- [ ] **Step 3: Verificar**

Run: `python3 -c "import json; b=json.load(open('bundles/dev/bundle.json')); c=json.load(open('catalog.json')); dev=[x for x in c['bundles'] if x['name']=='dev'][0]; assert b['version']=='1.3.0' and dev['version']=='1.3.0', (b['version'], dev['version']); print('OK 1.3.0 alineado')"`  # verifies R9.2
Expected: `OK 1.3.0 alineado`

- [ ] **Step 4: Commit**

```bash
git add bundles/dev/bundle.json catalog.json
git commit -m "chore(release): bundle dev y catalog a 1.3.0 alineados (R9.2)"
```

---

### Task 12: Sweep de verificación estructural (gates intactos)

_Requirements: R7.1, R8.4, R8.8, R9.1, R9.2_

**Files:**
- Ninguno (solo verificación; no produce cambios)

- [ ] **Step 1: Verificar lectores y secciones (R9.1)**

Run:
```bash
for s in development-process subagent-driven-development post-implementation-qa harness-retro finishing-a-development-branch; do
  printf '%s: ' "$s"; grep -c 'Modo desatendido' "skills/$s/SKILL.md"
done
```
Expected: cada skill reporta `≥1` (los 5 lectores tienen su sección).

- [ ] **Step 2: Verificar gates intactos en templates (R7.1, R8.4)**

Run:
```bash
grep -c 'awm ledger add' skills/subagent-driven-development/spec-reviewer-prompt.md \
  skills/subagent-driven-development/code-quality-reviewer-prompt.md \
  skills/post-implementation-qa/deep-review-prompt.md
grep -c 'awm sensors run' skills/subagent-driven-development/implementer-prompt.md \
  skills/subagent-driven-development/code-quality-reviewer-prompt.md
grep -c 'Reconciliation Gate' skills/subagent-driven-development/SKILL.md
```
Expected: `2`, `2`, `3` / `≥2`, `≥1` / `1` — idénticos a los valores pre-cambio (ninguna instrucción de gate se perdió).

- [ ] **Step 3: Verificar contratos no condicionados por modo (R8.8)**

Run: `grep -c 'desatendido' skills/subagent-driven-development/implementer-prompt.md skills/subagent-driven-development/spec-reviewer-prompt.md skills/subagent-driven-development/code-quality-reviewer-prompt.md skills/post-implementation-qa/deep-review-prompt.md`
Expected: `0` en los 4 templates (los contratos aplican en ambos modos).

- [ ] **Step 4: Verificar versiones (R9.2)**

Run: `grep -H 'version:' skills/writing-plans/SKILL.md skills/development-process/SKILL.md skills/subagent-driven-development/SKILL.md skills/post-implementation-qa/SKILL.md skills/harness-retro/SKILL.md skills/finishing-a-development-branch/SKILL.md`
Expected: `1.2.0`, `1.1.0`, `1.3.0`, `1.2.0`, `2.1.0`, `1.1.0` respectivamente.

- [ ] **Step 5: Commit (solo si hubo correcciones)**

Si algún check falló y hubo que corregir, commitear la corrección con mensaje `fix(sweep): <qué se corrigió>`. Si todo pasó, no hay commit.

---

### Task 13: Shakedown E2E — POST-RELEASE (no ejecutable por subagentes de este plan)

_Requirements: R10.1_

**⚠️ Este task se ejecuta DESPUÉS de: merge del PR → tag `v1.3.0` → `awm update` en la máquina. No es ejecutable durante la fase SDD de este plan — queda documentado aquí como criterio de aceptación del issue #5 y se corre en la fase de validación post-release.**

**Files:**
- Ninguno en este repo (se ejecuta en el proyecto de laboratorio `~/Developments/personal/test-awm`)

- [ ] **Step 1: Instalar la versión nueva**

Run: `awm update && ls -la ~/.claude/skills/writing-plans` (symlink debe apuntar al registry actualizado)
Expected: registry en `v1.3.0`.

- [ ] **Step 2: Preparar un mini-plan desatendido en test-awm**

En `test-awm`, crear una mini-feature con plan cuyo header incluya `**Modo de ejecución:** desatendido` + el blockquote canónico (generado vía `writing-plans`).

- [ ] **Step 3: Ejecutar la cadena completa**

Invocar `development-process` y dejar correr sin intervenir.

- [ ] **Step 4: Verificar el checklist de aceptación**

- Cero preguntas entre ejecución → QA → retro → finishing.
- PR creado automáticamente (Opción 2).
- `awm sensors run` en verde en los gates.
- Ledger creció durante reviews y fue archivado (`.awm/ledger/archive/`).
- Markers `awm-qa-complete` y `awm-retro-complete` presentes en el plan.
- Reportes de subagentes en formato Report Contract (no prosa).
- Descartes del retro (si hubo) documentados en `docs/harness-retros.md`.

Expected: checklist completo. Si algo falla → `systematic-debugging` + fix en el registry + nuevo tag patch.

---

## Traceability Matrix

| Req | Task(s) | Verificación |
|------|---------|--------------|
| R1.1 | T1 | T1.S4 grep campo; T13 shakedown |
| R1.2 | T1 | T1.S4 grep mandato |
| R1.3 | T2 ([BLOQUE LECTOR] en los 5 lectores: T2-T6) | T12.S1; T13 |
| R1.4 | T2-T6 ([BLOQUE LECTOR]) | T12.S1; T13 |
| R2.1 | T2 | T2.S4; T13 |
| R2.2 | T2 | T2.S4 (texto "SIEMPRE interactivas") |
| R3.1 | T3 | T3.S4; T13 |
| R3.2 | T3 | T3.S4 (sección afirma continuo en ambos modos) |
| R3.3 | T3 | T3.S4 (BLOCKED nunca se salta) |
| R4.1 | T4 | T4.S5; T13 |
| R4.2 | T4 | T4.S5 + T12.S2 |
| R5.1 | T5 | T5.S5; T13 |
| R5.2 | T5 | T5.S5 grep Descartes; T13 |
| R5.3 | T5 | T5.S5 + T12.S2 |
| R6.1 | T6 | T6.S4; T13 |
| R6.2 | T6 | T6.S4 (tests rojos → STOP) |
| R6.3 | T6 | T6.S4 (Discard inaccesible) |
| R7.1 | T2-T6 (frase en [BLOQUE LECTOR]) | T12.S2 |
| R8.1 | T7 | T7.S2 |
| R8.2 | T8 | T8.S2 |
| R8.3 | T9 | T9.S2 |
| R8.4 | T7-T10 (preservación) | T12.S2 |
| R8.5 | T7-T9 (auto-clarity) | T7.S2/T8.S2/T9.S2 grep contrato |
| R8.6 | T7-T9 (reglas de estilo) | T7.S2/T8.S2/T9.S2 |
| R8.7 | T10 | T10.S2 |
| R8.8 | T7-T10 | T12.S3 |
| R9.1 | T2-T6 | T12.S1 |
| R9.2 | T1-T6 (frontmatter) + T11 | T12.S4 + T11.S3 |
| R10.1 | T13 (post-release) | T13.S4 checklist |
