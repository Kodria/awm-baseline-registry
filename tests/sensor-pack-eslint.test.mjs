// Test del template `sensor-packs/js-ts/eslint.config.awm.mjs`.
//
// El template se copia tal cual a la raíz de cada proyecto (`awm sensors init`
// hace un `copyFileSync` de cada archivo del pack, sin sustituir nada), así que
// lo que diga este archivo es exactamente lo que corre en casa del usuario. Y
// corre en TODA clase de repo: un monorepo con workspaces y un repo estándar de
// un solo `package.json` reciben el mismo archivo.
//
// Su trabajo es heredar la configuración de ESLint del proyecto. Sin los
// `ignores` del proyecto el sensor lintea `dist/` y devuelve cientos de hallazgos
// sobre código generado mientras el código fuente pasa limpio — pasó de verdad
// (agent-vps-mobile, 2026-07-27: 136 hallazgos, todos en `dist/`) porque el
// template fijaba un solo nombre, `eslint.config.mjs`, y se tragaba el fallo del
// import en un `catch {}` vacío.
//
// Los casos 6 a 9 existen porque el consumidor del template no es una persona
// sino el runner de sensores, y eso restringe cómo se puede fallar:
//
//  - stderr NO es un canal libre. Cuando ESLint sale != 0 el runner concatena
//    `stdout + stderr` y hace `JSON.parse` del resultado. Un aviso de una línea
//    rompe el parseo y un repo con errores reales se reporta con cero.
//  - un throw NO pone el sensor en rojo. Produce `status: "skipped"`, que no
//    rompe el `overall`. Matar el sensor es la forma más callada de fallar.
//
// El caso 13 es obligatorio por otra razón: correr la misma aserción contra el
// template viejo y exigir que FALLE es lo que distingue "el repo está sano" de
// "el test no está mirando" (CONSTITUTION.md, "romper deliberadamente lo que el
// chequeo dice cuidar").

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TEMPLATE = fs.readFileSync(
  path.join(repoRoot, 'sensor-packs/js-ts/eslint.config.awm.mjs'),
  'utf8',
);

// El template anterior al fix. Se conserva aquí para poder exigir que el test
// lo rechace: es la mutación que prueba que estas aserciones pueden fallar.
const LEGACY_TEMPLATE = `let projectConfig = [];
try {
  const mod = await import('./eslint.config.mjs');
  projectConfig = Array.isArray(mod.default) ? mod.default : [mod.default];
} catch {
  // no project config — run with AWM rules only
}

export default [
  ...projectConfig,
  { rules: { 'no-unreachable': 'error' } },
];
`;

// Importa el template como lo hace ESLint y vuelca lo que importa por stdout;
// stderr se captura aparte porque su contenido es, en sí, una aserción.
const DRIVER = `import config from './eslint.config.awm.mjs';
const flat = config.flat(Infinity);
process.stdout.write(JSON.stringify({
  ignores: flat.flatMap((e) => (e && Array.isArray(e.ignores) ? e.ignores : [])),
  names: flat.flatMap((e) => (e && typeof e.name === 'string' ? [e.name] : [])),
  rules: flat.flatMap((e) => (e && e.rules ? Object.keys(e.rules) : [])),
  ruleEntries: flat
    .filter((e) => e && e.rules)
    .map((e) => ({ files: e.files ?? null, rules: Object.keys(e.rules) })),
}));
`;

const workspaces = [];

function runFixture(files, templateSource = TEMPLATE) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'awm-eslint-pack-'));
  workspaces.push(dir);
  for (const [name, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(dir, name), content);
  }
  fs.writeFileSync(path.join(dir, 'eslint.config.awm.mjs'), templateSource);
  fs.writeFileSync(path.join(dir, 'driver.mjs'), DRIVER);

  const result = spawnSync(process.execPath, [path.join(dir, 'driver.mjs')], {
    cwd: dir,
    encoding: 'utf8',
    timeout: 30_000,
    maxBuffer: 4 * 1024 * 1024,
  });

  return {
    status: result.status,
    stderr: result.stderr ?? '',
    config: result.status === 0 ? JSON.parse(result.stdout) : null,
  };
}

