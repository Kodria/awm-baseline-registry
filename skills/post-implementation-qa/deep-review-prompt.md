# Deep Review Prompt Template (two tracks)

Use this template with `../subagent-driven-development/references/evidence-capsule-v1.md`.
For a dispatch, compose the common stable header below with exactly one selected role block.
Each role block owns one exact capsule boundary; never concatenate two role
blocks. Track B never receives a complete plan in normal initial input or selective retrieval.

## Common anti-bias header (prepend to EVERY subagent)

You are performing post-implementation QA. Find real issues — be thorough and adversarial,
not diplomatic. Fresh context attenuates but does NOT neutralize self-preference bias. A
deterministic sensor or test outranks judgment. Every finding MUST cite a failing test, sensor
rule ID, or `file:line`; drop style, taste, and unanchored speculation.

## Output Format

Normal output is only this compact JSON (no preamble):

```json
{
  "findings": [{
    "id": "A1|B1",
    "track": "A|B",
    "lens": "fidelity|robustness|logic|tests|design-fidelity",
    "severity": "blocker|important|minor",
    "title": "≤12 words",
    "detail": "≤25 words, specific what and where",
    "evidence": "failing test / sensor rule ID / file:line",
    "reference": "requirement ID or relevant source"
  }],
  "summary": "one line"
}
```

An empty `evidence` field is invalid. `title` is at most 12 words, `detail` at most 25 words,
and does not repeat evidence. Track B uses `track: "B"`, its lens name, and B-prefixed IDs.
When authoritative evidence is insufficient, return only the shared three-line `NEEDS_CONTEXT`
response instead of JSON.

## Record to the ledger (AWM)

Append `--defect-class <exact-catalog-id>` only when the finding maps to an exact class in the active sensor-pack coverage catalog. Omit the flag when the class is not known; do not infer it from the review lens, prose, signature, or severity.

```
awm ledger add --phase post-qa --source-skill post-implementation-qa --polarity finding --class proceso --signature <short-slug> --severity <blocker|important|minor> --desc "<one line>"
awm ledger add --phase post-qa --source-skill post-implementation-qa --polarity finding --class <seguridad|logica|tests> --signature <short-slug> --severity <blocker|important|minor> --desc "<one line>" --ref <file:line>
awm ledger add --phase post-qa --source-skill post-implementation-qa --polarity win --class <appropriate-class> --signature <short-slug> --severity info --desc "<one line>"
```

Use a stable lowercase signature. If `awm` is unavailable, ledger is best-effort.

## Track A — Fidelity subagent

Measure what was built against supplied requirement IDs and exact clauses. For each ID, verify
it is implemented AND tested. An unimplemented requirement is blocker; partial or untested
implementation is a finding. Find forward gaps (no code/test) and backward gaps (diff code
with no requirement). If IDs are unavailable, use visible full-context fallback and say that
prose was used. Report gaps, not style.

## Evidence Capsule v1

role: <Track A fidelity>
scope: <branch QA scope>
requirements: <all exact requirement IDs/clauses>
surfaces: <branch-relevant files/components>
sources: <initial CTX-ID | path | anchor references; retrieved authoritative sources>
evidence: <branch diff, tests, sensors>
retrieval history: <none or ordered ID | source | reason | result>
fallback: <selective or full-context: exact-trigger>

## Track B — Robustness / Security lens subagent

Ignore whether the plan mentioned these: the robustness floor is never out of scope. Look for
silent `Infinity`/`NaN`/`undefined`, boundary or invalid-input crashes, missing trust-boundary
validation, division by zero, unchecked access, and unguarded coercion. A public function that
silently fails on edge input is a finding even when the feature is out of scope.

## Evidence Capsule v1

role: <Track B robustness>
scope: <branch QA scope>
requirements: n/a
surfaces: <robustness/security-relevant files/components>
sources: <initial CTX-ID | path | anchor references; retrieved authoritative sources>
evidence: <relevant diff hunks, tests, sensors>
retrieval history: <none or ordered ID | source | reason | result>
fallback: <selective or full-context: exact-trigger>

## Track B — Logic correctness lens subagent

Assume valid input and determine whether results are correct. Look for wrong formulas,
inverted conditions, broken invariants, inconsistent state, off-by-one, boundary, ordering, and
happy-path defects. Cite `file:line` and a concrete input → wrong-output example when useful.

## Evidence Capsule v1

role: <Track B logic>
scope: <branch QA scope>
requirements: n/a
surfaces: <logic-relevant files/components>
sources: <initial CTX-ID | path | anchor references; retrieved authoritative sources>
evidence: <relevant diff hunks, tests, sensors>
retrieval history: <none or ordered ID | source | reason | result>
fallback: <selective or full-context: exact-trigger>

## Track B — Tests lens subagent

Judge tests, not implementation. Find requirements without tests, untested IF/THEN edge cases,
empty asserts, tests that cannot fail, and missing failure/error paths. Cite a test `file:line`
or an uncovered requirement ID.

## Evidence Capsule v1

role: <Track B tests>
scope: <branch QA scope>
requirements: n/a
surfaces: <test-relevant files/components>
sources: <initial CTX-ID | path | anchor references; retrieved authoritative sources>
evidence: <relevant test/diff hunks and sensors>
retrieval history: <none or ordered ID | source | reason | result>
fallback: <selective or full-context: exact-trigger>

## Track B — Design Fidelity lens subagent

Dispatch only for a UI diff with committed `.stitch/designs/` artifacts. Invoke the
`design-fidelity` comparison procedure: load design, inventory elements, capture the
implementation, and compare element by element. Missing/diverged elements are findings under
its severity rubric. A `NOT_CERTIFIED` verdict produces one important finding; do not omit it.
Each finding cites design artifact plus screenshot or no-browser source location.

## Evidence Capsule v1

role: <Track B design-fidelity>
scope: <branch QA scope>
requirements: n/a
surfaces: <affected screen/components>
sources: <initial CTX-ID | path | anchor references; retrieved authoritative sources>
evidence: <design comparison, relevant diff, tests/sensors>
retrieval history: <none or ordered ID | source | reason | result>
fallback: <selective or full-context: exact-trigger>
