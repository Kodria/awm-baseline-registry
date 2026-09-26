# Compact lifecycle admission v1

Both `compact-slices/v1` and `compact-slices/v2` are supported only through the
CLI's current contract. V2 adds a semantic `implementerProfile` per slice; a
missing/unsupported routing contract or policy readiness blocks v2; it never
changes an explicitly selected `awm-routed` plan to v1. A new `proveedor-nativo`
plan uses v1 and needs no matrix. The currentness, sensors, journal and custody order
below remains unchanged.

The CLI is the sole mechanical parser, validator, digester and admission authority. This
reference is the single normative lifecycle admission consumer contract. Consumers load it
before work; they must not reproduce a second parser or select plans by filename/checkboxes.
The active plan path comes from admitted durable state or an explicit owner/controller
assignment; ambiguity blocks instead of picking the newest file.

## Normative admission protocol

- Run `awm plan admit PLAN_PATH --provider TARGET --cwd . --require-current --verify-sensors --json` before first dispatch, start/resume, and every lifecycle transition.
- Only exit 0 with `state: admitted` and the current `planDigest` permits work; every other result blocks with zero dispatch.
- `migration-required`, `invalid`, and `unsupported` never select a historical, Task/Tracks, batch, or legacy execution route.
- Missing command/strict support, stale or unverifiable consumed CLI/registry contracts, or non-pass sensor evidence blocks; show named components and actionable diagnostics, never bypass.
- Interactive execution requires compact admission but not a journal. Unattended `proveedor-nativo` execution with no journal on its branch is admitted with `journal: not-required` and runs as one native provider session; a journal is the explicit opt-in to durable custody. Unattended `awm-routed` execution always requires a healthy schema-2 journal bound to the current plan identity before dispatch.
- Once a journal exists, a corrupt or stale journal blocks; initialization is an explicit separately authorized `awm watch --init --plan PLAN_PATH`, only when absent, never an admission side effect.
- Unattended admission also requires the controller posture: add `--controller-autonomy approval-free` when the provider session runs without approval prompts.
- Before selecting resumed work reconcile current plan, journal, Git HEAD/diff, active jobs, tests, sensors, and independent verdict obligations; durable current evidence wins over chat or checkboxes.
- After any plan change revalidate and re-admit under the new CLI-derived plan identity; old-digest verdicts cannot satisfy current obligations.
- Full relevant-context fallback for security/robustness, root-configuration, public-contract, or uncertain cross-cutting impact retains the compact state machine and every quality gate.
- Completion requires distinct implementer, specification-reviewer, and code-quality-reviewer identities with both current clean verdicts, files, tests, sensors, requirements, and plan identity reconciled.
- Local slice completion never replaces TDD, final review, global Track A and Track B QA, documentation, retro, sensors, verification, or finishing gates.
- Use the same contract on Antigravity, OpenCode, Claude Code, Codex, Cursor, and Copilot through native capabilities; unsupported or unverified required capability blocks, never inferred parity.
- Read the sole normative Evidence Capsule v1 reference before role dispatch; do not fork its shape, retrieval limits, allowlists, or ephemeral retention rules.
- Expose fallback, degradation, migration, retry, and invalidation in bounded durable evidence; persist IDs/verdicts/provenance, never prompt/source bodies, secrets, credentials, or unrestricted responses.
- Reconcile plan identity, slice, role, command, and verdict before retry to reuse the durable obligation rather than duplicate active work.
- Link material plans, checkpoints, commits, and review/acceptance evidence from issue #126; R1 is not available until installed cross-repository acceptance and #148 migration dry run pass.

Use native provider identity (`antigravity`, `opencode`, `claude-code`, `codex`, `cursor`,
`copilot`) as TARGET. R1 introduces no model policy, profiles or parallel tracks. Admission
is observational: no plan/journal writes, models, dispatch or publication. An existing
journal is never overwritten; binding/recovery uses the CLI's explicit reviewed path.

The state machine remains `pending → implementing → spec-review → quality-review → complete`.
Journal registration/verdict CAS, fencing, heartbeat, durable verification and `awm job gate`
remain mandatory when journal-first applies; admission never substitutes for those obligations.
Read `../../subagent-driven-development/references/evidence-capsule-v1.md` before role dispatch,
unchanged. Read `../../setup-sensors/references/registry-closure-policy-r8.md` for the sole
normative registry sensor opt-out exception; opt-out evidence must be versioned and deliberate.
