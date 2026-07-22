# Capa de Producto (product-process) — Design Doc

**Fecha:** 2026-07-22 · **Issue:** [awm-baseline-registry#6](https://github.com/Kodria/awm-baseline-registry/issues/6) (Partes 2+3, reformuladas) · **Estado:** aprobado en brainstorming

La capa de negocio de AWM: madura ideas (producto + arquitectura) antes de que entren al motor de desarrollo. Cuatro modos de entrada + re-ingesta de briefs existentes, un gate explícito de readiness, y un handoff formal hacia `development-process` vía un brief portable y autodescriptivo.

Fuera de alcance de este ciclo: desacople de registries (Parte 1 del issue), presentación HTML (Parte 4), soporte Hermes (Parte 5).

## Requirements

### Orquestador y ruteo

- **R1** — WHEN una sesión recibe una idea/necesidad sin requerimiento formado, una solicitud de evaluación de arquitectura, una de extracción de arquitectura, o un brief existente, THE `product-process` SHALL ser el orquestador de entrada (no `development-process`).
- **R1.1** — IF la señal de entrada es ambigua entre madurar la idea y construir, THEN THE orquestador SHALL preguntar al usuario en vez de adivinar el modo.
- **R2** — THE `product-process` SHALL rutear a exactamente uno de cinco caminos: `product-discovery` (idea cruda), `product-brief` (idea madura), `architecture-assessment` (diagnóstico), `architecture-extraction` (documentar lo existente), o re-ingesta (brief existente).
- **R2.1** — WHEN un modo desemboca naturalmente en otro (discovery→brief, extraction→assessment, extraction→brief), THE orquestador SHALL encadenarlos explícitamente, nunca en paralelo.
- **R3** — WHEN arranca, THE orquestador SHALL detectar el contexto de ejecución: repo con AWM (artefactos versionables en `docs/`) o standalone (artefacto entregado como archivo descargable).

### Agnosticismo de almacenamiento

- **R4** — THE capa SHALL entregar todo artefacto como archivo `.md` portable; WHERE la sesión está en un repo AWM, SHALL ofrecer adicionalmente guardarlo en el repo.
- **R4.1** — THE capa SHALL NOT bootstrapear repos, exigir plataforma de almacenamiento, ni asumir dónde vive el artefacto tras la entrega.

### Contrato del brief

- **R5** — THE brief SHALL ser un único `.md` con frontmatter YAML que incluya como mínimo: `awm: product-brief`, `schema` (entero), `title`, `mode`, `readiness`, `created`, `updated`, `open_decisions`, `project`.
- **R5.1** — THE cuerpo del brief SHALL seguir la metodología brief-spec: necesidad (N#), mandato de no-asunción con lista de lo NO verificado, procesos (PR-#), requisitos (RF-x.y/RNF-x.y) con redacción EARS-compatible, decisiones abiertas (DA-#) en tabla con columna "bloquea", fuera-de-alcance explícito, releases con valor independiente, riesgos.
- **R5.2** — THE sello `readiness` SHALL ser escrito exclusivamente por `readiness-gate`; las skills de modo no lo modifican.
- **R5.3** — THE informes de assessment y extracción SHALL usar el mismo frontmatter (con su `mode`) para ser recuperables por re-ingesta.

### Re-ingesta

- **R6** — WHEN el usuario aporta un brief por cualquier transporte (adjunto, MCP, pegado, archivo en repo), THE orquestador SHALL reconocerlo por el discriminador `awm: product-brief`, validar estructura (lint: frontmatter, secciones requeridas, IDs coherentes), mostrar su estado y ofrecer: continuar madurando o pasar a desarrollo.
- **R6.1** — IF el documento aportado carece de frontmatter válido, THEN THE orquestador SHALL ofrecer adoptarlo convirtiéndolo al contrato sin perder contenido.

### Readiness gate

- **R7** — THE `readiness-gate` SHALL evaluar el checklist G1–G9 (problema definido, usuarios, scope acotado con fuera-de-alcance, casuísticas enumeradas, restricciones, riesgos, requisitos trazables/testeables, DAs gestionadas sin bloquear el primer release, mandato de no-asunción íntegro) contra el contenido real del brief, nunca contra el sello.
- **R7.1** — IF algún criterio falla, THEN THE gate SHALL sellar `draft` y emitir la lista accionable de vacíos con evidencia; THE gate SHALL NOT ofrecer override.
- **R7.2** — WHEN un brief va a cruzar a desarrollo, THE gate SHALL re-ejecutarse aunque el sello diga `ready`; IF discrepa del sello, THEN THE cruce SHALL bloquearse mostrando la discrepancia.

### Handoff al motor

- **R8** — WHEN `brainstorming` arranca y detecta en contexto un brief con sello `ready` re-verificado, THE `brainstorming` SHALL entrar en modo precargado: mapear N#/casuísticas→contexto, RF/RNF→semilla de `## Requirements` (EARS), fuera-de-alcance→no-objetivos, DAs abiertas→primeras preguntas.
- **R8.1** — WHILE está en modo precargado, WHEN va a formular una pregunta, THE `brainstorming` SHALL verificar primero si el brief la responde; si la responde, SHALL registrar la respuesta como proveniente del brief (trazable por ID) y no preguntar.
- **R8.2** — THE modo precargado SHALL conservar intactos los gates de `brainstorming` (validación contra el repo real, aprobación de diseño, spec self-review); IF no hay brief presente, THEN THE comportamiento actual SHALL permanecer sin cambios.
- **R8.3** — WHERE el bundle `dev` no está instalado, THE handoff SHALL terminar en la entrega del `.md` sin error.

### Ruteo de nivel superior y anti-confusión

- **R9** — THE `using-awm` SHALL declarar ambos orquestadores con su tabla de frontera: idea sin requerimiento/assessment/extracción/brief-a-retomar → `product-process`; requerimiento concreto o brief `ready` → `development-process`; ambiguo → preguntar.
- **R9.1** — THE description de `brainstorming` SHALL declarar que explora espacio de solución y se invoca vía `development-process`; una idea sin brief y sin decisión de construir va primero a `product-process`.
- **R10** — THE sistema SHALL mantener un solo orquestador activo a la vez; `product-process` SHALL terminar en estado terminal explícito (entrega o invocación de `development-process`).
- **R10.1** — THE contexto entre orquestadores SHALL viajar únicamente en el brief (el artefacto es el baton); lo que no está en el brief no cruzó.
- **R10.2** — IF durante el desarrollo aparece un vacío de negocio, THEN THE `development-process` SHALL registrarlo como DA-# en el brief y ofrecer volver a `product-process`, nunca improvisar la respuesta.

### Dependencias y capas de acceso

- **R11** — THE `architecture-extraction` SHALL funcionar completa sin herramientas externas (capa manual: reconocimiento del repo por el agente, citando archivo:línea para lo verificado).
- **R11.1** — WHERE el CLI de Graphify está disponible o se instala trivialmente en el entorno, THE skill SHALL usarlo como capa determinística (tree-sitter → `graph.json`/`GRAPH_REPORT.md`; EXTRACTED→verificado, INFERRED→a confirmar); IF el install falla o tarda, THEN THE skill SHALL degradar a capa manual sin error y sin pedir instalación al usuario.
- **R11.2** — THE capa SHALL NOT introducir dependencias de servicios pagos, con auth obligatoria, o no instalables en entornos cloud sandboxeados.

### Auditoría y empaquetado

- **R12** — WHEN comience la implementación, THE primera tarea SHALL ser auditar las skills existentes candidatas a reuso (`architecture-advisor`, `technology-evaluator`, `nfr-checklist-generator`, `brief-spec` personal) y clasificar cada una: reusar / adaptar / descartar; ninguna skill nueva referencia una existente sin pasar ese filtro.
- **R13** — THE seis skills nuevas SHALL empaquetarse como bundle `product` v1.0.0 (scope `baseline`, sin dependencia dura de `dev`) en `awm-baseline-registry`, registrado en `catalog.json`.
- **R13.1** — THE ediciones a `brainstorming`, `development-process` y `using-awm` SHALL versionarse como bump minor del bundle `dev` (1.5.0 → 1.6.0).
- **R13.2** — THE skills nuevas SHALL seguir el formato del baseline: frontmatter con description activadora, fases estructuradas, cross-cutting rules y termination phase.

## Diseño

### Arquitectura general

```
                    CAPA DE NEGOCIO (nueva)
┌──────────────────────────────────────────────────────────┐
│                     product-process                      │
│  idea cruda      → product-discovery ────┐               │
│  idea madura     → product-brief ────────┤               │
│  diagnóstico     → architecture-assessment ─┤            │
│  extracción      → architecture-extraction ─┤            │
│  brief existente → re-ingesta (lint+estado) ┘            │
│                        │                                 │
│                  readiness-gate (draft|ready)            │
└────────────────────────┬─────────────────────────────────┘
                         │ BRIEF portable (.md autodescriptivo)
                         ▼
┌──────────────────────────────────────────────────────────┐
│              CAPA DE APLICACIÓN (existente)              │
│  development-process → brainstorming (precargado)        │
│  → writing-plans → ejecución → QA → finishing            │
└──────────────────────────────────────────────────────────┘
```

Principios: (1) agnóstica al almacenamiento; (2) el brief es la interfaz entre capas; (3) el gate es la autoridad, el sello es informativo; (4) los cuatro modos convergen al mismo tipo de artefacto; (5) el motor no se degrada — el brief precarga su brainstorming, no lo reemplaza.

### El orquestador `product-process`

Skill de ruteo con checklist (espejo de `development-process`). Paso 0: detección de contexto (repo AWM vs standalone) y de entrada (brief aportado → re-ingesta; si no, clasificación por señal conversacional, preguntando ante ambigüedad). Paso 1: ruteo a los modos. Paso 2: convergencia — todo camino que produce brief pasa por `readiness-gate`; entrega `.md` + estado del sello + oferta de siguiente paso. Paso 3: handoff — con gate `ready` y usuario eligiendo desarrollo, invoca `development-process`; con `draft`, muestra vacíos y ofrece volver al modo que corresponda.

### Skills de modo

| Skill | Metodología | Notas |
|-------|-------------|-------|
| `product-discovery` | Problem framing + JTBD; mecánica conversacional una-pregunta-a-la-vez a nivel negocio | Fases: problema → JTBD → casuísticas de negocio → restricciones → alternativas (incl. "no construir"). Disciplina: no propone soluciones técnicas. Encadena a `product-brief`. |
| `product-brief` | brief-spec adoptado como contenido AWM | No-asunción, lenguaje calibrado en certeza, IDs trazables, DAs en tabla, releases independientes, índice antes de redactar. Extendido con frontmatter contract + compatibilidad EARS. |
| `architecture-assessment` | ATAM aligerado (escenarios de calidad) | Drivers → escenarios concretos → análisis del sistema real → hallazgos con severidad → recomendaciones priorizadas. Reuso de `architecture-advisor` condicionado a auditoría (R12). Output: informe; si deriva en trabajo → semilla de brief. |
| `architecture-extraction` | arc42 aligerado + C4, patrón brownfield | Acceso por capas (R11): Graphify determinístico si está disponible, manual si no. Reconocimiento → extracción de vistas → validación con el usuario (inferido marcado como inferido) → doc de arquitectura + registro de deuda. Encadena a `product-brief` si el objetivo era extender. |

Reglas transversales de las cuatro: nada se afirma sin verificar; todo artefacto es portable; hallazgos accionables convergen al formato brief.

### El brief

Frontmatter (pasaporte machine-readable):

```yaml
---
awm: product-brief
schema: 1
title: <nombre corto>
mode: discovery | brief | assessment | extraction
readiness: draft | ready
created: YYYY-MM-DD
updated: YYYY-MM-DD
open_decisions: [DA-1, DA-3]
project: <slug o null>
---
```

Cuerpo heredado de brief-spec (ver R5.1). El `schema` permite evolucionar el contrato sin romper briefs viejos. La re-ingesta reconoce por discriminador, no por heurística; documentos sin frontmatter se "adoptan" (R6.1).

### El readiness-gate

Checklist G1–G9 (ver R7) evaluado contra contenido, con veredicto por criterio (✓/✗ + evidencia). Todos ✓ → `readiness: ready`. Algún ✗ → `draft` + vacíos accionables. Sin override. Corre al cierre de cada modo productor de brief y siempre en el cruce a desarrollo.

### Handoff y ruteo superior

Edición quirúrgica a `brainstorming` (modo precargado, R8), ajuste de una línea a `development-process` (reconocer brief `ready` como entrada válida), y edición a `using-awm` (tabla de frontera entre orquestadores + regla de precedencia sobre `brainstorming`, R9). Anti-pérdida: un orquestador activo, el brief como baton, vuelta atrás explícita por la puerta (R10).

### Empaquetado

Bundle `product` v1.0.0, scope `baseline`, `dependsOn: []` (handoff degrada a entrega de archivo sin `dev`). Skills: `product-process`, `product-discovery`, `product-brief`, `architecture-assessment`, `architecture-extraction`, `readiness-gate`. Bump minor de `dev` → 1.6.0 por las ediciones a `brainstorming`/`development-process`/`using-awm`. `catalog.json` actualizado. El bundle nace con frontera limpia para mudarse a un registry dedicado cuando se ejecute la Parte 1 del issue.

### Orden de implementación

0. Auditoría de skills existentes (R12) — clasificar antes de escribir.
1. Contrato del brief + `readiness-gate`.
2. `product-brief` (adapta brief-spec).
3. `product-discovery`.
4. `architecture-extraction` y `architecture-assessment`.
5. Orquestador `product-process`.
6. Ediciones de handoff/ruteo (`brainstorming`, `development-process`, `using-awm`).
7. Empaquetado (bundle, catalog, CHANGELOG, docs).

Verificación por skill: formato del baseline (R13.2) + prueba de humo conversacional del flujo. Verificación de conjunto: recorrido E2E de cada uno de los cinco caminos del orquestador.

## Referencias

- Issue: `Kodria/awm-baseline-registry#6` (este ciclo cubre Partes 2+3 reformuladas)
- Metodologías: brief-spec (skill personal del usuario, semilla de `product-brief`), JTBD/problem framing, ATAM (aligerado), arc42 + C4, patrón brownfield de BMAD ("documentar antes de tocar"), EARS (ya usado por `brainstorming`)
- Herramienta opcional: [Graphify](https://github.com/Graphify-Labs/graphify) — extracción determinística código→grafo vía tree-sitter, MIT, local
- Estado del arte validado: spec-driven development (GitHub Spec Kit, AWS Kiro, BMAD) — la spec como fuente de verdad pre-código
