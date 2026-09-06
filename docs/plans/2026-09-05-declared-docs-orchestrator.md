# Declared Documentation Orchestrator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `subagent-driven-development`
> (recommended) or `executing-plans` to implement this plan task-by-task. Steps
> use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move documentation routing from a baseline hardcode to a verified declaration owned and released by `awm-documentation-registry`.

**Architecture:** Deliver the owning registry first, verify its declaration with the published CLI, and only then remove the baseline fallback. Keep the legacy documentation process body unchanged; enforce the ownership boundary with a mutation-tested baseline contract.

**Tech Stack:** JSON registry manifests, Markdown AWM skills, Node.js built-in test runner, Bash verification commands, GitHub CLI, `agentic-workflow-manager` 9.7.0.

**Modo de ejecución:** desatendido

> Mandato de ejecución desatendida: ejecución completa sin pausas de check-in
> entre tareas, ni de confirmación entre fases (development-process rutea
> automáticamente y subagent-driven-development no pregunta si continuar con
> el cierre). harness-retro triagea con criterio propio del agente (solo valor
> real, recurrente o sistémico — descarta el resto sin preguntar).
> post-implementation-qa corrige TODOS los hallazgos que surjan, no solo algunos.
> finishing-a-development-branch crea el PR directamente (opción "push + PR"),
> sin presentar el menú de 4 opciones.

---

## Repository layout and execution boundary

This is a serial, two-repository change:

- `Kodria/awm-documentation-registry` owns the declaration and must publish first.
- `Kodria/awm-baseline-registry` owns `using-awm`, R9, release metadata, and issue #37.

Do not add parallel track declarations. Task 3 has a hard external dependency on the
documentation PR being merged and tagged. Use isolated worktrees for both repositories;
never modify their primary `main` checkouts.

### Task 1: Declare and version the documentation orchestrator

_Requirements: R1.1, R1.2, R1.3_

**Repository:** `Kodria/awm-documentation-registry`

**Files:**
- Modify: `awm-registry.json`
- Modify: `catalog.json`
- Modify: `bundles/docs/bundle.json`

**Skills:** test-driven-development

- [x] **Step 1: Create an isolated documentation-registry worktree**

Fetch `origin/main`, create branch `feat/issue-37-declare-docs-orchestrator`, and place its
worktree under the established workspace `.worktrees/awm-documentation-registry/` area.
Confirm `git status --short --branch` is clean before continuing.

- [x] **Step 2: Run the desired-state assertion and observe RED**

Run from the documentation-registry worktree:

```bash
node --input-type=module <<'NODE'
import assert from 'node:assert/strict';
import fs from 'node:fs';

const manifest = JSON.parse(fs.readFileSync('awm-registry.json', 'utf8'));
const catalog = JSON.parse(fs.readFileSync('catalog.json', 'utf8'));
const bundle = JSON.parse(fs.readFileSync('bundles/docs/bundle.json', 'utf8'));
const appliesWhen = 'the session starts with a request to create, improve, initialize, format, or maintain project documentation, documentation templates, or standalone architecture diagrams';

assert.equal(manifest.minCliVersion, '8.3.0'); // verifies R1.2
assert.deepEqual(manifest.orchestrator, { // verifies R1.1, R1.3
  name: 'docs-system-orchestrator',
  appliesWhen,
  terminatesTo: 'none',
});
assert.ok(fs.statSync('skills/docs-system-orchestrator/SKILL.md').isFile()); // verifies R1.1
assert.equal(catalog.bundles.find(({ name }) => name === 'docs')?.version, '1.1.0');
assert.equal(bundle.version, '1.1.0');
NODE
```

Expected: FAIL because the current manifest has `minCliVersion: 2.0.0`, no
`orchestrator`, and the bundle remains at 1.0.0.

- [x] **Step 3: Apply the minimal declaration and release metadata**

Replace `awm-registry.json` with:

