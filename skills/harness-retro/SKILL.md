---
name: harness-retro
version: "3.0.0"
license: Apache-2.0
description: Use as the terminal learning phase of development-process — reads the per-branch findings ledger (awm ledger), presents the session's findings and wins interactively, and cures each into a concrete, durable rule (remediation tree / CONSTITUTION.md / AGENTS.md) so the agent stops repeating mistakes. Ledger-driven, not dependent on human recall.
---

# Harness Retro

## Compact admission — BLOCKING

Read `../writing-plans/references/compact-admission-v1.md` before any plan execution, role dispatch, resume, or lifecycle transition.
Apply it exactly; only `admitted` for the current plan identity may continue.

## Overview

`harness-retro` is the terminal learning phase of `development-process`. It reads the branch ledger accumulated during the session (populated by SDD reviewers, post-qa, post-implementation-docs, sensors, and debugging phases), presents every item to the user interactively, and cures the approved ones into the remediation tree or existing delivered docs.

**Announce at start:** "I'm using the harness-retro skill to review this session's findings and cure them into the harness."

**Core principle:** Add the rule to the harness, not the fix to the symptom.

**Source of truth:** the per-branch ledger at `.awm/ledger/<branch>.jsonl`, populated during the session by the review/QA/sensor/debugging phases. harness-retro reads it; it does not ask you to remember prior occurrences.

## When to use

- Automatically: `development-process` routes here after `post-implementation-docs` completes and `awm-docs-complete` is present but `awm-retro-complete` is absent.
- Manually: the user invokes it directly ("do a retro on this session", "we keep seeing X, do a retro").

## When NOT to use

- The ledger is empty, there are no manual observations, **and the session genuinely produced zero findings** — exit fast and add the `awm-retro-complete` marker.

**Empty-ledger consistency check (mandatory before fast-exit):** an empty ledger is only legitimate if nothing was found during the cycle. Cross-check against the session evidence: did the spec/quality reviewers report issues? Did `post-implementation-qa` present findings (Track A/B in the plan or QA report)? Did `post-implementation-docs` log an unverifiable claim as a gap? If findings were reported anywhere but the ledger is empty, the learning pipeline is broken — **that IS the retro finding**. Do not fast-exit: trace where the `awm ledger add` instruction was dropped (inline prompt instead of template? missing gate?), cure the gap in the responsible skill, and log it. An empty ledger after a cycle with findings is contradictory evidence, never a clean bill.

## Modo de ejecución (lectura del campo)

Al arrancar, usa únicamente el plan activo y la identidad confirmados por admission; lee su línea `**Modo de ejecución:**` desde esos mismos bytes validados:

- Ausente o `interactivo` → modo interactivo (default): comportamiento estándar de este skill.
- `desatendido` → aplica la sección **Modo desatendido** de este skill.
- Cualquier otro valor → trátalo como `interactivo` y avisa al usuario: "Valor inválido en `Modo de ejecución`: `<valor>` — usando modo interactivo."

El modo desatendido quita pausas, no controles: los gates (sensor, ledger, reconciliation, anti-bias, drift plan-vs-código) corren idénticos en ambos modos.

### Modo desatendido

WHEN el modo es `desatendido`, el paso 3 del checklist no presenta ítem por ítem. Unattended mode uses only existing triage rules; it records any recommendation that needs new authority instead of applying it.

- **Triage existing remedies only** for findings that are recurrent (`awm ledger recurring --min 2`), `blocker` severity, or systemic (the same pattern in ≥2 files/tasks).
- **Record** every proposed new remedy or unauthorized change in `docs/harness-retros.md` as a recommendation; do not apply it without authority.
- **Discard** the remainder without asking, documenting each dismissal and its reason in `docs/harness-retros.md` (section "Descartes").
- The remaining steps run identically: classify, draft only an authorized rule, integrate it
  without context removal, apply, **verify the rule fires**, commit, log, archive, and add the
  marker.

## Checklist

You MUST create a task for each item and complete them in order:

