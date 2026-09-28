# Cursor Hooks Implementation Plan (Plan A — registry)

> **For agentic workers:** REQUIRED: follow `development-process`; execute slice by slice with RED → GREEN evidence.

> **Goal:** ship the three native Cursor hook scripts (`hooks/cursor-session-start`, `hooks/cursor-pre-compact`, `hooks/cursor-post-tool-use`) and the Claude-hook suppression guard, published under a registry tag before the CLI release that installs them.

**Architecture:** three dependency-free Node scripts, copied by the CLI into `<AWM_HOME>/hooks/cursor/` under the installed names `session-start`, `pre-compact`, `post-tool-use`, next to a CLI-written `using-awm.md`. `session-start` is the single global carrier of `using-awm` for Cursor and the single home of the plan/ledger re-anchor logic; `post-tool-use` reuses it by spawning its sibling with `--reanchor`, so the logic exists once per provider script. The Claude `hooks/session-start` goes silent inside Cursor when the native hook is installed.

**Design:** `agentic-workflow/docs/plans/2026-09-28-cursor-full-parity-design.md` (approved 2026-09-28), §5 and §9 Plan A. That file lives in another repository, so every fact this plan needs from it is inlined below.

**Modo de ejecución:** desatendido

> Mandato de ejecución desatendida: ejecución completa sin pausas de check-in
> entre tareas, ni de confirmación entre fases (development-process rutea
> automáticamente y subagent-driven-development no pregunta si continuar con
> el cierre). harness-retro triagea con criterio propio del agente (solo valor
> real, recurrente o sistémico — descarta el resto sin preguntar).
> post-implementation-qa corrige TODOS los hallazgos que surjan, no solo algunos.
> finishing-a-development-branch crea el PR directamente (opción "push + PR"),
> sin presentar el menú de 4 opciones.

**Modo de despacho:** proveedor-nativo

<!-- AWM:COMPACT-SLICES:START v1 -->
{"schema":"compact-slices/v1","planId":"cursor-hooks-registry","requirements":["R5","R14","R14.1","R14.2","R14.3","R16","R16.1","R17","R15","R20"],"sources":[{"id":"SRC-CODEX-HOOK","path":"hooks/codex-session-start","locator":"function buildContext(cwd, event)","fact":"Node, dependency-free; activePlan picks the newest non-design docs/plans file with open checkboxes and no awm-plan/qa-complete marker; ledgerItems runs awm with a 2000 ms timeout; writeHeartbeat writes {version,hash(sha256 of installed file),ts,event} atomically next to argv[1]; readInput tolerates null/non-object JSON."},{"id":"SRC-CLAUDE-HOOK","path":"hooks/session-start","locator":"set -euo pipefail","fact":"Bash Claude SessionStart hook; emits hookSpecificOutput.additionalContext with using-awm, constitution and re-anchor; exits 0."},{"id":"SRC-CODEX-TEST","path":"tests/codex-session-start.test.mjs","locator":"function installHook(directory)","fact":"Copies the hook into a tmp dir under its installed name, chmods 0755, runs it with spawnSync and JSON stdin; never touches the real ~/.awm."},{"id":"SRC-SESSION-TEST","path":"tests/session-start.test.mjs","locator":"const neutralPath","fact":"Stubs awm to exit 1 on PATH and runs the bash hook with AWM_HOOKS_ROOT; pins the cross-provider same-plan invariant."},{"id":"SRC-PORTABILITY","path":"scripts/validate-portability.mjs","locator":"async function validateCodexSessionHook(errors)","fact":"Checks the Codex hook exists, is executable and contains required concept strings; called from main before validateBundleVersions."},{"id":"SRC-WORKFLOW","path":".github/workflows/validate.yml","locator":"- run: node tests/session-start.test.mjs","fact":"CI runs each hook smoke test as its own step."},{"id":"SRC-PACKAGE","path":"package.json","locator":"\"test:portability\"","fact":"test:portability runs scripts/validate-portability.mjs; no script exists yet for the hook smoke tests."},{"id":"SRC-CONSTITUTION","path":"CONSTITUTION.md","locator":"## Release de contenido","fact":"A change reaches consumers only through a registry tag vX.Y.Z; awm update resolves the latest semver tag."},{"id":"SRC-USING-AWM","path":"skills/using-awm/SKILL.md","locator":"# Using AWM","fact":"The using-awm body starts with the H1 line '# Using AWM' (3343 bytes including frontmatter)."}],"commands":[{"id":"CMD-CURSOR-HOOKS","program":"npm","args":["run","test:cursor-hooks"],"covers":["R5","R14","R14.1","R14.2","R14.3","R17","R16","R16.1"]},{"id":"CMD-BENCH","program":"npm","args":["run","bench:cursor-hooks"],"covers":["R16.1"]},{"id":"CMD-SESSION-START","program":"npm","args":["run","test:session-start"],"covers":["R15"]},{"id":"CMD-PORTABILITY","program":"npm","args":["run","test:portability"],"covers":["R20"]}],"slices":[{"id":"S1","title":"Cursor session-start hook","requirements":["R5","R14","R14.1","R14.2","R14.3","R17"],"dependsOn":[],"sectionAnchor":"slice-s1","sources":["SRC-CODEX-HOOK","SRC-CODEX-TEST","SRC-SESSION-TEST","SRC-PACKAGE","SRC-USING-AWM"],"redCommands":["CMD-CURSOR-HOOKS"],"greenCommands":["CMD-CURSOR-HOOKS"],"reviewEvidence":["specification","code-quality"],"risk":"full-context","fallback":["public-contract"]},{"id":"S2","title":"Deferred compaction re-anchor","requirements":["R16","R16.1"],"dependsOn":["S1"],"sectionAnchor":"slice-s2","sources":["SRC-CODEX-HOOK","SRC-CODEX-TEST","SRC-PACKAGE"],"redCommands":["CMD-CURSOR-HOOKS"],"greenCommands":["CMD-CURSOR-HOOKS","CMD-BENCH"],"reviewEvidence":["specification","code-quality"],"risk":"full-context","fallback":["public-contract"]},{"id":"S3","title":"Claude suppression guard, CI wiring and release","requirements":["R15","R20"],"dependsOn":["S2"],"sectionAnchor":"slice-s3","sources":["SRC-CLAUDE-HOOK","SRC-SESSION-TEST","SRC-PORTABILITY","SRC-WORKFLOW","SRC-PACKAGE","SRC-CONSTITUTION"],"redCommands":["CMD-SESSION-START","CMD-PORTABILITY"],"greenCommands":["CMD-SESSION-START","CMD-PORTABILITY","CMD-CURSOR-HOOKS"],"reviewEvidence":["specification","code-quality"],"risk":"full-context","fallback":["public-contract"]}],"closureCommands":["CMD-CURSOR-HOOKS","CMD-SESSION-START","CMD-PORTABILITY"]}
<!-- AWM:COMPACT-SLICES:END v1 -->

