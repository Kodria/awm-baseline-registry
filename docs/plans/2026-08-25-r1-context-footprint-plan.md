# R1 Context Footprint Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `subagent-driven-development`
> (recommended) or `executing-plans` to implement this plan task-by-task. Steps
> use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce at least 40% of the mandatory bytes on the observed `using-awm` → `development-process` → `brainstorming` path without weakening any quality or routing contract.

**Architecture:** Keep a small, self-contained entry contract in each of the three `SKILL.md` files and move branch-only instructions into explicit, fail-loud references. One executable contract test characterizes routing, invariants, lazy-reference reachability, the byte ceiling, provider parity, and the embedded measurement ledger. The work is one cohesive task so the existing review/QA apparatus runs once, not once per markdown split.

**Tech Stack:** Markdown Agent Skills, Node.js `node:test`, deterministic `wc`, AWM registry portability/version gates.

**Modo de ejecución:** desatendido

> Mandato de ejecución desatendida: ejecución completa sin pausas de check-in
> entre tareas, ni de confirmación entre fases (development-process rutea
> automáticamente y subagent-driven-development no pregunta si continuar con
> el cierre). harness-retro triagea con criterio propio del agente (solo valor
> real, recurrente o sistémico — descarta el resto sin preguntar).
> post-implementation-qa corrige TODOS los hallazgos que surjan, no solo algunos.
> finishing-a-development-branch crea el PR directamente (opción "push + PR"),
> sin presentar el menú de 4 opciones.

