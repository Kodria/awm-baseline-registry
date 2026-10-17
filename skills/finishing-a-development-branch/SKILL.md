---
name: finishing-a-development-branch
version: "2.2.0"
license: Apache-2.0
description: Use when implementation is complete, all tests pass, and you need to decide how to integrate the work - guides completion of development work by presenting structured options for merge, PR/MR, or cleanup
---

# Finishing a Development Branch

## Compact admission — BLOCKING

Read `../writing-plans/references/compact-admission-v1.md` before any plan execution, role dispatch, resume, or lifecycle transition.
Apply it exactly; only `admitted` for the current plan identity may continue.

## Routed custody

For a routed finishing obligation, read
`../subagent-driven-development/references/model-routing-v1.md`. Use the
controller's registered full selection and distinct role receipt; never invent
a native child dispatch, and block a mismatched or unknown routing observation.

## Overview

Guide completion of development work by presenting clear options and handling chosen workflow.

**Core principle:** Verify tests → Present options → Change Record → Execute choice → Clean up.

**Announce at start:** "I'm using the finishing-a-development-branch skill to complete this work."

## Modo de ejecución (lectura del campo)

Al arrancar, usa únicamente el plan activo y la identidad confirmados por admission; lee su línea `**Modo de ejecución:**` desde esos mismos bytes validados:

- Ausente o `interactivo` → modo interactivo (default): comportamiento estándar de este skill.
- `desatendido` → aplica la sección **Modo desatendido** de este skill.
- Cualquier otro valor → trátalo como `interactivo` y avisa al usuario: "Valor inválido en `Modo de ejecución`: `<valor>` — usando modo interactivo."

El modo desatendido quita pausas, no controles: los gates (sensor, ledger, reconciliation, anti-bias, drift plan-vs-código) corren idénticos en ambos modos.

### Modo desatendido

WHEN el modo es `desatendido` AND los tests del Step 1 pasan: omite el menú del Step 3 y ejecuta directamente la **Opción 2 (Push and Create PR/MR)**, que corre primero el Step 3.5 (detección de host), luego el Step 4.0 (retiro de artefactos de diseño) y el Step 4.1 (Change Record) automáticamente, sin prompt. IF los tests fallan, THEN detente y reporta los fallos sin pushear ni crear el PR/MR — igual que en modo interactivo; tests rojos son una pausa legítima que ningún modo salta. La **Opción 4 (Discard)** NUNCA está disponible en modo desatendido: descartar trabajo es una acción destructiva que siempre requiere a un humano.

El Step 4.1 (Change Record) corre igual que en modo interactivo: si `awm sensors run` no da `pass`, si `awm change new` termina con exit distinto de cero (salvo `record-exists` de un record que esta rama agregó, que el Step 4.1 resuelve con `--refresh`) o si `awm change validate --strict` termina con exit distinto de cero, es una pausa legítima como los tests rojos — detente y reporta el diagnóstico sin pushear ni crear el PR/MR. Solo las limitaciones del Step 4.1 (CLI ausente o anterior a 9.20.0, o sensores declarados opt-out o native-gate) continúan sin record. El opt-out trivial (`Change-Record: none`) solo aplica si el plan lo declara; en modo desatendido nunca lo elijas por criterio propio.

**El push siempre corre; el PR/MR es best-effort.** Si `$HOST=unknown` (o el host es reconocido pero su CLI no está instalado), la Opción 2 degrada a "push + instrucciones para abrir el PR/MR a mano" — ese es un resultado **final y válido** del modo desatendido, no un fallo. El skill nunca debe: (a) bloquear/escalar porque no pudo crear el PR/MR, ni (b) terminar en silencio sin decir que el PR/MR no se creó. El reporte final del modo desatendido siempre debe indicar explícitamente si el PR/MR se creó o si quedó pendiente de creación manual.

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

Cannot proceed with merge/PR/MR until tests pass.
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

