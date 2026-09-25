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
`proveedor-nativo` dispatches natively without `awm plan resolve`; passing `--opt-in-v1` for it is blocked with `ROUTING_DISPATCH_MODE` and zero dispatch, so never pass it; historical
v1 plans without a dispatch header retain their old opt-in behavior and never
claim routed profile savings by default.

## Machine enrollment

At a deliberate machine/provider setup moment, run `awm model-policy setup --provider
<target> --json` and follow its named pending selections. `doctor` and `preflight`
may point to this command when an approved mapping lacks evidence; neither
starts inference or modifies the policy. The v2 native receipt has no 24-hour
renewal: unchanged binary/version, account, model configuration and approved
selection remain current. A change invalidates the affected evidence, and a
new native dispatch is required only for the changed selection. Normal daily
work must not run a paid probe or rewrite a receipt to refresh its timestamp.
When evidence is covered locally, passive doctor/preflight labels it as such;
the current machine scope is rechecked at routed admission and dispatch.
Setup has no active-probe flag: the currently available native APIs cannot
create an attested child on behalf of setup. An ordinary child dispatched once
per missing selection supplies the initial proof.
The v1 approval path remains distinct and retains its existing expiry.

Claude native enrollment requires named `awm-*` custom agents with explicit
full model IDs at runtime-default effort and installed SubagentStart/Stop hooks;
Codex enrollment uses a recent native parent/child turn through `awm
model-policy capture`. A catalog or candidate JSON is never native dispatch
proof. If setup reports UNTESTED, keep the affected optimized route closed and
show the reason; do not invent a receipt or silently choose another model.

## Routed dispatch and recovery

For a routed obligation, request a current CLI resolution for the native
runtime, role and exact slice when local. A blocked result means zero dispatch.
Freeze its envelope, reserve the logical lineage through the current generation,
and wait for the supervisor's applied ack before invoking the native mechanism
with the resolved model/effort. Persist bounded native agent identity and
observed selection afterward. A mismatch blocks the affected obligation; an
unknown dispatch outcome requires custody reconciliation before any redispatch.
For Codex v2, pass `{"parentThreadId":"<native-parent-id>"}` as the bounded
observation file and the actual child thread ID as `--native-agent-id`. For
Claude v2, dispatch `envelope.nativeAgentType`, wait for its Stop hook, then
pass `{}` and the actual hook agent ID. The CLI verifies a post-reservation
native event and seals the observation before the supervisor can activate the
attempt. A missing or invalid proof becomes a durable `PROVENANCE_MISSING`
incident; it cannot be replaced by agent-authored `observed` JSON.
Emission receipts are not applied acks. Inputs are exact CLI protocol values;
the plan and consumer never select a model, effort, or vendor mapping.

If `envelope.nativeAgentType` is present, dispatch that exact named Claude
agent type; dispatching a generic Claude agent with only a model parameter is
not covered by the certificate. A missing optimized selection, provider
rejection, or native mismatch may take only a separately verified full-capability
fallback returned by the CLI. If full capability is also unverified, block only
the affected obligation and record the reason-code in the durable routing report
and unattended alert; never abort unrelated work or silently claim savings.
An agent-authored positive observation alone cannot prove native acceptance.
Read `routing-report` after an unattended run: its `selections` rows separate
configured from native-reconciled accepted selection, and an unknown field
remains `unknown`. A Claude transcript may report a model ID, but this does
not verify token savings; Codex backend model and token usage remain unknown.
Machine-wide runtime/account/config drift enters visible supervisor custody
because it invalidates the full fallback in that same scope as well; use the
named setup diagnostic before resuming routed dispatch.

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