```json
{
  "minCliVersion": "8.3.0",
  "orchestrator": {
    "name": "docs-system-orchestrator",
    "appliesWhen": "the session starts with a request to create, improve, initialize, format, or maintain project documentation, documentation templates, or standalone architecture diagrams",
    "terminatesTo": "none"
  }
}
```

Set the `docs` bundle version to `1.1.0` in both `catalog.json` and
`bundles/docs/bundle.json`. Do not edit `skills/docs-system-orchestrator/SKILL.md`; its
behavior and frontmatter are unchanged.

- [x] **Step 4: Re-run the desired-state assertion and observe GREEN**

Run the exact Node command from Step 2.

Expected: exit 0 with no output.

- [x] **Step 5: Commit the documentation-registry change**

```bash
git add awm-registry.json catalog.json bundles/docs/bundle.json
git commit -m "feat(registry): declare documentation orchestrator"
```

### Task 2: Prove composition, publish the owning PR, and cross the release gate

_Requirements: R1.4, R4.1, R4.2_

**Repository:** `Kodria/awm-documentation-registry`

**Files:**
- Verify: `awm-registry.json`
- Verify: `skills/docs-system-orchestrator/SKILL.md`

**Skills:** verification-before-completion

- [x] **Step 1: Verify the valid declaration with the published CLI**

Create a fresh temporary directory with `mktemp -d`, use a child directory as an isolated
`AWM_HOME`, and run:

```bash
DOCS_VERIFICATION_ROOT=$(mktemp -d /tmp/awm-docs-37.XXXXXX)
DOCS_VALID_AWM_HOME="$DOCS_VERIFICATION_ROOT/valid-home"
DOCS_WORKTREE=$(git rev-parse --show-toplevel)
AWM_HOME="$DOCS_VALID_AWM_HOME" npx -y agentic-workflow-manager@9.7.0 registry add "$DOCS_WORKTREE" --name docs-issue-37 --no-install
AWM_HOME="$DOCS_VALID_AWM_HOME" npx -y agentic-workflow-manager@9.7.0 context orchestrators --json
AWM_HOME="$DOCS_VALID_AWM_HOME" npx -y agentic-workflow-manager@9.7.0 context orchestrators --verify docs-system-orchestrator
```

Expected: JSON contains exactly the approved declaration and `--verify` exits 0 with
`"docs-system-orchestrator" is composed into the session context.`

- [x] **Step 2: Prove the runtime gate rejects an unresolved declaration**

Create a disposable clone of the committed documentation worktree under the same temporary
root. Use `apply_patch` in that disposable clone to replace only:

```bash
DOCS_MUTANT="$DOCS_VERIFICATION_ROOT/mutant"
DOCS_INVALID_AWM_HOME="$DOCS_VERIFICATION_ROOT/invalid-home"
git clone "$DOCS_WORKTREE" "$DOCS_MUTANT"
```

Then use `apply_patch` to replace only:

```json
"name": "docs-system-orchestrator"
```

with:

```json
"name": "missing-docs-orchestrator"
```

Commit the mutation so `awm registry add` clones it, then register it under a second fresh
isolated `AWM_HOME` and run:

```bash
AWM_HOME="$DOCS_INVALID_AWM_HOME" npx -y agentic-workflow-manager@9.7.0 registry add "$DOCS_MUTANT" --name docs-issue-37-mutant --no-install
AWM_HOME="$DOCS_INVALID_AWM_HOME" npx -y agentic-workflow-manager@9.7.0 context orchestrators --verify missing-docs-orchestrator
```

Expected: exit 2; stderr says the declaration was dropped because the skill is not
discoverable; available orchestrators are `(none)`. Delete only the disposable temporary
root after recording the result.

- [x] **Step 3: Push and create the documentation-registry PR**

```bash
git push -u origin feat/issue-37-declare-docs-orchestrator
gh pr create --repo Kodria/awm-documentation-registry --title "feat(registry): declare documentation orchestrator" --body "Declares docs-system-orchestrator through the registry-owned contract, raises the CLI floor to 8.3.0, and bumps the docs bundle to 1.1.0. Companion delivery for Kodria/awm-baseline-registry#37."
```

