# Changelog

Newest entry on top; append new releases directly below this line.

## dev 2.2.1 — 2026-07-27

### Fixed
- `sensor-packs/js-ts/eslint.config.awm.mjs` no heredaba la configuración de ESLint del proyecto salvo que se llamara exactamente `eslint.config.mjs`, y se tragaba el fallo en un `catch {}` vacío. El efecto no era un sensor apagado sino uno que mentía: sin los `ignores` del proyecto, el sensor `lint` recorría `dist/`, `build/` y `coverage/` y devolvía cientos de hallazgos sobre código generado mientras el código fuente pasaba limpio (observado en `agent-vps-mobile`: 136 hallazgos, todos en `dist/`, cero en `src/`). Ahora se buscan los seis nombres que ESLint reconoce, en su mismo orden de resolución; si no hay ninguno se avisa por stderr (stdout es del JSON que el sensor parsea), y si hay uno que no carga o no exporta un flat config el sensor falla en vez de degradarse en silencio.

- `sensor-packs/js-ts/eslint.config.awm.mjs` aplicaba sus reglas base (`no-unused-vars`, `no-undef`) sin acotar `files`, así que iban al final del flat config y pisaban en TypeScript lo que el proyecto había desactivado a propósito: `no-undef` no ve los tipos ambientales (`NodeJS.Timeout`, el namespace `React`) y `no-unused-vars` marca los nombres de parámetro de una firma dentro de una interfaz. Eran los 47 hallazgos que quedaban en `agent-vps-mobile` tras arreglar la herencia, todos falsos. Las reglas base pasan a aplicarse solo a `**/*.{js,jsx,mjs,cjs}`; en TypeScript manda la configuración del proyecto y el sensor `typecheck`.

### Added
- `tests/sensor-pack-eslint.test.mjs`: primera cobertura ejecutable del template del pack `js-ts` — diez casos sobre fixtures reales, incluido uno que corre el template viejo y exige que falle. Añadido a `validate.yml` y al gate previo al tag en `auto-tag.yml`.

## dev 2.2.0 / product 1.3.0 / frontend 2.1.0 / authoring 1.1.0 — 2026-07-25

### Added — portabilidad de providers y recuperación de sesión en Codex
- `hooks/codex-session-start`: adapter SessionStart para Codex. Entrega la constitución del proyecto y re-ancla el plan activo y el ledger abierto en `startup`, `resume`, `clear` y `compact`, y escribe el `heartbeat.json` (`{hash, ts}`) del que `awm hooks status --agent codex` deriva su confianza. Es el artefacto que faltaba para que `awm init --agent codex` deje de revertirse.
- `scripts/validate-portability.mjs` + `tests/portability-allowlist.json` + `.github/workflows/validate.yml`: gate de portabilidad. Bloquea vocabulario acoplado a un provider en todo el markdown runtime (`skills/`, `agents/`, `references/`), forks por provider, symlinks usados como bypass, pérdida de fases del lifecycle y divergencias entre `catalog.json` y los `bundle.json`.
- `tests/validate-portability.test.mjs`: self-test del gate por mutación (15 casos) — un gate sin test puede dejar de fallar en silencio.
- `tests/session-start.test.mjs`: primera cobertura ejecutable del hook de Claude Code, incluyendo la invariante de paridad entre ambos hooks.

### Changed — contenido neutral al provider (un solo cuerpo por skill)
- Spine de ejecución (`development-process`, `executing-plans`, `subagent-driven-development` y sus prompts, `dispatching-parallel-agents`, `writing-plans`) y el resto del runtime: las instrucciones ahora nombran **capacidades** (`create or update the task plan`, `dispatch a subagent`, `native skill-loading mechanism`), no herramientas de un provider (`TodoWrite`, `Task tool`, `Skill tool`, `Write tool`, prefijos `superpowers:`).
- Descubrimiento de skills: `development-process`, `product-process`, `ui-design` y `ui-ux-pro-max` buscan en `$HOME/.agents/skills` → `.agents/skills` → `$HOME/.claude/skills` → `.claude/skills`, sumando el root global compartido de OpenCode/Codex sin perder los de Claude.
- `project-constitution`: documenta los tres canales de entrega de `CONSTITUTION.md` (hook `SessionStart` en Claude Code, `opencode.json` `instructions[]` en OpenCode, bloque gestionado por AWM en `AGENTS.md` en Codex).
- `references/gemini-tools.md` y `references/copilot-tools.md`: la columna izquierda pasa de nombres de herramientas de Claude a capacidades AWM, igual que `codex-tools.md`.

### Fixed
- `hooks/session-start` (Claude Code) descartaba **todos** los planes en cualquier repo cuya ruta absoluta contuviera `design`, porque filtraba `*design*` sobre la ruta completa en vez del sufijo `-design.md` del basename; también trataba como terminado cualquier plan cuyos propios pasos mencionaran el marcador `awm-*-complete`. Ambos hooks ahora aplican la misma regla y re-anclan en el mismo plan.
- `.github/workflows/auto-tag.yml` verifica el registry antes de cortar el tag: como workflow separado, `validate.yml` no podía bloquearlo, así que un gate rojo igual publicaba una versión entregable por `awm update`.

