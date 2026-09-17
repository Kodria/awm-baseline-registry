# R2-A isolated Claude trial

Status before a real run: READY-FOR-CLAUDE-TRIAL only after this candidate has
passed its reviewed registry gates. It must not claim CLAUDE-PASS, native
acceptance, quota savings or provider parity before an authorized actual trial.

## Prerequisites

- Record the exact reviewed registry SHA and the installed CLI version; require
  CLI 9.8.0 or a verified compatible release.
- Use a disposable fixture repository, not the owner's development, with a
  temporary HOME/AWM_HOME and a separate cwd.
- Install the candidate only into that isolated context. Do not alter global
  registries, pins, preferences or a production Claude project.
- Install complete isolated settings and dependencies with the fixture. Missing
  compatible CLI, settings or dependencies block the trial; do not improvise.
- Use a small compact plan that produces a real anchored finding, cohesive fix
  and independent revalidation.
- Run approved negative scenarios: stale candidate evidence, missing ledger
  entry, non-equivalent command evidence and an incomplete ledger entry.

## Observe

Record only bounded IDs/verdicts: dispatches, reviews, fix groups, mechanical
runs, administrative repairs, fallbacks and reopening causes. Verify that a
stale candidate cannot use the prior verdict, an explicit ledger-entry can be
repaired without a new code review, and non-equivalent evidence runs a real gate.

## Rollback

Stop the fixture, discard its temporary HOME/AWM_HOME and working directory,
and retain only the approved candidate SHA plus bounded trial report. Rollback
does not change installed AWM or the owner's development.
