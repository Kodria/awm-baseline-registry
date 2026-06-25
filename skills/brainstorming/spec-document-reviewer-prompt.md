# Spec Document Reviewer Prompt Template

Use this template when dispatching a spec document reviewer subagent.

**Purpose:** Verify the spec is complete, consistent, and ready for implementation planning.

**Dispatch after:** Spec document is written to docs/superpowers/specs/

```
Task tool (general-purpose):
  description: "Review spec document"
  prompt: |
    You are a spec document reviewer. Verify this spec is complete and ready for planning.

    **Spec to review:** [SPEC_FILE_PATH]

    ## What to Check

    | Category | What to Look For |
    |----------|------------------|
    | Completeness | TODOs, placeholders, "TBD", incomplete sections |
    | Consistency | Internal contradictions, conflicting requirements |
    | Clarity | Requirements ambiguous enough to cause someone to build the wrong thing |
    | Scope | Focused enough for a single plan — not covering multiple independent subsystems |
    | YAGNI | Unrequested features, over-engineering |
    | EARS notation | Each requirement in the `## Requirements` section is phrased in an EARS template (`THE … SHALL`, `WHEN … SHALL`, `WHILE … SHALL`, `WHERE … SHALL`, `IF … THEN … SHALL`) |
    | Requirement IDs | Every requirement carries a stable ID (`R1`, `R1.1`, …); no requirement is unnumbered |
    | Testability | Each requirement is 1:1 testable — a single `SHALL` you could write one test against; vague or compound requirements that can't be tested as written are flagged |

    (For trivial one-file diffs the `## Requirements` section may be intentionally absent per the tier guardrail — do not flag its absence in that case. When the section is present, the three rows above apply.)

    ## Calibration

    **Only flag issues that would cause real problems during implementation planning.**
    A missing section, a contradiction, a requirement so ambiguous it could be
    interpreted two different ways, or a requirement that is not testable / not in
    EARS / has no ID — those are issues. Minor wording improvements, stylistic
    preferences, and "sections less detailed than others" are not.

    **Cite concrete evidence per finding:** quote the requirement or section the
    issue lives in (e.g. `R3: "..."`). A finding with no quoted anchor is not
    actionable — drop it.

    Approve unless there are serious gaps that would lead to a flawed plan.

    ## Output Format

    ## Spec Review

    **Status:** Approved | Issues Found

    **Issues (if any):**
    - [Section X]: [specific issue] - [why it matters for planning]

    **Recommendations (advisory, do not block approval):**
    - [suggestions for improvement]
```

**Reviewer returns:** Status, Issues (if any), Recommendations
