# Sensor execution optimization — Registry design half (#236)

**Companion:** CLI system design and CLI plan live in `agentic-workflow` (`docs/plans/2026-10-27-sensor-execution-optimization-design.md` and `…-plan.md`). This document owns only **registry content** requirements after the CLI that parses `inputs` / `closureOnly` is published to npm (audit [B] / RF-7).

**Issue:** [Kodria/agentic-workflow#236](https://github.com/Kodria/agentic-workflow/issues/236)

## Requirements (registry-owned)

- **RF-1.9 — Conservative pack defaults:** Declare `inputs` only for boundable sensors (`typecheck`, and `lint` when extensions/ignore bound the check). Do **not** default `inputs` on `format`, `test`, `mutation`, or `security`. Projects may override; `setup-sensors` teaches mutation/test overrides for docs-only / #236 wall-clock.
- **RF-3.1 — Pack defaults:** Same as RF-1.9; never ship docs-excluding inputs on tree-walking tools.
- **RF-3.2 — setup-sensors teaches inputs:** Normative authoring rules + explicit mutation/slow `inputs` override section.
- **RF-3.5 — No agent-side skip protocol:** Skills invoke phase gates; CLI owns reuse.
- **RF-3.6 — closureOnly authoring:** Document sensor-level `closureOnly` (mutation default true; security optional; test never).
- **RF-5.1 — Slice DONE:** Skills require `awm sensors run --slice` with `overall: pass`.
- **RF-5.2 — verification-before-completion (implementation loop):** `--slice` sufficient.
- **RF-5.3 — QA full gate:** full `awm sensors run`.
- **RF-5.4 — Docs Step 5 full gate:** full run; note CLI may cache.
- **RF-5.5 — Finishing full gate + receipt:** unchanged obligation; CLI RF-4 semantics.
- **RF-5.6 — Forbid partial closure evidence:** no `--slice` / `--fast` / `--slow`-only / `--changed` as QA/docs/finish evidence.
- **RF-5.7 — Constitutions may harden only.**
- **RF-5.8 — development-process carve-out preserved.**
- **RF-5.9 — Replace universal no-flag wording** with phase gates.
- **RF-7.1 — pack.schema.json + minCliVersion + cli-certification.json** updated for `inputs` and sensor-level `closureOnly`.
- **RF-7.2 — Publish order:** start this plan only after the parsing CLI version is on npm; set `minCliVersion` to that version; skills naming new flags declare min CLI.
- **RF-7.3 — Do not ship new fields on tags consumed by older CLIs.**

## Non-goals here

CLI runtime, receipts, digests, jest in the CLI repo.
