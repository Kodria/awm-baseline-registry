# R2-B native routing acceptance

Five distinct evidence levels. They are never merged into a single verdict, and a
stronger label is never inferred from a weaker one.

## 1. Structural

`CMD-R2B`, `CMD-COMPACT`, `CMD-CAPSULE`, `CMD-R2A` and `CMD-PORTABLE` read the
shipped contract text: one semantic `implementerProfile` per v2 slice with no
concrete model or vendor, visible fail-closed v1 fallback, the single
`references/model-routing-v1.md` consumer, applied-ack-before-dispatch, mismatch
and unknown-outcome custody, and the six targets consuming one protocol. Adversarial
cases reject injected `gpt-5.6-sol` / `claude-opus` strings and any `target=model`
mapping. This level executes no CLI and proves no runtime behaviour.

## 2. Compiled

The compiled CLI is proven in its own repository, not here. What this registry
pins instead is the immutable provenance it consumes: candidate version, exact
published tag SHA and protocol digest. A candidate whose `--version`,
`rev-parse HEAD` or `protocolDigest` disagrees with the declared values fails
closed; nothing is derived at run time.

## 3. Installed

`CMD-INSTALLED` (`tests/r2b-routing-cli-acceptance.mjs`) runs two real, unmodified
published binaries — never mocks, and with no skip-on-missing-binary path. It
requires `AWM_R2B_CLI_BIN`, `AWM_R2B_CLI_SOURCE`, `AWM_R2B_CLI_SHA`,
`AWM_R2B_CLI_VERSION`, `AWM_R2B_PROTOCOL_DIGEST`, `AWM_R2B_OLD_CLI_BIN` and
`AWM_R2B_OLD_CLI_VERSION`, and it asserts that the candidate advertises both
`compact-slices/v1` and `compact-slices/v2`, that v1 resolves to the un-routed
`not-required` fallback, that v2 without current approval and receipt is
zero-dispatch `blocked` with actionable diagnostics, that absent policy/receipt
stays visibly not ready, that no journal is created by these read-only negatives,
and that the older published control is never misrepresented as v2-compatible.

`CMD-INSTALLED` now also exercises the **positive** approval path, which was
previously unreachable from here. `model-policy digest` discloses the canonical
digest the candidate itself computes, so the registry obtains it without ever
calculating one — the second parser stays forbidden and unwritten. The added
case proves, against the real binary: policy digest → `approve` accepted →
capability receipt digest → `capabilities approve` accepted → `status` reporting
`approved` / `current` → `plan resolve` returning a routed envelope per semantic
profile, with the full role resolving to the approved full capability; then
approved effort degradation keeping its routed model and naming
`effortOverride`; then withdrawal through `--replace-digest` recording its
predecessor and the withdrawn mapping ceasing to resolve. A mismatched digest is
still refused on both paths and leaves nothing behind, and no dispatch custody
exists at any point, because resolving is not dispatching.

The capability receipts in that case are **authored by the test**. Their
capability claims are fixture input, not attestation: this level proves the CLI
mechanism, never runtime behaviour. Nothing here may be read as evidence for
level 5.

The installed acceptance also invokes `model-policy setup` for both Codex and
Claude Code without an approved policy. It requires explicit `policy-absent`,
no inference and no token-usage claim. This proves the enrollment entrypoint
exists in the paired published CLI, not that native dispatch works.

Observed locally on 2026-09-18 with candidate `agentic-workflow-manager` 9.9.0
(tag `v9.9.0`, commit `0e0dea21aef31895c34954dca65b80ef2da44f90`, protocol digest
`aecfd11414878b19b3456775a576ac2423f04e67a9b2aab0c4075c7c12fbe07a`) against the
unmodified published 9.8.0 control: **PASS**. Re-observed on 2026-09-19 with
candidate 9.10.0 (tag `v9.10.0`, commit
`9bbb5bd8a693e8830386f382154a4ae999d24733`, same protocol digest) against the
same 9.8.0 control, including the new positive-path case: **PASS**. The added
case is falsifiable rather than merely green — run against published 9.9.0 it
fails with `unknown command 'digest'`, because that release cannot complete the
path at all. Note 9.9.0 is not a valid negative control for v2: it was the first
release to advertise `compact-slices/v2`, so the control stays 9.8.0. Local
observation is not the publication gate below.

