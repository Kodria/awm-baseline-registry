---
name: process-lifecycle
version: "1.0.1"
license: Apache-2.0
description: Use when creating, modifying, or verifying an AWM process — elicits the process as a hierarchical interview, generates its orchestrator, declaration, bundle and phase skills into a registry working copy, and verifies the result appears composed in a real installation before promoting it to active.
---

# Process Lifecycle

## Overview

Este skill compone procesos AWM — no enseña a escribir un skill. Un proceso es una secuencia de fases con orquestador, declaración en `awm-registry.json`, bundle y skills de fase; el craft de escribir cada `SKILL.md` individual es trabajo de `writing-skills`, delegado, nunca reexplicado acá. Lo que este skill aporta es lo que `writing-skills` no cubre: elicitar la estructura jerárquica del proceso, derivar los artefactos que lo declaran, y verificar que el resultado compone en una sesión real antes de promoverlo.

El artefacto durable de un proceso es su propio `SKILL.md` de orquestador — sin sidecar. Este skill lee y escribe ese modelo; nunca inventa un formato paralelo.

**Announce at start:** "I'm using the process-lifecycle skill to elicit, generate, or verify an AWM process."

## Modo de ejecución (lectura del campo)

Al arrancar, localiza el plan activo (`docs/plans/*-plan.md` de la rama actual) y lee su línea `**Modo de ejecución:**`:

- Ausente o `interactivo` → modo interactivo (default): cada paso de este skill espera confirmación antes de avanzar al siguiente, según se detalla en cada paso.
- `desatendido` → aplicá la sección **Modo desatendido** de este skill.
- Cualquier otro valor → tratalo como `interactivo` y avisá: "Valor inválido en `Modo de ejecución`: `<valor>` — usando modo interactivo."

### Modo desatendido

WHEN el modo es `desatendido`, corré la elicitación, la generación y la verificación como un loop continuo sin pausar a pedir confirmación entre fases — el Paso 3 sigue generando artefacto tras artefacto sin la aprobación por fase que el modo interactivo exige, y el Paso 4 sigue verificando y, si corresponde, promoviendo a `active`, sin esperar a que alguien lo confirme. La única interrupción legítima en este modo es una escalada BLOCKED: colisión de nombre sin resolver (Paso 1/Paso 3), verificación que falla de forma no degradable, o una ambigüedad en la elicitación que ningún criterio de este documento resuelve. Frente a eso, el skill se detiene y reporta — nunca adivina el contenido del modelo ni fuerza una promoción sin verificar.

## Cuándo aplica

Este skill cubre cuatro entradas distintas al mismo ciclo de vida:

1. **Crear un proceso nuevo** — no existe modelo para ese nombre en el registry destino. Arranca en el Paso 1.
2. **Retomar un `draft`** — ya existe un modelo con `status: draft` en el registry destino. Se retoma leyéndolo (ver R2.6 en el Paso 2), nunca volviendo a relatar el proceso desde cero.
3. **Modificar un proceso `active`** — ver `## Modificar un proceso activo`.
4. **Verificar sin cambiar contenido** — un modelo ya generado necesita confirmar que compone en una instalación real; entra directo al Paso 4.

## El artefacto

El contrato del modelo durable ya está establecido — no se redefine acá, se cita. Un proceso es su propio `SKILL.md` de orquestador, con frontmatter `awm: process-model` y seis secciones de cuerpo:

| Sección | Contenido |
|---|---|
| `## Objetivo` | el goal raíz, un enunciado |
| `## Cuándo aplica` | el disparador — proyecta a `appliesWhen` |
| `## Estructura` | subobjetivos `SG-#` → operaciones `OP-#` |
| `## Ruteo` | tabla Cuándo · Estado requerido · Va a · Termina en |
| `## Terminación` | exactamente un sucesor — proyecta a `terminatesTo` |
| `## Sin verificar` | lo asumido y no confirmado |

`status` admite `draft` y `active`; un modelo nuevo nace `draft` y solo el ciclo de verificación del Paso 4 lo promueve. Para el detalle completo del frontmatter, campos y disciplina de `schema`, ver `docs/plans/2026-08-23-process-lifecycle-design.md` en el repo `agentic-workflow` — este skill opera sobre ese contrato, no lo amplía.

## Paso 1 — Registry de destino

