import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const awm = process.env.AWM_PROCESS_BIN || 'awm';

function publishedStructureExample() {
  const lines = readFileSync(path.join(root, 'skills/process-lifecycle/SKILL.md'), 'utf8').split(/\r?\n/);
  const start = lines.findIndex(line => /^-\s+(?:\*\*)?SG-\d+/.test(line));
  assert.notEqual(start, -1, 'process-lifecycle must publish an SG/OP structure example');
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

    const result = spawnSync(awm, ['process', 'list'], {
      cwd: project,
      env: { ...process.env, AWM_HOME: awmHome, AWM_NO_UPDATE_CHECK: '1' },
      encoding: 'utf8',
    });
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.equal(result.stderr, '', result.stderr);
    assert.match(result.stdout, /issue-49-acceptance\s+draft\s+entry-point/);
  } finally {
    rmSync(sandbox, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  }
});
