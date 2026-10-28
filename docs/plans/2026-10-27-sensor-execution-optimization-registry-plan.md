# Sensor execution optimization — Registry plan (#236)

> **For agentic workers:** REQUIRED SUB-SKILL: Use `subagent-driven-development`
> (recommended) or `executing-plans` to implement this plan task-by-task. Steps
> use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship pack `inputs`/`closureOnly` (extension-bound), skill phase gates, schema/`minCliVersion`/CLI re-certification, and mirror-validator updates — after the companion CLI is on npm.

**Architecture:** Content-only in this registry. Normative RF text lives only in the CLI design (audit [X1]); this plan implements those IDs plus RF-R.0. Design pointer: `docs/plans/2026-10-27-sensor-execution-optimization-design.md`.

**Tech Stack:** Markdown skills, JSON packs/schema, Node test contracts, `scripts/cli-certification.mjs`.

**Change Record:** ninguno — content registry; release via conventional-commit PR title + auto-tag

**Criterios de aceptación:**
- Pack defaults: typecheck/lint inputs by extension repo-wide (RF-1.9); no directory-anchored defaults; mutation `closureOnly: true`; format/test/mutation/security without default inputs
- Skills: `--slice` for slice DONE; full gate for QA/docs/finish; forbid partial closure evidence
- `minCliVersion` and `certifiedCli.version` both ≥ `FIRST_CLI_WITH_INPUTS` (published N); mirror validator + equivalence tests accept/reject `inputs`/`closureOnly` per RF-1.5
- `npm run test:sensor-execution-optimization` and `npm run test:version-bumps` green

**Modo de ejecución:** interactivo

**Modo de despacho:** proveedor-nativo

**Prerequisite:** CLI npm version N published before executing S2/S3. Docs-only merge of this plan PR is allowed earlier.

