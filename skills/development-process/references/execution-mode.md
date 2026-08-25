# Execution Mode

Read `**Modo de ejecución:**` from the active plan. Missing, `interactivo`, or invalid values are interactive (report invalid values); `desatendido` is unattended.

Pre-plan phases (`brainstorming`, `ui-design`, `writing-plans`) are always interactive because planning is the final human boundary. In interactive mode, require explicit approval. In unattended post-plan states, announce and route directly; gates remain mandatory. For unattended Executing, invoke only `subagent-driven-development`, never `executing-plans`.
