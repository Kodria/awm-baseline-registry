# Sensor execution optimization — Registry plan (#236)

> **For agentic workers:** REQUIRED SUB-SKILL: Use `subagent-driven-development`
> (recommended) or `executing-plans` to implement this plan task-by-task. Steps
> use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship pack `inputs`/`closureOnly` defaults, skill phase gates (`--slice` vs full), schema/`minCliVersion`/certification, and executable contracts — after the companion CLI is on npm.

**Architecture:** Content-only changes in this registry. Depends on published `agentic-workflow-manager` that accepts `inputs` and sensor-level `closureOnly`. Design: `docs/plans/2026-10-27-sensor-execution-optimization-design.md` (registry half) + CLI system design on `Kodria/agentic-workflow`.

**Tech Stack:** Markdown skills, JSON packs/schema, Node test contracts.

**Change Record:** ninguno — content registry; release via conventional-commit PR title + auto-tag

**Criterios de aceptación:**
- Packs: boundable `inputs` only on typecheck/lint; mutation `closureOnly: true`; format/test/mutation/security without default inputs
- Skills require `--slice` for slice DONE and full gate for QA/docs/finish; forbid partial closure evidence
- `minCliVersion` equals the already-published CLI version; `pack.schema.json` allows `inputs` + sensor `closureOnly`
- `npm run test:sensor-execution-optimization` RED→GREEN; `./scripts/check-skill-version-bumps.sh origin/main` clean

**Modo de ejecución:** interactivo

**Modo de despacho:** proveedor-nativo

**Prerequisite:** CLI plan merged and npm version N published. Set `minCliVersion` to N in this PR.

<!-- AWM:COMPACT-SLICES:START v1 -->
{
  "schema": "compact-slices/v1",
  "planId": "sensor-execution-optimization-registry",
  "requirements": [
    "RF-1.9", "RF-3.1", "RF-3.2", "RF-3.5", "RF-3.6",
    "RF-5.1", "RF-5.2", "RF-5.3", "RF-5.4", "RF-5.5", "RF-5.6", "RF-5.7", "RF-5.8", "RF-5.9",
    "RF-7.1", "RF-7.2", "RF-7.3"
  ],
  "sources": [
    {
      "id": "SRC-DESIGN",
      "path": "docs/plans/2026-10-27-sensor-execution-optimization-design.md",
      "locator": "## Requirements (registry-owned)",
      "fact": "Registry-owned RFs for conservative inputs, setup-sensors teaching, --slice skill gates, RF-7 rollout after CLI publish."
    },
    {
      "id": "SRC-PACK-SCHEMA",
      "path": "sensor-packs/pack.schema.json",
      "locator": "\"variant\"",
      "fact": "variant additionalProperties false today; sensor object must gain closureOnly; variants may gain inputs."
    },
    {
      "id": "SRC-REGISTRY",
      "path": "awm-registry.json",
      "locator": "minCliVersion",
      "fact": "minCliVersion is 9.14.0 today; must rise to published CLI that parses new fields."
    },
    {
      "id": "SRC-SETUP",
      "path": "skills/setup-sensors/SKILL.md",
      "locator": "name: setup-sensors",
      "fact": "setup-sensors authoring skill; must teach inputs and closureOnly."
    },
    {
      "id": "SRC-PKG",
      "path": "package.json",
      "locator": "\"scripts\"",
      "fact": "Add test:sensor-execution-optimization script pointing at r18 contract."
    }
  ],
  "commands": [
    {
      "id": "CMD-CONTRACT",
      "program": "npm",
      "args": ["run", "test:sensor-execution-optimization"],
      "covers": ["RF-1.9", "RF-3.1", "RF-3.2", "RF-3.5", "RF-3.6", "RF-5.1", "RF-5.2", "RF-5.3", "RF-5.4", "RF-5.5", "RF-5.6", "RF-5.7", "RF-5.8", "RF-5.9", "RF-7.1", "RF-7.2", "RF-7.3"]
    },
    {
      "id": "CMD-VERSION-BUMPS",
      "program": "npm",
      "args": ["run", "test:version-bumps"],
      "covers": ["RF-3.2", "RF-5.1", "RF-5.9"]
    }
  ],
  "slices": [
    {
      "id": "S1",
      "title": "Contract harness and package script",
      "requirements": ["RF-7.2"],
      "dependsOn": [],
      "sectionAnchor": "slice-s1",
      "sources": ["SRC-DESIGN", "SRC-PKG"],
      "redCommands": ["CMD-CONTRACT"],
      "greenCommands": ["CMD-CONTRACT"],
      "reviewEvidence": ["specification", "code-quality"],
      "risk": "full-context",
      "fallback": ["public-contract"]
    },
    {
      "id": "S2",
      "title": "Pack inputs, closureOnly, schema, minCliVersion",
      "requirements": ["RF-1.9", "RF-3.1", "RF-7.1", "RF-7.3"],
      "dependsOn": ["S1"],
      "sectionAnchor": "slice-s2",
      "sources": ["SRC-DESIGN", "SRC-PACK-SCHEMA", "SRC-REGISTRY"],
      "redCommands": ["CMD-CONTRACT"],
      "greenCommands": ["CMD-CONTRACT"],
      "reviewEvidence": ["specification", "code-quality"],
      "risk": "full-context",
      "fallback": ["public-contract"]
    },
    {
      "id": "S3",
      "title": "Skills phase gates and setup-sensors teaching",
      "requirements": ["RF-3.2", "RF-3.5", "RF-3.6", "RF-5.1", "RF-5.2", "RF-5.3", "RF-5.4", "RF-5.5", "RF-5.6", "RF-5.7", "RF-5.8", "RF-5.9"],
      "dependsOn": ["S1"],
      "sectionAnchor": "slice-s3",
      "sources": ["SRC-DESIGN", "SRC-SETUP"],
      "redCommands": ["CMD-CONTRACT", "CMD-VERSION-BUMPS"],
      "greenCommands": ["CMD-CONTRACT", "CMD-VERSION-BUMPS"],
      "reviewEvidence": ["specification", "code-quality"],
      "risk": "full-context",
      "fallback": ["public-contract"]
    }
  ],
  "closureCommands": ["CMD-CONTRACT", "CMD-VERSION-BUMPS"]
}
<!-- AWM:COMPACT-SLICES:END v1 -->

