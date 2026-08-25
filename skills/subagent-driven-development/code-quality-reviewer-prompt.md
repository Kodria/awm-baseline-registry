# Code Quality Reviewer Prompt Template

Use only after specification review passes and together with
`references/evidence-capsule-v1.md`. Dynamic diff/source, tests, sensors, and constraints
arrive only in the capsule; never receive a full plan or implementer chain-of-thought.

Use the standard reviewer contract at `requesting-code-review/code-reviewer.md` plus these
checks: sensor evidence, one responsibility per file, independently understandable units,
declared file structure, newly introduced file growth, and **Systemic patterns** across two or
more changed files. A systemic pattern names one example and recommends `harness-retro`.

When `.awm/sensors.json` exists run `awm sensors run` with no flag and require `overall: pass`;
new findings block approval. Deterministic sensors/tests outrank judgment.

**Code reviewer returns (Report Contract):**

    verdict: approved | issues
    - file:line — <critical|important|minor> — <problem ≤12 words>. <fix ≤8 words>.
    totals: <N critical / N important / N minor>
    sensors: overall: pass | fail — <new findings, if any>
    ledger: <N findings, M wins emitted> | skipped (awm not on PATH)

One `-` line per issue, sorted file → line ascending; omit the list when approved. No process
narration. If evidence is insufficient, return the exact shared three-line `NEEDS_CONTEXT`.

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