**Modo desatendido:** no presentes el menú — ejecuta directamente la Opción 2 (Push and Create PR/MR) del Step 4 (que corre primero el Step 3.5 de detección de host, el Step 4.0 de retiro de artefactos y el Step 4.1 de Change Record) y continúa con el cleanup del Step 5. La Opción 4 (Discard) no existe en este modo. Recordá: si la creación del PR/MR degrada (host desconocido o CLI ausente), el push + instrucciones manuales sigue siendo un cierre válido de la Opción 2 — no un fallo que deba escalarse.

**Modo interactivo:** present exactly these 4 options:

```
Implementation complete. What would you like to do?

1. Merge back to <base-branch> locally
2. Push and create a PR/MR
3. Keep the branch as-is (I'll handle it later)
4. Discard this work

Which option?
```

**Don't add explanation** - keep options concise.

### Step 3.5: Detect Git Host

**Runs before any git operation in Step 4** (both Option 1 and Option 2 potentially care which host is in play, though only Option 2 branches on it today).

```bash
REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "")
case "$REMOTE_URL" in
  *github.com*) HOST=github ;;
  *gitlab*)     HOST=gitlab ;;
  *)            HOST=unknown ;;
esac
```

- `HOST=github` → use `gh` (GitHub CLI).
- `HOST=gitlab` → use `glab` (GitLab CLI), if installed.
- `HOST=unknown` → no host CLI applies, or the CLI isn't installed even when the host is recognized (e.g. `gitlab` but no `glab` binary): degrade honestly — see Option 2 below. This is never a hard failure.

### Step 4: Execute Choice

#### Step 4.0: Retire design artifacts (Options 1 & 2 only)

**Runs only on the integration paths (Option 1 Merge, Option 2 PR/MR), before the merge/push below. Skip entirely for Options 3 and 4.**

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

Then continue with Step 4.1 (Change Record).

#### Step 4.1: Change Record (Options 1 & 2 only)

**Runs only on the integration paths (Option 1 Merge, Option 2 PR/MR), after Step 4.0 and before the merge/push below. Skip entirely for Options 3 and 4.** It runs after Step 4.0 because the retirement commit changes files: a record verified before that commit fails validation with `code-changed-after-verification`.

Every integrated change leaves one Change Record (`awm.change-record/v1`) at `docs/changes/<YYYY-MM-DD>-<slug>.md`: a short, structured answer to what the change did, what was verified and what a human still has to validate, readable without the code. The CLI derives the deterministic fields (`type`, `scope`, `semver`, `breaking`, `modules`, `verification`) from git and from the sensor-run receipt; you write only the narrative.

0. **Version gate.** This step needs `agentic-workflow-manager` ≥ 9.20.0, the first version with `awm change new|validate`, `awm changes list` and the sensor-run receipt. Read the installed version with `awm --version` (it prints only `X.Y.Z`) and compare major, minor and patch as integers, in that order (9.9.0 < 9.20.0 < 10.0.0); do not probe with `--help`, because older CLIs answer an unknown subcommand's help with exit 0. If `awm` is not found, exits non-zero, or prints a version below 9.20.0, state the limitation once (`Change Record: no generado — el CLI <versión, o "ausente"> no trae awm change; requiere ≥ 9.20.0`) and continue to the merge/push without a record — never write a record by hand or invent its fields. Option 2 then uses the no-record PR/MR body. If the plan declares `**Change Record:** ninguno — <razón>`, still make the opt-out commit of **Trivial changes (opt-out)**, skipping only its `awm change validate --strict` check. In Option 2, build the body as for the trivial opt-out (`Change Record: ninguno — <razón>` and the closing `Change-Record: none` paragraph), not with the limitation line.

**Before step 1, read the plan's `**Change Record:**` header.** `ninguno — <razón>` → commit any pending work (step 1), then go straight to **Trivial changes (opt-out)** below; steps 2–6 do not run. Otherwise its slug is the `<slug>` of steps 3–6; for a plan without the header, derive the slug from the branch name: lowercase it, replace each run of characters outside `[a-z0-9]` with `-`, trim leading and trailing `-`, and cut it to 64 characters (trimming a trailing `-` again), so it matches `^[a-z0-9]+(-[a-z0-9]+)*$`. Pass `--base <base-branch>` (from Step 2) to every `awm change new` and `awm change validate` call of this step, so the CLI derives and validates against the same base.

