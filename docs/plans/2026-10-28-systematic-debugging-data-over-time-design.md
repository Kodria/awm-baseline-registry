# systematic-debugging: data-dependent behavior over time (#80)

**Issue:** [Kodria/awm-baseline-registry#80](https://github.com/Kodria/awm-baseline-registry/issues/80)

**Goal:** Agents investigating bugs that depend on stored data must reconstruct timelines and distinguish snapshots from live reads before concluding “not a code defect.” Ship the issue’s proposed prose into `skills/systematic-debugging/SKILL.md` (empirically validated 5/5 vs 1/5), with registry contract + version bumps.

**Approach:** Verbatim adoption of the issue diff (minor markdown only if needed for contracts). No companion file extraction. No Quick Reference / CREATION-LOG edits.

**Change Record:** ninguno — content registry; release via conventional-commit PR title + auto-tag

## Requirements

| ID | Requirement |
|---|---|
| **R1** | WHEN an agent follows Phase 1, THEN THE skill SHALL include step `6. Investigate Data-Dependent Behavior Over Time` immediately after `5. Trace Data Flow`, with the issue’s normative bullets (timeline, snapshot vs live, recompute, stable-ID search, sibling records). |
| **R2** | WHEN an agent is about to conclude “not a code defect”, “configuration”, or “as designed”, THEN THE skill SHALL require the checklist section `Before Concluding "Not a Code Defect"` **before** `When Process Reveals "No Root Cause"`, and SHALL treat any unchecked item as an incomplete investigation. |
| **R3** | IF the outcome recomputed with data current at the latest action differs from what the system produced, THEN THE skill SHALL classify that as a code-defect candidate (not “just data”). |
| **R4** | WHEN `skills/systematic-debugging/SKILL.md` body changes, THEN THE frontmatter `version` SHALL advance from `1.1.1` to `1.2.0`, and THE `dev` bundle version in `bundles/dev/bundle.json` and `catalog.json` SHALL advance per `check-skill-version-bumps`. |
| **R5** | THE registry SHALL provide `npm run test:systematic-debugging-data-over-time` wired to an executable section-scoped contract that fails if step 6 or the checklist is removed, weakened, or ordered after “No Root Cause”; the test basename SHALL appear in `validate.yml` and `auto-tag.yml`. |

## Normative text source

The English blocks in issue #80 (Phase 1 step 6 + `## Before Concluding "Not a Code Defect"`) are the single normative wording. Do not paraphrase for “clarity” without a new evidence run.

## Delivery surfaces

| Path | Change |
|---|---|
| `skills/systematic-debugging/SKILL.md` | Insert step 6 after Trace Data Flow; insert checklist section before “When Process Reveals ‘No Root Cause’”; bump frontmatter to `1.2.0`. |
| `tests/r19-systematic-debugging-data-over-time-contract.test.mjs` | Section-scoped asserts + mutations for R1–R3 and R5 wiring. |
| `package.json` | Script `test:systematic-debugging-data-over-time`. |
| `.github/workflows/validate.yml` | `node --test` step naming the r19 file. |
| `.github/workflows/auto-tag.yml` | Same basename for coverage gate. |
| `bundles/dev/bundle.json` | Bundle version bump. |
| `catalog.json` | Matching `dev` version bump. |

## Contract assert map (anti-vacuous)

- Scope asserts to Phase 1 / the new `##` section windows (not whole-file keyword matches).
- Every positive assert has a mutation that deletes or reorders the normative sentence and must fail.
- R4 is checked via frontmatter parse in the contract **and** `./scripts/check-skill-version-bumps.sh` in the plan’s green commands.
- Do **not** re-run BotBug experiments in CI.

## Non-goals

- Rewriting other Phase 1–5 content.
- Editing `root-cause-tracing.md`, Quick Reference, CREATION-LOG, or pressure tests.
- CLI changes.
- A second empirical data-dependent case (issue limit; tracked as residual risk only).

## Residual risk

Evidence is one data-dependent production case (5 runs) plus one pure-code regression. The general rule may over-trigger on pure-code bugs; the issue’s one regression sample did not. Accept for this ship; revisit only if a new counterexample appears.

## UI Screens

None.