1. **Read the session ledger** — run `awm ledger list` and `awm ledger recurring --min 2`; summarize findings + wins for the user
2. **Read empirical coverage** — run `awm sensors coverage --json` after the ledger. Coverage is read-only: it reports outcomes and does not apply remedies or mutate the project.
3. **Present each item interactively** — present ledger findings, wins, and coverage outcomes; for each remedy, the human decides: structuralize, record as AGENTS.md lesson, or dismiss
4. **Classify each approved item** — structural / logic / process / security
5. **Draft the rule** — actual lint/test/constitution/semgrep/AGENTS.md text
6. **Cure, don't append raw** — when writing to CONSTITUTION.md or AGENTS.md: integrate the
   new lesson into the relevant existing section while retaining existing context; organize or
   compact presentation only without removing content
7. **Apply the authorized rule** — edit the target file
8. **Verify the rule fires** (for sensor rules) — manufacture the failure, run the sensor, confirm it catches it
9. **Commit** the rules
10. **Log the retro** — append to `docs/harness-retros.md`
11. **Capture and close the retro** — capture cycle evidence, run `awm ledger archive`, and add the `awm-retro-complete` marker

## The remediation tree

```
Session finding
├── structural / security / logic (sensor-catchable)
│   └── remediation tree: eslint.config.awm.mjs / .semgrep.awm.yml / tests/structural/
├── process (project rule)
│   └── CONSTITUTION.md
└── agent working-style + wins
    └── AGENTS.md
```

**Two-tier curation targets:**

| Class | Cured target (existing, delivered) |
|---|---|
| structural / security / logic (sensor-catchable) | remediation tree: `eslint.config.awm.mjs` / `.semgrep.awm.yml` / `tests/structural/` |
| process (project rule) | `CONSTITUTION.md` |
| agent working-style + **wins** | `AGENTS.md` |

Wins (`polarity: win`) are reinforced as short "what works here" notes in `AGENTS.md`. Agent-style lessons land in `AGENTS.md` (agnostic — every agent reads it), never `CLAUDE.md`.

### Classification heuristics

| Symptom | Class | Why |
|---|---|---|
| Type/shape error caught by reading the code | structural | The compiler/linter should reject it without running tests |
| Logic error only caught when code runs | logic | Behavioral; needs a test that exercises the path |
| "We always forget to do X before Y" | process | Human discipline; rule belongs in CONSTITUTION.md |
| Pattern that creates a vulnerability (eval, unsanitized SQL, etc.) | security | Semgrep / dataflow rule |
| Agent working-style lesson or win | agent | Notes in AGENTS.md |

If the bug straddles two classes, pick the one that fails *earliest* in the loop — earlier = cheaper.

## The Process

### 1. Read the session ledger

Run these two commands:

```bash
awm ledger list
awm ledger recurring --min 2
```

`awm ledger list` shows all findings and wins recorded during the session.
`awm ledger recurring --min 2` groups by `signature` and shows clusters where the same issue appeared ≥2 times — this is a **signal** to weigh when deciding whether to structuralize, not a hard gate. You may structuralize a single high-impact finding (`count: 1`), or defer a recurring trivial one. The user decides per item.

Summarize for the user: total findings, total wins, recurring clusters (if any).

### 2. Read empirical coverage

Run the coverage command exactly once, after reading the active ledger and before triage or archive. Treat its static and empirical outcomes as evidence for the retrospective; it is read-only and never grants authority to apply a remedy.

### 3. Present each item interactively

Present every ledger item — findings AND wins — grouped by signature with its recurrence count. For each, wait for an explicit user decision:

- **Structuralize** → which target (remediation tree / CONSTITUTION.md / AGENTS.md)?
- **Record as AGENTS.md lesson/win** → reinforcing working patterns
- **Dismiss** → note the reason and move on

**Modo interactivo:** the human decides each remedy after seeing the coverage outcomes. Do not apply anything without explicit user approval per item. Do not batch-apply.

**Modo desatendido:** aplica el triage con criterio propio definido en la sección "Modo desatendido" — sin aprobación por ítem, con descartes documentados.

### 4. Classify

Apply the heuristics from the table above. State the classification out loud:

> "Classifying as `logic` because the bug only surfaced when the function ran against an empty input — a static check wouldn't have caught it."

### 5. Draft the rule

Write the actual rule, not a description. Examples by class:

**structural (ESLint):**
```js
// eslint.config.awm.mjs — added rule
{
  rules: {
    'no-restricted-syntax': ['error', {
      selector: "CallExpression[callee.name='setTimeout'][arguments.length=1]",
      message: 'setTimeout requires an explicit delay argument.',
    }],
  },
}
```

