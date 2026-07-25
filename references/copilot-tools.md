# Copilot CLI Tool Mapping

AWM skills describe platform-neutral capabilities. On GitHub Copilot CLI, use
these native equivalents when they are available in the session:

| AWM capability | Copilot CLI equivalent |
|---|---|
| Read a file | `view` |
| Create a file | `create` |
| Edit a file | `edit` |
| Run a shell command | `bash` |
| Search file content | `grep` |
| Search files by name | `glob` |
| Load a named skill | `skill` |
| Fetch a URL | `web_fetch` |
| Dispatch a subagent | `task` with `agent_type: "general-purpose"` or `"explore"` |
| Dispatch several subagents in parallel | multiple `task` calls |
| Inspect subagent status or output | `read_agent`, `list_agents` |
| Create or update a task plan | `sql` against the built-in `todos` table |
| Search the web | no equivalent — use `web_fetch` with a search engine URL |
| Enter or leave a read-only planning mode | no equivalent — stay in the main session |

## Async shell sessions

Copilot CLI supports persistent async shell sessions, which AWM's shell-command capability does not model:

| Tool | Purpose |
|------|---------|
| `bash` with `async: true` | Start a long-running command in the background |
| `write_bash` | Send input to a running async session |
| `read_bash` | Read output from an async session |
| `stop_bash` | Terminate an async session |
| `list_bash` | List all active shell sessions |

## Additional Copilot CLI tools

| Tool | Purpose |
|------|---------|
| `store_memory` | Persist facts about the codebase for future sessions |
| `report_intent` | Update the UI status line with current intent |
| `sql` | Query the session's SQLite database (todos, metadata) |
| `fetch_copilot_cli_documentation` | Look up Copilot CLI documentation |
| GitHub MCP tools (`github-mcp-server-*`) | Native GitHub API access (issues, PRs, code search) |

A provider reference may map names, but it never overrides the callable tools
exposed in the current session.