## dev 2.1.0 / product 1.2.0 — 2026-07-23

### Added — exportabilidad a claude.ai (`awm export --target claude-ai`)
- `product-discovery` 1.1.0, `product-brief` 1.1.0 (bundle `product`) y `mermaid-diagrams` 1.1.0 (bundle `dev`) marcadas `portable: true`: ahora se exportan como custom skills subibles a claude.ai vía el comando `awm export` (agentic-workflow#9/#11).
- `skills/product-brief/port.claude-ai.md`: override self-contained para `product-brief` — el SKILL.md canónico defiere el contrato del brief a `skills/readiness-gate/references/brief-contract.md`, un archivo que no viaja en el export; el override reproduce el contrato inline para que el port funcione standalone en claude.ai. `product-discovery` y `mermaid-diagrams` no necesitan override (son self-contained por transform mecánico).

### Removed
- `docs/ports/` (ports manuales `brief-spec.claude-ai.md` y `mermaid-diagrams.claude-ai.md`): reemplazados por el flujo automatizado de `awm export`. `docs/environment-ports.md` reescrito para documentar el comando en vez del pegado manual. El contenido de `brief-spec.claude-ai.md` se migró a `skills/product-brief/port.claude-ai.md`.

Diseño: docs/plans/2026-07-23-portable-product-skills-design.md (relacionado agentic-workflow#9).

## dev 2.0.0 / product 1.1.0 — 2026-07-23

### Added — bundle `dev`
- `mermaid-diagrams` 1.0.0 (on-signal): Mermaid diagram guide, native in the registry (adapted from a personal skill; claude.ai port in `docs/ports/`).

### Changed — bundle `dev`
- `brainstorming` 1.3.0: passive "Specialist Skills Awareness" replaced by a mandatory Specialist Gate — evaluate each domain explicitly, invoke or state "not applicable"; silence is not a valid outcome. The gate's three verdicts must now be stated visibly in the message that presents approaches — an evaluation that only happens in the agent's head is indistinguishable from the gate never running.
- `architecture-advisor`, `technology-evaluator`, `nfr-checklist-generator` (1.0.0→1.0.1, fix): dead Phase 5/6 delegation to `docs-assistant`/`docs-brainstorming`/`docs-system-orchestrator`/`c4-architecture` removed — artifacts are now delivered directly; advisor's diagram path points to `mermaid-diagrams`.
- `using-awm` (1.2.0→1.2.1, fix): dropped "CI" from the Specialized-tier advisory list and removed "configuring a pipeline" as a trigger example — both promised a capability that no longer exists after `cicd-proposal-builder`'s retirement.

### Removed — bundle `dev` (BREAKING)
- `cicd-proposal-builder`: retired. No real consumer (its only wiring was the passive specialist table that never fired) and no natural trigger in feature design. If pipeline design becomes a real need, a new skill will be designed with a real trigger (likely project setup, not brainstorming). Bundle bump is major (1.6.0→2.0.0) per this repo's semver convention (ruptura de contrato → major) — a capability leaving the bundle is a contract change regardless of whether any project was actually consuming it.

### Changed — bundle `product` 1.1.0
- `architecture-assessment` 1.1.0: advisor invocation hardened into an explicit gate (invoke or state "not applicable" in the report); the gate also declares "not applicable" when `architecture-advisor` isn't installed (product-only installs lack the `dev` bundle).
- `architecture-extraction` (1.0.0→1.0.1, fix): diagram layer 1 now points to the registry `mermaid-diagrams` skill (inline fallbacks preserved).

Design: docs/plans/2026-07-23-architecture-flow-cleanup-design.md (issue #6, Parte 1 reformulada).

## product 1.0.0 / dev 1.6.0 — 2026-07-22

### Added — bundle `product` (new)
- `product-process`: business-layer orchestrator (5 routes: discovery, brief, assessment, extraction, re-ingestion).
- `product-discovery`: problem framing + JTBD, problem-space only.
- `product-brief`: brief-spec methodology adopted into AWM; portable brief with frontmatter contract.
- `architecture-assessment`: scenario-based lightweight ATAM.
- `architecture-extraction`: arc42-lite + C4, optional Graphify layer with silent manual fallback.
- `readiness-gate`: G1–G9 Definition-of-Ready; seal is informative, gate is the authority.

### Changed — bundle `dev` 1.6.0
- `brainstorming` 1.2.0: Brief Preload Mode + solution-space precedence.
- `development-process` 1.3.0: brief-ready entry state + business-gap return rule.
- `using-awm` 1.2.0: two-orchestrator boundary, precedence and anti-loss rules.

Design: docs/plans/2026-07-22-product-layer-design.md (issue #6, Partes 2+3).
