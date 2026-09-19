---
name: writing-plans
version: "2.1.0"
license: Apache-2.0
description: Use when you have a spec or requirements for a multi-step task, before touching code
---

# Writing Plans

## Compact admission — BLOCKING

Read `references/compact-admission-v1.md` before any plan execution, role dispatch, resume, or lifecycle transition.
Apply it exactly; only `admitted` for the current plan identity may continue.

## Overview

Write comprehensive implementation plans assuming the engineer has zero context for our codebase and questionable taste. Document everything they need to know: which files to touch for each task, code, testing, docs they might need to check, how to test it. Give them the whole plan as bite-sized tasks. DRY. YAGNI. TDD. Frequent commits.

Assume they are a skilled developer, but know almost nothing about our toolset or problem domain. Assume they don't know good test design very well.

**Announce at start:** "I'm using the writing-plans skill to create the implementation plan."

**Context:** If working in an isolated worktree, it should have been created via the `using-git-worktrees` skill at execution time.

**Save plans to:** `docs/plans/YYYY-MM-DD-<feature-name>.md`
- (User preferences for plan location override this default)

## Scope Check

If the spec covers multiple independent subsystems, it should have been broken into sub-project specs during brainstorming. If it wasn't, suggest breaking this into separate plans — one per subsystem. Each plan should produce working, testable software on its own.

## File Structure

Before defining tasks, map out which files will be created or modified and what each one is responsible for. This is where decomposition decisions get locked in.

- Design units with clear boundaries and well-defined interfaces. Each file should have one clear responsibility.
- You reason best about code you can hold in context at once, and your edits are more reliable when files are focused. Prefer smaller, focused files over large ones that do too much.
- Files that change together should live together. Split by responsibility, not by technical layer.
- In existing codebases, follow established patterns. If the codebase uses large files, don't unilaterally restructure - but if a file you're modifying has grown unwieldy, including a split in the plan is reasonable.

This structure informs the task decomposition. Each task should produce self-contained changes that make sense independently.

## Bite-Sized Task Granularity

**Each step is one action (2-5 minutes):**
- "Write the failing test" - step
- "Run it to make sure it fails" - step
- "Implement the minimal code to make the test pass" - step
- "Run the tests and make sure they pass" - step
- "Commit" - step

## Compact-only authoring

Complete approved requirements and explicit unique ownership produce only supported serial compact plans.
Incomplete requirements, ambiguous ownership, unresolved product/architecture decisions, unsafe slice boundaries, or parallel tracks return `planning-required`; do not write an executable implementation plan.
Preserve canonical requirement IDs such as `RF-1.1`, `RNF-T.1`, and safe hyphenated IDs without translation.
Group adjacent requirements only when behavior, surfaces, dependencies, and verification boundaries justify one cohesive slice; state that rationale and one owner per requirement.
Unmarked historical plans are readable migration inputs, never executable; there is no Task/Tracks or legacy execution option.

Read `references/compact-slices-v1.md` completely. Query the installed CLI routing contract and policy status before authoring routing-enabled compact v2. Emit one mechanical, integration or judgment implementerProfile per slice, never a concrete model or vendor. Mechanical requires closed local behavior and excludes security/admission/root recovery; integration requires known interfaces; judgment owns public/cross-cutting policy and custody. Missing design decisions remain planning-required. If v2 or approved policy readiness is unavailable, author valid compact v1, report routing unavailable, and never claim profile savings. For the current R2-B bootstrap keep v1 even after feature support becomes available. Read `references/compact-slices-v2.md` only for routing-enabled v2; otherwise emit exactly its v1 manifest and
five canonical `####` subsections per serial slice. Inline necessary facts when their
source is insufficient, unavailable, unstable, unsafe, inaccessible or ambiguous.
The executor receives complete behavior, surfaces, interfaces, sequence, edge cases,
RED/GREEN assertions/commands, risks and fallback, never a discovery assignment.

## Historical migration — BLOCKING

