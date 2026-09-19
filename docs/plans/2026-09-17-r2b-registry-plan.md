# R2-B registry routing implementation plan
<!-- awm-qa-complete: 2026-09-18 -->

> **For agentic workers:** REQUIRED SUB-SKILL: Use `subagent-driven-development`
> or `executing-plans` to implement one admitted serial compact slice at a time.

**Goal:** Teach the portable harness to author v2 and dispatch CLI-resolved native roles while preserving R2-A control.
**Architecture:** One shared routing-consumer reference; CLI owns parsing, policy, resolution and custody.
**Tech Stack:** Markdown, Node contract/mutation tests, compatible paired CLI binary.
**Modo de ejecución:** interactivo
**Issue:** https://github.com/Kodria/agentic-workflow/issues/126
**Base:** origin/main 2915eb9, registry v4.1.0.
**Status:** complete implementation plan candidate for owner review; no execution by this document alone.
**CLI dependency:** CLI plan C1-C4 and compatible published release before B3 public closure.
**Planning amendment:** Pending Claude R2-A trial does not block planning. Real native routing on Claude remains UNTESTED until separately executed.

<!-- AWM:COMPACT-SLICES:START v1 -->
{
  "schema": "compact-slices/v1",
  "planId": "issue-126-r2b-registry",
  "requirements": [
    "R2B-B1",
    "R2B-B2",
    "R2B-B3",
    "R2B-B4",
    "R2B-B5",
    "R2B-B6",
    "R2B-B7"
  ],
  "sources": [
    {
      "id": "SRC-PROTOCOL",
      "path": "docs/plans/2026-09-17-r2b-routing-contract.md",
      "locator": "## Public commands to implement",
      "fact": "Closed CLI protocol is the resolution authority; native platforms dispatch with explicit current capabilities."
    },
    {
      "id": "SRC-COMPACT",
      "path": "skills/writing-plans/references/compact-slices-v1.md",
      "locator": "## Manifest boundary",
      "fact": "Five canonical sections and exact serial manifest remain stable; bootstrap plan stays v1."
    },
    {
      "id": "SRC-CAPSULE",
      "path": "skills/subagent-driven-development/references/evidence-capsule-v1.md",
      "locator": "## Retrieval and Full-context Fallback",
      "fact": "Native bounded retrieval retains full relevant context when risk requires; no provider fork."
    },
    {
      "id": "SRC-CYCLE",
      "path": "skills/subagent-driven-development/references/review-cycle-v1.md",
      "locator": "## Coherent fix groups",
      "fact": "R2-A groups confirmed defects and runs applicable current gates once per corrected candidate."
    },
    {
      "id": "SRC-SDD",
      "path": "skills/subagent-driven-development/SKILL.md",
      "locator": "## Compact admission",
      "fact": "Current consumers require admitted plan identity and distinct reviewer roles; routing cannot weaken gates."
    },
    {
      "id": "SRC-R8",
      "path": "skills/setup-sensors/references/registry-closure-policy-r8.md",
      "locator": "# Registry Sensor Closure Policy",
      "fact": "All-disabled local registry sensors stay not_certified; versioned validate/auto-tag certification alone provides R8 closure."
    },
    {
      "id": "SRC-INSTALLED",
      "path": "tests/installed-admission-acceptance.mjs",
      "locator": "export async function runInstalledAdmissionAcceptance",
      "fact": "Real installed binary/transport acceptance uses isolated operator cache and distinguishes local fixture from published proof."
    }
  ],
  "commands": [
    {
      "id": "CMD-R2B",
      "program": "npm",
      "args": [
        "run",
        "test:r2b"
      ],
      "covers": [
        "R2B-B1",
        "R2B-B2",
        "R2B-B3",
        "R2B-B4",
        "R2B-B5",
        "R2B-B6",
        "R2B-B7"
      ]
    },
    {
      "id": "CMD-COMPACT",
      "program": "npm",
      "args": [
        "run",
        "test:compact-only"
      ],
      "covers": [
        "R2B-B1",
        "R2B-B2"
      ]
    },
    {
      "id": "CMD-CAPSULE",
      "program": "npm",
      "args": [
        "run",
        "test:capsule"
      ],
      "covers": [
        "R2B-B3",
        "R2B-B4",
        "R2B-B5"
      ]
    },
    {
      "id": "CMD-R2A",
      "program": "npm",
      "args": [
        "run",
        "test:r2a"
      ],
      "covers": [
        "R2B-B3",
        "R2B-B4",
        "R2B-B5"
      ]
    },
    {
      "id": "CMD-INSTALLED",
      "program": "npm",
      "args": [
        "run",
        "test:r2b-cli"
      ],
      "covers": [
        "R2B-B6",
        "R2B-B7"
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
        "R2B-B6",
        "R2B-B7"
      ]
    },
    {
      "id": "CMD-PORTABLE",
      "program": "npm",
      "args": [
        "run",
        "test:portability"
      ],
      "covers": [
        "R2B-B1",
        "R2B-B2",
        "R2B-B3",
        "R2B-B4",
        "R2B-B5",
        "R2B-B6",
        "R2B-B7"
      ]
    }
  ],
  "slices": [
    {
      "id": "B1",
      "title": "Compact v2 producer and consumer contract",
      "requirements": [
        "R2B-B1",
        "R2B-B2"
      ],
      "dependsOn": [],
      "sectionAnchor": "slice-b1",
      "sources": [
        "SRC-PROTOCOL",
        "SRC-COMPACT",
        "SRC-CAPSULE"
      ],
      "redCommands": [
        "CMD-R2B"
      ],
      "greenCommands": [
        "CMD-R2B",
        "CMD-COMPACT"
      ],
      "reviewEvidence": [
        "specification",
        "code-quality"
      ],
      "risk": "full-context",
      "fallback": [
        "public-contract"
      ]
    },
    {
      "id": "B2",
      "title": "Native dispatch and recovery consumers",
      "requirements": [
        "R2B-B3",
        "R2B-B4",
        "R2B-B5"
      ],
      "dependsOn": [
        "B1"
      ],
      "sectionAnchor": "slice-b2",
      "sources": [
        "SRC-PROTOCOL",
        "SRC-CYCLE",
        "SRC-SDD"
      ],
      "redCommands": [
        "CMD-R2B"
      ],
      "greenCommands": [
        "CMD-R2B",
        "CMD-CAPSULE",
        "CMD-R2A"
      ],
      "reviewEvidence": [
        "specification",
        "code-quality"
      ],
      "risk": "full-context",
      "fallback": [
        "security",
        "durable-state",
        "public-contract"
      ]
    },
    {
      "id": "B3",
      "title": "Compatible release and installed acceptance",
      "requirements": [
        "R2B-B6",
        "R2B-B7"
      ],
      "dependsOn": [
        "B2"
      ],
      "sectionAnchor": "slice-b3",
      "sources": [
        "SRC-PROTOCOL",
        "SRC-R8",
        "SRC-INSTALLED"
      ],
      "redCommands": [
        "CMD-INSTALLED"
      ],
      "greenCommands": [
        "CMD-INSTALLED",
        "CMD-RELEASE",
        "CMD-PORTABLE"
      ],
      "reviewEvidence": [
        "specification",
        "code-quality"
      ],
      "risk": "full-context",
      "fallback": [
        "publication",
        "runtime-acceptance"
      ]
    }
  ],
  "closureCommands": [
    "CMD-R2B",
    "CMD-COMPACT",
    "CMD-CAPSULE",
    "CMD-R2A",
    "CMD-INSTALLED",
    "CMD-RELEASE",
    "CMD-PORTABLE"
  ]
}
<!-- AWM:COMPACT-SLICES:END v1 -->