## Shared contract (stated once)

Facts inlined from the approved design and the Cursor hooks documentation (not contained in this repo):

- **Install layout (CLI contract, Plan B implements it):** `<AWM_HOME>/hooks/cursor/session-start` (copy of `hooks/cursor-session-start`), `pre-compact` (copy of `hooks/cursor-pre-compact`), `post-tool-use` (copy of `hooks/cursor-post-tool-use`), and `using-awm.md`, the composed `using-awm` payload that the Cursor CLI adapter writes. The Cursor hook must **not** read `<AWM_HOME>/hooks/using-awm.md`: the Claude adapter writes that file, and Cursor has to work without Claude installed (R1). Runtime state lives in `<AWM_HOME>/hooks/cursor/state/`.
- **Cursor hook I/O:** each hook receives JSON on stdin, with common fields `conversation_id`, `hook_event_name`, `workspace_roots` (array of absolute paths) and `cursor_version`. There is **no `cwd`**. The project root comes from the env var `CURSOR_PROJECT_DIR`. `sessionStart` fires only for new conversations and may return `{"additional_context": "..."}`. `preCompact` is observational (it can only return `user_message`). `postToolUse` may return `{"additional_context": "..."}`.
- **Budgets (R5):** the session-start payload is at most 24 KiB and the re-anchor payload at most 4 KiB. Anything over the budget is truncated with a visible marker, never silently dropped.
- **Test isolation:** every test runs in `fs.mkdtempSync` workspaces, with `awm` stubbed on `PATH` and `HOME`/`AWM_HOME` pointing at tmp dirs. No test may touch the real `~/.awm`.
- **Test entry points (`package.json` scripts):** S1 adds `"test:cursor-hooks": "node tests/cursor-hooks.test.mjs"` and `"test:session-start": "node tests/session-start.test.mjs"`; S2 adds `"bench:cursor-hooks": "node scripts/bench-cursor-post-tool-use.mjs"` together with the script it runs (amendment A1).

