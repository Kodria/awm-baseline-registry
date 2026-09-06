# Declared documentation orchestrator

## Requirements

- **R1.1** — WHEN `awm-documentation-registry` is configured, THE registry SHALL declare `docs-system-orchestrator` through the supported `awm-registry.json` orchestrator contract.
- **R1.2** — THE documentation registry SHALL require `agentic-workflow-manager` 8.3.0 or newer, the first published release that composes declared orchestrators.
- **R1.3** — THE documentation declaration SHALL use `the session starts with a request to create, improve, initialize, format, or maintain project documentation, documentation templates, or standalone architecture diagrams` as `appliesWhen`, without a trailing period, and `none` as `terminatesTo`.
- **R1.4** — WHEN the documentation declaration is installed with a compatible published CLI, THE CLI SHALL resolve its name to the existing skill and verify that the orchestrator is composed.
- **R2.1** — THE baseline `using-awm` skill SHALL NOT hardcode `docs-system-orchestrator` or any other external registry's skill as part of its built-in routing.
- **R2.2** — IF a bare skill name is cited in the built-in `## Orchestration` section, THEN THE baseline contract test SHALL require that name to resolve to a local `skills/<name>/SKILL.md`.
- **R2.3** — WHEN a non-local bare skill name is introduced into the built-in orchestration section, THE contract test SHALL fail under an explicit mutation proof.
- **R2.4** — THE baseline release SHALL bump `using-awm` from 1.4.1 to 1.4.2 and the `dev` bundle from 3.9.2 to 3.9.3 in both metadata owners.
- **R3.1** — THE baseline `AGENTS.md` SHALL describe `agentic-workflow#12` as resolved by PR #19 rather than pending work.
- **R4.1** — WHEN publishing the change, THE documentation declaration SHALL be merged and released before the baseline hardcode is removed.
- **R4.2** — IF the documentation declaration cannot be verified against the published CLI, THEN THE baseline removal SHALL NOT be presented as ready to merge.

## Context and root cause

`docs-system-orchestrator` is a real skill owned by the opt-in
`awm-documentation-registry`. Its registry was extracted at `v1.0.0` before declared
orchestrators existed and still publishes only `minCliVersion: 2.0.0`. The baseline
therefore retained an older prose-level route in `using-awm`, even after
registry-declared orchestration shipped in AWM 8.3.0.

The hardcode is now the wrong ownership boundary: every baseline session receives a
route to an optional external skill, while the owning registry publishes no declaration.
AWM 9.7.0 additionally verifies that a declared orchestrator name resolves to a skill in
a configured safe registry, closing the runtime class represented by
`agentic-workflow#110`.

## Design

### Documentation registry

Update `awm-registry.json` to require CLI 8.3.0 and declare exactly the three supported
fields:

```json
{
  "minCliVersion": "8.3.0",
  "orchestrator": {
    "name": "docs-system-orchestrator",
    "appliesWhen": "the session starts with a request to create, improve, initialize, format, or maintain project documentation, documentation templates, or standalone architecture diagrams",
    "terminatesTo": "none"
  }
}
```

The name resolves to the existing `skills/docs-system-orchestrator/SKILL.md` directory.
The trigger preserves documentation ownership without capturing general product discovery,
system design, or development work. `none` matches the current termination behavior: after
the delegated documentation skill finishes, the router stops and waits for a new user
request.

The additive entry-point behavior bumps the `docs` bundle from 1.0.0 to 1.1.0 in
`catalog.json` and `bundles/docs/bundle.json`. The orchestrator skill body is unchanged, so
its own frontmatter version does not move. The registry needs a new release tag after merge
because its current only published tag is `v1.0.0`.

### Baseline registry

Remove only the sentence assigning documentation to `docs-system-orchestrator`; declared
orchestrators remain considered before the built-in product/development pair through
`references/declared-orchestrators.md`.

Extend `tests/r9-declared-orchestrators-contract.test.mjs` so bare code-formatted skill
names in the built-in `## Orchestration` section must have a corresponding local skill
directory. Path references are not skill names and are excluded. The test includes a
mutation that inserts a fictional external skill and proves the assertion fails. The
existing R9 workflow wiring already runs this file in validation and the release-producing
job, so no workflow change is needed.

Because `using-awm` changes, bump its frontmatter to 1.4.2 and the owning `dev` bundle to
3.9.3 in both `catalog.json` and `bundles/dev/bundle.json`. Add the corresponding changelog
entry. Update the `AGENTS.md` portability lesson to state that `agentic-workflow#12` was
resolved by agentic-workflow PR #19.

## Delivery sequence

The work produces two independently reviewable PRs:

1. Merge the documentation-registry PR and publish its release tag.
2. Re-run `awm context orchestrators --verify docs-system-orchestrator` against that
   released registry with a compatible published CLI.
3. Merge the baseline-registry PR that removes the fallback hardcode.

This ordering avoids a window where documentation has neither the legacy route nor the
declaration owned by its registry.

## Verification

- Run the documentation declaration against published AWM 9.7.0 in an isolated `AWM_HOME`;
  require `awm context orchestrators --verify docs-system-orchestrator` to exit 0.
- Mutate the declared name to a missing skill and require the same command to exit 2 with
  the declaration omitted, demonstrating the runtime gate is effective.
- Run the R9 contract before the baseline fix to observe failure, then after the fix to
  observe success.
- Mutate the built-in orchestration section with a nonexistent bare skill and require R9
  to fail with an actionable resolution message.
- Run the baseline's full Node test suite, skill-version gate, portability validator, and
  project sensor gate before completion.

## Non-goals

- Rewriting `docs-system-orchestrator` as an `awm: process-model`.
- Implementing the process-extraction work still tracked by `agentic-workflow#113`.
- Redesigning the documentation routing table or delegated skills.
- Adding a new CI framework to the documentation registry.
- Changing CLI declared-orchestrator behavior.
