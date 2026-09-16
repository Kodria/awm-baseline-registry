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
