# Validate: drop push-to-main trigger (#83) Implementation Plan

<!-- awm-qa-complete: 2026-11-11 -->
<!-- awm-docs-complete: 2026-11-11 -->
<!-- awm-retro-complete: 2026-11-11 -->


> **For agentic workers:** REQUIRED SUB-SKILL: Use `subagent-driven-development`
> (recommended) or `executing-plans` to implement this plan task-by-task. Steps
> use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop double-running Validate on every merge to `main` by leaving `validate.yml` as PR-only with cancel-in-progress concurrency, while Auto-tag remains the sole post-merge certification gate (#83).

**Architecture:** YAML trigger surgery only. `validate.yml` loses `push: branches: [main]` and gains a PR concurrency group that cancels superseded runs. `auto-tag.yml` stays unchanged (`push` to `main`, `cancel-in-progress: false`, existing `paths-ignore`). A Node test pin kills regressions and must be named in `validate.yml` so `workflow-test-coverage` stays green.

**Tech Stack:** GitHub Actions YAML, Node `node:test` contract under `tests/`.

**Change Record:** ninguno — content registry; release via conventional-commit PR title + auto-tag (no `docs/changes/` workflow)

**Criterios de aceptación:**
- Mergear un PR con cambios de contenido a `main` → Actions muestra Auto-tag y **no** una corrida nueva de Validate por el push a `main`
- Abrir/actualizar un PR → Validate corre completo; un segundo push al mismo PR cancela la corrida anterior
- Abrir Auto-tag tras el merge → sigue en cola si hay otra en vuelo (`cancel-in-progress: false`)

**Modo de ejecución:** interactivo

**Modo de despacho:** proveedor-nativo

**Origen:** #83. Dispatch: owner did not select AWM routing → `compact-slices/v1`. Design shortcut: owner approved skip of full brainstorming; concurrency included by owner decision. Context-budget gate: AGENTS+CONSTITUTION over by ~3KB — **Accept** for this plan (no prune/raise this turn).

**Harness note:** `awm preflight` reports `status: ungated` / exit 1 because `.awm/sensors.json` is deliberate `mode: opt-out` (“content-only registry; release proof is enforced by validate and auto-tag workflows”). That is the project gate, not a misconfiguration — do not “fix” by enabling sensors. Closure evidence is CMD-PIN + Validate/Auto-tag workflows.

<!-- AWM:COMPACT-SLICES:START v1 -->
{
  "schema": "compact-slices/v1",
  "planId": "validate-drop-main-push",
  "requirements": ["RF-1.1", "RF-1.2", "RF-1.3", "RF-1.4"],
  "sources": [
    {
      "id": "SRC-VALIDATE",
      "path": ".github/workflows/validate.yml",
      "locator": "on:",
      "fact": "Today `on:` declares bare `pull_request:` plus `push: branches: [main]`; there is no top-level `concurrency:`. Jobs include `sensor-certification` and `portability` with many `node --test tests/*.test.mjs` steps. After the change `on:` is only `pull_request:`, concurrency is `group: validate-${{ github.ref }}` / `cancel-in-progress: true`, and the new pin file basename must appear in a `run:` line."
    },
    {
      "id": "SRC-AUTOTAG",
      "path": ".github/workflows/auto-tag.yml",
      "locator": "concurrency:",
      "fact": "`on.push.branches` is `[main]` with `paths-ignore: ['docs/**', '.github/**']`; concurrency `group: auto-tag` and `cancel-in-progress: false`. This plan must not edit auto-tag.yml."
    },
    {
      "id": "SRC-COVERAGE",
      "path": "tests/workflow-test-coverage.test.mjs",
      "locator": "every top-level tests/*.test.mjs is named",
      "fact": "Every new top-level `tests/*.test.mjs` must appear by basename in some workflow file text or CI fails orphan detection (#61)."
    },
    {
      "id": "SRC-PKG",
      "path": "package.json",
      "locator": "\"scripts\"",
      "fact": "Scripts invoke `node --test` on named contracts (e.g. `test:workflow-coverage`). Add `test:validate-triggers` that runs the new pin plus `tests/workflow-test-coverage.test.mjs`."
    },
    {
      "id": "SRC-YAML-BLOCK",
      "path": "tests/sensor-pack-certification.test.mjs",
      "locator": "function block(text, indent, key)",
      "fact": "Existing contracts parse workflow YAML by slicing indented `key:` blocks with regex — no npm `yaml` dependency. Reuse that pattern for `on` and `concurrency` windows."
    }
  ],
  "commands": [
    {
      "id": "CMD-PIN",
      "program": "npm",
      "args": ["run", "test:validate-triggers"],
      "covers": ["RF-1.1", "RF-1.2", "RF-1.3", "RF-1.4"]
    }
  ],
  "slices": [
    {
      "id": "S1",
      "title": "PR-only validate.yml + structural pin",
      "requirements": ["RF-1.1", "RF-1.2", "RF-1.3", "RF-1.4"],
      "dependsOn": [],
      "sectionAnchor": "slice-s1",
      "sources": ["SRC-VALIDATE", "SRC-AUTOTAG", "SRC-COVERAGE", "SRC-PKG", "SRC-YAML-BLOCK"],
      "redCommands": ["CMD-PIN"],
      "greenCommands": ["CMD-PIN"],
      "reviewEvidence": ["specification", "code-quality"],
      "risk": "full-context",
      "fallback": ["public-contract"]
    }
  ],
  "closureCommands": ["CMD-PIN"]
}
<!-- AWM:COMPACT-SLICES:END v1 -->

## Requirements

- **RF-1.1:** `.github/workflows/validate.yml` `on:` triggers **only** `pull_request` (no `push` / `branches: [main]`).
- **RF-1.2:** `validate.yml` declares top-level `concurrency.group: validate-${{ github.ref }}` and `concurrency.cancel-in-progress: true`.
- **RF-1.3:** `.github/workflows/auto-tag.yml` keeps `push: branches: [main]` and `cancel-in-progress: false` (file unchanged by this plan).
- **RF-1.4:** `tests/validate-pr-only-triggers.test.mjs` fails if RF-1.1–RF-1.3 are violated; its basename is listed in `validate.yml`.

<a id="slice-s1"></a>
### Slice S1: PR-only validate.yml + structural pin

#### Surfaces
Owns RF-1.1–RF-1.4 as one cohesive Validate-trigger boundary. Files: `.github/workflows/validate.yml` (edit triggers + name the new test), `tests/validate-pr-only-triggers.test.mjs` (create). Do not edit `auto-tag.yml`.

#### Implementation
1. Add to `package.json` scripts:
   `"test:validate-triggers": "node --test tests/validate-pr-only-triggers.test.mjs tests/workflow-test-coverage.test.mjs"`

2. **RED** — Create `tests/validate-pr-only-triggers.test.mjs` using the same `block()` window helper as SRC-YAML-BLOCK (copy the small helper locally; do not import from the certification suite):

```javascript
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const normalizeLf = text => text.replace(/\r\n/g, '\n');
const read = relative => normalizeLf(fs.readFileSync(path.join(root, relative), 'utf8'));

function block(text, indent, key) {
  const lines = text.split(/\r?\n/);
  const opening = new RegExp(`^ {${indent}}${key}:\\s*(?:#.*)?$`);
  const start = lines.findIndex(line => opening.test(line));
  assert.notEqual(start, -1, `missing ${' '.repeat(indent)}${key}: YAML node`);
  const next = lines.slice(start + 1).findIndex(line => line.trim() && !line.startsWith(' '.repeat(indent + 1)));
  return lines.slice(start + 1, next === -1 ? undefined : start + 1 + next).join('\n');
}

test('RF-1.1: validate.yml on: is pull_request only', () => {
  const raw = read('.github/workflows/validate.yml');
  const on = block(raw, 0, 'on');
  assert.match(on, /^ {2}pull_request:\s*$/m);
  assert.doesNotMatch(on, /^ {2}push:\s*$/m);
  assert.doesNotMatch(on, /branches:\s*\[\s*main\s*\]/);
});

test('RF-1.2: validate.yml concurrency cancels superseded PR runs', () => {
  const concurrency = block(read('.github/workflows/validate.yml'), 0, 'concurrency');
  assert.match(concurrency, /^ {2}group: validate-\$\{\{ github\.ref \}\}\s*$/m);
  assert.match(concurrency, /^ {2}cancel-in-progress: true\s*$/m);
});

test('RF-1.3: auto-tag.yml still pushes on main and never cancels in-flight tags', () => {
  const raw = read('.github/workflows/auto-tag.yml');
  const on = block(raw, 0, 'on');
  assert.match(on, /^ {2}push:\s*$/m);
  assert.match(on, /^ {4}branches:\s*\[\s*main\s*\]\s*$/m);
  const concurrency = block(raw, 0, 'concurrency');
  assert.match(concurrency, /^ {2}group: auto-tag\s*$/m);
  assert.match(concurrency, /^ {2}cancel-in-progress: false\s*$/m);
});
```

3. Add `run: node --test tests/validate-pr-only-triggers.test.mjs` in the `portability` job of `validate.yml` next to the other contracts (SRC-COVERAGE) when creating the test so coverage stays green while RF-1.1/1.2 are still RED.

4. Run CMD-PIN → expect **RED** on RF-1.1 / RF-1.2.

5. **GREEN** — Edit `.github/workflows/validate.yml` header to:

```yaml
name: Validate registry

on:
  pull_request:

permissions:
  contents: read

concurrency:
  group: validate-${{ github.ref }}
  cancel-in-progress: true

jobs:
```

Keep every job body identical except the added `node --test tests/validate-pr-only-triggers.test.mjs` line.

6. Run CMD-PIN → expect **GREEN**.

7. Commit on branch `cursor/validate-drop-main-push-aac5` with message:
   `fix(ci): run validate.yml only on pull_request (#83)`.

#### Edge cases
- Restoring `push: branches: [main]` on validate must fail RF-1.1 (assert scoped to the `on` block only).
- `cancel-in-progress: false` on validate must fail RF-1.2.
- Changing auto-tag concurrency to `true` must fail RF-1.3 — do not edit auto-tag.
- Known residual (accepted, issue keeps auto-tag as-is): merges that touch **only** `docs/**` or `.github/**` do not start Auto-tag (`paths-ignore`). After this change those merges also skip Validate-on-push. PR Validate still covered the commit before merge; do not widen Auto-tag `paths-ignore` in this plan.

#### Evidence
CMD-PIN (`npm run test:validate-triggers`) runs the new pin plus `workflow-test-coverage` so RF-1.4’s basename obligation is mechanical. Spec + quality reviews for S1. Sensors: N/A (opt-out); Validate workflow is the gate.

#### Fallback
If `block()` indentation assumptions drift for a future workflow edit, amend with a durable plan change + revalidate — never skip RF-1.3 or drop the coverage basename.

## Traceability

| Req | Task(s) | Test(s) |
|-----|---------|---------|
| RF-1.1 | S1 step 4 | `RF-1.1: validate.yml on: is pull_request only` |
| RF-1.2 | S1 step 4 | `RF-1.2: validate.yml concurrency...` |
| RF-1.3 | S1 (no auto-tag edit) | `RF-1.3: auto-tag.yml still pushes on main...` |
| RF-1.4 | S1 steps 1–2 | pin file + `workflow-test-coverage` via CMD-PIN |
