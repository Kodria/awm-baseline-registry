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
`awm job routing-report --json` read-only. V1 remains unrouted unless explicitly
opted in and never claims routing savings.