## Requirements and canonical coverage

- **R2B-B1:** Producer writes exactly one semantic implementerProfile per v2
  slice, no concrete model/vendor, with canonical IDs and serial ownership.
  Parent RF-4.1; owner B1.
- **R2B-B2:** Producer verifies actual CLI v2 contract and effective policy
  readiness; v1 compatibility remains available with visible unavailable
  routing. No unmarked/legacy execution. Parent RF-4.5/RNF-T.4; owner B1.
- **R2B-B3:** Each routed native dispatch consumes current CLI envelope and
  durable applied reservation ack before acting, then records actual native
  agent/selection evidence. Parent RF-4.2/RF-6.2/RNF-T.7; owner B2.
- **R2B-B4:** Reviews/architecture/QA/controller/docs/retro/finishing use full
  role independently of implementer; retain admission/capsules/TDD/final
  review/QA/docs/retro and R2-A grouping/reuse. Parent RF-4.3/RNF-T.6; owner B2.
- **R2B-B5:** All six targets consume one protocol; unsupported/unverified
  capabilities visibly block/degrade under approved policy. Escalations and
  attempts consume existing logical lineage; never retry environment/currentness
  or missing administrative receipts as implementation. Parent RF-4.4/RF-4.5/
  RNF-T.1/RNF-T.5/RNF-T.7; owner B2.
