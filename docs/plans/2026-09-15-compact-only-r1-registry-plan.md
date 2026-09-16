# Compact-only R1 Registry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `subagent-driven-development`
> to execute this plan one admitted compact slice at a time.

**Goal:** Make every baseline lifecycle skill author, admit, migrate, and close only compact plans while preserving all existing quality gates and declaring the CLI contract it consumes.

**Architecture:** Registry skills consume CLI mechanical reports rather than reimplement parsing or dispatch. `writing-plans` returns planning-required for incomplete specifications and emits only the canonical v1 heading vocabulary; lifecycle consumers require admission/journal identity before execution, then retain reviewers, QA, docs, retro, and finish.

**Tech Stack:** Markdown skills, Node `node:test` structural contracts, shared compact fixtures, registry metadata and release workflows.

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
  "planId": "issue-126-compact-only-r1-registry",
  "requirements": [
    "RF-1.1",
    "RF-1.2",
    "RF-1.3",
    "RF-1.4",
    "RF-1.5",
    "RF-1.6",
    "RF-2.1",
    "RF-2.2",
    "RF-2.3",
    "RF-2.4",
    "RF-2.5",
    "RF-3.1",
    "RF-3.2",
    "RF-3.3",
    "RF-3.4",
    "RF-3.5",
    "RF-5.1",
    "RF-5.4",
    "RF-5.5",
    "RF-6.1",
    "RNF-T.1",
    "RNF-T.2",
    "RNF-T.3",
    "RNF-T.4",
    "RNF-T.5",
    "RNF-T.6",
    "RNF-T.7"
  ],
  "sources": [
    {
      "id": "SRC-DESIGN",
      "path": "docs/plans/2026-08-26-r4b-compact-sliced-execution-plan.md",
      "locator": "### Slice S1: Author compact planning and strict handoff",
      "fact": "The existing registry compact workflow is the local contract baseline; R1 replaces only its legacy admission route with the approved compact-only boundary."
    },
    {
      "id": "SRC-WRITE",
      "path": "skills/writing-plans/SKILL.md",
      "locator": "## Compact-only authoring",
      "fact": "Current authoring contract still offers legacy output and stale analyze semantics, both replaced by compact-only R1 behavior."
    },
    {
      "id": "SRC-SDD",
      "path": "skills/subagent-driven-development/SKILL.md",
      "locator": "## Compact sliced execution (R4-CS)",
      "fact": "Current executor must require CLI admission and journal identity before its first role dispatch."
    },
    {
      "id": "SRC-DEV",
      "path": "skills/development-process/SKILL.md",
      "locator": "## Lifecycle State",
      "fact": "Lifecycle router currently selects execution from plan heuristics and must consume admission state."
    },
    {
      "id": "SRC-EXEC",
      "path": "skills/executing-plans/SKILL.md",
      "locator": "## The Process",
      "fact": "Inline executor remains a consumer of compact admission and existing quality closure."
    },
    {
      "id": "SRC-QA",
      "path": "skills/post-implementation-qa/SKILL.md",
      "locator": "## Two Tracks",
      "fact": "Track A and Track B final QA are mandatory closure consumers, not replacements for per-slice reviews."
    },
    {
      "id": "SRC-REF",
      "path": "skills/writing-plans/references/compact-slices-v1.md",
      "locator": "## Manifest boundary",
      "fact": "Published reference must match the validator's five canonical #### subsection names and source/command contract."
    },
    {
      "id": "SRC-TEST",
      "path": "tests/r15-compact-slices-contract.test.mjs",
      "locator": "const SLICE_SECTIONS",
      "fact": "Existing structural contract test pattern is the baseline for mutation-resistant cross-skill assertions."
    },
    {
      "id": "SRC-META",
      "path": "awm-registry.json",
      "locator": "minCliVersion",
      "fact": "Registry metadata declares the minimum compatible published CLI for installed cross-repository acceptance."
    }
  ],
  "commands": [
    {
      "id": "CMD-CONTRACT",
      "program": "npm",
      "args": [
        "run",
        "test:compact-only"
      ],
      "covers": [
        "RF-1.1",
        "RF-1.2",
        "RF-1.3",
        "RF-1.4",
        "RF-1.5",
        "RF-1.6",
        "RF-2.1",
        "RF-2.2",
        "RF-2.3",
        "RF-2.4",
        "RF-2.5",
        "RF-3.1",
        "RF-3.2",
        "RF-3.3",
        "RF-3.4",
        "RF-3.5",
        "RF-5.1",
        "RF-5.4",
        "RF-5.5",
        "RNF-T.1",
        "RNF-T.2",
        "RNF-T.3",
        "RNF-T.4",
        "RNF-T.5",
        "RNF-T.6",
        "RNF-T.7"
      ]
    },
    {
      "id": "CMD-CLI-ACCEPT",
      "program": "npm",
      "args": [
        "run",
        "test:compact-cli"
      ],
      "covers": [
        "RF-1.3",
        "RF-1.4",
        "RF-2.1",
        "RF-2.3",
        "RF-2.5"
      ]
    },
    {
      "id": "CMD-RELEASE",
      "program": "npm",
      "args": [
        "run",
        "test:release"
      ],
      "covers": [
        "RF-6.1",
        "RNF-T.6"
      ]
    },
    {
      "id": "CMD-PORTABILITY",
      "program": "npm",
      "args": [
        "run",
        "test:portability"
      ],
      "covers": [
        "RNF-T.1",
        "RNF-T.2",
        "RNF-T.3"
      ]
    },
    {
      "id": "CMD-VERSION",
      "program": "scripts/check-skill-version-bumps.sh",
      "args": [
        "origin/main"
      ],
      "covers": [
        "RF-6.1"
      ]
    },
    {
      "id": "CMD-DIFF",
      "program": "git",
      "args": [
        "diff",
        "--check"
      ],
      "covers": []
    }
  ],
  "slices": [
    {
      "id": "S1",
      "title": "Compact-only planning contract and canonical corpus",
      "requirements": [
        "RF-1.1",
        "RF-1.2",
        "RF-1.3",
        "RF-1.4",
        "RF-1.5",
        "RF-1.6",
        "RF-5.1",
        "RNF-T.2",
        "RNF-T.4",
        "RNF-T.5"
      ],
      "dependsOn": [],
      "sectionAnchor": "slice-s1",
      "sources": [
        "SRC-DESIGN",
        "SRC-WRITE",
        "SRC-REF",
        "SRC-TEST"
      ],
      "redCommands": [
        "CMD-CONTRACT"
      ],
      "greenCommands": [
        "CMD-CONTRACT",
        "CMD-CLI-ACCEPT"
      ],
      "reviewEvidence": [
        "specification",
        "code-quality"
      ],
      "risk": "full-context",
      "fallback": [
        "Return planning-required with named missing facts; never write a legacy executable plan or translate canonical requirement IDs."
      ]
    },
    {
      "id": "S2",
      "title": "Admitted journal-first lifecycle and migration protocol",
      "requirements": [
        "RF-2.1",
        "RF-2.2",
        "RF-2.3",
        "RF-2.4",
        "RF-2.5",
        "RF-3.1",
        "RF-3.2",
        "RF-3.3",
        "RF-3.4",
        "RF-3.5",
        "RF-5.4",
        "RF-5.5",
        "RNF-T.3",
        "RNF-T.6",
        "RNF-T.7"
      ],
      "dependsOn": [
        "S1"
      ],
      "sectionAnchor": "slice-s2",
      "sources": [
        "SRC-DESIGN",
        "SRC-SDD",
        "SRC-DEV",
        "SRC-EXEC",
        "SRC-QA"
      ],
      "redCommands": [
        "CMD-CONTRACT"
      ],
      "greenCommands": [
        "CMD-CONTRACT",
        "CMD-CLI-ACCEPT"
      ],
      "reviewEvidence": [
        "specification",
        "code-quality"
      ],
      "risk": "full-context",
      "fallback": [
        "Block before role dispatch on absent/invalid admission or journal identity; migration creates a separate continuation only from CLI facts."
      ]
    },
    {
      "id": "S3",
      "title": "Installed contract acceptance and release evidence",
      "requirements": [
        "RF-6.1",
        "RNF-T.1"
      ],
      "dependsOn": [
        "S2"
      ],
      "sectionAnchor": "slice-s3",
      "sources": [
        "SRC-DESIGN",
        "SRC-META",
        "SRC-TEST"
      ],
      "redCommands": [
        "CMD-CLI-ACCEPT"
      ],
      "greenCommands": [
        "CMD-CLI-ACCEPT",
        "CMD-RELEASE",
        "CMD-PORTABILITY",
        "CMD-VERSION"
      ],
      "reviewEvidence": [
        "specification",
        "code-quality"
      ],
      "risk": "bounded",
      "fallback": [
        "Keep source changes unpublishable until the exact compatible CLI and installed registry acceptance both pass; record unavailable provider evidence as unverified."
      ]
    }
  ],
  "closureCommands": [
    "CMD-CONTRACT",
    "CMD-CLI-ACCEPT",
    "CMD-RELEASE",
    "CMD-PORTABILITY",
    "CMD-VERSION",
    "CMD-DIFF"
  ]
}
<!-- AWM:COMPACT-SLICES:END v1 -->

