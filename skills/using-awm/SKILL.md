---
name: using-awm
version: "1.4.1"
license: Apache-2.0
description: Use when starting any development conversation - establishes tiered skill invocation policy
---

# Using AWM

IF this worker was dispatched by a controller, THEN read
`references/subagent-policy.md` immediately and follow it before any other routing.

## Instruction Priority

User instructions always take precedence over AWM skills, which override default system behavior. Project instructions (`CLAUDE.md`, `AGENTS.md`) and direct requests are user instructions.

## Native Runtime Contract

Use the active platform’s native skill-loading mechanism: load or read a visible `SKILL.md` when its trigger applies. Runtime instructions name capabilities, not vendor APIs. Use native mechanisms to create or update a task plan, dispatch, steer, wait for, or stop a subagent when available, request user approval, inspect files, read files, or edit files, and run shell commands.

Codex and Claude Code follow this one provider-neutral contract. If a capability is unavailable, state the limitation and continue with a safe, in-scope alternative; do not invent a provider-specific tool or configuration.

## Using Skills

### Tiers

**Spine and gates — always consider them.** `development-process`, `product-process`, `brainstorming`, planning/execution, TDD, debugging, review, QA, completion, and verification govern development discipline.

**Specialized — only on clear signal.** Invoke architecture, NFR, frontend, design-fidelity, documentation, and similar skills only when the task explicitly calls for them.

## Orchestration

AWM routes a session to exactly one orchestrator.

IF one or more installed declared orchestrators may apply, THEN read
`references/declared-orchestrators.md` before choosing an orchestrator. If the
reference is unavailable, report the limitation and fall back to the built-in table;
never invent the missing contract.

### The built-in pair

| The session starts with… | Orchestrator |
|---|---|
| An idea/need without a formed requirement, architecture evaluation/extraction, or brief to resume | `product-process` |
| A concrete code requirement, bug, refactor, or ready brief handed to build | `development-process` |
| Ambiguous | ASK: “mature the idea (product layer) or build now (development)?” — never guess |

`brainstorming` explores solution space through `development-process`; `product-discovery` explores problem space. Documentation uses `docs-system-orchestrator`. Returning from development to product goes through `product-process`, never an improvised business answer.

Architecture disambiguation: a full, standalone evaluation that produces a portable
report goes to `product-process` → `architecture-assessment`. A one-off advisory
opinion mid-conversation, with no report artifact, stays with `architecture-advisor`
directly as a specialized skill.

## Announcing Skill Use

When loading a skill, announce: “I’m using the {skill-name} skill to {purpose}.”

## Checklist-Driven Skills

If a skill provides a checklist, create or update a task plan for its steps and complete them in order.

## Robustness Invariants

Every public function validates inputs and fails loudly: never silently return `Infinity`, `NaN`, or `undefined` for invalid or edge inputs. Scope may exclude features, never security/robustness; input validation is a floor.
