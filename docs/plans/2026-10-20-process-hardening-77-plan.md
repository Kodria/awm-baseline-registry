# Process hardening (#77) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `subagent-driven-development`
> (recommended) or `executing-plans` to implement this plan task-by-task. Steps
> use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the triage of #77: pin QA worktree mutations + severity rubric, and extend verify-cmd-source to skill/plan CLI assertions.

**Architecture:** Process-only changes in registry skills + one mutation-pinned contract. No CLI code. Discarded from #77: auto CI mutation battery; broad shell `-m` portability rule.

**Tech Stack:** Markdown skills, Node test contracts, GitHub Actions validate/auto-tag.

**Modo de ejecución:** desatendido

**Modo de despacho:** proveedor-nativo

**Change Record:** process-hardening-77

**Criterios de aceptación:**
- `- deep-review-prompt declara severity rubric + worktree-only mutations → contrato r77 rojo si se borran`
- `- writing-plans y writing-skills obligan verify-cmd-source para hechos de CLI → contrato r77 rojo si se borran`
- `- bumps de skill/bundle + check-skill-version-bumps.sh verde`

## Status

Implemented on branch `cursor/process-hardening-77-3fdc` after systematic diagnosis (`/opt/cursor/artifacts/issue-77-systematic-diagnosis.md`). Compact slices collapsed into a single delivery: RED contract → GREEN skills → wire CI → version bumps.
