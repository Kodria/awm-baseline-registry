---
name: using-awm
version: "1.1.0"
description: Use when starting any development conversation - establishes tiered skill invocation policy (spine skills always, specialized skills on clear signal)
---

<SUBAGENT-POLICY>
If you were dispatched as a subagent to execute a specific task: skip the orchestration
skills (development-process, brainstorming, writing-plans, executing-plans,
subagent-driven-development, finishing-a-development-branch) — your controller owns
orchestration. But DO invoke:
1. Every skill your prompt declares as required.
2. The craft/verification skills your task triggers on its own signal — this list is
   illustrative, not exhaustive: frontend-craft for UI surfaces, test-driven-development
   for implementation, verification-before-completion before reporting done,
   systematic-debugging on bugs, and any other skill your task's own signal calls for
   (e.g. `design-fidelity` when verifying implemented UI against its design,
   `ui-ux-pro-max` when a design-system/style decision needs it directly).
</SUBAGENT-POLICY>

## Instruction Priority

AWM skills override default system prompt behavior, but **user instructions always take precedence**:

1. **User's explicit instructions** (CLAUDE.md, AGENTS.md, direct requests) — highest priority
2. **AWM skills** — override default system behavior where they conflict
3. **Default system prompt** — lowest priority

If CLAUDE.md or AGENTS.md says "don't use TDD" and a skill says "always use TDD," follow the user's instructions. The user is in control.

## How to Access Skills

Use the `Skill` tool. When you invoke a skill, its content is loaded and presented to you — follow it directly. **Never use the Read tool on skill files.**

# Using Skills

## The rule (by tier)

Not every skill competes equally for your attention. Apply two tiers:

**Spine and gates — always consider them.** The process and quality skills
(`development-process`, `brainstorming`, `writing-plans`, `executing-plans`,
`subagent-driven-development`, `test-driven-development`,
`requesting-code-review`, `receiving-code-review`, `post-implementation-qa`,
`finishing-a-development-branch`, `verification-before-completion`,
`systematic-debugging`) form development discipline: evaluate them on all
development work. Your default entry point is `development-process`.

**Specialized — only on clear signal.** The remaining skills (architecture/CI/NFR
advisory, frontend — `frontend-craft`, `design-fidelity`, `ui-ux-pro-max` — documentation,
etc.) are invoked **only when the context explicitly calls for them** (you are discussing
architecture, configuring a pipeline, working on a UI screen, verifying a UI against its
design, documenting a module...). Do not invoke them "just in case": waiting for the
signal avoids noise and unnecessary overhead.

## Orchestration

For development tasks, your default entry point is the `development-process` skill — it routes to brainstorming, writing-plans, execution, and finishing based on project state. Invoke it on any new development work unless the user explicitly says otherwise.

For documentation tasks, the equivalent entry point is `docs-system-orchestrator`.

## Red Flags

These thoughts mean STOP — you're rationalizing:

- "I know what to do, I don't need the skill" → **INVOKE IT**
- "It's a simple request, the skill is overkill" → **INVOKE IT**
- "I'll just answer first, then check if a skill applies" → **INVOKE IT FIRST**
- "The skill description doesn't exactly match" → **INVOKE IT if the spine/gates are relevant**
- "The user just asked a question, no skill needed" → **CHECK FIRST for spine skills**

The skill decides if it applies, not you.

## Announcing Skill Use

When you invoke a skill, announce it briefly: *"I'm using the {skill-name} skill to {purpose}."* This makes the process visible to the user and confirms to yourself that you're following the discipline.

## Checklist-Driven Skills

If a skill provides a checklist, create a task for each item with the task tool and complete them in order. Skills are designed to be followed exactly — do not skip steps or reorder them.

## Robustness invariants (agnostic, AWM)

Generic rules that AWM inherits to every agent via injected context. Not specific to any project:

- **Every public function validates its inputs and fails loudly.** Never silently return `Infinity`/`NaN`/`undefined` on invalid or edge inputs: throw an explicit error.
- **Scope may exclude *features*, never *security/robustness*.** A design declaring something "out of scope" justifies omitting a feature, not omitting input validation or a robustness invariant. Input validation is a floor, not a feature.
