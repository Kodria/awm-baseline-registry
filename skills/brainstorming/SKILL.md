---
name: brainstorming
version: "1.4.2"
license: Apache-2.0
description: Use before creative design work to clarify and approve a design
---

# Brainstorming

## Hard Gate

Do NOT begin implementation until the design is approved. Ask one question at a time; resolve every ambiguity before design. For each meaningful solution, present 2–3 approaches with tradeoffs, then obtain incremental user approval.
Every behavior change receives a scaled design: short for simple work, detailed for
complex work, but never exempt from design approval.

IF a candidate `awm: product-brief` is present, read
`references/brief-preload.md` before asking any question.
Before presenting approaches, read `references/specialist-gate.md` and publish
all three verdicts.
WHEN writing or reviewing the design artifact, read
`references/spec-contract.md` and apply it completely.
IF the work meets the direct-interaction, new/significant-layout, and visual-
complexity signals, read `references/ui-screen-detection.md`.
IF visual questions are anticipated, offer the Visual Companion in a standalone
message; only after consent read `visual-companion.md`.

## Ordered Checklist

1. Inspect existing context and preload an eligible brief.
2. Clarify requirements one question at a time; reach zero open ambiguity.
3. Consider 2–3 approaches, publish specialist verdicts, and obtain direction.
4. Present the design in sections; get approval after each section.
5. Write and save the committed design artifact; self-review and obtain user approval.
6. If UI detection yields `pending` screens, route to `ui-design`; otherwise route to `writing-plans` only.

At design save, cross-reference the development-process rule: research or documentation with no executable behavior needs proportional structural verification, not full tests, sensors, CI monitoring, or a PR solely because it was written.

## Design for isolation and clarity

Scope and decompose independent subsystems before refining details. Inspect existing
code and follow its patterns; keep units bounded, each with one clear purpose and
well-defined interfaces so they can be understood and tested independently. Do not
propose unrelated refactoring.

Ask one question per message and prefer multiple choice when useful. Apply YAGNI ruthlessly: remove unnecessary features from every design.
