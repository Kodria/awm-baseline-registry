import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const awm = process.env.AWM_PROCESS_BIN || 'awm';
const publicationMarker = 'Este ejemplo se puede copiar directamente a `## Estructura`:';

function processTimeoutMs(value = process.env.AWM_PROCESS_TIMEOUT_MS || '30000') {
  const timeout = Number(value);
  assert.ok(Number.isSafeInteger(timeout) && timeout > 0,
    'AWM_PROCESS_TIMEOUT_MS must be a positive integer');
  return timeout;
}

function publishedStructureExample(source = readFileSync(path.join(root, 'skills/process-lifecycle/SKILL.md'), 'utf8')) {
  const lines = source.split(/\r?\n/);
  const marker = lines.findIndex(line => line.includes(publicationMarker));
  assert.notEqual(marker, -1, 'process-lifecycle must mark the structure example it publishes');
  let start = marker + 1;
  while (start < lines.length && lines[start].trim() === '') start += 1;
  assert.match(lines[start] || '', /^-\s+(?:\*\*)?SG-\d+/,
    'process-lifecycle must publish an SG/OP structure example immediately after its marker');
  const end = lines.findIndex((line, index) => index > start && line.trim() === '');
  assert.notEqual(end, -1, 'the published structure example must have a bounded end');
  return lines.slice(start, end).join('\n');
}

function processModel(structure) {
  return `---
awm: process-model
schema: 1
name: issue-49-acceptance
status: draft
entry_point: true
terminates_to: none
created: 2026-09-04
updated: 2026-09-04
---

# Issue 49 acceptance

## Objetivo

Confirmar que el ejemplo publicado es consumible.

## Cuándo aplica

Durante la verificación del contrato de process-lifecycle.

## Estructura

${structure}

## Ruteo

| Cuándo | Estado requerido | Va a | Termina en |
|---|---|---|---|
| Siempre | | OP-1.1 | SG-1 |

## Terminación

none

## Sin verificar

- Nada.
`;
}

test('extrae el ejemplo HTA ligado a su marcador aunque exista un señuelo válido', () => {
  const source = `- SG-9 — Señuelo válido
  - OP-9.1 — Operación señuelo

Este ejemplo se puede copiar directamente a \`## Estructura\`:

- **SG-1** — Ejemplo publicado inválido
  - OP-1.1 (SG-1) — Operación publicada inválida
`;

  assert.match(publishedStructureExample(source), /^- \*\*SG-1\*/,
    'the extractor must select the example after its publication marker, not the first SG/OP-shaped text in the skill');
});

test('el CLI publicado acepta literalmente el ejemplo HTA de process-lifecycle', () => {
  const sandbox = mkdtempSync(path.join(os.tmpdir(), 'awm-r11-process-'));
  try {
    const project = path.join(sandbox, 'project');
    const awmHome = path.join(sandbox, 'home');
    const registry = path.join(awmHome, 'registries', 'baseline');
    const skill = path.join(registry, 'skills', 'issue-49-acceptance');
    mkdirSync(project, { recursive: true });
    mkdirSync(skill, { recursive: true });
    writeFileSync(path.join(project, 'package.json'), JSON.stringify({ name: 'issue-49-acceptance', private: true }));
    writeFileSync(path.join(awmHome, 'registries.json'), JSON.stringify([{ name: 'baseline', remote: 'local-fixture' }]));
    writeFileSync(path.join(skill, 'SKILL.md'), processModel(publishedStructureExample()));

    const timeout = processTimeoutMs();
    const result = spawnSync(awm, ['process', 'list'], {
      cwd: project,
      env: { ...process.env, AWM_HOME: awmHome, AWM_NO_UPDATE_CHECK: '1' },
      encoding: 'utf8',
      timeout,
      killSignal: 'SIGKILL',
    });
    if (result.error?.code === 'ETIMEDOUT') {
      assert.fail(`awm process list timed out after ${timeout}ms`);
    }
    if (result.error) throw result.error;
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.equal(result.stderr, '', result.stderr);
    assert.match(result.stdout, /issue-49-acceptance\s+draft\s+entry-point/);
  } finally {
    rmSync(sandbox, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  }
});
