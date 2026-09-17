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

Consume authoritative mechanical evidence without repeating a command only when
the identical candidate, command argv, cwd and satisfies obligation are proven.
Different roles may read that one result. Equivalence that is absent, stale or
not demonstrably identical requires a real execution. Focused tests are not
equivalent to a complete gate merely because they pass.

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
Unavailable counts remain unavailable. Persist only bounded IDs, verdicts and
provenance; never persist prompt, source or unrestricted response bodies.