Expected: an open PR whose diff contains only the three Task 1 files.

- [x] **Step 4: Stop at the external merge checkpoint**

Report the PR URL and wait for the user to merge it. Do not edit the baseline hardcode while
the PR is unmerged.

- [x] **Step 5: Publish and verify documentation registry v1.1.0**

After the user confirms the PR is merged, fetch `origin/main` and tags in the documentation
repository. Confirm the merge commit contains the declaration, then create and push annotated
tag `v1.1.0` because this registry has no auto-tag workflow:

```bash
git fetch origin main --tags
git tag -a v1.1.0 origin/main -m "v1.1.0: declared documentation orchestrator"
git push origin v1.1.0
git ls-remote --exit-code --tags origin refs/tags/v1.1.0
```

Expected: the remote tag exists and dereferences to the merged release. Repeat Step 1 against
the released remote/tag rather than the branch; `--verify` must still exit 0. If any check
fails, stop before Task 3.

### Task 3: Add a RED contract for local built-in skill references

_Requirements: R2.1, R2.2, R2.3_

**Repository:** `Kodria/awm-baseline-registry`

**Files:**
- Modify: `tests/r9-declared-orchestrators-contract.test.mjs`
- Test: `tests/r9-declared-orchestrators-contract.test.mjs`

**Skills:** test-driven-development

- [x] **Step 1: Add the local-resolution helper and contract tests**

Add `existsSync` to the `node:fs` import and define:

```javascript
function assertBuiltInSkillReferencesResolve(text) {
  const references = [...orchestrationSection(text).matchAll(/`([^`\n]+)`/g)]
    .map(([, value]) => value)
    .filter(value => !value.includes('/') && !value.includes('.'));
  const missing = [...new Set(references)]
    .filter(name => !existsSync(new URL(`skills/${name}/SKILL.md`, root)));

  assert.deepEqual(
    missing,
    [],
    `using-awm built-in orchestration references non-local skills: ${missing.join(', ')}`,
  );
}
```

Add these tests:

```javascript
test('built-in orchestration references only local baseline skills', () => {
  assertBuiltInSkillReferencesResolve(read(USING_AWM)); // verifies R2.1, R2.2
});

test('RED mutation: a hardcoded external skill is rejected', () => {
  const mutated = read(USING_AWM).replace(
    '### The built-in pair',
    'External routing uses `missing-external-orchestrator`.\n\n### The built-in pair',
  );
  assert.throws(
    () => assertBuiltInSkillReferencesResolve(mutated),
    /missing-external-orchestrator/,
  ); // verifies R2.3
});
```

- [x] **Step 2: Run R9 and observe RED on the production defect**

```bash
node tests/r9-declared-orchestrators-contract.test.mjs
```

Expected: FAIL with `using-awm built-in orchestration references non-local skills:
docs-system-orchestrator`. The mutation test itself must pass; the production-state test is
the only new failure.

### Task 4: Remove the hardcode and update baseline release metadata

_Requirements: R2.1, R2.2, R2.3, R2.4, R3.1_

**Repository:** `Kodria/awm-baseline-registry`

**Files:**
- Modify: `skills/using-awm/SKILL.md`
- Modify: `tests/r9-declared-orchestrators-contract.test.mjs`
- Modify: `catalog.json`
- Modify: `bundles/dev/bundle.json`
- Modify: `CHANGELOG.md`
- Modify: `AGENTS.md`

**Skills:** writing-skills, test-driven-development

- [x] **Step 1: Apply the minimal routing fix**

In `skills/using-awm/SKILL.md`, change the frontmatter version from `1.4.1` to `1.4.2`.
Replace:

```markdown
`brainstorming` explores solution space through `development-process`; `product-discovery` explores problem space. Documentation uses `docs-system-orchestrator`. Returning from development to product goes through `product-process`, never an improvised business answer.
```

with:

```markdown
`brainstorming` explores solution space through `development-process`; `product-discovery` explores problem space. Returning from development to product goes through `product-process`, never an improvised business answer.
```

Do not alter the declared-orchestrator directive, reference contract, or built-in routing
table.

- [x] **Step 2: Update release metadata and changelog**

Set the `dev` bundle version from `3.9.2` to `3.9.3` in both `catalog.json` and
`bundles/dev/bundle.json`.

Insert this entry directly below the changelog introduction:

```markdown
## dev 3.9.3 — 2026-09-05

