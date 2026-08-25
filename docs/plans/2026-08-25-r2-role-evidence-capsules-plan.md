# R2 Stable Prefixes and Role Evidence Capsules Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `subagent-driven-development`
> (recommended) or `executing-plans` to implement this plan task-by-task. Steps
> use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce at least 40% of the exact initial bytes dispatched by the current
SDD/final-QA role topology on one committed real cycle, while preserving every role,
quality gate, and fail-safe fallback.

**Architecture:** Keep role behavior in byte-stable prompt prefixes and append one
deterministic `Evidence Capsule v1` whose fields are selected by a shared role allowlist.
The controller expands context once on an exact `NEEDS_CONTEXT` request and switches to
visible full-context fallback on the second request or any safety/cross-cutting trigger.
This is an instruction-and-template release: no runtime service, telemetry store, parser,
provider adapter, dependency, or new model call is introduced.

**Tech Stack:** Markdown Agent Skills, Node.js `node:test`, Git-backed deterministic
fixtures, existing AWM portability/version/release gates.

**Modo de ejecución:** desatendido

> Autorización del propietario (2026-08-25): ejecutar con
> `subagent-driven-development` sin pausas hasta PR. Esta autorización sustituye
> el modo interactivo original; los gates, la escalación BLOCKED y la evidencia
> requerida permanecen obligatorios.

