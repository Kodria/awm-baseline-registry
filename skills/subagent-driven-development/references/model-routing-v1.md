# Model routing consumer v1

Consumers query `awm model-policy contract --json` and `awm model-policy status`
with target, runtime kind/version, and account scope digest. For compact v2,
the contract must advertise `compact-slices/v2` and status must report approved
policy and current capability; otherwise zero dispatch. They never parse policy
JSON, calculate digests, or resolve models themselves.

For compact v2, call `awm plan resolve` for the exact role and local slice. A
blocked result means zero dispatch. Send its frozen envelope to
`awm job routing-reserve`, wait for the supervisor applied acknowledgement,
then invoke the native runtime. Record the native observation through
`awm job routing-observe`; unknown outcomes require custody recovery. Use
`awm job routing-report --json` read-only. A v1 plan declaring
`proveedor-nativo` remains unrouted even if `--opt-in-v1` is requested; historical
v1 plans without a dispatch header retain their old opt-in behavior and never
claim routed profile savings by default.

## Routed dispatch and recovery

For a routed obligation, request a current CLI resolution for the native
runtime, role and exact slice when local. A blocked result means zero dispatch.
Freeze its envelope, reserve the logical lineage through the current generation,
and wait for the supervisor's applied ack before invoking the native mechanism
with the resolved model/effort. Persist bounded native agent identity and
observed selection afterward. A mismatch blocks the affected obligation; an
unknown dispatch outcome requires custody reconciliation before any redispatch.
Emission receipts are not applied acks. Inputs are exact CLI protocol values;
the plan and consumer never select a model, effort, or vendor mapping.

Every full role resolves as its own role: `specification-reviewer`,
`code-quality-reviewer`, `final-reviewer`, `architecture`, `track-a-qa`,
`track-b-qa`, and `controller`. Controller-owned documentation, retro, and
finishing use the registered full controller selection plus a distinct role
receipt; they do not fabricate child dispatches. Escalation requests current
lineage/policy and consumes only the next bounded failed implementation attempt.
Environment, currentness, persistence, and administrative failures repeat only
their affected gate. Preserve R2-A ledger collection, frozen-report
reconciliation, distinct QA lenses, and coherent group correction.

Generation and plan identity never reset an implementation budget. A resolved
selection includes its approved effort; omitted effort blocks rather than
silently defaulting. Unverified capability never satisfies routing readiness.
R2-A ledger/review evidence remains current after every correction, and QA, documentation, retro, and finishing keep their distinct role obligations.

The six portable targets are `claude-code`, `codex`, `opencode`, `cursor`,
`copilot`, and `antigravity`. Documented native control is not native acceptance:
an unsupported target blocks, or follows only a current CLI-resolved approved
degradation. Never turn this portable consumer into a provider configuration.