<a id="slice-s1"></a>
### Slice S1: Compact-only planning contract and canonical corpus

#### Surfaces

Modify `skills/writing-plans/SKILL.md` and `references/compact-slices-v1.md`; create or
extend `tests/r15-compact-slices-contract.test.mjs` and compact fixture files. Bump exactly
each changed skill version and later dev bundle/catalog metadata once.

#### Implementation

- [ ] Write mutation-resistant RED tests that scope every assertion to the relevant skill
  section and fail if legacy output, missing ownership, missing five `####` headings, unsafe
  source discovery, fake `awm plan analyze`, model names, or unvalidated amendment is restored.
- [ ] Make formed, serial, owner-complete requirements produce only `compact-slices/v1`; make
  missing requirements/ownership/product/architecture/boundaries return planning-required and
  write no executable plan. Preserve canonical IDs byte-for-byte and align reference/example
  to `Surfaces`, `Implementation`, `Edge cases`, `Evidence`, `Fallback`.
- [ ] Require revalidation/new CLI identity after plan amendment and require exact documented
  public commands only. The planner may self-review traceability but must not claim a missing
  CLI command exists.
- [ ] Run CMD-CONTRACT RED/GREEN and CMD-CLI-ACCEPT against the compatible compiled CLI; clean
  reviews and commit `feat(planning): require compact-only plans (#126)`.

