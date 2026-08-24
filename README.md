# AWM Baseline Registry

The content [AWM](https://github.com/Kodria/agentic-workflow) delivers: the
skills, workflows, agent profiles, sensor packs, and session hooks that turn an
agent session into a reviewable engineering process.

This repository ships **no executable product**. The `awm` CLI that installs and
runs this content lives in
[Kodria/agentic-workflow](https://github.com/Kodria/agentic-workflow).

## How it is consumed

Projects do not clone this repository. The CLI resolves it **by tag**:

```
pin declared  >  latest semver tag  >  HEAD
```

Installed skills are symlinks into the tagged registry under
`~/.awm/registries/<name>/`. A change merged to `main` without a tag reaches
nobody — the tag is cut automatically on merge by `.github/workflows/auto-tag.yml`.

```bash
awm add dev          # install a bundle into the current project
awm update           # move to the latest registry tag
awm pin <registry> <version>   # freeze a project on a known tag
```

## Layout

| Path | Holds |
|---|---|
| `skills/` | One directory per skill, each with a `SKILL.md` following the [Agent Skills](https://github.com/agentskills/agentskills) specification |
| `bundles/` | The installable units. A bundle names the skills, workflows, and agents it delivers, and may depend on another bundle |
| `catalog.json` | The bundle index the CLI reads. Bundle versions here must match each `bundles/<name>/bundle.json` |
| `sensor-packs/` | Executable quality sensors per ecosystem (`js-ts`, `python`, `shell`, `generic`) with their tool configuration |
| `hooks/` | Session-start adapters that deliver the project constitution, active plan, and ledger into a new agent session |
| `agents/`, `workflows/` | Agent profiles and orchestration templates |
| `scripts/`, `tests/` | The gates that keep the above honest |

## Bundles

| Bundle | Scope | What it adds |
|---|---|---|
| `dev` | baseline | The engineering spine: spec-driven development, quality gates, sensors, advisory skills |
| `product` | baseline | The business layer: discovery, briefs, architecture assessment and extraction, readiness gate |
| `process` | baseline | The process lifecycle: elicit, generate, verify and modify a process and its orchestrator |
| `authoring` | baseline | Harness authoring: writing and verifying skills |
| `frontend` | project | Frontend craft: design intake, component implementation, visual fidelity gate |

## Two invariants worth knowing before you edit

1. **Skills are harness-agnostic.** AWM installs into several agents; naming one
   provider's tools inside a skill body breaks portability.
   `scripts/validate-portability.mjs` enforces this, along with the licence
   declared by every `SKILL.md`.
2. **Version bumps travel with the change.** Editing a skill means bumping its
   frontmatter `version` *and* its bundle version in both `catalog.json` and
   `bundles/<name>/bundle.json`, in the same batch. CI fails the pull request
   otherwise.

Both are explained, with the incidents that motivated them, in
[`CONSTITUTION.md`](CONSTITUTION.md).

## Contributing and security

See [`CONTRIBUTING.md`](CONTRIBUTING.md). Security issues go through
[`SECURITY.md`](SECURITY.md), never a public issue.

## License

[Apache License 2.0](LICENSE). Every skill declares the same licence in its
frontmatter, so the terms travel with the file when it leaves this registry.
See [`NOTICE`](NOTICE) for attribution.

The name "AWM" and the Kodria name and marks are not covered by that grant —
Apache-2.0 §6 conveys no trademark rights.
