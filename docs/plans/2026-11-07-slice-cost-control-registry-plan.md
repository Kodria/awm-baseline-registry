# Slice cost control — Registry companion plan (#246)

> **For agentic workers:** REQUIRED SUB-SKILL: Use `subagent-driven-development`
> (recommended) or `executing-plans` to implement this plan task-by-task. Steps
> use checkbox (`- [ ]`) syntax for tracking.

**Goal:** After CLI 9.23.0 on npm, teach packs/skills to use `sliceCommand`, MechanicalRunEvidence verify, review round ceiling/defer, and QA fail-closed on deferred-open — raise `minCliVersion` / re-certify.

**Architecture:** Content-only in this registry. Normative RF text stays in the CLI design (pointer: `docs/plans/2026-11-07-slice-cost-control-registry-design.md`). Follow the #236 companion pattern: contract harness → schema/floor → skill prose with mutation-proof section asserts.

**Tech Stack:** Markdown skills, JSON packs/schema, Node test contracts, `scripts/cli-certification.mjs`.

**Change Record:** ninguno — content registry; release via conventional-commit PR title + auto-tag

**Criterios de aceptación:**
- Pack schema + mirror validator accept variant `sliceCommand` with required `fileInput` (same as `changedCommand`)
- `setup-sensors` + pack README teach `inputs` + optional `sliceCommand` for slow `closureOnly` sensors (RF-2.4); no invented pack defaults that violate #236 RF-1.9
- `review-cycle-v1` + SDD prompts: Mechanical evidence via `awm evidence verify` match; RF-4.1–4.6 cut/ceiling/defer mapping; RF-5.2 warn ≥30% or ≥20 min
- `post-implementation-qa` lists `awm ledger list --deferred-open` before `awm-qa-complete` and fails closed if any remain (RF-E.3 / RF-4.5)
- QA/docs/finish keep full-gate sensors; `cached: true` allowed; never `--slice`/`--no-cache` as closure (RF-6.1)
- `minCliVersion` and `certifiedCli.version` ≥ `9.23.0` (RF-6.3); `npm run test:slice-cost-control` + `test:version-bumps` green

**Modo de ejecución:** desatendido

**Modo de despacho:** proveedor-nativo

**Prerequisite:** CLI `9.23.0` on npm (observed). Docs-only merge of this plan PR is allowed earlier; S2+ require the published floor.