1. **Commit.** Commit all pending work with a conventional-commit subject (`type(scope): subject`): the CLI derives `type`, `scope` and `semver` only from conventional subjects, and fails with `no-conventional-commits` when the branch has none. The working tree must be clean: a dirty tree gets no sensor receipt.
2. **Run the sensors:** `awm sensors run`. A full run on a clean tree writes the receipt `.awm/sensors/runs/<commit>.json` (local, never committed). Read the JSON's `mode` before its `overall`:
   - `"mode": "opt-out"` or `"mode": "native-gate"` → the project deliberately declares no AWM sensors (`reason` is `opt-out-declared` or `native-gate-declared`). The run reports `"overall": "not_certified"` and exits 1, and this is the only non-pass verdict that does not stop: no receipt can exist, so no record can be certified. State the limitation once, in the final report and in the PR/MR body (`Change Record: no generado — el proyecto declara sensores <mode>; no hay receipt que certifique la verificación`), and continue to the merge/push without a record. Never invent one, and never add `Change-Record: none` to hide it: `awm changes list` reports the change as `missing`, which is the truth.
   - Any other `overall` than `pass` (including the modes `missing` and `invalid`) → stop exactly as for failing tests in Step 1: report its `overall`, `mode`, `reason` and `remedy`, and do not merge or push.
   - `overall: pass` with a stderr line `no sensor receipt written: <reason>` → if the reason is uncommitted changes, commit them (step 1) and run this step again; for any other reason, stop and report it — never edit `.awm/sensors.json` to obtain a receipt.
