---
name: development-process
version: "1.7.2"
license: Apache-2.0
description: Use when starting, resuming, or routing a development task
---

# Development Process

Invoke the `development-process` skill. You do NOT write code directly: read state, decide the phase, and invoke the next skill.

## Harness Preflight (advisory at entry)

Before reading state, run `awm preflight`. Report its result in one line and continue:
this entry check is advisory, not blocking. If the command is unavailable, say so once
and continue; `writing-plans` owns the blocking preflight gate before execution.

WHEN an active plan exists, read `references/execution-mode.md` before routing.
WHEN UI is pending or a plan declares `**Design artifacts:**`, read
`references/frontend-handoff.md` and apply its blocking bundle gate.
IF a business-level unknown appears during development, read
`references/business-gap.md`; do not improvise the answer.

WHEN research or documentation changes no executable behavior, require only
proportional structural verification. Do not require full tests, sensors, CI
monitoring, or a PR solely because the artifact was written.

Changes to skill behavior are executable process changes and retain normal quality gates.

## Lifecycle State

Never create an ad-hoc plan while classifying.

| Evidence | State | Route |
|---|---|---|
| Ready brief handed from product | Brief ready | `brainstorming` with its path |
| No design/plan | New | `brainstorming` |
| Design has UI rows with Status: `pending` | UI Design pending | `ui-design` |
| Design has no pending UI and no plan | Designed | `writing-plans` |
| Plan has incomplete tasks | Executing | `executing-plans` or `subagent-driven-development` |
| Completed plan, no `awm-qa-complete` | QA Pending | `post-implementation-qa` |
| `awm-qa-complete`, no `awm-docs-complete` | Docs pending | `post-implementation-docs` |
| `awm-docs-complete`, no `awm-retro-complete` | Retro pending | Invoke `harness-retro` |
| `awm-retro-complete` | Finishing | `finishing-a-development-branch` |

QA → docs → retro → finish is mandatory. Never bypass a missing marker.
Lifecycle transitions: "post-implementation-qa" -> "post-implementation-docs" -> "harness-retro".

## Request Routing

- New/build request: inspect design/plan state, then route from the table.
- Bug: invoke `systematic-debugging`; use `brainstorming` for non-trivial fixes and `test-driven-development` for straightforward fixes.
- Resume: scan current artifacts and route from the table.
- Review/readiness: invoke `requesting-code-review`.

Cross-cutting gates: use `test-driven-development` for implementation, `systematic-debugging` on failures, review as appropriate, `post-implementation-qa` before docs, and `verification-before-completion` before a completion claim.

## Interactive Handoff

Report the detected state, next skill, and reason. Never invoke the next skill without user confirmation. The next skill takes control after approval.

For frontend discovery, search `"$HOME/.agents/skills/`, `".agents/skills/`,
`"$HOME/.claude/skills/`, and `".claude/skills/`; the shared global root is
required for Codex/OpenCode portability.
