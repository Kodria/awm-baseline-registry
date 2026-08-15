# Changelog

Newest entry on top; append new releases directly below this line.

## dev 3.0.0 — 2026-08-15

### Changed
- Published the breaking R3 compatible sensor-pack contract: first-party `pack.json` files use v2 variant and compatibility metadata while the nested coverage catalog remains schema v1. The registry now requires the released `agentic-workflow-manager` `8.1.0`, the first published CLI able to consume, probe, and report that contract.
- Existing projects with legacy packs or manifests remain explicitly degraded/unverified until `awm sensors init` performs the supported migration; unknown schema versions fail loudly instead of being reinterpreted.
- `harness-retro` runs the read-only empirical coverage analysis once after QA and before ledger archival. Compatibility outcomes remain distinct from certification so unsupported or future tool versions cannot become false greens.

### Nota de versión
Bundle `dev` 2.10.0 → 3.0.0 (major): the public R3 sensor-pack contract is breaking. The release PR must use a conventional breaking title so auto-tag advances registry `v1.16.1` to `v2.0.0`.

## dev 2.10.0 — 2026-08-11

### Added
- Contrato `coverage.schemaVersion: 1` para los cuatro sensor packs (`generic`, `js-ts`, `python`, `shell`): clases genéricas, detectores literales y remedios read-only consumidos por `awm sensors coverage`. Los gates ejecutables de coverage y mutaciones validan la forma del catálogo, referencias a sensores, comandos, paths y markers de evidencia, además del desacoplamiento de proyectos concretos.

### Nota de versión
Bundle `dev` 2.9.0 → 2.10.0 (minor): contrato aditivo de metadata de coverage y gates de release. No se modifica ninguna skill ni su frontmatter.

## dev 2.8.0 — 2026-08-07

### Added
- `sensor-packs/python/pack.json` (+ `.semgrep.awm.yml`): nuevo pack para proyectos Python — `typecheck` (mypy, whole-program, sin `changedCmd`), `lint` (ruff `--output-format json`, acotable por `--changed`), `security` (semgrep, reglas genéricas: eval/exec dinámico, `subprocess(..., shell=True)` con comando no-literal, construcción de SQL por interpolación de string, deserialización insegura con `pickle`/`yaml.load`, secretos hardcodeados), `test` (pytest, sensor por exit-code), `mutation` deshabilitado (placeholder `mutmut run`).
- `sensor-packs/shell/pack.json` (+ `.semgrep.awm.yml`): nuevo pack para scripts bash/sh — `lint` (shellcheck `--format json`), `security` (semgrep: `eval` sobre variable, `curl|sh`/`wget|sh`, sustitución de comando sin comillas en posición peligrosa, secretos hardcodeados).
- `tests/sensor-pack-shape.test.mjs`: primera validación estructural de `pack.json` en todo el repo (JSON válido, campos requeridos, `{files}` presente en `changedCmd`, `configFile`/`configFileFallback` apuntan a un archivo existente) — corre sobre los 4 packs (`generic`, `js-ts`, `python`, `shell`). Añadido a `validate.yml` y al gate previo al tag en `auto-tag.yml`.

### Nota sobre `formatter`
El campo `sensors.<name>.formatter` de estos dos packs describe la herramienta real (`mypy`, `ruff`, `shellcheck`) — pero el CLI (`agentic-workflow`, `cli/src/commands/sensors/run.ts`) todavía despacha el parser de salida por **nombre de sensor** (`typecheck`→parser de tsc, `lint`→parser de eslint), no por este campo. Hasta que el CLI consuma `formatter` (tracked como Task 3.3 del plan de team-rollout-hardening), la salida JSON de ruff/shellcheck se parseará con el formatter de ESLint — incorrecto, pero no peor que el estado anterior (sin pack Python en absoluto). El campo ya dice la verdad; el consumidor todavía no la lee.