<a id="slice-s1"></a>
### Slice S1: Cursor session-start hook
#### Surfaces
Owns R5 (hook side), R14, R14.1, R14.2, R14.3 and R17. Files:

- new `hooks/cursor-session-start` (mode 100755);
- new `tests/cursor-hooks.test.mjs`;
- `package.json` scripts (all three entries from the shared contract are added here, so later slices only use them).

Grouping rationale: the payload, its budget, its fail-open behavior and the heartbeat are one script with one output contract. They are verified by one smoke test.

Interface:

- `session-start` with no arguments prints exactly one JSON object `{"additional_context": string}` and writes `heartbeat.json`.
- `session-start --reanchor` prints the plain-text re-anchor section (it may be empty) and writes no heartbeat. S2 consumes this mode.
#### Implementation
1. RED: add the scripts to `package.json`. Create `tests/cursor-hooks.test.mjs` following the SRC-CODEX-TEST pattern:
   - an `installHooks(dir)` helper that copies each existing `hooks/cursor-*` file to its installed name (`session-start`, `pre-compact`, `post-tool-use`) and chmods it 0755;
   - a `runHook(installed, input, {env, args})` helper built on `spawnSync(process.execPath, [installed, ...args], ...)`, with `env` including `PATH: <awm stub dir>` + delimiter + `process.env.PATH`, like `neutralPath` in SRC-SESSION-TEST.

   Write every S1 assertion from Edge cases, then run CMD-CURSOR-HOOKS. It must fail because `hooks/cursor-session-start` is missing.
2. Create `hooks/cursor-session-start` by copying `hooks/codex-session-start` verbatim, then:
   - Keep unchanged: `AWM_DIRECTIVE`, `installedScriptPath`, `MAX_CONSTITUTION_BYTES`, `MAX_LINE_CHARS`, `MAX_LEDGER_BYTES`, `AWM_TIMEOUT_MS`, `truncate`, `readStdin`, `readInput`, `readIfPresent`, `PLAN_COMPLETE`, `DESIGN_DOC`, `activePlan` and `writeHeartbeat`. The heartbeat field names are the CLI contract. `ledgerItems` is copied and then corrected per amendment A1.
   - Delete `recordCompactionRecovery`, `resolveCwd`, `buildContext` and `main`. Cursor fires sessionStart only for new conversations; recording compactions moves to `pre-compact` in S2.
   - Update the header comment so it describes the Cursor hook.
   - Append:

