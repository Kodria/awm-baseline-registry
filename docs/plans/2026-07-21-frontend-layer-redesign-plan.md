# Frontend Layer Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rediseñar la capa frontend de AWM: contrato artifact-first en ui-design, acceso a Stitch por capas (MCP → CLI → offline), integración de ui-ux-pro-max, gate de fidelidad visual (design-fidelity) y propagación de skills a subagentes.

**Architecture:** Todo es contenido del registry `awm-baseline-registry` (skills Markdown + scripts + bundles JSON); cero cambios en el CLI de AWM. La fase de diseño materializa artefactos commiteados (`.stitch/designs/<slug>.html+png` + tokens) que la implementación consume sin Stitch; la cadena plan→subagente propaga skills y artefactos vía campos del plan y bloques del implementer-prompt.

**Tech Stack:** Markdown (SKILL.md), Bash (fetch-stitch.sh, resolución de rutas), Python 3 stdlib (ui-ux-pro-max), JSON (bundles/catalog).

**Spec:** `docs/plans/2026-07-21-frontend-layer-redesign-design.md` (requirements R1–R8)

**Modo de ejecución:** desatendido

> Mandato de ejecución desatendida: ejecución completa sin pausas de check-in
> entre tareas, ni de confirmación entre fases (development-process rutea
> automáticamente y subagent-driven-development no pregunta si continuar con
> el cierre). harness-retro triagea con criterio propio del agente (solo valor
> real, recurrente o sistémico — descarta el resto sin preguntar).
> post-implementation-qa corrige TODOS los hallazgos que surjan, no solo algunos.
> finishing-a-development-branch crea el PR directamente (opción "push + PR"),
> sin presentar el menú de 4 opciones.

**Working dir:** `/Users/cencosud/Developments/personal/awm-baseline-registry` (rama `feature/frontend-redesign`)

**Regla dura del repo:** NUNCA tocar `~/.awm` ni `~/.claude/skills`. Todo se edita en el registry; la distribución es `commit → tag → awm update`.

---

### Task 1: Spike del CLI stitch-mcp (bloqueante para Task 4)

_Requirements: R2.2_

**Files:**
- Create: `docs/plans/2026-07-21-stitch-cli-spike.md`

El texto de la capa 2 de ui-design depende de la sintaxis real del CLI. Requiere `STITCH_API_KEY` exportada (pedirla al usuario si no está en el entorno).

- [ ] **Step 1: Verificar invocación básica**

```bash
export STITCH_API_KEY="<pedir al usuario>"
npx -y @_davideast/stitch-mcp tool list_projects
```
Expected: JSON (o tabla) con los proyectos del usuario. Registrar el formato exacto de salida.

- [ ] **Step 2: Verificar paso de argumentos y cobertura de tools**

Probar, registrando la sintaxis exacta que funcione (posicional, `--args '{...}'`, o flags):

```bash
npx -y @_davideast/stitch-mcp tool                     # sin nombre: debe listar tools disponibles
npx -y @_davideast/stitch-mcp tool get_project         # probar cómo pasa projectId
npx -y @_davideast/stitch-mcp tool get_screen          # probar projectId + screenId
npx -y @_davideast/stitch-mcp tool generate_screen_from_text   # probar projectId + prompt + deviceType
```
Expected: confirmar cobertura mínima: `list_projects`, `create_project`, `list_design_systems`, `create_design_system`, `generate_screen_from_text`, `get_screen`, `edit_screens`, `generate_variants`, `apply_design_system`. Confirmar que `get_screen` devuelve `htmlCode.downloadUrl` y `screenshot.downloadUrl` como el MCP.

- [ ] **Step 3: Escribir el resultado del spike**

Crear `docs/plans/2026-07-21-stitch-cli-spike.md` con: (a) tabla `tool → comando exacto` para cada tool cubierta, (b) formato de salida, (c) veredicto:
- **VIABLE_FULL** — el CLI cubre generación e iteración → capa 2 completa en Task 4.
- **VIABLE_DOWNLOAD_ONLY** — el CLI solo sirve para lectura/descarga → en Task 4, capa 2 se documenta solo para descarga de artefactos de proyectos ya generados, y el diseño interactivo sin MCP cae a capa 3.
- **NOT_VIABLE** — el CLI no funciona → Task 4 documenta capa 2 como "no disponible" y la cadena queda MCP → offline.

- [ ] **Step 4: Commit**

```bash
git add docs/plans/2026-07-21-stitch-cli-spike.md
git commit -m "docs: spike results for stitch-mcp CLI (layer 2 access)"
```

---

### Task 2: Integrar ui-ux-pro-max al registry

_Requirements: R1.1, R1.2, R1.3_

**Files:**
- Create: `skills/ui-ux-pro-max/` (copia física completa)
- Modify: `skills/ui-ux-pro-max/SKILL.md`
- Test: `skills/ui-ux-pro-max/scripts/validate_data.py`, `skills/ui-ux-pro-max/scripts/tests/test_core.py`

- [ ] **Step 1: Copiar la skill (siguiendo el symlink)**

```bash
cp -RL /Users/cencosud/Developments/personal/agentic-workflow/.agents/skills/ui-ux-pro-max skills/ui-ux-pro-max
ls skills/ui-ux-pro-max
```
Expected: `SKILL.md  data  references  scripts` (con `data/stacks/` de 22 CSVs y `scripts/tests/`).

- [ ] **Step 2: Correr los tests ANTES de editar (baseline verde)**

```bash
python3 skills/ui-ux-pro-max/scripts/validate_data.py
python3 skills/ui-ux-pro-max/scripts/tests/test_core.py
```
Expected: ambos exit 0 (validator sin findings; unittest OK). Si fallan, detenerse y reportar — la fuente está rota.

- [ ] **Step 3: Editar frontmatter — añadir version**

En `skills/ui-ux-pro-max/SKILL.md`, el frontmatter pasa de `name` + `description` a incluir `version: "1.0.0"` (línea 2, mismo patrón que las demás skills del registry):

```yaml
---
name: ui-ux-pro-max
version: "1.0.0"
description: "UI/UX design intelligence for web and mobile. Searchable local database with 84 styles, ..."
---
```
(La description no cambia.)

