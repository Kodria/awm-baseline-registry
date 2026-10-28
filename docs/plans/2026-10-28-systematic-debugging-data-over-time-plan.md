# systematic-debugging data-over-time (#80) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `subagent-driven-development`
> (recommended) or `executing-plans` to implement this plan task-by-task. Steps
> use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Insert the issue #80 Phase-1 step 6 and “Before Concluding Not a Code Defect” checklist into `systematic-debugging`, with an executable contract and registry version bumps.

**Architecture:** Content-only registry change. Normative English prose is the issue #80 diff (verbatim). Design: `docs/plans/2026-10-28-systematic-debugging-data-over-time-design.md`. TDD via r19 contract before skill edit.

**Tech Stack:** Markdown skill, Node test contracts, npm scripts, GitHub workflows, `bundles/dev` + `catalog.json`.

**Change Record:** ninguno — content registry; release via conventional-commit PR title + auto-tag

**Criterios de aceptación:**
- Skill Phase 1 includes step 6 data-over-time after Trace Data Flow → agents reconstruct timeline / snapshot vs live before blaming “just data”
- Checklist section appears before “No Root Cause” → cannot conclude not-a-code-defect with unchecked boxes
- `npm run test:systematic-debugging-data-over-time` and `npm run test:version-bumps` green

**Modo de ejecución:** interactivo

**Modo de despacho:** proveedor-nativo

Dispatch decision: owner did not select AWM routing → `proveedor-nativo` / `compact-slices/v1`.

<!-- AWM:COMPACT-SLICES:START v1 -->
{
  "schema": "compact-slices/v1",
  "planId": "systematic-debugging-data-over-time",
  "requirements": ["R1", "R2", "R3", "R4", "R5"],
  "sources": [
    {
      "id": "SRC-DESIGN",
      "path": "docs/plans/2026-10-28-systematic-debugging-data-over-time-design.md",
      "locator": "## Requirements",
      "fact": "R1–R5 define step 6, checklist gate, code-defect candidate rule, version 1.2.0 + dev bundle bump, and r19 contract + workflow wiring."
    },
    {
      "id": "SRC-SKILL",
      "path": "skills/systematic-debugging/SKILL.md",
      "locator": "5. **Trace Data Flow**",
      "fact": "Phase 1 ends at step 5 Trace Data Flow then Phase 2; version frontmatter is 1.1.1; No Root Cause section exists without the new checklist."
    },
    {
      "id": "SRC-PKG",
      "path": "package.json",
      "locator": "\"scripts\"",
      "fact": "Add test:systematic-debugging-data-over-time pointing at tests/r19-systematic-debugging-data-over-time-contract.test.mjs."
    },
    {
      "id": "SRC-VALIDATE",
      "path": ".github/workflows/validate.yml",
      "locator": "r18-sensor-execution-optimization-contract.test.mjs",
      "fact": "Portability job runs node --test per contract file; r19 basename must be named here and in auto-tag.yml for workflow-test-coverage."
    },
    {
      "id": "SRC-DEV-BUNDLE",
      "path": "bundles/dev/bundle.json",
      "locator": "\"version\"",
      "fact": "dev bundle version is 4.13.0 and lists systematic-debugging; bump with catalog.json when the skill changes."
    }
  ],
  "commands": [
    {
      "id": "CMD-CONTRACT",
      "program": "npm",
      "args": ["run", "test:systematic-debugging-data-over-time"],
      "covers": ["R1", "R2", "R3", "R4", "R5"]
    },
    {
      "id": "CMD-VERSION-BUMPS",
      "program": "npm",
      "args": ["run", "test:version-bumps"],
      "covers": ["R4"]
    }
  ],
  "slices": [
    {
      "id": "S1",
      "title": "Contract harness and CI wiring",
      "requirements": ["R5"],
      "dependsOn": [],
      "sectionAnchor": "slice-s1",
      "sources": ["SRC-DESIGN", "SRC-PKG", "SRC-VALIDATE"],
      "redCommands": ["CMD-CONTRACT"],
      "greenCommands": ["CMD-CONTRACT"],
      "reviewEvidence": ["specification", "code-quality"],
      "risk": "full-context",
      "fallback": ["public-contract"]
    },
    {
      "id": "S2",
      "title": "Skill prose, checklist, version bumps",
      "requirements": ["R1", "R2", "R3", "R4"],
      "dependsOn": ["S1"],
      "sectionAnchor": "slice-s2",
      "sources": ["SRC-DESIGN", "SRC-SKILL", "SRC-DEV-BUNDLE"],
      "redCommands": ["CMD-CONTRACT"],
      "greenCommands": ["CMD-CONTRACT", "CMD-VERSION-BUMPS"],
      "reviewEvidence": ["specification", "code-quality"],
      "risk": "full-context",
      "fallback": ["public-contract"]
    }
  ],
  "closureCommands": ["CMD-CONTRACT", "CMD-VERSION-BUMPS"]
}
<!-- AWM:COMPACT-SLICES:END v1 -->

