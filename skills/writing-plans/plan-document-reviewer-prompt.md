# Plan Document Reviewer Prompt Template

Use this template when dispatching a plan document reviewer subagent.

**Purpose:** Verify the plan is complete, matches the spec, and has proper task decomposition.

**Dispatch after:** The complete plan is written.

```
Task tool (general-purpose):
  description: "Review plan document"
  prompt: |
    You are a plan document reviewer. Verify this plan is complete and ready for implementation.

    **Plan to review:** [PLAN_FILE_PATH]
    **Spec for reference:** [SPEC_FILE_PATH]

    ## What to Check

    | Category | What to Look For |
    |----------|------------------|
    | Completeness | TODOs, placeholders, incomplete tasks, missing steps |
    | Spec Alignment | Plan covers spec requirements, no major scope creep |
    | Task Decomposition | Tasks have clear boundaries, steps are actionable |
    | Buildability | Could an engineer follow this plan without getting stuck? |
    | Requirement tags | When the spec has a `## Requirements` section, each task carries a `_Requirements: R…_` tag naming the IDs it satisfies, and tests name the ID they verify |
    | Traceability | The Self-Review matrix covers every spec requirement ID — forward gaps (a requirement ID with no task/test) are flagged |
    | Orphans | No task or test lacks a requirement ID (backward gap = scope creep / orphan code) |

    (If the spec intentionally has no `## Requirements` section — a trivial one-file diff per the tier guardrail — the three rows above do not apply; do not flag their absence.)

    ## Calibration

    **Only flag issues that would cause real problems during implementation.**
    An implementer building the wrong thing or getting stuck is an issue.
    A requirement left untraceable — no task, no test, or an untagged orphan task —
    is an issue. Minor wording, stylistic preferences, and "nice to have"
    suggestions are not.

    **Cite concrete evidence per finding:** name the task/step or the requirement ID
    the issue lives in (e.g. `Task 3 / R2.1`). A finding with no such anchor is not
    actionable — drop it.

    Approve unless there are serious gaps — missing requirements from the spec,
    contradictory steps, placeholder content, untraceable requirements, or tasks
    so vague they can't be acted on.

    ## Output Format

    ## Plan Review

    **Status:** Approved | Issues Found

    **Issues (if any):**
    - [Task X, Step Y]: [specific issue] - [why it matters for implementation]

    **Recommendations (advisory, do not block approval):**
    - [suggestions for improvement]
```

**Reviewer returns:** Status, Issues (if any), Recommendations