```js
const MAX_SESSION_BYTES = 24 * 1024;
const MAX_REANCHOR_BYTES = 4 * 1024;
const MAX_USING_AWM_BYTES = 16 * 1024;
const SNAPSHOT_HEADING = '## Plan snapshot (taken at session start)\nThis is a snapshot; re-read the plan file for the current state.';
const REANCHOR_HEADING = '## Re-anchor (post-compaction)\nState recomputed after the context was compacted.';

// Every probe is optional context: a failure drops that section, never the session.
function safe(probe) {
    try {
        return probe() || '';
    } catch {
        return '';
    }
}

// Cursor passes no cwd. The env var is the documented project root; the first
// workspace root covers hosts that omit it.
function resolveProject(input) {
    const roots = Array.isArray(input.workspace_roots) ? input.workspace_roots : [];
    for (const candidate of [process.env.CURSOR_PROJECT_DIR, roots[0]]) {
        if (typeof candidate !== 'string' || !candidate) continue;
        try {
            if (fs.statSync(candidate).isDirectory()) return candidate;
        } catch {
            // Try the next candidate.
        }
    }
    try {
        return process.cwd();
    } catch {
        return null;
    }
}

// Another provider (e.g. Copilot) may already carry the full using-awm body in
// the project's managed AGENTS.md block; delivering it twice costs tokens.
function agentsBlockHasUsingAwm(cwd) {
    const text = readIfPresent(path.join(cwd, 'AGENTS.md'), MAX_CONSTITUTION_BYTES);
    const start = text.indexOf('<!-- AWM:START');
    const end = start === -1 ? -1 : text.indexOf('<!-- AWM:END', start);
    return end !== -1 && /^# Using AWM\s*$/m.test(text.slice(start, end));
}

function usingAwm(scriptPath, cwd) {
    if (cwd !== null && safe(() => agentsBlockHasUsingAwm(cwd))) return '';
    const body = safe(() => readIfPresent(path.join(path.dirname(scriptPath), 'using-awm.md'), MAX_USING_AWM_BYTES)).trim();
    return body || AWM_DIRECTIVE;
}

function reanchorSection(cwd, heading) {
    const plan = activePlan(cwd);
    if (!plan) return '';
    const goal = plan.body.match(/^[>\s]*\*\*Goal:\*\*\s*(.+)$/m)?.[1]
        || plan.body.match(/^#\s+(.+)$/m)?.[1]
        || path.basename(plan.file);
    const openItems = (plan.body.match(/^- \[ \].+$/gm) || [])
        .slice(0, 8)
        .map((item) => truncate(item, MAX_LINE_CHARS, '[truncated]'));
    const ledger = safe(() => ledgerItems(cwd)) || [];
    return truncate([
        heading,
        `Active plan: ${path.basename(plan.file)}`,
        `Goal: ${goal}`,
        ...(openItems.length ? ['Open plan items:', ...openItems] : []),
        ...(ledger.length ? ['Open ledger items:', ...ledger] : []),
    ].join('\n'), MAX_REANCHOR_BYTES, '[truncated by AWM — re-read the plan]');
}

function buildContext(scriptPath, cwd) {
    const sections = [];
    const guide = usingAwm(scriptPath, cwd);
    if (guide) sections.push(guide);
    if (cwd !== null) {
        const constitution = safe(() => readIfPresent(path.join(cwd, 'CONSTITUTION.md'), MAX_CONSTITUTION_BYTES)).trim();
        if (constitution) sections.push(`## Project Constitution\n\n${constitution}`);
        const snapshot = safe(() => reanchorSection(cwd, SNAPSHOT_HEADING));
        if (snapshot) sections.push(snapshot);
    }
    return truncate(sections.join('\n\n'), MAX_SESSION_BYTES, '[truncated by AWM — read the files for the rest]');
}

function main() {
    const scriptPath = installedScriptPath();
    const input = readInput();
    const cwd = resolveProject(input);
    if (process.argv.includes('--reanchor')) {
        process.stdout.write(cwd === null ? '' : safe(() => reanchorSection(cwd, REANCHOR_HEADING)));
        return;
    }
    const additionalContext = safe(() => buildContext(scriptPath, cwd)) || AWM_DIRECTIVE;
    writeHeartbeat(scriptPath, 'sessionStart');
    process.stdout.write(`${JSON.stringify({ additional_context: additionalContext })}\n`);
}

try {
    main();
} catch {
    // Last line of fail-open: a valid, empty answer and exit 0.
    if (!process.argv.includes('--reanchor')) process.stdout.write('{}\n');
}
```

   If `truncate` in SRC-CODEX-HOOK limits characters rather than UTF-8 bytes, add a byte-accurate `truncateBytes(text, limit, marker)` built on `Buffer.byteLength` and use it for the two R5 limits (`MAX_SESSION_BYTES` and `MAX_REANCHOR_BYTES`). The R5 assertions measure bytes.
3. GREEN: `chmod 0755 hooks/cursor-session-start` and `git add --chmod=+x`, then run CMD-CURSOR-HOOKS.
#### Edge cases
Assertions in `tests/cursor-hooks.test.mjs`. Each runs in a fresh tmp project and a fresh tmp install dir.

- **Full payload (R14, R14.1):**
  - Setup: `using-awm.md` contains `# Using AWM\n\nbody`; the project has `CONSTITUTION.md` and an open plan `docs/plans/2026-07-24-demo-plan.md` with `> **Goal:** prove recovery` and `- [ ] open item`.
  - Stdout parses as JSON whose only key is `additional_context`.
  - The value contains `# Using AWM`, `## Project Constitution`, `Plan snapshot (taken at session start)`, `re-read the plan file`, `Active plan: 2026-07-24-demo-plan.md` and `Goal: prove recovery`.
- **Project root:**
  - `CURSOR_PROJECT_DIR` wins over `workspace_roots[0]` and over the process cwd (three different projects, three different plan names).
  - With the env var unset, `workspace_roots[0]` is used.
  - A nonexistent `CURSOR_PROJECT_DIR` falls through to the next candidate.
- **R14.2:**
  - `AGENTS.md` with `<!-- AWM:START -->\n# Using AWM\n...\n<!-- AWM:END -->`: the payload does not contain the `using-awm.md` body but still contains the constitution.
  - `# Using AWM` outside the markers: the body is delivered.
  - No `using-awm.md` installed: the payload contains the `AWM_DIRECTIVE` string.