Antes de elicitar contenido alguno, pregunta en qué registry vive el proceso — es la primera pregunta de la sesión, siempre, incluso al retomar un `draft`. El modelo se escribe directamente en el working copy (el clon del registry) del registry destino, nunca en el árbol versionado del repositorio de trabajo actual que disparó la sesión.

Nunca escribe bajo `~/.awm`: rechaza de forma dura cualquier ruta que caiga bajo ese árbol y explica que el contenido se edita en el clon del registry, no en la instalación. `~/.awm` (incluyendo `~/.awm/registries/`) es territorio exclusivo de `awm init` y `awm update` — una sesión de desarrollo no lo toca jamás, y este skill no es la excepción.

Antes de escribir, revisa si ya existe un modelo `draft` para ese nombre en el working copy (entrada 2 de `## Cuándo aplica`) y, si existe, lo retoma en el Paso 2 en vez de crear uno nuevo.

## Paso 2 — Elicitación

Conduce la elicitación como entrevista conversacional jerárquica, siguiendo la descomposición HTA del artefacto: primero el objetivo raíz (`## Objetivo`), después los subobjetivos (`SG-#`), después las operaciones dentro de cada subobjetivo (`OP-#`), y en cada nivel las condiciones que lo disparan.

Cada operación cita el subobjetivo del que depende en su propio id: `OP-N.x` pertenece a `SG-N`, y el CLI rechaza el modelo si el prefijo no coincide. La notación es literal —viñeta, id, raya (`—`) y texto—, sin negrita ni anotaciones entre paréntesis. Este ejemplo se puede copiar directamente a `## Estructura`:

- SG-1 — Preparar el entorno de trabajo
  - OP-1.1 — Clonar el working copy del registry destino
  - OP-1.2 — Verificar que no exista ya un modelo `draft` con ese nombre
- SG-2 — Elicitar la estructura del proceso
  - OP-2.1 — Entrevistar al usuario sobre el objetivo raíz y sus disparadores

Agregar adornos a esa forma —por ejemplo `- **SG-1** —` o `(SG-1)` después del id de una operación— hace que `awm process list` descarte el modelo con un diagnóstico.

**Criterio de parada:** una operación deja de descomponerse en el momento en que esa operación puede ser una skill invocable — no antes (deja huecos) y no después (produce un modelo infinitamente anidado e inusable). Ese criterio es de AWM, no de HTA, y es lo que evita el riesgo conocido de la descomposición jerárquica sin fondo.

Si existe un `status: draft` para este nombre en el registry destino, retoma leyéndolo — el modelo ya tiene lo que se relató en la sesión anterior. No vuelve a pedirle al usuario que cuente el proceso de nuevo; carga el `## Objetivo`, `## Estructura` y `## Ruteo` existentes y continúa la entrevista desde donde el modelo quedó incompleto.

Todo el craft de cómo redactar cada `SKILL.md` individual — frontmatter, densidad de prosa, ejemplos, anti-patrones — se delega: **REQUIRED SUB-SKILL: `writing-skills`**. Este skill no reexplica esa disciplina.

## Paso 3 — Generación

Con el modelo completo, genera en loop dirigido con aprobación por fase: orquestador, declaración en `awm-registry.json`, bundle y skills de fase, un artefacto por vez, mostrando cada uno antes de pasar al siguiente (salvo modo desatendido, ver arriba).

El bloque `orchestrator` de `awm-registry.json` se deriva del modelo, nunca se edita aparte: `name` sale de `name`, `appliesWhen` sale de `## Cuándo aplica`, `terminatesTo` sale de `## Terminación`. Si `entry_point` es `false`, no emite bloque `orchestrator` alguno — un proceso que no es punto de entrada no tiene qué declarar ahí.

Antes de escribir, verifica el nombre del proceso contra el contenido ya instalado para descartar una colisión — un registry con nombre duplicado es exactamente lo que `awm registry add` rechaza, y detectarlo acá evita producir un registry no instalable.

## El overlay de fase

`writing-skills` enseña a escribir una skill standalone. Una skill de fase adquiere obligaciones adicionales por el solo hecho de pertenecer a un proceso, y esas obligaciones viven acá — no en `writing-skills`, que no las necesita para una skill suelta:

- **Disparador acotado**: la condición de activación debe encender dentro del proceso, no fuera de él.
- **Markers**: la fase lee y escribe los markers sobre los que el orquestador gatea el avance.
- **Terminación nombrada**: cada fase termina nombrando su sucesor, nunca dejándolo implícito.
- **Herencia de gates**: los gates del proceso padre se heredan, no se redefinen por fase.
- **Lectura de modo**: cada fase repite el mismo bloque `## Modo de ejecución` que este documento, para que el modo `desatendido` se propague de forma uniforme.

