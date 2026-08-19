# Security Policy

## Reporting a vulnerability

Report security issues through GitHub's private vulnerability reporting on this
repository: **Security → Report a vulnerability**. Please do not open a public
issue for a suspected vulnerability.

Include what you would need yourself to reproduce it: the affected skill,
workflow, sensor pack or hook, the registry tag or commit, the agent and version
you were running, and the observed behaviour.

## What is in scope

This repository ships **content**, not a running service: skills, workflows,
agent prompts, sensor packs, and session hooks that agents load and execute in
a developer's environment. The threat model follows from that:

- **Prompt injection in skill content.** Instructions in a `SKILL.md`,
  reference file, or workflow that attempt to redirect an agent away from the
  user's intent — exfiltrating secrets, escalating tool permissions, or taking
  destructive actions the user did not ask for.
- **Hooks and scripts.** Anything under `hooks/` or `scripts/` runs on a
  developer machine. Command injection, path traversal, or unexpected writes
  outside the intended paths are in scope.
- **Sensor packs.** Pack definitions invoke real toolchains. Argument injection
  or configuration that causes a sensor to execute unintended commands is in
  scope.
- **Supply chain.** Anything that would let content reach a consumer's machine
  without passing this repository's review, versioning, and tagging path.

## What is out of scope

- Vulnerabilities in the third-party tools a sensor pack invokes (ESLint,
  TypeScript, semgrep, and so on). Report those upstream.
- Vulnerabilities in agent harnesses (Claude Code, Codex, OpenCode, Cursor,
  and others). Report those to their maintainers.
- The `awm` CLI itself, which lives in
  [Kodria/agentic-workflow](https://github.com/Kodria/agentic-workflow).

## Supported versions

Consumers pin this registry by tag (`awm pin`). Fixes land on `main` and are
published as a new tag; there are no long-term support branches. If you are
pinned to an older tag, moving the pin forward is the upgrade path.

## Verifying what you install

Every consumer-visible change to a skill, bundle, or sensor pack goes through a
pull request with a version bump, enforced in CI. `awm pin` records the exact
registry tag a project depends on. When auditing, compare against the tag you
pinned rather than against `main`.