**Source design:** [agentic-workflow design at `092bcbb`](https://github.com/Kodria/agentic-workflow/blob/092bcbb/docs/plans/2026-08-25-r2-role-evidence-capsules-design.md)

**Trace:** [agentic-workflow#126](https://github.com/Kodria/agentic-workflow/issues/126)

---

## File Structure

| Path | Responsibility |
|---|---|
| `skills/subagent-driven-development/references/evidence-capsule-v1.md` | Single canonical field order, role allowlists, retrieval protocol, fallback triggers, privacy, and provider-parity contract. |
| `skills/subagent-driven-development/SKILL.md` | SDD controller assembly/re-dispatch/reconciliation rules; links the shared reference. |
| `skills/subagent-driven-development/implementer-prompt.md` | Byte-stable implementer contract followed by one dynamic capsule. |
| `skills/subagent-driven-development/spec-reviewer-prompt.md` | Byte-stable specification-review contract followed by one dynamic capsule. |
| `skills/subagent-driven-development/code-quality-reviewer-prompt.md` | Byte-stable quality-review contract followed by one dynamic capsule. |
| `skills/post-implementation-qa/SKILL.md` | Track A/B capsule assembly, bounded retrieval, and full-context routing; links the same shared reference. |
| `skills/post-implementation-qa/deep-review-prompt.md` | Separate stable prefixes for Track A and each Track B lens; no complete plan in normal Track B input. |
| `tests/r13-role-evidence-capsule-contract.test.mjs` | Executable field/order/allowlist/fallback/parity/gate/byte/mutation contract. |
| `.github/workflows/validate.yml` | Gives R13 access to committed history and runs R12 + R13 on PR/main validation. |
| `.github/workflows/auto-tag.yml` | Runs R12 + R13 inside the release-producing job before publishing the tag. |
| `catalog.json`, `bundles/dev/bundle.json` | Required dev-bundle minor version bump. |
| `docs/plans/2026-08-25-r2-role-evidence-capsules-plan.md` | Durable T0-T4 evidence and issue trace. |

All behavior belongs to one shared assembly contract, so the implementation is one
cohesive task. Splitting it into per-template tasks would multiply the normal
implementer/spec/code-review cycle and create competing edits to the same contract.

## Requirements Trace

| Requirement | Executable evidence |
|---|---|
| R2.1 | Prefix-before-marker and two-different-input byte-equality tests for every role. |
| R2.2 | Exact capsule marker, field order, and one-capsule-per-dispatch tests. |
| R2.3 | Table-driven allowlist tests for all six role families. |
| R2.4 | Track B forbidden-full-plan tests and prompt-source assertions. |
| R2.5 | Exact `NEEDS_CONTEXT` source/reason response and first-retrieval-history tests. |
| R2.6 | Table-driven immediate triggers plus second-request full-context test. |
| R2.7 | Existing-role/gate anchors plus R12 and full registry gates. |
| R2.8 | Same-input Codex/Claude contract-equivalence test. |
| R2.9 | Historical corpus hashes, exact T0 aggregate, and candidate `<= 430938` bytes. |
| R2.10 | Ledger-field assertions for prefix/capsule/retrieval/fallback/dispatch/usage. |
| R2.11 | Privacy/no-store/no-prompt-body-persistence assertions. |
| R2.12 | Missing-R2-metadata full-context compatibility test. |
| R2.13 | Missing/malformed evidence fail-loud/full-context tests. |
| R2.14 | T0-T4 checkpoint schema and issue-link assertions. |

## R2 Measurement Ledger

Measurement reads committed files and Git history only. It must never dispatch a
measurement-only worker or invoke a model. `initial dispatch bytes` are exact UTF-8 bytes
of the seven normal non-UI prompts in the frozen topology: implementer, specification
reviewer, code-quality reviewer, Track A, and the robustness, logic, and tests Track B
lenses. Retrieval/fallback additions remain separate; structural bytes are never described
as billed-token savings.

### Frozen real corpus and T0 assembly

| Item | Exact value |
|---|---|
| Corpus | Real merged R1 registry cycle `12b08cb133c67889b1a5484c0b791cf510302ed1..572d9e533f5498d0b3bd8033638ffea6e68ae0b3`. |
| Plan | `572d9e5:docs/plans/2026-08-25-r1-context-footprint-plan.md`, `34425` bytes, SHA-256 `bdce0b0cdfb01b9788a432b0c024d20515abbae16fe0abcb3dec7bb729780de2`. |
| Task slice | Text from `### Task 1:` to EOF in that plan, `18036` bytes. |
| Diff | `git diff --binary --no-ext-diff --unified=3 12b08cb 572d9e5`, `127390` bytes, SHA-256 `d40d55e47950039d852599425c0c517b5dbafa7e9abc4c8e7c1ffa14a0694648`. |
| Sensor fixture | Exact text `overall: pass\nnewCount: 0\n`, `26` bytes. |
| Current source surfaces | The six changed skills/templates total `66805` bytes at `e91c61b`. |
| Current initial role bytes | implementer `26317`; specification `22230`; code quality `3816`; Track A `166580`; Track B robustness `166650`; Track B logic `166344`; Track B tests `166294`. |
| Current aggregate | `718231` exact bytes. Candidate ceiling is `floor(718231 * 0.60) = 430938` bytes. |

The current aggregate is characterized by replacing the existing full-task/full-plan/full-
diff placeholders exactly as their controllers require. The candidate assembler uses the
same plan, task, diff, sensor output, paths, and SHAs, but applies the new allowlists: exact
clauses or source references replace unrelated whole artifacts, and Track B never receives
the complete plan in its initial capsule.

### Checkpoints

| Checkpoint | State | Exact structural evidence | Normal dispatches | Retrieval/fallback additions | Quality outcome | Provider/owner usage | Trace |
|---|---|---|---|---|---|---|---|
| T0 | Captured before template edits at `e91c61b` | Source surfaces `66805`; current initial aggregate `718231`; ceiling `430938`; corpus hashes above. | `0` R2 implementation dispatches at capture. | `0 / 0`; measurement-only model calls `0`. | Planning only. | Provider input/output/cache/cost `unobservable`; owner previously reported 8% weekly Codex quota after R1 work. | issue #126; design `092bcbb`. |
| T1 | Pending | Candidate prefix/capsule/aggregate bytes after first green implementation. | Pending. | Pending; report separately. | Pending. | `unobservable` unless provider emits it. | Add issue #126 comment. |
| T2 | Pending | Reviewed candidate bytes after corrections. | Pending. | Pending; include re-dispatches. | Zero open blocker/important required. | `unobservable` unless supplied. | Add issue #126 comment. |
| T3 | Pending | Final release candidate, commit, PR, exact reduction. | Pending. | Pending. | All gates green; zero escaped blocker/important, rollback, or human correction attributable to omitted context. | Owner quota only if supplied; never convert it to tokens/currency. | Add issue #126 comment. |
| T4 | Pending | First normal later release cycle with installed R2. | Observe normal topology only. | Observe natural retrieval/fallback only. | Same zero-margin quality rule. | Owner-reported quota if supplied. | Add issue #126 comment; no synthetic run. |

## Canonical Capsule Contract

The shared reference must define this exact marker and field order. Values may be single
lines, lists, or fenced evidence, but no field may be reordered, omitted, silently coerced,
or invented.

```text
## Evidence Capsule v1
role: <declared role or lens>
scope: <task ID or branch-level QA scope>
requirements: <exact clauses with stable IDs, or n/a>
surfaces: <relevant files/components and declared dependencies>
sources: <authoritative repository paths/commits/commands>
evidence: <role-allowed report, diff/hunks, tests, sensors, or design artifacts>
retrieval history: <none, or ordered source + reason entries>
fallback: <selective, or full-context: exact-trigger>
```

Allowed `full-context` trigger values are:

```text
ambiguous
security-or-robustness
root-configuration
public-contract
uncertain-cross-cutting-impact
second-context-request
legacy-metadata
malformed-or-missing-evidence
```

The first insufficient-context response is exactly:

```text
status: NEEDS_CONTEXT
missing-source: <authoritative path, commit, command, or artifact>
reason: <why the role cannot reach its verdict>
```

The controller appends that source and reason to `retrieval history` and re-dispatches the
same role. A second request is not another selective expansion: it sets
`fallback: full-context: second-context-request`. Immediate R2.6 triggers take the full-
context path before first dispatch. Missing legacy metadata or malformed/unsourced required
fields also use their named safe fallback; no required evidence is truncated to meet a byte
budget.

### Task 1: Implement and certify the R2 dispatch contract

_Requirements: R2.1, R2.2, R2.3, R2.4, R2.5, R2.6, R2.7, R2.8, R2.9, R2.10, R2.11, R2.12, R2.13, R2.14_

**Files:**
- Create: `skills/subagent-driven-development/references/evidence-capsule-v1.md`
- Create: `tests/r13-role-evidence-capsule-contract.test.mjs`
- Modify: `skills/subagent-driven-development/SKILL.md`
- Modify: `skills/subagent-driven-development/implementer-prompt.md`
- Modify: `skills/subagent-driven-development/spec-reviewer-prompt.md`
- Modify: `skills/subagent-driven-development/code-quality-reviewer-prompt.md`
- Modify: `skills/post-implementation-qa/SKILL.md`
- Modify: `skills/post-implementation-qa/deep-review-prompt.md`
- Modify: `.github/workflows/validate.yml`
- Modify: `.github/workflows/auto-tag.yml`
- Modify: `catalog.json`
- Modify: `bundles/dev/bundle.json`
- Modify: `docs/plans/2026-08-25-r2-role-evidence-capsules-plan.md`

**Skills:** test-driven-development, verification-before-completion

- [ ] **Step 1: Reconfirm the frozen baseline before editing a prompt**

Run:

```bash
git rev-parse HEAD
git status --short
wc -c \
  skills/subagent-driven-development/SKILL.md \
  skills/subagent-driven-development/implementer-prompt.md \
  skills/subagent-driven-development/spec-reviewer-prompt.md \
  skills/subagent-driven-development/code-quality-reviewer-prompt.md \
  skills/post-implementation-qa/SKILL.md \
  skills/post-implementation-qa/deep-review-prompt.md
git show 572d9e5:docs/plans/2026-08-25-r1-context-footprint-plan.md | sha256sum
git diff --binary --no-ext-diff --unified=3 12b08cb 572d9e5 | sha256sum
```

Expected: HEAD starts from `e91c61b`; only this plan may differ; total source bytes are
`66805`; hashes equal the ledger. If history or a hash differs, stop and recapture T0 in
this plan instead of comparing different corpora.

- [ ] **Step 2: Add the failing R13 contract and release-gate wiring**

Create `tests/r13-role-evidence-capsule-contract.test.mjs` with `node:test`. Use
`execFileSync('git', args, { encoding: 'utf8', maxBuffer: 5_000_000 })` (never shell
interpolation), `Buffer.byteLength`, and these top-level constants:

```js
const R1_BASE = '12b08cb133c67889b1a5484c0b791cf510302ed1';
const R1_HEAD = '572d9e533f5498d0b3bd8033638ffea6e68ae0b3';
const CURRENT_INITIAL_BYTES = Object.freeze({
  implementer: 26317,
  specification: 22230,
  codeQuality: 3816,
  trackA: 166580,
  robustness: 166650,
  logic: 166344,
  tests: 166294,
});
const CURRENT_AGGREGATE_BYTES = 718231;
const CANDIDATE_MAX_BYTES = 430938;
const CAPSULE_MARKER = '## Evidence Capsule v1';
const CAPSULE_FIELDS = [
  'role:', 'scope:', 'requirements:', 'surfaces:', 'sources:',
  'evidence:', 'retrieval history:', 'fallback:',
];
```

Implement pure helpers `read`, `git`, `sha256`, `extractPrefix`,
`validateCapsule`, `splitDiffByFile`, `assembleRole`, and `validateContract`.
`validateContract` must return actionable error strings so the same function can prove the
gate under mutation. Cover these cases:

1. Reconstruct the frozen plan/diff, verify both hashes/byte counts, assert the seven T0
   values and sum.
2. Assemble each candidate role twice with different scope/path/evidence values; assert
   the bytes before `CAPSULE_MARKER` are identical and contain no dynamic fixture value.
3. Assert exactly one marker and all eight fields in order for implementer,
   specification, code quality, Track A, Track B robustness/logic/tests, and conditional
   design fidelity.
4. Apply the canonical role allowlist. Reject unrelated plan tasks for implementer/spec,
   complete plan and chain-of-thought for code quality, process narration for Track A, and
   complete plan/unrelated requirement prose for every Track B lens.
5. Assert normal Track B capsules do not contain the frozen plan body or plan hash.
6. Exercise all eight full-context triggers, first retrieval, second retrieval, missing
   legacy metadata, and malformed/missing required fields.
7. Feed identical evidence through provider labels `codex` and `claude-code`; after
   removing the non-contract label, assert byte-identical capsule/fallback output.
8. Assert all current implementation/spec/code-quality/Track A/Track B/sensor/TDD/docs/
   retro/completion anchors remain reachable from the two skills and templates.
9. Assemble the candidate seven-role corpus, print per-role prefix, capsule, retrieval,
   fallback, dispatch count, and provider usage (`unobservable`) fields, and require
   aggregate bytes `<= CANDIDATE_MAX_BYTES`. Initial fixtures set retrieval/fallback
   additions to zero. Do not call a model or call the result token/cost savings.
10. Assert this plan contains T0-T4 rows and issue #126.

Add mutation subtests that each pass altered source to `validateContract` and require one
specific failure message for: marker moved before the stable contract, reordered field,
removed role, complete plan injected into Track B, removed second-request fallback,
provider divergence, removed sensor gate, and candidate aggregate above the ceiling.

In `.github/workflows/validate.yml`, set the checkout step to `fetch-depth: 0` and
`fetch-tags: true`, then run both:

```yaml
- run: node tests/r12-context-footprint-contract.test.mjs
- run: node tests/r13-role-evidence-capsule-contract.test.mjs
```

Add the same two commands inside `.github/workflows/auto-tag.yml`'s `Verify registry before
tagging` block. This keeps R12 and R13 inside the job that publishes the release.

Run the new test before creating the reference or editing templates:

```bash
node --test tests/r13-role-evidence-capsule-contract.test.mjs
```

Expected: FAIL with missing shared reference/marker/contract errors. Record the exact red
result in the T1 notes; do not weaken assertions to make legacy prompts pass.

- [ ] **Step 3: Create the one canonical Evidence Capsule v1 reference**

Create `skills/subagent-driven-development/references/evidence-capsule-v1.md` with:

- the exact marker, eight-field order, and trigger enum in this plan;
- the approved role allowlist table from the source design;
- forbidden-by-default fields for each role;
- deterministic ordering (`requirements`, `surfaces`, `sources`, and `evidence` preserve
  authoritative plan/diff order; retrieval history preserves request order);
- first `NEEDS_CONTEXT` response and bounded second-request fallback;
- immediate fallback for every R2.6 trigger;
- legacy/malformed fail-loud fallback;
- provider-neutral behavior for Codex and Claude Code;
- ephemeral handling and an explicit prohibition on telemetry stores, persisted prompt or
  source bodies, secrets, credentials, and unrestricted model responses;
- a statement that no byte cap may truncate a required clause or finding;
- measurement vocabulary separating prefix, capsule, retrieval, fallback, dispatches,
  provider usage, and owner-reported quota.

This file is the sole normative capsule definition. Consumers link to it; they must not
copy its field/allowlist/fallback tables into another skill.

- [ ] **Step 4: Convert SDD assembly and its three role templates**

In `skills/subagent-driven-development/SKILL.md`:

- bump `version` from `1.9.0` to `1.10.0`;
- require reading `references/evidence-capsule-v1.md` before constructing any implementer
  or reviewer dispatch;
- replace "extract all tasks with full text" behavior with one cohesive task/slice plus
  exact applicable clauses, declared dependencies, skills/design artifacts, surfaces,
  sources, and verification evidence;
- keep the existing implementer -> specification -> code-quality order, all review loops,
  sensor/ledger/design/reconciliation gates, final reviewer, QA/docs/retro/completion flow,
  and no-skipped-role rule;
- define first selective re-dispatch and second/full-context behavior exactly as the shared
  reference states;
- require a visible fallback trigger and per-checkpoint dispatch/retrieval/fallback counts;
- preserve the legacy safe path when capsule metadata is absent;
- never persist an assembled capsule or unrestricted worker response.

Rewrite each prompt template so the reusable role contract precedes the exact
`## Evidence Capsule v1` marker and every task/path/SHA/report/diff/test/sensor/design value
appears after it. Preserve the existing sensor, anti-bias, report, ledger, escalation,
security/robustness, and evidence-anchor behavior. The normal report stays compact; the
universal three-line `NEEDS_CONTEXT` response is an allowed alternative when evidence is
insufficient. Specifically:

- implementer receives only the cohesive slice and its exact clauses/dependencies;
- specification reviewer receives those clauses, implementer report, and task evidence;
- code-quality reviewer receives task diff/source, tests, sensors, and public/robustness
  constraints, but never the full plan or implementer chain-of-thought.

Do not add a runtime serializer or provider branch. Markdown is the contract.

- [ ] **Step 5: Convert Track A/B QA assembly without making Track B plan-aware**

In `skills/post-implementation-qa/SKILL.md`:

- bump `version` from `1.6.0` to `1.7.0`;
- require the exact shared reference path
  `../subagent-driven-development/references/evidence-capsule-v1.md` before dispatch;
- construct Track A from all exact requirement IDs/clauses, branch surfaces, authoritative
  diff source/hunks, tests, and sensors, without controller narration;
- construct each Track B lens from lens-relevant surfaces, source/hunks, tests/sensors, and
  design artifacts when applicable; never include the complete plan in normal Track B;
- retain one Track A role and every applicable isolated Track B lens, existing tier rules,
  deterministic sensor precedence, dedup, ledger gate, fix loop, design-fidelity condition,
  completion marker, docs handoff, and all robustness/security obligations;
- apply the same first retrieval / second fallback / immediate-trigger rules as SDD.

Restructure `deep-review-prompt.md` into one stable contract block per Track A/B role plus
its capsule marker. Keep common anti-bias and compact JSON/ledger contracts in the stable
prefix (deduplicated by reference where possible), and put only dynamic role evidence after
the marker. Track B templates must not contain a full-plan placeholder. A first-context
request returns the universal three-line `NEEDS_CONTEXT` response instead of findings JSON;
normal verdicts keep the existing compact JSON shape.

- [ ] **Step 6: Bump bundle metadata and make the candidate green**

Apply the additive minor bump in both duplicated locations:

```text
catalog.json: dev 3.6.3 -> 3.7.0
bundles/dev/bundle.json: 3.6.3 -> 3.7.0
```

Run focused gates:

```bash
node --test tests/r13-role-evidence-capsule-contract.test.mjs
node --test tests/r12-context-footprint-contract.test.mjs tests/r13-role-evidence-capsule-contract.test.mjs
node scripts/validate-portability.mjs
node tests/validate-portability.test.mjs
./scripts/check-skill-version-bumps.sh origin/main
```

Expected: all pass; R13 prints exact per-role candidate bytes, an aggregate no greater than
`430938`, reduction at least 40%, retrieval/fallback additions `0/0`, seven dispatches, and
provider usage `unobservable`.

Update T1 from observed output and add an issue #126 checkpoint comment. This is structural
evidence only; do not claim billed-token, cost, or quota savings.

- [ ] **Step 7: Prove the new gate fails under mutation**

The in-test mutation subtests are mandatory, but also run one disposable file mutation
against the actual command. Temporarily change one Track B capsule fixture to include the
complete frozen plan, run:

```bash
node --test tests/r13-role-evidence-capsule-contract.test.mjs
```

Expected: non-zero with an actionable `Track B initial capsule contains complete plan`
message. Restore the file with `apply_patch`, rerun, and require green. Do not use
`git checkout --` or `git reset` to restore it.

- [ ] **Step 8: Run full verification and record T2/T3 without extra workers**

After the normal specification and code-quality reviewers close their findings, update T2
from their existing reports. Do not dispatch a measurement reviewer. Then run the exact
release-gate commands from `.github/workflows/validate.yml`, followed by:

```bash
git diff --check
awm preflight --cwd . --json
awm context-budget --cwd . --json
```

If this repository has no `.awm/sensors.json`, record `not_certified` honestly; do not call
it a pass. If it exists at execution time, also run `awm sensors run` and require
`overall: pass`.

Complete normal final code review and `post-implementation-qa`, resolve every finding, and
update T3 with exact prefix/capsule/aggregate bytes, all normal dispatches, retrievals,
fallbacks, corrections, quality result, candidate commit, and PR. Add the matching issue
#126 comment. Leave T4 pending for the next normal installed-R2 release cycle; do not create
a synthetic development.

- [ ] **Step 9: Commit and prepare the release PR**

Require a clean worktree after committing. Use a conventional feature title so protected
auto-tagging advances registry `v3.7.0` to `v3.8.0` after merge:

```bash
git add \
  .github/workflows/validate.yml \
  .github/workflows/auto-tag.yml \
  skills/subagent-driven-development \
  skills/post-implementation-qa \
  tests/r13-role-evidence-capsule-contract.test.mjs \
  catalog.json \
  bundles/dev/bundle.json \
  docs/plans/2026-08-25-r2-role-evidence-capsules-plan.md
git commit -m "feat: add R2 role evidence capsules"
git status --short
```

Expected final PR title: `feat: add R2 role evidence capsules`. The auto-tag workflow, not
the implementation worker, publishes `v3.8.0` after merge and only after its embedded R12,
R13, portability, version, and registry gates pass.

## Completion Conditions

- [ ] Every R2.1-R2.14 row has green executable evidence.
- [ ] Candidate initial aggregate is at least 40% below `718231` on the frozen corpus.
- [ ] Prefix/capsule/retrieval/fallback/dispatch/usage values are reported separately.
- [ ] No complete plan exists in a normal Track B initial capsule.
- [ ] All existing roles and quality/security/robustness gates remain mandatory.
- [ ] Mutation proof fails red and restored sources pass green.
- [ ] Both changed skill versions and both dev-bundle metadata copies are bumped.
- [ ] R12 and R13 run inside the release-producing auto-tag job.
- [ ] T1-T3 and issue #126 carry exact commit/PR/quality evidence; T4 remains a real later cycle.
- [ ] No telemetry store, provider adapter, persisted capsule/source body, or synthetic model run exists.