### Fixed
- `.gitignore`: la regla `*.awm.*` (agregada sin comentario en el commit inicial del repo) coincide con el propio nombre de archivo que todo sensor-pack usa para sus configs (`<tool>.awm.<ext>` — `.semgrep.awm.yml`, `eslint.config.awm.mjs`, `.dep-cruiser.awm.js`, `tsconfig.awm.json`). Los packs `js-ts`/`generic` ya estaban trackeados desde antes de esa regla (o vía `git add -f`), así que nunca se notó — pero un archivo *nuevo* de ese patrón queda invisible para `git status`/`git add` sin ningún aviso: exactamente lo que pasó al escribir `sensor-packs/python/.semgrep.awm.yml` y `sensor-packs/shell/.semgrep.awm.yml` en esta sesión (silenciosamente no trackeados hasta revisar `git diff --cached --stat` contra lo esperado). `.awm` (el directorio de estado en runtime, primera línea) ya cubre lo que esa regla parece haber querido ignorar; se elimina la línea `*.awm.*`.
- `scripts/check-skill-version-bumps.sh`: usaba diff de 3 puntos (`origin/main...HEAD`, contra el merge-base) para detectar `SKILL.md` cambiados sin bump de versión. En una rama de larga vida que se mergea a `main` más de una vez sin nunca rebasear (el patrón multi-release de este repo: R1, R2, R3... todos desde la misma rama), el merge-base queda fijo en el fork original, mucho antes de que merges posteriores avanzaran `main` — así que el chequeo re-reportaba como "cambiado sin bump" archivos `SKILL.md` ya mergeados y ya idénticos a `main`. Cambiado a diff de 2 puntos (`origin/main HEAD`, tip-a-tip), que responde la pregunta real ("¿este archivo difiere de `main` ahora mismo?") y coincide con el comportamiento de 3 puntos en el caso normal de una rama recién bifurcada.

### Nota de versión
Bundle `dev` 2.7.0 → 2.8.0 (minor): capacidad aditiva (packs Python y Shell), sin ruptura de contrato. `sensor-packs/` no vive dentro de ningún `source` de bundle en `catalog.json` — es contenido de registry top-level, entregado por el tag del repo (`auto-tag.yml`) independientemente de versión de bundle — el bump aquí sigue la convención de este CHANGELOG de versionar `dev` ante cualquier cambio de contenido notable (ver `dev 2.2.1`, fix de `sensor-packs/js-ts` sin cambios de skills).

## dev 2.7.0 — 2026-08-07

### Added
- `skills/finishing-a-development-branch/SKILL.md` (1.2.0→1.3.0) y `skills/receiving-code-review/SKILL.md` (1.0.0→1.1.0): creación de PR/MR y respuesta a comentarios de revisión inline ahora son host-agnósticas. Ambos skills detectan el host desde el remote `origin` (Step 3.5 en `finishing-a-development-branch`; el mismo check en `receiving-code-review`) y usan `gh pr create` / `gh api .../replies` en GitHub, `glab mr create` / `glab` en GitLab (con la guía hedged en vez de un flag no verificado, porque las superficies de CLI cambian con el tiempo), o degradan honestamente cuando el host no se reconoce o su CLI no está instalada: el push (o la respuesta) igual se completa y el operador recibe instrucciones concretas para terminar a mano, sin que el skill lo trate como un fallo. Antes, ambos skills asumían GitHub/`gh` sin condición — un proyecto en GitLab, o sin `gh`/`glab` instalado, no tenía un camino documentado.

### Fixed
- `skills/finishing-a-development-branch/SKILL.md`: la rama `HOST=github` de la Opción 2 asumía que `gh` siempre estaba presente y no tenía el mismo resguardo que la rama `HOST=gitlab` (que sí contemplaba `glab` ausente). Ahora, si `gh` no está instalado o no está en el PATH, reusa el mismo camino degradado que ya cubre host desconocido/CLI ausente — en vez de fallar en silencio o asumir `gh` sin verificarlo.

