# Compact-only R1 — published acceptance and closure

## Immutable released pair

- CLI npm `agentic-workflow-manager@9.8.0`: `gitHead`
  `055c4484b7641fb3b08fd478390f63a148c95283`, integrity
  `sha512-cQeP9kAvD7pBtdjEShp6hsGcDMFbhoVHQlxvngYeqX37LRS5tED/BpyHykgvW4sQnEJ2DSIjtf8xXSy07Uov1w==`.
- Baseline `v4.0.0`: annotated tag `788eab59da08049c721ff02800c4657bae5e336b`,
  peeled commit `304f0849e29f6a643b4061bf00eb8b4d826dada4`.
- [CLI PR #149](https://github.com/Kodria/agentic-workflow/pull/149), Windows test
  corrections #150–152, [npm visibility guard #153](https://github.com/Kodria/agentic-workflow/pull/153)
  and [registry PR #54](https://github.com/Kodria/awm-baseline-registry/pull/54) are merged.

## Actual gates

- [CLI release and three installed consumers](https://github.com/Kodria/agentic-workflow/actions/runs/35131415835):
  all six native targets PASS; Linux/macOS/Windows installed acceptance PASS. Only the
  initially failed consumer jobs were rerun after npm visibility, never the publisher.
- [CLI main CI including #153](https://github.com/Kodria/agentic-workflow/actions/runs/35134688571):
  all six native targets PASS at `a3e2e2d486f1a81bf2af1a976f09b819474420a8`.
- [Registry candidate validation](https://github.com/Kodria/awm-baseline-registry/actions/runs/35135176642):
  portability and four sensor certifications PASS at `84a4fe645139e2f08745f467524cca2382f5afc4`.
- [Registry main validation](https://github.com/Kodria/awm-baseline-registry/actions/runs/35135852837)
  and [actual auto-tag](https://github.com/Kodria/awm-baseline-registry/actions/runs/35135852881):
  PASS at the exact released registry commit above, including the four certifications
  and the real tag job. Local all-disabled registry sensors retain `not_certified`;
  R8 content-only closure uses these actual versioned CI proofs, not an admission bypass.
- Final source contracts: 50 PASS; portability: 39 skills; native Bash skill/bundle
  version gate PASS; independent finite review of the installed fixture: no findings.

## Published-remote acceptance

A clean consumer downloaded the exact npm CLI and cloned public baseline `v4.0.0`.
Candidate and installed registry SHA both equal `304f0849e29f6a643b4061bf00eb8b4d826dada4`.
The four immutable-artifact/plan/lifecycle cases passed; the previously inconclusive
RF-2.5 case was rerun alone without changing either artifact and passed with real Git
tracing. This is five verified cases, not a claim that the earlier failing full invocation
was green. Initial remote checks reported `currentness: unverifiable`; isolated real
transport then confirmed the tag with successful 1.4–1.8-second Git calls. No currentness
check, sensor check or quality gate was disabled to obtain acceptance.

The positive admission observed `currentness: current`, `sensors: pass`, and no journal
custody creation. Negative controls use unchanged published CLI `9.7.1`, future floor
`99.0.0`, invalid/future plans, and a real npm cache mutation inside the consumer. The
fixture selects only its actually certified npm-script surface (`npm@10.8.3`), using
the installed artifact's internal resolver/serializer and the original registry pack;
it does not claim whole-pack bootstrap, a stable public module API, or native unattended
provider parity. Operator HOME/cache are outside the consumer worktree.

## Read-only historical continuation

The globally installed published CLI's #148 dry run returns expected `planning-required`
(exit 2): T1 completed, T2 pending `quality-review`, T3–14 unstarted. Original plan digest
remains `c11477dd59cb19094983c671cc0b760f1d1e51b9679e13dba90f1b0c2cba48e7`.
Historical checkpoint `81c008c5f681e6ecfe30a3fc73bf7b79d094c094` is not resumed or modified.

## Native/manual cycle closure

This delivery used native/manual corrective work, not a fabricated journal-driven cycle.
Registry branch journal-status is `missing`; cycle capture is therefore explicitly
skipped. The actual branch ledger archive returned `archived: true` for
`codex/issue-126-sensor-certification`, preserving 11 records, and subsequent list is `[]`.
The unused CLI bootstrap was separately archived byte-for-byte, never marked COMPLETE.
QA, docs and retro markers on the owning plan record these genuine completed phases.

No new constitution/context rule or previously pending recommendation is applied.
R1 is published and accepted. [Parent #126](https://github.com/Kodria/agentic-workflow/issues/126)
remains open for R2 routing and billed-consumption measurement; neither provider parity
nor a quota-saving percentage is inferred from this release. Existing projects must
update CLI and baseline together; intentionally pinned older registries are not silently
overridden, and unavailable source access must block before dispatch, not restart QA.