- **R2B-B6:** Real compiled/installed paired CLI validates v1/v2, floor,
  resolution/zero-dispatch negatives and registry consumer protocol; required
  gates execute inside both validate and the tag-producing job.
  Parent RNF-T.2/RNF-T.3/RNF-T.6; owner B3.
- **R2B-B7:** Release follows compatible published CLI then registry; bounded
  baton/report and native acceptance statuses remain honest. No user policy
  approval/replacement or account snapshot copied into versioned content.
  Parent RF-5.2/RF-6.1/RF-6.2/RNF-T.3; owner B3.

B1 owns producer/schema consumption; B2 owns native controller behavior;
B3 owns delivery/installed acceptance. Each is one cohesive boundary.
Canonical overall requirements are uniquely owned in the CLI plan; these
consumer subcontracts specify the registry's contribution without a second owner.

## Shared facts and exact test scripts

Read SRC-PROTOCOL completely. New APIs are proposed, not present in CLI 9.8.0.
Consumer protocol parity is tested against actual
`model-policy contract --json` from the paired binary.
Never infer model capability from presence of a renderer.

Create `tests/r2b-routing-consumer-contract.test.mjs` using node:test,
node:assert/strict and bounded section extraction. Each assertion targets the
operative condition plus consequence in the specific section, then mutates
both independently and requires failure. Also mutate every referenced consumer
and both CI invocation sites; a shared keyword elsewhere cannot satisfy it.
Create `tests/r2b-routing-cli-acceptance.mjs` for real binary acceptance.
Add exactly these package scripts:
```json
{
  "test:r2b": "node --test tests/r2b-routing-consumer-contract.test.mjs",
  "test:r2b-cli": "node --test tests/r2b-routing-cli-acceptance.mjs"
}
```
Tests reference AWM_R2B_CLI_BIN only as an explicitly supplied compatible
compiled/installed executable, never a fixed sibling/machine path. Missing
binary/floor/contract fails with actionable provenance, not a skip/PASS.
Test-created fixtures use temporary HOME/AWM_HOME/operator cache outside the
consumer project and AWM_NO_UPDATE_CHECK=1. No global installation mutation.

<a id="slice-b1"></a>
### Slice B1: Compact v2 producer and consumer contract
#### Surfaces
Own R2B-B1/R2B-B2 in
`skills/writing-plans/SKILL.md`,
new `skills/writing-plans/references/compact-slices-v2.md`,
`skills/writing-plans/references/compact-admission-v1.md`,
new `skills/subagent-driven-development/references/model-routing-v1.md`,
new `tests/fixtures/compact-slices-v2/reference-example.md`,
`tests/r2b-routing-consumer-contract.test.mjs`, `package.json`.
Retain v1 source bytes except explicitly needed compatibility pointers.
V2 is separate schema, not a reinterpretation of v1.

