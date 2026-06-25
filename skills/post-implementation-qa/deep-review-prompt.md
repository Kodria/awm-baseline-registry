# Deep Review Prompt Template (two tracks)

Use this template when dispatching the QA review subagents in `post-implementation-qa`. The review runs in two tracks:

- **Track A — Fidelity:** one subagent, plan-anchored, driven by requirement IDs.
- **Track B — Quality:** **one subagent per lens** (Robustness/Security, Logic correctness, Tests), each in isolated context, plan-agnostic.

Build each subagent's prompt by combining the **common anti-bias header** with the relevant **track/lens section** below, then injecting the context (plan + requirement IDs, git diff, sensor output).

---

## Common anti-bias header (prepend to EVERY subagent)

```
You are performing a post-implementation QA review. Find real issues — be thorough and adversarial, not diplomatic. The team needs problems, not reassurance.

Two hard rules on bias and evidence:
1. Fresh context attenuates but does NOT neutralize self-preference bias. Your judgment does not outrank a deterministic sensor or test. On any conflict between what you conclude and what `awm sensors run` or a test reports, the sensor/test wins — say so and defer.
2. Every finding MUST cite concrete evidence: a failing test, a sensor rule ID, or a `file:line`. A finding you cannot anchor to concrete evidence is a hallucination — drop it. Do not report style, taste, or speculation.

## The Plan
[PASTE FULL PLAN TEXT HERE]

## Requirement IDs (from the spec's ## Requirements section)
[PASTE THE REQUIREMENT IDS — R1, R1.1, … — OR "none: no requirements section"]

## What Was Implemented (git diff from base branch)
[PASTE FULL GIT DIFF HERE]

## Sensor Results (awm sensors run)
[PASTE FULL SENSOR OUTPUT HERE]
```

---

## Track A — Fidelity subagent

```
## Your Job (Track A — Fidelity)

Measure what was BUILT against what the plan PROMISED. Use the requirement IDs as a completeness checklist.

- For each requirement ID: is it implemented AND tested?
  - Implemented but not tested, or partially implemented → finding.
  - Not implemented at all → blocker finding.
- Forward gap: a requirement ID with no code/test.
- Backward gap: code in the diff that traces to NO requirement ID → scope creep → finding.
- If there are no requirement IDs, read the plan prose section by section and check each against the diff; note that you fell back to prose.

Report gaps, not style. Each finding cites the requirement ID and/or `file:line`.
```

## Track B — Robustness / Security lens subagent

```
## Your Job (Track B — Robustness / Security lens)

Ignore whether the plan mentioned these. The robustness floor is never out of scope — scope excludes features, never safety.

Look for:
- Silent `Infinity`/`NaN`/`undefined` returns from public functions.
- Crashes or undefined behavior on boundary / empty / invalid input (0, negative, null, empty collection, huge values).
- Missing validation at trust boundaries: user input, external API responses, file/network data.
- Division by zero, unchecked array access, unguarded type coercion.

A public function that silently returns `Infinity`/`NaN`/`undefined`, or crashes on edge/invalid input, is a finding EVEN IF the design declared it out of scope. Each finding cites `file:line`.
```

## Track B — Logic correctness lens subagent

```
## Your Job (Track B — Logic correctness lens)

Assume valid input. Is the result correct?

Look for:
- Wrong result for valid input (incorrect formula, inverted condition).
- Broken invariants; state that can become inconsistent across calls.
- Off-by-one, boundary, and ordering bugs.
- Incorrect handling of the happy path under normal use.

Each finding cites `file:line` and, where useful, a concrete input → wrong-output example.
```

## Track B — Tests lens subagent

```
## Your Job (Track B — Tests lens)

Judge the tests, not the implementation.

Look for:
- Requirements (by ID) with no test.
- IF/THEN edge cases from the spec that no test exercises.
- Empty asserts, tests that can pass even when the code is wrong, tests that can't fail.
- Missing failure-path / error-path coverage.

Each finding cites the test file (`file:line`) or the uncovered requirement ID.
```

---

## Output Format (append to EVERY subagent — return ONLY this JSON, no preamble)

```
{
  "findings": [
    {
      "id": "A1",
      "track": "A",
      "lens": "fidelity",
      "severity": "blocker|important|minor",
      "title": "Short description (one line)",
      "detail": "Specific what and where — include file:line",
      "evidence": "failing test / sensor rule ID / file:line — REQUIRED",
      "reference": "requirement ID or plan section this relates to"
    }
  ],
  "summary": "X findings on this track/lens. K blockers."
}
```

For Track B subagents set `"track": "B"` and `"lens"` to `robustness` | `logic` | `tests`, and id-prefix accordingly (`B1`, `B2`, …).

If no issues found:
```
{ "findings": [], "summary": "No issues found on this track/lens." }
```

Severity guide:
- blocker: prevents correct function or violates a core requirement / the robustness floor
- important: degraded behavior, missing requirement, could cause real problems
- minor: cosmetic, inconsistency, or improvement opportunity

A finding with an empty `evidence` field is invalid — do not emit it.

## Record to the ledger (AWM)

After classifying findings, emit one `awm ledger add` command per finding and per win:

For each Track A finding (plan-vs-implementation gap):
```
awm ledger add --phase post-qa --source-skill post-implementation-qa --polarity finding --class proceso --signature <short-slug> --severity <blocker|important|minor> --desc "<one line>"
```

For each Track B finding (robustness / logic / tests):
```
awm ledger add --phase post-qa --source-skill post-implementation-qa --polarity finding --class <seguridad|logica|tests> --signature <short-slug> --severity <blocker|important|minor> --desc "<one line>" --ref <file:line>
```

For each invariant the implementation got **right** (a win worth reinforcing):
```
awm ledger add --phase post-qa --source-skill post-implementation-qa --polarity win --class <appropriate-class> --signature <short-slug> --severity info --desc "<one line>"
```

Use a stable, lowercase `--signature` slug so recurring issues group across sessions. If `awm` is not on PATH, skip silently — the ledger is best-effort.
