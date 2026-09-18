---
name: executing-plans
version: "2.0.1"
license: Apache-2.0
description: Use when you have a written implementation plan to execute in a separate session with review checkpoints
---

# Executing Plans

## Compact admission — BLOCKING

Read `../writing-plans/references/compact-admission-v1.md` before any plan execution, role dispatch, resume, or lifecycle transition.
Apply it exactly; only `admitted` for the current plan identity may continue.

## Routed custody

For a routed controller obligation, read
`../subagent-driven-development/references/model-routing-v1.md`. Request the
current CLI resolution, reserve its frozen envelope, and wait for applied ack
before native dispatch; unknown or mismatch remains blocked, never retried by
changing the plan or provider.

## Overview

Load the admitted plan, review critically and execute one serial compact slice at a time.

**Core principle:** Compact serial execution with independent specification and quality reviews.

**Announce at start:** "I'm using the executing-plans skill to implement this plan."

## Compact-slice compatibility

Only admitted compact execution is supported: for each compact slice obtain spec and quality review; select one complete dependency-ready slice,
implement with TDD, run distinct spec and quality reviewers, reconcile current durable truth,
and advance only after both clean verdicts and declared gates. No historical Task/batch/track
route. Plan defects require durable amendment, revalidation/new identity and visible deviation;
risk receives full relevant context with every role/gate. Local review never replaces final QA.

## The Process

### Step 1: Load and Review Plan
1. Read plan file
2. Review critically - identify any questions or concerns about the plan
3. If concerns: Raise them with your human partner before starting
4. If no concerns: Create or update the task plan with one item per checklist entry, then proceed

### Step 2: Execute admitted serial slice
**Default: One dependency-ready slice, never a historical batch**

For each task:
1. Mark as in_progress
2. Follow each step exactly (plan has bite-sized steps)
3. Run verifications as specified
4. **Run sensors before marking complete.** If the repo has `.awm/sensors.json`, run `awm sensors run` (no flag — all sensors; `--slow` skips lint/typecheck). Continue only when `overall: pass`; `fail`, `not_certified`, and `skipped` are all non-pass verdicts. On any non-pass, invoke `systematic-debugging`, stop task progression, and do not mark the checkbox or commit as complete or advance toward review, QA, retro, or PR. <!-- AWM-INTEGRATION: executing-plans-sensor-gate -->
5. Mark as completed

## Review-cycle control

Read `../subagent-driven-development/references/review-cycle-v1.md` before review or fix loops. Preserve independent roles and current gates while grouping confirmed findings; do not repeat identical proven mechanical commands.

## Registry-content closure exception (R8)

Apply [Registry Sensor Closure Policy (R8 v1)](../setup-sensors/references/registry-closure-policy-r8.md)
exactly. It is the single normative owner; do not restate the policy here.

### Step 3: Report
When the admitted serial slice is complete:
- Show what was implemented
- Show verification output
- Say: "Ready for feedback."

### Step 4: Continue
Based on feedback:
- Apply changes if needed
- Re-admit and execute the next dependency-ready slice
- Repeat until complete

### Step 5: Complete Development

After all tasks complete and verified:
- Return to `development-process` for final review, `post-implementation-qa`,
  `post-implementation-docs`, `harness-retro`, verification and finishing in order.
- Do not invoke `finishing-a-development-branch` until those mandatory gates pass.

## When to Stop and Ask for Help

**STOP executing immediately when:**
- Hit a blocker within the current slice (missing dependency, test fails, instruction unclear)
- Plan has critical gaps preventing starting
- You don't understand an instruction
- Verification fails repeatedly

**A timeout is not permission to weaken the gate.** Diagnose whether the process is hung or a
healthy progressing process. Only the latter may receive a documented finite timeout override
with a recorded justification; after recording it, run the complete sensor gate again and continue only after the
conclusive rerun reports `overall: pass`.

**Ask for clarification rather than guessing.**

## When to Revisit Earlier Steps

**Return to Review (Step 1) when:**
- Partner updates the plan based on your feedback
- Fundamental approach needs rethinking

**Don't force through blockers** - stop and ask.

## Remember
- Review plan critically first
- Follow plan steps exactly
- Don't skip verifications
- Reference skills when plan says to
- Between serial slices: report verified evidence, then follow the declared execution mode without skipping review or admission
- Stop when blocked, don't guess
- Never start implementation on main/master branch without explicit user consent

## Integration

**Required workflow skills:**
- **using-git-worktrees** - REQUIRED: Set up isolated workspace before starting
- **writing-plans** - Creates the plan this skill executes
- **verification-before-completion** - Defines what "done" requires, including the AWM sensor gate (`awm sensors run`) applied per task and serial slice <!-- AWM-INTEGRATION: executing-plans-sensor-gate -->
- **finishing-a-development-branch** - Complete development after all tasks