- [ ] **Step 4: Reemplazar la sección "Running the search tool" por resolución portable**

Reemplazar la sección completa (líneas 37–45 del original) por:

````markdown
## Running the search tool

The search script lives inside this skill's own directory, not the project directory. Resolve the skill root once per session (first match wins — AWM installs are directory symlinks, so executing through them works; no `readlink` needed):

```bash
UIPRO=""
for d in "$HOME/.claude/skills/ui-ux-pro-max" ".claude/skills/ui-ux-pro-max" ".agents/skills/ui-ux-pro-max"; do
  [ -f "$d/scripts/search.py" ] && UIPRO="$d" && break
done
python3 "$UIPRO/scripts/search.py" "<query>" --domain <domain>
```

If `python3` is not found, try `python`, then `py -3`. Requires Python 3.x, no external dependencies.
````

- [ ] **Step 5: Reemplazar las invocaciones restantes**

Todas las demás ocurrencias de `python "${CLAUDE_PLUGIN_ROOT}/.claude/skills/ui-ux-pro-max/scripts/search.py"` (Steps 2, 2b, 2c, 3, 4 y Example Workflow del SKILL.md) pasan a `python3 "$UIPRO/scripts/search.py"`:

```bash
sed -i '' 's|python "\${CLAUDE_PLUGIN_ROOT}/.claude/skills/ui-ux-pro-max/scripts/search.py"|python3 "$UIPRO/scripts/search.py"|g' skills/ui-ux-pro-max/SKILL.md
```

- [ ] **Step 6: Verificar limpieza de acoplamientos**

```bash
grep -c 'CLAUDE_PLUGIN_ROOT' skills/ui-ux-pro-max/SKILL.md   # verifies R1.2
grep -c 'README' skills/ui-ux-pro-max/SKILL.md               # verifies R1.3
grep -c 'version: "1.0.0"' skills/ui-ux-pro-max/SKILL.md     # verifies R1.1
```
Expected: `0`, `0`, `1`. (El "(see README ...)" desapareció con el reemplazo del Step 4.)

- [ ] **Step 7: Smoke test funcional post-edición**

```bash
python3 skills/ui-ux-pro-max/scripts/search.py "saas dashboard dark minimal" --design-system -p "Smoke Test" | head -30
python3 skills/ui-ux-pro-max/scripts/tests/test_core.py
```
Expected: salida de design system no vacía (pattern/style/colors); tests OK.

- [ ] **Step 8: Commit**

```bash
git add skills/ui-ux-pro-max
git commit -m "feat: add ui-ux-pro-max skill (portable paths, versioned) [R1]"
```

---

### Task 3: ui-design v2 — Step 0 de detección de capas de acceso

_Requirements: R2.1, R2.2, R2.3, R2.4, R2.5_

**Files:**
- Modify: `skills/ui-design/SKILL.md`

Depende de Task 1 (sintaxis CLI). Si el veredicto del spike fue `VIABLE_DOWNLOAD_ONLY` o `NOT_VIABLE`, ajustar el texto de la capa 2 según lo indicado en el veredicto.

- [ ] **Step 1: Actualizar frontmatter y description**

`version: "1.0.0"` → `version: "2.0.0"`. Description nueva (refleja capas y artefactos):

```yaml
description: "Design UI screens using Google Stitch with layered access (MCP, CLI via STITCH_API_KEY, or offline fallback). Reads screens from the design doc's ## UI Screens table, generates them one by one, downloads HTML+PNG artifacts to .stitch/designs/, and updates the design doc with artifact paths. Invoke after brainstorming when UI Screens section exists with pending screens."
```

- [ ] **Step 2: Insertar "Step 0: Access Detection" antes del actual "Step 1: Load Design Doc"**

````markdown
## Step 0: Access Detection

Decide the access layer BEFORE loading the design doc, and announce it to the user. Never abort the phase because Stitch is unreachable.

1. **Layer 1 — Stitch MCP:** if the Stitch MCP tools (`list_projects`, `generate_screen_from_text`, …) are available in your tool list → use them for every Stitch call in this skill. Announce: *"Stitch access: MCP (layer 1)."*
2. **Layer 2 — Stitch CLI:** if no MCP but `STITCH_API_KEY` is set and `npx` exists (`[ -n "$STITCH_API_KEY" ] && command -v npx`) → run every Stitch call through Bash: `npx -y @_davideast/stitch-mcp tool <tool_name> <args>`, using the exact syntax from the CLI reference table below. Same logical flow, same tool names. Announce: *"Stitch access: CLI via STITCH_API_KEY (layer 2)."*
3. **Layer 3 — Offline:** neither available → follow the **Offline Mode** section of this skill. Announce: *"Stitch access: none — offline mode (layer 3). Design system and mockups will be generated locally."*

**Mid-flow degradation:** if a layer-2 CLI call fails (non-zero exit, auth error), announce the failure and degrade to layer 3 for the remaining screens. Never degrade silently, and never mark the phase complete pretending Stitch output exists.
````

- [ ] **Step 3: Añadir la tabla de referencia CLI al final del SKILL.md**

Debajo de la "Stitch MCP Tools Reference" existente, añadir sección `## Stitch CLI Reference (Layer 2)` con la tabla `tool → comando exacto` producida por el spike de Task 1 (copiarla literal desde `docs/plans/2026-07-21-stitch-cli-spike.md`), más el requisito: `STITCH_API_KEY` se genera en Stitch → Settings → API key.

- [ ] **Step 4: Verificar**

```bash
grep -c "Step 0: Access Detection" skills/ui-design/SKILL.md   # verifies R2.1/R2.2/R2.3
grep -c "Announce" skills/ui-design/SKILL.md                    # verifies R2.4 (>=1)
grep -c "Mid-flow degradation" skills/ui-design/SKILL.md        # verifies R2.5
```
Expected: `1`, `>=1`, `1`.

- [ ] **Step 5: Commit**

```bash
git add skills/ui-design/SKILL.md
git commit -m "feat(ui-design): layered Stitch access detection (MCP/CLI/offline) [R2]"
```

---

