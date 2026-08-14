# Sensor pack authoring

`pack.json` is declarative registry data. The published AWM CLI alone interprets,
executes, and materializes it. Do not add scripts, absolute paths, shell
snippets, network access, installation steps, or project-specific defect classes.

The formal author contract is [pack.schema.json](pack.schema.json). The
[CLI configuration guide](https://github.com/Kodria/agentic-workflow/blob/main/docs/configuration.md)
explains project initialization and migration behavior.

## Pack versions

A pack without top-level `schemaVersion` is legacy. It remains operational for
backward compatibility but is always `compatible-unverified`: it has no variant
or certification evidence. Custom registries may retain a legacy pack while
they migrate; pin and review them as dependencies.

Version-aware packs use `schemaVersion: 2`. The nested generic class catalog
remains `coverage.schemaVersion: 1`; variants do not change that stable
catalog. Unknown versions fail closed rather than being guessed.

## A v2 variant

Every sensor declares applicability and nonempty variants. Pack, sensor,
variant, and defect-class IDs are stable lowercase kebab-case. Variant IDs are
unique across the pack, and equal-priority variants must not overlap in both
tool and runtime ranges.

```json
{
  "schemaVersion": 2,
  "name": "example-js",
  "description": "Example version-aware pack",
  "detects": ["package.json"],
  "sensors": {
    "lint": {
      "applicability": { "allFiles": ["package.json"] },
      "variants": [{
        "id": "eslint-10-flat",
        "priority": 100,
        "requirements": {
          "tool": "eslint", "toolRange": ">=10.0.0 <11.0.0",
          "runtime": "node", "runtimeRange": ">=20.19.0",
          "configFiles": ["eslint.config.awm.mjs"]
        },
        "certifiedRange": ">=10.0.0 <11.0.0",
        "command": {
          "executable": "eslint", "resolution": "node-modules-bin",
          "args": [".", "--config", "eslint.config.awm.mjs"]
        },
        "assets": ["eslint.config.awm.mjs"],
        "formatter": "eslint-llm", "probe": { "kind": "eslint-print-config" }
      }]
    }
  },
  "coverage": {
    "schemaVersion": 1,
    "classes": {
      "lint-errors": {
        "description": "Generic lint rule violations",
        "detectors": [{ "sensor": "lint" }],
        "remedy": {
          "summary": "Configure the lint sensor for this project",
          "command": "awm sensors init --pack example-js"
        }
      }
    }
  }
}
```

`toolRange` says when a tool can operate. `certifiedRange` says which versions
have reproducible certification evidence. A newer tool that passes its local
probe may be `compatible-unverified`; it is not certified until the range and
evidence are updated. Missing tools, incompatible versions, and inconclusive
probes never turn green by absence.

Commands are structured argv: `executable` is a logical tool name,
`resolution` is `node-modules-bin`, `python-environment`, or `path`, and `args`
are literal. Shell executables and embedded shell expressions are forbidden.
For changed files, use exactly one `{files}` argument with `fileInput`; never
embed the placeholder in another argument.

## Probes, assets, and coverage

Allowed probes are closed: `version`, `eslint-print-config`,
`typescript-show-config`, `semgrep-validate`, `package-script-present`, and
`config-present`. A registry cannot provide arbitrary probe argv.

Assets must be real regular files contained in the pack directory; escaping
symlinks are rejected. Declare every configuration asset in its variant and
reference only declared assets from that variant's command and requirements.
Coverage detectors must reference declared sensors. Defect classes must be
generic reusable concepts, never a project, customer, or repository name.

## Native, baseline, and hardening policy

Prefer native project configuration. A compatible AWM baseline adapter may be
an asset when it does not replace that policy. Stricter migrations are explicit
hardening opt-ins: normal initialization must never copy or activate them
silently. For example, a stricter TypeScript configuration belongs in an
opt-in variant, not in the default native typecheck variant.

## Migration checklist

1. Preserve legacy behavior and choose stable v2 sensor and variant IDs.
2. Add bounded tool/runtime ranges, a closed probe, structured argv, and contained assets.
3. Keep `coverage.schemaVersion: 1` and point each detector to a declared sensor.
4. Test minimum, current, and representative future tool versions with native configuration.
5. Certify only evidenced versions; future compatible versions remain unverified.
