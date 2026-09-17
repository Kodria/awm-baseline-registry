# R2-A — Review and QA control implementation
<!-- awm-qa-complete: 2026-09-17 -->
<!-- awm-docs-complete: 2026-09-17 -->
<!-- awm-retro-complete: 2026-09-17 -->

> **Goal:** Deliver a registry-only, reviewed candidate for an isolated Claude trial, reducing redundant execution without reducing quality.
**Architecture:** One shared normative review-cycle reference; existing admission, capsule, fingerprint, journal/job and ledger remain authorities.
**Tech Stack:** Markdown skills, Node 24 contract tests and current AWM CLI 9.8.0.
**Modo de ejecución:** interactivo
**Approval:** Owner approved registry-first A1 → A2 on 2026-09-17. Implementation and quality closure authorized; R2-B, global installation, publication and the owner's Claude project are excluded.
**Issue:** https://github.com/Kodria/agentic-workflow/issues/126
**Base:** baseline origin/main 31c3fc86df88be23c023a2846058952d5271ad9a.

<!-- AWM:COMPACT-SLICES:START v1 -->
{
  "schema": "compact-slices/v1",
  "planId": "issue-126-r2a-review-control",
  "requirements": [
    "R2A-1",
    "R2A-2",
    "R2A-3",
    "R2A-4",
    "R2A-5",
    "R2A-6",
    "R2A-7",
    "R2A-8",
    "R2A-9",
    "R2A-10",
    "R2A-11"
  ],
  "sources": [
    {
      "id": "SRC-CAPSULE",
      "path": "skills/subagent-driven-development/references/evidence-capsule-v1.md",
      "locator": "## Retrieval and Full-context Fallback",
      "fact": "Risk expands relevant context and retains independent roles; prompt/response bodies remain ephemeral."
    },
    {
      "id": "SRC-QA",
      "path": "skills/post-implementation-qa/SKILL.md",
      "locator": "### Step 4",
      "fact": "Current QA re-dispatches missing ledger entries and runs complete sensors per fix; R2-A replaces administrative reanalysis and per-finding gate repetition, not verdict requirements."
    },
    {
      "id": "SRC-R8",
      "path": "skills/setup-sensors/references/registry-closure-policy-r8.md",
      "locator": "# Registry Sensor Closure Policy",
      "fact": "All declared sensors disabled is the sole local registry exception; skipped/not_certified never becomes pass; validate and auto-tag retain real certification."
    }
  ],
  "commands": [
    {
      "id": "CMD-R2A",
      "program": "npm",
      "args": [
        "run",
        "test:r2a"
      ],
      "covers": [
        "R2A-1",
        "R2A-2",
        "R2A-3",
        "R2A-4",
        "R2A-5",
        "R2A-6",
        "R2A-7",
        "R2A-8",
        "R2A-9",
        "R2A-10",
        "R2A-11"
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
        "R2A-1",
        "R2A-6",
        "R2A-10"
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
        "R2A-1",
        "R2A-7",
        "R2A-10"
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
        "R2A-10",
        "R2A-11"
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
        "R2A-10",
        "R2A-11"
      ]
    }
  ],
  "slices": [
    {
      "id": "A1",
      "title": "Review cycle contract and negative controls",
      "requirements": [
        "R2A-1",
        "R2A-2",
        "R2A-3",
        "R2A-4",
        "R2A-5",
        "R2A-6",
        "R2A-7",
        "R2A-8",
        "R2A-9"
      ],
      "dependsOn": [],
      "sectionAnchor": "slice-a1",
      "sources": [
        "SRC-CAPSULE",
        "SRC-QA",
        "SRC-R8"
      ],
      "redCommands": [
        "CMD-R2A"
      ],
      "greenCommands": [
        "CMD-R2A"
      ],
      "reviewEvidence": [
        "specification",
        "code-quality"
      ],
      "risk": "full-context",
      "fallback": [
        "public-contract",
        "security-or-robustness",
        "uncertain-cross-cutting-impact"
      ]
    },
    {
      "id": "A2",
      "title": "Consumers and isolated Claude trial candidate",
      "requirements": [
        "R2A-10",
        "R2A-11"
      ],
      "dependsOn": [
        "A1"
      ],
      "sectionAnchor": "slice-a2",
      "sources": [
        "SRC-CAPSULE",
        "SRC-QA",
        "SRC-R8"
      ],
      "redCommands": [
        "CMD-R2A"
      ],
      "greenCommands": [
        "CMD-R2A",
        "CMD-CAPSULE",
        "CMD-COMPACT",
        "CMD-PORTABLE",
        "CMD-RELEASE"
      ],
      "reviewEvidence": [
        "specification",
        "code-quality"
      ],
      "risk": "full-context",
      "fallback": [
        "public-contract",
        "root-configuration",
        "uncertain-cross-cutting-impact"
      ]
    }
  ],
  "closureCommands": [
    "CMD-R2A",
    "CMD-CAPSULE",
    "CMD-COMPACT",
    "CMD-PORTABLE",
    "CMD-RELEASE"
  ]
}
<!-- AWM:COMPACT-SLICES:END v1 -->

