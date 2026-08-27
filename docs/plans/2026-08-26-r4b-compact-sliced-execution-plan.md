# R4b Compact Sliced Execution Implementation Plan

<!-- awm-qa-complete: 2026-08-27 -->
<!-- awm-docs-complete: 2026-08-27 -->
<!-- awm-retro-complete: 2026-08-27 -->
<!-- awm-qa-complete: 2026-08-27 -->
<!-- awm-docs-complete: 2026-08-27 -->

> **For agentic workers:** REQUIRED SUB-SKILL: Use `subagent-driven-development`
> (recommended) or `executing-plans` to implement this plan task-by-task. Steps
> use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Teach the baseline development workflow to author and execute validated `compact-slices/v1` plans with bounded role context while preserving every quality, compatibility, and release gate.

**Architecture:** R4b is the registry half of one serial capability. It consumes the published R4a CLI contract, encodes compact planning and slice execution in existing process skills and role templates, and protects those semantics with executable registry/CLI acceptance tests in both validation and release-producing workflows. Legacy and parallel-track plans retain their current full-quality path.

**Tech Stack:** Markdown AWM skills and prompts, Node.js `node:test` contract tests, JSON registry metadata, GitHub Actions, published `agentic-workflow-manager` CLI.

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

<!-- AWM:COMPACT-SLICES:START v1 -->
{
  "schema": "compact-slices/v1",
  "planId": "r4b-compact-sliced-execution",
  "requirements": [
    "R4-CP-2", "R4-CP-4", "R4-CP-5", "R4-CS-3", "R4-CS-4", "R4-CS-5", "R4-CS-6",
    "R4-QUAL-1", "R4-QUAL-2", "R4-EVID-1", "R4-EVID-2", "R4-EVID-3", "R4-EVID-4", "R4-CUR-6"
  ],
  "sources": [
    {"id":"SRC-DEV","path":"skills/development-process/SKILL.md","locator":"## Harness Preflight (advisory at entry)","fact":"Entry routing and advisory preflight contract."},
    {"id":"SRC-WRITE","path":"skills/writing-plans/SKILL.md","locator":"## Bite-Sized Task Granularity","fact":"Current plan authoring, analyze, preflight and handoff gates."},
    {"id":"SRC-SDD","path":"skills/subagent-driven-development/SKILL.md","locator":"## Evidence Capsule v1 Dispatch Contract","fact":"Current per-task dispatch, review, sensor, reconciliation and termination protocol."},
    {"id":"SRC-EXEC","path":"skills/executing-plans/SKILL.md","locator":"## The Process","fact":"Current inline task/batch execution and completion protocol."},
    {"id":"SRC-REVIEW","path":"skills/requesting-code-review/SKILL.md","locator":"## Integration with Workflows","fact":"Current per-task review frequency and workflow integration."},
    {"id":"SRC-QA","path":"skills/post-implementation-qa/SKILL.md","locator":"## Two Tracks","fact":"Final Track A and isolated Track B lens contract."},
    {"id":"SRC-R8","path":"tests/r8-sensor-gate-contract.test.mjs","locator":"interactive planning must retain static","fact":"Existing static and empirical preflight regression assertions."},
    {"id":"SRC-R13","path":"tests/r13-role-evidence-capsule-contract.test.mjs","locator":"const CAPSULE_MARKER","fact":"Role capsule byte and context-isolation invariants."},
    {"id":"SRC-VALIDATE-WF","path":".github/workflows/validate.yml","locator":"node tests/r14-context-kernel-contract.test.mjs","fact":"Validation job ordering and installed compatible CLI boundary."},
    {"id":"SRC-TAG-WF","path":".github/workflows/auto-tag.yml","locator":"Verify registry before tagging","fact":"Release-producing gate that must independently run R15."},
    {"id":"SRC-REGISTRY","path":"awm-registry.json","locator":"minCliVersion","fact":"Minimum published CLI compatibility declaration."},
    {"id":"SRC-BUNDLE","path":"bundles/dev/bundle.json","locator":"\"version\"","fact":"Dev bundle release version and included workflow skills."}
  ],
  "commands": [
    {"id":"CMD-R15-CONTRACT","program":"npm","args":["exec","--","node","tests/r15-compact-slices-contract.test.mjs"],"covers":["R4-CP-2","R4-CP-4","R4-CP-5","R4-CS-3","R4-CS-4","R4-CS-5","R4-CS-6","R4-QUAL-1","R4-QUAL-2","R4-EVID-1","R4-EVID-2","R4-EVID-3","R4-EVID-4","R4-CUR-6"]},
    {"id":"CMD-R15-CLI","program":"npm","args":["exec","--","node","tests/r15-compact-slices-cli-acceptance.mjs"],"covers":["R4-EVID-4"]},
    {"id":"CMD-R8","program":"npm","args":["exec","--","node","tests/r8-sensor-gate-contract.test.mjs"],"covers":["R4-QUAL-1","R4-CUR-6"]},
    {"id":"CMD-R5","program":"npm","args":["exec","--","node","tests/r5-track-contract.test.mjs"],"covers":["R4-CS-6","R4-QUAL-1"]},
    {"id":"CMD-R12","program":"npm","args":["exec","--","node","tests/r12-context-footprint-contract.test.mjs"],"covers":["R4-QUAL-2","R4-EVID-1"]},
    {"id":"CMD-R13","program":"npm","args":["exec","--","node","tests/r13-role-evidence-capsule-contract.test.mjs"],"covers":["R4-CS-3","R4-CS-4","R4-QUAL-1"]},
    {"id":"CMD-R14","program":"npm","args":["exec","--","node","tests/r14-context-kernel-contract.test.mjs"],"covers":["R4-CS-3","R4-QUAL-2"]},
    {"id":"CMD-R14-CLI","program":"npm","args":["exec","--","node","tests/r14-context-kernel-cli-acceptance.mjs"],"covers":["R4-CS-3","R4-QUAL-2"]},
    {"id":"CMD-PORTABILITY","program":"npm","args":["exec","--","node","scripts/validate-portability.mjs"],"covers":["R4-QUAL-1","R4-QUAL-2"]},
    {"id":"CMD-RELEASE","program":"npm","args":["exec","--","node","tests/release-skill-version-gate.test.mjs"],"covers":["R4-QUAL-1","R4-CUR-6"]},
    {"id":"CMD-SKILL-VERSIONS","program":"scripts/check-skill-version-bumps.sh","args":["origin/main"],"covers":["R4-EVID-4"]},
    {"id":"CMD-PLAN-VALIDATE","program":"awm","args":["plan","validate","docs/plans/2026-08-26-r4b-compact-sliced-execution-plan.md","--cwd",".","--json"],"covers":["R4-CP-2","R4-CP-4","R4-CP-5"]},
    {"id":"CMD-PREFLIGHT","program":"awm","args":["preflight","--require-current"],"covers":["R4-CUR-6"]},
    {"id":"CMD-DIFF-CHECK","program":"git","args":["diff","--check"],"covers":["R4-QUAL-1"]}
  ],
  "slices": [
    {
      "id":"S1","title":"Author compact planning and strict handoff",
      "requirements":["R4-CP-2","R4-CP-4","R4-CP-5","R4-CUR-6"],"dependsOn":[],"sectionAnchor":"slice-s1",
      "sources":["SRC-DEV","SRC-WRITE","SRC-R8","SRC-VALIDATE-WF"],
      "redCommands":["CMD-R15-CONTRACT","CMD-R8"],"greenCommands":["CMD-R15-CONTRACT","CMD-R8","CMD-RELEASE","CMD-PREFLIGHT","CMD-PLAN-VALIDATE"],
      "reviewEvidence":["specification","code-quality"],"risk":"full-context",
      "fallback":["published R4a CLI is absent or compact guidance cannot determine a slice without new product decisions"]
    },
    {
      "id":"S2","title":"Execute and review complete slices",
      "requirements":["R4-CS-3","R4-CS-4","R4-CS-5","R4-CS-6","R4-QUAL-1","R4-QUAL-2"],"dependsOn":["S1"],"sectionAnchor":"slice-s2",
      "sources":["SRC-SDD","SRC-EXEC","SRC-REVIEW","SRC-QA","SRC-R13"],
      "redCommands":["CMD-R15-CONTRACT","CMD-R5","CMD-R13"],"greenCommands":["CMD-R15-CONTRACT","CMD-R5","CMD-R13","CMD-R14","CMD-R14-CLI","CMD-PORTABILITY","CMD-RELEASE","CMD-PREFLIGHT","CMD-DIFF-CHECK"],
      "reviewEvidence":["specification","code-quality"],"risk":"full-context",
      "fallback":["slice boundary is invalid, evidence is insufficient, or a declared risk trigger activates"]
    },
    {
      "id":"S3","title":"Certify compatibility evidence and release",
      "requirements":["R4-EVID-1","R4-EVID-2","R4-EVID-3","R4-EVID-4"],"dependsOn":["S2"],"sectionAnchor":"slice-s3",
      "sources":["SRC-TAG-WF","SRC-REGISTRY","SRC-BUNDLE"],
      "redCommands":["CMD-R15-CLI","CMD-RELEASE"],
      "greenCommands":["CMD-R15-CONTRACT","CMD-R15-CLI","CMD-R8","CMD-R5","CMD-R12","CMD-R13","CMD-R14","CMD-R14-CLI","CMD-PORTABILITY","CMD-RELEASE","CMD-SKILL-VERSIONS","CMD-PLAN-VALIDATE","CMD-PREFLIGHT","CMD-DIFF-CHECK"],
      "reviewEvidence":["specification","code-quality"],"risk":"full-context",
      "fallback":["R4a npm gitHead mismatches its merge SHA, a legacy quality contract regresses, or release evidence is incomplete"]
    }
  ],
  "closureCommands":["CMD-R15-CONTRACT","CMD-R15-CLI","CMD-R8","CMD-R5","CMD-R12","CMD-R13","CMD-R14","CMD-R14-CLI","CMD-PORTABILITY","CMD-RELEASE","CMD-SKILL-VERSIONS","CMD-PLAN-VALIDATE","CMD-PREFLIGHT","CMD-DIFF-CHECK"]
}
<!-- AWM:COMPACT-SLICES:END v1 -->