### Nota de versión
Bundle `dev` 2.6.0 → 2.7.0 (minor): capacidad aditiva (host-agnóstico en PR/MR), sin ruptura de contrato.

## dev 2.3.0 — 2026-08-02

### Added
- `skills/subagent-driven-development/SKILL.md`: nueva sección opt-in "Modo journal-first (continuidad durable)" — cuando el proyecto tiene el journal AWM R1 inicializado (`awm watch --init`), el controlador opera anclado al journal (`awm job reconcile`/`register`/`controller-heartbeat`/`request`/`gate`) en vez de a la memoria conversacional. Sin journal inicializado, el skill se comporta exactamente igual que antes — no rompe ningún flujo existente.

## dev 2.2.1 — 2026-07-27

### Fixed
- `sensor-packs/js-ts/eslint.config.awm.mjs` no heredaba la configuración de ESLint del proyecto salvo que se llamara exactamente `eslint.config.mjs`, y se tragaba el fallo en un `catch {}` vacío. El efecto no era un sensor apagado sino uno que mentía: sin los `ignores` del proyecto, el sensor `lint` recorría `dist/`, `build/` y `coverage/` y devolvía cientos de hallazgos sobre código generado mientras el código fuente pasaba limpio (observado en `agent-vps-mobile`: 136 hallazgos, todos en `dist/`, cero en `src/`). Ahora se importan los tres nombres que Node puede cargar (`.js`, `.mjs`, `.cjs`), en el orden de resolución de ESLint. Cuando no hay ninguno — o cuando la configuración está en TypeScript, que ESLint carga con jiti y un `import()` de Node no puede — el sensor degrada con `ignores` conservadores en vez de recorrer lo generado. Solo se lanza ante una configuración que el propio `eslint` del proyecto tampoco podría cargar.

- `sensor-packs/js-ts/eslint.config.awm.mjs` aplicaba `no-unused-vars` y `no-undef` sin acotar `files`, así que iban al final del flat config y pisaban en TypeScript lo que el proyecto había desactivado a propósito: `no-undef` no ve los tipos ambientales (`NodeJS.Timeout`, el namespace `React`) y `no-unused-vars` marca los nombres de parámetro de una firma dentro de una interfaz. Eran los 47 hallazgos que quedaban en `agent-vps-mobile` tras arreglar la herencia, todos falsos. Esas dos pasan a `**/*.{js,jsx,mjs,cjs}`; `no-unreachable` se mantiene en todos los lenguajes, porque ahí no tiene falsos positivos.

- `sensor-packs/js-ts/eslint.config.awm.mjs` se ignora a sí mismo. Lo genera AWM, no el proyecto: un hallazgo sobre él es ruido que su autor no puede accionar desde su repo.

### Added
- `tests/sensor-pack-eslint.test.mjs`: primera cobertura ejecutable del template del pack `js-ts` — trece casos sobre fixtures reales (repo estándar ESM, repo estándar CommonJS, configuración en TypeScript, sin configuración, configuración rota), incluido uno que corre el template viejo y exige que falle. Añadido a `validate.yml` y al gate previo al tag en `auto-tag.yml`.

### Nota para quien toque este template
Su consumidor no es una persona sino `cli/src/commands/sensors/run.js`, y eso restringe cómo puede fallar. **No escribas en stderr:** cuando ESLint sale con código != 0 —el caso normal cuando hay hallazgos— el runner concatena `stdout + stderr` y hace `JSON.parse` del resultado; un aviso de una línea rompe el parseo, el formateador devuelve `[]`, y un repo con errores reales se reporta con cero. **Un `throw` no pone el sensor en rojo:** produce `status: "skipped"`, que no rompe el `overall` mientras otro sensor pase. Ambas invariantes están fijadas en los casos 6 a 9 del test.

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