### Fixed
- `using-awm` no longer hardcodes the opt-in documentation registry's orchestrator; the
  owning registry supplies it through AWM's declared-orchestrator contract.
- R9 now rejects bare built-in routing references that do not resolve to local baseline
  skills, including an explicit mutation proof for external hardcodes.

### Nota de versión
Bundle `dev` 3.9.2 → 3.9.3 (patch): restores the registry ownership boundary for
documentation routing without changing the built-in product/development pair.
```

- [x] **Step 3: Correct the stale historical statement in AGENTS.md**

In the `portable: true` lesson, replace the pending-work clause with this exact historical
statement:

```markdown
El transform mecánico ya corrige ese ruido cosmético desde [agentic-workflow#12](https://github.com/Kodria/agentic-workflow/issues/12), entregado por [agentic-workflow#19](https://github.com/Kodria/agentic-workflow/pull/19); los overrides siguen reservados para diferencias funcionales reales (contrato inline), no para path-cleanup.
```

Keep the rest of the lesson unchanged.

- [x] **Step 4: Run the focused contract**

```bash
node tests/r9-declared-orchestrators-contract.test.mjs
```

Expected: R9 passes all tests, including the external-skill mutation.

- [x] **Step 5: Verify the AGENTS.md correction precisely**

```bash
node --input-type=module <<'NODE'
import assert from 'node:assert/strict';
import fs from 'node:fs';

const agents = fs.readFileSync('AGENTS.md', 'utf8');
assert.match(agents, /agentic-workflow\/issues\/12/); // verifies R3.1
assert.match(agents, /agentic-workflow\/pull\/19/); // verifies R3.1
assert.doesNotMatch(agents, /El fix del ruido cosmético pertenece/); // verifies R3.1
NODE
```

Expected: exit 0 with no output.

- [x] **Step 6: Commit the baseline fix**

```bash
git add skills/using-awm/SKILL.md tests/r9-declared-orchestrators-contract.test.mjs catalog.json bundles/dev/bundle.json CHANGELOG.md AGENTS.md
git commit -m "fix(using-awm): delegate docs routing to registry declaration"
```

- [x] **Step 7: Run the post-commit version gate**

```bash
./scripts/check-skill-version-bumps.sh origin/main HEAD
```

Expected: `OK: every edited SKILL.md and affected bundle/catalog version advanced.` Run
this after the commit so `HEAD` contains the skill and metadata changes the gate compares.

### Task 5: Verify the coordinated delivery and prepare the baseline PR

_Requirements: R1.4, R2.1, R2.2, R2.3, R2.4, R3.1, R4.1, R4.2_

**Repository:** both registries; finish in `Kodria/awm-baseline-registry`

**Files:**
- Verify: all changed files from Tasks 1 and 4

**Skills:** verification-before-completion, requesting-code-review

- [x] **Step 1: Re-verify the released documentation declaration**

Use a new isolated `AWM_HOME`, clone the released tag, and register that checkout. Run:

```bash
RELEASE_VERIFICATION_ROOT=$(mktemp -d /tmp/awm-docs-37-release.XXXXXX)
RELEASE_AWM_HOME="$RELEASE_VERIFICATION_ROOT/home"
RELEASED_DOCS_REGISTRY="$RELEASE_VERIFICATION_ROOT/registry"
git clone --branch v1.1.0 --depth 1 https://github.com/Kodria/awm-documentation-registry.git "$RELEASED_DOCS_REGISTRY"
AWM_HOME="$RELEASE_AWM_HOME" npx -y agentic-workflow-manager@9.7.0 registry add "$RELEASED_DOCS_REGISTRY" --name docs-issue-37-release --no-install
AWM_HOME="$RELEASE_AWM_HOME" npx -y agentic-workflow-manager@9.7.0 context orchestrators --verify docs-system-orchestrator
```

Expected: exit 0. This is the blocking evidence for R4.2; do not continue on a non-zero
result.

- [ ] **Step 2: Run baseline focused and full verification**

Run each command separately from the baseline worktree:

```bash
node tests/r9-declared-orchestrators-contract.test.mjs
node scripts/validate-portability.mjs
node tests/validate-portability.test.mjs
node tests/r3-release-metadata.test.mjs
node --test tests/*.test.mjs
./scripts/check-skill-version-bumps.sh origin/main HEAD
awm sensors run
git diff --check origin/main...HEAD
```

Expected: every command exits 0; sensors report `overall: pass`; the version gate reports
the `using-awm` and `dev` bumps are valid.

- [x] **Step 3: Review both diffs against their live shared contracts**

Re-read the released documentation `awm-registry.json`, the baseline
`skills/using-awm/SKILL.md`, and `skills/using-awm/references/declared-orchestrators.md` from
their current branches. Confirm name, applicability, termination, precedence, and fallback
remain mutually consistent. Run the normal specification and code-quality reviews before
reporting implementation complete.

- [x] **Step 4: Prepare the baseline PR for the completion phase**

The eventual PR title must be:

```text
fix(using-awm): delegate docs routing to registry declaration
```

Its body must link the merged documentation PR, the published `v1.1.0` tag, and close
`#37`. Do not merge the baseline PR from this task; `finishing-a-development-branch` owns
the push-and-PR action after QA and retro.

## Enmienda de verificación final: expectativa R15 de metadata `dev`

- [x] La verificación final descubrió que `tests/r15-compact-slices-contract.test.mjs`
  fijaba `bundles/dev/bundle.json` en `3.9.2`, mientras que Task 4 elevó de forma
  deliberada y consistente el bundle y catálogo `dev` a `3.9.3`. La falla era una
  expectativa de release obsoleta, no un defecto de producto.
- [x] Se actualizó exclusivamente esa expectativa a `3.9.3` en
  `tests/r15-compact-slices-contract.test.mjs`; no se modificó producción ni la
  configuración de sensores.
- [x] Verificación posterior: `node tests/r15-compact-slices-contract.test.mjs`
  (20/20) y `node tests/r9-declared-orchestrators-contract.test.mjs` (8/8).

## Traceability matrix

| Requirement | Task(s) | Verification |
|---|---|---|
| R1.1 | T1 | T1 desired-state assertion checks the exact declaration and skill path |
| R1.2 | T1 | T1 desired-state assertion checks `minCliVersion: 8.3.0` |
| R1.3 | T1 | T1 desired-state assertion compares the complete three-field object |
| R1.4 | T2, T5 | Published AWM 9.7.0 `context orchestrators --verify` exits 0 against branch and release |
| R2.1 | T3, T4, T5 | R9 production-state test plus whole-contract review |
| R2.2 | T3, T4 | `assertBuiltInSkillReferencesResolve` validates every bare built-in reference |
| R2.3 | T3, T4 | R9 explicit `missing-external-orchestrator` mutation must fail |
| R2.4 | T4, T5 | `check-skill-version-bumps.sh origin/main HEAD` plus release-metadata test |
| R3.1 | T4, T5 | Exact Node assertions check issue #12, PR #19, and removal of pending wording |
| R4.1 | T2, T5 | Remote `v1.1.0` tag check precedes baseline modification and PR preparation |
| R4.2 | T2, T5 | Released-registry CLI verification is a blocking non-zero gate |
