---
name: product-brief
description: Metodología para construir briefs spec-driven destinados a handoff a un agente implementador (Claude Code), sin asumir nada del estado actual del sistema. Usar SIEMPRE que el usuario pida construir, redactar o cerrar un "brief", "spec", "documento de requerimientos" o "handoff para Claude Code" de una funcionalidad, módulo, pipeline o integración — incluso si no usa la palabra "brief" pero pide documentar un diseño acordado para que otro agente lo implemente. También usar cuando pida convertir una conversación de diseño/arquitectura en un documento ejecutable por releases. En entornos con AWM instalado (Claude Code), deferir a product-process/product-brief — este port es para entornos sin filesystem (claude.ai web, Cowork móvil/web).
---

# product-brief — Construcción de briefs spec-driven para handoff

Construye briefs de requerimientos y procesos (el QUÉ) que delegan explícitamente el diseño técnico (el CÓMO) a un agente implementador que sí tiene acceso al código. El principio fundacional: **el brief se escribe sin acceso al sistema real, y por lo tanto no debe asumir absolutamente nada que no esté verificado.**

## Por qué existe esta metodología

Los briefs escritos desde una conversación fallan de una forma predecible: asumen estructuras, nombres de entidades, integraciones y convenciones que "suenan razonables" pero no existen así en el código. El implementador construye sobre esas asunciones y el resultado contradice el sistema real. Esta metodología neutraliza ese fallo convirtiendo cada asunción potencial en (a) una tarea de descubrimiento, (b) una decisión abierta, o (c) una referencia marcada como conceptual.

## Contrato del artefacto

Todo brief que produce esta skill es un artefacto de la capa de producto de AWM y abre con este bloque YAML literal (contrato normativo de la capa de producto de AWM, reproducido inline abajo):

```yaml
---
awm: product-brief
schema: 1
title: <nombre corto>
mode: brief
readiness: draft
created: YYYY-MM-DD
updated: YYYY-MM-DD
open_decisions: [DA-1, DA-3]
project: <slug o null>
---
```

Reglas del contrato que esta skill respeta:

- **`awm: product-brief` es el discriminador.** Un documento es un brief si y solo si lleva esa clave en el frontmatter — la re-ingestión en Claude Code (`product-process`) lo reconoce exclusivamente por ella, nunca por títulos ni nombre de archivo. Por eso este port SIEMPRE escribe el bloque completo: es lo que hace al brief re-ingerible sin conversión.
- **`schema: 1` es la versión del contrato**, no de la skill. Es un entero que solo crece; esta skill escribe el valor vigente y nunca lo inventa.
- **`readiness: draft`, siempre.** Esta skill inicializa `readiness` a su valor neutro `draft` porque el campo debe existir desde que el archivo se crea — eso no es auto-certificación. Lo que esta skill jamás hace es escribir `ready` ni modificar un `readiness` ya existente: ese valor lo escribe exclusivamente `readiness-gate` (en Claude Code) como resultado de su checklist G1–G9.
- `open_decisions` lista los IDs `DA-#` aún abiertos; `created`/`updated` son fechas reales del documento.

## Flujo de trabajo (en orden)

### 1. Recolectar antes de escribir

Antes de redactar, asegurar que la conversación cubre: la necesidad de negocio, el catálogo de casos de negocio (casos, excepciones y reglas — no solo el happy path; presionar hasta agotarlo: "¿qué más? ¿qué caso borde nos avergonzaría en producción?"), el proceso actual punta a punta tal como lo describe el dueño (no como uno lo imagina), las restricciones duras (costos, suscripciones, privacidad/NDA, infraestructura existente que no se puede tocar), y los acuerdos de diseño ya cerrados en la conversación. Si falta algo de esto, preguntar — una pregunta por turno.

### 2. Presentar el índice ANTES de redactar

Nunca escribir el brief directamente. Presentar primero el contenido propuesto sección por sección, marcando qué está decidido y qué quedará como decisión abierta, y esperar aprobación o ajustes del usuario. El usuario frecuentemente corrige supuestos sobre su propio proceso en este paso — es la validación más barata de todo el flujo.

### 3. Redactar siguiendo el contrato

El cuerpo del brief lleva estas **12 secciones, en este orden** (orden normativo del contrato, reproducido inline abajo). Usar los títulos canónicos en inglés tal como aparecen abajo — es lo que `readiness-gate` y la re-ingestión reconocen; el contenido de las secciones va en español:

1. **Business Need** — una o más entradas `N#`: el problema, quién carga su costo, y el costo de no resolverlo.
2. **Business Cases** — el catálogo de casos, excepciones y reglas que el brief debe cubrir (bullets descriptivos, sin esquema de IDs). Un brief solo-happy-path falla el gate por esta sección.
3. **Users & Context** — quién usa o sufre esto, y en qué contexto lo encuentra (bullets descriptivos).
4. **Constraints** — límites duros técnicos, de costo, privacidad e infraestructura intocable (bullets descriptivos; lo abierto va en Open Decisions, no acá).
5. **Non-Assumption Mandate** — ver regla propia abajo.
6. **Glossary** — términos de dominio definidos una sola vez (tabla).
7. **Processes** — entradas `PR-#` de comportamiento de negocio.
8. **Requirements** — `RF-x.y` / `RNF-x.y` (y `RNF-T.#` transversales), cada uno con su `CA-x.y`.
9. **Open Decisions** — tabla `DA-#`.
10. **Out of Scope** — frontera explícita de lo que NO se hará.
11. **Releases** — cortes independientemente productivos.
12. **Risks** — tabla riesgo/impacto/mitigación.