### Task 4: ui-design v2 — consulta a ui-ux-pro-max y contrato de artefactos

_Requirements: R3.1, R3.2, R3.3, R3.4, R3.5, R3.6, R3.7_

**Files:**
- Modify: `skills/ui-design/SKILL.md`
- Create: `skills/ui-design/scripts/fetch-stitch.sh`

- [ ] **Step 1: Copiar fetch-stitch.sh (skill autocontenida)**

```bash
mkdir -p skills/ui-design/scripts
cp skills/react-components/scripts/fetch-stitch.sh skills/ui-design/scripts/fetch-stitch.sh
chmod +x skills/ui-design/scripts/fetch-stitch.sh
bash skills/ui-design/scripts/fetch-stitch.sh
```
Expected: la última línea imprime `Usage: ... <url> <output_path>` (exit 1) — el script funciona.

- [ ] **Step 2: Insertar "Step 2b: Design Intelligence" después del "Design system" del Step 2**

````markdown
### Step 2b: Design Intelligence (ui-ux-pro-max — all layers)

Before creating the design system and before generating any screen, consult the `ui-ux-pro-max` skill (invoke it with the Skill tool if not yet loaded):

1. Derive keywords from the design doc: product type + industry + tone (e.g. `"team management dashboard dark professional"`).
2. Run its `--design-system` search with `--persist --output-dir <project-root>` so `design-system/<slug>/MASTER.md` is written as the token artifact.
3. Use the result to drive Stitch:
   - `create_design_system` properties (colors, typography, roundness, colorMode) come from the recommended palette/font pairing.
   - Every `generate_screen_from_text` prompt is enriched with the recommended style vocabulary (style name, key effects, anti-patterns to avoid) — concrete words beat vague vibes.
````

- [ ] **Step 3: Insertar "3e. Download artifacts" después de "3d. Approve"**

````markdown
### 3e. Download artifacts (MANDATORY — a screen is not `completed` without them)

Immediately after the user approves a screen:

1. Call `get_screen` for the approved screen; extract `htmlCode.downloadUrl` and `screenshot.downloadUrl`.
2. Download both to the repo (create the directory on first use — and if `.gitignore` excludes `.stitch/`, surface it and resolve with the user before continuing):

```bash
mkdir -p .stitch/designs
bash <skill-dir>/scripts/fetch-stitch.sh "<htmlCode.downloadUrl>" ".stitch/designs/<screen-slug>.html"
bash <skill-dir>/scripts/fetch-stitch.sh "<screenshot.downloadUrl>=w1600" ".stitch/designs/<screen-slug>.png"
```