<a id="slice-s1"></a>
### Slice S1: Contract harness and CI wiring

#### Surfaces
Own **R5** only: `package.json` script `test:systematic-debugging-data-over-time`, new `tests/r19-systematic-debugging-data-over-time-contract.test.mjs` with smoke asserts (design file exists; script points at this contract), and basename listed in `.github/workflows/validate.yml` and `.github/workflows/auto-tag.yml` next to the r18 line. Grouping: harness before content so S2 can go RED on new asserts without inventing the script.

#### Implementation
1. RED — `npm run test:systematic-debugging-data-over-time` fails (script missing).
2. Add to `package.json` scripts: `"test:systematic-debugging-data-over-time": "node --test tests/r19-systematic-debugging-data-over-time-contract.test.mjs"`.
3. Create `tests/r19-systematic-debugging-data-over-time-contract.test.mjs` with smoke-only tests (no Phase-1 content asserts yet):
   - design path `docs/plans/2026-10-28-systematic-debugging-data-over-time-design.md` exists and mentions `R1`;
   - `package.json` scripts entry equals the node --test invocation of this file.
4. Add `node --test tests/r19-systematic-debugging-data-over-time-contract.test.mjs` to `validate.yml` and `auto-tag.yml` immediately after the r18 line.
5. GREEN — `npm run test:systematic-debugging-data-over-time` passes; `node --test tests/workflow-test-coverage.test.mjs` passes.
6. Commit: `test(systematic-debugging): r19 harness for data-over-time (#80)`.

#### Edge cases
Missing script or orphan test basename must fail workflow-test-coverage. Smoke must not assert step 6 yet (that is S2 RED).

#### Evidence
CMD-CONTRACT. Spec + code-quality reviews on harness-only diff. Plan identity: this file’s compact admission after validate.

#### Fallback
If r19 name collides, use next free `rNN` and keep the script name stable. Amend design/plan if paths diverge; re-run `awm plan validate`.

<a id="slice-s2"></a>
### Slice S2: Skill prose, checklist, version bumps

#### Surfaces
Own **R1–R4**: extend r19 with section-scoped content asserts; edit `skills/systematic-debugging/SKILL.md` (insert step 6 after Trace Data Flow; insert checklist before “When Process Reveals…”; frontmatter `1.1.1` → `1.2.0`); bump `bundles/dev/bundle.json` and `catalog.json` `dev` from `4.13.0` → `4.14.0`. Grouping: one content boundary; all content asserts share one skill file.

#### Implementation
1. Extend r19 with content tests (still RED on current skill). Use a `section(text, heading)` helper equivalent to r17 (fence-aware). Required asserts:
   - **R1:** `section` of `### Phase 1: Root Cause Investigation` contains `6. **Investigate Data-Dependent Behavior Over Time**` after `5. **Trace Data Flow**`, and includes substrings: `Reconstruct the timeline`, `Separate snapshots from live reads`, `Recompute the outcome`, `stable identifiers`, `sibling records` (or `Look at sibling records`). Mutation deleting the step-6 heading must throw.
   - **R2:** file contains `## Before Concluding "Not a Code Defect"` and its index is less than `## When Process Reveals "No Root Cause"`; that section body includes four `- [ ]` checklist lines covering timeline, snapshot vs live, recompute match, and stable identifiers. Mutation moving the checklist after No Root Cause must fail.
   - **R3:** checklist section matches /recomputed outcome differs|differs from what the system produced/i and /code defect candidate/i. Mutation removing “code defect candidate” must fail.
   - **R4:** YAML frontmatter `version:` parses to a string where semver ≥ `1.2.0` (`compareSemver` from `scripts/semver.mjs`).
