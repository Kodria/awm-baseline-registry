# Changelog

Newest entry on top; append new releases directly below this line.

## dev 1.7.0 / product 1.1.0 — 2026-07-23

### Added — bundle `dev`
- `mermaid-diagrams` 1.0.0 (on-signal): Mermaid diagram guide, native in the registry (adapted from a personal skill; claude.ai port in `docs/ports/`).

### Changed — bundle `dev`
- `brainstorming` 1.3.0: passive "Specialist Skills Awareness" replaced by a mandatory Specialist Gate — evaluate each domain explicitly, invoke or state "not applicable"; silence is not a valid outcome.
- `architecture-advisor`, `technology-evaluator`, `nfr-checklist-generator`: dead Phase 5/6 delegation to `docs-assistant`/`docs-brainstorming`/`docs-system-orchestrator`/`c4-architecture` removed — artifacts are now delivered directly; advisor's diagram path points to `mermaid-diagrams`.

### Removed — bundle `dev`
- `cicd-proposal-builder`: retired. No real consumer (its only wiring was the passive specialist table that never fired) and no natural trigger in feature design. If pipeline design becomes a real need, a new skill will be designed with a real trigger (likely project setup, not brainstorming).

### Changed — bundle `product` 1.1.0
- `architecture-assessment` 1.1.0: advisor invocation hardened into an explicit gate (invoke or state "not applicable" in the report).
- `architecture-extraction`: diagram layer 1 now points to the registry `mermaid-diagrams` skill (inline fallbacks preserved).

Design: docs/plans/2026-07-23-architecture-flow-cleanup-design.md (issue #6, Parte 1 reformulada).

## product 1.0.0 / dev 1.6.0 — 2026-07-22

### Added — bundle `product` (new)
- `product-process`: business-layer orchestrator (5 routes: discovery, brief, assessment, extraction, re-ingestion).
- `product-discovery`: problem framing + JTBD, problem-space only.
- `product-brief`: brief-spec methodology adopted into AWM; portable brief with frontmatter contract.
- `architecture-assessment`: scenario-based lightweight ATAM.
- `architecture-extraction`: arc42-lite + C4, optional Graphify layer with silent manual fallback.
- `readiness-gate`: G1–G9 Definition-of-Ready; seal is informative, gate is the authority.

### Changed — bundle `dev` 1.6.0
- `brainstorming` 1.2.0: Brief Preload Mode + solution-space precedence.
- `development-process` 1.3.0: brief-ready entry state + business-gap return rule.
- `using-awm` 1.2.0: two-orchestrator boundary, precedence and anti-loss rules.

Design: docs/plans/2026-07-22-product-layer-design.md (issue #6, Partes 2+3).