## 4. Public tag

Both `validate.yml` and the tag-producing job in `auto-tag.yml` run `CMD-R2B`,
`CMD-INSTALLED` and `scripts/r2b-release-gate.mjs --mode published` before a
registry tag is pushed. The wiring guard is proven by mutation against the four
ways it was previously evaded: a commented-out invocation, a step-level `if:`,
`continue-on-error` in any spelling, and moving the acceptance into another job
that merely `needs:` the tag job. An earlier revision of this document claimed a
mutation guard that could not fail; that claim was false and the guard was
rewritten to make it true.

The current registry floor `minCliVersion` is `9.12.0`, required by the native
machine-enrollment guidance and paired with certified tag `v9.12.0` at
`b3e940f823a6167eab710034c1189e51acaba371`. As of
Kodria/agentic-workflow#164 it is a **floor and nothing else**: the oldest CLI
that can consume this content. It no longer tracks the published CLI. Three
separate facts used to be carried by that one number, and the conflation made
every CLI patch release turn this repository's CI red until two values were
bumped by hand:

- **The floor** (`minCliVersion` in `awm-registry.json`) — the compatibility
  minimum. Moves only when the content starts requiring something an older CLI
  cannot do.
- **The certified pair** (`cli-certification.json`) — the exact published
  version, its public commit SHA and its observed protocol digest, which
  `CMD-R2B` and the release gate rest on. Declared, never derived at run time.
  Moves only on re-certification.
- **The version under test** — resolved from npm at run time and installed by
  both CI surfaces. Not declared anywhere, because it is not a claim: it is
  whatever a user installing today gets. It must satisfy the floor, and CI
  proves that with `cli-certification.mjs --assert-floor` before installing it.

Installing at the floor is what broke: consumed contract currentness compares
the installed CLI against what is actually published, so a CLI installed at the
floor reported *itself* stale the moment a newer one existed, and admission
blocked with `ADMISSION_CURRENTNESS_BLOCKED` before any diagnostic these
acceptances assert could appear.

**This level has now happened: PASS.** Registry tag **`v4.3.0`** was pushed at
commit `e17f5e303d2ea5ef060e830ca61abae1f0f867b3`, by the tag-producing job and
only after `CMD-R2B`, `CMD-INSTALLED` and
`scripts/r2b-release-gate.mjs --mode published` all ran green against the
published candidate. The gate reported `floorUpdateRequired: false` — the field
was named that at the time, and reported that the declared floor equalled the
observed published CLI. That equality is no longer required, and the field is
now `floorSatisfied`: the observed published CLI must clear the floor, not match
it. The level-4 claim below is bound to the pair actually observed then and is
not restated by the rename. The current candidate requires its own release tag
and green release job before a new level-4 PASS can be claimed.

The proof is that the published tag SHA equals the candidate checkout, which is
what a local fixture tag can never establish: `git rev-list -n1 v4.3.0` is
`e17f5e30…`, and `awm-registry.json` at that tag declares `minCliVersion`
`9.10.0`. This level is bound to that exact pair; a later tag is a different
claim and must record its own.

Note what this level does and does not carry. It says the registry published
under a gate that actually ran. It says nothing about native runtime behaviour —
level 5 below remains untested, and no amount of public-tag evidence moves it.

## 5. Native runtime

**UNTESTED.** No real native dispatch has been recorded in this registry
acceptance for Codex or Claude.
Every verdict above comes from contract text, fixtures and CLI-level negatives;
none of it certifies that a native runtime actually honoured a routed envelope.

This is corroborated mechanically rather than only asserted: `awm plan admit`
on 9.9.0 resolves `claude-code` capabilities with `modelOverride`,
`effortOverride`, `observedModelEvidence` and `nativeSubagents` all reported
`unverified`, while only `interactiveExecution`, `unattendedController` and
`durableResume` are `supported`. Fixture evidence is never native certification,
and an unverified capability never satisfies routing.

## Operating the acceptance