#### Edge cases

Historical plans stay readable but are never emitted as an execution option. v1 is serial;
tracks and semantic model profiles are outside R1. Inaccessible sources must be inlined or
trigger planning-required, never delegated as repository exploration.

#### Evidence

Each mutation has a named assertion that fails when its exact normative sentence is removed.
The shared valid example passes the CLI unchanged; each missing/duplicate heading fails.

#### Fallback

If the CLI contract is not available, do not duplicate a parser in Markdown: block the
handoff and name the required compatible version.

<a id="slice-s2"></a>
### Slice S2: Admitted journal-first lifecycle and migration protocol

#### Surfaces

Modify `skills/development-process/SKILL.md`, `skills/subagent-driven-development/SKILL.md`,
`skills/executing-plans/SKILL.md`, role templates, `post-implementation-qa`, docs, retro, and
finishing lifecycle consumers only where they locate plan identity. Add structural tests.

#### Implementation

- [ ] Write RED contract/mutation tests proving each execution entry calls `awm plan admit`
  before a role dispatch; invalid, unsupported, migration-required, currentness mismatch,
  missing/corrupt/stale journal, or unverified provider blocks with zero dispatches.
- [ ] Route every consumer through CLI admission/digest rather than filename or checkbox
  scans. In unattended mode require journal-first reconcile; retain existing journal ledger,
  sensors, TDD, two reviewers, final review, Track A/B QA, docs, retro, verification, and
  finishing obligations unchanged.
- [ ] Add the evidence-backed migration protocol: consume CLI facts, preserve original bytes,
  write a separate compact continuation only for supported remaining work, and represent #148
  as Task 1 antecedent, Task 2 pending quality review, Tasks 3–14 unstarted. Ambiguity stops.
- [ ] Keep evidence capsules bounded and role-specific; risk expands context only, never
  removes reviewers/gates. Run CMD-CONTRACT RED/GREEN and CMD-CLI-ACCEPT, review, then commit
  `feat(workflow): require admitted compact execution (#126)`.

#### Edge cases

Interactive mode requires compact admission but not journal-first custody. A changed digest
invalidates evidence. Provider support must be described per capability and cannot be inferred
from artifact delivery.

#### Evidence

