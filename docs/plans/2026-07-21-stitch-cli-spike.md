# Spike: CLI `@_davideast/stitch-mcp` como Capa 2 de acceso a Stitch

**Fecha:** 2026-07-21
**Task:** Task 1 del plan `docs/plans/2026-07-21-frontend-layer-redesign-plan.md` (bloqueante para Task 4)
**Requisito:** R2.2
**Objetivo:** determinar la sintaxis real de invocación del CLI `npx -y @_davideast/stitch-mcp` para poder escribir la Capa 2 de `ui-design` (acceso sin MCP configurado, usando `STITCH_API_KEY`).

## Veredicto

**VIABLE_FULL** — el CLI cubre las 9 tools requeridas (generación e iteración incluidas). La Capa 2 puede documentarse en Task 4 como una vía completa y funcional, no solo de descarga.

## Cómo se probó

- Se cargó `STITCH_API_KEY` desde `agentic-workflow/.env` al entorno del shell (nunca impresa).
- Todas las tools de solo-lectura (`list_projects`, `get_project`, `get_screen`, `list_design_systems`) se invocaron **en vivo** contra la cuenta real, con datos reales devueltos.
- Las tools de generación/edición (`generate_screen_from_text`, `edit_screens`, `generate_variants`, `apply_design_system`) se verificaron **solo por schema** (flag `--schema`, que expone `inputSchema` + un `example` de invocación generado por el propio CLI), para no gastar créditos ni tiempo de generación real. `create_project` también se verificó solo por schema para no ensuciar la cuenta con proyectos de prueba.
- **Excepción no planeada:** `create_design_system` sí se ejecutó en vivo sin el argumento requerido `designSystem`, para observar el mensaje de error de validación. El CLI **no valida client-side** y reenvió la llamada al servidor, que la aceptó y creó un design system real vacío (`assets/12903756546949052946`, sin `projectId` → asset global) en la cuenta. No existe tool `delete_design_system` en el MCP para revertirlo (solo existe `delete_project`). Ver sección "Hallazgos y advertencias".

## Descubrimiento de sintaxis

Los comandos literales del plan (`npx -y @_davideast/stitch-mcp tool get_project`, etc., sin flags) **no pasan argumentos** — hay que usar el subcomando `tool` con sus propios flags. Salida de `stitch-mcp tool --help`:

```
Usage: stitch-mcp tool [options] [toolName]

Invoke MCP tools directly

Options:
  -s, --schema            Show tool arguments and schema
  -d, --data <json>       JSON data (like curl -d)
  -f, --data-file <path>  Read JSON from file (like curl -d @file)
  -o, --output <format>   Output format: json, pretty, raw (default: "pretty")
  -h, --help              display help for command
```

