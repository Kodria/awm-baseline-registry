# Compact v2 reference
**Modo de ejecución:** interactivo
**Modo de despacho:** awm-routed
<!-- AWM:COMPACT-SLICES:START v2 -->
{"schema":"compact-slices/v2","planId":"reference-v2","requirements":["R2B-B1","R2B-B2","R2B-B3"],"sources":[{"id":"SRC","path":"skills/writing-plans/references/compact-slices-v2.md","locator":"# Compact Slices v2","fact":"Profiles are semantic."}],"commands":[{"id":"CMD","program":"npm","args":["run","test:r2b"],"covers":["R2B-B1","R2B-B2","R2B-B3"]}],"slices":[{"id":"S1","title":"Mechanical","requirements":["R2B-B1"],"dependsOn":[],"sectionAnchor":"s1","sources":["SRC"],"redCommands":["CMD"],"greenCommands":["CMD"],"reviewEvidence":["specification","code-quality"],"risk":"bounded","fallback":["public-contract"],"implementerProfile":"mechanical"},{"id":"S2","title":"Integration","requirements":["R2B-B2"],"dependsOn":["S1"],"sectionAnchor":"s2","sources":["SRC"],"redCommands":["CMD"],"greenCommands":["CMD"],"reviewEvidence":["specification","code-quality"],"risk":"bounded","fallback":["public-contract"],"implementerProfile":"integration"},{"id":"S3","title":"Judgment","requirements":["R2B-B3"],"dependsOn":["S2"],"sectionAnchor":"s3","sources":["SRC"],"redCommands":["CMD"],"greenCommands":["CMD"],"reviewEvidence":["specification","code-quality"],"risk":"full-context","fallback":["public-contract"],"implementerProfile":"judgment"}],"closureCommands":["CMD"]}
<!-- AWM:COMPACT-SLICES:END v2 -->
<a id="s1"></a>
### Slice S1: Mechanical
#### Surfaces
Own R2B-B1 in the semantic compact v2 producer reference and consumer contract.
#### Implementation
Run CMD, observe a focused RED mutation, then restore the semantic profile rule.
#### Edge cases
Concrete models, vendors, and unknown profiles block rather than changing the plan contract.
#### Evidence
CMD executes the structural contract with distinct current specification and quality review evidence.
#### Fallback
Use the public contract when a fact is insufficient; do not delegate discovery.

<a id="s2"></a>
### Slice S2: Integration
#### Surfaces
Own R2B-B2 in the CLI consumer handoff after the mechanical producer contract.
#### Implementation
Run CMD against the exact CLI contract and preserve zero-dispatch when routing is blocked.
#### Edge cases
Missing policy readiness remains visible and does not permit a concrete-model workaround.
#### Evidence
CMD covers the routed consumer contract and distinct current review evidence.
#### Fallback
Use the public contract when routing inputs are unavailable.

<a id="s3"></a>
### Slice S3: Judgment
#### Surfaces
Own R2B-B3 release-bound acceptance without changing delivery metadata in this slice.
#### Implementation
Run CMD after the dependency-ready slices and retain the approved CLI authority.
#### Edge cases
Unverified routing or custody blocks execution and never weakens review or QA.
#### Evidence
CMD preserves serial ownership and the required distinct review evidence.
#### Fallback
Use the public contract and expand context for a public or custody decision.