Approve a routing policy explicitly — the installer never creates, approves or
replaces one. Requiring `--expected-digest` keeps approval an operator act, and
since CLI 9.10.0 the operator can observe the digest first instead of guessing
it. Read it, decide, then approve:

```
awm model-policy digest --file <policy.json> --cwd <repo> --json
awm model-policy approve --file <policy.json> --scope user \
  --expected-digest <sha256> --cwd <repo> --json

awm model-policy digest --file <receipt.json> --cwd <repo> --json
awm model-policy capabilities approve --file <receipt.json> \
  --expected-digest <sha256> --cwd <repo> --json

awm model-policy status --provider codex --runtime-kind native \
  --runtime-version <v> --account-scope-digest <sha256> --cwd <repo> --json
```

`digest` is read-only: it dispatches on the declared `schema`, so one command
serves both `model-policy/v1` and `routing-capabilities/v1`, and it approves
nothing. It never consults the clock, so receipt freshness stays the approval
path's business. This is why the registry floor is at least 9.10.0: on 9.9.0 neither
approval path could be completed by anyone outside the CLI's own test suite, and
`capabilities approve` could not be completed at all.

The commands above exercise the legacy v1 path only. A v1 capability
attestation carries `expiresAt` and therefore needs re-digesting and
re-approval when it expires; it is not the new machine-enrollment procedure.

## V2 machine enrollment

For CLI 9.12.0 and newer, approve the policy once, then inspect each
machine/provider deliberately:

```
awm model-policy setup --provider codex --cwd <repo> --json
awm model-policy setup --provider claude-code --cwd <repo> --json
```

Setup reports missing selections and machine/account/config state. It does not
dispatch inference or invent a receipt. Codex needs a real completed parent/child
turn followed by `awm model-policy capture --provider codex --runtime-kind native
--parent-thread-id <id> --child-thread-id <id> --cwd <repo> --json`. Claude Code
needs installed SubagentStart/Stop hooks and a named `awm-*` agent with an
explicit model ID; its real Stop event supplies the observation. Follow the
remedy returned by setup, then check setup again. `doctor` and `preflight` may
point to setup but do not run paid probes in normal daily work.

Unlike v1 `expiresAt`, a v2 native receipt has **no 24-hour renewal**. It is
rechecked against runtime binary/version, account, model configuration and the
approved selection; relevant drift invalidates only the affected evidence.
Unverified full capability stays visibly blocked for that obligation. An
unattended run records fallback, `PROVENANCE_MISSING` and unknown acceptance in
`awm job routing-report --json`; it does not claim token savings without usage
evidence. The native acceptance here remains **UNTESTED** until real provider
dispatches on the target machines are observed. A fixture or JSON approval
cannot change that label.

## Legacy installed acceptance

`CMD-INSTALLED` now exercises **both** paths on the real published binary: the
fail-closed one (a mismatched `--expected-digest` rejected, nothing left behind,
no dispatch custody created) and the positive one described in level 3.

A small routed run — one `mechanical` slice and one `integration` slice carried
through implementer, specification review, code-quality review and global QA —
remains the acceptance that has NOT been performed, because it requires the
native runtime acceptance below. Note what that run needs and why no sequence of
hand-typed commands substitutes for it: the protocol is
`plan resolve` → `job routing-reserve` → **supervisor applied acknowledgement** →
native invocation → `job routing-observe`. The applied ack comes from the
supervisor's own generation, so an operator issuing those commands by hand is
simulating the component under test. That is the shape of evidence this document
refuses everywhere else, and it is refused here too.

**Rollback.** Registry content is delivered by immutable tag, so rollback is
pinning the previous tag: consumers move back with `awm update` against the
prior `vX.Y.Z`, and `minCliVersion` returns to the floor that tag declared. No
published tag is ever mutated or deleted to undo a release, and a routing policy
is withdrawn by the operator replacing it with `--replace-digest`, never by the
installer.

## R8 sensor closure

Every declared sensor in this registry is explicitly disabled, so the local
verdict is `not_certified` and is preserved exactly — it is never relabelled
`pass`, and it never waives release proof. Versioned R8 evidence for the
candidate SHA runs in both `validate` and `auto-tag` before registry content can
close; `fail`, `inconclusive` or missing CI evidence can never receive this
exception.