Para todo lo demás — frontmatter, densidad, ejemplos, anti-patrones, cómo nombrar la skill — **REQUIRED SUB-SKILL: `writing-skills`**.

## Paso 4 — Verificación

El ciclo de verificación tiene que llegar a confirmar que el orquestador aparece efectivamente compuesto en una instalación real — no corta en "el registry instaló sin error". Corré:

```bash
awm context orchestrators --verify <name>
```

Ese comando expone, de forma read-only, la lista de orquestadores tal como los compondría una sesión real — es la única superficie que este skill consulta para verificar composición. El exit code es el veredicto: `0` significa que el orquestador aparece compuesto; distinto de `0` significa que no.

Solo cuando esa verificación sale con exit 0, promueve el modelo a `status: active`. Nunca antes. Este skill no lee ni parsea el `SKILL.md` materializado en la instalación del proveedor (no revisa rutas como el `using-awm` instalado) — sería una segunda fuente de verdad sobre el mismo hecho que el CLI ya expone.

## Modificar un proceso activo

Cuando exista un modelo con `status: active`, se carga con:

```bash
awm process show --json
```

sobre ese mismo modelo — el único punto de parseo del contrato, nunca un parser propio. Se edita el modelo (objetivo, estructura, ruteo, terminación) con la misma entrevista jerárquica del Paso 2, y se regenera los artefactos derivados repitiendo el Paso 3 completo: el orquestador, la declaración, el bundle y las skills de fase que correspondan al nuevo contenido. La regeneración vuelve a pasar por el Paso 4 antes de que el modelo modificado se considere vigente.

## Degradación

Si `awm context orchestrators --verify` no existe en el CLI instalado, este skill lo informa —qué versión de CLI hace falta— y sigue con el resto del ciclo de vida en lo que sí puede hacer sin ese comando (elicitación, generación de artefactos), pero nunca promueve el modelo a `status: active` sin haber verificado. Un modelo sin verificación se queda en `draft`, honestamente, y no es un fallo del skill: es el resultado correcto ante un CLI viejo.

Otras fallas de entorno (una instalación de `~/.awm` corrupta, un `registries.json` malformado) no son degradación de este comando específico: el CLI las reporta con un mensaje de error propio y código de salida distinto de cero, sin promover nunca el modelo. Ese mensaje es la señal para arreglar la instalación (`awm update`), no un motivo para que este skill lo reinterprete o lo esconda.

En ningún escenario este skill bloquea al usuario: si algo de su ciclo no puede ejecutarse por cualquier causa, lo informa y sigue sin bloquear — nunca corta la sesión ni exige que la ausencia de una pieza opcional se resuelva antes de continuar. Esa es la degradación que este documento promete: honesta sobre lo que no pudo hacer, nunca silenciosa, nunca bloqueante.

## Red Flags

| Tentación | Realidad |
|---|---|
| "Ya sé qué contiene el draft, no hace falta releerlo" | Retomalo leyéndolo siempre — la sesión anterior pudo dejarlo en un estado distinto al que recordás |
| "Edito el `orchestrator` a mano para ahorrar un paso" | Se deriva del modelo. Editarlo aparte reintroduce el drift que motivó este skill |
| "El registry destino es obvio, no hace falta preguntar" | R2.1 lo pide primero, siempre, antes de elicitar una sola línea |
| "El registry instaló sin error, ya está verificado" | Instalar no es componer. Sin `--verify` en verde no hay promoción a `active` |
| "No está `--verify`, mejor no sigo" | Se degrada, se informa, y se sigue con lo que sí se puede hacer. Nunca se bloquea |
| "Reescribo el craft de cómo redactar la skill acá" | Eso es `writing-skills`. Este documento no lo reexplica |

## Integration

| Skill | Rol |
|---|---|
| `writing-skills` | REQUIRED SUB-SKILL — craft de escritura de cada `SKILL.md` individual |
| `development-process` | consumidor típico de un proceso generado por este skill |
| `verification-before-completion` | disciplina general de evidencia antes de afirmar éxito, aplicada acá al Paso 4 |
| `harness-retro` | curaría un hueco de elicitación encontrado en este ciclo como aprendizaje del proyecto |