Read `references/compact-migration-v1.md` for historical or partially executed input.
Apply it exactly; preserve the original bytes and completed checkpoints, and write only
a separately accepted continuation. Missing evidence/ownership never implies completion.

## Plan Document Header

**Every plan MUST start with this header:**

```markdown
# [Feature Name] Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `subagent-driven-development`
> (recommended) or `executing-plans` to implement this plan task-by-task. Steps
> use checkbox (`- [ ]`) syntax for tracking.

**Goal:** [One sentence describing what this builds]

**Architecture:** [2-3 sentences about approach]

**Tech Stack:** [Key technologies/libraries]

**Modo de ejecución:** interactivo

---
```

### Modo de ejecución

El campo `**Modo de ejecución:**` acepta `interactivo` (default) o `desatendido`. Escribe `desatendido` **solo si el usuario lo pidió explícitamente** para esta corrida. Si el campo queda ausente, los skills lectores asumen `interactivo`.

WHEN el modo es `desatendido`, incluye este blockquote canónico inmediatamente después de la línea del campo (texto literal, no lo parafrasees — es la única fuente del mandato):

```markdown
> Mandato de ejecución desatendida: ejecución completa sin pausas de check-in
> entre tareas, ni de confirmación entre fases (development-process rutea
> automáticamente y subagent-driven-development no pregunta si continuar con
> el cierre). harness-retro triagea con criterio propio del agente (solo valor
> real, recurrente o sistémico — descarta el resto sin preguntar).
> post-implementation-qa corrige TODOS los hallazgos que surjan, no solo algunos.
> finishing-a-development-branch crea el PR directamente (opción "push + PR"),
> sin presentar el menú de 4 opciones.
```

Los skills lectores (`development-process`, `subagent-driven-development`, `post-implementation-qa`, `harness-retro`, `finishing-a-development-branch`) parsean únicamente la línea del campo; el blockquote es para humanos y para robustez ante compactación de contexto. El modo desatendido quita pausas, no controles: todos los gates corren igual.

## Slice Structure

Use the exact manifest/anchor/five-subsection structure in
`references/compact-slices-v1.md`. Declare unique owned requirement IDs, contained stable
sources, tokenized inert RED/GREEN commands, closureCommands, dependencies, grouping
rationale, interfaces, complete implementation code/facts, exact edge assertions and
independent review evidence. Every UI slice inherits Required Skills and exact real
Design artifacts from the approved design; no artifact path may be invented.
R1 v1 is serial: do not emit tracks or semantic implementer profiles.

## No Placeholders

Every step must contain the actual content an engineer needs. These are **plan failures** — never write them:
- "TBD", "TODO", "implement later", "fill in details"
- "Add appropriate error handling" / "add validation" / "handle edge cases"
- "Write tests for the above" (without actual test code)
- "Similar to Task N" (repeat the code — the engineer may be reading tasks out of order)
- Steps that describe what to do without showing how (code blocks required for code steps)
- References to types, functions, or methods not defined in any task

## Remember
- Exact file paths always
- Complete code in every step — if a step changes code, show the code
- Exact commands with expected output
- Reference relevant skills with @ syntax
- DRY, YAGNI, TDD, frequent commits

## Self-Review

After writing the complete plan, look at the spec with fresh eyes and check the plan against it. This is a checklist you run yourself — not a subagent dispatch.

**1. Traceability matrix:** Build a table mapping each spec requirement ID to the task(s) and test(s) that cover it. Report both directions:
- **Forward gap** — a requirement ID with no task or no test. The requirement isn't built or isn't verified. Add the missing task/test.
- **Backward gap** — a task or test with no requirement ID. That's scope creep / orphan code — either it traces to a requirement you forgot to write, or it shouldn't be in the plan. Resolve it, don't leave it dangling.

```markdown
| Req  | Task(s) | Test(s) |
|------|---------|---------|
| R1.1 | T2      | test_specific_behavior |
```

*(Tier: the matrix applies to multi-task plans tied to a `## Requirements` spec. A trivial single-file diff with no requirements section skips it.)*

