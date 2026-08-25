# operations context cards

Selective context retained from the reviewed legacy corpus.

<!-- awm-context:CTX-CONSTITUTION-MD-006 -->
<!-- source: CONSTITUTION.md:11-11 sha256:5590d43ce5555af2dd5daa697c96d6a0be6ff0c90efec6471bd0bea2a727187a -->


<!-- awm-context:CTX-CONSTITUTION-MD-011 -->
<!-- source: CONSTITUTION.md:23-23 sha256:5ef6d2a2fd3b3d8704fa25c2428fbf336130f8f0bf2b38d22a78c731a3ac5698 -->


<!-- awm-context:CTX-CONSTITUTION-MD-016 -->
<!-- source: CONSTITUTION.md:33-33 sha256:c78aff588908bb6e4dc1c2da0437f82f5014d187508bfb18bfb9b0737948169a -->


<!-- awm-context:CTX-CONSTITUTION-MD-021 -->
<!-- source: CONSTITUTION.md:43-43 sha256:55ef6b8064f16ed88401bbec358126f24398c0e07135e3b415eb419945426774 -->


<!-- awm-context:CTX-CONSTITUTION-MD-026 -->
<!-- source: CONSTITUTION.md:53-59 sha256:3b11210f77c652f865ba8db50bdee71d6ea0d3a854300ecb378ae25037a71dbf -->


<!-- awm-context:CTX-CONSTITUTION-MD-031 -->
<!-- source: CONSTITUTION.md:76-76 sha256:033406459dfe1332df41dc6ad336ff04e4adf7585b14541f94cf5f3be36f957b -->


<!-- awm-context:CTX-CONSTITUTION-MD-036 -->
<!-- source: CONSTITUTION.md:86-86 sha256:3c212f8ed213ac0d9dab0d84467ac47dff9b161c9050d52a84dcd96858986f96 -->


<!-- awm-context:CTX-CONSTITUTION-MD-041 -->
<!-- source: CONSTITUTION.md:96-96 sha256:1e7ade3bb4dc8e18c577937a3e7143dd64c740d82e600128872e9caa76410177 -->


<!-- awm-context:CTX-CONSTITUTION-MD-046 -->
<!-- source: CONSTITUTION.md:106-106 sha256:d83b121989aeda1f6f1740e53ddc6ea4bc22588f479e916a7ad7da09b7542806 -->


<!-- awm-context:CTX-CLAUDE-MD-001 -->
<!-- source: CLAUDE.md:1-1 sha256:7f89984b43d6b94538138cc0aef1c74123a8bd0322042ff3fd08badae871ce24 -->
# AWM Repository Principles

This document codifies architectural and design principles for the Agentic Workflow Manager (AWM) repository to ensure consistency and prevent future design drift.

## `~/.awm` es territorio del instalador — NUNCA tocarlo

`~/.awm` (incluyendo `~/.awm/registries/`, hooks, config) se gestiona **exclusivamente** vía `awm init` y `awm update`. Desde una sesión de desarrollo en este repo está **prohibido** escribir, editar, borrar o "arreglar" cualquier cosa bajo `~/.awm`.

**Este repo solo desarrolla el CLI.** El contenido (skills, bundles, sensor-packs, hooks) ya **no** vive aquí — se edita en los repos de contenido externos:

