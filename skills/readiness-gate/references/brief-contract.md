# Product Brief Contract

The canonical specification for the `product-brief` artifact: a single portable
`.md` file with a YAML frontmatter contract plus a structured body. Every skill
that writes, reads, or re-ingests a document under this contract MUST conform
to it. Current consumers: `product-process` (routing, re-ingestion),
`product-brief` and `product-discovery` (writers of `mode: brief`/
`mode: discovery`), `architecture-assessment` and `architecture-extraction`
(writers of `mode: assessment`/`mode: extraction`), `readiness-gate` (the
sole writer of `readiness`), `brainstorming` (reader, Brief Preload Mode),
and `development-process` (reader, brief-ready entry state). Any future
mode or consumer added later MUST conform to this contract too.

## Frontmatter (literal)

```yaml
---
awm: product-brief          # discriminator: AWM product-layer artifact
schema: 1                   # contract version
title: <short name>
mode: discovery | brief | assessment | extraction
readiness: draft | ready | n/a  # written ONLY by readiness-gate; n/a for modes it never gates
created: YYYY-MM-DD
updated: YYYY-MM-DD
open_decisions: [DA-1, DA-3]
project: <slug or null>
---
```

## Normative Rules

- **Discriminator, not heuristics.** Re-ingestion of a document as a product
  brief is recognized exclusively by the presence of the `awm: product-brief`
  key in frontmatter. No skill may infer "this looks like a brief" from body
  content, headings, or filename — a document without this discriminator is
  never treated as a brief, and a document that has it is always treated as
  one, regardless of what its body contains.

- **`schema` is an integer and only grows.** It identifies the shape of the
  contract the document was written against, not the AWM/skill version that
  produced it. It increments by 1 whenever the contract adds or changes a
  required field or section; it is never decremented, reset, or reused. Every
  future version of `readiness-gate` (and any other consumer) MUST remain able
  to read and evaluate every prior `schema` value — old briefs are never
  invalidated by a contract upgrade, and a gate that cannot parse a lower
  `schema` than its own is a bug in the gate, not in the brief. The reverse
  direction is explicitly out of scope: a document whose `schema` is
  **higher** than the reading gate/skill knows is a forward-compatibility
  failure, not something to guess through — the correct response is to stop
  and tell the user this document needs a newer AWM registry, never to read
  it as if the newer contract were the old one.

- **`readiness-gate` is the only writer of `ready` (and of any change to an
  existing value).** A mode skill creating a new document initializes
  `readiness` to its neutral starting value — `draft` for `mode: discovery`/
  `mode: brief`, `n/a` for `mode: assessment`/`mode: extraction` — because the
  field must exist in the frontmatter from the moment the file is created.
  That one-time initialization to the neutral value is not self-certification
  and is expected. What no mode skill (`product-discovery`, `product-brief`,
  `architecture-assessment`, `architecture-extraction`, or any orchestrator)
  may ever do is write `ready`, or change an existing `readiness` value once
  set — both of those are exclusively `readiness-gate`'s to perform, as the
  outcome of running the G1–G9 checklist against the document's actual
  content (R5.2). This is what prevents a producer from self-certifying its
  own output while still letting every mode create a well-formed document.

- **Assessment and extraction reports share the same frontmatter.** Reports
  produced by `mode: assessment` and `mode: extraction` are not a separate,
  looser artifact type — they carry the identical frontmatter contract
  described above, populating `mode` with their own value (R5.3). This is
  what makes them recoverable by re-ingestion on a later session: the
  discriminator and schema rules above apply to them exactly as they apply to
  `mode: discovery` or `mode: brief` documents.

- **`readiness: n/a` for modes the gate never evaluates.** `readiness-gate`'s
  G1–G9 checklist verifies brief-specific criteria (problem statement,
  business cases, requirements traceability, release sequencing) that have no
  equivalent in an architecture document. `mode: assessment` and
  `mode: extraction` reports are never submitted to that gate, so they write
  `readiness: n/a` — an explicit statement that the field doesn't apply,
  never a self-authored `draft`/`ready` (that vocabulary stays exclusive to
  `readiness-gate`'s verdict on `mode: discovery`/`mode: brief` documents,
  per the rule above).

- **Required body sections (R5.1) — scoped to `mode: brief` (and the
  crystallized handoff a `mode: discovery` session produces).** The body of a
  product brief MUST contain the following sections, each carrying its own
  stable ID scheme so requirements and decisions stay traceable across edits
  and re-ingestion. `mode: assessment` and `mode: extraction` reports do
  **not** use this section list — their bodies are purpose-built for
  architecture content (context/container views, data model, findings), not
  business content; R5.3's parity requirement is frontmatter-only, not body
  structure. Every mode still reuses the ID-traceability discipline (a stable
  ID per trackable item) and the non-assumption/calibrated-certainty
  discipline, even where the section list itself doesn't apply:
  - **Business need** — one or more `N#` entries stating the problem, who
    bears its cost, and the cost of leaving it unresolved.
  - **Business cases** — the catalog of cases, exceptions, and rules this
    brief must cover (descriptive bullets, no ID scheme — same style as
    Users & Context/Constraints below). This is what G4 of the readiness gate
    checks; without this section a brief has no home for that catalog, and a
    thin happy-path-only brief is exactly what G4 exists to catch.
  - **Users & context** — who uses or suffers this, and in what context they
    encounter it. This is what G2 of the readiness gate checks; without this
    section a brief has no home for that information.
  - **Constraints** — technical, cost, privacy, and untouchable-infrastructure
    limits the solution must respect. This is what G5 of the readiness gate
    checks.
  - **Non-assumption mandate** — an explicit list of what has **not** been
    verified; nothing in the rest of the document may be asserted as fact
    beyond what this list discloses as unconfirmed.
  - **Glossary** — the domain terms used elsewhere in the document, defined
    once so requirements don't silently redefine vocabulary.
  - **Processes** — `PR-#` entries describing the business processes the
    brief covers.
  - **Requirements** — `RF-x.y` (functional) and `RNF-x.y` (non-functional)
    entries, each written in EARS-compatible form (WHEN/IF/THE .. SHALL ..)
    so they are independently testable.
  - **Open decisions** — a table of `DA-#` rows, each with a `blocks` column
    naming what the decision gates (or "none").
  - **Out of scope** — an explicit boundary of what this brief does not
    cover.
  - **Releases** — release slices, each an independently valuable increment.
  - **Risks** — known risks with impact and mitigation.
