# Sensor execution optimization — Registry design pointer (#236)

**Normative source (single):** `Kodria/agentic-workflow` → `docs/plans/2026-10-27-sensor-execution-optimization-design.md` (audit [X1]). Pin the CLI design commit SHA in the content PR description when admitting S2/S3. **Do not rewrite** RF prose here.

**Issue:** [Kodria/agentic-workflow#236](https://github.com/Kodria/agentic-workflow/issues/236) · Companion CLI plan PR: [agentic-workflow#237](https://github.com/Kodria/agentic-workflow/pull/237)

**IDs this registry plan implements** (definitions live only in the CLI design):

| ID | Notes |
|---|---|
| RF-1.9, RF-3.1 | Extension-bound pack defaults; never directory-anchored |
| RF-3.2, RF-3.5, RF-3.6 | setup-sensors + no agent skip + closureOnly authoring |
| RF-5.1–RF-5.9 | Skill phase gates (`--slice` vs full) |
| RF-7.1 | Schema + `minCliVersion` + **re-certify** `certifiedCli` |
| RF-7.2 | Content slices after CLI npm publish |
| RF-7.3 | No new fields on tags for older CLIs |
| RF-7.4 | Mirror `sensor-pack-v2-validator.mjs` + equivalence tests |

**Docs-only PRs** for this pointer/plan may merge before CLI publish (`auto-tag` ignores `docs/**`). **Content slices S2/S3** wait for published CLI version N.

## Registry-local requirement

- **RF-R.0 — Contract harness:** THE registry SHALL provide `npm run test:sensor-execution-optimization` wired to an executable contract before content slices land. Smoke asserts only (design pointer present, script wired); content asserts belong to S2/S3.

## Non-goals here

CLI runtime, receipts, digests, jest suites inside `agentic-workflow`.
