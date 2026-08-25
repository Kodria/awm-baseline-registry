# Context Kernel v1

This file is the sole normative Context Kernel v1 definition. Consumers MUST read it
before creating, migrating, maintaining, selecting, retrieving, or reviewing context.
No consumer may reproduce these rules or tables; it links to this reference instead.

## Protected Region

Each declared kernel file contains exactly one ordered pair:

```markdown
<!-- AWM:CONTEXT-KERNEL:START v1 -->
<!-- AWM:CONTEXT-KERNEL:END v1 -->
```

Every unconditional rule inside has one unique `<!-- awm-context:CTX-... -->`
anchor. No automated maintenance edits or deletes this region. Only a reviewed,
owner-approved change may alter a protected region.

## Context Index v1

The project-owned `.awm/context/index.json` is JSON with exactly `schema`,
`kernelFiles`, `maxFixedBytes`, and `entries`. Its schema exactly 1 declaration
means the published parser is active.

`kernelFiles` is a non-empty array of unique root context-file names.
`maxFixedBytes` is a positive integer. Each entry has exactly `id`, `tier`,
`path`, `anchor`, and `when`:

| Field | Constraint |
| --- | --- |
| `id` | Unique `CTX-...` identifier. |
| `tier` | `kernel` or `selective`. |
| `path` | Normalized repository-relative regular-file path. |
| `anchor` | Unique marker without `<!--` or `-->`; it occurs exactly once. |
| `when` | Non-empty applicability evidence. |

A `kernel` entry points to a declared kernel file and its anchor is inside the
protected region. A `selective` entry is not inside that protected region. Any
absent, malformed, duplicate, or inconsistent index is invalid and preserves
the visible full-context path until a reviewed repair is complete.

## First Migration

Inventory every pre-migration normative rule before reducing source text. Map each
source rule to exactly one retained kernel/card ID in
`docs/awm/context/migration-v1.md`. The old and new ID inventories must compare
equal. Removing an ID requires explicit owner approval and a recorded reason.

The migration table records the legacy block ID, source range/hash, Context ID,
destination, and rationale. It maps every contiguous non-empty legacy block,
not only rules the migrator happens to remember. A partial migration never
silently regenerates metadata or authorizes pruning.

## Selection and Retrieval

The initial Evidence Capsule v1 carries applicable context ID, repository-relative
path, anchor and role evidence; it excludes complete card bodies by default. A
role may make one native file-read batch inside its existing invocation.
Retrieval history records each ID, source, reason and result. A second batch is
forbidden and selects full context.

Selection requires evidence that `when`, surface, and requirements apply. If
that evidence is incomplete, the controller selects full context before dispatch.
Codex and Claude Code use the same IDs, history, triggers, evidence, and
verdicts; only their native file-read mechanism differs. Native reads do not
create a new model invocation.

## Full-context Triggers

Any of these conditions selects the visible `full-context: <trigger>` result:

```text
second-context-request
missing-or-invalid-indexed-source
selection-uncertain
security-or-robustness
root-configuration
public-contract
uncertain-cross-cutting-impact
legacy-metadata
malformed-or-missing-evidence
```

Legacy metadata is advisory, keeps complete context, and never blocks normal
full-context quality gates. Partial or invalid metadata is blocking for
selective handoff and requires a reviewed repair.

## Boundaries

This contract uses existing native reads only and introduces no new service,
dependency, persistent context store, or model call. Context maintenance may add a
card and index entry after review; it cannot infer deletion authority.