## Approved clauses and shared implementation facts

- **R2A-1:** Establish current candidate, plan identity, role and verification obligations before dispatch; missing required evidence blocks.
- **R2A-2:** Share authoritative mechanical results only for the identical candidate, command, cwd and satisfies obligation. Unknown equivalence requires execution, not guessed caching.
- **R2A-3:** Collect reports for a frozen candidate; deduplicate only confirmed identical defects, retaining every finding identity; group corrections by confirmed cause, related surfaces and shared test boundary.
- **R2A-4:** Controller repairs missing ledger records using complete received real fields and verifies ledger list; incomplete reports require clarification, never invented verdicts or another code review solely for bookkeeping.
- **R2A-5:** Each coherent fix group uses focused RED/GREEN and complete required gates once for its new candidate, not once per finding.
- **R2A-6:** Independent recheck covers delta, prior findings, dependencies and introduced defects; public/security/robustness/root/uncertain impact requires full relevant applicable scope.
- **R2A-7:** Any candidate/fingerprint change invalidates old PASS as current evidence; staging/commit changes are not exempt.
- **R2A-8:** Classify product, plan, context, environment, currentness/publication and persistence failures; repair only the affected gate if code is unchanged.
- **R2A-9:** Report dispatches/reviews, fix rounds, mechanical runs, administrative repairs, context fallbacks and reopening causes separately; unknown counts are unavailable. Persist bounded metadata, never prompt/source/response bodies.
- **R2A-10:** Retain TDD, distinct implementer/specification/quality roles, final integrated review, Track A and every applicable Track B lens, sensors, docs, retro and finishing; defects and stale evidence block completion.
- **R2A-11:** Deliver exact candidate SHA and version/CLI compatibility, isolated Claude trial and rollback; structural PASS is not native Claude acceptance or demonstrated savings.

No CLI enforcement or fingerprint caching changes. No new model/profile/defaults. If a guarantee needs new CLI authority, stop and request scope approval; do not simulate enforcement with prose.
Create `test:r2a` npm script invoking `node --test tests/r2a-review-cycle-contract.test.mjs`. Its existence is part of A1, not an assertion that tests have already run.
Contract tests must scope each rule to its actual section and demonstrate a failing mutation for every new rule. They prove normative contract integrity, not autonomous model compliance. Bounded RED/GREEN native pressure tests additionally exercise missing-ledger, grouped fixes and stale candidate scenarios without modifying a real project.
No paid provider API tests or changes to installed registries. Initial quota remaining 28% is an observation, not a budget guarantee.

<a id="slice-a1"></a>
### Slice A1: Review cycle contract and negative controls

#### Surfaces

Own R2A-1 through R2A-9 in new `skills/subagent-driven-development/references/review-cycle-v1.md`, `tests/r2a-review-cycle-contract.test.mjs` and package.json test:r2a. One cohesive controller protocol, not a second admission parser or job runtime. Shared facts are SRC-CAPSULE, SRC-QA, SRC-R8 and the exact approved clauses above.

#### Implementation

Create scoped assertions for nine numbered normative rule sections and mutation tests removing/reversing each operative rule. Run CMD-R2A RED against missing contract; failure must identify missing required contract, not syntax/import errors. Run a bounded native baseline pressure scenario against existing SDD/QA instructions before editing them; retain only choices/counts/rationalization summary as metadata, not raw responses.
Write the single reference with sections Candidate, Mechanical evidence, Finding groups, Administrative repair, Fix verification, Independent revalidation, Invalidation, Failure classification, Measurement. Each section implements its exact approved clause above. State that existing compact admission and capsule are prerequisite owners. Define frozen candidate collection; confirmed-cause grouping and finding→fix→test→new-verdict mapping; complete current-role coverage before close; loop without new diagnosis/evidence blocks. Run CMD-R2A GREEN and each in-memory negative mutation. Do not change consumers yet.

#### Edge cases

Identical fingerprint with different satisfies cannot share evidence. Changed HEAD, staged index or missing command/cwd/provenance requires current evidence. Two distinct defects at one file:line never deduplicate. Unconfirmed common cause separates groups. A partially repaired group retains open findings. Missing ledger fields require clarification. Persistence/network failure does not invalidate unchanged code verdict by itself, but cannot bypass its affected gate. Security/public/root/uncertain fix forces full relevant scope. Tests rejecting a weakened rule must not be satisfied by unrelated keywords elsewhere.