- **R5:**
  - A 100 KiB constitution plus a 16 KiB `using-awm.md`: `Buffer.byteLength(additional_context) <= 24 * 1024` and the text contains `[truncated by AWM`.
  - `--reanchor` on a plan with 8 open items of 500 chars and a stubbed `awm` that prints 50 open ledger lines: output is at most 4096 bytes.
- **R14.3:**
  - Stdin `null`, `"text"`, `[]` and `not json` each exit 0 with parseable JSON.
  - `CONSTITUTION.md` as a directory: exit 0, no constitution section.
  - `awm` stub exits 1: exit 0, no ledger section.
  - `awm` stub sleeps 5 s: the hook finishes in under 4 s thanks to the existing 2000 ms timeout, with no ledger section.
- **R17:**
  - `heartbeat.json` sits next to the installed path, not the registry source.
  - `hash` equals the sha256 of the installed file, `ts` parses as a date, and `event` is `sessionStart`.
  - Install dir chmod 0555: exit 0, valid JSON, no leftover `.tmp` (skip the chmod case when `process.getuid?.() === 0` or on win32).
  - `--reanchor` writes no heartbeat.
- **Parity:** for the same project fixture, the `Active plan:` line equals the one emitted by `hooks/codex-session-start` (run with `{cwd: project}` stdin).
- **Security:** the hook never follows `workspace_roots` entries that are not strings. No network, no writes outside the install dir.
#### Evidence
- Sources: SRC-CODEX-HOOK, SRC-CODEX-TEST, SRC-SESSION-TEST, SRC-PACKAGE, SRC-USING-AWM.
- CMD-CURSOR-HOOKS: RED because the hook file is missing, then GREEN.
- Distinct specification and code-quality verdicts against R5/R14–R14.3/R17 as written in this plan.
- `git ls-files -s hooks/cursor-session-start` shows mode 100755. CMD-PORTABILITY stays green.
#### Fallback
Public-contract risk: the installed names, the `using-awm.md` location and the heartbeat shape are consumed by the Plan B CLI adapter.

- If the Cursor stdin or env facts above prove wrong in the real binary (Plan B playbook), amend this plan and the design together, revalidate, and re-release. Do not patch installed copies under `~/.awm`.
- If the byte-accurate truncation needs a helper, keep it local to this script.
- If a character-based cap is kept by mistake, R5 has to be amended explicitly. Never loosen the assertion instead.

#### Amendment A1 (2026-09-28, S1 code-quality review)
Deviation record: the S1 code-quality review found four defects that the verbatim S1 text produced. The plan is amended here before the fix; the corrected clauses govern S1.

- **Ledger rendering (R14.1, R5).** `awm ledger list` (CLI 9.14.1: "print the current branch ledger as JSON") prints a pretty-printed JSON array of entries `{ts, branch, phase, source_skill, polarity, class, signature, severity, desc, ref?}`. The verbatim `ledgerItems` split that output by line and rendered JSON fragments (and wins). In `hooks/cursor-session-start`, `ledgerItems` keeps its `execFileSync` call, timeout, `maxBuffer` and fail-open, but parses the output as JSON, keeps only entries with `polarity === "finding"`, renders each as `- [<severity>] <signature>: <desc>` truncated to `MAX_LINE_CHARS`, and returns at most 8. Non-JSON or non-array output yields no section. The dead `awmReachable` bookkeeping (its only reader was the deleted Codex audit write) is removed. The ledger test stub prints the real JSON array shape (findings plus at least one win) and the test asserts the win is absent, the finding `desc` is present, and no line is a bare `[`/`{`. The same pre-existing defect in `hooks/codex-session-start` and `hooks/session-start` is out of this plan's scope and is tracked as a follow-up issue.
- **Budget order (R5).** The plan snapshot must survive the 24 KiB cap. `buildContext` computes the snapshot first and truncates the constitution (with the `[truncated by AWM` marker) to the bytes left after the guide, the snapshot and the separators, so the snapshot heading is present whenever the project has an active plan. Test: a 100 KiB constitution plus a 16 KiB `using-awm.md` plus an open plan keeps `Plan snapshot (taken at session start)` and stays at most 24 KiB.
- **Heartbeat version (R17).** The heartbeat test also asserts `version === 1`.
- **Bench script entry.** `bench:cursor-hooks` moves from S1 to S2 (see shared contract), so no `package.json` entry points at a missing file.

