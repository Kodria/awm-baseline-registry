# Gemini CLI Tool Mapping

AWM skills describe platform-neutral capabilities. On Gemini CLI, use these
native equivalents when they are available in the session:

| AWM capability | Gemini CLI equivalent |
|---|---|
| Read a file | `read_file` |
| Create a file | `write_file` |
| Edit a file | `replace` |
| Run a shell command | `run_shell_command` |
| Search file content | `grep_search` |
| Search files by name | `glob` |
| Create or update a task plan | `write_todos` |
| Load a named skill | `activate_skill` |
| Search the web | `google_web_search` |
| Fetch a URL | `web_fetch` |
| Dispatch a subagent | `@agent-name` (see [Subagent support](#subagent-support)) |
| Request user approval or input | `ask_user` |

## Subagent support

Gemini CLI supports subagents natively via the `@` syntax. Use the built-in `@generalist` agent to dispatch any task — it has access to all tools and follows the prompt you provide.

When a skill says to dispatch a named agent role, use `@generalist` with the full prompt from the skill's prompt template:

| AWM dispatch role | Gemini CLI equivalent |
|---|---|
| Implementer | `@generalist` with the filled `implementer-prompt.md` template |
| Spec reviewer | `@generalist` with the filled `spec-reviewer-prompt.md` template |
| Code reviewer | `@code-reviewer` (bundled agent) or `@generalist` with the filled review prompt |
| Code quality reviewer | `@generalist` with the filled `code-quality-reviewer-prompt.md` template |
| General-purpose subagent with an inline prompt | `@generalist` with your inline prompt |

### Prompt filling

Skills provide prompt templates with placeholders like `{WHAT_WAS_IMPLEMENTED}` or `[FULL TEXT of task]`. Fill all placeholders and pass the complete prompt as the message to `@generalist`. The prompt template itself contains the agent's role, review criteria, and expected output format — `@generalist` will follow it.

### Parallel dispatch

Gemini CLI supports parallel subagent dispatch. When a skill asks you to dispatch multiple independent subagent tasks in parallel, request all of those `@generalist` or named subagent tasks together in the same prompt. Keep dependent tasks sequential, but do not serialize independent subagent tasks just to preserve a simpler history.

## Additional Gemini CLI tools

These tools have no AWM capability counterpart, but are worth knowing:

| Tool | Purpose |
|------|---------|
| `list_directory` | List files and subdirectories |
| `save_memory` | Persist facts to GEMINI.md across sessions |
| `tracker_create_task` | Rich task management (create, update, list, visualize) |
| `enter_plan_mode` / `exit_plan_mode` | Switch to read-only research mode before making changes |

A provider reference may map names, but it never overrides the callable tools
exposed in the current session.