- [`awm-baseline-registry`](https://github.com/Kodria/awm-baseline-registry) — registry base sembrado por defecto en `awm init`
- [`awm-documentation-registry`](https://github.com/Kodria/awm-documentation-registry) — registry de documentación, opt-in

**El flujo correcto para contenido:** editar en el repo de registry correspondiente → commit → tag `vX.Y.Z` → `awm update` en las máquinas que usen ese registry. Los skills instalados en `~/.claude/skills/` son symlinks hacia `~/.awm/registries/<name>/skills/`, así que reflejan el registry instalado, no el working copy — la latencia entre editar el registry y verlo instalado es esperada y correcta; no se "atajea" editando la instalación.

**El flujo correcto para el CLI:** todo cambio de CLI se hace en `cli/` → se commitea → se mergea a `main`. El publish a npm es **automático**: `.github/workflows/release.yml` corre en cada push a `main`, buildea `cli/` y ejecuta `cli/src/release/index.js` (bump de versión por conventional commits + `npm publish` vía OIDC Trusted Publisher, con `[skip ci]` en el commit de bump para no re-dispararse). **No se corre `npm publish` a mano, ni se crea un workflow paralelo de publish.** El gate son los tests en **las tres plataformas** (`ubuntu-latest`, `windows-latest`, `macos-latest`): el job `release` declara `needs: test`, así que rojo en cualquiera de ellas no publica — ver [`docs/decisions.md`](docs/decisions.md) D-005. El nivel de release sale del prefijo de conventional commit del merge (`feat`→minor, `fix`→patch, `!`/`BREAKING`→major). Los usuarios reciben la nueva versión con `npm i -g agentic-workflow-manager`.

**Tests:** ningún test puede tocar el `~/.awm` real. Todos usan tmpdirs aislados con `process.env.HOME` y `process.env.AWM_HOME` sobreescritos (patrón de `cli/tests/commands/hooks/install.test.ts`).

## Sensores y packs — frontera genérico/específico

Los sensor-packs de AWM (en `awm-baseline-registry`) envían solo reglas **genéricas y agnósticas a clases de problema** (eval, secrets, SQL injection, validación de entradas). NO se hornean reglas nacidas de un bug puntual de un proyecto. Las reglas **específicas** las crece `harness-retro` **dentro del proyecto**, sobre los config files copiados (`.semgrep.awm.yml`, `eslint.config.awm.mjs`, `tests/structural/`). El framework nunca enumera bugs puntuales.

**Razonamiento:** Los packs de AWM están diseñados para ser agnósticos a clases de problema, reutilizables entre equipos e independientes de contexto corporativo. Cuando un proyecto tiene un bug singular (ej: `splitBill → Infinity` por división por cero en un caso edge), la regla que lo detenta es un **conocimiento específico del proyecto**. Hornear esa regla en el sensor-pack de AWM convierte un hallazgo local en una obligación global — violando el principio de que AWM es un portador de convenciones, no de bugs corporativos.

**El flujo correcto:**

1. Un `harness-retro` corre en el proyecto, marca el bug como "encontrado varias veces ≥2" (ver [Harness Shakedown Findings — Insight Central](docs/harness-shakedown/findings.md#-insight-central--la-distinción-alcance-vs-seguridad-falta-en-el-modelo-de-calidad)).
2. El equipo crea una **regla específica del proyecto** en `.semgrep.awm.yml` o `eslint.config.awm.mjs`.
3. Esa regla vive en el repositorio del proyecto, es versionada con su código, y se comparte vía contexto del proyecto (no vía AWM registry).
4. Si el patrón es **universalmente evitable** (ej: "nunca usar `eval`"), pertenece al sensor-pack genérico de AWM.

**Referencias relacionadas:**
- [Harness Shakedown Lab — Findings](docs/harness-shakedown/findings.md) — evidencia del lab que motivó esta doctrina.
- [Harness Shakedown Lab — Runbook](docs/harness-shakedown/runbook.md) — guía para repro y QA del gateo determinístico.


<!-- awm-context:CTX-CLAUDE-MD-002 -->
<!-- source: CLAUDE.md:3-3 sha256:03414f9cf8a6fd9f9138e2b58e82a98b00deba561871237f56f5747441442be6 -->


<!-- awm-context:CTX-CLAUDE-MD-003 -->
<!-- source: CLAUDE.md:5-5 sha256:3bcf4bdc599f69e09cd0bc66b15a801d071f472eb61800e97b7d372aacc5a586 -->


<!-- awm-context:CTX-CLAUDE-MD-004 -->
<!-- source: CLAUDE.md:7-7 sha256:1c8b8b951cb6dbab2980dc3f6968e5afee4996c04ae7187b69ef892c1b908f72 -->


<!-- awm-context:CTX-CLAUDE-MD-005 -->
<!-- source: CLAUDE.md:9-9 sha256:26315c757756c6f0c18e48756f3b93943700614ddd663b2313a539edd8e311c3 -->


<!-- awm-context:CTX-CLAUDE-MD-006 -->
<!-- source: CLAUDE.md:11-12 sha256:ab1fc82eccade8db1657a5346959423eb36b3ab3ff2892f95e1c81769dd309a2 -->


<!-- awm-context:CTX-CLAUDE-MD-007 -->
<!-- source: CLAUDE.md:14-14 sha256:b6af34f681723abf435368251e584e490102cfb528fbfb50e55699d93c5c7578 -->


<!-- awm-context:CTX-CLAUDE-MD-008 -->
<!-- source: CLAUDE.md:16-16 sha256:f3565eff614735b0465041c9b685e2e95c72ff2f03dee80863b366d8bc978448 -->


<!-- awm-context:CTX-CLAUDE-MD-009 -->
<!-- source: CLAUDE.md:18-18 sha256:b2cec69e972f6265ea9df0a6a8f34180a915bcdc485f04ee9e31bf1a57a0fce5 -->


<!-- awm-context:CTX-CLAUDE-MD-010 -->
<!-- source: CLAUDE.md:20-20 sha256:5c0dd14aaee5b2ece7be3b2593c29aa32eb993c10869cd23f8f54bfb0b7d51f5 -->


<!-- awm-context:CTX-CLAUDE-MD-011 -->
<!-- source: CLAUDE.md:22-22 sha256:e524a40a4d179a95b9887fbe15d682ef99ce4bffe00c227ef8397786e1600d6a -->


<!-- awm-context:CTX-CLAUDE-MD-012 -->
<!-- source: CLAUDE.md:24-24 sha256:cf50d8a3896fdc6036080ffa3260de1237eb3365f269b8137432ad6987f14d02 -->


<!-- awm-context:CTX-CLAUDE-MD-013 -->
<!-- source: CLAUDE.md:26-26 sha256:18af12f9dc68d76b9f8e7a355d5cc8e716ec9ed4fb88fcd8aea91d701e16a022 -->


<!-- awm-context:CTX-CLAUDE-MD-014 -->
<!-- source: CLAUDE.md:28-31 sha256:402c0d5dfb374d83933bdd9286692c1580177aba6d351d14ed49dbdede97cd4a -->


<!-- awm-context:CTX-CLAUDE-MD-015 -->
<!-- source: CLAUDE.md:33-35 sha256:d99dab535bb2d5098149b828f08c0c8d68593ae6392869fcfa7b26dd32cef1e7 -->
