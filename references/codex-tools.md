# Codex Capability Mapping

AWM skills describe portable capabilities. In Codex, use the currently exposed
native capability that matches the intent; do not add provider settings just to
make a skill's wording fit.

| Portable capability | Codex native capability | Use it for |
|---|---|---|
| Load and follow a skill | Codex native skill loading | Applying a skill's instructions when its trigger matches. |
| Create or update a task plan | `update_plan` | Keeping controller-owned implementation steps visible. |
| Dispatch a subagent | `spawn_agent` | Starting a bounded, independent worker task. |
| Steer a running subagent | `send_message` | Providing information without starting a new worker turn. |
| Continue an idle subagent | `followup_task` | Sending a follow-up task and triggering its next turn. |
| Wait for a subagent | `wait_agent` | Receiving its progress, completion, or request for attention. |
| Stop a subagent | `interrupt_agent` | Interrupting work that is no longer wanted. |
| Inspect available subagents | `list_agents` | Checking active workers and their status. |
| Read, write, or edit files | Codex native file tools | Making scoped filesystem changes. |
| Run commands | Codex native shell tools | Running verification or project commands. |

## Delegation availability and roles

Codex treats multi-agent collaboration as a default runtime capability: no
legacy feature setting is required. A session may nevertheless lack delegation
tools. In that case, do not attempt to enable them through configuration; keep
the work single-agent or explain the limitation to the user.

The controller owns the user conversation, task plan, delegation decisions,
integration, and final verification. A worker owns only its bounded assigned
task, reports evidence and blockers to the controller, and does not expand its
scope or make controller-level decisions.

## Waiting is not command execution

Use `wait_agent` only to wait for a spawned worker. A code-execution wait
resumes a yielded command or execution cell by its execution identifier; it
does not return a worker result and must not be used for delegation control.

## Environment Detection

Skills that create worktrees or finish branches should detect their
environment with read-only git commands before proceeding:

```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
BRANCH=$(git branch --show-current)
```

- `GIT_DIR != GIT_COMMON` → already in a linked worktree (skip creation)
- `BRANCH` empty → detached HEAD (cannot branch/push/PR from sandbox)

See `using-git-worktrees` Step 0 and `finishing-a-development-branch`
Step 1 for how each skill uses these signals.

## Codex App Finishing

When the sandbox blocks branch/push operations (detached HEAD in an
externally managed worktree), the agent commits all work and informs
the user to use the App's native controls:

- **"Create branch"** — names the branch, then commit/push/PR via App UI
- **"Hand off to local"** — transfers work to the user's local checkout

The agent can still run tests, stage files, and output suggested branch
names, commit messages, and PR descriptions for the user to copy.
