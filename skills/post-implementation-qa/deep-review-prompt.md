# Final QA Review Prompt Template

Use this template with `../subagent-driven-development/references/evidence-capsule-v1.md`.
Dispatch one Track A fidelity reviewer and each applicable isolated Track B lens:
Robustness/Security (never skipped), Logic, Tests by tier, and Design Fidelity only for a UI
diff with committed `.stitch/designs/` artifacts. Do not collapse lenses.

Every reviewer starts in fresh context. A deterministic sensor or test outranks judgment;
every finding requires a failing test, sensor rule ID, or `file:line`. Track A audits each
requirement ID/clauses against the diff. Track B ignores plan intent and audits its own quality
floor. Preserve the security/robustness floor even when a feature is out of scope.

Normal output is the existing compact JSON finding shape with `track`, `lens`, severity,
evidence, and reference. Emit `awm ledger add` for every finding and win; exact defect classes
only when present in the active coverage catalog. If evidence is insufficient, return only the
shared three-line `NEEDS_CONTEXT` response, not findings JSON.

Append `--defect-class <exact-catalog-id>` only when the finding maps to an exact class in the active sensor-pack coverage catalog. Omit the flag when the class is not known; do not infer it from the review lens, prose, signature, or severity.

```
awm ledger add --phase post-qa --source-skill post-implementation-qa --polarity finding --class proceso --signature <short-slug> --severity <blocker|important|minor> --desc "<one line>"
awm ledger add --phase post-qa --source-skill post-implementation-qa --polarity finding --class <seguridad|logica|tests> --signature <short-slug> --severity <blocker|important|minor> --desc "<one line>" --ref <file:line>
awm ledger add --phase post-qa --source-skill post-implementation-qa --polarity win --class <appropriate-class> --signature <short-slug> --severity info --desc "<one line>"
```

## Evidence Capsule v1

role: <Track A fidelity | Track B robustness | Track B logic | Track B tests | Track B design-fidelity>
scope: <branch QA scope>
requirements: <Track A exact IDs/clauses; Track B n/a unless full-context fallback>
surfaces: <role-relevant files/components>
sources: <authoritative paths, commits, commands>
evidence: <Track A diff/tests/sensors; Track B lens-relevant hunks/tests/sensors/design artifacts>
retrieval history: <none or ordered source + reason>
fallback: <selective or full-context: exact-trigger>
