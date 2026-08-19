# Contributing

Thanks for considering a contribution. This repository holds the **content**
AWM delivers — skills, bundles, workflows, agent prompts, sensor packs, and
session hooks. The `awm` CLI that consumes it lives in
[Kodria/agentic-workflow](https://github.com/Kodria/agentic-workflow).

## Licensing of contributions

This project is licensed under the [Apache License 2.0](LICENSE). Section 5 of
that licence already makes every contribution inbound = outbound: unless you
state otherwise, what you submit is submitted under these same terms. There is
nothing extra to sign for the licence to apply.

**The pull request is the certification.** By opening one you state that you
have the right to submit its contents under this licence — whether you typed
the commits yourself or an agent produced them on your behalf. We deliberately
do not require a per-commit `Signed-off-by` line: in an agent-delegated
workflow the commit author is a tool, and a certification signed by a tool
certifies nothing. The human act is opening and merging the pull request, so
that is where the statement belongs.

If you are contributing in the course of employment, confirm first that you are
permitted to do so — the copyright in work made during employment often belongs
to the employer, regardless of who or what wrote the commit.

### If you are not the project owner

The project owner can relicense this work only while they hold copyright in all
of it. That remains true today. **The first merged contribution from anyone
else ends it**, unless a contributor licence agreement granting the right to
relicense is in place *before* that pull request is merged.

So the rule is a trigger, not a plan: no CLA is needed while the owner is the
sole contributor. The moment a third-party pull request is worth merging, the
CLA decision is taken before the merge button, not after.

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