#### Implementation
- [ ] Write scoped producer/consumer contract assertions; CMD-R2B RED for
missing profile, parser fork and unsupported CLI handoff.
- [ ] Add v2 reference with exact matching START/END v2 markers and same
five canonical sections. V2 manifest/slice differs only in schema and one
implementerProfile. Include actual complete fixture with three serial slices,
one each profile, unique ownership and existing npm test command.
- [ ] Replace unconditional producer-v1 instruction with this exact rule:
```markdown
Query the installed CLI routing contract and policy status before authoring
routing-enabled compact v2. Emit one mechanical, integration or judgment
implementerProfile per slice, never a concrete model or vendor. Mechanical
requires closed local behavior and excludes security/admission/root recovery;
integration requires known interfaces; judgment owns public/cross-cutting
policy and custody. Missing design decisions remain planning-required.
If v2 or approved policy readiness is unavailable, author valid compact v1,
report routing unavailable, and never claim profile savings.
```
For current R2-B bootstrap keep v1 even after feature support becomes available.
- [ ] Add sole model-routing-v1 consumer reference containing exact public
invocations, required runtime/account input, zero-dispatch rules, reservation
applied-ack gate, native observation, recovery/escalation and report from
SRC-PROTOCOL. It consumes CLI outputs; no prose JSON parser/digest/resolver.
- [ ] Align admission reference with both supported compact schemas; retain
strict currentness/sensor/journal/custody order and unsupported blocks.
- [ ] Run CMD-R2B and CMD-COMPACT GREEN. B3 owns all final metadata/version
bumps; this slice records exact edited skill names for that release boundary.

#### Edge cases
Mutations must remove each profile rule, condition or consequence and fail.
Missing/two/concrete/unknown profile must be rejected by actual CLI fixture
acceptance in B3, not a regex claim. V1 remains exactly its own strict keys.
Unapproved/stale policy cannot be fixed by authoring concrete models into plans.
A public configuration/custody change is judgment even if small.
No missing interface or behavior is delegated to implementer discovery.

#### Evidence
SRC-PROTOCOL, SRC-COMPACT, SRC-CAPSULE; CMD-R2B and CMD-COMPACT.
Distinct current specification/quality reviewers inspect operative clauses and
mutation failures, files, sensors/R8 and current plan identity.
Structural tests are consumer rule evidence, never native dispatch acceptance.

#### Fallback
New public parser/producer requirement expands relevant context and retains
v1 bootstrap execution. If necessary contract changes emerge, amend both
explicit implementation plans and revalidate; no unmarked migration workaround.

<a id="slice-b2"></a>
### Slice B2: Native dispatch and recovery consumers
#### Surfaces
Own R2B-B3/R2B-B4/R2B-B5 in sole model-routing-v1 reference and
`skills/subagent-driven-development/{SKILL.md,implementer-prompt.md,
spec-reviewer-prompt.md,code-quality-reviewer-prompt.md}`,
`skills/executing-plans/SKILL.md`,
`skills/development-process/SKILL.md`,
`skills/post-implementation-qa/{SKILL.md,deep-review-prompt.md}`,
`skills/verification-before-completion/SKILL.md`,
`skills/post-implementation-docs/SKILL.md`,
`skills/harness-retro/SKILL.md`,
`skills/finishing-a-development-branch/SKILL.md`,
and scoped mutation tests in the B1 test file.
All these are consumers; code/model decisions remain CLI authority.

#### Implementation
- [ ] Add one test per consumer requiring exact shared reference and its role
obligation; mutation of one consumer must fail independently. CMD-R2B RED.
- [ ] Replace v1-only execution sentence with supported admitted v1/v2
serial execution. Both preserve R2-A and Evidence Capsule v1.
- [ ] Add this exact operative dispatch rule to the sole reference:
```markdown
For a routed obligation, request a current CLI resolution for the native
runtime, role and exact slice when local. A blocked result means zero dispatch.
Freeze its envelope, reserve the logical lineage through the current
generation, and wait for the supervisor's applied ack before invoking the
native mechanism with the resolved model/effort. Persist bounded native
agent identity and observed selection afterward. A mismatch blocks the
affected obligation; an unknown dispatch outcome requires custody
reconciliation before any redispatch. Emission receipts are not applied acks.
```
Inputs are exact CLI protocol values. Native overrides absent may only follow
resolved approved degradation; no mapping in a prompt is proof of native control.
- [ ] Stable role prompts carry role plus immutable envelope identity, not
independent model selection logic. Never fork by vendor. Runtime kind/account
values come from current native host identity, not portable plans.
- [ ] All full roles call resolve with their own full role. Inline docs/retro/
finishing performed by the current controller use the already registered full
controller selection and a distinct role receipt; never fabricate a child
dispatch count. If the active host cannot attest that full selection, its
routed obligation blocks. QA preserves distinct applicable lens obligations.
- [ ] Escalation is requested from current lineage/policy, consumes the next
bounded implementation attempt and is visible. Missing context returns
planning-required; environment/currentness/persistence/admin failure repeats
only the affected gate without a new implementation dispatch.
- [ ] Retain complete ledger-entry collection output and administrative repair
rules from R2-A. Reconcile frozen reports before coherent group correction;
do not restore old per-finding test/review loops or merge distinct defects by line.
- [ ] Run CMD-R2B, CMD-CAPSULE and CMD-R2A GREEN; record exact touched metadata.

