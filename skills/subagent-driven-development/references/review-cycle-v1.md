# Review cycle v1

This is the sole normative controller contract for review, fix and revalidation
cycles. It complements compact admission and Evidence Capsule v1; it does not
parse plans, create jobs, change fingerprints or replace either authority.

## Candidate and obligations

The controller establishes the candidate, plan identity, scope, declared roles
and current verification obligations before any dispatch. It freezes that
candidate while collecting an initial review round. Missing required evidence
must block; it does not authorize an exploratory review.

## Mechanical evidence

For **arbitrary commands**, consume a MechanicalRunEvidence receipt without
re-execution only when `awm evidence verify <receipt> -- <expected-argv…>`
reports `match` (expected argv after `--` is mandatory; omit → mismatch
fail-closed). Do **not** conflate MechanicalRunEvidence with `CycleEvidenceV1`
capsules from `awm evidence capture`.

For **sensors**, consume current `awm sensors run` provenance (`cached: true` /
fingerprint / digests / status) as the evidence substrate — sensors do not write
MechanicalRunEvidence. Equivalence that is absent, stale or not demonstrably
identical requires a real execution. Focused tests are not equivalent to a
complete gate merely because they pass.

## Review cut and deferred findings

- **RF-4.1 — First round:** WHEN a role's first review verdict for the frozen
  candidate contains accepted findings, require correction of all of them before
  that role can be clean for the slice.
- **RF-4.2 — Re-review:** WHEN a role is in a re-review (second or later round
  on the same slice obligation), open another fix/re-review loop only for
  **blocking** findings (RF-4.6). Record all other findings as **deferred**
  ledger entries (`awm ledger add --deferred` with a reason), not discarded.
- **RF-4.3 — Round ceiling:** AFTER three total rounds for a role on the same
  slice (first review + up to two further cycles), defer remaining
  **non-blocking** findings with durable reason `round-ceiling`, allow the
  slice to advance, and do not BLOCK an unattended plan waiting for a live
  owner decision.
- **RF-4.4 — Blocking never defer:** IF any blocking finding remains open for
  the slice, do **not** advance that slice until it is fixed and revalidated,
  regardless of round ceiling.
- **RF-4.6 — Blocking mapping:** use existing ledger fields only — an entry is
  blocking when `class=seguridad` **or** `severity=blocker` (covers security,
  externally false result, and red mechanical gate via those fields). Do not
  invent a parallel taxonomy. Ambiguous or missing `class`/`severity` on a
  finding that would otherwise defer SHALL be treated as blocking until
  clarified (fail closed — never silent drop).

## Finding reconciliation

Collect received reports for the frozen candidate before correcting. Deduplicate
only confirmed identical defects, not file:line alone: two defects at one line
remain separate. Group a correction only when cause, related surfaces and shared
test boundary are confirmed. Retain a finding → fix → test → new verdict mapping
for every finding; unconfirmed common cause means separate groups.

## Administrative repair

When a valid received report contains a ledger-entries collection with complete
received fields for an entry (identity, verdict, finding or win polarity, class, signature,
severity, description and reference when applicable) but lacks its ledger
record, the controller repairs only that administrative record and verifies it
with ledger list. It must not re-review code or invent a reviewer verdict.
Without explicit ledger-entries, incomplete report fields require clarification
and remain open; the controller must not infer them from a template.

## Coherent fix groups

A coherent group receives focused RED/GREEN tests and all applicable current
gates once for its new candidate, not once per finding or line. Do not mix an
unrelated refactor with a confirmed defect group. Every accepted finding remains
open until its mapped correction and verification are current.

## Independent revalidation

A fresh independent specification reviewer and a fresh independent code-quality
reviewer cover the delta, prior findings, dependencies and introduced defects.
Public, security-or-robustness, root-configuration or uncertain-cross-cutting
impact requires the full relevant applicable scope. Each affected role obligation
needs a current verdict; focal revalidation never transfers another role's
verdict automatically.

## Invalidation

A changed candidate or changed fingerprint invalidates an old PASS as current
evidence. Commit, staged-index or code changes are not exempt. Reconciliation
requires a new current verdict for each affected obligation; an unchanged
environment, network or persistence failure does not itself alter a code verdict.

## Failure classification

Classify failures as product, plan, missing context, environment, currentness,
publication, persistence or administrative metadata. For unchanged code, repair
and repeat only the affected gate. A failure must not cause an extra
implementer/reviewer dispatch without a new diagnostic or changed obligation.

## Bounded measurement

At complete or blocked, report dispatches, reviews, fix rounds, mechanical runs,
administrative repairs, context fallbacks and reopening causes separately.
Durations come only from durable timestamps (ledger `ts`, MechanicalRunEvidence
`durationMs`) — never from an LLM clock (RF-5.1). IF any single gate's duration
is ≥ 30% of that slice's total measured time OR ≥ 20 minutes, include an
explicit warning naming the gate and durations (RF-5.2). Unavailable counts or
durations remain unavailable. Persist only bounded IDs, verdicts and
provenance; never persist prompt, source or unrestricted response bodies.
