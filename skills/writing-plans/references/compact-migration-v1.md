# Historical implementation-plan migration v1

`migration-required` means readable historical input, not execution. CLI facts are mechanical;
writing-plans owns semantic boundaries. Preserve original branch, hashes and durable evidence.

## Normative migration protocol

- Read historical input without mutation; hash it before and after, and write a separately named compact continuation only after explicit owner acceptance.
- Collect bounded read-only facts from the historical plan, Git commits/diff, journal when present, current tests, sensors, independent verdicts, and durable issue evidence; exclude source/prompt bodies and secrets from persisted evidence.
- Use `awm plan migration-facts HISTORICAL_PLAN --cwd . --issue https://github.com/Kodria/agentic-workflow/issues/126 --json`; a fact report is evidence, not semantic slice approval or permission to execute.
- Carry forward completion only when current files, commit, passing tests/sensors, and required independent specification and quality verdicts support it; a checkbox, commit, test-only result, or summary alone never completes an obligation.
- Keep completed behavior as an evidenced source/checkpoint and include only remaining obligations; final branch closure revalidates completed behavior without reimplementing it.
- For #148 retain Task 1 as verified antecedent, Task 2 as pending its missing code-quality re-review, and Tasks 3–14 as unstarted unless newer durable evidence proves otherwise.
- Ambiguous ownership, conflicting evidence, or unsafe boundaries return `planning-required` or `blocked`, naming unresolved items, affected requirements, and the owner decision; infer neither completion nor a safe slice.
- Bound retrieval to declared authoritative sources and the current role; unresolved facts stop migration instead of unbounded scanning or wholesale regeneration.

1. Confirm exact repository/branch/plan and issue links; read/hash only the selected regular
   contained historical file. The CLI owns byte and diagnostic bounds; unsafe paths stop.
2. Collect CLI facts and current evidence. Record a checkpoint table: historical task,
   requirements, files/commit, tests/sensors, independent reviews, remaining obligation,
   conflict/decision. Unsupported facts stay pending, not PASS.
3. State unique ownership, cohesive rationale, surfaces/dependencies/evidence for remaining
   slices. Completed behavior is a contained source; pending review is review-only work,
   never wholesale implementation. Inline necessary external facts in the accepted plan.
4. Present proposed continuation and original hash comparison for explicit owner acceptance.
   Write the separate accepted compact artifact and trace original path/hash to new CLI
   identity. Do not overwrite source or hand-write journal schema metadata.
5. The continuation is a new plan: declare `**Modo de despacho:**` (`proveedor-nativo` when
   returning from a blocked v2 journal to native dispatch) and run
   `awm plan validate CONTINUATION --cwd . --require-dispatch-mode --json`; only valid proceeds to admission.
   Amendments revalidate and visibly invalidate stale obligations. Binding/recovery is explicit.
6. Read-only dry run selects the next durable obligation, #148 Task 2 quality re-review, not
   Task 1 redispatch. Dry runs never dispatch or certify missing work. Execution needs admission.

When #148 facts are blocked by a missing antecedent verdict, preserve the checked historical
work, original bytes and commits as claimed antecedent evidence, not newly certified PASS.
Report the missing evidence/decision explicitly; do not reset, regenerate, or re-dispatch Task 1
to hide the gap. Task 2 remains pending quality and Tasks 3–14 remain unstarted; do not resume
until the evidence-backed continuation and current admission are accepted.

For the approved #148 sibling worktree use the CLI's explicit read-only `--historical-root
HISTORICAL_ROOT` option with both #126/#148 durable `--issue` URLs. Use only a verified root;
this is not general cross-repository access. Manifest sources stay inside the active repository.