(The `=w{width}` suffix requests full resolution instead of a thumbnail. Use the design's device width: 1600 desktop, 800 mobile.)

3. Verify both files exist and are non-empty (`ls -la .stitch/designs/`). If either download fails, retry once; if it still fails, the screen stays `pending` and you report the failure — do NOT mark it `completed`.
4. Only approved screens get artifacts — never download discarded variants.
````

- [ ] **Step 4: Reemplazar la tabla del "Step 4: Update Design Doc"**

El bloque de ejemplo de tabla pasa a incluir la columna `Artifacts`, y el commit incluye los artefactos:

````markdown
```markdown
## UI Screens

> Stitch Project: `projects/{projectId}`

| Screen | Description | Device | Status | Stitch Screen | Artifacts |
|--------|-------------|--------|--------|---------------|-----------|
| Login  | Login screen with email and OAuth | MOBILE | completed | screens/xyz1 | .stitch/designs/login.html · .stitch/designs/login.png |
```

3. Commit the design doc AND the artifacts together:

```bash
git add docs/plans/<design-doc-filename>.md .stitch/designs/ design-system/
git commit -m "docs: design phase artifacts (screens + tokens) for <feature>"
```
````

- [ ] **Step 5: Reemplazar el principio "References only" en Key Principles**

La línea `- **References only** — Store Stitch IDs in the design doc, don't download screenshots or HTML to the repo.` se reemplaza por:

```markdown
- **Artifact-first** — Every approved screen materializes `.stitch/designs/<slug>.html` + `.png` committed to the repo. Implementation consumes ONLY these artifacts; Stitch (MCP or CLI) is never needed after this phase.
```

Actualizar también el checklist del inicio (ítem 3 pasa a "Design screens — generate, iterate, **download artifacts**") y el ítem 4 ("Update design doc — table with artifact paths, commit doc + artifacts").

- [ ] **Step 6: Verificar**

```bash
grep -c "3e. Download artifacts" skills/ui-design/SKILL.md      # verifies R3.1
grep -c "do NOT mark it \`completed\`" skills/ui-design/SKILL.md # verifies R3.2
grep -c "| Artifacts |" skills/ui-design/SKILL.md               # verifies R3.3
grep -c "git add docs/plans/<design-doc-filename>.md .stitch/designs/ design-system/" skills/ui-design/SKILL.md  # verifies R3.4
grep -c "gitignore" skills/ui-design/SKILL.md                   # verifies R3.5 (>=1)
grep -c "Step 2b: Design Intelligence" skills/ui-design/SKILL.md # verifies R3.6
grep -c "Artifact-first" skills/ui-design/SKILL.md              # verifies R3.7 (>=1)
grep -c "References only" skills/ui-design/SKILL.md             # expected 0
```
Expected: `1,1,1,1,>=1,1,>=1,0`.

- [ ] **Step 7: Commit**

```bash
git add skills/ui-design
git commit -m "feat(ui-design): artifact-first contract + ui-ux-pro-max intelligence [R3]"
```

---

### Task 5: ui-design v2 — Offline Mode (capa 3)

_Requirements: R4.1, R4.2, R4.3_

**Files:**
- Modify: `skills/ui-design/SKILL.md`

- [ ] **Step 1: Añadir la sección "Offline Mode" antes de "Key Principles"**

````markdown
## Offline Mode (Layer 3)

When no Stitch access exists, this skill still fulfills the same artifact contract — locally.

1. **Tokens:** run ui-ux-pro-max (Step 2b applies identically) with `--design-system --persist --output-dir <project-root>` → `design-system/<slug>/MASTER.md`.
2. **Mockups:** for each `pending` screen, invoke the `impeccable` skill's `craft` sub-command (which runs `shape` internally as its own Step 1, then continues to build the artifact — `shape` alone is design-planning-only and never emits a file) to produce a **static, self-contained HTML mockup** at `.stitch/designs/<screen-slug>.html`, using `MASTER.md` tokens + the screen's Description as the brief; in `craft`'s Step 0, choose the "Single index.html" greenfield option so it outputs a static file rather than scaffolding a framework project. One screen at a time; present to the user; iterate until approved (same 3b–3d loop, with impeccable edits instead of `edit_screens`).
3. **PNG:** if a browser tool (Playwright MCP) is available: navigate to `file://<abs-path>/.stitch/designs/<slug>.html`, resize to the device width (1600 desktop / 390 mobile), screenshot → `.stitch/designs/<slug>.png`. If no browser is available, record `png: n/a (offline, no browser)` in the Artifacts column — an explicit degradation, never a silent one.
4. **Design doc:** same Step 4 table and commit; the `Stitch Screen` column reads `offline`.

**HARD-GATE carve-out:** the HTML mockup under `.stitch/designs/` is a *design artifact*, not implementation. Application source code remains forbidden in this skill.
````

- [ ] **Step 2: Verificar**

```bash
grep -c "Offline Mode (Layer 3)" skills/ui-design/SKILL.md       # verifies R4.1/R4.2
grep -c "png: n/a (offline" skills/ui-design/SKILL.md            # verifies R4.3
grep -c "HARD-GATE carve-out" skills/ui-design/SKILL.md          # verifies R4.2 (mockup ≠ implementation)
```
Expected: `1` (o `2` si Step 0 la referencia), `>=1`, `1`.

- [ ] **Step 3: Commit**

```bash
git add skills/ui-design/SKILL.md
git commit -m "feat(ui-design): offline mode — local tokens + impeccable mockups [R4]"
```

---

### Task 6: Cablear frontend-craft a artefactos y ui-ux-pro-max

_Requirements: R5.1, R5.2_

**Files:**
- Modify: `skills/frontend-craft/SKILL.md`

- [ ] **Step 1: Bump version y knowledge base**

`version: "1.0.0"` → `"1.1.0"`. En "## Knowledge base", añadir tercer bullet:

```markdown
- `ui-ux-pro-max` (skill) — searchable design database (styles, palettes, font pairings, UX guidelines, stack rules). Query it via its search script for any color/typography/UX decision not answered by the Design Direction.
```

- [ ] **Step 2: Reescribir "## When invoked" pasos 1–2**

El paso 1 actual se reemplaza por (y el resto se renumera):

```markdown
1. **Ground truth first.** If `.stitch/designs/` contains artifacts for the surface you are touching (`<slug>.html` / `<slug>.png`), they are the visual ground truth: Read the PNG (it is an image — look at it) and the HTML BEFORE any inference. Match them.
2. **Read the Design Direction.** If the design doc has a `## Design Direction` section (from brainstorming), treat it as the brief. If absent, infer it using `reference/design-taste-frontend.md` §0 (Read the Room) before writing UI.
3. **Apply the always-on rules** [texto actual sin cambios]
4. **Consult ui-ux-pro-max before escalating.** For color/typography/UX decisions the Design Direction does not answer, query ui-ux-pro-max (`--domain color|typography|ux`) and use the results. Include them in the escalation contract when handing off to impeccable.
5. **Decide depth:** [texto actual del paso 3]
6. **Self-check** [texto actual del paso 4]
```

- [ ] **Step 3: Verificar**

```bash
grep -c "Ground truth first" skills/frontend-craft/SKILL.md          # verifies R5.1
grep -c "Consult ui-ux-pro-max before escalating" skills/frontend-craft/SKILL.md  # verifies R5.2
```
Expected: `1`, `1`.

- [ ] **Step 4: Commit**

```bash
git add skills/frontend-craft/SKILL.md
git commit -m "feat(frontend-craft): design artifacts as ground truth + ui-ux-pro-max consult [R5]"
```

---

### Task 7: Crear la skill design-fidelity

_Requirements: R6.1, R6.2, R6.3, R6.4, R6.5_

**Files:**
- Create: `skills/design-fidelity/SKILL.md`

- [ ] **Step 1: Escribir el SKILL.md completo**

````markdown
---
name: design-fidelity
version: "1.0.0"
description: Use after implementing a UI screen that has committed design artifacts (.stitch/designs/), or when the user asks to verify an implementation against its design. Compares the running implementation against the design PNG/HTML element by element, drives a fix loop until convergence. Also dispatched by post-implementation-qa as a conditional lens for UI diffs.
---

# Design Fidelity Gate

Verifies that an implemented screen matches its committed design artifacts. Evidence-based: screenshots and element inventories, never impressions.

**Announce at start:** "I'm using the design-fidelity skill to verify the implementation against the design."

## Preconditions

1. `.stitch/designs/<slug>.html` (+ `.png` when available) exist for the screen(s) under review. If not → report "no design artifacts; design-fidelity does not apply" and stop.
2. The app runs locally (dev server or built output). If it cannot run, only the structural checklist (Step 2) applies and the verdict is capped at `NOT_CERTIFIED`.

## Procedure (per screen)

### Step 1: Load the design
- Read `.stitch/designs/<slug>.png` with the Read tool — it is an image; look at it.
- Read `.stitch/designs/<slug>.html`.

### Step 2: Build the element inventory
From the design HTML + PNG, list every major element with a stable number: regions (header, nav, sidebar, footer), interactive elements (search bar, buttons, filters), content blocks (cards, tables, stats, charts), and notable styling traits (typography scale, density, color accents). This inventory is the checklist — write it down before looking at the implementation.

### Step 3: Capture the implementation
Requires a browser tool (Playwright MCP):
1. Navigate to the implemented route.
2. Resize to the design's width (e.g. 1600 desktop / 390 mobile — infer from the PNG dimensions or the design doc's Device column).
3. Screenshot → `.stitch/verification/<slug>-impl.png` (create the directory; it may be gitignored — that is fine, it is evidence, not a deliverable).

**No browser available?** Skip to Step 4 using the implementation's source code instead of a screenshot, and cap the verdict at `NOT_CERTIFIED`.

### Step 4: Compare element by element
Read BOTH images in the same turn (design PNG, implementation PNG) and walk the inventory. Classify each element:
- `present` — exists and visually matches (position, content type, prominence).
- `diverged` — exists but differs meaningfully (wrong position, missing content, wrong density/typography/color role).
- `missing` — not in the implementation at all.

### Step 5: Report

```markdown
## Design Fidelity Report — <screen>
Design: .stitch/designs/<slug>.png · Implementation: .stitch/verification/<slug>-impl.png

| # | Element (from design) | Status | Divergence | Severity |
|---|----------------------|--------|------------|----------|
| 1 | Header with search + avatar | missing | not implemented | high |
| 2 | Week calendar grid | diverged | cells show bare number chips instead of titled task cards | high |

**Verdict:** CONVERGED | DIVERGENT (N elements pending) | NOT_CERTIFIED (no browser evidence)
```

### Step 6: Fix loop
While the verdict is DIVERGENT:
1. For each `missing`/`diverged` element (highest severity first), implement the fix (or dispatch it to the executing skill/subagent that owns implementation).
2. Re-run Steps 3–5 for the affected screen.
3. An element may only leave the list by becoming `present` or by **explicit user waiver** (record "waived by user" in the report).

The gate passes ONLY with verdict `CONVERGED` (all elements `present` or waived). `NOT_CERTIFIED` is never a pass — state it explicitly to whoever invoked the skill.

## Red Flags

| Temptation | Reality |
|------------|---------|
| "It looks close enough" | Walk the inventory. Every element gets a status. |
| "No browser, but the code looks right" | That is `NOT_CERTIFIED`, not a pass. Say so. |
| "The design PNG is just a reference" | The PNG is the contract. Divergence needs a fix or an explicit user waiver. |
````

- [ ] **Step 2: Verificar**

```bash
grep -c "element inventory" skills/design-fidelity/SKILL.md      # verifies R6.2 (>=1)
grep -c "browser_" skills/design-fidelity/SKILL.md; grep -c "Screenshot" skills/design-fidelity/SKILL.md  # verifies R6.3 (>=1 en el segundo)
grep -c "explicit user waiver" skills/design-fidelity/SKILL.md   # verifies R6.4 (>=1)
grep -c "NOT_CERTIFIED" skills/design-fidelity/SKILL.md          # verifies R6.5 (>=3)
```

- [ ] **Step 3: Commit**

```bash
git add skills/design-fidelity
git commit -m "feat: add design-fidelity skill — visual convergence gate [R6]"
```

---

### Task 8: Lente condicional en post-implementation-qa

_Requirements: R6.6_

**Files:**
- Modify: `skills/post-implementation-qa/SKILL.md`
- Modify: `skills/post-implementation-qa/deep-review-prompt.md`

> **Nota agregada durante ejecución (post Task 7 review):** la revisión de Task 7 confirmó que `deep-review-prompt.md` define un enum CERRADO para `"lens"` (`robustness|logic|tests`, línea ~123) y que la tabla de lentes/lógica de tier de `post-implementation-qa/SKILL.md` no mencionan `design-fidelity`. Una fila de tabla sola (el Step 1 original de esta task) NO hace que la lente sea despachable de verdad — faltan el template block y la extensión del enum. Esta task ahora cierra ambos lados: registro real (Steps 1b/1c nuevos) + la fila/red-flag original.

- [ ] **Step 1: Añadir la fila a la tabla de lentes del Track B**

En la tabla `| Lens | Looks for |` (línea ~63 de `SKILL.md`), añadir:

```markdown
| Design fidelity *(conditional: only when the diff touches UI and `.stitch/designs/` exists)* | Divergence between the implemented screens and their committed design artifacts — invoke the `design-fidelity` skill; its per-element findings enter the fix loop like any other Track B finding |
```

- [ ] **Step 1b: Extender el enum y añadir el template block en `deep-review-prompt.md`**

1. En la línea que define el enum de lens (`"lens"` to `robustness` | `logic` | `tests`), extenderla a `robustness` | `logic` | `tests` | `design-fidelity`.
2. Añadir un nuevo bloque de template, paralelo a los 3 existentes (Track B — Robustness/Security, Logic correctness, Tests), por ejemplo:

```markdown
## Track B — Design Fidelity lens subagent

​```
## Your Job (Track B — Design Fidelity lens)

Only dispatch this lens when the diff touches UI and `.stitch/designs/` artifacts exist for the affected screen(s).

Invoke the `design-fidelity` skill's comparison procedure (Steps 1-4: load design, build element inventory, capture implementation, compare element by element) for each affected screen. Each element with status `missing`/`diverged` is a finding — map severity per design-fidelity's rubric (high/medium/low → blocker/important/minor). Elements marked `present` are not findings.

If `design-fidelity`'s verdict is `NOT_CERTIFIED` (no browser evidence), report ONE finding at `important` severity stating certification could not be completed — do not silently omit this.
​```
```

(Ajustar la sintaxis exacta de fences según el resto del archivo — leer `deep-review-prompt.md` primero para igualar el estilo de los otros 3 bloques.)

- [ ] **Step 1c: Añadir design-fidelity a la lógica de tier en `SKILL.md`**

En la sección "Tier (which lenses to run)" (línea ~154-157), añadir una regla: la lente Design Fidelity se dispara SOLO cuando el diff toca UI Y existen artefactos `.stitch/designs/` para la(s) pantalla(s) afectada(s) — independientemente del tier (trivial/multi-file), ya que es condicional a la señal de UI, no al tamaño del diff.

- [ ] **Step 2: Añadir red flag**

En la tabla/sección de Red Flags del skill, añadir:

```markdown
| "UI diff with `.stitch/designs/` present, no fidelity report" | QA is incomplete — dispatch the design-fidelity lens before closing |
```

- [ ] **Step 3: Bump version (minor) del frontmatter y verificar**

```bash
grep -c "design-fidelity" skills/post-implementation-qa/SKILL.md   # verifies R6.6 (>=2)
grep -c "design-fidelity" skills/post-implementation-qa/deep-review-prompt.md  # verifies R6.6 registration (>=2: enum + template block)
```

- [ ] **Step 4: Commit**

```bash
git add skills/post-implementation-qa/SKILL.md skills/post-implementation-qa/deep-review-prompt.md
git commit -m "feat(qa): conditional design-fidelity lens for UI diffs [R6.6]"
```

---

### Task 9: Campos Skills / Design artifacts en writing-plans

_Requirements: R7.1_

**Files:**
- Modify: `skills/writing-plans/SKILL.md`

- [ ] **Step 1: Extender el Task Structure**

En el bloque de ejemplo del `## Task Structure` (tras `**Files:**` y su lista), añadir:

````markdown
**Skills:** frontend-craft, ui-ux-pro-max            ← skills the implementer MUST invoke (omit line if none)
**Design artifacts:** .stitch/designs/login.html, .stitch/designs/login.png   ← UI tasks only
````

Y debajo del bloque "Requirement traceability tag", añadir el párrafo normativo:

```markdown
**Skill & artifact propagation (UI tasks).** Any task that creates or modifies UI belonging to a designed screen MUST declare `**Skills:**` (at minimum `frontend-craft`) and `**Design artifacts:**` with the exact paths inherited from the design doc's `## UI Screens` Artifacts column. The execution controller copies both into the subagent prompt — a UI task without them ships an implementer who has never seen the design.
```

- [ ] **Step 2: Añadir el check al Self-Review**

En la sección `## Self-Review`, añadir ítem:

```markdown
**4. UI task propagation:** Does every task touching a designed screen declare `**Skills:**` and `**Design artifacts:**`? A UI task without them is a plan failure — fix it.
```

- [ ] **Step 3: Verificar y commit**

```bash
grep -c "Design artifacts:" skills/writing-plans/SKILL.md   # verifies R7.1 (>=2)
git add skills/writing-plans/SKILL.md
git commit -m "feat(writing-plans): per-task Skills and Design artifacts fields [R7.1]"
```

---

### Task 10: Propagación en subagent-driven-development

_Requirements: R7.2, R7.3_

**Files:**
- Modify: `skills/subagent-driven-development/implementer-prompt.md`
- Modify: `skills/subagent-driven-development/SKILL.md`

- [ ] **Step 1: Insertar bloques en implementer-prompt.md**

Entre `## Context` y `## Before You Begin` del template, insertar:

````markdown
    ## Required Skills

    This task declares required skills: [list from the plan task's **Skills:** field — omit this
    section entirely if the task declares none].
    Invoke each one with the Skill tool BEFORE implementing, and follow it. If the Skill tool
    is unavailable in your context, say so in your report's `concerns` — do NOT silently skip
    the skills.

    ## Design Artifacts (UI tasks only)

    Ground truth for this screen: [paths from the plan task's **Design artifacts:** field].
    - Read the PNG with the Read tool — it is an image; LOOK at it before writing any code.
    - Read the design HTML for structure, content and styling detail.
    - Implement to match. Before reporting DONE, list every major element visible in the
      design (header, search, cards, stats, …) and confirm each one exists in your
      implementation. Any element you cannot implement goes in `concerns`.
````

- [ ] **Step 2: Instrucción al controller en SKILL.md**

En la sección del SKILL.md de subagent-driven-development donde se describe el despacho del implementador (donde referencia `implementer-prompt.md`), añadir:

```markdown
When the plan task declares `**Skills:**` or `**Design artifacts:**`, copy both fields verbatim into the corresponding template sections (Required Skills / Design Artifacts). Omit the sections for tasks that do not declare them.
```

- [ ] **Step 3: Verificar y commit**

```bash
grep -c "Required Skills" skills/subagent-driven-development/implementer-prompt.md   # verifies R7.2 (>=1)
grep -c "do NOT silently skip" skills/subagent-driven-development/implementer-prompt.md  # verifies R7.3
git add skills/subagent-driven-development
git commit -m "feat(sdd): propagate required skills and design artifacts to implementer [R7.2 R7.3]"
```

---

### Task 11: SUBAGENT-POLICY en using-awm

_Requirements: R7.4_

**Files:**
- Modify: `skills/using-awm/SKILL.md:7-9`

- [ ] **Step 1: Reemplazar el bloque**

Las líneas 7–9:

```markdown
<SUBAGENT-STOP>
If you were dispatched as a subagent to execute a specific task, skip this skill.
</SUBAGENT-STOP>
```

pasan a:

```markdown
<SUBAGENT-POLICY>
If you were dispatched as a subagent to execute a specific task: skip the orchestration
skills (development-process, brainstorming, writing-plans, executing-plans,
subagent-driven-development, finishing-a-development-branch) — your controller owns
orchestration. But DO invoke:
1. Every skill your prompt declares as required.
2. The craft/verification skills your task triggers on its own signal: frontend-craft
   for UI surfaces, test-driven-development for implementation,
   verification-before-completion before reporting done, systematic-debugging on bugs.
</SUBAGENT-POLICY>
```

Bump `version` a `"1.1.0"`.

- [ ] **Step 2: Verificar y commit**

```bash
grep -c "SUBAGENT-STOP" skills/using-awm/SKILL.md    # expected 0
grep -c "SUBAGENT-POLICY" skills/using-awm/SKILL.md  # verifies R7.4 (2: apertura y cierre)
git add skills/using-awm/SKILL.md
git commit -m "feat(using-awm): replace SUBAGENT-STOP with SUBAGENT-POLICY [R7.4]"
```

---

### Task 12: Gate de instalación en development-process

_Requirements: R7.5_

**Files:**
- Modify: `skills/development-process/SKILL.md`

- [ ] **Step 1: Añadir el gate tras la tabla del Step 1 (Identify Project State)**

```markdown
### Frontend bundle gate

WHEN the detected state is **UI Design pending**, OR the active plan contains any `**Design artifacts:**` field, verify the frontend skills are installed before routing: the `ui-design` skill (and `frontend-craft`) must be available — check the skill list, or `ls ~/.claude/skills/ui-design .claude/skills/ui-design .agents/skills/ui-design 2>/dev/null`. IF absent, THEN stop and instruct:

> "This work needs the `frontend` bundle, which is not installed. Run `awm update && awm init` and select the frontend bundle for this project, then resume."

Do NOT improvise the phase without the skill.
```

- [ ] **Step 2: Actualizar la fila de fase 1.5**

La fila `| 1.5. UI Design | ... | Design doc updated with Stitch screen references |` pasa a Output: `Design doc updated with artifact paths + .stitch/designs/ committed`.

- [ ] **Step 3: Verificar y commit**

```bash
grep -c "Frontend bundle gate" skills/development-process/SKILL.md   # verifies R7.5
grep -c ".stitch/designs/ committed" skills/development-process/SKILL.md  # verifies R7.5 output fase 1.5
git add skills/development-process/SKILL.md
git commit -m "feat(development-process): frontend bundle install gate [R7.5]"
```

---

### Task 13: Eliminar code-to-design y actualizar bundles/catálogo

_Requirements: R8.1, R8.2, R8.3_

**Files:**
- Delete: `skills/code-to-design/`
- Modify: `bundles/frontend/bundle.json`, `bundles/dev/bundle.json`, `catalog.json`

- [ ] **Step 1: Eliminar la skill rota**

```bash
git rm -r skills/code-to-design
```

- [ ] **Step 2: Reescribir bundles/frontend/bundle.json**

```json
{
  "name": "frontend",
  "version": "2.0.0",
  "description": "Frontend craft and implementation layer: artifact-first Stitch design, design intelligence, and visual fidelity gate.",
  "scope": "project",
  "dependsOn": ["dev"],
  "skills": ["impeccable", "ui-design", "extract-design-md", "react-components", "frontend-craft", "ui-ux-pro-max", "design-fidelity"],
  "workflows": [],
  "agents": []
}
```

- [ ] **Step 3: Bump bundles/dev/bundle.json**

Solo cambia `"version": "1.3.0"` → `"1.4.0"` (las skills tocadas — using-awm, development-process, writing-plans, subagent-driven-development, post-implementation-qa — ya pertenecen a este bundle; la lista no cambia).

- [ ] **Step 4: Actualizar catalog.json**

```json
{
  "version": 1,
  "bundles": [
    { "name": "dev",       "source": "./bundles/dev",       "version": "1.4.0", "scope": "baseline" },
    { "name": "frontend",  "source": "./bundles/frontend",  "version": "2.0.0", "scope": "project" },
    { "name": "authoring", "source": "./bundles/authoring", "version": "1.0.0", "scope": "project" }
  ]
}
```

- [ ] **Step 5: Verificar**

```bash
ls skills/code-to-design 2>&1                     # verifies R8.1 — expected "No such file or directory"
grep -c "code-to-design" bundles/frontend/bundle.json   # verifies R8.1 — expected 0
python3 -c "import json; [json.load(open(f)) for f in ['catalog.json','bundles/frontend/bundle.json','bundles/dev/bundle.json']]; print('json ok')"  # verifies R8.2 — expected "json ok"
git diff --stat awm-registry.json | wc -l          # verifies R8.3 — expected 0 (sin cambios)
```

- [ ] **Step 6: Commit**

```bash
git add -A bundles catalog.json
git commit -m "feat: frontend bundle v2.0.0 (+ui-ux-pro-max, +design-fidelity, -code-to-design); dev v1.4.0 [R8]"
```

---

### Task 14: Verificación end-to-end en test-awm

_Requirements: R2.1, R2.2, R2.3, R3.7, R6.4, R7.2_

**Files:**
- Test: proyecto `/Users/cencosud/Developments/personal/test-awm` (no se commitea nada al registry en esta task)

> **DEFERIDA — no ejecutada en modo desatendido (2026-07-21).** El usuario pidió modo desatendido "hasta PR". Esta task requiere: (a) generar pantallas reales en la cuenta de Stitch del usuario (costo real de cuota/API, como ya ocurrió en el spike de Task 1), (b) crear y pushear un tag pre-release (`v1.4.0-rc.1`), (c) correr `awm update`/`awm init` contra un proyecto real. Son acciones con efecto externo visible y de costo real — fuera del alcance de "llegar al PR" sin confirmación explícita. Queda pendiente para que el usuario la ejecute (o autorice explícitamente) después de revisar el PR, antes del tag final `v1.4.0`.

Estos escenarios son manuales/asistidos (requieren Stitch real y sesiones separadas). Ejecutarlos ANTES del tag de release. Para que el entorno de prueba use la versión de la rama, seguir el mecanismo de instalación local que el usuario use para QA de registries (NUNCA editar `~/.awm` a mano — si `awm update` solo toma tags, crear un tag pre-release `v1.4.0-rc.1` y correr `awm update`).

- [ ] **Step 1: Escenario capa 1 (PC con MCP)** — feature con 1 pantalla: brainstorming → ui-design anuncia "layer 1" → pantalla aprobada → verificar `ls test-awm/.stitch/designs/` muestra `<slug>.html` y `<slug>.png` no vacíos y la tabla del design doc tiene columna `Artifacts` (verifies R2.1, R3.7).
- [ ] **Step 2: Escenario capa 2 (sesión sin MCP, con STITCH_API_KEY)** — misma feature, otra pantalla: ui-design anuncia "layer 2" y cumple el mismo contrato vía `npx @_davideast/stitch-mcp` (verifies R2.2). Si el spike dio `VIABLE_DOWNLOAD_ONLY`, validar en cambio que la descarga de artefactos de una pantalla ya generada funciona por CLI.
- [ ] **Step 3: Escenario capa 3 (sin MCP ni key)** — `unset STITCH_API_KEY`: ui-design anuncia "layer 3", genera `design-system/<slug>/MASTER.md` + mockup HTML + PNG por Playwright (verifies R2.3).
- [ ] **Step 4: Cadena de subagentes** — con el plan de la feature: verificar que la tarea UI declara `**Skills:**`/`**Design artifacts:**` y que el prompt del implementador (visible en la sesión) contiene los bloques `## Required Skills` y `## Design Artifacts` (verifies R7.2).
- [ ] **Step 5: Prueba negativa del gate** — implementar la pantalla omitiendo deliberadamente el header del diseño → correr QA → design-fidelity debe reportar el header como `missing` y forzar el fix loop hasta `CONVERGED` (verifies R6.4).
- [ ] **Step 6: Registrar resultados** — anotar los 5 resultados en `docs/plans/2026-07-21-frontend-layer-redesign-plan.md` (esta sección) como checkboxes marcados con una línea de evidencia cada uno.

---

### Task 15: Release

_Requirements: R8.2_

Solo tras QA (post-implementation-qa) + retro, vía `finishing-a-development-branch`:

- [ ] **Step 1:** PR de `feature/frontend-redesign` → `main` y merge (aprobación del usuario).
- [ ] **Step 2:** `git tag v1.4.0 && git push origin v1.4.0` (serie de tags del registry; sigue al bundle dev 1.4.0).
- [ ] **Step 3:** En las máquinas del usuario: `awm update`; en cada proyecto frontend: `awm init` para reconciliar el bundle project-scope v2.0.0.

---

## Traceability Matrix

| Req  | Task(s) | Verificación |
|------|---------|--------------|
| R1.1 | T2 | grep `version: "1.0.0"` en SKILL.md = 1 (T2·S6) |
| R1.2 | T2 | grep `CLAUDE_PLUGIN_ROOT` = 0 + smoke `--design-system` corre vía `$UIPRO` (T2·S6-7) |
| R1.3 | T2 | grep `README` = 0; texto de fallback `python`/`py -3` presente (T2·S4,S6) |
| R2.1 | T3, T14 | grep `Step 0: Access Detection` = 1; escenario capa 1 E2E (T14·S1) |
| R2.2 | T1, T3, T14 | spike doc con tabla de sintaxis; sección CLI en SKILL.md; escenario capa 2 E2E (T14·S2) |
| R2.3 | T3, T5, T14 | Step 0 rutea a Offline Mode; escenario capa 3 E2E (T14·S3) |
| R2.4 | T3 | grep `Announce` ≥1 en Step 0 (T3·S4) |
| R2.5 | T3 | grep `Mid-flow degradation` = 1 (T3·S4) |
| R3.1 | T4 | grep `3e. Download artifacts` = 1 (T4·S6) |
| R3.2 | T4 | grep ``do NOT mark it `completed` `` = 1 (T4·S6) |
| R3.3 | T4 | grep `| Artifacts |` = 1 (T4·S6) |
| R3.4 | T4 | grep del comando `git add ... .stitch/designs/ design-system/` = 1 (T4·S6) |
| R3.5 | T4 | grep `gitignore` ≥1 en 3e (T4·S6) |
| R3.6 | T4 | grep `Step 2b: Design Intelligence` = 1 (T4·S6) |
| R3.7 | T4, T14 | grep `Artifact-first` ≥1 y `References only` = 0; E2E artefactos commiteados (T14·S1) |
| R4.1 | T5 | sección Offline Mode ítem 1 (`--persist --output-dir`) (T5·S2) |
| R4.2 | T5 | Offline Mode ítem 2 (mockup impeccable) + `HARD-GATE carve-out` = 1 (T5·S2) |
| R4.3 | T5 | grep `png: n/a (offline` ≥1 (T5·S2) |
| R5.1 | T6 | grep `Ground truth first` = 1 (T6·S3) |
| R5.2 | T6 | grep `Consult ui-ux-pro-max before escalating` = 1 (T6·S3) |
| R6.1 | T7 | `skills/design-fidelity/SKILL.md` existe con frontmatter versionado (T7·S2) |
| R6.2 | T7 | grep `element inventory` ≥1 (T7·S2) |
| R6.3 | T7 | Step 3 Capture + Step 4 Compare presentes (grep `Screenshot` ≥1) (T7·S2) |
| R6.4 | T7, T14 | grep `explicit user waiver` ≥1; prueba negativa E2E (T14·S5) |
| R6.5 | T7 | grep `NOT_CERTIFIED` ≥3 (T7·S2) |
| R6.6 | T8 | grep `design-fidelity` ≥2 en post-implementation-qa (T8·S3) |
| R7.1 | T9 | grep `Design artifacts:` ≥2 en writing-plans (T9·S3) |
| R7.2 | T10, T14 | grep `Required Skills` ≥1 en implementer-prompt; inspección del prompt real E2E (T14·S4) |
| R7.3 | T10 | grep `do NOT silently skip` = 1 (T10·S3) |
| R7.4 | T11 | grep `SUBAGENT-STOP` = 0 y `SUBAGENT-POLICY` = 2 (T11·S2) |
| R7.5 | T12 | grep `Frontend bundle gate` = 1 + fila 1.5 actualizada (T12·S3) |
| R8.1 | T13 | `skills/code-to-design` inexistente; grep en bundle = 0 (T13·S5) |
| R8.2 | T13, T15 | JSONs válidos con versiones 2.0.0/1.4.0; tag v1.4.0 (T13·S5, T15) |
| R8.3 | T13 | `git diff awm-registry.json` vacío (T13·S5) |

*Nota de precisión:* los greps de R2.4, R3.5, R3.7 y R6.2 usan frases que también podrían aparecer en otro contexto del mismo archivo; el verificador debe confirmar que el match está dentro de la sección indicada (lectura dirigida, no solo conteo).

**Analyze gate:** 33/33 requirements con ≥1 task y ≥1 verificación; ninguna task sin requirement (T1 ancla en R2.2 como spike habilitante; T14–T15 anclan en los requirements que ejercitan E2E). Sin gaps forward ni backward.

## Dependencias y orden

- T1 ∥ T2 ∥ (T13 puede adelantarse solo en su Step 1) — arranque.
- T3 requiere T1; T4 requiere T2 y T3; T5 requiere T3–T4.
- T6, T7, T9, T11, T12 requieren solo T2 (T6) o nada — paralelizables entre sí.
- T8 requiere T7. T10 requiere T9 (formato de campos).
- T13 al final de las ediciones; T14 tras todo; T15 tras QA+retro.