Fixtures assert zero role dispatch for every non-admitted state, one current digest across
lifecycle consumers, and final closure exactly once after all locally complete slices.

#### Fallback

If migration cannot safely map facts to ownership, return planning-required/blocked; do not
mark a checkbox or allow historical task execution.

<a id="slice-s3"></a>
### Slice S3: Installed contract acceptance and release evidence

#### Surfaces

Modify `awm-registry.json`, `bundles/dev/bundle.json`, `catalog.json`, `.github/workflows/
validate.yml`, `.github/workflows/auto-tag.yml`, changelog, and contract acceptance tests.

#### Implementation

- [ ] Add RED installed-pair acceptance that invokes the declared min CLI against the published
  reference fixture and an intentionally mismatched registry fixture; matched passes, mismatch
  blocks and names components before dispatch.
- [ ] Set `minCliVersion` only to the observed published compatible CLI after the CLI PR is
  accepted; make validation and auto-tag run structural and installed acceptance before any
  registry tag. Bump changed skill, bundle, and catalog versions consistently.
- [ ] Link commits, plan paths, verification, #148 dry-run, provider evidence classification,
  and PRs from issue #126; unavailable capability remains `unverified`, never compatibility.
- [ ] Run CMD-CLI-ACCEPT, CMD-RELEASE, CMD-PORTABILITY, CMD-VERSION, CMD-DIFF; clean reviews
  and commit `feat(registry): certify compact-only R1 contract (#126)`.

#### Edge cases

Do not predict an npm version or publish from this branch. CLI-first rollout is mandatory;
cross-repository source success is not installed acceptance.

#### Evidence

Workflow tests prove release gating order; installed acceptance proves the exact min version,
and issue evidence is durable even if remote linking must be retried.

#### Fallback

Leave the registry PR blocked from publication when the paired CLI is unavailable or differs;
never lower min version or weaken a contract test to pass locally.

## Traceability matrix

| Requirement | Owner | Direct verification |
|---|---|---|
| RF-1.1–RF-1.6, RF-5.1 | S1 | scoped authoring/reference mutation tests and CLI corpus acceptance |
| RF-2.1–RF-2.5, RF-3.1–RF-3.5, RF-5.4–RF-5.5 | S2 | zero-dispatch lifecycle/migration contract fixtures |
| RF-6.1, RNF-T.1 | S3 | installed pair, workflow ordering, issue evidence |
| RNF-T.2–RNF-T.7 | S1-S2 | bounded contract, redaction, preservation, visible fallback, unchanged gates, idempotence fixtures |

## Closure gates

Run all closure commands, full final system journey review, Track A/B QA, documentation,
retro, verification, and finishing. The registry can publish only after the compatible CLI is
published, installed acceptance passes, and the #148 migration dry run succeeds.

## Approved exact clauses (contained capsule source)

These exact clauses are inlined from the owner-approved #126 design Requirements,
agentic-workflow/docs/plans/2026-09-14-compact-only-unattended-execution-design.md.
The external source never becomes an unsafe/out-of-repository manifest source.

