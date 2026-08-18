# Contributing

Thanks for considering a contribution. This repository holds the **content**
AWM delivers — skills, bundles, workflows, agent prompts, sensor packs, and
session hooks. The `awm` CLI that consumes it lives in
[Kodria/agentic-workflow](https://github.com/Kodria/agentic-workflow).

## Licensing of contributions

This project is licensed under the [Apache License 2.0](LICENSE). By submitting
a contribution you agree that it is licensed under the same terms (inbound =
outbound), and that you have the right to submit it.

### Sign your commits (DCO)

Every commit must carry a `Signed-off-by` line certifying the
[Developer Certificate of Origin](https://developercertificate.org/):

```bash
git commit -s -m "feat(skills): ..."
```

The sign-off states that you wrote the contribution, or otherwise have the
right to submit it under this project's license. If you are contributing on
behalf of an employer, confirm first that you are permitted to do so — the
copyright in work made during employment often belongs to the employer.

## Before you open a pull request

Read [`CONSTITUTION.md`](CONSTITUTION.md) — it holds this repository's
non-negotiable process rules (written in Spanish). The two that trip up most
contributions:

### 1. Version bumps are part of the change, not a follow-up

Any pull request that edits a bundle's content must bump, **in the same batch**:

- the `version` in the edited `skills/<name>/SKILL.md` frontmatter,
- the bundle `version` in **both** `catalog.json` and
  `bundles/<bundle>/bundle.json` — the two must match.

CI enforces the first one: `.github/workflows/skill-version-check.yml` fails a
pull request whose `SKILL.md` content changed without a version bump. Run it
yourself before pushing:

```bash
./scripts/check-skill-version-bumps.sh origin/main
```

The release tag itself is cut automatically on merge — you do not tag by hand.

### 2. Title the pull request as a conventional commit

This repository squash-merges, so the pull request title becomes the commit
subject on `main`, and `auto-tag.yml` derives the release bump from it. Use
`feat:`, `fix:`, or `feat!:` / `BREAKING CHANGE:`. A descriptive title without a
prefix silently produces a `patch` tag no matter how large the change is.

## Writing or changing a skill

- Skills follow the [Agent Skills](https://github.com/agentskills/agentskills)
  specification: a directory with a `SKILL.md` carrying YAML frontmatter
  (`name`, `description`, and here also `version` and `license`), plus optional
  `references/`, `scripts/`, and `assets/`.
- Keep skills **harness-agnostic**. AWM installs into several agents; naming a
  specific provider's tools inside a skill body breaks that. `scripts/validate-portability.mjs`
  checks this.
- A skill marked `portable: true` must be self-contained: any intra-registry
  path it cites will not travel with `awm export`.

## Adding or changing an automated check

A gate is not finished when it passes — it is finished when you have broken what
it protects on purpose and watched it fail with the right message. New rules in
`scripts/validate-portability.mjs` add their mutation to
`tests/validate-portability.test.mjs` in the same batch. See `CONSTITUTION.md`,
"Gates ejecutables".

## Reporting problems

- Bugs and proposals: open an issue.
- Security vulnerabilities: **do not** open a public issue. Follow
  [`SECURITY.md`](SECURITY.md).