<!-- AWM:COMPACT-SLICES:START v1 -->
{
  "schema": "compact-slices/v1",
  "planId": "slice-cost-control-registry",
  "requirements": [
    "RF-R.0",
    "RF-2.4", "RF-3.3",
    "RF-4.1", "RF-4.2", "RF-4.3", "RF-4.4", "RF-4.5", "RF-4.6",
    "RF-5.1", "RF-5.2",
    "RF-6.1", "RF-6.3",
    "RF-E.3",
    "RF-1.5"
  ],
  "sources": [
    {
      "id": "SRC-POINTER",
      "path": "docs/plans/2026-11-07-slice-cost-control-registry-design.md",
      "locator": "## Registry-owned RFs",
      "fact": "Pointer lists registry-owned RF IDs; normative prose is CLI design #246; floor is published 9.23.0."
    },
    {
      "id": "SRC-SCHEMA",
      "path": "sensor-packs/pack.schema.json",
      "locator": "\"variant\"",
      "fact": "variant has changedCommand with fileInput required-if-present; sliceCommand absent; additionalProperties false."
    },
    {
      "id": "SRC-MIRROR",
      "path": "tests/support/sensor-pack-v2-validator.mjs",
      "locator": "exactFields(variant",
      "fact": "Mirror exactFields omits sliceCommand today and would reject packs that declare it."
    },
    {
      "id": "SRC-REGISTRY",
      "path": "awm-registry.json",
      "locator": "minCliVersion",
      "fact": "minCliVersion is 9.22.0; must rise to 9.23.0 for sliceCommand/evidence/ledger deferred APIs."
    },
    {
      "id": "SRC-CERT",
      "path": "cli-certification.json",
      "locator": "certifiedCli",
      "fact": "certifiedCli is 9.22.0; re-cert to 9.23.0 with npm gitHead sourceSha and awm model-policy protocolDigest."
    },
    {
      "id": "SRC-SETUP",
      "path": "skills/setup-sensors/SKILL.md",
      "locator": "name: setup-sensors",
      "fact": "Teaches inputs/closureOnly and that --slice skips closureOnly; must teach optional sliceCommand + --base."
    },
    {
      "id": "SRC-REVIEW",
      "path": "skills/subagent-driven-development/references/review-cycle-v1.md",
      "locator": "## Mechanical evidence",
      "fact": "Mechanical evidence section exists without evidence verify / defer ceiling / duration warn."
    },
    {
      "id": "SRC-QA",
      "path": "skills/post-implementation-qa/SKILL.md",
      "locator": "awm-qa-complete",
      "fact": "QA marker exists; no deferred-open ledger gate before completion."
    },
    {
      "id": "SRC-PKG",
      "path": "package.json",
      "locator": "\"scripts\"",
      "fact": "Add test:slice-cost-control pointing at the new r20 contract."
    }
  ],
  "commands": [
    {
      "id": "CMD-CONTRACT",
      "program": "npm",
      "args": ["run", "test:slice-cost-control"],
      "covers": ["RF-R.0", "RF-1.5", "RF-2.4", "RF-3.3", "RF-4.1", "RF-4.2", "RF-4.3", "RF-4.4", "RF-4.5", "RF-4.6", "RF-5.1", "RF-5.2", "RF-6.1", "RF-6.3", "RF-E.3"]
    },
    {
      "id": "CMD-VERSION-BUMPS",
      "program": "npm",
      "args": ["run", "test:version-bumps"],
      "covers": ["RF-2.4", "RF-3.3", "RF-4.5", "RF-6.1"]
    }
  ],
  "slices": [
    {
      "id": "S1",
      "title": "Contract harness and package script",
      "requirements": ["RF-R.0"],
      "dependsOn": [],
      "sectionAnchor": "slice-s1",
      "sources": ["SRC-POINTER", "SRC-PKG"],
      "redCommands": ["CMD-CONTRACT"],
      "greenCommands": ["CMD-CONTRACT"],
      "reviewEvidence": ["specification", "code-quality"],
      "risk": "full-context",
      "fallback": ["public-contract"]
    },
    {
      "id": "S2",
      "title": "Schema, mirror, minCliVersion, re-cert, setup-sensors",
      "requirements": ["RF-1.5", "RF-2.4", "RF-6.3"],
      "dependsOn": ["S1"],
      "sectionAnchor": "slice-s2",
      "sources": ["SRC-SCHEMA", "SRC-MIRROR", "SRC-REGISTRY", "SRC-CERT", "SRC-SETUP"],
      "redCommands": ["CMD-CONTRACT"],
      "greenCommands": ["CMD-CONTRACT"],
      "reviewEvidence": ["specification", "code-quality"],
      "risk": "full-context",
      "fallback": ["public-contract"]
    },
    {
      "id": "S3",
      "title": "Review cycle cut, evidence verify, duration warn",
      "requirements": ["RF-3.3", "RF-4.1", "RF-4.2", "RF-4.3", "RF-4.4", "RF-4.6", "RF-5.1", "RF-5.2"],
      "dependsOn": ["S2"],
      "sectionAnchor": "slice-s3",
      "sources": ["SRC-REVIEW", "SRC-POINTER"],
      "redCommands": ["CMD-CONTRACT"],
      "greenCommands": ["CMD-CONTRACT"],
      "reviewEvidence": ["specification", "code-quality"],
      "risk": "full-context",
      "fallback": ["public-contract"]
    },
    {
      "id": "S4",
      "title": "QA deferred-open fail-closed and full-gate cache wording",
      "requirements": ["RF-4.5", "RF-E.3", "RF-6.1"],
      "dependsOn": ["S3"],
      "sectionAnchor": "slice-s4",
      "sources": ["SRC-QA", "SRC-POINTER"],
      "redCommands": ["CMD-CONTRACT", "CMD-VERSION-BUMPS"],
      "greenCommands": ["CMD-CONTRACT", "CMD-VERSION-BUMPS"],
      "reviewEvidence": ["specification", "code-quality"],
      "risk": "full-context",
      "fallback": ["public-contract"]
    }
  ],
  "closureCommands": ["CMD-CONTRACT", "CMD-VERSION-BUMPS"]
}
<!-- AWM:COMPACT-SLICES:END v1 -->

<a id="slice-s1"></a>
### Slice S1: Contract harness and package script

#### Surfaces
Own RF-R.0: add `tests/r20-slice-cost-control-contract.test.mjs` with failing stubs for registry-owned RFs and `package.json` script `test:slice-cost-control`. Grouping: harness only — no content edits yet.

#### Implementation
1. Add `npm` script `test:slice-cost-control` → `node --test tests/r20-slice-cost-control-contract.test.mjs`.
2. Write RED contract: `FIRST_CLI_WITH_SLICE_COST = '9.23.0'`; assert floor/cert ≥ that constant (will fail until S2); assert schema/mirror/skills contain the RF-required phrases (will fail until S2–S4). Use section-scoped extraction (not whole-file keyword matches) per AGENTS.md vacuous-assert lessons.
3. Run CMD-CONTRACT → observe RED. Keep stubs green only for harness self-checks (file exists, script wired).

#### Edge cases
Vacuous regexes that survive deleting the normative sentence are forbidden. Mutate by deleting the target section before claiming GREEN later.

#### Evidence
CMD-CONTRACT RED on missing content. Spec/quality reviews on harness. Plan identity must remain admitted.

#### Fallback
If RF ID set changes, amend pointer + manifest and revalidate — do not invent RFs.

<a id="slice-s2"></a>
### Slice S2: Schema, mirror, minCliVersion, re-cert, setup-sensors