**logic (structural test):**
```ts
// tests/structural/no-implicit-any-fallback.test.ts
import { parseConfig } from '../../src/config';

test('parseConfig returns explicit error on empty input', () => {
  expect(() => parseConfig('')).toThrow(/empty config/);
});
```

**process (CONSTITUTION.md):**
```markdown
## Process
- Before invoking a destructive Bash command (rm, drop, truncate), MUST confirm with the user when not in CI.
```

**security (Semgrep):**
```yaml
# .semgrep.awm.yml — added rule
- id: no-eval-on-user-input
  pattern: eval($USER_INPUT)
  message: eval() on user input — use a parser/validator instead.
  severity: ERROR
  languages: [javascript, typescript]
```

**agent lesson/win (AGENTS.md):**
```markdown
## What works here
- Staging files individually (not `git add -A`) prevents accidental secret inclusion — confirmed pattern across multiple sessions.
```

### 6. Cure, don't append raw

#### Context Kernel v1 guard

Read `project-context-init/references/context-kernel-v1.md` and run `awm
preflight` before changing a context file. Branch from the reported state:

- **legacy:** retain full context. It may organize or compact presentation only
  without removing any content; no context metadata is created as a side effect
  of a retro.
- **valid kernel:** select the applicable card and consolidate equivalent
  wording only when no content or ID is removed; update its card and index entry
  together. Capture the ID inventory before and after the change; the before
  and after ID inventories must be equal.
- **partial or invalid:** do not modify context. Keep full context visible,
  report the diagnostic, and wait for a reviewed repair.

MUST NOT automatically edit a protected kernel region. A genuinely
unconditional rule is proposed to the owner rather than inserted by retro. An
owner-approved removal requires explicit approval and a reason recorded in the
migration or maintenance history. A budget observation is evidence, never
removal authority.

When writing to `CONSTITUTION.md` or `AGENTS.md`, fold the new lesson into the
relevant existing section while retaining the existing context. These docs are
delivered every session — organize or compact their presentation without
removing content, and record any owner-approved removal separately rather than
performing it in retro.

**Growth still needs visibility.** Measured on a real repo, `AGENTS.md` went 73KB → 141KB
across **45 revisions**. Integrating lessons can grow context, so treat the
measurement as necessary evidence for the next owner decision.

**Report the growth here. Do not gate on it here.** This skill is the terminal phase of the run, and
that run is often unattended — the user is asleep and expects a finished PR in the morning. A budget
check that fails at this point strands exactly that: nobody is present to make an
owner decision, and the work stops one step from done. The enforcement point is
the **Context Budget Gate at the end of `writing-plans`**, the last moment a
human is guaranteed to be there.

So after applying a lesson, measure and record — never block:

```bash
awm context-budget --json    # read the numbers; do NOT treat exit 1 as a stop here
```

Put the delta in the retro log entry (step 9): what these files weighed before,
what they weigh now, and any organization or owner-approved maintenance proposal.
That makes growth visible at the next plan gate, where someone can act on it. A
retro that added 3KB is not a failure — it is a line in the log that the next
`writing-plans` will surface while the user is present.

### 7. Apply

Use the native file-editing mechanism to add the rule to the target file. If the file doesn't exist (e.g. `tests/structural/` is new), create it and any required scaffolding.

### 8. Verify the rule fires

For sensor-catchable rules (structural, logic, security), manufacture the original failure and confirm the sensor catches it:

```bash
awm sensors run    # for tsc/eslint rules
npm test -- tests/structural   # for structural tests
```

Expected: the sensor fails on the manufactured case. Then revert and re-run — sensors should pass cleanly.

### 9. Commit

```bash
git add <changed-files>
git commit -m "harness-retro: <class> rule for <issue summary>"
```

### 10. Log the retro

Append (or create) `docs/harness-retros.md`:

```markdown
## YYYY-MM-DD — <one-line issue>

- **Class:** structural | logic | process | security | agent
- **Occurrences (ledger count):** N
- **Rule:** path:line of the new rule
- **Sensor:** which sensor catches it (typecheck | lint | security | structural-test | constitution | agents-md)
- **Descartes (modo desatendido):** <signature — razón> | ninguno
```

