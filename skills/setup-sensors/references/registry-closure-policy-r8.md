# Registry Sensor Closure Policy (R8 v1)

This is the single normative owner of the registry-content closure exception.

For any project with one or more applicable sensors, `overall: pass` remains absolute: no task,
review, QA, retro, PR, tag, or release progression has an exception. Registry-content closure is
the sole narrow case: it is allowed only when all declared sensors are explicitly disabled.
Preserve a local `not_certified` or `skipped` verdict exactly as reported and never call either
verdict `pass`.

This local exception never waives release proof. Versioned R8 evidence for the candidate SHA must
run in both `validate` and `auto-tag` before registry content can close. `fail`, `inconclusive`,
missing CI evidence, or any applicable sensor can never receive this exception.