#### Edge cases
Mutation assertions cover dispatch-before-ack, implicit flagship escalation,
mismatch accepted as PASS, effort silently dropped, generation/plan resetting
budget, model names in plans, unverified capability treated supported, missing
ledger requiring new review, skipped final QA/docs/retro, and one consumer
omitting the shared reference. All six targets are explicit in reference:
documented native control is not native acceptance; unsupported targets block
or follow only a resolved approved degradation.
V1 not-required resolution retains existing full-quality native contract and
records no routing savings. A changed envelope does not cancel/adopt active
native work automatically.

#### Evidence
SRC-PROTOCOL, SRC-CYCLE, SRC-SDD; CMD-R2B/CAPSULE/R2A.
Current independent spec/quality verdicts reconcile consumer clauses with
actual compatible CLI protocol. Final journey review traces producer ->
admission -> reserve ack -> native dispatch -> observation -> verdict/gate ->
QA/docs/retro/finishing; per-slice green is not this global proof.

#### Fallback
Unknown model/native identity or unavailable override blocks its routed
obligation. Do not write vendor-specific configuration by guess or create
another agent runtime. Full relevant context retains compact roles and R2-A.
Native Claude trial pending is reported UNTESTED; it does not force extra
paid model probes during implementation.

<a id="slice-b3"></a>
### Slice B3: Compatible release and installed acceptance
#### Surfaces
Own R2B-B6/R2B-B7 in
`tests/r2b-routing-cli-acceptance.mjs`,
`tests/fixtures/compact-slices-v2/reference-example.md`,
`.github/workflows/{validate,auto-tag}.yml`,
`scripts/check-skill-version-bumps.sh` invocation sites,
`awm-registry.json`, all edited SKILL.md frontmatter,
`bundles/dev/bundle.json`, `catalog.json`,
`tests/{r15-compact-slices-contract,r16-compact-only-contract,
bundle-skill-reference-contract,r2a-review-cycle-contract}.test.mjs`
where exact expected versions are pinned, and
`docs/acceptance/r2b-native-routing.md`.
Delivery metadata and paired binary acceptance form one release boundary.

#### Implementation
- [ ] Write actual paired-binary protocol/floor/v1/v2/zero-dispatch assertions;
CMD-INSTALLED RED against unmodified published CLI 9.8.0.
- [ ] Use explicit candidate CLI executable with provenance (version/source
SHA/command/protocolDigest) to validate v1 and three-profile v2 fixture.
Exercise actual approve/status/resolve with isolated content/snapshots,
native-only receipts remaining fixtures. Verify old CLI reports v2 unsupported
and actual compatibility diagnostic for the new registry floor.
- [ ] Add CMD-R2B and CMD-INSTALLED to validate.yml AND inside the tag-producing
job before tag push. Compatible candidate CLI source can prove prepublication
only; real published CLI/tag/package must be observed before public registry
floor and release closure. No skip-on-missing-binary path.
- [ ] Bump additive feature metadata: dev bundle/catalog 4.1.0 -> 4.2.0;
product bundle/catalog 1.3.1 -> 1.4.0;
writing-plans 2.0.0 -> 2.1.0; SDD 2.1.0 -> 2.2.0;
executing-plans 2.0.1 -> 2.1.0; development-process 2.0.0 -> 2.1.0;
QA 2.1.0 -> 2.2.0; verification 1.3.3 -> 1.4.0;
docs 2.0.0 -> 2.1.0; retro 3.0.1 -> 3.1.0;
finishing 2.0.0 -> 2.1.0;
architecture-advisor 1.0.2 -> 1.1.0; architecture-assessment 1.1.1 -> 1.2.0;
architecture-extraction 1.0.2 -> 1.1.0.
Update each pinned test expectation in the same group.
Amendment 2026-09-18 (visible deviation): the original list omitted the three
architecture consumers and the product bundle. B2 added `## Routed custody` to
architecture-advisor/assessment/extraction, and the product bundle carries
architecture-assessment and architecture-extraction, so
`./scripts/check-skill-version-bumps.sh origin/main` requires all four. They are
additive capability, bumped minor exactly like the other ten in this batch. The
authoritative set is every entry that gate reports, never this prose list alone.
- [ ] Set minCliVersion to the observed first published release supporting
routing-protocol/v1 and v2, numeric exact version from actual CLI output;
expected semantic feature is 9.9.0, but publisher output is authoritative.
Installer/updater never creates/approves/replaces model-policy.
- [ ] Run all declared closure commands once on the final candidate plus
`./scripts/check-skill-version-bumps.sh origin/main`.
Apply R8 with actual candidate SHA validate/tag certification; preserve
local not_certified, never label it PASS or unattended custody.
- [ ] Complete user documentation, retro, journey review and global QA with
current evidence and no unnecessary loop. Create PR against main after
authorized execution, preserve published CLI-before-registry order.
- [ ] Acceptance doc distinguishes structural/compiled/installed/public-tag/
native-runtime proof. It includes explicit policy approval command,
native capability attestation, small mechanical+integration run with full
review/QA, zero-dispatch negatives and rollback. Claude actual routing remains
UNTESTED until its native run. Track material artifacts from issue #126 only
under authorized publication.