Las reglas no negociables al redactar:

**Mandato de no-asunción, inmediatamente después de Business Need / Business Cases / Users & Context / Constraints.** Incluye: la declaración de que el brief se construyó sin acceso al código; la **lista explícita y exhaustiva de lo NO verificado** (entidades, integraciones, convenciones, formatos de payloads externos, mecanismos de deployment); la regla de que toda contradicción entre brief y sistema real se reporta al dueño y nunca se resuelve asumiendo; y la delegación explícita de toda definición técnica (esquemas, rutas, firmas, librerías) al implementador tras el descubrimiento.

**Lenguaje calibrado en certeza.** Las referencias a entidades del sistema son conceptuales y se marcan ("estructura real: descubrir en R0", "verificar en R0 si existe"). Jamás afirmar con certeza algo que la conversación no verificó. Los umbrales y parámetros son configurables y/o decisiones abiertas, nunca números mágicos definitivos.

**Procesos agnósticos de implementación.** Los procesos (PR-#) describen comportamiento y reglas, no tecnología. Diagramas Mermaid (state diagram para ciclos de vida, flowchart para flujos) solo de lo acordado conceptualmente. Cuando un proceso depende de algo no verificado, el proceso lo dice inline ("si R0 confirma X; de lo contrario, fallback Y").

**Requisitos compatibles con EARS.** Cada RF/RNF se escribe como una afirmación testeable estilo SHALL (WHEN/IF/THE … SHALL …), una por ID, para que el implementador derive sus requirements sin retrabajo.

**Releases independientemente productivos.** Cada release debe: entregar valor usable por sí solo (justificarlo en una línea: "valor productivo independiente"), no requerir releases posteriores, y ser verificable con criterios de aceptación ejecutables sobre datos/uso real — no sobre mocks. Ningún release inicia sin los CA del anterior cumplidos y sus decisiones abiertas bloqueantes resueltas.

**R0 siempre es descubrimiento, solo lectura.** Su entregable es el informe del estado real + mapeo conceptual→real + contradicciones encontradas + plan técnico conforme a convenciones descubiertas. R0 nunca modifica código ni datos, y todo lo demás está gateado por la validación del dueño sobre su informe.

**Trazabilidad por IDs.** Necesidades (N#), procesos (PR-#), requisitos funcionales (RF-x.y), no funcionales (RNF-x.y y transversales RNF-T.#), criterios de aceptación (CA-x.y), decisiones abiertas (DA-#). Cada esquema de IDs tiene su sección definida en el contrato — no usar prefijos sin sección donde aterrizar (el antiguo `P#` de principios se eliminó del contrato: lo que era un principio se pliega en Constraints o en RNF-T.#, o se descarta). Las DA van en tabla con columna "bloquea" (qué release no puede iniciar sin resolverla) y "posiciones conocidas".

**Secuencia por valor, con justificación.** El orden de releases se recomienda por valor de negocio (qué reemplaza el costo/dolor que motivó el proyecto va primero), no por dependencia técnica, y la justificación se escribe.

### 4. Señalar desviaciones al entregar

Si durante la redacción se tomó alguna decisión que difiere de lo conversado (un reordenamiento, un alcance ajustado), señalarla explícitamente al entregar el brief para que el usuario la apruebe o revoque. Nunca dejar desviaciones silenciosas dentro del documento.

### 5. Entregar como archivo

El brief es un artefacto standalone en Markdown, con el frontmatter del contrato (sección "Contrato del artefacto") como primeras líneas del archivo. El usuario lo cristaliza en su sistema o lo entrega a Claude Code, donde `product-process` lo re-ingiere por el discriminador `awm: product-brief`. Crear el archivo y presentarlo; no volcarlo inline en la conversación.

## Estilo y tono del documento

- Español neutro, registro técnico de consultoría. Imperativo hacia el implementador.
- Encabezado con proyecto, fecha, estado, audiencia (el agente implementador) y metodología.
- Tablas para glosario, decisiones abiertas y riesgos (riesgo/impacto/mitigación). El riesgo "contradicciones entre brief y sistema real" se incluye siempre, mitigado por el mandato de no-asunción + R0.
- Conciso: el brief define necesidad y comportamiento; la verbosidad técnica especulativa es exactamente lo que esta metodología prohíbe.

## Anti-patrones (si aparece uno, detenerse y corregir)

- Definir esquemas de tablas, rutas de endpoints o firmas exactas de tools "tentativas": eso es asumir con sintaxis de certeza. Describir la responsabilidad, delegar la forma.
- Criterios de aceptación no ejecutables ("el código debe ser limpio") o verificables solo con datos sintéticos.
- Releases que solo tienen sentido si el siguiente existe.
- Resolver una ambigüedad del dueño eligiendo por él dentro del documento en vez de registrarla como DA-#.
- Omitir el "fuera de alcance": lo que no se hará se declara, con la misma seriedad que lo que sí.
- Escribir `readiness: ready` o cambiar un `readiness` existente: ese campo solo lo escribe `readiness-gate`.