#### Evidence

CMD-R2A supplies RED/GREEN and mutation evidence; independent specification then code-quality reviewers must be distinct from root implementer and each other. Record current planDigest, Git candidate and exact test result. Apply actual sensors and SRC-R8 exception without relabeling local skipped/not_certified as pass. No checkbox replaces review evidence.

#### Fallback

Public-contract risk requires full relevant reference/constraints, retaining all roles. Missing or contradictory facts require durable amendment, revalidation and new admission identity. A CLI guarantee gap blocks and is escalated; do not expand scope.

<a id="slice-a2"></a>
### Slice A2: Consumers and isolated Claude trial candidate

#### Surfaces

Own R2A-10 and R2A-11: integrate A1 into SDD SKILL and implementer/spec/quality templates, QA SKILL and deep-review template, executing-plans and verification-before-completion. Update edited skill versions, dev bundle/catalog metadata, release fixtures where exact version expectations change, validate/auto-tag with CMD-R2A, and `docs/acceptance/r2a-claude-trial.md`. These surfaces form one end-to-end quality route.

#### Implementation

After A1 clean reviews, add consumer integration assertions to CMD-R2A; observe RED for missing links and old contradictory behavior. Each consumer requires the sole review-cycle reference before relevant review/fix actions. Replace QA/SDD missing-ledger redispatch with reference-governed administrative repair. Replace reviewer unconditional duplicate mechanical execution with verification of authoritative current evidence or required real run when missing/stale. Keep implementer complete gate before review and controller verification before completion.
Replace QA per-finding fix loop with confirmed coherent groups; retain separate fidelity correction versus quality root-cause debugging, severity order and all accepted findings. Refresh current independent verdicts after candidate change with delta/impact scope and full relevant risk fallback; never reuse another role's old PASS.
Keep templates' stable prefix/capsule marker, anti-bias instructions, ledger commands and Report Contracts. Update flow diagram and red flags to agree. Bump edited skill patch/minor as appropriate and dev bundle to 4.1.0 in catalog and bundle; update historical exact-version checks to distinguish immutable R1 evidence from current dev metadata rather than weakening them.
Add CMD-R2A to both validate and auto-tag before publication; retain existing certification jobs. Write trial prerequisites CLI 9.8.0, exact reviewed SHA supplied at handoff, scratch-only installation with temporary HOME/AWM_HOME and cwd, complete isolated settings/dependencies, approved negative scenarios and rollback by discarding scratch context. Do not install into global HOME or touch owner's Claude plan.
Run all green/closure commands and skill bump script against origin/main. Run bounded native pressure scenarios with candidate contract; compare RED choices without claiming Claude equivalence. Obtain per-slice reviews then final integrated review and global Track A/Track B robustness, logic and tests; design lens not applicable without UI. Docs/retro/verification/finishing follow, candidate remains uninstalled/unpublished.

#### Edge cases

Tests mutate each consumer link/operative behavior; no dangling cross-skill hard dependencies in portable exports. No global model changes. Applicable sensors require pass; all-disabled registry retains exact local verdict plus existing versioned release certification. A new defect from fix remains open even when original finding is solved. Every current role/lens obligation needs actual current verdict. Trial missing compatible CLI or isolated settings blocks; no baseline means savings unavailable.

#### Evidence

CMD-R2A, CMD-CAPSULE, CMD-COMPACT, CMD-PORTABLE and CMD-RELEASE, `./scripts/check-skill-version-bumps.sh origin/main`, actual sensor output/R8 eligibility, independent slice and integrated review, separate QA roles, docs and retro. Handoff includes exact commit and observed status READY-FOR-CLAUDE-TRIAL only after all candidate gates pass; CLAUDE-PASS requires future actual authorized Claude run.

#### Fallback

Public/root/cross-cutting changes receive full relevant source and verification without removing roles. Contract conflicts require durable plan amendment and re-admission. An unavailable quality gate blocks, not fabricated proof. Routing/publishing/real user-project execution requires separate authorization.

## Execution checklist

- [ ] Validate compact plan, strict currentness and admit current planDigest.
- [ ] Baseline existing contracts once; preserve unrelated changes.
- [ ] A1 RED, normative contract GREEN, mutation controls and independent reviews.
- [ ] A2 integration RED/GREEN, pressure tests and independent reviews.
- [ ] Final integrated review and global Track A/B QA.
- [ ] Documentation, retro, full verification and candidate finishing.
- [ ] Exact SHA and isolated Claude trial handoff; no native acceptance claim.
