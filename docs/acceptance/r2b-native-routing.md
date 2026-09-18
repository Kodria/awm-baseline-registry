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

Observed locally on 2026-09-18 with candidate `agentic-workflow-manager` 9.9.0
(tag `v9.9.0`, commit `0e0dea21aef31895c34954dca65b80ef2da44f90`, protocol digest
`aecfd11414878b19b3456775a576ac2423f04e67a9b2aab0c4075c7c12fbe07a`) against the
unmodified published 9.8.0 control: **PASS**. Local observation is not the
publication gate below.

## 4. Public tag

Both `validate.yml` and the tag-producing job in `auto-tag.yml` run `CMD-R2B` and
`CMD-INSTALLED` before a registry tag is pushed; removing either invocation from
either surface fails a scoped mutation test. The registry floor `minCliVersion`
is `9.9.0`, the first published release advertising `compact-slices/v2`, taken
from actual publisher output rather than an expected number.

**This level has not happened yet.** No registry candidate has been published for
R2-B, so the public-tag evidence is BLOCKED, never a simulated PASS. A local
fixture tag is not public proof: the exact published tag SHA must equal the
candidate checkout.

## 5. Native runtime

**UNTESTED.** No real native dispatch has been executed on Codex or on Claude.
Every verdict above comes from contract text, fixtures and CLI-level negatives;
none of it certifies that a native runtime actually honoured a routed envelope.

This is corroborated mechanically rather than only asserted: `awm plan admit`
on 9.9.0 resolves `claude-code` capabilities with `modelOverride`,
`effortOverride`, `observedModelEvidence` and `nativeSubagents` all reported
`unverified`, while only `interactiveExecution`, `unattendedController` and
`durableResume` are `supported`. Fixture evidence is never native certification,
and an unverified capability never satisfies routing.

## R8 sensor closure

Every declared sensor in this registry is explicitly disabled, so the local
verdict is `not_certified` and is preserved exactly — it is never relabelled
`pass`, and it never waives release proof. Versioned R8 evidence for the
candidate SHA runs in both `validate` and `auto-tag` before registry content can
close; `fail`, `inconclusive` or missing CI evidence can never receive this
exception.