#### Edge cases
No global HOME/cache inside fixture project. Disable update check only in
fixture environment (existing supported switch). Old CLI negative uses the
unmodified real binary, never mocks absence. Currentness transport failure
blocks and diagnoses that component without restarting QA. Exact published
tag SHA must match candidate evidence; local fixture tag is not public proof.
Consumer protocol mismatch/unsupported schema/invalid floor rejects before
dispatch. Removing either CI invocation must fail scoped mutation test.
No credentials, prompts/source bodies or approval state in registry/candidate docs.

#### Evidence
SRC-PROTOCOL, SRC-R8, SRC-INSTALLED; all closure commands plus version gate.
Require actual CLI public release provenance before registry public release.
Track A covers R2B-B1..B7; separate robustness/security, logic and tests lenses
use relevant capsules; no UI/design-fidelity lens is applicable.
Every admitted phase retains exact plan identity and complete ledger receipts.
Actual native acceptance statuses are separate from fixture PASS.

#### Fallback
Publisher/network/currentness failure waits/rechecks only its affected gate.
No manual release/tag duplication while publisher is active, no global
environment edits to satisfy CI. Missing compatible public CLI blocks B3
publication; it does not reset completed consumer obligations. Unavailable
native trial blocks only that runtime's operational certification.

## Traceability and planning validation

| Owner | Direct verification |
| --- | --- |
| B1 R2B-B1 | scoped profile rule mutations plus compiled v2 semantic acceptance |
| B1 R2B-B2 | old binary unsupported/floor negative and visible v1 route |
| B2 R2B-B3 | reserve-before-native/ack/observation/mismatch mutation and CLI custody negatives |
| B2 R2B-B4 | every full role/ref consumer plus independent final journey QA |
| B2 R2B-B5 | exhaustive six-target blocks/degradation and budget/environment mutations |
| B3 R2B-B6 | actual binary fixture acceptance and mutation of both publication gates |
| B3 R2B-B7 | observed compatible public pair, bounded report, no policy mutation |

No implementation or journal initialization in this planning session.
Self-review ownership/coverage/types/placeholders, then validate using installed
CLI 9.8.0 against this bootstrap v1 plan. Validation is not admission.
Strict preflight/context-budget at eventual handoff; local registry opt-out
does not permit unattended dispatch under an unpassed empirical admission.
Do not reopen that mismatch or change CLI sensors as part of this content plan.

Coordinated execution: CLI C1-C4 and public compatible CLI -> registry B1-B3 ->
registry CI/tag certification -> explicit requested environment update ->
native acceptance by each runtime. R2-A trial and Claude routing acceptance
are pending observations, never gate waivers or fake native PASS.
R3 cost comparison and savings target remain a separate experiment.
