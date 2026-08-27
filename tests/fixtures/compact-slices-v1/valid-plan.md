# Compact slices v1 CLI acceptance fixture

<!-- AWM:COMPACT-SLICES:START v1 -->
{
  "schema": "compact-slices/v1",
  "planId": "r15-cli-acceptance",
  "requirements": ["R4-CP-2", "R4-CP-4", "R4-CP-5", "R4-CS-3", "R4-CS-4", "R4-CS-5", "R4-CS-6", "R4-QUAL-1", "R4-QUAL-2", "R4-EVID-1", "R4-EVID-2", "R4-EVID-3", "R4-EVID-4", "R4-CUR-6"],
  "sources": [
    {"id":"SRC-DEV","path":"skills/development-process/SKILL.md","locator":"## Harness Preflight (advisory at entry)","fact":"Entry contract."},
    {"id":"SRC-WRITE","path":"skills/writing-plans/SKILL.md","locator":"## Bite-Sized Task Granularity","fact":"Planning contract."},
    {"id":"SRC-SDD","path":"skills/subagent-driven-development/SKILL.md","locator":"## Evidence Capsule v1 Dispatch Contract","fact":"Slice execution contract."},
    {"id":"SRC-EXEC","path":"skills/executing-plans/SKILL.md","locator":"## The Process","fact":"Inline execution contract."},
    {"id":"SRC-REVIEW","path":"skills/requesting-code-review/SKILL.md","locator":"## Integration with Workflows","fact":"Review contract."},
    {"id":"SRC-QA","path":"skills/post-implementation-qa/SKILL.md","locator":"## Two Tracks","fact":"Final QA contract."},
    {"id":"SRC-R8","path":"tests/r8-sensor-gate-contract.test.mjs","locator":"interactive planning must retain static","fact":"Sensor regression assertions."},
    {"id":"SRC-R13","path":"tests/r13-role-evidence-capsule-contract.test.mjs","locator":"const CAPSULE_MARKER","fact":"Capsule isolation assertions."},
    {"id":"SRC-VALIDATE-WF","path":".github/workflows/validate.yml","locator":"node tests/r14-context-kernel-contract.test.mjs","fact":"Validation workflow ordering."},
    {"id":"SRC-TAG-WF","path":".github/workflows/auto-tag.yml","locator":"Verify registry before tagging","fact":"Release-producing gate."},
    {"id":"SRC-REGISTRY","path":"awm-registry.json","locator":"minCliVersion","fact":"CLI compatibility declaration."},
    {"id":"SRC-BUNDLE","path":"bundles/dev/bundle.json","locator":"\"version\"","fact":"Dev bundle version."}
  ],
  "commands": [
    {"id":"CMD-R15-CONTRACT","program":"git","args":["--version"],"covers":["R4-CP-2","R4-CP-4","R4-CP-5","R4-CS-3","R4-CS-4","R4-CS-5","R4-CS-6","R4-QUAL-1","R4-QUAL-2","R4-EVID-1","R4-EVID-2","R4-EVID-3","R4-EVID-4","R4-CUR-6"]},
    {"id":"CMD-R15-CLI","program":"git","args":["--version"],"covers":["R4-EVID-4"]},
    {"id":"CMD-R8","program":"git","args":["--version"],"covers":["R4-QUAL-1","R4-CUR-6"]},
    {"id":"CMD-R5","program":"git","args":["--version"],"covers":["R4-CS-6","R4-QUAL-1"]},
    {"id":"CMD-R12","program":"git","args":["--version"],"covers":["R4-QUAL-2","R4-EVID-1"]},
    {"id":"CMD-R13","program":"git","args":["--version"],"covers":["R4-CS-3","R4-CS-4","R4-QUAL-1"]},
    {"id":"CMD-R14","program":"git","args":["--version"],"covers":["R4-CS-3","R4-QUAL-2"]},
    {"id":"CMD-R14-CLI","program":"git","args":["--version"],"covers":["R4-CS-3","R4-QUAL-2"]},
    {"id":"CMD-PORTABILITY","program":"git","args":["--version"],"covers":["R4-QUAL-1","R4-QUAL-2"]},
    {"id":"CMD-RELEASE","program":"git","args":["--version"],"covers":["R4-QUAL-1","R4-CUR-6"]},
    {"id":"CMD-SKILL-VERSIONS","program":"git","args":["--version"],"covers":["R4-EVID-4"]},
    {"id":"CMD-PLAN-VALIDATE","program":"git","args":["--version"],"covers":["R4-CP-2","R4-CP-4","R4-CP-5"]},
    {"id":"CMD-PREFLIGHT","program":"git","args":["--version"],"covers":["R4-CUR-6"]},
    {"id":"CMD-DIFF-CHECK","program":"git","args":["--version"],"covers":["R4-QUAL-1"]}
  ],
  "slices": [
    {"id":"S1","title":"Author compact planning and strict handoff","requirements":["R4-CP-2","R4-CP-4","R4-CP-5","R4-CUR-6"],"dependsOn":[],"sectionAnchor":"slice-s1","sources":["SRC-DEV","SRC-WRITE","SRC-R8","SRC-VALIDATE-WF"],"redCommands":["CMD-R15-CONTRACT","CMD-R8"],"greenCommands":["CMD-R15-CONTRACT","CMD-R8","CMD-RELEASE","CMD-PREFLIGHT","CMD-PLAN-VALIDATE"],"reviewEvidence":["specification","code-quality"],"risk":"full-context","fallback":["Use full relevant context when a source is insufficient."]},
    {"id":"S2","title":"Execute and review complete slices","requirements":["R4-CS-3","R4-CS-4","R4-CS-5","R4-CS-6","R4-QUAL-1","R4-QUAL-2"],"dependsOn":["S1"],"sectionAnchor":"slice-s2","sources":["SRC-SDD","SRC-EXEC","SRC-REVIEW","SRC-QA","SRC-R13"],"redCommands":["CMD-R15-CONTRACT","CMD-R5","CMD-R13"],"greenCommands":["CMD-R15-CONTRACT","CMD-R5","CMD-R13","CMD-R14","CMD-R14-CLI","CMD-PORTABILITY","CMD-RELEASE","CMD-PREFLIGHT","CMD-DIFF-CHECK"],"reviewEvidence":["specification","code-quality"],"risk":"full-context","fallback":["Amend and revalidate invalid boundaries."]},
    {"id":"S3","title":"Certify compatibility evidence and release","requirements":["R4-EVID-1","R4-EVID-2","R4-EVID-3","R4-EVID-4"],"dependsOn":["S2"],"sectionAnchor":"slice-s3","sources":["SRC-TAG-WF","SRC-REGISTRY","SRC-BUNDLE"],"redCommands":["CMD-R15-CLI","CMD-RELEASE"],"greenCommands":["CMD-R15-CONTRACT","CMD-R15-CLI","CMD-R8","CMD-R5","CMD-R12","CMD-R13","CMD-R14","CMD-R14-CLI","CMD-PORTABILITY","CMD-RELEASE","CMD-SKILL-VERSIONS","CMD-PLAN-VALIDATE","CMD-PREFLIGHT","CMD-DIFF-CHECK"],"reviewEvidence":["specification","code-quality"],"risk":"full-context","fallback":["Stop when R4a provenance or release evidence is incomplete."]}
  ],
  "closureCommands": ["CMD-R15-CONTRACT","CMD-R15-CLI","CMD-R8","CMD-R5","CMD-R12","CMD-R13","CMD-R14","CMD-R14-CLI","CMD-PORTABILITY","CMD-RELEASE","CMD-SKILL-VERSIONS","CMD-PLAN-VALIDATE","CMD-PREFLIGHT","CMD-DIFF-CHECK"]
}
<!-- AWM:COMPACT-SLICES:END v1 -->

<a id="slice-s1"></a>
### Slice S1: Author compact planning and strict handoff
#### Surfaces
Portable acceptance surface.
#### Implementation
Validate before handoff.
#### Edge cases
Record exact evidence.
#### Evidence
Use inert Git version commands.
#### Fallback
Use full relevant context.

<a id="slice-s2"></a>
### Slice S2: Execute and review complete slices
#### Surfaces
Portable acceptance surface.
#### Implementation
Validate before handoff.
#### Edge cases
Record exact evidence.
#### Evidence
Use inert Git version commands.
#### Fallback
Use full relevant context.

<a id="slice-s3"></a>
### Slice S3: Certify compatibility evidence and release
#### Surfaces
Portable acceptance surface.
#### Implementation
Validate before handoff.
#### Edge cases
Record exact evidence.
#### Evidence
Use inert Git version commands.
#### Fallback
Use full relevant context.