**Source design:** [agentic-workflow design at `fdc96f1`](https://github.com/Kodria/agentic-workflow/blob/fdc96f155fd8e93baf0c9705076809a93e6cb146/docs/plans/2026-08-25-r1-context-footprint-design.md)

**Trace:** [agentic-workflow#126](https://github.com/Kodria/agentic-workflow/issues/126)

---

## File Structure

| Path | Responsibility |
|---|---|
| `skills/using-awm/SKILL.md` | Always-loaded tier, priority, built-in routing, robustness, and fail-loud reference contract. |
| `skills/using-awm/references/declared-orchestrators.md` | Conditional declared-orchestrator ordering, tie, successor, silence, and fail-safe rules. |
| `skills/using-awm/references/subagent-policy.md` | Conditional policy for a worker dispatched under a controller. |
| `skills/development-process/SKILL.md` | Minimal lifecycle classifier, approval boundary, phase routing, and bug/resume rules. |
| `skills/development-process/references/execution-mode.md` | Post-plan interactive/unattended semantics and human-boundary rules. |
| `skills/development-process/references/frontend-handoff.md` | UI-only bundle availability gate. |
| `skills/development-process/references/business-gap.md` | Conditional DA-# recording and product-process return path. |
| `skills/brainstorming/SKILL.md` | Hard gate and concise design checklist with conditional reference dispatch. |
| `skills/brainstorming/references/brief-preload.md` | `mode: brief` revalidation and requirement mapping. |
| `skills/brainstorming/references/spec-contract.md` | EARS/ID rules, design writing, self-review, and user approval gate. |
| `skills/brainstorming/references/specialist-gate.md` | Conditional architecture, NFR, and technology specialist verdict contract. |
| `skills/brainstorming/references/ui-screen-detection.md` | UI-only screen detection and exact `pending` routing contract. |
| `tests/r12-context-footprint-contract.test.mjs` | Executable non-regression, lazy-loading, parity, ledger, and byte-ceiling contract. |
| `tests/r9-declared-orchestrators-contract.test.mjs` | Existing declared-orchestrator contract updated to follow the explicit lazy reference. |
| `catalog.json`, `bundles/dev/bundle.json` | Required dev-bundle minor version bump. |
| `docs/plans/2026-08-25-r1-context-footprint-plan.md` | Durable R0 ledger, normative trace, task state, and T1–T4 checkpoints. |

The plan is serial. All files implement one shared orchestration contract; parallel tracks would duplicate context and create shared-file conflicts.

## Embedded R0 Measurement Ledger

This section is durable initiative evidence. Controllers, compaction summaries, and later sessions must preserve it verbatim except for appending/replacing checkpoint observations. Measurement may read files and provider-native exports already produced by the normal cycle; it must never dispatch a measurement-only worker or invoke a model.

### Metric rules

| Classification | Meaning |
|---|---|
| `exact` | Deterministic bytes, files, commits, commands, or mechanically observed counts. |
| `provider-reported` | Native usage/cost emitted by the active provider or supplied billing record. |
| `estimated` | Explicit formula or bounded expectation whose assumptions are recorded. |
| `unobservable` | The runtime exposes no trustworthy value; never replace with zero. |

### Checkpoints

| Checkpoint | State | Collection time (UTC) | Commit/source | Mandatory context | Required skill path | Dispatches | Verification | Provider usage | Measurement overhead | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| T0 | Captured | `2026-08-25T02:25:42Z` | Registry `12b08cb133c67889b1a5484c0b791cf510302ed1`; observed product session `fdc96f155fd8e93baf0c9705076809a93e6cb146` | `exact`: observed product repo `AGENTS.md=32778`, `CONSTITUTION.md=30164`, `CLAUDE.md=4539`, total `67481`; implementation repo `AGENTS.md=13156`, `CONSTITUTION.md=14169`, absent `CLAUDE.md=0`, total `27325`. Source: `wc -c`. | `exact`: `using-awm=9500`, `development-process=15440`, `brainstorming=23163`, total `48103` bytes / `699` lines. Source: `wc -c` and `wc -l`. | `estimated`: one-task SDD minimum `3N+5 = 8` delegated invocations (`N=1`; implementer + two task reviewers + final reviewer + Track A + three non-UI Track B lenses), excluding retries/fixes and controller turns. Source: current SDD/QA contracts. | `exact`: planning gate only — `awm preflight` ready and `awm context-budget` 27325/27325. No implementation tests, sensors run, CI, or PR at T0. | `unobservable`: input tokens, output tokens, cache read, cache write, and cost are not exposed by this runtime; no billing record supplied. | `exact`: zero model invocations and zero model tokens added; shell/file reads only. | Captured before the first registry content edit. Global Semgrep was updated to `1.173.0` while diagnosing local preflight, but it is not a model call and does not alter repository bytes. |
| T1 | Captured | `2026-08-25T02:50:10Z`, after candidate green and before review | Candidate `2f1452697cb15801125c95c7b9c7481e5ab48a20` | `exact`: same repository context definition as T0; implementation-repo feedforward context remains `27325` bytes because `AGENTS.md` and `CONSTITUTION.md` are unchanged. | `exact`: observed closure `8821` bytes (`3104 + 2833 + 1730 + 317 + 498 + 339`), gross reduction `39282` bytes (81.66%) from `48103`; satisfies `<=28861`. | `exact`: 1 normal implementation dispatch; no review dispatch yet. | `exact`: R12 (7 pass), portability (39 skills), R9/R10/R12 portability suite (24 pass), version-bump gate, and `awm sensors run` (`overall: pass`). | `unobservable`: provider exposes no trustworthy input/output/cache/cost fields. | `exact`: zero measurement-only model calls; normal implementation dispatch is reported separately. | Candidate evidence only; no net billed-token claim before T4. |
| T2 | Captured | `2026-08-25T03:26:27Z`, after per-task spec and code-quality reviews | Reviewed candidate `b6d71ff4b2e1fe5b7d1c4d19f872ee427254fce8` | `exact`: implementation-repo feedforward context remains `27325` bytes. | `exact`: observed closure `11382` bytes (`3390 + 3152 + 2341 + 954 + 1140 + 405`), still `36721` bytes (76.34%) below T0; recovery rules added 2561 bytes after T1. | `exact`: 12 normal dispatches so far (6 implementation/correction workers, 4 spec reviews, 2 code-quality reviews); no measurement-only dispatch. | `exact`: spec reviews identified 14 valid contract gaps, corrected in normal iterations; final code-quality review approved `0 critical / 0 important / 0 minor`; R12 10 pass, portability suite 27 pass, and sensors `overall: pass`. | `unobservable`: no provider-native usage/cost fields. | `exact`: zero measurement-only model calls. | This records real review/rework overhead; no net billed-token claim before T4. |
| T3 | Captured | `2026-08-25T03:31:00Z`, post-implementation evidence gate | Final QA candidate `ebe460aa4d48f6baf62c0b6c2b23ec04de052eae` | `exact`: implementation-repo feedforward context remains `27325` bytes. | `exact`: observed closure `11382` bytes; final observed-path reduction `36721` bytes (76.34%) from T0. | `exact`: 12 normal implementation/review dispatches; no synthetic benchmark or measurement-only dispatch. | `exact`: R12 10 pass; portability 39 skills and 18 mutations; R9/R10/R12 suite 27 pass; version gate pass; `awm sensors run` `overall: pass`; final quality review approved with no findings. | `unobservable`: no provider-native usage/cost fields. | `exact`: zero measurement-only model calls. | Real build-cycle evidence only; it does not establish net billed-token savings before T4. |
| T4 | Scheduled | Trigger: first normal development cycle after the released registry is installed | Append that cycle's project and registry commits | Reuse the exact field definition | Reuse the exact observed-path definition | Record normal cycle dispatches | Record its normal quality evidence | First valid provider-reported comparison when available | No synthetic benchmark | If provider usage remains unavailable, retain `unobservable`; do not fabricate a result. |

### Net-savings rule

Gross prompt-byte reduction is not billed-token savings. T1–T4 must subtract or report separately every observed retrieval, assembly, retry, cache-write, cache-read, and extra invocation cost. Only T4 may support an end-to-end savings claim, and only with provider-reported or owner-supplied usage.

## Normative Rule Trace Inventory

Every current normative section has a destination before implementation. Explanatory diagrams/examples may be removed, but the contracts below may only be kept in core or moved to the named fail-loud reference.

| Current source | Normative contract preserved | Destination / load condition |
|---|---|---|
| `using-awm` `<SUBAGENT-POLICY>` | Dispatched workers skip orchestration/product layers but still invoke declared and craft/verification skills. | `references/subagent-policy.md`; core requires it immediately when the worker is dispatched. |
| `using-awm` Instruction Priority / skill access / runtime contract | User instructions win; use native loading/planning/delegation/filesystem/shell mechanisms; unavailable capability degrades honestly. | Compact `SKILL.md` core. |
| `using-awm` tier rules | Spine/gates always considered; specialized skills only on clear signal; exactly one entry orchestrator. | Compact `SKILL.md` core. |
| `using-awm` declared orchestrators | Declared candidates precede built-ins; termination defines order; one active; ties apply none; uninstalled/failing successor degrades; absent candidates remain silent; no secrets. | `references/declared-orchestrators.md`; load only when an installed declared candidate may apply. |
| `using-awm` built-in pair / disambiguations | Raw need and portable architecture assessments go product; concrete code requirement or ready brief goes development; ambiguity asks; brainstorming never receives raw business need; brief is the baton. | Compact `SKILL.md` core. |
| `using-awm` red flags / announcements / checklist / robustness | Load before acting, announce loaded skills, track skill checklists, validate public inputs, and never scope out security/robustness. | Compact `SKILL.md` core without repeated rationale. |
| `development-process` lifecycle / state table | Preserve design → optional UI → plan → execution → QA → docs → retro → finish and every marker-based state transition. | Compact `SKILL.md` state table; remove duplicated graph. |
| `development-process` cross-cutting gates | TDD for implementation, systematic debugging for failures, review at task boundaries, verification before completion. | Compact `SKILL.md` core. |
| `development-process` execution mode / human boundary | Invalid/absent mode falls back interactive; unattended applies only post-plan, never removes gates, auto-routes SDD only, and preserves BLOCKED escalation. | `references/execution-mode.md`; load whenever an active plan exists. |
| `development-process` preflight / state / approval / transfer | Entry preflight advisory; classify artifacts; announce state; explicit approval in interactive mode; invoke exactly the selected phase. | Compact `SKILL.md` core. |
| `development-process` frontend bundle gate | UI/design-artifact paths require both `ui-design` and `frontend-craft`; missing bundle blocks with exact remedy. | `references/frontend-handoff.md`; load only for UI-pending or design-artifact states. |
| `development-process` completion decisions | QA, docs, and retro markers cannot be skipped; build, bug, resume, and review requests route exactly as today. | Compact `SKILL.md` core. |
| `development-process` business gap | Never improvise missing business cases; append DA-# to source brief when present and return only through product-process. | `references/business-gap.md`; load only when a business-level unknown appears. |
| `development-process` Antigravity override / red flags | Never create ad-hoc plans while classifying; do not skip design, plan, TDD, review, or completion verification. | Compact `SKILL.md` core. |
| `brainstorming` overview / hard gate / simple-task rule | Understand context and user intent; no implementation before approved design; every behavior change gets scaled design. | Compact `SKILL.md` core. |
| `brainstorming` Brief Preload Mode | Only valid `mode: brief`; re-run readiness; map N/RF/RNF/out-of-scope/DA; never re-ask answered questions; no gate exemptions. | `references/brief-preload.md`; load only when a candidate product-brief discriminator is present. |
| `brainstorming` checklist / process | Ordered context, visual decision, one-at-a-time clarification to zero ambiguity, 2–3 approaches, incremental design approval, UI detection, committed design, self-review, written review, and correct terminal skill. | Compact `SKILL.md` checklist. |
| `brainstorming` design dialogue / isolation | Scope/decompose first, one question at a time, multiple choice where useful, YAGNI, inspect existing code, bounded units, no unrelated refactor. | Compact `SKILL.md` core. |
| `brainstorming` EARS/spec/self-review | Stable IDs, IF/THEN priority, multi-file requirement tier, no ambiguity, exact design path, five self-review checks, user review before planning. | `references/spec-contract.md`; load when requirements are written and again before saving/reviewing the design. |
| `brainstorming` UI screen detection | Three-part UI signal, explicit accept/skip question, exact table shape, lowercase `pending`, routing to UI design or planning. | `references/ui-screen-detection.md`; load only when direct UI plus new/significant layout is detected. |
| `brainstorming` Visual Companion | Offer alone, obtain consent, per-question visual test, text stays terminal, read detailed guide if accepted. | Existing `visual-companion.md`; core keeps only conditional trigger. |
| `brainstorming` Specialist Gate | Visible architecture/NFR/technology verdicts; invoke only for significant complexity; contextual output returns to design. | `references/specialist-gate.md`; load immediately before proposing approaches. |

## Controller Checkpoint Instructions (no extra dispatch)

- After Task 1's spec and code-quality reviewers approve, change T2 to `Captured`, fill it from their already-produced evidence, and commit the plan update. Do not create a measurement reviewer.
- After the normal final reviewer and post-implementation QA finish, change T3 to `Captured`, fill it from their already-produced evidence, and commit the plan update. T3 reports build-cycle cost, not end-to-end savings.
- During the next normal AWM development after release installation, change T4 to `Captured` in this plan and update issue #126. Do not create a synthetic benchmark.

### Task 1: Compact the three-skill orchestration path and lock its contract

_Requirements: R1.1, R1.2, R1.3, R1.4, R1.5, R1.6, R1.7, R1.8, R1.9, R1.10, R1.11, R1.12, R1.13, R1.14_

**Files:**
- Create: `tests/r12-context-footprint-contract.test.mjs`
- Create: `skills/using-awm/references/declared-orchestrators.md`
- Create: `skills/using-awm/references/subagent-policy.md`
- Create: `skills/development-process/references/execution-mode.md`
- Create: `skills/development-process/references/frontend-handoff.md`
- Create: `skills/development-process/references/business-gap.md`
- Create: `skills/brainstorming/references/brief-preload.md`
- Create: `skills/brainstorming/references/spec-contract.md`
- Create: `skills/brainstorming/references/specialist-gate.md`
- Create: `skills/brainstorming/references/ui-screen-detection.md`
- Modify: `skills/using-awm/SKILL.md`
- Modify: `skills/development-process/SKILL.md`
- Modify: `skills/brainstorming/SKILL.md`
- Modify: `tests/r9-declared-orchestrators-contract.test.mjs`
- Modify: `catalog.json`
- Modify: `bundles/dev/bundle.json`
- Modify: `docs/plans/2026-08-25-r1-context-footprint-plan.md`

**Skills:** test-driven-development, verification-before-completion

- [ ] **Step 1: Reconfirm T0 before the first skill edit**

Run from the registry root:

```bash
git rev-parse HEAD
wc -c skills/using-awm/SKILL.md skills/development-process/SKILL.md skills/brainstorming/SKILL.md
git status --short
```

Expected: commit `12b08cb133c67889b1a5484c0b791cf510302ed1`, total `48103`, and only this uncommitted plan differs from `main`. If any skill already differs, stop and recapture T0 rather than comparing different baselines.

- [ ] **Step 2: Write the failing executable contract**

Create `tests/r12-context-footprint-contract.test.mjs` with this complete contract:

```js
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import test from 'node:test';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const bytes = path => statSync(new URL(`../${path}`, import.meta.url)).size;
const plan = read('docs/plans/2026-08-25-r1-context-footprint-plan.md');
const usingAwm = read('skills/using-awm/SKILL.md');
const development = read('skills/development-process/SKILL.md');
const brainstorming = read('skills/brainstorming/SKILL.md');
const BASELINE_BYTES = 48103;
const MAX_OBSERVED_BYTES = Math.floor(BASELINE_BYTES * 0.60);
const observedClosure = [
  'skills/using-awm/SKILL.md',
  'skills/development-process/SKILL.md',
  'skills/brainstorming/SKILL.md',
  'skills/brainstorming/references/brief-preload.md',
  'skills/brainstorming/references/spec-contract.md',
  'skills/brainstorming/references/specialist-gate.md',
];

test('R1.1-R1.4, R1.9, R1.13: the embedded zero-model ledger is durable and honest', () => {
  assert.match(plan, /^## Embedded R0 Measurement Ledger$/m);
  assert.match(plan, /T0 \| Captured[\s\S]*12b08cb133c67889b1a5484c0b791cf510302ed1/);
  assert.match(plan, /total `67481`[\s\S]*total `27325`/);
  assert.match(plan, /total `48103` bytes \/ `699` lines/);
  for (const classification of ['`exact`', '`provider-reported`', '`estimated`', '`unobservable`']) {
    assert.ok(plan.includes(classification), `missing metric classification ${classification}`);
  }
  for (const checkpoint of ['T1', 'T2', 'T3', 'T4']) {
    assert.match(plan, new RegExp(`\\| ${checkpoint} \\| (Scheduled|Captured) \\|`));
  }
  assert.match(plan, /After Task 1's spec and code-quality reviewers approve, change T2 to `Captured`/);
  assert.match(plan, /After the normal final reviewer and post-implementation QA finish, change T3 to `Captured`/);
  assert.match(plan, /zero model invocations and zero model tokens added/i);
  assert.match(plan, /must never dispatch a measurement-only worker or invoke a model/i);
  assert.match(plan, /unobservable[\s\S]{0,240}never replace with zero/i);
});

test('R1.5-R1.6: branch-only instructions are reachable and core routing stays self-contained', () => {
  const references = [
    'skills/using-awm/references/declared-orchestrators.md',
    'skills/using-awm/references/subagent-policy.md',
    'skills/development-process/references/execution-mode.md',
    'skills/development-process/references/frontend-handoff.md',
    'skills/development-process/references/business-gap.md',
    'skills/brainstorming/references/brief-preload.md',
    'skills/brainstorming/references/spec-contract.md',
    'skills/brainstorming/references/specialist-gate.md',
    'skills/brainstorming/references/ui-screen-detection.md',
  ];
  for (const path of references) {
    assert.equal(existsSync(new URL(`../${path}`, import.meta.url)), true, `missing ${path}`);
    const relative = path.split('/').slice(2).join('/');
    const owner = path.includes('/using-awm/') ? usingAwm : path.includes('/development-process/') ? development : brainstorming;
    assert.ok(owner.includes(relative), `${path} is unreachable from its entry skill`);
  }
  assert.match(usingAwm, /Ambiguous[\s\S]{0,220}(ask|ASK)/i);
  assert.match(development, /\|\s*Executing\s*\|[\s\S]{0,160}(executing-plans|subagent-driven-development)/i);
  assert.match(brainstorming, /Do NOT[\s\S]{0,120}implementation[\s\S]{0,120}approved/i);
});

test('R1.7: quality, approval, security, and completion invariants survive', () => {
  const runtime = [usingAwm, development, brainstorming,
    read('skills/using-awm/references/subagent-policy.md'),
    read('skills/development-process/references/execution-mode.md'),
    read('skills/brainstorming/references/spec-contract.md')].join('\n');
  for (const contract of [
    /user instructions[\s\S]{0,100}(precedence|priority|win)/i,
    /test-driven-development|TDD/,
    /systematic-debugging/,
    /post-implementation-qa/,
    /verification-before-completion/,
    /security\/robustness|security and robustness/i,
    /explicit approval|user approval/i,
    /BLOCKED[\s\S]{0,120}(never|must not)[\s\S]{0,80}(skip|ignore)/i,
  ]) assert.match(runtime, contract);
});

test('R1.8: non-executable research/docs use proportional verification', () => {
  const runtime = `${development}\n${brainstorming}`;
  assert.match(runtime, /research|documentation/i);
  assert.match(runtime, /proportional structural verification/i);
  assert.match(runtime, /full tests[\s\S]{0,120}sensors[\s\S]{0,120}(CI|PR)/i);
});

test('R1.10: the observed mandatory closure is at least 40 percent smaller', () => {
  const actual = observedClosure.reduce((sum, path) => sum + bytes(path), 0);
  assert.ok(actual <= MAX_OBSERVED_BYTES,
    `observed closure ${actual} bytes exceeds ${MAX_OBSERVED_BYTES}`);
  assert.throws(() => assert.ok(MAX_OBSERVED_BYTES + 1 <= MAX_OBSERVED_BYTES),
    /false == true|The expression evaluated to a falsy value/);
});

test('R1.11-R1.12: net savings wait for a real T4 cycle', () => {
  assert.match(plan, /^### Net-savings rule$/m);
  assert.match(plan, /retrieval, assembly, retry, cache-write, cache-read, and extra invocation cost/i);
  assert.match(plan, /Only T4 may support an end-to-end savings claim/i);
  assert.match(plan, /first normal development cycle after the released registry is installed/i);
  assert.match(plan, /Do not create a synthetic benchmark/i);
});

test('R1.14: Codex and Claude Code remain one provider-neutral contract', () => {
  const runtime = `${usingAwm}\n${development}`;
  assert.match(runtime, /Codex/);
  assert.match(runtime, /Claude Code/);
  assert.match(runtime, /native (skill-loading|runtime|capabilit)/i);
  assert.match(runtime, /unavailable[\s\S]{0,160}(state|report|say)[\s\S]{0,120}(limitation|degradation)/i);
  assert.doesNotMatch(runtime, /SKILL\.codex\.md|SKILL\.claude\.md/);
});
```

- [ ] **Step 3: Run the contract and observe RED**

Run:

```bash
node --test tests/r12-context-footprint-contract.test.mjs
```

Expected: FAIL because the nine references do not exist and the current three-file closure is `48103`, above `28861`. A green result here means the test is vacuous; strengthen it before editing skills.

- [ ] **Step 4: Compact `using-awm` with fail-loud conditional references**

Set frontmatter `version: "1.4.0"`. Keep priority, native-runtime behavior, tier routing, built-in orchestrator table, announcements/checklists, and robustness in `SKILL.md`. Add these exact conditional directives:

```markdown
IF this worker was dispatched by a controller, THEN read
`references/subagent-policy.md` immediately and follow it before any other routing.

IF one or more installed declared orchestrators may apply, THEN read
`references/declared-orchestrators.md` before choosing an orchestrator. If the
reference is unavailable, report the limitation and fall back to the built-in table;
never invent the missing contract.
```

Move the complete rules named in the trace inventory into the two reference files. Do not create provider forks or depend on cross-turn memory.

- [ ] **Step 5: Compact `development-process` around the state classifier**

Set frontmatter `version: "1.7.0"`. Keep the phase/state table and interactive approval in core; remove the duplicate lifecycle graph and repeated rationale. Add these exact directives:

```markdown
WHEN an active plan exists, read `references/execution-mode.md` before routing.
WHEN UI is pending or a plan declares `**Design artifacts:**`, read
`references/frontend-handoff.md` and apply its blocking bundle gate.
IF a business-level unknown appears during development, read
`references/business-gap.md`; do not improvise the answer.
```

Core must still route new/build/bug/resume/review requests, enforce QA → docs → retro → finish markers, and require explicit approval before an interactive handoff.

- [ ] **Step 6: Compact `brainstorming` around its ordered hard-gated checklist**

Set frontmatter `version: "1.4.0"`. Keep the hard gate, ordered checklist, one-question rule, zero-ambiguity gate, 2–3 approaches, incremental approval, and terminal routing in core. Add these exact directives:

```markdown
IF a candidate `awm: product-brief` is present, read
`references/brief-preload.md` before asking any question.
Before presenting approaches, read `references/specialist-gate.md` and publish
all three verdicts.
WHEN writing or reviewing the design artifact, read
`references/spec-contract.md` and apply it completely.
IF the work meets the direct-interaction, new/significant-layout, and visual-
complexity signals, read `references/ui-screen-detection.md`.
IF visual questions are anticipated, offer the Visual Companion in a standalone
message; only after consent read `visual-companion.md`.
```

Move the corresponding trace-inventory rules into the four new references. Preserve `visual-companion.md` as the existing detailed guide.

- [ ] **Step 7: Add the proportional research/documentation rule**

Place this exact rule in the smallest always-loaded owner (`development-process/SKILL.md`) and cross-reference it from brainstorming's design-save step:

```markdown
WHEN research or documentation changes no executable behavior, require only
proportional structural verification. Do not require full tests, sensors, CI
monitoring, or a PR solely because the artifact was written.
```

This exception is limited to non-executable artifacts; changes to skill behavior remain executable process changes and retain normal quality gates.

- [ ] **Step 8: Run the targeted contract until GREEN**

Run:

```bash
node --test tests/r12-context-footprint-contract.test.mjs
```

Expected: all R12 tests PASS and reported observed closure is at most `28861` bytes. If the byte target is missed, remove repetition/explanation; do not weaken a normative rule or exclude a required reference from the closure.

- [ ] **Step 9: Run existing orchestration and portability contracts**

Run:

```bash
node scripts/validate-portability.mjs
node --test tests/validate-portability.test.mjs tests/r9-declared-orchestrators-contract.test.mjs tests/r10-documentation-phase-contract.test.mjs tests/r12-context-footprint-contract.test.mjs
```

Expected: portability reports all skills validated and every test passes. If an old contract assumes moved prose remains inline, update the test to follow the explicit reference and first prove its weakened/missing-reference mutation fails.

For `tests/r9-declared-orchestrators-contract.test.mjs`, keep `## Orchestration` reachability in core and read detailed assertions from the reference with this helper:

```js
const DECLARED = 'skills/using-awm/references/declared-orchestrators.md';
const declaredContract = () => read(DECLARED);

test('using-awm reaches the declared-orchestrator contract', () => {
  const core = orchestrationSection(read(USING_AWM));
  assert.match(core, /references\/declared-orchestrators\.md/);
  assert.match(core, /installed declared orchestrators may apply/i);
});
```

Point R2.1–R5.3 semantic assertions at `declaredContract()`. Rewrite the RED mutation so deleting the reference directive from core and weakening the tie-resolution sentence each fail their specific assertion; do not satisfy moved rules with keywords elsewhere in `SKILL.md`.

- [ ] **Step 10: Bump delivery metadata and run the release gate**

Change the dev bundle from `3.5.4` to `3.6.0` in both files:

```json
// catalog.json dev entry
{ "name": "dev", "source": "./bundles/dev", "version": "3.6.0", "scope": "baseline" }
```

```json
// bundles/dev/bundle.json
"version": "3.6.0"
```

Run:

```bash
./scripts/check-skill-version-bumps.sh origin/main
```

Expected: `OK: every edited SKILL.md and affected bundle/catalog version advanced.`

- [ ] **Step 11: Run the project sensor gate once for the completed task**

Run:

```bash
awm sensors run
```

Expected: `overall: pass`. The local harness runs registry portability and the existing process-contract tests; do not run the unrelated sensor-pack certification matrix for this focused markdown/process change.

- [ ] **Step 12: Commit the concrete candidate**

```bash
git add tests/r12-context-footprint-contract.test.mjs tests/r9-declared-orchestrators-contract.test.mjs skills/using-awm skills/development-process skills/brainstorming catalog.json bundles/dev/bundle.json
git commit -m "feat: compact core orchestration context"
```

Expected: one cohesive implementation commit before measurement and review.

- [ ] **Step 13: Capture and commit T1 without model work**

```bash
git rev-parse HEAD
wc -c skills/using-awm/SKILL.md skills/development-process/SKILL.md skills/brainstorming/SKILL.md skills/brainstorming/references/brief-preload.md skills/brainstorming/references/spec-contract.md skills/brainstorming/references/specialist-gate.md
git diff --stat origin/main...HEAD
```

Change T1 to `Captured` and replace its scheduled fields with exact time, candidate commit, file bytes, gross delta, verification commands, actual normal dispatches already observed, provider-native usage or `unobservable`, and zero measurement-only calls. Do not claim net billed savings. Then commit only the ledger update:

```bash
git add docs/plans/2026-08-25-r1-context-footprint-plan.md
git commit -m "docs: record R1 candidate measurement"
```

The controller then performs normal per-task spec and quality reviews, records T2 without a measurement dispatch, and proceeds to final review/QA.

## Traceability Matrix

| Req | Task(s) | Test(s) / evidence |
|---|---|---|
| R1.1 | T1 Steps 1, 11 | `the embedded zero-model ledger is durable and honest`; exact T0 commands |
| R1.2 | T1 Steps 2, 11 | ledger classification loop in `r12-context-footprint-contract.test.mjs` |
| R1.3 | T1 Steps 2, 11 | `unobservable ... never replace with zero` assertion |
| R1.4 | T1 Steps 1, 11 | zero-model ledger assertions and no measurement dispatch in controller instructions |
| R1.5 | T1 Steps 4–6 | `branch-only instructions are reachable` |
| R1.6 | T1 Steps 4–6 | core routing assertions in `branch-only instructions are reachable` |
| R1.7 | T1 Steps 4–9 | `quality, approval, security, and completion invariants survive` plus R9/R10 contracts |
| R1.8 | T1 Step 7 | `non-executable research/docs use proportional verification` |
| R1.9 | T1 Step 11 + controller T2/T3 updates | checkpoint loop and controller-instruction assertions in ledger test |
| R1.10 | T1 Steps 2, 8, 11 | `observed mandatory closure is at least 40 percent smaller` and its RED mutation |
| R1.11 | T1 Step 11 | `net savings wait for a real T4 cycle` |
| R1.12 | T1 Step 2 + T4 controller follow-up | `net savings wait for a real T4 cycle` |
| R1.13 | T1 Steps 1–2 | durable ledger heading and checkpoint assertions |
| R1.14 | T1 Steps 4–6, 9 | `Codex and Claude Code remain one provider-neutral contract` plus portability gate |

## Analyze Gate Result

- Forward gaps: none; R1.1–R1.14 each map to implementation/checkpoint work and a specific executable assertion or exact command.
- Backward gaps: none; the single technical task and every named test are anchored to R1.1–R1.14.
- UI propagation: not applicable; this change has no product UI or designed screen.
- Placeholder scan: clean. `Scheduled` is a defined checkpoint state with an exact trigger, not missing content.

## Pre-Handoff Gates

- `awm preflight`: ready; local harness has two enabled, runnable registry gates (`portability`, `process-contracts`). The repository intentionally ignores `.awm/`, so another checkout must recreate this local harness before execution.
- `awm context-budget`: `27325/27325` bytes, within the pinned local budget (`AGENTS.md=13156`, `CONSTITUTION.md=14169`, no `CLAUDE.md`).
- Execution mode is `desatendido`; empirical `--verify-sensors` is not required by the unattended gate.

<!-- awm-qa-complete: 2026-08-25 -->
<!-- awm-docs-complete: 2026-08-25 — no user-facing documentation affected; registry skill contracts and executable tests are self-documenting -->
<!-- awm-retro-complete: 2026-08-25 — recurring compression losses cured by mutation-backed lazy-reference and closure contracts; no new authority required -->
