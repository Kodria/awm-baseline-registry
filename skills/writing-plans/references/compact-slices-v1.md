# Compact Slices v1

Use this reference only for a formed serial implementation plan whose explicit requirements can be divided without product or architecture judgment. A plan with `## Tracks`, incomplete requirements, or uncertain ownership stays on the legacy Task/Tracks route.

## Manifest boundary

Place exactly one `<!-- AWM:COMPACT-SLICES:START v1 -->` JSON manifest and one matching `<!-- AWM:COMPACT-SLICES:END v1 -->` after the plan header. Its schema is exactly `compact-slices/v1`. It declares stable `planId`, requirement IDs, source IDs, command IDs, and serial slices. Every requirement has one requirement owner; every slice declares `dependsOn`, sources, RED/GREEN command IDs, review evidence, risk, and fallback. Do not semantically autogroup tasks: amend the plan when a safe boundary cannot be stated.

## Behavior and surfaces

Each slice states the behavior to deliver, exact files/surfaces, interfaces it changes, and the requirement IDs it owns. Write enough complete prose that a basic executor can act without a new product or architecture decision.

## Interfaces and sequence

State dependency order, inputs/outputs, and the complete RED → implementation → GREEN sequence. Shared payload is stated once at the narrowest shared boundary and slices refer to its stable IDs; do not repeat shared commands or source prose in every step.

## Edge cases and evidence

State edge cases, exact test assertions, review evidence, and traceability. Source IDs are authoritative, stable, and include path, locator, and the fact they supply. Do not delegate an executor to inspect or discover the repository. If a source is unavailable, unstable, unsafe, inaccessible, ambiguous, or insufficient, inline the needed fact in the slice.

## Commands

Commands have stable IDs and are inert: each names `program`, tokenized `args`, and covered requirements without writes, prompts, network mutation, or destructive scope. Reuse a command ID rather than duplicating it across slice prose. Run `awm plan validate PLAN_PATH --cwd . --json` after self-review and `awm plan analyze`, before any execution handoff; `valid` may proceed, while `invalid` or `unsupported` blocks. No marker or schema signal is legacy, not compact.

## Risks and fallback

Name risk triggers, full relevant-context fallback, retained reviews, and the exact record to make. A fallback changes context size, never quality gates. Structural counts alone do not prove efficiency or non-inferiority.

## Minimal complete example

```markdown
<!-- AWM:COMPACT-SLICES:START v1 -->
{"schema":"compact-slices/v1","planId":"example","requirements":["R1"],"sources":[{"id":"SRC-ONE","path":"skills/writing-plans/SKILL.md","locator":"## Bite-Sized Task Granularity","fact":"Steps are bite-sized."}],"commands":[{"id":"CMD-TEST","program":"node","args":["--test","tests/example.test.mjs"],"covers":["R1"]}],"slices":[{"id":"S1","title":"Example","requirements":["R1"],"dependsOn":[],"sectionAnchor":"slice-s1","sources":["SRC-ONE"],"redCommands":["CMD-TEST"],"greenCommands":["CMD-TEST"],"reviewEvidence":["specification","code-quality"],"risk":"full-context","fallback":["insufficient source"]}]}
<!-- AWM:COMPACT-SLICES:END v1 -->

<a id="slice-s1"></a>
### Slice S1: Example

## Behavior and surfaces
Implement R1 in `tests/example.test.mjs`.

## Interfaces and sequence
Write RED, implement the stated behavior, then run GREEN.

## Edge cases and evidence
The test verifies R1; SRC-ONE supplies the bite-sized-step rule.

## Commands
Run CMD-TEST before and after the implementation.

## Risks and fallback
If SRC-ONE is insufficient, inline its needed fact and amend/revalidate.
```
