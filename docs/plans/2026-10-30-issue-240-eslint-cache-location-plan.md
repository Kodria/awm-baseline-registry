# Issue #240 R4 — js-ts ESLint `--cache-location` (companion)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (or subagent-driven-development). Steps use checkbox (`- [ ]`) syntax.

**Goal:** Keep ESLint tool-cache files under `node_modules/.cache/eslint/` so operator runs do not create a root `.eslintcache` that admission's read-only snapshot treats as a worktree mutation (Kodria/agentic-workflow#240 R4; CLI defense lands in agentic-workflow#241).

**Architecture:** Pack-only argv change on every `lint` variant `command` / `changedCommand` that already passes `--cache`. Contract in `tests/sensor-pack-js-ts-variants.test.mjs`. No CLI or skill edits.

**Tech Stack:** sensor-pack JSON, Node test assert.

**Modo de ejecución:** desatendido
**Modo de despacho:** proveedor-nativo
**Change Record:** ninguno — registry pack-only companion; no `docs/changes/` workflow in this repo and prior pack-only argv PRs ship via conventional-commit tag without Change Record.

## Requirements

- **R4:** Every `js-ts` lint variant that enables ESLint `--cache` MUST also pass `--cache-location node_modules/.cache/eslint/` on both `command.args` and `changedCommand.args`.

## Slice S1: pack + contract

**Owns:** R4

- [ ] Add `assertEslintCacheLocation` to `tests/sensor-pack-js-ts-variants.test.mjs` (RED without pack edit).
- [ ] Insert `"--cache-location", "node_modules/.cache/eslint/"` immediately after `"--cache"` in all eight lint argv arrays in `sensor-packs/js-ts/pack.json`.
- [ ] Run `node --test tests/sensor-pack-shape.test.mjs` (imports the js-ts variants contract) and confirm GREEN.
- [ ] Open PR titled `fix(sensors): point js-ts eslint --cache under node_modules` linking #240 / agentic-workflow#241.
