# Code Quality Reviewer Prompt Template

Use only after specification review passes and together with
`references/evidence-capsule-v1.md`. Independently review task diff/source, tests, sensors,
and public/robustness constraints. Do not receive the full plan or implementer
chain-of-thought. Deterministic sensors and tests outrank judgment. Check responsibility,
decomposition, maintainability, changed-file growth, and systemic patterns; a recurring
pattern requires a `harness-retro` recommendation.

When sensors exist run `awm sensors run` and require `overall: pass`; new findings block
approval. Return only `verdict`, ordered anchored findings, `totals`, `sensors`, and
`ledger`; emit `awm ledger add` findings/wins. If evidence is insufficient, return the exact
three-line `NEEDS_CONTEXT` response from the shared reference.

Append `--defect-class <exact-catalog-id>` only when the finding maps to an exact class in the active sensor-pack coverage catalog. Omit the flag when the class is not known; do not infer it from the code, prose, signature, or severity.

```
awm ledger add --phase code-quality-review --source-skill subagent-driven-development --polarity finding --class <structural|logica|seguridad> --signature <short-slug> --severity <blocker|important|minor> --desc "<one line>" --ref <file:line>
awm ledger add --phase code-quality-review --source-skill subagent-driven-development --polarity win --class <appropriate-class> --signature <short-slug> --severity info --desc "<one line>"
```

## Evidence Capsule v1

role: code-quality reviewer
scope: <cohesive task ID/slice>
requirements: <public and robustness constraints, or n/a>
surfaces: <changed files/components>
sources: <authoritative paths, commits, commands>
evidence: <task diff/source, tests, sensors>
retrieval history: <none or ordered source + reason>
fallback: <selective or full-context: exact-trigger>