<a id="slice-s2"></a>
### Slice S2: Deferred compaction re-anchor
#### Surfaces
Owns R16 and R16.1. Files:

- new `hooks/cursor-pre-compact` (100755);
- new `hooks/cursor-post-tool-use` (100755);
- new `scripts/bench-cursor-post-tool-use.mjs`;
- extend `tests/cursor-hooks.test.mjs`.

Grouping rationale: the marker is written by one script and consumed by the other, so the pair is one protocol.
#### Implementation
1. RED: add the S2 assertions from Edge cases and run CMD-CURSOR-HOOKS. It must fail because both scripts are missing.
2. `hooks/cursor-pre-compact`: `#!/usr/bin/env node`, `'use strict'`, requiring only `node:fs`, `node:path` and `node:child_process`.
   - Copy `installedScriptPath`, `readStdin` and `readInput` verbatim from SRC-CODEX-HOOK, and `resolveProject` from S1.
   - Then:

```js
const AWM_TIMEOUT_MS = 2000;

function markerName(input) {
    const id = typeof input.conversation_id === 'string'
        ? input.conversation_id.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 128)
        : '';
    return `compact-${id || 'default'}`;
}

function main() {
    const input = readInput();
    try {
        const state = path.join(path.dirname(installedScriptPath()), 'state');
        fs.mkdirSync(state, { recursive: true, mode: 0o700 });
        fs.writeFileSync(path.join(state, markerName(input)), `${new Date().toISOString()}\n`, { mode: 0o600 });
    } catch {
        // No marker means no re-anchor; the session itself is unaffected.
    }
    const cwd = resolveProject(input);
    if (cwd !== null) {
        try {
            execFileSync('awm', ['ledger', 'add', '--phase', 'compaction-recovery',
                '--source-skill', 'context-compaction-recovery', '--polarity', 'finding',
                '--class', 'proceso', '--signature', 'compaction-reanchor', '--severity', 'info',
                '--desc', 'Cursor compacted the context; re-anchor queued for the next tool call'],
            { cwd, stdio: 'ignore', timeout: AWM_TIMEOUT_MS });
        } catch {
            // Best-effort audit trail, same as the Claude and Codex hooks.
        }
    }
    process.stdout.write('{}\n');
}

try {
    main();
} catch {
    process.stdout.write('{}\n');
}
```

3. `hooks/cursor-post-tool-use`: same header. Copy `installedScriptPath`, `readStdin`, `readInput` and `markerName`, then:

```js
const STALE_MS = 24 * 60 * 60 * 1000;
const REANCHOR_TIMEOUT_MS = 3000;

function main() {
    const dir = path.dirname(installedScriptPath());
    const state = path.join(dir, 'state');
    let names;
    try {
        names = fs.readdirSync(state).filter((name) => name.startsWith('compact-'));
    } catch {
        return;
    }
    // Hot path on every tool call: no marker, no stdin read, no output.
    if (names.length === 0) return;

    for (const name of names) {
        const file = path.join(state, name);
        try {
            if (Date.now() - fs.statSync(file).mtimeMs > STALE_MS) fs.unlinkSync(file);
        } catch {
            // Already consumed by a concurrent call.
        }
    }
    const input = readInput();
    const marker = path.join(state, markerName(input));
    // Unlink BEFORE injecting: two concurrent tool calls must not both re-anchor.
    try {
        fs.unlinkSync(marker);
    } catch {
        return;
    }
    let text = '';
    try {
        text = execFileSync(process.execPath, [path.join(dir, 'session-start'), '--reanchor'], {
            input: JSON.stringify(input),
            encoding: 'utf8',
            timeout: REANCHOR_TIMEOUT_MS,
            stdio: ['pipe', 'pipe', 'ignore'],
        });
    } catch {
        return;
    }
    if (text.trim()) process.stdout.write(`${JSON.stringify({ additional_context: text })}\n`);
}

try {
    main();
} catch {
    // Silence is the correct answer for a tool-call hook that cannot help.
}
```

4. `scripts/bench-cursor-post-tool-use.mjs`:
   - Install the three hooks into a tmp dir (no `state/`).
   - Run `post-tool-use` 100 times with `spawnSync(process.execPath, [installed], {input: '{}'})`, measuring each with `process.hrtime.bigint()`.
   - Print `{"runs":100,"p50Ms":..,"p95Ms":..,"budgetMs":50,"withinBudget":bool}` as JSON and exit 0 (evidence only, never a CI gate).