2. RED — `npm run test:systematic-debugging-data-over-time` fails on missing step 6 / checklist.
3. Edit `skills/systematic-debugging/SKILL.md`:
   - Set frontmatter `version: "1.2.0"`.
   - Immediately after the Trace Data Flow block (after “Fix at source, not at symptom”) and before `### Phase 2: Pattern Analysis`, insert **verbatim**:

```markdown
6. **Investigate Data-Dependent Behavior Over Time**

   **WHEN the observed behavior depends on stored data (records, configuration, user or role assignments,
   catalogs), or the reporter says the system shows a value that should be a different one:**

   - **Reconstruct the timeline** of the affected entity and of every piece of data its behavior depends on:
     creation, each state change, each re-submission or re-processing, and the last modification of the
     referenced data (audit or event logs, `updatedAt`, history tables). Put all events in one ordered list.
   - **Separate snapshots from live reads.** For each value the code uses, determine whether it was copied
     when the entity was created (a snapshot) or is read at the moment of the action. A snapshot reused after
     its source changed is a classic stale-data defect.
   - **Recompute the outcome with the data that was current at each action**, especially the latest one, and
     compare it with what the system produced. If they differ, the code used stale data: that is a code-level
     root cause candidate, not "just data".
   - **Test the reporter's expectation against the data before dismissing it.** Find the expected value,
     person or item through stable identifiers and through the relationships the code uses, not by display
     name: names, labels and translations often differ from what a user writes.
   - **Look at sibling records.** A newer or similar record that shows the expected outcome usually reveals
     which input changed.
```

   - Immediately before `## When Process Reveals "No Root Cause"`, insert **verbatim**:

```markdown
## Before Concluding "Not a Code Defect"

"The system does what its data says", "it is a configuration issue" or "it works as designed" is a
conclusion, not a starting point. Before you reach it, and before you stop or close the investigation with
that answer, all of these must be true:

- [ ] You built the timeline (Phase 1, step 6) and you can state, for each relevant data change, whether the
      latest action happened before or after it.
- [ ] For every value the code used, you know whether it was a snapshot or a live read, and you compared each
      snapshot with the current value.
- [ ] You recomputed the outcome with the data current at the latest action, and it matches what the system
      produced.
- [ ] You searched for the reporter's expected value by stable identifiers and relationships, not only by
      display name.

If any box is unchecked, the investigation is incomplete. If the recomputed outcome differs from what the
system produced, it is a code defect candidate; whether the fix also needs a business decision is a separate
question.

```

4. Set `bundles/dev/bundle.json` `"version"` to `"4.14.0"` and the matching `catalog.json` `dev` entry to `"4.14.0"`.
5. GREEN — `npm run test:systematic-debugging-data-over-time` and `npm run test:version-bumps` (or `./scripts/check-skill-version-bumps.sh origin/main`) pass.
6. Commit: `feat(systematic-debugging): investigate data-dependent bugs over time (#80)`.

#### Edge cases
Do not paraphrase the issue prose. Do not edit Quick Reference, CREATION-LOG, or companion `.md` files. Asserts must be section-scoped (AGENTS.md vacuous-match lesson). Straight double quotes in the new `##` title must match the skill file exactly as inserted.

#### Evidence
CMD-CONTRACT + CMD-VERSION-BUMPS. Spec + code-quality reviews. Closure = both commands green on HEAD.

#### Fallback
If `4.14.0` is taken on main before merge, bump to next unused minor and amend. If a quote-character mismatch breaks asserts, fix the assert to the committed skill bytes (not the other way around) only when the skill matches the issue intent; prefer aligning skill quotes to the issue ASCII `"` form above.

## Traceability

| Req | Slice | Test(s) |
|-----|-------|---------|
| R1 | S2 | r19 Phase 1 step 6 + mutation |
| R2 | S2 | r19 checklist order + checkboxes + mutation |
| R3 | S2 | r19 code defect candidate sentence + mutation |
| R4 | S2 | r19 frontmatter ≥ 1.2.0; CMD-VERSION-BUMPS |
| R5 | S1 | r19 smoke + package script; workflow basename coverage |

## Self-review

- Forward/backward coverage: closed for R1–R5.
- No placeholders.
- Dispatch: `proveedor-nativo` / v1 only.
