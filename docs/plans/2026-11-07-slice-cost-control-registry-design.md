# Slice cost control — Registry design pointer (#246 companion)

**Status:** pointer only. Normative RF prose lives in the CLI design; this registry must not rewrite requirement text.

**Normative source:** `Kodria/agentic-workflow` `docs/plans/2026-11-06-slice-cost-control-design.md` (merged via PR #247; CLI published as `agentic-workflow-manager@9.23.0`).

## Registry-owned RFs

Implement here: RF-2.4, RF-3.3, RF-4.1, RF-4.2, RF-4.3, RF-4.4, RF-4.5, RF-4.6, RF-5.1, RF-5.2, RF-6.1, RF-6.3, RF-E.3. Pack schema acceptance of structured `sliceCommand` (design RF-1.5 authoring surface) is also registry content.

**CLI-owned (already shipped in 9.23.0):** RF-1.*, RF-2.1–2.3/2.5–2.6, RF-3.1–3.2/3.4–3.9, RF-4.7, RF-5.1 clocks substrate, RF-6.2/6.4, RF-E.1–E.2.

**Prerequisite:** npm `agentic-workflow-manager@9.23.0` published (confirmed 2026-11-07). Raise `minCliVersion` / re-certify to that version — never invent a newer number.

**Delivery:** executable plan `docs/plans/2026-11-07-slice-cost-control-registry-plan.md`.
