---
name: finishing-a-development-branch
version: "1.2.0"
description: Use when implementation is complete, all tests pass, and you need to decide how to integrate the work - guides completion of development work by presenting structured options for merge, PR, or cleanup
---

# Finishing a Development Branch

## Overview

Guide completion of development work by presenting clear options and handling chosen workflow.

**Core principle:** Verify tests → Present options → Execute choice → Clean up.

**Announce at start:** "I'm using the finishing-a-development-branch skill to complete this work."

## Modo de ejecución (lectura del campo)

Al arrancar, localiza el plan activo (`docs/plans/*-plan.md` de la rama actual) y lee su línea `**Modo de ejecución:**`:

- Ausente o `interactivo` → modo interactivo (default): comportamiento estándar de este skill.
- `desatendido` → aplica la sección **Modo desatendido** de este skill.
- Cualquier otro valor → trátalo como `interactivo` y avisa al usuario: "Valor inválido en `Modo de ejecución`: `<valor>` — usando modo interactivo."

El modo desatendido quita pausas, no controles: los gates (sensor, ledger, reconciliation, anti-bias, drift plan-vs-código) corren idénticos en ambos modos.

### Modo desatendido

WHEN el modo es `desatendido` AND los tests del Step 1 pasan: omite el menú del Step 3 y ejecuta directamente la **Opción 2 (Push and Create PR)**. IF los tests fallan, THEN detente y reporta los fallos sin crear el PR — igual que en modo interactivo; tests rojos son una pausa legítima que ningún modo salta. La **Opción 4 (Discard)** NUNCA está disponible en modo desatendido: descartar trabajo es una acción destructiva que siempre requiere a un humano. El path de auto-PR corre primero el **Step 4.0 (retiro de artefactos de diseño)** automáticamente, sin prompt.

## The Process

### Step 1: Verify Tests

**Before presenting options, verify tests pass:**

```bash
# Run project's test suite
npm test / cargo test / pytest / go test ./...
```

**If tests fail:**
```
Tests failing (<N> failures). Must fix before completing:

[Show failures]

Cannot proceed with merge/PR until tests pass.
```

Stop. Don't proceed to Step 2.

**If tests pass:** Continue to Step 2.

### Step 2: Determine Base Branch

```bash
# Try common base branches
git merge-base HEAD main 2>/dev/null || git merge-base HEAD master 2>/dev/null
```

Or ask: "This branch split from main - is that correct?"

### Step 3: Present Options

**Modo desatendido:** no presentes el menú — ejecuta directamente la Opción 2 (Push and Create PR) del Step 4 (que corre el Step 4.0 de retiro de artefactos primero) y continúa con el cleanup del Step 5. La Opción 4 (Discard) no existe en este modo.

**Modo interactivo:** present exactly these 4 options:

```
Implementation complete. What would you like to do?

1. Merge back to <base-branch> locally
2. Push and create a Pull Request
3. Keep the branch as-is (I'll handle it later)
4. Discard this work

Which option?
```

**Don't add explanation** - keep options concise.

### Step 4: Execute Choice

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

#### Option 1: Merge Locally

**First, run Step 4.0 (retire design artifacts).**

```bash
# Switch to base branch
git checkout <base-branch>

# Pull latest
git pull

# Merge feature branch
git merge <feature-branch>

# Verify tests on merged result
<test command>

# If tests pass
git branch -d <feature-branch>
```

Then: Cleanup worktree (Step 5)

#### Option 2: Push and Create PR

**First, run Step 4.0 (retire design artifacts).**

```bash
# Push branch
git push -u origin <feature-branch>

# Create PR
gh pr create --title "<title>" --body "$(cat <<'EOF'
## Summary
<2-3 bullets of what changed>

## Test Plan
- [ ] <verification steps>
EOF
)"
```

Then: Cleanup worktree (Step 5)

#### Option 3: Keep As-Is

Report: "Keeping branch <name>. Worktree preserved at <path>."

**Don't cleanup worktree.**

#### Option 4: Discard

**Confirm first:**
```
This will permanently delete:
- Branch <name>
- All commits: <commit-list>
- Worktree at <path>

Type 'discard' to confirm.
```

Wait for exact confirmation.

If confirmed:
```bash
git checkout <base-branch>
git branch -D <feature-branch>
```

Then: Cleanup worktree (Step 5)

### Step 5: Cleanup Worktree

**For Options 1, 2, 4:**

Check if in worktree:
```bash
git worktree list | grep $(git branch --show-current)
```

If yes:
```bash
git worktree remove <worktree-path>
```

**For Option 3:** Keep worktree.

## Quick Reference

| Option | Merge | Push | Keep Worktree | Cleanup Branch | Retire artifacts |
|--------|-------|------|---------------|----------------|------------------|
| 1. Merge locally | ✓ | - | - | ✓ | ✓ (if any) |
| 2. Create PR | - | ✓ | ✓ | - | ✓ (if any) |
| 3. Keep as-is | - | - | ✓ | - | - |
| 4. Discard | - | - | - | ✓ (force) | - |

## Common Mistakes

**Skipping test verification**
- **Problem:** Merge broken code, create failing PR
- **Fix:** Always verify tests before offering options

**Open-ended questions**
- **Problem:** "What should I do next?" → ambiguous
- **Fix:** Present exactly 4 structured options (modo desatendido es la excepción documentada: no presenta el menú, ejecuta directo la Opción 2 — ver sección "Modo desatendido")

**Automatic worktree cleanup**
- **Problem:** Remove worktree when might need it (Option 2, 3)
- **Fix:** Only cleanup for Options 1 and 4

**No confirmation for discard**
- **Problem:** Accidentally delete work
- **Fix:** Require typed "discard" confirmation

**Retiring artifacts on keep/discard**
- **Problem:** Removing `.stitch/designs/` on Option 3 or 4 deletes design refs when the work isn't being integrated
- **Fix:** Step 4.0 runs only on Options 1 & 2, and only for `completed` screens

## Red Flags

**Never:**
- Proceed with failing tests
- Merge without verifying tests on result
- Delete work without confirmation
- Force-push without explicit request
- Retire design artifacts on Option 3/4, or for non-`completed` screens

**Always:**
- Verify tests before offering options
- Present exactly 4 options (modo desatendido exceptuado: ver sección "Modo desatendido")
- Get typed confirmation for Option 4
- Clean up worktree for Options 1 & 4 only
- Retire `completed`-screen `.stitch/designs/` artifacts before integrating (Options 1 & 2, via Step 4.0)

## Integration

**Called by:**
- **subagent-driven-development** (Step 7) - After all tasks complete
- **executing-plans** (Step 5) - After all batches complete

**Pairs with:**
- **using-git-worktrees** - Cleans up worktree created by that skill