3. **Create the skeleton:** `awm change new <slug>`. Pass `--plan <plan-path>` (the plan's repo-relative path, only when the plan file lives inside this repository) and `--issue <https-url>` when the plan names an issue. If the record already exists (`record-exists`) and this branch added it (`git diff --name-only --diff-filter=A <base-branch>...HEAD -- docs/changes/` lists it, or `git status --porcelain -- docs/changes/` shows it as untracked after an interrupted run), run `awm change new <slug> --refresh` with no flag other than `--base` instead (the CLI rejects `--plan` and `--issue` together with `--refresh`): it recomputes only the derived fields and keeps the narrative. If an earlier change owns that slug, stop and report the collision; never refresh, rename or delete another change's record on your own. Any other non-zero exit → stop and report the diagnostic with its `remedy:` line.
4. **Write the narrative.** Replace every `<!-- awm:pending -->` marker, drawing from the plan (goal and `**Criterios de aceptación:**`), the `post-implementation-qa` results and the diff (`git diff <base-branch>...HEAD`):
   - `title` (at most 120 characters) and `summary_short` (one line, at most 280 characters, written for someone who will not read the code);
   - `manual_validation`: one `{step, expected}` item per acceptance criterion of the plan, or `{none: <razón>}` when the plan's criterion is `- ninguno — <razón>`; for a plan without `**Criterios de aceptación:**`, take the steps from the plan's goal and the QA results, and never invent `{none}`;
   - `risks` (may be `[]`) and `rollback` (how to undo the change);
   - the body sections, in this order and none empty: `## Qué se hizo`, `## Qué se probó` (only checks that actually ran, with their result), `## Qué falta validar`, `## Riesgos y rollback`.

   Never edit the derived fields by hand: validation recomputes them.
5. **Commit the record** on its own: `git add docs/changes/<file>`, then `git commit -m "docs(changes): add change record <slug>"`. A commit that only touches `docs/changes/` changes neither the derived fields nor what the receipt certifies.
6. **Validate:** `awm change validate --strict`. Exit 0 → continue. Non-zero → stop: report every diagnostic, and never merge or push past a failing strict validation, in either mode. Fix it and repeat from the step the diagnostic points to: `pending-content`, `field-invalid` or `body-section-missing` → step 4, then commit the fix; `record-uncommitted` → step 5; `code-changed-after-verification`, `derived-mismatch`, `receipt-missing` or `verification-mismatch` → step 2, then `--refresh` in step 3; `verification-not-passing` → fix the sensors and commit, then step 2 and `--refresh` in step 3. Any other code → stop and report it; do not improvise a fix.

**Trivial changes (opt-out):** only when the plan declares `**Change Record:** ninguno — <razón>`, or, in interactive mode, when the human decides so for a change too small to merit a record (a version bump, a typo). Never choose it on your own judgment, and never after any of steps 2–6 failed: that would turn an inability to certify into an exemption. Make the opt-out commit the branch's last commit, with the reason in the commit body and the trailer `Change-Record: none` as the final paragraph. Commit any pending work first (`git add` and a conventional subject); `--allow-empty` is only for when nothing is pending:

```bash
git commit --allow-empty -m "chore: <subject>" -m "<razón>" -m "Change-Record: none"
```

The trailer counts only in the final paragraph of a commit message, never in the subject. Then run `awm change validate --strict`: it must print `Change Record validation: exempt (Change-Record: none)` and exit 0; anything else → stop and report it. A host that squash-merges concatenates the branch's messages, so for Option 2 also end the PR/MR description with a `Change-Record: none` paragraph (used when the host squashes with the PR description).

Then continue with the chosen option's merge/push below.

#### Option 1: Merge Locally

**First, run Step 4.0 (retire design artifacts), then Step 4.1 (Change Record).**

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

#### Option 2: Push and Create PR/MR

**First, run Step 4.0 (retire design artifacts), then Step 4.1 (Change Record).**

The push always happens first and never depends on `gh`/`glab`. What differs by `$HOST` (from Step 3.5) is only how — or whether — a PR/MR gets opened after.

```bash
# Push branch (always — independent of host/CLI)
git push -u origin <feature-branch>
```

Build the PR/MR body from the Change Record of Step 4.1, not from memory. **Summary** is its `summary_short` followed by the bullets of `## Qué se hizo`. **Test Plan** lists what `## Qué se probó` says already ran (checked), then each `manual_validation` item as a pending check; `{none: <razón>}` becomes the single line `Sin validación manual: <razón>`. Link the record file at the last commit that changed it (`git log -1 --format=%H -- docs/changes/<file>`), so the link survives deleting the branch and shows the validated version: `<web-url>/blob/<record-commit-sha>/docs/changes/<file>` on GitHub, `<web-url>/-/blob/<record-commit-sha>/docs/changes/<file>` on GitLab, where `<web-url>` is the remote as an https web URL (an SSH remote `git@host:owner/repo.git` becomes `https://host/owner/repo`). On any other host, write the link line as `Change Record: docs/changes/<file> @ <record-commit-sha>`. Without a record, fill Summary and Test Plan from the plan, the QA results and the diff, and replace the link line: after a limitation of Step 4.1, with the line it stated (`Change Record: no generado — <motivo>`); for the trivial opt-out, with `Change Record: ninguno — <razón>`, and end the body with a `Change-Record: none` paragraph.

**`HOST=github` → use `gh`, if installed:**

```bash
gh pr create --title "<title>" --body "$(cat <<'EOF'
## Summary
<summary_short>

<bullets from ## Qué se hizo>

## Test Plan
- [x] <each check from ## Qué se probó>
- [ ] <each manual_validation step> → <expected>

Change Record: [`docs/changes/<file>`](<web-url>/blob/<record-commit-sha>/docs/changes/<file>)
EOF
)"
```

If `gh` isn't installed (or not on PATH), treat this the same as the degraded path below.

**`HOST=gitlab` → use `glab`, if installed:**

`glab mr create` is the MR equivalent of `gh pr create` — open it with a title and a description built exactly like the `gh` body above (e.g. `glab mr create --title "<title>" --description "..."`, though verify the exact flags against `glab --help` at the time — CLI surfaces drift, and asserting an untested flag with false confidence is worse than checking). If `glab` isn't installed, treat this the same as the degraded path below.

**`HOST=unknown` (unrecognized remote domain, or the host's CLI isn't installed) → honest degradation, not a failure:**

The push already succeeded. Report exactly that, plus what's left to do manually:

```
Pushed to <feature-branch>. Could not create a PR/MR automatically — no gh/glab detected or unrecognized git host.

Open one manually:
- If the remote is GitHub-shaped: <remote-url-without-.git>/compare/<base-branch>...<feature-branch>
- Otherwise: push is done — open a merge/pull request for <feature-branch> against <base-branch> from your host's web UI.
```

Give the operator the PR/MR body built above, ready to paste.

This IS a valid, complete outcome of Option 2 — the branch is pushed and the operator has a clear, unambiguous next action. It is never treated as an error or a reason to escalate.

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

| Option | Merge | Push | Keep Worktree | Cleanup Branch | Retire artifacts | Change Record |
|--------|-------|------|---------------|----------------|------------------|---------------|
| 1. Merge locally | ✓ | - | - | ✓ | ✓ (if any) | ✓ |
| 2. Create PR/MR | - | ✓ | ✓ | - | ✓ (if any) | ✓ |
| 3. Keep as-is | - | - | ✓ | - | - | - |
| 4. Discard | - | - | - | ✓ (force) | - | - |

## Common Mistakes

**Skipping test verification**
- **Problem:** Merge broken code, create failing PR/MR
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

**Treating a degraded PR/MR as a failure**
- **Problem:** `$HOST=unknown` (no `gh`/`glab`, or unrecognized remote) is mistaken for an error and the skill blocks, escalates, or refuses to finish
- **Fix:** The push already succeeded and never depended on the CLI — report the degraded PR/MR step and stop there; that's a complete Option 2 outcome, in both interactive and unattended mode

**Silently skipping PR/MR creation**
- **Problem:** Push succeeds, `gh`/`glab` isn't available, and the skill ends without telling the operator a PR/MR was NOT created
- **Fix:** Always state explicitly whether a PR/MR was created or is pending manual creation, with the compare/MR URL or instructions

**Integrating without a validated Change Record**
- **Problem:** The merge or PR lands with no record, or with one that `awm change validate --strict` rejects, and the next day nobody can tell what it did or what still needs validating
- **Fix:** Run Step 4.1 before the merge/push of Options 1 & 2 and stop on any non-zero exit, except the three Step 4.1 names: a missing or pre-9.20.0 CLI and the declared sensors modes `opt-out`/`native-gate` (limitation, no record), and `record-exists` for a record this branch added (refresh; a slug owned by an earlier change stops as a collision)

**Writing the PR/MR body from memory**
- **Problem:** Summary and Test Plan drift from what was actually verified
- **Fix:** Build them from the record's `summary_short`, `## Qué se hizo`, `## Qué se probó` and `manual_validation`, and link the record

## Red Flags

**Never:**
- Proceed with failing tests
- Merge without verifying tests on result
- Delete work without confirmation
- Force-push without explicit request
- Retire design artifacts on Option 3/4, or for non-`completed` screens
- Treat a degraded PR/MR (no `gh`/`glab`, or unrecognized host) as a blocking failure
- Finish Option 2 without stating whether a PR/MR was actually created
- Merge or push after `awm change validate --strict` failed
- Invent a Change Record or edit its derived fields by hand

**Always:**
- Verify tests before offering options
- Present exactly 4 options (modo desatendido exceptuado: ver sección "Modo desatendido")
- Get typed confirmation for Option 4
- Clean up worktree for Options 1 & 4 only
- Retire `completed`-screen `.stitch/designs/` artifacts before integrating (Options 1 & 2, via Step 4.0)
- Detect the git host (Step 3.5) before any Option 2 git-host operation
- Run Step 4.1 (Change Record) after Step 4.0 and before the merge/push of Options 1 & 2

## Integration

**Called by:**
- **subagent-driven-development** (Step 7) - After all tasks complete
- **executing-plans** (Step 5) - After all admitted serial slices and global closure gates complete

**Pairs with:**
- **using-git-worktrees** - Cleans up worktree created by that skill