5. GREEN: set mode 0755 on both hooks (`git add --chmod=+x`), run CMD-CURSOR-HOOKS, then run CMD-BENCH and record its JSON in the slice review.
#### Edge cases
- **R16.1:** with no `state/` dir, `post-tool-use` exits 0 with empty stdout. The same holds with an empty `state/` and with a `state/` containing only a non-`compact-` file.
- **R16:**
  - `pre-compact` with `{"conversation_id":"c1"}` creates `state/compact-c1`, prints exactly `{}`, and invokes the stubbed `awm` with argv containing `ledger`, `add`, `--signature` and `compaction-reanchor`. The stub records argv to a file, and the test asserts on that file.
  - Next, `post-tool-use` with `{"conversation_id":"c1"}` in the plan fixture prints JSON whose `additional_context` contains `Re-anchor (post-compaction)` and `Active plan:`, and removes the marker. A second call prints nothing.
- **Isolation:**
  - A marker for `c1` plus `post-tool-use` for `c2`: no output, and `compact-c1` still exists.
  - `conversation_id` `../../x` produces `state/compact-x`, so nothing is written outside `state/`.
  - A missing `conversation_id` uses `compact-default`.
- **Stale:** a marker with an mtime 2 days old is deleted and nothing is emitted.
- **Fail-open:**
  - A failing `awm` stub still leaves `pre-compact` with exit 0, the `{}` output and the marker written.
  - A deleted sibling `session-start` makes `post-tool-use` exit 0 with no output.
  - A read-only install dir makes `pre-compact` exit 0.
- **Budget:** the re-anchor output is at most 4 KiB. It is inherited from S1 `--reanchor`, so assert it end-to-end here too.
#### Evidence
- Sources: SRC-CODEX-HOOK, SRC-CODEX-TEST, SRC-PACKAGE.
- CMD-CURSOR-HOOKS: RED, then GREEN.
- CMD-BENCH JSON (p95) is recorded for the Plan B R16.2 decision.
- Distinct specification and code-quality verdicts.
- Both files have mode 100755.
#### Fallback
Delivery of `postToolUse.additional_context` to the model and the real latency are only provable inside real Cursor (Plan B playbook).

- If CMD-BENCH shows p95 over 50 ms, record it. Plan B then applies R16.2 (it removes the `preCompact`/`postToolUse` entries and marks compaction re-anchor as unsupported). Do not add a shell fast path here without amending the design, because it breaks Windows parity.
- If Cursor turns out to omit `conversation_id`, the `compact-default` path keeps working for single-conversation use. Amend and revalidate before claiming multi-conversation isolation.

#### Amendment A2 (2026-09-28, S2 implementation)
Deviation record: the S2 implementer found that the verbatim `unlinkSync(marker)` claim does not give R16 its "two concurrent tool calls must not both re-anchor" guarantee. On macOS APFS, several processes that unlink one path at the same moment can all receive success. The controller reproduced this: 4 concurrent unlinks double-succeeded in 60 of 60 rounds, while a rename to a per-process name double-succeeded in 0 of 60. The plan is amended before the fix; the corrected clause governs S2.

- **Atomic claim (R16).** `hooks/cursor-post-tool-use` claims the marker by `fs.renameSync(marker, `${marker}.claim-${process.pid}-${random}`)`, where `random` comes from `crypto.randomBytes` (`node:crypto` is allowed). Only the process whose rename succeeds re-anchors; it unlinks its claim file best-effort before injecting. A failed rename returns silently as before. Claim files never match the next scan's marker name. The stale sweep also removes `compact-*` claim files older than 24 h.
- **Test.** The concurrency case is a real test, not `todo`. N concurrent `post-tool-use` calls on one marker produce exactly one non-empty output, repeated over enough rounds that the unlink variant fails it on APFS. The deterministic ordering test (claim before inject) stays.

<a id="slice-s3"></a>
### Slice S3: Claude suppression guard, CI wiring and release
#### Surfaces
Owns R15 and R20. Files:

- `hooks/session-start` (the guard);
- `tests/session-start.test.mjs` (new cases);
- `scripts/validate-portability.mjs` (Cursor hook checks);
- `tests/validate-portability.test.mjs` (negative case);
- `.github/workflows/validate.yml` (CI step);
- `CHANGELOG.md` (release entry).

