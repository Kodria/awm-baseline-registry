---
name: design-fidelity
version: "1.0.0"
description: Use after implementing a UI screen that has committed design artifacts (.stitch/designs/), or when the user asks to verify an implementation against its design. Compares the running implementation against the design PNG/HTML element by element, drives a fix loop until convergence. Also dispatched by post-implementation-qa as a conditional lens for UI diffs.
---

# Design Fidelity Gate

Verifies that an implemented screen matches its committed design artifacts. Evidence-based: screenshots and element inventories, never impressions.

**Announce at start:** "I'm using the design-fidelity skill to verify the implementation against the design."

## Preconditions

1. `.stitch/designs/<screen-slug>.html` (+ `.png` when available) exist for the screen(s) under review. If not → report "no design artifacts; design-fidelity does not apply" and stop.
2. The app runs locally (dev server or built output). If it cannot run, only the structural checklist (Step 2) applies and the verdict is capped at `NOT_CERTIFIED`.

## Procedure (per screen)

### Step 1: Load the design
- Read `.stitch/designs/<screen-slug>.png` with the Read tool — it is an image; look at it.
- Read `.stitch/designs/<screen-slug>.html`.

### Step 2: Build the element inventory
From the design HTML + PNG, list every major element with a stable number: regions (header, nav, sidebar, footer), interactive elements (search bar, buttons, filters), content blocks (cards, tables, stats, charts), and notable styling traits (typography scale, density, color accents). This inventory is the checklist — write it down before looking at the implementation.

### Step 3: Capture the implementation
Requires a browser tool (Playwright MCP):
1. Navigate to the implemented route.
2. Resize to the design's width (e.g. 1600 desktop / 390 mobile — infer from the PNG dimensions or the design doc's Device column).
3. Screenshot → `.stitch/verification/<screen-slug>-impl.png` (create the directory; it may be gitignored — that is fine, it is evidence, not a deliverable).

**No browser available?** Skip to Step 4 using the implementation's source code instead of a screenshot, and cap the verdict at `NOT_CERTIFIED`.

### Step 4: Compare element by element
Read BOTH images in the same turn (design PNG, implementation PNG) and walk the inventory. Classify each element:
- `present` — exists and visually matches (position, content type, prominence).
- `diverged` — exists but differs meaningfully (wrong position, missing content, wrong density/typography/color role).
- `missing` — not in the implementation at all.

### Step 5: Report

```markdown
## Design Fidelity Report — <screen>
Design: .stitch/designs/<screen-slug>.png · Implementation: .stitch/verification/<screen-slug>-impl.png

| # | Element (from design) | Status | Divergence | Severity |
|---|----------------------|--------|------------|----------|
| 1 | Header with search + avatar | missing | not implemented | high |
| 2 | Week calendar grid | diverged | cells show bare number chips instead of titled task cards | high |

**Verdict:** CONVERGED | DIVERGENT (N elements pending) | NOT_CERTIFIED (no browser evidence)
```

### Step 6: Fix loop
While the verdict is DIVERGENT:
1. For each `missing`/`diverged` element (highest severity first), implement the fix (or dispatch it to the executing skill/subagent that owns implementation).
2. Re-run Steps 3–5 for the affected screen.
3. An element may only leave the list by becoming `present` or by **explicit user waiver** (record "waived by user" in the report).

The gate passes ONLY with verdict `CONVERGED` (all elements `present` or waived). `NOT_CERTIFIED` is never a pass — state it explicitly to whoever invoked the skill.

## Red Flags

| Temptation | Reality |
|------------|---------|
| "It looks close enough" | Walk the inventory. Every element gets a status. |
| "No browser, but the code looks right" | That is `NOT_CERTIFIED`, not a pass. Say so. |
| "The design PNG is just a reference" | The PNG is the contract. Divergence needs a fix or an explicit user waiver. |