- **Los argumentos se pasan como un único JSON vía `-d '{...}'`** (equivalente a `curl -d`), no posicional ni como flags individuales por campo.
- `npx -y @_davideast/stitch-mcp tool` (sin nombre) lista las **~19 tools disponibles** (incluye 3 "virtuales" compuestas por el CLI: `get_screen_code`, `get_screen_image`, `build_site`, más `list_tools`), cada una con su `inputSchema`/`outputSchema` JSON Schema completo — confirma cobertura de las 9 tools requeridas y más.
- `stitch-mcp tool <name> --schema` (sin `-d`) imprime un resumen humano-legible de argumentos + un `example` de comando ya armado — la forma más rápida de obtener la sintaxis exacta de cualquier tool sin gastar una llamada real.
- `-o pretty` (default) imprime JSON indentado a stdout. `-o json` imprime JSON compacto una sola línea. `-o raw` imprime el objeto JS vía `util.inspect` (comillas simples, `+` para concatenar strings largos) — **no** es el frame crudo del protocolo MCP, es solo un formato de impresión alternativo menos parseable que `json`/`pretty`. Para consumo programático (Task 4, capa 2 de `ui-design`) usar siempre `-o json`.
- Ruido no bloqueante: en varias invocaciones aparecieron 1–2 líneas `Stitch Transport Error: [DOMException [AbortError]: This operation was aborted]` en stderr antes del JSON válido en stdout — parecen reintentos internos del cliente MCP subyacente que no impiden el resultado final. No se observó ningún caso donde este mensaje apareciera sin que el JSON válido llegara después. Cuando **sí** hay un fallo real de la tool, aparece en cambio: `Error: Tool Call Failed [<tool>]: <mensaje>` (o `Request contains an invalid argument.` si falta un campo requerido del lado servidor).
- **`STITCH_API_KEY` inválida o ausente** (verificado en vivo, barato — sin costo de API real):
  - Key con formato inválido/no reconocida: `STITCH_API_KEY="invalid-fake-key-12345" npx -y @_davideast/stitch-mcp tool list_projects` → HTTP 401, mensaje del servidor `API keys are not supported by this API. Expected OAuth2 access token or other authentication credentials that assert a principal.` (envuelto en `Stitch Transport Error: StreamableHTTPError: ... {"code":401}` seguido de `Error: Streamable HTTP error: ...`).
  - Variable no exportada en absoluto: `env -u STITCH_API_KEY npx -y @_davideast/stitch-mcp tool list_projects` → falla **antes** de llamar a la red, con `Error: [{"code":"custom","path":[],"message":"Authentication failed. Provide either 'apiKey' OR ('accessToken' + 'projectId')."}]`.
  - Los textos exactos difieren entre ambos casos y podrían cambiar entre versiones del CLI. **Task 4 no debe hacer matching de string exacto** — cualquier salida con `Error:` (client-side, HTTP 401, o `Tool Call Failed`) en la invocación de la Capa 2 debe tratarse como señal de degradar a Capa 3 (offline), por R2.5.
- Confirmado empíricamente: pese a que el `inputSchema` de `get_screen` lista `name`, `projectId` y `screenId` como **los tres requeridos**, el servidor acepta la llamada con **solo `name`** (`projects/{p}/screens/{s}`) — `projectId`/`screenId` sueltos están marcados `deprecated` en el schema y en la práctica son redundantes con `name`. Se recomienda para Task 4 usar solo `name`.
- Contraejemplo: `list_design_systems` sin `projectId` (aunque el schema lo marca `optional`, describiendo que debería listar "todos los design systems globales") devolvió `Error: Tool Call Failed [list_design_systems]: Request contains an invalid argument.` en la práctica — **hay que pasar siempre `projectId`** aunque el schema diga que es opcional.

## Tabla: tool → comando exacto

Todas las invocaciones asumen:
```bash
set -a; source .env; set +a   # exporta STITCH_API_KEY
```

