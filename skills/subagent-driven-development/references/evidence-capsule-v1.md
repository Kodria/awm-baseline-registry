# Evidence Capsule v1

This is the sole normative capsule definition. Every SDD and final-QA controller MUST read
this file before a role dispatch. Consumers link here; they do not copy its field,
allowlist, retrieval, or fallback tables into another skill.

## Stable Contract and Capsule Shape

The byte-stable role contract always precedes this exact marker. Dynamic evidence begins
after it. One dispatch has exactly one capsule and preserves this exact field order:

```text
## Evidence Capsule v1
role: <declared role or lens>
scope: <task ID or branch-level QA scope>
requirements: <exact clauses with stable IDs, or n/a>
surfaces: <relevant files/components and declared dependencies>
sources: <authoritative repository paths/commits/commands>
evidence: <role-allowed report, diff/hunks, tests, sensors, or design artifacts>
retrieval history: <none, or ordered source + reason entries>
fallback: <selective, or full-context: exact-trigger>
```

`requirements`, `surfaces`, `sources`, and `evidence` preserve authoritative plan/diff
order. Retrieval history preserves request order. A byte cap MUST NOT truncate a required
clause or finding.

## Role Allowlists

| Role | Initial evidence | Explicitly excluded by default |
|---|---|---|
| Implementer | One cohesive task/slice, exact clauses, files, dependencies, required skills/design, verification | Unrelated plan tasks and unrelated branch history |
| Specification reviewer | Exact task clauses, implementer report, task diff, requirement IDs | Unrelated plan tasks and controller narration |
| Code-quality reviewer | Task diff, tests, sensors, public/robustness constraints | Full plan and implementer chain-of-thought |
| Track A fidelity | All requirement IDs/clauses, branch diff, verification evidence | Process narration and unrelated historical context |
| Track B lens | Branch diff/hunks and lens-relevant evidence | Complete plan; unrelated requirement prose |
| Design fidelity lens | Affected design artifacts, implementation evidence, relevant diff | Unaffected screens and complete product plan |

Track B has no complete plan in normal initial input or normal selective retrieval. Its
design-fidelity lens is conditional only when its existing UI/design-artifact gate applies.

## Retrieval and Full-context Fallback

When evidence is insufficient, the first response is exactly:

```text
status: NEEDS_CONTEXT
missing-source: <authoritative path, commit, command, or artifact>
reason: <why the role cannot reach its verdict>
```

The controller adds only named authoritative sources, records each source plus reason in
`retrieval history`, and re-dispatches the same role once. A second request uses
`fallback: full-context: second-context-request`, never an unbounded third selective
retrieval. Select full context before first dispatch for one of these exact triggers:

```text
ambiguous
security-or-robustness
root-configuration
public-contract
uncertain-cross-cutting-impact
second-context-request
legacy-metadata
malformed-or-missing-evidence
```

Missing capsule metadata takes `full-context: legacy-metadata`. Missing, malformed, or
unsourced required evidence fails loudly and takes `full-context: malformed-or-missing-evidence`.
The visible trigger is mandatory; no role may silently infer, omit, or invent evidence.

## Portability, Privacy, and Measurement

Codex and Claude Code receive the same provider-neutral stable contract and capsule; use
the active runtime's native dispatch mechanism. If unavailable, report the limitation and
take the safe full-context path. Capsules and unrestricted worker responses are ephemeral:
do not create telemetry stores or persist prompt/source bodies, secrets, credentials, or
unrestricted model responses.

Report prefix bytes, capsule bytes, retrieval additions, fallback additions, dispatches,
provider usage, and owner-reported quota separately. Provider usage remains `unobservable`
unless the provider supplies it. Structural bytes are not billed-token, cost, or quota savings.