// El template se ignora a sí mismo (caso 12); el resto de los casos mira solo
// los `ignores` que vienen del proyecto.
const SELF_IGNORE = 'eslint.config.awm.mjs';
const heredados = (run) => run.config.ignores.filter((glob) => glob !== SELF_IGNORE);

const ESM_PKG = '{ "type": "module" }';
const CJS_PKG = '{ "type": "commonjs" }';

// 1 — El caso que estaba roto: configuración llamada `eslint.config.js`.
{
  const run = runFixture({
    'package.json': ESM_PKG,
    'eslint.config.js': `export default [{ name: 'proyecto', ignores: ['dist/**', 'coverage/**'] }];`,
  });
  assert.equal(run.status, 0, `el template falló:\n${run.stderr}`);
  assert.deepEqual(heredados(run), ['dist/**', 'coverage/**']);
  assert.ok(run.config.names.includes('proyecto'));
}

// 2 — El nombre que ya funcionaba antes del fix sigue funcionando.
{
  const run = runFixture({
    'package.json': ESM_PKG,
    'eslint.config.mjs': `export default [{ name: 'proyecto', ignores: ['build/**'] }];`,
  });
  assert.equal(run.status, 0, `el template falló:\n${run.stderr}`);
  assert.deepEqual(heredados(run), ['build/**']);
}

// 3 — Repo estándar CommonJS: `package.json` sin `type` y `eslint.config.js`
//     escrito con `module.exports`. Es la forma más común fuera de un monorepo.
{
  const run = runFixture({
    'package.json': '{ "name": "repo-estandar" }',
    'eslint.config.js': `module.exports = [{ name: 'proyecto', ignores: ['dist/**'] }];`,
  });
  assert.equal(run.status, 0, `el template falló:\n${run.stderr}`);
  assert.deepEqual(heredados(run), ['dist/**']);
}

// 4 — `eslint.config.cjs` explícito.
{
  const run = runFixture({
    'package.json': CJS_PKG,
    'eslint.config.cjs': `module.exports = [{ name: 'proyecto', ignores: ['lib/**'] }];`,
  });
  assert.equal(run.status, 0, `el template falló:\n${run.stderr}`);
  assert.deepEqual(heredados(run), ['lib/**']);
}

// 5 — Con varios candidatos presentes gana el primero del orden de ESLint.
{
  const run = runFixture({
    'package.json': ESM_PKG,
    'eslint.config.js': `export default [{ name: 'gana-js' }];`,
    'eslint.config.mjs': `export default [{ name: 'pierde-mjs' }];`,
  });
  assert.equal(run.status, 0, `el template falló:\n${run.stderr}`);
  assert.ok(run.config.names.includes('gana-js'));
  assert.ok(!run.config.names.includes('pierde-mjs'));
}

// 6 — Sin configuración del proyecto el sensor sigue vivo y en silencio, con
//     `ignores` conservadores para no recorrer lo generado. El silencio no es
//     cosmético: cualquier línea en stderr se concatena al JSON cuando ESLint
//     sale != 0, y el repo entero pasa a reportar cero hallazgos.
{
  const run = runFixture({ 'package.json': ESM_PKG });
  assert.equal(run.status, 0, `el template falló:\n${run.stderr}`);
  assert.equal(run.stderr, '', 'el template no puede escribir en stderr');
  assert.ok(run.config.ignores.includes('**/dist/**'));
  assert.ok(run.config.ignores.includes('**/coverage/**'));
  // Degradar no es dejar de lintear.
  assert.ok(run.config.rules.includes('no-unreachable'));
}

// 7 — Configuración en TypeScript: ESLint la carga con jiti, este archivo no
//     puede. No es un repo roto, así que el sensor degrada en vez de morir — un
//     throw aquí sería `skipped`, y `skipped` no rompe el `overall`.
{
  const run = runFixture({
    'package.json': ESM_PKG,
    'eslint.config.ts': `export default [{ name: 'proyecto' }];`,
  });
  assert.equal(run.status, 0, 'una config en TypeScript no puede matar el sensor');
  assert.equal(run.stderr, '', 'el template no puede escribir en stderr');
  assert.ok(run.config.ignores.includes('**/dist/**'));
}