<!-- AWM:COMPACT-SLICES:START v1 -->
{
  "schema": "compact-slices/v1",
  "planId": "sensor-execution-optimization-registry",
  "requirements": [
    "RF-R.0",
    "RF-1.9", "RF-3.1", "RF-3.2", "RF-3.5", "RF-3.6",
    "RF-5.1", "RF-5.2", "RF-5.3", "RF-5.4", "RF-5.5", "RF-5.6", "RF-5.7", "RF-5.8", "RF-5.9",
    "RF-7.1", "RF-7.2", "RF-7.3", "RF-7.4"
  ],
  "sources": [
    {
      "id": "SRC-DESIGN",
      "path": "docs/plans/2026-10-27-sensor-execution-optimization-design.md",
      "locator": "## Registry-local requirement",
      "fact": "Pointer design cites CLI normative IDs; RF-R.0 harness; RF-7.1 re-cert and RF-7.4 mirror validator called out for S2."
    },
    {
      "id": "SRC-PACK-SCHEMA",
      "path": "sensor-packs/pack.schema.json",
      "locator": "\"variant\"",
      "fact": "variant additionalProperties false today; sensors need closureOnly; variants need inputs."
    },
    {
      "id": "SRC-REGISTRY",
      "path": "awm-registry.json",
      "locator": "minCliVersion",
      "fact": "minCliVersion is 9.14.0 today; must rise to published CLI that parses new fields."
    },
    {
      "id": "SRC-CERT",
      "path": "cli-certification.json",
      "locator": "certifiedCli",
      "fact": "certifiedCli floor must be re-certified to N with sourceSha and protocolDigest or --assert-floor fails."
    },
    {
      "id": "SRC-MIRROR",
      "path": "tests/support/sensor-pack-v2-validator.mjs",
      "locator": "function exactFields",
      "fact": "Mirror exactFields on sensor/variant omit inputs and closureOnly; must gain them plus RF-1.5 glob checks."
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
      "covers": ["RF-R.0", "RF-1.9", "RF-3.1", "RF-3.2", "RF-3.5", "RF-3.6", "RF-5.1", "RF-5.2", "RF-5.3", "RF-5.4", "RF-5.5", "RF-5.6", "RF-5.7", "RF-5.8", "RF-5.9", "RF-7.1", "RF-7.2", "RF-7.3", "RF-7.4"]
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
      "requirements": ["RF-R.0"],
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
      "title": "Packs, schema, minCliVersion, re-cert, mirror validator",
      "requirements": ["RF-1.9", "RF-3.1", "RF-7.1", "RF-7.2", "RF-7.3", "RF-7.4"],
      "dependsOn": ["S1"],
      "sectionAnchor": "slice-s2",
      "sources": ["SRC-DESIGN", "SRC-PACK-SCHEMA", "SRC-REGISTRY", "SRC-CERT", "SRC-MIRROR"],
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
Own RF-R.0 only: add `package.json` script `test:sensor-execution-optimization` → `node --test tests/r18-sensor-execution-optimization-contract.test.mjs`. Smoke asserts: design pointer file exists; script is wired. No pack/skill/version content asserts in S1 GREEN. Grouping: harness first.

#### Implementation
1. RED — `npm run test:sensor-execution-optimization` fails because the script or contract file is missing.
2. Add the script and a smoke-only contract (design path + script wiring). Content asserts are added by S2/S3 in the same file so each later slice can go RED then GREEN on its own.
3. GREEN — CMD-CONTRACT passes smoke asserts only.

#### Edge cases
If r18 name is taken, use the next free rNN and keep the script name stable.

#### Evidence
CMD-CONTRACT.

#### Fallback
Public-contract.

<a id="slice-s2"></a>
### Slice S2: Packs, schema, minCliVersion, re-cert, mirror validator

#### Surfaces
Own RF-1.9, RF-3.1, RF-7.1, RF-7.2, RF-7.3, RF-7.4: packs, `pack.schema.json`, `awm-registry.json`, `cli-certification.json` re-cert, `tests/support/sensor-pack-v2-validator.mjs`, `tests/sensor-pack-schema-equivalence.test.mjs`. Grouping: machine contract + certification floor.

#### Implementation
1. RED — contract asserts (section-scoped, non-vacuous):
   - No default inputs on format/test/mutation/security; typecheck/lint may have inputs.
   - Pack-default inputs are extension-bound repo-wide per RF-1.9; reject any pack-default glob that is directory-anchored (a path segment before `**` that names a source dir such as `src/`).
   - Mutation `closureOnly: true` at sensor level; schema allows variant `inputs` and sensor `closureOnly`.
   - Constant `FIRST_CLI_WITH_INPUTS` set once to published N; assert `minCliVersion ≥ FIRST_CLI_WITH_INPUTS` whenever any pack declares `inputs` or `closureOnly`; assert `certifiedCli.version ≥ minCliVersion`.
   - Mirror validator allows the new fields and enforces RF-1.5 glob rules; equivalence suite has positive and negative cases for both fields.
2. Confirm CLI version N is on npm. Author packs/schema. Re-certify `certifiedCli` via `scripts/cli-certification.mjs` (`version`, `sourceSha`, `protocolDigest`). Update mirror validator + equivalence tests. Document negativeControls expectation if they load packs.
3. GREEN — CMD-CONTRACT.

#### Edge cases
Do not ship new fields on a tag without the matching `minCliVersion` and `certifiedCli` bump on the same release train. Docs-only PRs earlier are fine; this slice waits for npm N.

#### Evidence
CMD-CONTRACT.

#### Fallback
Amend `FIRST_CLI_WITH_INPUTS` if the publish train moves; never lower the floor below a CLI that parses the fields.

<a id="slice-s3"></a>
### Slice S3: Skills phase gates and setup-sensors teaching

#### Surfaces
Own RF-3.2, RF-3.5–3.6, RF-5.1–5.9 across lifecycle skills + setup-sensors; bump skill/bundle/catalog versions. Grouping: agent-facing prose.

#### Implementation
1. RED — section-scoped contract asserts for `--slice` DONE, full QA/docs/finish, forbid partial closure evidence, setup-sensors inputs/closureOnly/mutation override teaching, min CLI named for new flags (cite CLI design IDs, do not fork RF prose).
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
| RF-R.0 | S1 | CMD-CONTRACT |
| RF-1.9, RF-3.1, RF-7.1–7.4 | S2 | CMD-CONTRACT |
| RF-3.2/3.5/3.6, RF-5.1–5.9 | S3 | CMD-CONTRACT, CMD-VERSION-BUMPS |

## Handoff

PR title conventional (`feat:` for content). Content merge after CLI npm publish. Auto-tag handles registry version.

## Amendment log

- **2026-10-27:** Created from CLI audit r2 [B] split.
- **2026-10-27 r3:** R1 re-cert, R2 mirror validator, R3 extension-bound defaults, R4 RF-7.2→S2 + non-tautological floor, X1 cite-only design.