| Tool | Comando exacto | Verificado | Notas |
|---|---|---|---|
| `list_projects` | `npx -y @_davideast/stitch-mcp tool list_projects -o json` | En vivo | Sin `-d` funciona (todos los campos son opcionales); devolvió 26 proyectos reales de la cuenta. |
| `create_project` | `npx -y @_davideast/stitch-mcp tool create_project -d '{"title":"<title>"}' -o json` | Por schema | `title` opcional. |
| `get_project` | `npx -y @_davideast/stitch-mcp tool get_project -d '{"name":"projects/<projectId>"}' -o json` | En vivo | `name` requerido, formato `projects/{project}`. |
| `list_design_systems` | `npx -y @_davideast/stitch-mcp tool list_design_systems -d '{"projectId":"<projectId>"}' -o json` | En vivo | `projectId` marcado opcional en el schema pero **requerido en la práctica** (ver hallazgo arriba); sin proyectos con design system devuelve `{}`. |
| `create_design_system` | `npx -y @_davideast/stitch-mcp tool create_design_system -d '{"designSystem":{"displayName":"<name>","theme":"<theme-object>"},"projectId":"<projectId>"}' -o json` | Por schema (+ 1 llamada en vivo accidental sin `designSystem`, ver advertencias) | `designSystem` (objeto `DesignSystem`, requiere `displayName` + `theme`) requerido; `projectId` opcional (vacío = asset global). `<theme-object>` sigue la misma convención de placeholder que el resto de la tabla — en uso real sustituir por un objeto JSON `DesignTheme` real (p. ej. `{"bodyFont":"INTER","colorMode":"DARK",...}`), no por el string literal. |
| `generate_screen_from_text` | `npx -y @_davideast/stitch-mcp tool generate_screen_from_text -d '{"projectId":"<projectId>","prompt":"<prompt>","deviceType":"MOBILE"}' -o json` | Por schema únicamente (no ejecutado en vivo — costo/latencia real) | `projectId` + `prompt` requeridos; `deviceType`/`designSystem`/`modelId` opcionales. |
| `get_screen` | `npx -y @_davideast/stitch-mcp tool get_screen -d '{"name":"projects/<projectId>/screens/<screenId>"}' -o json` | En vivo | Confirmado: la respuesta trae `htmlCode.downloadUrl` y `screenshot.downloadUrl`, igual que el MCP. Solo `name` es necesario pese a que el schema también lista `projectId`/`screenId` como requeridos (son legacy/deprecated). |
| `edit_screens` | `npx -y @_davideast/stitch-mcp tool edit_screens -d '{"projectId":"<projectId>","selectedScreenIds":["<screenId1>","<screenId2>"],"prompt":"<prompt>"}' -o json` | Por schema únicamente (costo/latencia real) | `projectId`, `selectedScreenIds` (array), `prompt` requeridos. El `example` autogenerado por `--schema` pone `"<array>"` como placeholder de string — en la práctica debe ser un array JSON real, no un string. |
| `generate_variants` | `npx -y @_davideast/stitch-mcp tool generate_variants -d '{"projectId":"<projectId>","selectedScreenIds":["<screenId>"],"prompt":"<prompt>","variantOptions":{"count":3}}' -o json` | Por schema únicamente (costo/latencia real) | `projectId`, `selectedScreenIds`, `prompt`, `variantOptions` (objeto `VariantOptions`) requeridos. |
| `apply_design_system` | `npx -y @_davideast/stitch-mcp tool apply_design_system -d '{"projectId":"<projectId>","assetId":"<designSystemAssetId>","selectedScreenInstances":[{"id":"<instanceId>","sourceScreen":"projects/<projectId>/screens/<screenId>"}]}' -o json` | Por schema únicamente (costo/latencia real) | `projectId`, `assetId`, `selectedScreenInstances` (array de `{id, sourceScreen}`) requeridos. Los pares `{id, sourceScreen}` sí se verificaron **en vivo** dentro de la respuesta real de `get_project` (campo `screenInstances`, ver snippet abajo) — la única parte no verificada en vivo de esta fila es `apply_design_system` mismo. |

Tools adicionales descubiertas (no requeridas por el plan, útiles para Task 4):
- `get_screen_code` / `get_screen_image` — tools "virtuales" del propio CLI que envuelven `get_screen` y descargan directamente el HTML o el PNG (evitan tener que resolver `downloadUrl` a mano).
- `build_site` — mapea screens de un proyecto a rutas y devuelve el HTML combinado.
- `list_screens`, `delete_project`, `upload_design_md`, `create_design_system_from_design_md`, `update_design_system` — cubren gestión adicional no listada explícitamente en el plan pero disponibles.

## Formato de salida

Con `-o json` (recomendado para Task 4), cada tool devuelve el `outputSchema` de la Stitch API en JSON compacto de una sola línea, sin metadata MCP adicional (no hay wrapper `{content: [...]}` visible — el CLI ya lo desenvuelve). Ejemplo real (`get_screen`, truncado):

```json
{"deviceType":"MOBILE","height":"1768","htmlCode":{"downloadUrl":"https://contribution.usercontent.google.com/download?...","mimeType":"text/html","name":"projects/16697601822700576804/files/12de775d07054c3c95d42ca82c986716"},"name":"projects/16697601822700576804/screens/33749ebdb90049d09ce82f38c115bac0","screenshot":{"downloadUrl":"https://lh3.googleusercontent.com/aida/...","name":"projects/16697601822700576804/files/a9746e61c1cc42829e664ee24a72807b"},"title":"Detalle Diario - Ana (Martes 1 jul)","width":"780"}
```

