# Change Record Skills (R7) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `subagent-driven-development`
> (recommended) or `executing-plans` to implement this plan task-by-task. Steps
> use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Teach `writing-plans` to declare the planned Change Record and `finishing-a-development-branch` to generate, validate and publish it (requirement R7 of Kodria/agentic-workflow#217), gated on `agentic-workflow-manager` ≥ 9.20.0.

**Architecture:** Prose-only changes to two skills of the `dev` bundle, each pinned by a new mutation-verified structural contract (`tests/r17-change-record-skills-contract.test.mjs`) wired into both blocking workflows. The CLI already ships every command the skills call (released as 9.20.0); the skills only orchestrate them and degrade with a stated limitation when they cannot.

**Tech Stack:** Markdown skills, Node 22 `node:test` contract tests, GitHub Actions (`validate.yml`, `auto-tag.yml`), bash version-bump gate.

**Change Record:** `change-record-skills`

**Criterios de aceptación:**
- En un repo con sensores y CLI ≥ 9.20.0, cerrar una rama con `finishing-a-development-branch` → queda `docs/changes/<fecha>-<slug>.md` commiteado y `awm change validate --strict` sale 0 antes del push.
- Abrir el PR creado por el skill → Summary y Test Plan salen del record y el cuerpo enlaza el archivo del record.
- Cerrar una rama con un CLI < 9.20.0 → el skill dice que no hay Change Record por la versión del CLI y continúa sin inventarlo.

**Modo de ejecución:** desatendido

> Mandato de ejecución desatendida: ejecución completa sin pausas de check-in
> entre tareas, ni de confirmación entre fases (development-process rutea
> automáticamente y subagent-driven-development no pregunta si continuar con
> el cierre). harness-retro triagea con criterio propio del agente (solo valor
> real, recurrente o sistémico — descarta el resto sin preguntar).
> post-implementation-qa corrige TODOS los hallazgos que surjan, no solo algunos.
> finishing-a-development-branch crea el PR directamente (opción "push + PR"),
> sin presentar el menú de 4 opciones.

**Modo de despacho:** proveedor-nativo

Dispatch note: the owner did not choose AWM routing, so this plan uses native-provider dispatch (`compact-slices/v1`).

Handoff gates (2026-10-17): `awm preflight --require-current` is current (CLI 9.20.0, registry v4.9.4). This registry declares sensors opt-out (`.awm/sensors.json` `mode: opt-out`), so `awm preflight --verify-sensors` cannot establish an empirical pass; per `writing-plans`, the evidence is strict currentness plus the versioned `validate.yml`/`auto-tag.yml` gates. `awm context-budget` reports 30KB vs 27KB (AGENTS.md 14KB, CONSTITUTION.md 16KB): accepted and noted here — this plan does not grow either file.

<!-- AWM:COMPACT-SLICES:START v1 -->
{"schema":"compact-slices/v1","planId":"change-record-skills-r7","requirements":["R7.1","R7.2","R7.3","R7.4"],"sources":[{"id":"SRC-WP-HEADER","path":"skills/writing-plans/SKILL.md","locator":"## Plan Document Header","fact":"The header template is the first ```markdown fence of this section; its lines end with **Tech Stack:**, **Modo de ejecución:** interactivo and **Modo de despacho:** proveedor-nativo; frontmatter version is \"2.2.0\"."},{"id":"SRC-WP-DISPATCH","path":"skills/writing-plans/SKILL.md","locator":"### Modo de despacho","fact":"Last subsection of ## Plan Document Header; it is followed directly by ## Slice Structure."},{"id":"SRC-FIN-UNATTENDED","path":"skills/finishing-a-development-branch/SKILL.md","locator":"### Modo desatendido","fact":"Unattended mode skips the menu and runs Option 2, which first runs Step 3.5 and Step 4.0; failing tests are a legitimate pause; frontmatter version is \"2.1.0\"."},{"id":"SRC-FIN-STEP40","path":"skills/finishing-a-development-branch/SKILL.md","locator":"#### Step 4.0: Retire design artifacts (Options 1 & 2 only)","fact":"Runs only for Options 1 and 2 before the merge/push, may create a cleanup commit, and ends with the line: Then continue with the chosen option's merge/push below."},{"id":"SRC-FIN-OPT2","path":"skills/finishing-a-development-branch/SKILL.md","locator":"#### Option 2: Push and Create PR/MR","fact":"Pushes first, then opens the PR with gh pr create and a heredoc body of ## Summary and ## Test Plan, or glab, or degrades to manual instructions."},{"id":"SRC-R10-TEST","path":"tests/r10-documentation-phase-contract.test.mjs","locator":"const read = relative => readFileSync(new URL(relative, root), 'utf8');","fact":"Contract tests read skill text from the repo root and assert phrases with node:assert/strict inside node:test tests."},{"id":"SRC-VALIDATE-YML","path":".github/workflows/validate.yml","locator":"- run: node tests/r10-documentation-phase-contract.test.mjs","fact":"Each contract test is one run step of the portability job."},{"id":"SRC-AUTOTAG-YML","path":".github/workflows/auto-tag.yml","locator":"node tests/r10-documentation-phase-contract.test.mjs","fact":"The auto-tag gate repeats every contract test as one line of a multi-line run block, before the tag is cut."},{"id":"SRC-COVERAGE-TEST","path":"tests/workflow-test-coverage.test.mjs","locator":"test('every top-level tests/*.test.mjs is named in some GitHub workflow'","fact":"Fails when a tests/*.test.mjs file is named in no workflow."},{"id":"SRC-PACKAGE","path":"package.json","locator":"\"test:release\"","fact":"npm scripts run named verifications; test:release runs tests/release-skill-version-gate.test.mjs."},{"id":"SRC-CATALOG","path":"catalog.json","locator":"{ \"name\": \"dev\"","fact":"The dev bundle entry has version \"4.10.0\"."},{"id":"SRC-BUNDLE","path":"bundles/dev/bundle.json","locator":"\"version\": \"4.10.0\"","fact":"The dev bundle owns writing-plans and finishing-a-development-branch."},{"id":"SRC-VERSION-BUMPS","path":"scripts/check-skill-version-bumps.sh","locator":"BASE=\"${1:-origin/main}\"","fact":"Fails when a changed skills/*/SKILL.md keeps its frontmatter version or its bundle version does not advance in both catalog.json and the bundle manifest."},{"id":"SRC-CHANGELOG","path":"CHANGELOG.md","locator":"Newest entry on top; append new releases directly below this line.","fact":"Entries are ## <conventional title> — <date> followed by bullets."},{"id":"SRC-CONSTITUTION","path":"CONSTITUTION.md","locator":"## Gates ejecutables — un gate no está terminado hasta que una mutación lo hace fallar","fact":"Every new automated check must be shown to fail on a deliberate mutation, with the right message."}],"commands":[{"id":"CMD-R17","program":"npm","args":["run","test:change-record"],"covers":["R7.1","R7.2","R7.3","R7.4"]},{"id":"CMD-WORKFLOW-COVERAGE","program":"npm","args":["run","test:workflow-coverage"],"covers":["R7.1"]},{"id":"CMD-COMPACT","program":"npm","args":["run","test:compact-only"],"covers":["R7.1","R7.2"]},{"id":"CMD-R2B","program":"npm","args":["run","test:r2b"],"covers":["R7.2"]},{"id":"CMD-RELEASE","program":"npm","args":["run","test:release"],"covers":["R7.4"]},{"id":"CMD-VERSION-BUMPS","program":"npm","args":["run","test:version-bumps"],"covers":["R7.4"]},{"id":"CMD-PORTABILITY","program":"npm","args":["run","test:portability"],"covers":["R7.1","R7.2","R7.3","R7.4"]},{"id":"CMD-PORTABILITY-SELFTEST","program":"npm","args":["run","test:portability-selftest"],"covers":["R7.4"]}],"slices":[{"id":"S1","title":"writing-plans declares the planned Change Record","requirements":["R7.1"],"dependsOn":[],"sectionAnchor":"slice-s1","sources":["SRC-WP-HEADER","SRC-WP-DISPATCH","SRC-R10-TEST","SRC-VALIDATE-YML","SRC-AUTOTAG-YML","SRC-COVERAGE-TEST","SRC-PACKAGE","SRC-CONSTITUTION"],"redCommands":["CMD-R17"],"greenCommands":["CMD-R17","CMD-WORKFLOW-COVERAGE","CMD-COMPACT"],"reviewEvidence":["specification","code-quality"],"risk":"full-context","fallback":["public-contract"]},{"id":"S2","title":"finishing generates, validates and publishes the record","requirements":["R7.2","R7.3"],"dependsOn":["S1"],"sectionAnchor":"slice-s2","sources":["SRC-FIN-UNATTENDED","SRC-FIN-STEP40","SRC-FIN-OPT2","SRC-CONSTITUTION"],"redCommands":["CMD-R17"],"greenCommands":["CMD-R17","CMD-COMPACT","CMD-R2B"],"reviewEvidence":["specification","code-quality"],"risk":"full-context","fallback":["public-contract"]},{"id":"S3","title":"CLI version gate and release metadata","requirements":["R7.4"],"dependsOn":["S2"],"sectionAnchor":"slice-s3","sources":["SRC-WP-DISPATCH","SRC-FIN-UNATTENDED","SRC-FIN-STEP40","SRC-CATALOG","SRC-BUNDLE","SRC-VERSION-BUMPS","SRC-CHANGELOG","SRC-PACKAGE","SRC-CONSTITUTION"],"redCommands":["CMD-R17"],"greenCommands":["CMD-R17","CMD-RELEASE","CMD-VERSION-BUMPS","CMD-PORTABILITY","CMD-PORTABILITY-SELFTEST"],"reviewEvidence":["specification","code-quality"],"risk":"full-context","fallback":["public-contract","root-configuration"]}],"closureCommands":["CMD-R17","CMD-WORKFLOW-COVERAGE","CMD-COMPACT","CMD-R2B","CMD-RELEASE","CMD-VERSION-BUMPS","CMD-PORTABILITY","CMD-PORTABILITY-SELFTEST"]}
<!-- AWM:COMPACT-SLICES:END v1 -->

## Shared contract (stated once)

**Requirements (inlined from `Kodria/agentic-workflow` `docs/plans/2026-10-17-change-record-design.md`, section R7, approved 2026-10-17; that file lives in another repository):**

- **R7.1 — writing-plans:** THE plan header SHALL declare the planned Change Record slug and the acceptance criteria that `manual_validation` will draw from. The skill SHALL state that `type/scope/semver` are derived and are not declared.
- **R7.2 — finishing-a-development-branch:** Before Option 1 (merge) and Option 2 (push/PR), THE skill SHALL instruct the agent to: 1. commit; 2. run `awm sensors run`; 3. run `awm change new <slug>` (or `--refresh`); 4. write every narrative field and section from the plan, QA results and diff; 5. commit the record; 6. run `awm change validate --strict`, and stop on a non-zero exit. Trivial changes MAY instead use the `Change-Record: none` trailer, with the reason stated in the commit body.
- **R7.3 — PR body:** For Option 2, THE skill SHALL build the PR body's Summary and Test Plan from the record's `summary_short`, `## Qué se hizo`, `## Qué se probó` and `manual_validation`, and SHALL link the record file.
- **R7.4 — Version gate:** THE changed skills SHALL declare the minimum CLI version that ships R2–R5. IF the commands are unavailable, THEN the skill SHALL state the limitation and continue without the record, never inventing it.
- **DD-11:** only `finishing-a-development-branch` and `writing-plans` change. Retro, QA and docs skills stay unchanged.

**CLI facts the skill text relies on (verified against the published `agentic-workflow-manager@9.20.0`, the first version that ships R2–R5):**

- Record path `docs/changes/<YYYY-MM-DD>-<slug>.md`; slug `^[a-z0-9]+(-[a-z0-9]+)*$`, at most 64 characters. Narrative fields: `title` (≤120), `summary_short` (one line, ≤280), `manual_validation` (non-empty list of `{step, expected}` or `{none: <reason>}`), `risks` (list, may be empty), `rollback`; body sections `## Qué se hizo`, `## Qué se probó`, `## Qué falta validar`, `## Riesgos y rollback`, in that order, none empty. Derived fields: `type`, `scope`, `semver`, `breaking`, `modules`, `verification`.
- `awm sensors run` writes the receipt `.awm/sensors/runs/<commit>.json` only for a full run on a clean tree with at least one sensor run; otherwise it prints one stderr line starting `no sensor receipt written: `. In a project whose `.awm/sensors.json` declares `"mode": "opt-out"` it prints JSON with `"overall": "not_certified"`, `"mode": "opt-out"`, `"reason": "opt-out-declared"` and exits 1, and no receipt exists.
- `awm change new <slug> [--plan <path>] [--issue <url>]` writes a skeleton whose narrative carries `<!-- awm:pending -->`; it exits 2 with `receipt-missing` (remedy `commit your work, then run awm sensors run`) when HEAD has no receipt, and with `record-exists` when the slug already has a record; `--refresh` recomputes only the derived fields.
- Commits that only touch `docs/changes/` are ignored by derivation and by `code-changed-after-verification`, so committing the record never invalidates it.
- `awm change validate --strict` exits 0 when valid and 2 otherwise. Diagnostic codes it can print include `pending-content`, `field-invalid`, `body-section-missing`, `record-uncommitted`, `derived-mismatch`, `code-changed-after-verification`, `receipt-missing`, `verification-mismatch`, `verification-not-passing`.
- The opt-out trailer `Change-Record: none` counts only in the final paragraph of a commit message; a squash merge concatenates messages, so the trailer must also close the squash message (the PR description).
- `awm --version` prints the bare version (for example `9.19.0`). On 9.19.0, `awm change validate --help` exits 0 even though the command does not exist, so `--help` is not a usable probe.

**Registry rules:** every changed `skills/*/SKILL.md` bumps its frontmatter `version`, and the owning bundle (`dev`) bumps in both `catalog.json` and `bundles/dev/bundle.json` (`scripts/check-skill-version-bumps.sh`). Every `tests/*.test.mjs` is named in a workflow (`tests/workflow-test-coverage.test.mjs`). `awm-registry.json` `minCliVersion` stays `9.14.0`: R7.4 is a per-skill minimum with graceful degradation, not a raise of the registry floor (`tests/cli-floor-decoupling.test.mjs`). Every new gate is mutation-verified (SRC-CONSTITUTION): the contract test itself applies each assertion to a mutated copy of the shipped text and expects it to throw.

**Commits:** conventional commits, each ending with:

```
Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01E3bMVia26CjuPhe57xPoQx
```

<a id="slice-s1"></a>
### Slice S1: writing-plans declares the planned Change Record

#### Surfaces
**Owns R7.1.** One cohesive boundary: the plan header template and the subsection that explains it, plus the contract test file and its CI wiring that every later slice extends.

**Files:**
- Modify `skills/writing-plans/SKILL.md` (header template, new `### Change Record` subsection, frontmatter `version: "2.2.0"` → `version: "2.3.0"`)
- Create `tests/r17-change-record-skills-contract.test.mjs`
- Modify `package.json` (scripts `test:change-record`, `test:workflow-coverage`)
- Modify `.github/workflows/validate.yml` and `.github/workflows/auto-tag.yml` (run the new test)

**Interfaces:** the test file exports nothing; it defines the helpers `read`, `section`, `headerTemplate`, `mutated` and one `assert*` function per requirement claim, reused by S2 and S3.

#### Implementation
**Dependencies:** none.

- [ ] **Step 1: Add the npm scripts.** In `package.json` `scripts`, after the `"test:release"` line, add:

```json
    "test:change-record": "node --test tests/r17-change-record-skills-contract.test.mjs",
    "test:workflow-coverage": "node --test tests/workflow-test-coverage.test.mjs",
```

- [ ] **Step 2: Write the failing test** `tests/r17-change-record-skills-contract.test.mjs`:

```js
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

// Kodria/agentic-workflow#217 R7: the two skills that produce the Change Record.
// Every assert* helper runs on the shipped text and on a mutation of it, so a
// gate that cannot go red fails here (CONSTITUTION.md, "Gates ejecutables").
const read = relative => readFileSync(new URL(`../${relative}`, import.meta.url), 'utf8');
const WRITING = 'skills/writing-plans/SKILL.md';
const FINISHING = 'skills/finishing-a-development-branch/SKILL.md';

// The lines under `heading` up to the next heading of the same or a higher
// level. Lines inside ``` fences never end a section: the skills quote
// `# Title` and `## Summary` inside templates.
function section(text, heading) {
  const lines = text.split('\n');
  const start = lines.indexOf(heading);
  assert.ok(start >= 0, `missing section ${heading}`);
  const level = heading.match(/^#+/)[0].length;
  let fenced = false;
  const body = [];
  for (const line of lines.slice(start + 1)) {
    if (line.startsWith('```')) fenced = !fenced;
    if (!fenced && /^#+ /.test(line) && line.match(/^#+/)[0].length <= level) break;
    body.push(line);
  }
  return body.join('\n');
}

function mutated(text, from, to) {
  assert.ok(text.includes(from), `mutation anchor not found: ${from}`);
  return text.replace(from, to);
}

function headerTemplate(text) {
  const match = section(text, '## Plan Document Header').match(/```markdown\n([\s\S]*?)\n```/);
  assert.ok(match, 'the plan header template block is missing');
  return match[1];
}

function assertPlanHeaderDeclaresRecord(text) {
  const template = headerTemplate(text);
  assert.match(template, /^\*\*Change Record:\*\* `<slug>`$/m, 'the header template must declare the planned Change Record slug');
  assert.match(template, /^\*\*Criterios de aceptación:\*\*$/m, 'the header template must declare the acceptance criteria');
  assert.match(template, /^- <paso> → <resultado esperado>$/m, 'each acceptance criterion must pair a step with its expected result');
}

function assertRecordSubsection(text) {
  const body = section(text, '### Change Record');
  assert.ok(body.includes('`^[a-z0-9]+(-[a-z0-9]+)*$`'), 'the subsection must state the slug rule');
  assert.match(body, /fuente de `manual_validation`/, 'the acceptance criteria must be named as the source of manual_validation');
  assert.ok(body.includes('`type`, `scope` y `semver` **no se declaran**'), 'the skill must state that type, scope and semver are not declared');
  assert.match(body, /deriva[^.]*commits/, 'the skill must state that they are derived from the commits');
}

test('R7.1: the plan header template declares the planned Change Record and its acceptance criteria', () => {
  const text = read(WRITING);                                 // verifies R7.1
  assertPlanHeaderDeclaresRecord(text);
  assert.throws(() => assertPlanHeaderDeclaresRecord(mutated(text, '**Change Record:** `<slug>`', '**Record:** `<slug>`')), /planned Change Record slug/);
  assert.throws(() => assertPlanHeaderDeclaresRecord(mutated(text, '**Criterios de aceptación:**\n', '**Criterios:**\n')), /acceptance criteria/);
  assert.throws(() => assertPlanHeaderDeclaresRecord(mutated(text, '- <paso> → <resultado esperado>', '- <paso>')), /expected result/);
});

test('R7.1: writing-plans states that type, scope and semver are derived, never declared', () => {
  const text = read(WRITING);                                 // verifies R7.1
  assertRecordSubsection(text);
  assert.throws(() => assertRecordSubsection(mutated(text, '`type`, `scope` y `semver` **no se declaran**', '`type`, `scope` y `semver` se declaran')), /not declared/);
  assert.throws(() => assertRecordSubsection(mutated(text, 'fuente de `manual_validation`', 'fuente de la validación')), /source of manual_validation/);
  assert.throws(() => assertRecordSubsection(mutated(text, '### Change Record\n', '### Registro\n')), /missing section ### Change Record/);
});
```

- [ ] **Step 3: Run it RED.** `npm run test:change-record` → both tests fail (`the plan header template must declare the planned Change Record slug`, `missing section ### Change Record`).

- [ ] **Step 4: Edit the header template.** In `skills/writing-plans/SKILL.md`, inside the `## Plan Document Header` template fence, replace

~~~~markdown
**Tech Stack:** [Key technologies/libraries]

**Modo de ejecución:** interactivo
~~~~

with

~~~~markdown
**Tech Stack:** [Key technologies/libraries]

**Change Record:** `<slug>`

**Criterios de aceptación:**
- <paso> → <resultado esperado>

**Modo de ejecución:** interactivo
~~~~

- [ ] **Step 5: Add the subsection.** Insert immediately before the line `## Slice Structure` (so it is the last subsection of `## Plan Document Header`, after `### Modo de despacho`), followed by one blank line:

~~~~markdown
### Change Record

Todo plan nuevo declara en la cabecera el Change Record (`awm.change-record/v1`) que su rama va a producir. `finishing-a-development-branch` lo genera y lo valida antes de integrar; el plan solo fija la intención:

- `**Change Record:**` lleva el slug planeado entre backticks: minúsculas, dígitos y guiones (`^[a-z0-9]+(-[a-z0-9]+)*$`), como máximo 64 caracteres. finishing corre `awm change new <slug>` con ese slug y el record queda en `docs/changes/<YYYY-MM-DD>-<slug>.md`.
- `**Criterios de aceptación:**` lista lo que un humano tiene que validar a mano después del merge, una línea `- <paso> → <resultado esperado>` por criterio. Es la fuente de `manual_validation` del record: cada línea se convierte en un ítem `{step, expected}`. Si no hay nada que validar a mano, escribe una sola línea `- ninguno: <razón>`, que se convierte en `manual_validation: {none: <razón>}`.
- `type`, `scope` y `semver` **no se declaran** en el plan: el CLI los deriva de los commits convencionales de la rama, y `awm change validate` rechaza un record que los contradiga (`derived-mismatch`). Declararlos aquí crearía una segunda fuente que diverge de los commits.
- Un cambio trivial que no merece record (un bump de versión, un typo) declara `**Change Record:** ninguno — <razón>`; finishing usa entonces el trailer `Change-Record: none`.
~~~~

- [ ] **Step 6: Bump the skill.** Frontmatter `version: "2.2.0"` → `version: "2.3.0"`.

- [ ] **Step 7: Wire CI.** In `.github/workflows/validate.yml`, directly after `      - run: node tests/r10-documentation-phase-contract.test.mjs`, add `      - run: node --test tests/r17-change-record-skills-contract.test.mjs`. In `.github/workflows/auto-tag.yml`, directly after `          node tests/r10-documentation-phase-contract.test.mjs`, add `          node --test tests/r17-change-record-skills-contract.test.mjs` (same indentation as its neighbours).

- [ ] **Step 8: Run GREEN.** `npm run test:change-record` (2 pass), `npm run test:workflow-coverage` (pass), `npm run test:compact-only` (pass).

- [ ] **Step 9: Commit** `feat(writing-plans): declare the planned Change Record in the plan header`.

#### Edge cases
- The template fence quotes `# [Feature Name] Implementation Plan`; `section()` must ignore fenced lines or the header section would end at that line. The first mutation in each test proves the assertion is scoped and live.
- The new header lines sit **before** `**Modo de ejecución:**` and outside any `**Modo de despacho:**` line: the CLI counts every `**Modo de despacho:**` line before the manifest, and the new lines must not add one.
- Prose in `### Change Record` mentions `**Change Record:**` only inline (inside backticks within a sentence), never as a full line, so the line-anchored template assertions cannot be satisfied by the prose.
- `mutated()` fails loudly when its anchor is absent, so a renamed phrase can never turn a mutation check into a silent no-op.
- No other section of `writing-plans` changes (DD-11); the existing `test:compact-only` contract (`## Compact-only authoring`, strict currentness) must stay green.

#### Evidence
SRC-WP-HEADER and SRC-WP-DISPATCH give the edit points; SRC-R10-TEST the test idiom; SRC-VALIDATE-YML, SRC-AUTOTAG-YML and SRC-COVERAGE-TEST the wiring; SRC-PACKAGE the script idiom; SRC-CONSTITUTION the mutation rule. RED: CMD-R17 fails before Steps 4–6. GREEN: CMD-R17, CMD-WORKFLOW-COVERAGE, CMD-COMPACT. Distinct clean specification and code-quality verdicts; reconcile against the diff and the current plan identity.

#### Fallback
Public-contract risk (every future plan's header): full relevant context, all reviewers kept. If `awm plan validate` or the compact contract rejects the new header lines, stop with an amendment to this plan instead of reshaping the template ad hoc.

<a id="slice-s2"></a>
### Slice S2: finishing generates, validates and publishes the record

#### Surfaces
**Owns R7.2 and R7.3.** Grouped because the PR body (R7.3) consumes the record that the new Step 4.1 (R7.2) produces, in the same skill and the same Option 2 path.

**Files:**
- Modify `skills/finishing-a-development-branch/SKILL.md` (core principle, `### Modo desatendido`, Step 3, new `#### Step 4.1`, Options 1 and 2, Quick Reference, Common Mistakes, Red Flags; frontmatter `version: "2.1.0"` → `version: "2.2.0"`)
- Modify `tests/r17-change-record-skills-contract.test.mjs` (append)

#### Implementation
**Dependencies:** S1 (test helpers).

- [ ] **Step 1: Append the failing tests** to `tests/r17-change-record-skills-contract.test.mjs`:

```js
const STEP_41 = '#### Step 4.1: Change Record (Options 1 & 2 only)';
const RECORD_STEPS = [
  ['commit', /^1\. \*\*Commit\.\*\*/m],
  ['sensors', /^2\. \*\*Run the sensors:\*\* `awm sensors run`/m],
  ['skeleton', /^3\. \*\*Create the skeleton:\*\* `awm change new <slug>`/m],
  ['narrative', /^4\. \*\*Write the narrative\.\*\*/m],
  ['record commit', /^5\. \*\*Commit the record\*\*/m],
  ['strict validation', /^6\. \*\*Validate:\*\* `awm change validate --strict`/m],
];

function assertRecordSequence(text) {
  const step = section(text, STEP_41);
  let last = -1;
  for (const [name, pattern] of RECORD_STEPS) {
    const at = step.search(pattern);
    assert.ok(at >= 0, `Step 4.1 must include the ${name} step`);
    assert.ok(at > last, `Step 4.1 lists the ${name} step out of order`);
    last = at;
  }
  assert.match(step, /`awm change new <slug> --refresh`/, 'an existing record must be refreshed, never overwritten');
  assert.match(step, /Non-zero → stop/, 'a failing strict validation must stop the integration');
  for (const source of ['the plan', '`post-implementation-qa` results', 'the diff']) {
    assert.ok(step.includes(source), `the narrative must be written from ${source}`);
  }
  assert.match(step, /`Change-Record: none`, with the reason in the commit body/, 'trivial changes may use the opt-out trailer with a reason');
  assert.match(step, /never add `Change-Record: none` to hide it/, 'a sensors opt-out must not be disguised as an exemption');
}

function assertRecordRunsBeforeIntegration(text) {
  for (const option of ['#### Option 1: Merge Locally', '#### Option 2: Push and Create PR/MR']) {
    assert.match(section(text, option), /run Step 4\.0 \(retire design artifacts\), then Step 4\.1 \(Change Record\)/, `${option} must run the Change Record step before integrating`);
  }
  const at = heading => text.indexOf(`\n${heading}\n`);
  assert.ok(at('#### Step 4.0: Retire design artifacts (Options 1 & 2 only)') < at(STEP_41) && at(STEP_41) < at('#### Option 1: Merge Locally'),
    'Step 4.1 must sit after Step 4.0 and before Option 1');
}

function assertUnattendedKeepsRecordGate(text) {
  const unattended = section(text, '### Modo desatendido');
  assert.match(unattended, /el Step 4\.1 \(Change Record\)/, 'unattended mode must run the Change Record step');
  assert.match(unattended, /`awm change validate --strict`[^.]*pausa legítima/, 'a failing record step must be a legitimate pause in unattended mode');
}

function assertPrBodyFromRecord(text) {
  const option = section(text, '#### Option 2: Push and Create PR/MR');
  const body = option.match(/gh pr create[\s\S]*?\nEOF\n/);
  assert.ok(body, 'Option 2 must show the gh pr create body');
  for (const source of ['<summary_short>', '## Qué se hizo', '## Qué se probó', 'manual_validation']) {
    assert.ok(body[0].includes(source), `the PR body must draw from ${source}`);
  }
  assert.match(body[0], /^Change Record: \[`docs\/changes\/<file>`\]\(/m, 'the PR body must link the record file');
  assert.match(option, /not from memory/, 'the skill must say the body comes from the record');
}

test('R7.2: Step 4.1 runs the six record steps in order and stops on a failing strict validation', () => {
  const text = read(FINISHING);                               // verifies R7.2
  assertRecordSequence(text);
  assert.throws(() => assertRecordSequence(mutated(text, '6. **Validate:** `awm change validate --strict`', '6. **Validate:** `awm change validate`')), /strict validation step/);
  assert.throws(() => assertRecordSequence(mutated(text, 'Non-zero → stop', 'Non-zero → continue')), /must stop the integration/);
  assert.throws(() => assertRecordSequence(mutated(text, '`Change-Record: none`, with the reason in the commit body', '`Change-Record: none`')), /opt-out trailer/);
  assert.throws(() => assertRecordSequence(mutated(text, 'never add `Change-Record: none` to hide it', 'add `Change-Record: none`')), /disguised/);
  const early = mutated(text, '1. **Commit.**', '6. **Validate:** `awm change validate --strict` first\n1. **Commit.**');
  assert.throws(() => assertRecordSequence(early), /strict validation step out of order/);
});

test('R7.2: Options 1 and 2 run the record after Step 4.0 and before integrating, in both modes', () => {
  const text = read(FINISHING);                               // verifies R7.2
  assertRecordRunsBeforeIntegration(text);
  assertUnattendedKeepsRecordGate(text);
  assert.throws(() => assertRecordRunsBeforeIntegration(mutated(text, 'run Step 4.0 (retire design artifacts), then Step 4.1 (Change Record)', 'run Step 4.0 (retire design artifacts)')), /must run the Change Record step/);
  assert.throws(() => assertUnattendedKeepsRecordGate(mutated(text, 'pausa legítima como los tests rojos', 'advertencia')), /legitimate pause/);
});

test('R7.3: the Option 2 PR body is built from the record and links it', () => {
  const text = read(FINISHING);                               // verifies R7.3
  assertPrBodyFromRecord(text);
  assert.throws(() => assertPrBodyFromRecord(mutated(text, '<summary_short>\n', '<2-3 bullets of what changed>\n')), /draw from <summary_short>/);
  assert.throws(() => assertPrBodyFromRecord(mutated(text, 'Change Record: [`docs/changes/<file>`](', 'Record: (')), /link the record file/);
  assert.throws(() => assertPrBodyFromRecord(mutated(text, '<each manual_validation step>', '<each manual step>')), /draw from manual_validation/);
});
```

- [ ] **Step 2: Run RED.** `npm run test:change-record` → the three new tests fail (`missing section #### Step 4.1: Change Record (Options 1 & 2 only)` and the Option checks); the S1 tests stay green.

- [ ] **Step 3: Core principle.** Replace `**Core principle:** Verify tests → Present options → Execute choice → Clean up.` with `**Core principle:** Verify tests → Present options → Change Record → Execute choice → Clean up.`

- [ ] **Step 4: Unattended mode.** In `### Modo desatendido`, in the first paragraph replace `que corre primero el Step 3.5 (detección de host) y luego el Step 4.0 (retiro de artefactos de diseño) automáticamente, sin prompt.` with `que corre primero el Step 3.5 (detección de host), luego el Step 4.0 (retiro de artefactos de diseño) y el Step 4.1 (Change Record) automáticamente, sin prompt.` Then insert, as a new paragraph directly after that first paragraph:

~~~~markdown
El Step 4.1 (Change Record) corre igual que en modo interactivo: si `awm change new` o `awm change validate --strict` terminan con exit distinto de cero, es una pausa legítima como los tests rojos — detente y reporta el diagnóstico sin pushear ni crear el PR/MR. Solo la limitación de sensores opt-out (ver Step 4.1) continúa sin record.
~~~~

- [ ] **Step 5: Step 3.** In the `**Modo desatendido:**` paragraph of `### Step 3: Present Options`, replace `(que corre el Step 3.5 de detección de host y el Step 4.0 de retiro de artefactos primero)` with `(que corre primero el Step 3.5 de detección de host, el Step 4.0 de retiro de artefactos y el Step 4.1 de Change Record)`.

- [ ] **Step 6: Step 4.1.** Replace the last line of Step 4.0, `Then continue with the chosen option's merge/push below.`, with `Then continue with Step 4.1 (Change Record).` and insert after it, before `#### Option 1: Merge Locally`, this block (blank line before and after):

~~~~markdown
#### Step 4.1: Change Record (Options 1 & 2 only)

**Runs only on the integration paths (Option 1 Merge, Option 2 PR/MR), after Step 4.0 and before the merge/push below. Skip entirely for Options 3 and 4.** It runs after Step 4.0 because the retirement commit changes files: a record verified before that commit fails validation with `code-changed-after-verification`.

Every integrated change leaves one Change Record (`awm.change-record/v1`) at `docs/changes/<YYYY-MM-DD>-<slug>.md`: a short, structured answer to what the change did, what was verified and what a human still has to validate, readable without the code. The CLI derives the deterministic fields (`type`, `scope`, `semver`, `breaking`, `modules`, `verification`) from git and from the sensor-run receipt; you write only the narrative.

1. **Commit.** Commit all pending work. The working tree must be clean: a dirty tree gets no sensor receipt.
2. **Run the sensors:** `awm sensors run`. A full run on a clean tree writes the receipt `.awm/sensors/runs/<commit>.json` (local, never committed).
   - `overall` other than `pass` → stop exactly as for failing tests in Step 1: report it and do not merge or push.
   - The JSON has `"mode": "opt-out"` (the project deliberately declares no sensors) → no receipt can exist, so no record can be certified. State the limitation once (`Sin Change Record: el proyecto declara sensores opt-out; no hay receipt que certifique la verificación`) and continue to the merge/push without a record. Never invent one, and never add `Change-Record: none` to hide it: `awm changes list` reports the change as `missing`, which is the truth.
   - Any other stderr line `no sensor receipt written: <reason>` → stop and report it; fix its cause (usually: commit the pending work) and run this step again.
3. **Create the skeleton:** `awm change new <slug>`, with the slug from the plan's `**Change Record:**` header (for a plan without one, derive it from the branch name: lowercase letters, digits and hyphens, at most 64 characters). Pass `--plan <plan-path>`, and `--issue <https-url>` when the plan names an issue. If the record already exists (`record-exists`), run `awm change new <slug> --refresh` instead: it recomputes only the derived fields and keeps the narrative. Any other non-zero exit → stop and report the diagnostic with its `remedy:` line.
4. **Write the narrative.** Replace every `<!-- awm:pending -->` marker, drawing from the plan (goal and `**Criterios de aceptación:**`), the `post-implementation-qa` results and the diff (`git diff <base-branch>...HEAD`):
   - `title` (at most 120 characters) and `summary_short` (one line, at most 280 characters, written for someone who will not read the code);
   - `manual_validation`: one `{step, expected}` item per acceptance criterion of the plan, or `{none: <razón>}` when the plan says `ninguno`;
   - `risks` (may be `[]`) and `rollback` (how to undo the change);
   - the body sections, in this order and none empty: `## Qué se hizo`, `## Qué se probó` (only checks that actually ran, with their result), `## Qué falta validar`, `## Riesgos y rollback`.

   Never edit the derived fields by hand: validation recomputes them.
5. **Commit the record** on its own: `git add docs/changes/<file>`, then `git commit -m "docs(changes): add change record <slug>"`. A commit that only touches `docs/changes/` changes neither the derived fields nor what the receipt certifies.
6. **Validate:** `awm change validate --strict`. Exit 0 → continue. Non-zero → stop: report every diagnostic, and never merge or push past a failing strict validation, in either mode. Fix it and repeat from the step the diagnostic points to: `pending-content`, `field-invalid` or `body-section-missing` → step 4, then commit the fix; `record-uncommitted` → step 5; `code-changed-after-verification`, `derived-mismatch`, `receipt-missing` or `verification-mismatch` → step 2, then `--refresh` in step 3; `verification-not-passing` → fix the failing sensors first.

**Trivial changes (opt-out):** a change too small to merit a record (a version bump, a typo) MAY skip steps 2–6 by ending one of its commit messages with the trailer `Change-Record: none`, with the reason in the commit body:

```bash
git commit -m "chore: bump version" -m "Trivial: version bump only, nothing to validate." -m "Change-Record: none"
```

The trailer counts only in the final paragraph of a commit message. A host that squash-merges concatenates the branch's messages, so for Option 2 also end the PR/MR description with a `Change-Record: none` paragraph.

Then continue with the chosen option's merge/push below.
~~~~

- [ ] **Step 7: Options 1 and 2.** In both `#### Option 1: Merge Locally` and `#### Option 2: Push and Create PR/MR`, replace `**First, run Step 4.0 (retire design artifacts).**` with `**First, run Step 4.0 (retire design artifacts), then Step 4.1 (Change Record).**`.

- [ ] **Step 8: Option 2 PR body.** In `#### Option 2`, replace the block from `**\`HOST=github\` → use \`gh\`, if installed:**` through the closing fence of the `gh pr create` example with:

~~~~markdown
Build the PR/MR body from the Change Record of Step 4.1, not from memory. **Summary** is its `summary_short` followed by the bullets of `## Qué se hizo`. **Test Plan** lists what `## Qué se probó` says already ran (checked), then each `manual_validation` item as a pending check; `{none: <razón>}` becomes the single line `Sin validación manual: <razón>`. Link the record file. Without a record (a limitation of Step 4.1, or the trivial opt-out), fill Summary and Test Plan from the plan, the QA results and the diff, write `Change Record: ninguno — <razón>` in place of the link, and for the opt-out end the body with a `Change-Record: none` paragraph.

**`HOST=github` → use `gh`, if installed:**

```bash
gh pr create --title "<title>" --body "$(cat <<'EOF'
## Summary
<summary_short>

<bullets from ## Qué se hizo>

## Test Plan
- [x] <each check from ## Qué se probó>
- [ ] <each manual_validation step> → <expected>

Change Record: [`docs/changes/<file>`](<remote-url-without-.git>/blob/<feature-branch>/docs/changes/<file>)
EOF
)"
```
~~~~

In the `HOST=gitlab` paragraph replace `open it with a title and a description covering the summary and test plan` with `open it with a title and a description built exactly like the \`gh\` body above`. In the `HOST=unknown` block, after `Otherwise: push is done — open a merge/pull request for <feature-branch> against <base-branch> from your host's web UI.` and its closing fence, add the line `Give the operator the PR/MR body built above, ready to paste.`

- [ ] **Step 9: Quick Reference, Common Mistakes, Red Flags.** Replace the Quick Reference table with:

~~~~markdown
| Option | Merge | Push | Keep Worktree | Cleanup Branch | Retire artifacts | Change Record |
|--------|-------|------|---------------|----------------|------------------|---------------|
| 1. Merge locally | ✓ | - | - | ✓ | ✓ (if any) | ✓ |
| 2. Create PR/MR | - | ✓ | ✓ | - | ✓ (if any) | ✓ |
| 3. Keep as-is | - | - | ✓ | - | - | - |
| 4. Discard | - | - | - | ✓ (force) | - | - |
~~~~

Append to `## Common Mistakes` (after the `**Silently skipping PR/MR creation**` entry):

~~~~markdown
**Integrating without a validated Change Record**
- **Problem:** The merge or PR lands with no record, or with one that `awm change validate --strict` rejects, and the next day nobody can tell what it did or what still needs validating
- **Fix:** Run Step 4.1 before the merge/push of Options 1 & 2 and stop on any non-zero exit

**Writing the PR/MR body from memory**
- **Problem:** Summary and Test Plan drift from what was actually verified
- **Fix:** Build them from the record's `summary_short`, `## Qué se hizo`, `## Qué se probó` and `manual_validation`, and link the record
~~~~

In `## Red Flags`, append to **Never:** `- Merge or push after \`awm change validate --strict\` failed` and `- Invent a Change Record or edit its derived fields by hand`; append to **Always:** `- Run Step 4.1 (Change Record) after Step 4.0 and before the merge/push of Options 1 & 2`.

- [ ] **Step 10: Bump the skill.** Frontmatter `version: "2.1.0"` → `version: "2.2.0"`.

- [ ] **Step 11: Run GREEN.** `npm run test:change-record` (5 pass), `npm run test:compact-only`, `npm run test:r2b`.

- [ ] **Step 12: Commit** `feat(finishing): generate and validate the Change Record before integrating`.

#### Edge cases
- Step 4.1 must come **after** Step 4.0: the retirement commit changes `.stitch/designs/` and a design doc, which would make a record verified earlier fail with `code-changed-after-verification` (asserted by the heading-order check).
- Sensors opt-out (this registry itself is one) cannot produce a receipt; the skill states the limitation and continues, and must never disguise it as `Change-Record: none` (asserted).
- A failing `awm sensors run` verdict stops like failing tests; it never degrades into "no record".
- An existing record is refreshed with `--refresh`, never deleted and recreated, so the narrative survives a re-verification.
- The `gh pr create` body contains `## Summary`/`## Test Plan` lines inside a fence; `section()` ignores fenced lines, otherwise the Option 2 section would end at `## Summary` and the R7.3 assertion would read a truncated body.
- The existing `routed finishing obligation` paragraph (pinned by `test:r2b`) and the compact-admission link (pinned by `test:compact-only`) stay untouched.
- Options 3 and 4 never run Step 4.1 (stated in its first paragraph and in the Quick Reference).

#### Evidence
SRC-FIN-UNATTENDED, SRC-FIN-STEP40 and SRC-FIN-OPT2 give the edit points; CLI facts come from the Shared contract. RED: the three new tests fail before Steps 3–10. GREEN: CMD-R17, CMD-COMPACT, CMD-R2B. Each new assertion is shown failing on its mutation inside the test itself. Distinct clean specification and code-quality verdicts; reconcile against the diff and the current plan identity.

#### Fallback
Public-contract risk (the closing step of every AWM branch): full relevant context, all reviewers kept. If a CLI fact in the Shared contract proves wrong against 9.20.0, stop and amend the plan with the observed behavior before editing the skill text.

<a id="slice-s3"></a>
### Slice S3: CLI version gate and release metadata

#### Surfaces
**Owns R7.4.** One boundary: the minimum-CLI declaration in both changed skills, the graceful degradation in finishing, and the release metadata that ships them (bundle bump, CHANGELOG).

**Files:**
- Modify `skills/writing-plans/SKILL.md` (append to `### Change Record`)
- Modify `skills/finishing-a-development-branch/SKILL.md` (Step 4.1 item 0, `### Modo desatendido` sentence)
- Modify `catalog.json` and `bundles/dev/bundle.json` (`dev` `4.10.0` → `4.11.0`)
- Modify `CHANGELOG.md` (new top entry)
- Modify `package.json` (script `test:version-bumps`)
- Modify `tests/r17-change-record-skills-contract.test.mjs` (append)

#### Implementation
**Dependencies:** S2 (Step 4.1 exists).

- [ ] **Step 1: Add the npm script.** In `package.json` `scripts`, after `"test:workflow-coverage"`, add `"test:version-bumps": "./scripts/check-skill-version-bumps.sh origin/main HEAD",`.

- [ ] **Step 2: Append the failing tests:**

```js
const MIN_CLI = '9.20.0';

function assertDeclaresMinimumCli(text, name) {
  assert.ok(text.includes(`\`agentic-workflow-manager\` ≥ ${MIN_CLI}`), `${name} must declare the minimum CLI version ${MIN_CLI}`);
}

function assertGracefulDegradation(text) {
  const step = section(text, STEP_41);
  assert.match(step, /^0\. \*\*Version gate\.\*\*/m, 'Step 4.1 must start with the version gate');
  assert.ok(step.indexOf('0. **Version gate.**') < step.indexOf('1. **Commit.**'), 'the version gate must run before the record steps');
  assert.match(step, /`awm --version`/, 'the gate must read the installed CLI version');
  assert.match(step, /do not probe with `--help`/, 'the gate must not trust --help, which older CLIs answer with exit 0');
  assert.match(step, /state the limitation once/, 'an old CLI must be reported, not hidden');
  assert.match(step, /continue to the merge\/push without a record — never write a record by hand or invent its fields/, 'an old CLI must neither block integration nor be papered over');
}

test('R7.4: both changed skills declare the minimum CLI version that ships the Change Record', () => {
  for (const name of [WRITING, FINISHING]) {                  // verifies R7.4
    const text = read(name);
    assertDeclaresMinimumCli(text, name);
    assert.throws(() => assertDeclaresMinimumCli(mutated(text, `\`agentic-workflow-manager\` ≥ ${MIN_CLI}`, '`agentic-workflow-manager` ≥ 9.19.0'), name), /must declare the minimum CLI version/);
  }
});

test('R7.4: finishing states the limitation and continues without inventing a record on an older CLI', () => {
  const text = read(FINISHING);                               // verifies R7.4
  assertGracefulDegradation(text);
  assert.throws(() => assertGracefulDegradation(mutated(text, ' — never write a record by hand or invent its fields', '')), /papered over/);
  assert.throws(() => assertGracefulDegradation(mutated(text, 'do not probe with `--help`', 'probe with `--help`')), /--help/);
  assert.throws(() => assertGracefulDegradation(mutated(text, '0. **Version gate.**', '7. **Version gate.**')), /start with the version gate/);
});

test('R7.4: the per-skill minimum never raises the registry compatibility floor', () => {
  const floor = JSON.parse(read('awm-registry.json')).minCliVersion; // verifies R7.4
  const [a, b] = [floor, MIN_CLI].map(v => v.split('.').map(Number));
  const below = (x, y) => x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
  assert.ok(below(a, b) < 0, `the registry floor ${floor} must stay below the per-skill minimum ${MIN_CLI}: older CLIs degrade, they are not refused`);
  assert.ok(below([9, 20, 0], b) === 0 && below([9, 19, 9], b) < 0, 'the semver comparison must be numeric');
});
```

- [ ] **Step 3: Run RED.** `npm run test:change-record` → the first two new tests fail; the floor test passes already (it pins that `minCliVersion` stays `9.14.0`, below `9.20.0`).

- [ ] **Step 4: writing-plans.** Append to the end of `### Change Record` (after its last bullet, one blank line before):

~~~~markdown
**Versión mínima del CLI:** `agentic-workflow-manager` ≥ 9.20.0, la primera versión con `awm change new|validate`, `awm changes list` y el receipt de `awm sensors run`. Con un CLI anterior el plan declara igual el slug y los criterios (planificar no ejecuta ningún comando); finishing informa la limitación al cerrar y continúa sin record, nunca lo inventa.
~~~~

- [ ] **Step 5: finishing Step 4.1.** Insert, directly before `1. **Commit.**`:

~~~~markdown
0. **Version gate.** This step needs `agentic-workflow-manager` ≥ 9.20.0, the first version with `awm change new|validate`, `awm changes list` and the sensor-run receipt. Read the installed version with `awm --version`; do not probe with `--help`, because older CLIs answer an unknown subcommand's help with exit 0. If `awm` is missing or older, state the limitation once (`Sin Change Record: el CLI <versión> no trae awm change; requiere ≥ 9.20.0`) and continue to the merge/push without a record — never write a record by hand or invent its fields. Option 2 then uses the no-record PR/MR body.
~~~~

- [ ] **Step 6: finishing unattended sentence.** In `### Modo desatendido` replace `Solo la limitación de sensores opt-out (ver Step 4.1) continúa sin record.` with `Solo las limitaciones del Step 4.1 (CLI anterior a 9.20.0 o sensores opt-out) continúan sin record.`

- [ ] **Step 7: Release metadata.** `catalog.json`: the `dev` entry `"version": "4.10.0"` → `"version": "4.11.0"`. `bundles/dev/bundle.json`: `"version": "4.10.0"` → `"version": "4.11.0"`. `CHANGELOG.md`: directly below `Newest entry on top; append new releases directly below this line.` and its blank line, insert:

~~~~markdown
## feat(skills): Change Record in writing-plans and finishing — 2026-10-17

- `writing-plans` 2.3.0: the plan header declares the planned Change Record
  slug and the acceptance criteria that feed `manual_validation`; `type`,
  `scope` and `semver` are derived by the CLI, never declared.
- `finishing-a-development-branch` 2.2.0: new Step 4.1 for Options 1 and 2 —
  version gate, commit, `awm sensors run`, `awm change new` (or `--refresh`),
  narrative, record commit and `awm change validate --strict`, stopping on a
  non-zero exit; trivial changes may use the `Change-Record: none` trailer.
  The Option 2 PR/MR body is built from the record and links it.
- Both declare `agentic-workflow-manager` ≥ 9.20.0 and degrade with a stated
  limitation (older CLI, sensors opt-out) without inventing a record. The
  registry floor `minCliVersion` stays 9.14.0.
- New mutation-verified gate `tests/r17-change-record-skills-contract.test.mjs`,
  wired into `validate.yml` and `auto-tag.yml`. Kodria/agentic-workflow#217 R7.

~~~~

- [ ] **Step 8: Run GREEN.** `npm run test:change-record` (8 pass), `npm run test:release`, `npm run test:version-bumps` (`OK: every edited SKILL.md and affected bundle/catalog version advanced.`), `npm run test:portability`, `npm run test:portability-selftest`.

- [ ] **Step 9: Commit** `feat(dev): ship the Change Record skills in dev 4.11.0`.

#### Edge cases
- `awm-registry.json` is not edited: raising `minCliVersion` to 9.20.0 would refuse older CLIs instead of letting them degrade, and would break the certified/floor split (`tests/cli-floor-decoupling.test.mjs`). The floor test above fails if someone raises it to or above 9.20.0.
- The semver comparison is numeric (`9.20.0` above `9.9.x`); the test asserts it on `9.19.9` vs `9.20.0`.
- `test:version-bumps` compares against `origin/main`; run `git fetch origin main` first when the local ref is stale, otherwise it compares against an old base.
- The version gate reads `awm --version`, never `--help`: on 9.19.0 `awm change validate --help` exits 0.
- CHANGELOG keeps "newest on top"; no other entry moves.

#### Evidence
SRC-CATALOG, SRC-BUNDLE, SRC-VERSION-BUMPS and SRC-CHANGELOG give the release rules; SRC-FIN-STEP40/Step 4.1 and SRC-WP-DISPATCH/`### Change Record` the edit points. RED: the two version-gate tests fail before Steps 4–6. GREEN: CMD-R17, CMD-RELEASE, CMD-VERSION-BUMPS, CMD-PORTABILITY, CMD-PORTABILITY-SELFTEST. Distinct clean specification and code-quality verdicts; reconcile against the diff and the current plan identity.

#### Fallback
Root-configuration risk (bundle and catalog versions drive `awm update`): full relevant context. If `check-skill-version-bumps.sh` or the portability validator rejects the bump, fix the metadata in this slice; never edit the gate to pass.

## Self-review

| Req | Slice | Test(s) |
|-----|-------|---------|
| R7.1 | S1 | `R7.1: the plan header template declares…`, `R7.1: writing-plans states that type, scope and semver are derived…` |
| R7.2 | S2 | `R7.2: Step 4.1 runs the six record steps in order…`, `R7.2: Options 1 and 2 run the record after Step 4.0…` |
| R7.3 | S2 | `R7.3: the Option 2 PR body is built from the record and links it` |
| R7.4 | S3 | `R7.4: both changed skills declare the minimum CLI version…`, `R7.4: finishing states the limitation…`, `R7.4: the per-skill minimum never raises the registry compatibility floor` |

Backward check: the CI wiring and `test:workflow-coverage` serve R7.1's gate (S1); the bundle bump, CHANGELOG and `test:version-bumps` ship R7.4's declaration (S3). No orphan task.