// 8 — Una configuración con un nombre que ESLint también importa y que no carga
//     sí está rota: el `eslint` del propio proyecto fallaría igual.
{
  const run = runFixture({
    'package.json': ESM_PKG,
    'eslint.config.js': `throw new Error('la config del proyecto explota');`,
  });
  assert.notEqual(run.status, 0, 'el template debía fallar y no falló');
  assert.match(run.stderr, /eslint\.config\.js existe pero no se pudo cargar/);
  assert.match(run.stderr, /la config del proyecto explota/);
}

// 9 — Lo mismo si carga pero no exporta un flat config.
{
  const run = runFixture({
    'package.json': ESM_PKG,
    'eslint.config.js': `export const reglas = [];`,
  });
  assert.notEqual(run.status, 0, 'el template debía fallar y no falló');
  assert.match(run.stderr, /no tiene `export default`/);
}

// 10 — Los `ignores` de reserva no pisan al proyecto: si su configuración cargó,
//      manda ella, aunque no ignore nada.
{
  const run = runFixture({
    'package.json': ESM_PKG,
    'eslint.config.js': `export default [{ name: 'proyecto', ignores: ['solo-esto/**'] }];`,
  });
  assert.equal(run.status, 0, `el template falló:\n${run.stderr}`);
  assert.deepEqual(heredados(run), ['solo-esto/**']);
  assert.ok(!run.config.names.includes('awm/fallback-ignores'));
}

// 11 — Reparto de reglas por lenguaje. `no-unreachable` vale en cualquier
//      archivo que ESLint parsee; `no-undef` y `no-unused-vars` son falsos
//      positivos estructurales en TypeScript y se acotan a JavaScript. Un bloque
//      sin `files` iba al final y las reencendía por encima del proyecto.
{
  const run = runFixture({
    'package.json': ESM_PKG,
    'eslint.config.js': `export default [{ name: 'proyecto' }];`,
  });
  assert.equal(run.status, 0, `el template falló:\n${run.stderr}`);
  const awmEntries = run.config.ruleEntries.filter((e) => !e.rules.includes('placeholder'));

  const sinAcotar = awmEntries.filter((e) => e.files === null);
  assert.deepEqual(
    sinAcotar.flatMap((e) => e.rules),
    ['no-unreachable'],
    'solo `no-unreachable` puede aplicarse sin acotar `files`',
  );

  const soloJs = awmEntries.find((e) => Array.isArray(e.files));
  assert.deepEqual(soloJs.files, ['**/*.js', '**/*.jsx', '**/*.mjs', '**/*.cjs']);
  assert.deepEqual(soloJs.files.filter((glob) => /\.tsx?$/.test(glob)), []);
  assert.deepEqual(soloJs.rules, ['no-unused-vars', 'no-undef']);
}

// 12 — El template se ignora a sí mismo. Lo genera AWM, no el proyecto: un
//      hallazgo sobre él es ruido que su autor no puede accionar desde su repo.
//      Lo destapó el propio sensor corriendo sobre un repo estándar de prueba.
{
  const run = runFixture({
    'package.json': ESM_PKG,
    'eslint.config.js': `export default [{ name: 'proyecto' }];`,
  });
  assert.equal(run.status, 0, `el template falló:\n${run.stderr}`);
  assert.ok(run.config.ignores.includes('eslint.config.awm.mjs'));
}

// 13 — Mutación: el template viejo debe fallar el caso 1. Si esto pasara, el
//      test estaría verde sin mirar nada.
{
  const run = runFixture(
    {
      'package.json': ESM_PKG,
      'eslint.config.js': `export default [{ name: 'proyecto', ignores: ['dist/**'] }];`,
    },
    LEGACY_TEMPLATE,
  );
  assert.equal(run.status, 0, 'el template viejo no fallaba: se tragaba el error');
  assert.deepEqual(
    heredados(run),
    [],
    'el template viejo heredó los `ignores`: la mutación no reproduce el defecto y el caso 1 no prueba nada',
  );
}

for (const dir of workspaces) fs.rmSync(dir, { recursive: true, force: true });

console.log('sensor-pack-eslint: 13 casos OK');