**Matrix precision (verification must match the claim, not just a shared marker):** the `Test(s)` column must cite a verification step that actually proves THAT requirement's specific claim — not a generic marker shared with other requirements. A `grep` for a broad, reused phrase (e.g. counting how many times "Modo desatendido" appears in a file) proves the phrase exists somewhere, not that a specific requirement's semantic claim holds (e.g. that BLOCKED escalation is never skipped, or that an invalid field value falls back safely). This was caught in a QA pass where several matrix rows cited generic-marker greps for requirements whose actual claim needed a phrase-specific check. When a requirement makes a specific behavioral claim, either grep for language that anchors that specific claim, or note explicitly that the check relies on manual reading rather than an automated proxy.

**2. Placeholder scan:** Search your plan for red flags — any of the patterns from the "No Placeholders" section above. Fix them.

**3. Type consistency:** Do the types, method signatures, and property names you used in later tasks match what you defined in earlier tasks? A function called `clearLayers()` in Task 3 but `clearFullLayers()` in Task 7 is a bug.

**4. UI task propagation:** Does every task touching a designed screen declare `**Skills:**` and `**Design artifacts:**`? Do the declared artifact paths match the design doc's `## UI Screens` Artifacts column for that screen (not stale/mismatched)? A UI task without them, or with wrong paths, is a plan failure — fix it.

If you find issues, fix them inline. No need to re-review — just fix and move on. If you find a spec requirement with no task, add the task.

## Coverage Gate (self-review, pre-handoff)

Before offering the execution choice, run this gate on the traceability matrix. This is a planning self-review coverage check, not a CLI analyze command.

- **Every requirement ID has ≥1 task AND ≥1 test.** A requirement with a task but no test is built-but-unverified — not done.
- **No task or test lacks a requirement ID.** Anything unanchored is orphan scope — resolve it before handoff.

Do not proceed to the execution handoff while the gate reports gaps. *(Tier: skipped for trivial single-file diffs with no `## Requirements` section.)*

## Compact validation and strict currentness (pre-handoff) — BLOCKING

For every implementation plan, after bidirectional coverage self-review, run:

```bash
awm plan validate PLAN_PATH --cwd . --json
```

Only `valid` may proceed to admission. `migration-required`, `invalid` and
`unsupported` block; do not reinterpret any result as a successful historical route.
After a plan amendment revalidate and retain the new CLI-derived identity; old-digest
evidence cannot complete current obligations.

Immediately before execution handoff run:

```bash
awm preflight --require-current
```

This is blocking for compact and unattended handoff. A stale verdict, non-zero exit, or
missing strict flag blocks handoff; unlike the older unknown-command compatibility
exception, do not continue without strict currentness. For unattended projects with
enabled applicable sensors, combine strict currentness with `--verify-sensors`. When all
configured sensors are deliberate opt-outs, use strict currentness locally and retain
the versioned `validate.yml` sensor-certification matrix plus R8 as applicable evidence.

## Harness Preflight Gate (pre-handoff) — BLOCKING

Everything past the execution handoff consumes `awm sensors run`: the implementer, both
reviewers, `post-implementation-qa`. **None of them verify the sensors can actually run.**
If the harness is not configured, or declares tools that are not installed, those phases
report on checks that never happened — and on an unattended run nobody finds out until a
bad change is already merged.

```bash
awm preflight
```

- **Exit 0 (`ready`)** — proceed to the Context Budget Gate.
- **Non-zero (`degraded` / `not_configured`)** — **stop. Do not offer the execution
  choice.** Show the report, walk the user through the remedy it prints (usually
  `awm sensors init`, installing a missing tool, or deliberately disabling a sensor), and
  re-run until it is green.

This is the one gate here that genuinely blocks, and the reason is the boundary itself: it
is the last point where a person can fix the harness. A misconfigured harness discovered
at 3 AM is not a slower run, it is a run whose entire quality apparatus was decorative.

