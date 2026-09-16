# Compact Slices v1

Every executable implementation plan is compact. Complete approved serial requirements and
unique ownership use this reference; incomplete facts or parallel tracks return planning-required,
never legacy execution. R1 has no semantic model profiles or parallel compact schema.

## Manifest boundary

Place exactly one `<!-- AWM:COMPACT-SLICES:START v1 -->` JSON manifest and matching
`<!-- AWM:COMPACT-SLICES:END v1 -->` after the header. Schema is exactly
`compact-slices/v1`. Declare planId, requirements, sources, commands, slices, closureCommands.
Every requirement has one requirement owner; every serial slice declares id, title,
requirements, dependsOn, sectionAnchor, sources, redCommands, greenCommands, reviewEvidence,
risk and fallback. Preserve canonical IDs (`RF-1.1`, `RNF-T.1`, safe hyphenated IDs);
no translation. Unique ownership and explicit grouping rationale are mandatory.

Source IDs are authoritative, stable contained regular paths with exact locator and fact.
Do not delegate an executor to inspect or discover the repository. Inline a required fact
when its source is insufficient, unavailable, unstable, unsafe, inaccessible or ambiguous;
if ownership/behavior cannot be approved, stop with planning-required. Shared payload is stated
once at the narrowest shared boundary; do not repeat shared commands or source prose in every step.

## Canonical slice prose

Each exact anchor immediately precedes its manifest-matching `### Slice ID: Title`.
Each slice contains exactly five complete sections:

- `#### Surfaces`: behavior, owned requirement IDs, exact files, interfaces and grouping rationale.
- `#### Implementation`: dependencies, inputs/outputs, actual RED → implementation → GREEN
  steps and complete code/facts to act without new product/architecture discovery.
- `#### Edge cases`: invalid/edge inputs, exact assertions, robustness and security constraints.
- `#### Evidence`: declared sources, RED/GREEN commands, independent spec/quality evidence,
  tests/sensors and current-plan identity required for completion.
- `#### Fallback`: risk trigger, durable deviation/amendment and full relevant context.

## Commands

Commands are inert, tokenized program/args with stable IDs and covered requirements;
closureCommands lists reused final verification IDs. No writes, prompts, network mutation,
destructive scope or shell syntax. Use real verified repository commands; never substitute
`git --version` for a test. Generic shell/interpreter launchers are rejected; npm scripts
run the actual named verification. Mechanical validity is not evidence that tests passed.

Self-review bidirectional coverage, then run `awm plan validate PLAN_PATH --cwd . --json`.
Only valid proceeds to admission; migration-required, invalid and unsupported block.
An unmarked plan requires separate migration, never another executable route. Coverage is
a planning self-review, not a fabricated CLI command. Revalidate every amendment, retain
the new CLI identity and obsolete stale verdicts before continuation.

## Risks and fallback

Full relevant-context fallback retains the compact state machine, all reviewers and gates.
Read `compact-admission-v1.md` for the blocking handoff. Structural counts alone do not
prove efficiency, billed cost savings or non-inferiority. Read existing Evidence Capsule v1;
never persist prompt payload/source or response bodies as telemetry.

## Minimal complete example

```markdown
# Example compact plan
**Modo de ejecución:** interactivo
<!-- AWM:COMPACT-SLICES:START v1 -->
{"schema":"compact-slices/v1","planId":"reference-example","requirements":["RF-1.4"],"sources":[{"id":"SRC-ONE","path":"skills/writing-plans/SKILL.md","locator":"## Bite-Sized Task Granularity","fact":"Steps are bite-sized with real RED/GREEN evidence."}],"commands":[{"id":"CMD-TEST","program":"npm","args":["run","test:compact-only"],"covers":["RF-1.4"]}],"slices":[{"id":"S1","title":"Example","requirements":["RF-1.4"],"dependsOn":[],"sectionAnchor":"slice-s1","sources":["SRC-ONE"],"redCommands":["CMD-TEST"],"greenCommands":["CMD-TEST"],"reviewEvidence":["specification","code-quality"],"risk":"full-context","fallback":["public-contract"]}],"closureCommands":["CMD-TEST"]}
<!-- AWM:COMPACT-SLICES:END v1 -->
<a id="slice-s1"></a>
### Slice S1: Example
#### Surfaces
Own RF-1.4 in the compact reference and its structural fixture/test; one cohesive vocabulary boundary.
#### Implementation
Add the assertion for exact five canonical subsections; run CMD-TEST and observe RED for a removed heading. Correct the reference and run CMD-TEST GREEN. SRC-ONE supplies bite-sized RED/GREEN discipline.
#### Edge cases
Missing or duplicate headings must fail; dotted requirement IDs remain unchanged and unknown schemas block.
#### Evidence
CMD-TEST executes the actual structural contract. Obtain distinct current clean specification and quality verdicts; reconcile files, tests, sensors and CLI-derived plan identity before completion.
#### Fallback
Public-contract risk expands full relevant context under Evidence Capsule v1 without removing gates. An insufficient fact requires durable amendment and revalidation, never delegated discovery.
```