- **RF-1.1** — WHEN `writing-plans` receives complete approved requirements with explicit ownership, THE planning process SHALL produce a supported compact plan and SHALL NOT expose a legacy implementation-plan option.
- **RF-1.2** — IF requirements, ownership, product decisions, architecture decisions, or safe slice boundaries are incomplete, THEN THE planning process SHALL return `planning-required` and SHALL NOT write an executable implementation plan.
- **RF-1.3** — WHEN requirements use canonical IDs such as `RF-1.1`, `RNF-T.1`, or an existing safe hyphenated ID, THE compact contract SHALL preserve and validate the identifier without translation.
- **RF-1.4** — WHEN the compact reference defines required slice sections, THE producer, example, CLI validator, and executors SHALL consume one canonical heading vocabulary and structure.
- **RF-1.5** — WHEN a published skill instructs an agent to run an AWM command, THE installed CLI SHALL expose that command with the documented semantics or THE instruction SHALL be removed.
- **RF-1.6** — WHEN a compact plan changes, THE workflow SHALL revalidate it and SHALL assign a new plan identity before further execution.
- **RF-2.1** — WHEN `awm plan validate` reads an unmarked plan, THE CLI SHALL return `migration-required` with a non-zero exit and SHALL NOT advertise another executable path.
- **RF-2.2** — WHEN any implementation executor starts, THE controller SHALL pass compact admission before its first subagent dispatch.
- **RF-2.3** — IF a plan is invalid or signals an unsupported schema, THEN THE CLI and every executor SHALL block without reinterpreting it as historical input.
- **RF-2.4** — IF a compact slice triggers security, robustness, root-configuration, public-contract, or uncertain cross-cutting risk, THEN THE executor SHALL expand relevant context while retaining the compact state machine and every quality gate.
- **RF-2.5** — WHEN the installed CLI and consumed registry contracts disagree, THE admission preflight SHALL block unattended execution and SHALL name the incompatible components.
- **RF-3.1** — WHEN execution mode is `desatendido`, THE admission gate SHALL require a healthy journal bound to the current plan identity before dispatch.
- **RF-3.2** — WHEN an unattended controller starts or resumes, THE workflow SHALL reconcile journal, plan, Git, active jobs, tests, sensors, and verdicts before selecting work.
- **RF-3.3** — WHEN migrating partially executed work, THE workflow SHALL carry forward only completion supported by current file-derived and durable evidence.
- **RF-3.4** — WHEN issue #148 resumes, THE migration SHALL retain Task 1 as verified antecedent, Task 2 as pending quality re-review, and Tasks 3–14 as unstarted unless newer durable evidence proves otherwise.
- **RF-3.5** — IF migration finds ambiguous ownership, conflicting evidence, or an unsafe boundary, THEN THE workflow SHALL stop with `planning-required` or `blocked` and SHALL NOT infer completion.
- **RF-5.1** — WHEN adjacent requirements share behavior, surfaces, dependencies, and verification boundaries, THE planner SHALL group them into the smallest justified cohesive slices.
- **RF-5.4** — WHEN implementation for a slice ends, THE workflow SHALL reconcile independent specification and code-quality verdicts with current files, tests, sensors, requirements, and plan identity before completion.
- **RF-5.5** — WHEN every slice is locally complete, THE workflow SHALL still execute final review, Track A and Track B QA, documentation, retro, sensors, verification, and finishing gates.
- **RF-6.1** — WHEN a material artifact, decision, checkpoint, measurement, commit, or pull request changes, THE initiative SHALL link durable evidence from issue #126.
- **RNF-T.1** — THE provider contract SHALL enumerate Antigravity, OpenCode, Claude Code, Codex, Cursor, and Copilot and SHALL represent each execution capability honestly instead of inferring it from artifact support.
- **RNF-T.2** — THE workflow SHALL validate public inputs, bound reads and diagnostics, reject unsafe paths and commands, and fail loudly without partial writes.
- **RNF-T.3** — THE journal, routing evidence, and usage reports SHALL be local, bounded, atomic, and redacted.
- **RNF-T.4** — THE workflow SHALL preserve historical plans byte-for-byte and SHALL write migration output as a separate artifact.
- **RNF-T.5** — THE workflow SHALL expose every fallback, degradation, migration, retry, and invalidation; none may silently select a more expensive or weaker path.
- **RNF-T.6** — THE workflow SHALL retain every existing quality gate and SHALL reject an optimization when quality, robustness, security, or acceptance coverage regresses.
- **RNF-T.7** — THE unattended workflow SHALL be deterministic and idempotent for plan identity, slice, role, command, and verdict across interruption and retry.

Registry source has a prospective minCliVersion 9.8.0 selected by the controller from
the verified current 9.7.1 release pipeline; this is not evidence of publication.
Publication remains blocked until exact compatible tarball, installed pair and #148 dry run.

## Verified source checkpoint (2026-09-16)

R16 RED observed before content (0/7), then GREEN (8/8) with exact-clause and all-consumer
mutations. Retro recipe separately RED for unconditional missing-state capture, then GREEN
(5/5) including executed missing/corrupt/unused/terminal controls. Native Bash3.2 release gate
RED mapfile/unbound-empty-array, then GREEN (5/5), with real unbumped-skill and bundle/catalog
negative controls. Bounded lifecycle/quality regression: 111 PASS; compiled CLI reference,
malformed/future/unmarked admission controls and historical v1/context-kernel: 4 PASS.
These are source/prerelease results, not global QA, independent review, published/installed
acceptance, #148 migration success, R1 availability or cost/billing savings. Closure remains
controller-owned and pending. Commands are local npm scripts, never npm exec network installs.
