# R2-A — Admission blocker before implementation

Status: BLOCKED before A1, zero implementation/review dispatches. No installed content changed.

Validated plan: `2026-09-17-r2a-review-control-plan.md`.
CLI: 9.8.0. Registry worktree base: 31c3fc86df88be23c023a2846058952d5271ad9a.
Validated planDigest: 8d93676b25fd2aee7106a099cbc4df2612e138cc42e3e99687508d307fb2c94f.

## Observations

- `awm plan validate docs/plans/2026-09-17-r2a-review-control-plan.md --cwd . --json`: valid, 11 requirements, two serial slices, unique complete ownership.
- `awm preflight --require-current --json`: ready; all two declared sensors explicitly disabled, deliberate opt-out; CLI and configured registries current.
- `awm sensors run`: lint and security skipped with skipReason disabled; overall not_certified. This is not PASS.
- `awm plan admit docs/plans/2026-09-17-r2a-review-control-plan.md --provider codex --cwd . --require-current --verify-sensors --json`: exit 2, blocked, ADMISSION_SENSORS_BLOCKED, sensors not-certified, journal not-required, currentness current.

## Cause and boundary

Released CLI admission (`cli/src/core/admission/index.ts`, lines 172–174 at released source e1a9dbe) accepts only sensorVerdict pass when verifySensors is required. It has no registry opt-out admission path. The registry's sole normative R8 reference allows narrow local content closure when all declared sensors are explicitly disabled while retaining versioned validate/auto-tag certification. Current mandatory compact admission cannot reach execution in this actual registry environment.

This is a mismatch between mechanical admission and the registry workflow, not a failed product test or a missing network connection. The initial private-registry network failure was separately resolved by read-only fetch and strict preflight retry.

Do not omit verifySensors, fabricate PASS, enable artificial sensors, alter installed CLI/registry, or relocate execution solely to evade the gate. Applicable sensor failure, absent manifest and inconclusive evidence must remain blocking.

The approved registry-first design expressly requires escalation when CLI authority must change. Recommend separately approving a minimal CLI/R8 admission reconciliation with actual regression tests and explicit non-PASS evidence, then revalidate/re-admit this plan. No routing or fingerprint caching changes are needed for this blocker. No implementation has begun and there is no R2-A candidate to install or trial yet.