#### Surfaces
Own RF-1.5 (pack authoring), RF-2.4, RF-6.3: `sensor-packs/pack.schema.json`, `tests/support/sensor-pack-v2-validator.mjs`, equivalence tests if present, `awm-registry.json`, `cli-certification.json`, `sensor-packs/README.md`, `skills/setup-sensors/SKILL.md` (+ frontmatter version bump), `bundles/dev` + `catalog.json` bump when skills change.

#### Implementation
1. Add variant `sliceCommand` `$ref` structuredCommand; `allOf` require `fileInput` when present (mirror `changedCommand`).
2. Mirror validator: allow `sliceCommand` in exactFields; require `fileInput` when present; reject unknown fields still.
3. Set `minCliVersion` to `9.23.0`. Re-certify `certifiedCli` to version `9.23.0`, `sourceSha` = npm `gitHead` of 9.23.0 (`e1cd66c3ad19b080c5d13d09d2b534258235cefd`), `protocolDigest` from `awm model-policy contract --json` on that CLI.
4. Teach `setup-sensors` + README: optional `sliceCommand` for slow `closureOnly`; `--slice --base <sha>` when executing it; bare `--slice` remains skip-compatible; do not ship unsafe mutation defaults.
5. GREEN CMD-CONTRACT asserts for RF-1.5/2.4/6.3.

#### Edge cases
Do not lower floor below 9.23.0. Do not add directory-anchored pack `inputs` defaults. NegativeControls must stay below the new floor.

#### Evidence
CMD-CONTRACT GREEN for S2 asserts. Skill version bump script must pass for edited skills.

#### Fallback
If npm gitHead differs from tag tip, prefer npm-published `gitHead` and document in commit.

<a id="slice-s3"></a>
### Slice S3: Review cycle cut, evidence verify, duration warn

#### Surfaces
Own RF-3.3, RF-4.1–4.4, RF-4.6, RF-5.1–5.2: `skills/subagent-driven-development/references/review-cycle-v1.md`, related SDD prompts (`implementer-prompt.md`, `code-quality-reviewer-prompt.md`, `spec-reviewer-prompt.md` as needed), SDD `SKILL.md` if it contradicts (clean-before-advance vs defer). Bump skill versions.

#### Implementation
1. Extend Mechanical evidence: arbitrary commands → `awm evidence verify` must report `match` (expected argv required); sensors → use `awm sensors run` provenance/`cached` — never conflate with CycleEvidenceV1.
2. Encode RF-4.1 first-round full fix; RF-4.2 re-review only blocking; RF-4.3 ceiling after 3 rounds defers non-blocking with reason `round-ceiling` and advances; RF-4.4 blocking never defer; RF-4.6 mapping: `class=seguridad` OR `severity=blocker` (covers false external result + red mechanical gate via severity/class already used by ledger).
3. RF-5.1: durations from ledger `ts` / receipt `durationMs` only. RF-5.2: warn if gate ≥30% of slice total OR ≥20 minutes.
4. Update controller/prompt text that currently requires “both reviewers clean” without defer carve-out.
5. GREEN section-scoped contract asserts.

#### Edge cases
Security/blocker findings cannot be deferred even at ceiling. Do not invent a parallel taxonomy beyond ledger class/severity.

#### Evidence
CMD-CONTRACT GREEN for S3. Spec/quality reviews.

#### Fallback
Amend design pointer if mapping text must cite exact ledger field names from published CLI help.

<a id="slice-s4"></a>
### Slice S4: QA deferred-open fail-closed and full-gate cache wording

#### Surfaces
Own RF-4.5, RF-E.3, RF-6.1: `skills/post-implementation-qa/SKILL.md`, confirm/adjust `post-implementation-docs` and `finishing-a-development-branch` full-gate + cache language, bump versions, finalize `bundles/dev`/`catalog.json`, teach `--slice --base` in `executing-plans` / SDD implementer when `sliceCommand` is present (compat: bare `--slice` still valid without it).

#### Implementation
1. Before `awm-qa-complete`: require `awm ledger list --deferred-open`; if any entry remains, fail closed (no marker). Resolve via `awm ledger resolve --id`.
2. Keep QA/docs/finish on full-gate `awm sensors run` with `overall: pass`; explicitly allow `cached: true`; forbid `--slice` and `--no-cache` as closure evidence.
3. Where slice DONE still says `awm sensors run --slice`, add: when any selected sensor has `sliceCommand`, also pass `--base <slice-start-sha>`.
4. GREEN all CMD-CONTRACT + CMD-VERSION-BUMPS.

#### Edge cases
Empty deferred-open list is the only pass path for the new QA gate. Do not weaken full-gate language.

#### Evidence
CMD-CONTRACT + CMD-VERSION-BUMPS GREEN. System-complete journey: slice with sliceCommand → review defer → QA blocked until resolve → docs/finish full cache.

#### Fallback
If skill contradictions appear in Red Flags/Common Mistakes, fix in the same commit (AGENTS.md lesson).