<a id="slice-s1"></a>
### Slice S1: Contract harness and package script

#### Surfaces
Own RF-7.2 (prerequisite encoding): add `package.json` script `test:sensor-execution-optimization` → `node --test tests/r18-sensor-execution-optimization-contract.test.mjs` and a failing stub contract that asserts prerequisite documentation (min CLI must be set to a published version — assert fails until S2 fills it). Grouping: harness first so later slices have RED.

#### Implementation
1. RED — `npm run test:sensor-execution-optimization` fails because the script or contract file is missing.
2. Add `package.json` script pointing at `tests/r18-sensor-execution-optimization-contract.test.mjs`. The contract smoke-checks that the design file exists and that the script is wired; content asserts for packs/skills are added in the same file by S2/S3.
3. GREEN — CMD-CONTRACT passes the smoke checks (content asserts from later slices may still be absent until those slices land; keep smoke asserts only in S1's GREEN bar, and add content asserts in S2/S3 so each slice can go RED then GREEN independently).

#### Edge cases
If r18 name taken, use next free rNN and keep script name stable.

#### Evidence
CMD-CONTRACT.

#### Fallback
Public-contract.

<a id="slice-s2"></a>
### Slice S2: Pack inputs, closureOnly, schema, minCliVersion

#### Surfaces
Own RF-1.9, RF-3.1, RF-7.1, RF-7.3: `sensor-packs/*/pack.json`, `pack.schema.json`, `awm-registry.json`, `cli-certification.json` as required. Grouping: pack machine contract.

#### Implementation
1. RED — contract asserts: no default inputs on format/test/mutation/security; typecheck/lint may have inputs; mutation closureOnly true at **sensor** level; schema allows inputs on variants and closureOnly on sensors; minCliVersion equals the published CLI version recorded in the PR description (inject as constant in test updated in this slice).
2. Author packs/schema/registry metadata. Confirm CLI version N is on npm before setting minCliVersion to N.
3. GREEN — CMD-CONTRACT.

#### Edge cases
Do not publish tags with new fields before minCliVersion bump on the same release train.

#### Evidence
CMD-CONTRACT.

#### Fallback
Amend minCliVersion if publish raced.

<a id="slice-s3"></a>
### Slice S3: Skills phase gates and setup-sensors teaching

#### Surfaces
Own RF-3.2, 3.5–3.6, RF-5.1–5.9 across lifecycle skills + setup-sensors; bump skill/bundle/catalog versions. Grouping: agent-facing prose.

#### Implementation
1. RED — section-scoped contract asserts for --slice DONE, full QA/docs/finish, forbid partial closure, setup-sensors inputs/closureOnly/mutation override teaching, min CLI mentioned for new flags.
2. Edit skills; bump versions; CMD-VERSION-BUMPS.
3. GREEN — CMD-CONTRACT + CMD-VERSION-BUMPS.

#### Edge cases
Read Common Mistakes / Red Flags for contradictions before DONE. Portable skills: hard deps need port overrides if any.

#### Evidence
CMD-CONTRACT, CMD-VERSION-BUMPS.

#### Fallback
Public-contract; fix vacuous asserts by mutation check.

## Coverage matrix

| Requirement | Slice | Command |
|---|---|---|
| RF-7.2 | S1 | CMD-CONTRACT |
| RF-1.9, RF-3.1, RF-7.1, RF-7.3 | S2 | CMD-CONTRACT |
| RF-3.2/3.5/3.6, RF-5.* | S3 | CMD-CONTRACT, CMD-VERSION-BUMPS |

## Handoff

PR title conventional (`feat:`). Merge only after CLI npm publish. Auto-tag handles registry version.

## Amendment log

- **2026-10-27:** Created from CLI audit r2 [B] split.
