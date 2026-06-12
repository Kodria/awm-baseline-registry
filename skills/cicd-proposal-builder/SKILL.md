---
name: cicd-proposal-builder
version: "1.0.0"
description: "Specialist in CI/CD pipeline design. Use this skill when you need to define a pipeline, branching strategy, environments, quality gates, deploy strategy, or minimum controls. Activate on phrases like: 'I need a pipeline', 'CI/CD proposal', 'what branching strategy', 'how do I configure the environments', 'what quality gates should I have', 'deploy strategy'."
---

# CI/CD Proposal Builder

Specialist in CI/CD pipeline design. Guides the user from project constraints to a complete delivery pipeline proposal, covering branching strategy, environments, quality gates, deploy strategy, and minimum controls.

**Core principle:** A well-designed pipeline is invisible — the team pushes and the right things happen. A poorly designed pipeline is a bottleneck nobody wants to touch. The output is a concrete, actionable proposal.

---

## Step 0: Detect Operating Mode

| Signal | Mode |
|-------|------|
| Invoked directly by the user or by an orchestrator with a full cycle | **Full Mode** |
| Invoked by another skill that already has context and requests targeted expertise | **Contextual Mode** |

If unclear, ask: *"Do you want me to guide you through the complete pipeline design, or do you need to resolve something specific (branching, environments, gates)?"*

---

## Step 0.1: Gather Project Context

**Does the project have a repository?**

- **Yes →**
  1. Read `AGENTS.md` (stack, cloud provider, structure)
  2. Read `README.md` (purpose, setup)
  3. Look for existing CI/CD configs:
     - `.github/workflows/*.yml` (GitHub Actions)
     - `Jenkinsfile` (Jenkins)
     - `.gitlab-ci.yml` (GitLab CI)
     - `Dockerfile`, `docker-compose.yml`
     - `Makefile`, `Taskfile.yml`
     - `terraform/`, `pulumi/`, `cdk/`
  4. Identify existing build/test scripts (package.json scripts, Makefile targets, etc.)
  5. Ask: *"Are there additional constraints? (compliance, fixed cloud provider, platform team that approves changes)"*

- **No →** *"Describe to me: tech stack, cloud provider, number of environments you need, compliance requirements"*

**In Contextual Mode:** Skip this step — use the context already established by the invoking skill.

---

## Full Mode — Interactive Cycle

### Phase 1: Understand context

Guided questions (one at a time):
- What is the tech stack? (languages, frameworks, runtime)
- What cloud provider do you use? (AWS, GCP, Azure, on-prem, hybrid)
- Team size and experience? (impacts tolerable pipeline complexity)
- Are there compliance or security constraints? (manual approvals, mandatory security scans, isolated environments)
- Is there existing CI/CD to improve, or is this from scratch?

**Output:** Clear and shared constraints.

### Phase 2: Branching strategy

Propose 2-3 strategies with trade-offs based on context:

| Strategy | Ideal for | Trade-off |
|-----------|-----------|-----------|
| **Trunk-based** | Mature teams, CD, feature flags | Requires discipline and good test coverage |
| **GitHub Flow** | Medium-sized teams, PRs, frequent releases | Balance between simplicity and control |
| **GitFlow** | Planned releases, multiple versions in production | High complexity, long-lived branches |

Recommend with justification based on the team's context.

**Present options and wait for approval.**

### Phase 3: Environments and promotion

Define:
- What environments exist (dev, staging, QA, pre-prod, prod)
- How code is promoted between environments (automatic vs manual)
- Configuration management per environment (env vars, secrets, feature flags)
- Isolation between environments (network, data, access)

Propose the minimum viable set of environments for the context, not the maximum possible.

**Present proposal and wait for approval.**

### Phase 4: Quality gates

For each gate, define whether it is **blocking** (breaks the pipeline) or **advisory** (reports but does not block):

| Gate | What it validates | When it runs | Blocking? |
|------|-----------|-------------|-----------|
| Linting | Code style and formatting | On every push | Per team |
| Unit tests | Business logic | On every push | Yes |
| Integration tests | Interaction between components | On PR / pre-merge | Yes |
| Security scan | Vulnerabilities in deps and code | On PR | Per criticality |
| Code review | Human review | On PR | Yes |
| Smoke tests | Basic functionality post-deploy | Post-deploy to staging | Yes |
| Performance tests | Performance regressions | Pre-release (optional) | Advisory |

Adapt based on the stack and constraints.

**Present gates and wait for approval.**

### Phase 5: Deploy strategy

Propose 2-3 options with trade-offs:

| Strategy | Ideal for | Trade-off |
|-----------|-----------|-----------|
| **Rolling** | Stateless applications, simple infrastructure | Minimal downtime but slow rollback |
| **Blue/Green** | Zero-downtime required, instant rollback | Double infra cost during deploy |
| **Canary** | High-risk releases, gradual validation | Routing and monitoring complexity |
| **Feature Flags** | Separating deploy from release, A/B testing | Technical debt if not cleaned up |

Recommend based on downtime tolerance and available infrastructure.

**Present options and wait for approval.**

### Phase 6: Generate design artifact

Compile all decisions into a structured artifact:

| Invoked from | Artifact | Who executes |
|---|---|---|
| `brainstorming` | Result returned to `brainstorming` to integrate into the design | `brainstorming` continues its flow (writes design doc, then calls `writing-plans`) |
| `docs-brainstorming` / `docs-system-orchestrator` | CI/CD proposal document | `docs-assistant` |
| Standalone | CI/CD proposal document | `docs-assistant` |

---

## Contextual Mode — Targeted Intervention

| Invoker asks | What it does |
|---|---|
| "I need to define the pipeline for this project" | Phases 1-5 with context already provided |
| "What branching strategy should I use?" | Phase 2 only |
| "Review whether this pipeline has gaps" | Review of existing configuration + flag improvements |
| "What quality gates should I have?" | Phase 4 only |

In contextual mode: do not open a full cycle, use the invoker's context, return result. Phase 6 does not apply — the invoker handles artifact generation.

---

## Cross-cutting Rules

- **Minimum viable, not maximum possible.** A simple pipeline that works is better than a complex one nobody understands.
- **Automate the repetitive, not the exceptional.** Do not build gates for cases that happen once a year.
- **The pipeline is code.** Everything versioned, everything reproducible, nothing manual that can be forgotten.
- **One question at a time** in full mode.
- **Incremental approval** per phase.

---

## <TERMINATION_PHASE>

When the operating mode concludes, **STOP**.

Your only final step is:
1. Report the result (summary of the CI/CD proposal).
2. Indicate the next step according to the invocation context.
3. Wait for confirmation. Do not proceed automatically.