Grouping rationale: these are the edges where the new hooks meet existing gates and the release path. They ship together so the tag carries hooks that CI actually guards.
#### Implementation
1. RED:
   - Add to `tests/session-start.test.mjs` three cases that run the bash hook with `env` `{HOME: tmpHome, AWM_HOME: tmpAwm}`:
     - `CURSOR_VERSION=2026.09.26` with `tmpAwm/hooks/cursor/session-start` present: stdout is empty and the exit code is 0.
     - `CURSOR_VERSION` set, file absent: the normal `hookSpecificOutput` JSON.
     - File present, `CURSOR_VERSION` unset: the normal JSON.
   - In `tests/validate-portability.test.mjs`, follow the existing copy-and-mutate pattern: clearing the executable bit of `hooks/cursor-post-tool-use` must make the validator fail with `hooks/cursor-post-tool-use: is not executable`.
   - Run CMD-SESSION-START and CMD-PORTABILITY; both must fail.
2. In `hooks/session-start`, insert directly after `set -euo pipefail`:

```bash
# Cursor also runs ~/.claude/settings.json hooks. When AWM's native Cursor hook
# is installed it is the only carrier of this context; emitting here too would
# pay for using-awm twice in every Cursor session.
if [ -n "${CURSOR_VERSION:-}" ] && [ -e "${AWM_HOME:-$HOME/.awm}/hooks/cursor/session-start" ]; then
    exit 0
fi
```

3. In `scripts/validate-portability.mjs`, add `validateCursorHooks(errors)` next to `validateCodexSessionHook` and call it right after that function's call site (line 527).
   - It applies the same exists / is-file / executable / concept checks to each entry of:

```js
const requiredCursorHookConcepts = {
  'hooks/cursor-session-start': ['CURSOR_PROJECT_DIR', 'additional_context', 'heartbeat.json', '--reanchor', 'CONSTITUTION.md', 'docs/plans'],
  'hooks/cursor-pre-compact': ['compaction-reanchor', 'state', 'conversation_id'],
  'hooks/cursor-post-tool-use': ['--reanchor', 'additional_context', 'state'],
};
```

   - Missing-file message: `${relativePath}: missing Cursor hook`.
4. In `.github/workflows/validate.yml`, add `- run: npm run test:cursor-hooks` directly after `- run: node tests/session-start.test.mjs`.
5. At the top of `CHANGELOG.md`, add `## Cursor native hooks — <merge date>`, describing the three hooks, their installed names, the `using-awm.md` location contract and the Claude guard. Note that CLI Plan B requires this registry tag as its minimum.
6. GREEN: run CMD-SESSION-START, CMD-PORTABILITY and CMD-CURSOR-HOOKS.
7. Release (R20, after merge to `main`, outside the executor's commands): cut registry tag `v4.9.0` (the next minor after `v4.8.1`) per SRC-CONSTITUTION, and record the tag SHA in the Plan B header before Plan B declares it as a minimum.
#### Edge cases
- The guard never fires outside Cursor (`CURSOR_VERSION` unset), so Claude Code behavior is byte-identical. The existing session-start assertions stay green unchanged.
- `AWM_HOME` unset falls back to `$HOME/.awm`. `set -u` safety comes from `${VAR:-}`.
- A dangling symlink at the Cursor hook path counts as not installed (`-e` follows links). The duplicate is the lesser failure compared with losing context.
- The portability validator reports each missing concept separately and does not stop at the first one.
#### Evidence
- Sources: SRC-CLAUDE-HOOK, SRC-SESSION-TEST, SRC-PORTABILITY, SRC-WORKFLOW, SRC-PACKAGE, SRC-CONSTITUTION.
- CMD-SESSION-START and CMD-PORTABILITY: RED, then GREEN. CMD-CURSOR-HOOKS: GREEN.
- CI green on the PR.
- The tag `v4.9.0` exists on the merge commit before the Plan B release PR merges.
- Distinct specification and code-quality verdicts.
#### Fallback
- Whether Cursor exports `CURSOR_VERSION` to `~/.claude/settings.json` hooks is unverified (Plan B playbook). If it does not, the guard is inert and Cursor receives `using-awm` from both hooks (about 1k extra tokens per session, no functional loss). Amend the design with the variable Cursor does export and re-release; do not detect Cursor by parent-process heuristics.
- If the tag cannot be cut before Plan B is ready, Plan B waits (R20); it never pins an untagged SHA.