Confirma el requisito puntual del plan: **`get_screen` devuelve `htmlCode.downloadUrl` y `screenshot.downloadUrl`, exactamente como el MCP** — Task 4 puede documentar el mismo flujo de descarga (fetch de la URL) para ambas vías de acceso.

`get_project` (también en vivo) es la fuente real de los `selectedScreenInstances` que pide `apply_design_system`: cada entrada del array `screenInstances` de la respuesta trae `id` + `sourceScreen` directamente utilizables. Fragmento real (truncado, mismo proyecto `16697601822700576804`):

```json
"screenInstances": [
  {"height":884,"id":"33749ebdb90049d09ce82f38c115bac0","sourceScreen":"projects/16697601822700576804/screens/33749ebdb90049d09ce82f38c115bac0","width":390,"y":3256},
  {"height":884,"id":"4f4d0825d9044e95929925f8af14eec0","sourceScreen":"projects/16697601822700576804/screens/4f4d0825d9044e95929925f8af14eec0","width":390,"y":7997},
  {"height":540,"id":"assets_12415377807936024307","sourceAsset":"assets/12415377807936024307","type":"DESIGN_SYSTEM_INSTANCE","width":960}
]
```

Nota: no todas las entradas de `screenInstances` son pantallas — algunas (como la última del ejemplo) son instancias de design system (`type":"DESIGN_SYSTEM_INSTANCE"`, con `sourceAsset` en vez de `sourceScreen`). Task 4 debe filtrar por presencia de `sourceScreen` antes de construir el payload de `apply_design_system`.

## Hallazgos y advertencias para Task 4

1. **Sintaxis de argumentos:** siempre `-d '<json>'` con un único objeto JSON, nunca flags posicionales por campo.
2. **Formato de salida recomendado:** `-o json` (compacto, parseable). Evitar `-o raw` (formato JS `util.inspect`, no es JSON válido).
3. **`get_screen` solo necesita `name`** (`projects/{p}/screens/{s}`) — no hace falta resolver `projectId`/`screenId` por separado.
4. **`list_design_systems` necesita `projectId` siempre** en la práctica, pese a que el schema lo marca opcional.
5. **Ruido no bloqueante:** mensajes `Stitch Transport Error: [DOMException [AbortError]...]` en stderr pueden aparecer y no indican fallo — solo `Error: Tool Call Failed [...]` en stdout/stderr indica fallo real. Task 4 debería instruir a no reintentar solo por ver ese mensaje de transporte.
6. **Efecto secundario de este spike:** al probar `create_design_system` sin el argumento requerido para observar el error, el CLI reenvió la llamada al servidor (no valida client-side) y creó un design system real vacío (`assets/12903756546949052946`, global, sin proyecto asociado) en la cuenta de Stitch del usuario. No hay tool `delete_design_system` en el MCP/CLI para revertirlo — queda como asset huérfano inofensivo. Se reporta aquí para que el usuario decida si quiere limpiarlo manualmente desde la UI de Stitch.
7. **`--schema` es la forma más barata de descubrir sintaxis** de cualquier tool sin gastar una llamada real — útil para que Task 4 la documente como técnica de auto-descubrimiento si el usuario necesita una tool no cubierta aquí.
8. **`STITCH_API_KEY` inválida o ausente produce errores distintos según el caso** (401 del servidor vs. validación client-side antes de salir a red), y el texto exacto no está garantizado entre versiones del CLI — Task 4 debe degradar de Capa 2 a Capa 3 (offline) ante **cualquier** salida de error de la invocación (R2.5), sin depender de matchear un mensaje puntual.

## Cobertura confirmada vs. requerida por el plan

Requeridas: `list_projects` ✅, `create_project` ✅ (schema), `list_design_systems` ✅, `create_design_system` ✅, `generate_screen_from_text` ✅ (schema), `get_screen` ✅ (en vivo, confirma `downloadUrl`s), `edit_screens` ✅ (schema), `generate_variants` ✅ (schema), `apply_design_system` ✅ (schema).

Las 9 tools requeridas están cubiertas por el CLI con sintaxis confirmada. Ninguna requiere OAuth — todas usan `STITCH_API_KEY` vía variable de entorno.