### 11. Capture and close the retro

Use only the explicit admitted active_plan and its CLI identity; never resolve another plan by filename, mtime, marker, or checkbox scans.
Read minCliVersion only when this project contains awm-registry.json; a CLI project without registry metadata must not invent that file or fail merely because it is absent.
Query the current branch with `awm watch journal-status --json`; a global .awm/journal directory is never evidence of an active branch journal.
Only a present, non-bootstrapUnused journal with cycleState COMPLETE and a passing current interlock permits cycle evidence capture.
Missing journal skips capture explicitly with manual/native QA evidence and no fabricated cycle; it never permits missing-journal unattended dispatch.
Corrupt, nonterminal, or mismatched journal blocks capture and archive; unused bootstrap state is administrative abandonment, never completed execution.

Check the consumed registry contract through admission even when no local registry metadata
exists. The local registry floor gate below validates numeric semver and emits a quoted
upgrade package spec. A compatible compiled development runtime may provide explicitly
identified prerelease source/command/contract evidence during an approved bootstrap; this is
not a published/installed version pass and never authorizes registry publication or unattended
dispatch without custody. Do not silently turn a failed installed floor into source acceptance.

<!-- retro-compatibility-script -->
```bash
if [ -f awm-registry.json ]; then
  min_cli_version="$(node -e 'const fs=require("node:fs"); const p="awm-registry.json"; if(fs.statSync(p).size>65536) process.exit(1); const v=JSON.parse(fs.readFileSync(p,"utf8")).minCliVersion; if(!/^\d+\.\d+\.\d+$/.test(v)) process.exit(1); process.stdout.write(v)' 2>/dev/null)" || {
    echo 'Cannot read a valid minCliVersion from awm-registry.json.' >&2
    exit 1
  }
  installed_cli_version="$(awm --version)" || exit 1
  if ! node - "$installed_cli_version" "$min_cli_version" <<'NODE'
const parse = value => {
  if (!/^\d+\.\d+\.\d+$/.test(value)) process.exit(1);
  const parts=value.split('.').map(Number);
  if (!parts.every(Number.isSafeInteger)) process.exit(1);
  return parts;
};
const [actual,minimum]=process.argv.slice(2).map(parse);
let comparison=0;
for(let i=0;i<3;i+=1) if(actual[i]!==minimum[i]) { comparison=actual[i]>minimum[i]?1:-1; break; }
process.exit(comparison>=0?0:1);
NODE
  then
    echo "Installed CLI ${installed_cli_version} does not meet required ${min_cli_version}." >&2
    printf 'npm i -g %q\n' "agentic-workflow-manager@>=${min_cli_version}" >&2
    exit 1
  fi
else
  echo 'No local registry metadata: retain admitted consumed-contract or explicit prerelease source evidence; no fabricated registry floor.' >&2
fi
```

Require the declared repo-relative active_plan from current admission/controller state,
and the current branch query. The query is read-only and returns state missing/corrupt/present,
cycleState, sanitized binding and bootstrapUnused; no additional fields may be invented.
A missing branch journal with retained directories/archives is still missing.
For present state, check binding against the CLI identity and require cycleState COMPLETE,
bootstrapUnused false and `awm job gate` passing before capture. Then require exit 0:

```bash
test -n "$active_plan" || { echo 'Explicit current active_plan is required.' >&2; exit 1; }
journal_status="$(awm watch journal-status --json)" || exit 1
capture_state="$(node - "$journal_status" <<'NODE'
const input=process.argv[2];
if (Buffer.byteLength(input,'utf8')>10000) process.exit(1);
const report=JSON.parse(input);
if (!report || typeof report!=='object' || Array.isArray(report)) process.exit(1);
if (report.state==='missing') process.stdout.write('missing');
else if (report.state==='present' && report.cycleState==='COMPLETE' && report.bootstrapUnused===false) process.stdout.write('ready');
else process.exit(1);
NODE
)" || { echo 'Corrupt/nonterminal/unused journal blocks capture and archive.' >&2; exit 1; }
case "$capture_state" in
  ready)
    test -n "$active_provider" || { echo 'Native active_provider is required.' >&2; exit 1; }
    awm plan admit "$active_plan" --provider "$active_provider" --cwd . --require-current --verify-sensors --json || exit 1
    awm job gate || exit 1
    awm evidence capture --plan "$active_plan" || {
      echo 'Cycle evidence capture failed; the ledger will not be archived.' >&2
      exit 1
    }
    ;;
  missing)
    test -n "$manual_qa_evidence" || { echo 'Durable manual/native QA evidence is required before no-journal archive.' >&2; exit 1; }
    echo "Skipping cycle evidence capture: no current branch journal; manual/native evidence: $manual_qa_evidence. No completed journal cycle claimed." >&2
    ;;
  *) exit 1 ;;
esac
```

