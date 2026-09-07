# Baseline Registry `onSignal` Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `subagent-driven-development`
> (recommended) or `executing-plans` to implement this plan task-by-task. Steps
> use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the baseline `dev` bundle from inert object skill references to canonical ordered strings without changing installed content.

**Architecture:** Add a repository contract test over the real manifests, then perform a data-only migration and synchronized patch version bump. Keep skill files, hooks, sensor packs, and agents unchanged; wire only that contract into the existing validation and pre-tag workflow sequences.

**Tech Stack:** JSON manifests, Node.js 22 built-in test runner, existing registry portability and release gates.

**Modo de ejecución:** desatendido

> Mandato de ejecución desatendida: ejecución completa sin pausas de check-in
> entre tareas, ni de confirmación entre fases (development-process rutea
> automáticamente y subagent-driven-development no pregunta si continuar con
> el cierre). harness-retro triagea con criterio propio del agente (solo valor
> real, recurrente o sistémico — descarta el resto sin preguntar).
> post-implementation-qa corrige TODOS los hallazgos que surjan, no solo algunos.
> finishing-a-development-branch crea el PR directamente (opción "push + PR"),
> sin presentar el menú de 4 opciones.

**Decisión de presupuesto de contexto:** aceptada por el propietario el 2026-09-07; se retiene el exceso de 78 bytes (27,403/27,325) porque #112 no modifica archivos de contexto inyectado.

---

## Requirements

- **BR1:** THE baseline `dev` bundle SHALL contain exactly the same 24 ordered skill names as version 3.9.3, represented only as non-empty strings.
- **BR2:** THE `dev` version SHALL be 3.9.4 in both `catalog.json` and `bundles/dev/bundle.json`.
- **BR3:** THE active AWM-owned bundle manifests SHALL contain no `onSignal` property.
- **BR4:** THE registry's complete validation and release gates SHALL pass without changing any `SKILL.md`, hook, agent, or sensor-pack content. The only permitted workflow change is invoking `tests/bundle-skill-reference-contract.test.mjs` in the existing validation and pre-tag verification sequences, before release publication; no workflow behavior beyond that gate wiring may change.

## Task 1: Add the canonical-reference contract

_Requirements: BR1, BR2, BR3_

**Files:**
- Create: `tests/bundle-skill-reference-contract.test.mjs`
- Test: `tests/bundle-skill-reference-contract.test.mjs`

- [ ] Create a Node test that reads both real manifests, asserts `dev.version === '3.9.4'`, compares the catalog version, requires every skill entry to be a non-empty string, checks the exact 24-name order, and recursively scans `bundles/*/bundle.json` for an own `onSignal` key. Use this expected list:

```js
const expected = [
  'using-awm', 'development-process', 'brainstorming', 'writing-plans', 'executing-plans',
  'subagent-driven-development', 'test-driven-development', 'requesting-code-review',
  'receiving-code-review', 'post-implementation-qa', 'post-implementation-docs',
  'finishing-a-development-branch', 'verification-before-completion', 'systematic-debugging',
  'dispatching-parallel-agents', 'using-git-worktrees', 'project-context-init',
  'project-constitution', 'setup-sensors', 'harness-retro', 'architecture-advisor',
  'nfr-checklist-generator', 'technology-evaluator', 'mermaid-diagrams',
];
```

- [ ] Run the test before changing manifests:

```bash
node --test tests/bundle-skill-reference-contract.test.mjs
```

Expected: FAIL because version is 3.9.3 and ten entries are objects.

- [ ] Commit the RED contract separately:

```bash
git add tests/bundle-skill-reference-contract.test.mjs
git commit -m "test(bundles): require canonical skill references"
```

## Task 2: Migrate the dev manifest and versions

_Requirements: BR1, BR2, BR3_

**Files:**
- Modify: `bundles/dev/bundle.json`
- Modify: `catalog.json`
- Test: `tests/bundle-skill-reference-contract.test.mjs`

- [ ] Replace the ten objects after `systematic-debugging` with their string `name` values, preserving the exact order from Task 1. Change both copies of the `dev` version from `3.9.3` to `3.9.4`. Do not reorder or edit any other field.
- [ ] Run the focused test and require PASS:

```bash
node --test tests/bundle-skill-reference-contract.test.mjs
```

- [ ] Revert only the manifest conversion while retaining the test, confirm the focused test fails on the first object entry, then restore the conversion and rerun to PASS.
- [ ] Verify the data-only scope:

```bash
git diff --check
git diff --name-only origin/main
git diff --unified=0 origin/main -- bundles/dev/bundle.json catalog.json
```

Expected changed runtime files: only the two manifests; no `skills/`, `hooks/`, `agents/`, or `sensor-packs/` path. The sole allowed workflow diff wires the new contract test into existing validation and pre-tag verification.

- [ ] Commit:

```bash
git add bundles/dev/bundle.json catalog.json
git commit -m "fix(bundles): retire inert onSignal metadata"
```

## Task 3: Run registry closure and open the PR

_Requirements: BR4_

**Files:**
- Verify: `.github/workflows/validate.yml`
- Verify: `.github/workflows/auto-tag.yml`

- [ ] Run the focused contract plus every local portability command from `validate.yml`:

```bash
node --test tests/bundle-skill-reference-contract.test.mjs
node scripts/validate-portability.mjs
node tests/validate-portability.test.mjs
node tests/r3-release-metadata.test.mjs
node tests/cycle-evidence-capture-contract.test.mjs
node tests/r3-retro-contract.test.mjs
node tests/r8-sensor-gate-contract.test.mjs
node tests/r9-declared-orchestrators-contract.test.mjs
node tests/r10-documentation-phase-contract.test.mjs
node tests/r11-process-lifecycle-contract.test.mjs
node tests/r12-context-footprint-contract.test.mjs
node tests/r13-role-evidence-capsule-contract.test.mjs
node tests/r15-compact-slices-contract.test.mjs
node tests/r14-context-kernel-contract.test.mjs
node tests/release-skill-version-gate.test.mjs
node tests/codex-session-start.test.mjs
node tests/session-start.test.mjs
node tests/sensor-pack-eslint.test.mjs
node tests/sensor-pack-shape.test.mjs
node tests/sensor-pack-python-shell-generic.test.mjs
node tests/sensor-pack-variants.test.mjs
node tests/sensor-pack-coverage.test.mjs
node tests/sensor-pack-coverage-mutations.test.mjs
node --test tests/sensor-pack-rules-fire.test.mjs
```

- [ ] Run `awm sensors run` from the baseline repository root and resolve every finding.
- [ ] Perform specification and code-quality reviews, post-implementation QA, documentation completion, and harness retro. Commit only real remediations.
- [ ] Push `fix/issue-112-retire-onsignal` and create a PR titled `fix(bundles): retire inert onSignal metadata`. Reference `Kodria/agentic-workflow#112`, explain that installed membership is byte-equivalent, and do not use an auto-close keyword for the issue in the other repository.
- [ ] Wait for `validate.yml`, sensor certification, skill-version gate, and auto-tag preflight checks. Diagnose any failure from its first causal log before editing.

## Traceability matrix

| Requirement | Task(s) | Direct test |
|---|---|---|
| BR1 | T1, T2 | exact ordered-array assertion |
| BR2 | T1, T2 | synchronized 3.9.4 assertion |
| BR3 | T1, T2 | recursive own-key scan |
| BR4 | T3 | full validate workflow commands, sensors, and PR checks |

Forward and backward coverage are complete: every requirement has an implementation task and direct check; every task is required by BR1-BR4. No skill content or runtime provider behavior is in scope.