## Source and delivery boundary

- Approved design: `agentic-workflow@676f9cc`, `docs/plans/2026-08-26-r4-compact-plans-cohesive-slices-design.md`.
- Initiative baton: [agentic-workflow#126](https://github.com/Kodria/agentic-workflow/issues/126).
- Registry base: `origin/main@0bbacf0`, tag `v3.9.2`, dev bundle `3.8.0`, `minCliVersion` `9.3.0` before S3 updates it to observed R4a version `9.4.1`.
- R4a publication is observed as `agentic-workflow-manager@9.4.1`, npm `gitHead` `047715db866a57501ae9bb1314238b28fa18c791`; its release parent is `481f7576791815e74139eecfe757e9519dc8640c`, whose merge-base with R4a merge `47910806f45a1fcd2bb51d301a8057df15b92cc4` is exactly that R4a merge (published parent is two commits ahead). R4b accepts this release provenance; never guess a version from a future commit or tag.
- R4b modifies the baseline registry only. It does not modify the CLI, global npm installation, installed registry clones, user projects, `AGENTS.md`, or `CONSTITUTION.md`.
- The new contract is release-neutral and permanent. R3/R4 names, T0–T4 labels, quota observations, and the three-cycle corpus stay in initiative evidence, not general runtime instructions.
- Issue #129 remains the owner for cross-environment sensor-detection differences. R4b may harden gate wording/tests but does not redesign sensor discovery. This registry deliberately opts out of local shell sensors; its applicable sensor evidence is the versioned `validate.yml` sensor-certification matrix. Therefore local R4b handoff runs strict currentness only, while R8 and the release workflow prove the sensor contract. Do not run `--verify-sensors` or `awm sensors run` as a local R4b gate when every configured sensor is disabled.

## Requirements

- **R4-CP-2** — A low-context executor receives behavior, surfaces, interfaces, sequence, edge cases, RED/GREEN evidence, commands, risks and fallback sufficient to execute without a new product/architecture decision.
- **R4-CP-4** — Missing, unstable, unsafe, inaccessible, ambiguous or insufficient sources cause required instruction to be inlined, not delegated as discovery.
- **R4-CP-5** — Shared slice payload is stated once at the narrowest shared boundary and referenced by stable IDs.
- **R4-CS-3** — A valid compact execution dispatches the complete current slice plus role-scoped Evidence Capsule v1 and excludes unrelated slices/history by default.
- **R4-CS-4** — Every completed slice gets one independent specification verdict and one independent code-quality verdict before advancing.
- **R4-CS-5** — Omitted behavior, new requirements, invalid boundaries or insufficient guidance stop the slice, amend/revalidate the plan and record the deviation.
- **R4-CS-6** — A declared risk trigger restores full relevant context and verification while preserving every review role and recording fallback.
- **R4-QUAL-1** — Compact execution retains TDD, traceability, per-slice reviews, final Track A, all applicable Track B lenses, sensors, full verification, docs, retro and completion gates.
- **R4-QUAL-2** — Reduced acceptance coverage, escaped blocker/important defect, security/robustness regression or context-caused correction fails the candidate regardless of efficiency evidence.
- **R4-EVID-1** — Normal cycle boundaries record structural counts, natural retrieval/fallback, retries, findings and delivery gates without measurement-only model work.
- **R4-EVID-2** — Unavailable token/cache/model/price/cost fields are `unobservable`, never zero or inferred from bytes/quota.
- **R4-EVID-3** — Owner quota is labeled as an owner observation with its cycle boundary, never provider telemetry.
- **R4-EVID-4** — Structural/quality evidence may release R4, but generalized savings/non-inferiority waits for all three fresh cycles.
- **R4-CUR-6** — Development entry runs strict currentness advisory; unattended handoff reruns it as a blocking gate.

## File structure

| File | Responsibility |
|---|---|
| `skills/writing-plans/references/compact-slices-v1.md` | Canonical author/executor-facing compact schema, slice sections, risk and fallback rules. |
| `skills/development-process/SKILL.md` | Advisory strict-currentness entry and routing for valid compact versus legacy plans. |
| `skills/writing-plans/SKILL.md` | Compact authoring, CLI validation, strict handoff, analyze and context-budget ordering. |
| `skills/subagent-driven-development/SKILL.md` | Slice selection, complete-slice capsule, state machine, amendment and fallback. |
| `skills/executing-plans/SKILL.md` | Equivalent inline compact-slice execution without changing legacy batching. |
| `skills/requesting-code-review/SKILL.md` | Review frequency becomes task-or-complete-slice without weakening two-stage review. |
| `skills/post-implementation-qa/SKILL.md` | Explicitly preserve final Track A and all applicable isolated Track B lenses for compact plans. |
| `skills/subagent-driven-development/{implementer,spec-reviewer,code-quality-reviewer}-prompt.md` | Role-scoped complete-slice inputs and reports with stable Evidence Capsule v1 boundary. |
| `tests/fixtures/compact-slices-v1/valid-plan.md` | Portable valid plan accepted by the published R4a CLI. |
| `tests/r15-compact-slices-contract.test.mjs` | Static/mutation contract for planning, execution, review, fallback, evidence and release wiring. |
| `tests/r15-compact-slices-cli-acceptance.mjs` | Black-box acceptance against the CLI version declared by `minCliVersion`. |
| `tests/r8-sensor-gate-contract.test.mjs` | Strict currentness plus static/empirical sensor preflight ordering and mutation coverage. |
| `.github/workflows/validate.yml`, `.github/workflows/auto-tag.yml` | Run R15 after installing the compatible CLI; release job cannot tag over a red R15 gate. |
| `awm-registry.json` | Minimum CLI becomes the observed published R4a version. |
| Edited skill frontmatter, `bundles/dev/bundle.json`, `catalog.json`, `CHANGELOG.md` | Versioned registry delivery metadata. |

## Slice execution contract

Use `writing-skills` and `test-driven-development` for every edited skill, and `process-lifecycle` to verify the active development process still composes and routes correctly. Run one bounded pre-edit pressure matrix and one post-edit matrix using the same scenarios; retain only verdict, violated requirement and short rationalization, never chain-of-thought, full source bodies or measurement-only output. Every slice then receives independent specification and code-quality review before commit.

<a id="slice-s1"></a>
### Slice S1: Author compact planning and strict handoff

#### Surfaces

- Create `skills/writing-plans/references/compact-slices-v1.md`.
- Modify `skills/development-process/SKILL.md`, `skills/writing-plans/SKILL.md`, and the plan-reviewer instruction located by the existing planning contract.
- Modify `tests/r8-sensor-gate-contract.test.mjs`; create the planning/currentness sections of `tests/r15-compact-slices-contract.test.mjs`.
- Own R4-CP-2, R4-CP-4, R4-CP-5, and R4-CUR-6.

#### Implementation

1. Read `writing-skills`, `test-driven-development`, and `process-lifecycle` before edits. Construct one bounded pressure matrix with: an underspecified three-line “compact” plan, an unavailable delegated source, repeated verification prose, a stale CLI at session entry, and stale registry state at unattended handoff.
2. Run the matrix once against the unmodified skills. Record only scenario ID, expected requirement, pass/fail and a one-sentence rationalization. The RED evidence must demonstrate at least one current violation; if every scenario already complies, redesign the scenarios before editing because the skill change has no proven teaching gap.
3. Write failing R15 contract tests. Assert that `writing-plans` selects compact mode only for a formed serial plan whose requirements can be explicitly sliced; emits exactly `compact-slices/v1`; requires the complete five-section slice body and safe source/command IDs; validates through the CLI before handoff; and preserves current Task/Tracks syntax for legacy and parallel plans.
4. Add mutation tests that remove one slice section, make a source “go inspect the repo,” duplicate shared commands in every step, skip CLI validation, reinterpret an invalid/future plan as legacy, or replace full-quality legacy execution with compact assumptions. Each mutation must make R15 fail for the requirement it violates.
5. In the new reference, define the permanent release-neutral authoring contract: manifest boundary, exact fields/limits, one requirement owner, complete slice prose, authoritative-source rule, narrow shared payload, inert commands, explicit risk/fallback, deterministic validation outcomes, and no semantic autogrouping. Include a minimal complete example that the R4a CLI accepts.
6. Update `writing-plans` to load that reference only when compact mode is eligible. A compact plan is still robust: each slice must let a basic executor implement without product/architecture judgment. If a source is insufficient, inline the needed fact. Require `awm plan validate PLAN_PATH` after self-review/analyze and before handoff; invalid/unsupported blocks, legacy follows the existing route.
7. Preserve current static preflight for interactive/local compatibility. Add `awm preflight --require-current` as the blocking currentness gate before execution handoff. For projects with applicable enabled sensors, combine it with `--verify-sensors` for unattended handoff so one strict invocation proves both; for this deliberately sensor-opted-out registry, R8 plus the `validate.yml` sensor-certification matrix are the applicable evidence. The installed CLI must support the strict currentness flag; unlike the old unknown-command exception, a missing strict flag blocks compact handoff.
8. Update `development-process` so entry invokes strict currentness as advisory, reports one bounded line, and continues without automatic writes. It must not repeatedly recheck during one phase. A later unattended handoff reruns strict mode as the authoritative blocking observation.
9. Update the plan reviewer to reject missing compact fields, unowned requirements, unsafe delegation, skipped validation/currentness, legacy regressions, and efficiency claims based only on structural evidence.
10. Bump each edited skill’s frontmatter version exactly once. Run `CMD-R15-CONTRACT` and `CMD-R8` to GREEN, then run the same pressure matrix against the edited skills. Record the compact verdict delta without retaining generated prose.

#### Edge cases

- A valid compact plan may be interactive or unattended; unattended changes handoff behavior, not plan quality.
- Parallel-track metadata is absent from `compact-slices/v1`, so a plan declaring tracks remains on the existing legacy track contract in R4.
- A partial marker or future schema blocks. No marker/schema signal is legacy and succeeds through the current full-quality route.
- Strict entry failure is advisory because development may be needed to repair the environment; strict handoff failure blocks because the executor would otherwise start from stale/unverifiable contracts.
- Context Kernel pruning remains owner-controlled. Compact planning can retrieve bounded cards but may not delete or rewrite protected `AGENTS.md`/`CONSTITUTION.md` rules.

#### Evidence

- Pre/post pressure matrix verdicts and bounded rationalizations.
- RED/GREEN and mutation results from `CMD-R15-CONTRACT` and `CMD-R8`.
- `CMD-PLAN-VALIDATE` accepts this complete plan once the published R4a CLI is installed.
- Independent specification review checks all four owned requirements, legacy behavior, and the approved strict-entry/handoff distinction.
- Independent code-quality review checks skill clarity, reference routing, no duplicated contracts, no provider-specific API, and context-footprint discipline.

#### Fallback

- If R4a is unpublished, its release `gitHead` does not contain the R4a merge, or the CLI cannot validate this plan, stop R4b; do not copy a registry-side validator or weaken the gate.
- If a compact slice needs new product/architecture judgment, amend the plan or use the legacy full-context path and record the fallback.
- If pressure tests reveal broad ambiguity, retain full relevant context and strengthen instructions before continuing.

<a id="slice-s2"></a>
### Slice S2: Execute and review complete slices

#### Surfaces

- Modify `skills/subagent-driven-development/SKILL.md`, `skills/executing-plans/SKILL.md`, `skills/requesting-code-review/SKILL.md`, and `skills/post-implementation-qa/SKILL.md`.
- Modify the three role templates in `skills/subagent-driven-development/` without moving or duplicating the `## Evidence Capsule v1` boundary.
- Extend `tests/r15-compact-slices-contract.test.mjs`; preserve R5, R13 and R14 contracts.
- Own R4-CS-3, R4-CS-4, R4-CS-5, R4-CS-6, R4-QUAL-1, and R4-QUAL-2; depend on S1.

#### Implementation

1. Add RED R15 tests for a compact execution state machine: validate plan; select only dependency-ready slice; build role-specific capsule; implement RED/GREEN; specification review; code-quality review; reconcile file truth; mark slice complete; continue; final full QA/docs/retro/finish.
2. Add mutation tests that dispatch only a fragment of a slice, include unrelated slice/full history, reuse the implementer as reviewer, omit one reviewer, advance with open findings, hide a discovered requirement in code, skip revalidation after amendment, downgrade triggered risk, remove sensors, or skip final Track A/one applicable Track B lens.
3. Update SDD to inspect the validated report. For `valid`, dispatch one complete dependency-ready slice and only its declared sources/requirements/commands plus role-scoped Evidence Capsule v1. For `legacy`, execute the existing task/track behavior byte-for-byte where practical. For `invalid`/`unsupported`, stop before dispatch.
4. Define compact slice state as `pending → implementing → spec-review → quality-review → complete`, with `blocked`/`amendment-required` exits. One implementer owns the complete slice. A fresh specification reviewer and a different fresh code-quality reviewer each issue an independent verdict. Findings return to the implementer and the same role re-reviews; the controller advances only when both are clean and declared GREEN/sensors pass.
5. Update role templates below their stable instruction prefix so the implementer receives full current slice text and only bounded sources; specification receives exact clauses, implementer report, slice diff and evidence; code quality receives diff/source, tests, sensors and public robustness constraints. Do not pass chain-of-thought or the complete plan to normal per-slice reviewers.
6. When implementation/review discovers omitted behavior, a new requirement, wrong boundary or insufficient guidance, set `amendment-required`, stop progression, edit the durable plan, rerun `awm plan validate`, record the deviation in the issue/evidence capsule, then resume only with a valid plan. Code alone never closes a plan defect.
7. When a slice’s declared risk activates, provide full relevant context and complete applicable verification, record reason/evidence, and keep implementer plus both independent reviewers. Fallback changes context size, not review roles or quality gates.
8. Update inline `executing-plans` to use the same compact state/review semantics in-session while preserving existing legacy three-task batches and checkpoints. Update `requesting-code-review` from “each task” to “each legacy task or complete compact slice,” never to end-only review.
9. Keep post-implementation QA global and unchanged in strength: one ID-driven Track A across the complete implementation; one isolated agent per applicable Track B lens; full sensors/project verification; fix loop; post-implementation docs; retro; finishing. Track B capsules still exclude the complete plan.
10. Bump every edited skill version. Run R15, R5, R13 and R14 contracts to GREEN. Mutation-check the legacy plan fixture, parallel-track fixture, role-prefix byte ceilings, complete-plan exclusion for Track B, and Context Kernel fixed closure.

#### Edge cases

- Two slices may touch the same file only when dependencies serialize them; the second receives current file truth, not the first implementer’s conversation.
- A review finding that exposes missing plan behavior triggers amendment before code correction is considered complete.
- A basic executor may request fallback because declared sources are inaccessible; it may not browse unrelated repository surfaces by default.
- Final QA is intentionally broader than slice review and remains full-context where its role requires it.
- Existing journal-first, unattended, sensor, ledger, design-fidelity and track authentication gates continue to apply.

#### Evidence

- R15 RED/GREEN mutation table plus GREEN R5/R13/R14 results.
- Pressure scenarios for “one reviewer is enough,” “small fix can bypass amendment,” “risk fallback can skip review,” and “slice review replaces final QA,” with all post-edit verdicts compliant.
- Independent specification review checks all six owned requirements and confirms two distinct reviewers per complete slice.
- Independent code-quality review checks state transitions, capsule boundaries, legacy/track nonregression, byte ceilings and no duplicate orchestration source of truth.

#### Fallback

- Trigger full relevant context when bounded sources fail, but keep role separation and all gates.
- Amend/revalidate rather than splitting or merging a slice dynamically.
- Revert compact routing only if legacy/parallel behavior or final QA weakens; do not “fix” compatibility tests by deleting historical assertions.

<a id="slice-s3"></a>
### Slice S3: Certify compatibility evidence and release

#### Surfaces

- Create `tests/fixtures/compact-slices-v1/valid-plan.md`, `tests/r15-compact-slices-cli-acceptance.mjs`, and complete `tests/r15-compact-slices-contract.test.mjs`.
- Modify `.github/workflows/validate.yml`, `.github/workflows/auto-tag.yml`, `awm-registry.json`, `bundles/dev/bundle.json`, `catalog.json`, and `CHANGELOG.md`.
- Update this plan and issue #126 with observed R4 T2/T3 evidence.
- Own R4-EVID-1, R4-EVID-2, R4-EVID-3, and R4-EVID-4; depend on S2.

#### Implementation

1. Before metadata edits, obtain the merged R4a SHA and run `npm view agentic-workflow-manager version` plus `npm view agentic-workflow-manager gitHead`. Stop unless the published release commit contains the R4a merge (for example, a release commit whose parent is that merge). Record the observed published version and SHA; do not infer a version from future commits or tags.
2. Create a portable valid compact fixture whose source paths/locators exist in the registry and whose commands are inert. Write `tests/r15-compact-slices-cli-acceptance.mjs` to spawn the declared compatible CLI with `awm plan validate FIXTURE --cwd ROOT --json`; require exit 0, schema `compact-slices/v1`, exact counts, and complete traceability. Add invalid partial/future fixtures in temporary files and require nonzero bounded outcomes.
3. Complete R15 static tests for all process text, role boundaries, legacy routing, full quality gates, evidence vocabulary, claim boundary, skill versions, bundle/catalog consistency, workflow order, and release-producing gate. Mutations must prove every assertion detects removal or weakening rather than merely matching a broad marker.
4. Set `awm-registry.json.minCliVersion` to the observed published R4a version. Do not set it to `latest`, a range, or an unverified predicted version. Preserve compatibility as distinct from runtime currentness.
5. Add R15 contract and CLI acceptance commands to `.github/workflows/validate.yml` after the compatible CLI install. Add both to the `Verify registry before tagging` step in `.github/workflows/auto-tag.yml`; the release-producing job itself must fail before tag computation when either test fails.
6. Bump edited skill versions once: `development-process` 1.8.0, `writing-plans` 1.10.0, `subagent-driven-development` 1.12.0, `executing-plans` 1.3.0, `requesting-code-review` 1.2.0, and `post-implementation-qa` 1.9.0, unless branch history already contains one of those versions—in that case choose the next valid semantic version and keep the release test authoritative.
7. Bump the dev bundle and matching catalog entry from 3.8.0 to 3.9.0 unless branch history already used it; if so, choose the next unused minor version in both files. Add a release-neutral changelog entry describing compact plans, strict handoff and unchanged legacy quality.
8. Run `CMD-R15-CONTRACT`, `CMD-R15-CLI`, R8, R5, R12, R13, R14 core/acceptance, portability, release metadata/version gates, `CMD-SKILL-VERSIONS`, plan validation, strict currentness preflight and diff check. Run every other command listed in both validation/release workflows before handoff; use the workflow files as the exhaustive source so no duplicated stale list is invented here. For this registry's deliberate local sensor opt-out, retain the `validate.yml` sensor-certification matrix as the empirical sensor evidence.
9. Verify the modified active development process composes through the existing process-lifecycle verification path. Do not regenerate unrelated process artifacts or edit installed registry content.
10. Record observed T2/T3 values in this plan and issue #126: plan/context bytes, requirements/slices/dispatches, source retrieval/fallback, retries, reviewer findings, gates, commits and PR. Provider token/cache/model/price/cost fields remain `unobservable` when absent. Record owner quota only if the owner supplies a cycle-bound observation.
11. Complete post-implementation QA, docs verification, retro, and finish checks. Open a feature PR with a conventional `feat:` title so the existing auto-tag policy computes the release. After merge, monitor validation and auto-tag; verify the exact stable tag before declaring R4b delivered.

#### Edge cases

- A newly published npm version whose release commit does not contain the R4a merge is not an acceptable R4a dependency even if its semver is higher.
- Workflow acceptance must run against `minCliVersion`; passing only with a developer’s globally newer CLI is a false positive.
- A registry release tag is computed by existing automation; this plan does not hardcode the future tag.
- Context-footprint failure cannot be waived by dispatch reduction. Reduce duplicated prose/reference placement or deliberately update the established budget through its own reviewed contract.
- Three fresh cycles are R4 plus the next two normal developments. R4b records one real sample but does not publish a generalized savings/non-inferiority conclusion.

#### Evidence

- npm version/`gitHead` proof, R15 acceptance output and workflow ordering assertions.
- Full local validation/release command log, sensor JSON summary, skill-version bump proof and process composition verdict.
- T2/T3 ledger with exact/derived/unobservable classification and no measurement-only model invocation.
- Independent specification review checks all four owned evidence requirements and the serial R4a dependency.
- Independent code-quality review checks fixture portability, child-process safety, mutation quality, workflow release blocking, semver consistency and changelog accuracy.

#### Fallback

- Block if R4a publication provenance is not exact, if the workflow can tag without R15, or if any preserved R5/R8/R12/R13/R14 contract regresses.
- Label absent provider fields `unobservable`; never estimate to complete a table.
- If sensor behavior reproduces issue #129, diagnose only enough to classify it, link the issue, and do not hide a genuine product regression behind the environment report.

## Measurement ledger

| Boundary | Planned evidence | Classification |
|---|---|---|
| R4 T0 | CLI `9.3.0`, baseline `v3.9.2`, fixed Context Kernel `13,166` bytes | exact historical handoff from R4a plan |
| R4b planning analyze gate | installed CLI `9.3.0` returned `unknown command 'plan'` | exact capability limitation; no substitute inferred |
| R4b planning preflight | `ready`; deliberate 2/2 sensor opt-out; legacy full-context migration advisory | exact gate evidence; full context retained |
| R4b local context budget | `27,325` bytes pinned in ignored runtime `.awm/context-budget.json` | exact local evidence; no tracked context/pruning change |
| R4b plan topology | 14 requirements, 3 slices, 12 declared sources, 14 declared commands | exact after final validation |
| Dispatch candidate | one implementer + specification + code-quality review per slice, plus retained final QA/docs/retro/finish | derived until execution |
| Provider tokens/cache/model/price/cost | `unobservable` unless provider evidence appears naturally | unavailable |
| Owner quota | record only an owner observation with its cycle boundary | unavailable at planning |
| Generalized claim | three fresh cycles are required; generalized savings/non-inferiority remains deferred | policy boundary |
| R4 S3 T2 — plan/context bytes | plan/context bytes: 36,626 plan bytes immediately before this S3 evidence append; 27,325-byte local context-budget observation retained from planning | exact, boundary-labeled structural evidence |
| R4 S3 T3 — structural counts | requirements/slices/dispatches: 14/3/0 model dispatches in this S3 implementation; source retrieval/fallback: none/none (the supplied capsule recorded retrieval history `none`) | exact slice-boundary observation; no measurement-only model work |
| R4 S3 T3 — retries/findings/gates | retries: 1 bounded fixture correction after published CLI rejected `node --version`; findings: 1 `PLAN_COMMAND_UNSAFE`, remedied with inert `git --version`; gates: R15 contract and published-CLI acceptance are wired into validation and release jobs | exact test-derived evidence; independent slice reviews remain controller-owned |
| R4 S3 T3 — delivery boundary | commits before S3: 7 branch commits; S3 commit and PR: pending at this record; provider tokens/cache/model/price/cost: `unobservable`; owner quota: `unobservable` because no owner-supplied cycle-bound observation exists | exact/unobservable separation; no generalized savings or non-inferiority claim before three fresh normal cycles |

## Requirement traceability

| Requirement | Owning slice | Exact verification |
|---|---|---|
| R4-CP-2 | S1 | R15 complete five-section slice and low-context pressure scenario |
| R4-CP-4 | S1 | R15 unavailable/ambiguous-source mutations |
| R4-CP-5 | S1 | R15 shared-ID and duplicated-payload mutation |
| R4-CS-3 | S2 | R15 current-slice capsule tests plus R13 full-plan exclusion |
| R4-CS-4 | S2 | R15 two distinct verdict/state-transition mutations |
| R4-CS-5 | S2 | R15 amendment/revalidation/deviation mutation |
| R4-CS-6 | S2 | R15 risk-trigger full-context/review preservation mutation |
| R4-QUAL-1 | S2 | R15 quality-chain assertions plus R5/R8/R13/R14 regressions |
| R4-QUAL-2 | S2 | R15 noninferiority failure triggers plus R12/R14 regressions |
| R4-EVID-1 | S3 | R15 T0–T4 fields and issue/plan ledger assertions |
| R4-EVID-2 | S3 | R15 `unobservable`/no-substitution assertions |
| R4-EVID-3 | S3 | R15 owner-observation provenance assertion |
| R4-EVID-4 | S3 | R15 three-cycle/generalized-claim deferral assertion |
| R4-CUR-6 | S1 | R8 strict advisory entry plus blocking unattended handoff mutations |

Forward coverage is complete: every requirement has one owning slice and a claim-specific test. Backward coverage is complete: every planned file/test/command serves at least one listed requirement. There is no UI surface or design-artifact propagation requirement.

## Final verification and handoff gate

### QA process amendment — R8 registry closure

The durable closure contract is owned by
[Registry Sensor Closure Policy (R8 v1)](../../skills/setup-sensors/references/registry-closure-policy-r8.md).

Run from the registry root after installing the exact published R4a CLI:

```bash
npm exec -- node tests/r15-compact-slices-contract.test.mjs
npm exec -- node tests/r15-compact-slices-cli-acceptance.mjs
npm exec -- node tests/r8-sensor-gate-contract.test.mjs
npm exec -- node tests/r5-track-contract.test.mjs
npm exec -- node tests/r12-context-footprint-contract.test.mjs
npm exec -- node tests/r13-role-evidence-capsule-contract.test.mjs
npm exec -- node tests/r14-context-kernel-contract.test.mjs
npm exec -- node tests/r14-context-kernel-cli-acceptance.mjs
npm exec -- node scripts/validate-portability.mjs
npm exec -- node tests/release-skill-version-gate.test.mjs
scripts/check-skill-version-bumps.sh origin/main
awm plan validate docs/plans/2026-08-26-r4b-compact-sliced-execution-plan.md --cwd . --json
awm preflight --require-current
git diff --check
```

Also execute every remaining test command present in `.github/workflows/validate.yml` and in the release-producing verification step of `.github/workflows/auto-tag.yml`. Those committed workflows are the exhaustive release list.

Before execution is offered during planning, use the currently installed gates:

```bash
awm plan analyze docs/plans/2026-08-26-r4b-compact-sliced-execution-plan.md --json
awm preflight
awm context-budget
```

R4b execution remains blocked until R4a is merged/published in an npm release whose `gitHead` contains that merge; at that point rerun planning preflight with the fresh CLI and require strict currentness. Work serially S1 → S2 → S3, commit each reviewed slice separately, and do not open the PR before full QA/docs/retro/finish and all release-producing gates pass.