Do not execute the capture command in the missing state. Report the skip and name durable
manual/native tests, sensors, distinct review and QA evidence. Administrative bootstrap
abandonment additionally needs the verified explicit `awm watch archive-unused --json`
receipt; it is never a completed journal cycle or future unattended admission. If evidence is
missing, block rather than invent a cycle. Corrupt or nonterminal state requires reviewed
recovery, not resetting/archiving active work.

Only after successful terminal-cycle capture, or the explicit evidenced no-journal skip,
run `awm ledger archive`. Then run `awm ledger list` and require an empty list (`[]`);
exit 0 alone is not enough. Archive failure or nonempty active ledger stops the retro.
This capture/skip-and-archive verification is mandatory in modo desatendido too.

After the archive is verified, add the `awm-retro-complete` lifecycle marker to the explicit
active plan through the current CLI-supported lifecycle transition. Revalidate/re-admit its
current identity; do not mark an unrelated plan or declare stale obligations current.

```markdown
<!-- awm-retro-complete: YYYY-MM-DD -->
```

## Anti-patterns

- **Asking "where did this fail before?" instead of reading the ledger.** The ledger has the answer — use `awm ledger list` and `awm ledger recurring`.
- **Treating recurrence count as a hard gate.** Count is a signal to weigh, not a threshold to pass. A single high-severity finding may be worth structuralizing. (Modo desatendido usa recurrencia/severidad/sistemicidad como criterio mecánico de triage por diseño — ver sección "Modo desatendido" — pero eso no lo convierte en gate único: cualquiera de los tres es suficiente, y `blocker` o sistémico solos también curan.)
- **Drafting a "philosophical" rule instead of an enforceable one.** "Code should be readable" is a wish, not a rule.
- **Replacing the regression test with the harness rule.** Both should exist — the test asserts the specific case is fixed, the rule prevents the class of cases from returning.
- **Letting AI write the logic structural test.** The skill drafts, the human owns approval. (Modo desatendido es la excepción documentada: el agente aplica sin aprobación por ítem — ver sección "Modo desatendido" — pero conserva el paso de verificación que la regla dispara antes de comitear.)
- **Appending raw entries to CONSTITUTION.md / AGENTS.md** without integrating
  them into an existing section — these docs are delivered every session and
  must stay understandable; organization or compaction never removes content.
- **Curating agent-style lessons into CLAUDE.md.** Agent lessons and wins go to `AGENTS.md` (every agent reads it), never `CLAUDE.md` (Claude-specific).
- **Skipping the `awm ledger archive` step.** The next session should start with a clean ledger; always archive before closing.
- **Fast-exiting on an empty ledger without the consistency check.** If reviewers or QA reported findings during the cycle, an empty ledger means the emission pipeline broke — trace and cure it; don't declare "nothing to learn".

## Integration with other skills

| Skill | How it feeds harness-retro |
|---|---|
| `subagent-driven-development` spec-reviewer | Emits `awm ledger add --polarity finding|win` per spec gap / win |
| `subagent-driven-development` code-quality-reviewer | Emits `awm ledger add` per quality issue / win |
| `post-implementation-qa` deep-review | Emits `awm ledger add` per Track A (`class: proceso`) / Track B (`class: seguridad\|logica\|tests`) finding / win |
| `verification-before-completion` | Emits `awm ledger add` on recurring sensor failure |
| `systematic-debugging` | Emits `awm ledger add` on confirmed root cause |
| `development-process` | Routes to harness-retro after the documentation phase; requires `awm-retro-complete` to proceed to finishing |
| `post-implementation-docs` | Previous phase; emits `awm ledger add` for unverifiable documentation claims |