**Do not route around it.** If the user asks to skip, the honest options are to fix the
config, or to opt out deliberately (`awm sensors init`, then set the sensors to
`"enabled": false`) so the decision is recorded in a committed file rather than implied by
silence. Never proceed by treating "not configured" as "no findings".

*(Missing preflight or strict support blocks handoff: install the compatible released CLI; never bypass or improvise a substitute.)*

### Unattended empirical handoff — BLOCKING

Keep the static preflight above for every plan: it validates configuration without spending
the project execution budget. When the plan's **Modo de ejecución:** is `desatendido`, run
this additional empirical gate immediately before offering its execution handoff, while the
user is still present:

```bash
awm preflight --verify-sensors
```

- **`overall: pass`** — the unattended handoff may be offered.
- **Any non-zero result or any non-pass verdict** — **stop. Do not offer the execution
  choice.** Present the sensor, effective timeout, elapsed duration, and actionable reason;
  resolve it with the user and re-run the empirical preflight. A static `ready` result is not
  evidence that the project commands can complete.

This gate is read-only. It must not be deferred to the implementer: unattended work cannot
recover a silently failing harness when no person is watching.

### Context Kernel decision (after preflight, before context budget)

Read the `context-kernel` result from the preflight already run above. A legacy full context
result is advisory: show its remedy and record whether the owner
migrates now or intentionally runs this plan with complete context. Do not
create migration metadata during planning.

partial or invalid metadata is blocking for selective handoff: preserve full
context, show the diagnostic, and require its reviewed repair before offering a
selective execution path. A valid kernel may continue to the Context Budget
Gate below.

If a valid kernel exceeds its context budget, offer controlled card maintenance,
a reviewed budget increase, or continuation with the decision recorded. The
threshold does not authorize pruning, and a budget never authorizes deletion of
a protected rule, card, or ID.

## Context Budget Gate (pre-handoff)

**This is the last moment the human is guaranteed to be here.** Everything past the execution
handoff can run unattended — `development-process` only skips approval for post-plan phases, and
the phases before the plan exists are always interactive. So a check that needs a person must
happen here, not later.

Run it before offering the execution choice:

```bash
awm context-budget
```

*(Requires the AWM CLI that ships this command. If it reports an unknown command, the
project is on an older CLI — say so once and continue; do not improvise a substitute.)*

It measures the files injected into **every** session — `AGENTS.md`, `CONSTITUTION.md`,
`CLAUDE.md` — against the budget pinned in `.awm/context-budget.json`. Silence means within
budget; proceed. If it reports, present the three options and let the user pick:

1. **Controlled maintenance.** Keep the complete context intact; the owner may organize or
   compact presentation without removing content, or record a separately reviewed maintenance
   proposal for a later owner-approved removal.
2. **Raise `maxBytes`** in `.awm/context-budget.json` — a committed, reviewed decision to keep
   paying for that context in every future session.
3. **Proceed and note it** in the plan, if the growth is not worth interrupting for right now.

**Never let this block execution on its own.** Blocking here would strand exactly the overnight
runs it exists to protect — the user came back in the morning expecting a PR, not a stalled gate.
It is a decision point while someone is present, never a gate that fires when nobody is.

Note the one-session lag this design accepts: `harness-retro` grows these files at the *end* of a
run, so growth from this session surfaces at the *next* plan gate. That is deliberate. The
alternative — gating at retro time — is precisely what fires while nobody is watching.

## Execution Handoff

After saving the plan, offer execution choice:

**"Plan complete and saved to `docs/plans/<filename>.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh implementer for one admitted serial compact slice at a time, with independent specification and quality reviews

**2. Inline Execution** - Execute one admitted serial compact slice at a time in this session using executing-plans, with independent specification and quality review checkpoints

**Which approach?"**

**If Subagent-Driven chosen:**
- **REQUIRED SUB-SKILL:** Use `subagent-driven-development`
- One admitted serial slice at a time + fresh implementer and distinct two-stage review

**If Inline Execution chosen:**
- **REQUIRED SUB-SKILL:** Use `executing-plans`
- One admitted serial slice at a time with independent specification and quality review checkpoints
