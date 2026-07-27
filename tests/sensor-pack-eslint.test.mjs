// Test del template `sensor-packs/js-ts/eslint.config.awm.mjs`.
//
// El template se copia tal cual a la raíz de cada proyecto (`awm sensors init`
// hace un `copyFileSync` de cada archivo del pack, sin sustituir nada), así que
// lo que diga este archivo es exactamente lo que corre en casa del usuario. Su
// único trabajo interesante es heredar la configuración de ESLint del proyecto:
// sin los `ignores` del proyecto, el sensor lintea `dist/` y devuelve cientos de
// hallazgos sobre código generado mientras el código fuente pasa limpio. Eso
// pasó de verdad (agent-vps-mobile, 2026-07-27: 136 hallazgos, todos en `dist/`)
// porque el template fijaba un solo nombre de archivo, `eslint.config.mjs`, y se
// tragaba el fallo del import en un `catch {}` vacío.
//
// El mismo defecto tenía una segunda cara (caso 9): el bloque de reglas de AWM
// no acotaba `files`, así que se aplicaba al final y pisaba en TypeScript
// justamente las reglas base que el proyecto había desactivado a propósito.
// Arreglar solo la herencia dejaba 47 hallazgos igual de falsos.
//
// Por eso el caso 1 no es cosmético y el caso 10 es obligatorio: correr la misma
// aserción contra el template viejo y exigir que FALLE es lo que distingue "el
// repo está sano" de "el test no está mirando" (CONSTITUTION.md, "romper
// deliberadamente lo que el chequeo dice cuidar").

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
// los avisos del template van por stderr, así que stdout queda JSON limpio.
const DRIVER = `import config from './eslint.config.awm.mjs';
const flat = config.flat(Infinity);
process.stdout.write(JSON.stringify({
  ignores: flat.flatMap((e) => (e && Array.isArray(e.ignores) ? e.ignores : [])),
  names: flat.flatMap((e) => (e && typeof e.name === 'string' ? [e.name] : [])),
  rules: flat.flatMap((e) => (e && e.rules ? Object.keys(e.rules) : [])),
  awmEntry: flat[flat.length - 1],
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

const ESM_PKG = '{ "type": "module" }';
const CJS_PKG = '{ "type": "commonjs" }';

// 1 — El caso que estaba roto: configuración llamada `eslint.config.js`.
{
  const run = runFixture({
    'package.json': ESM_PKG,
    'eslint.config.js': `export default [{ name: 'proyecto', ignores: ['dist/**', 'coverage/**'] }];`,
  });
  assert.equal(run.status, 0, `el template falló:\n${run.stderr}`);
  assert.deepEqual(run.config.ignores, ['dist/**', 'coverage/**']);
  assert.ok(run.config.names.includes('proyecto'));
}

// 2 — El nombre que ya funcionaba sigue funcionando.
{
  const run = runFixture({
    'package.json': ESM_PKG,
    'eslint.config.mjs': `export default [{ name: 'proyecto', ignores: ['build/**'] }];`,
  });
  assert.equal(run.status, 0, `el template falló:\n${run.stderr}`);
  assert.deepEqual(run.config.ignores, ['build/**']);
}

// 3 — Con varios candidatos presentes gana el primero del orden de ESLint.
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

// 4 — Un proyecto CommonJS con `eslint.config.cjs` también se hereda.
{
  const run = runFixture({
    'package.json': CJS_PKG,
    'eslint.config.cjs': `module.exports = [{ name: 'proyecto', ignores: ['lib/**'] }];`,
  });
  assert.equal(run.status, 0, `el template falló:\n${run.stderr}`);
  assert.deepEqual(run.config.ignores, ['lib/**']);
}

// 5 — Sin configuración del proyecto el sensor corre igual, pero lo dice.
{
  const run = runFixture({ 'package.json': ESM_PKG });
  assert.equal(run.status, 0, `el template falló:\n${run.stderr}`);
  assert.deepEqual(run.config.ignores, []);
  assert.match(run.stderr, /no se encontró configuración de ESLint/);
  assert.match(run.stderr, /eslint\.config\.js/);
  // Las reglas de AWM se aplican igual: degradar no es dejar de lintear.
  assert.ok(run.config.rules.includes('no-unreachable'));
}

// 6 — Una configuración que existe pero no carga rompe el sensor en vez de
//     degradarlo en silencio: un informe sin `ignores` parece verde y no lo es.
{
  const run = runFixture({
    'package.json': ESM_PKG,
    'eslint.config.js': `throw new Error('la config del proyecto explota');`,
  });
  assert.notEqual(run.status, 0, 'el template debía fallar y no falló');
  assert.match(run.stderr, /no se pudo cargar eslint\.config\.js/);
  assert.match(run.stderr, /la config del proyecto explota/);
}

// 7 — Lo mismo si el archivo carga pero no exporta un flat config.
{
  const run = runFixture({
    'package.json': ESM_PKG,
    'eslint.config.js': `export const reglas = [];`,
  });
  assert.notEqual(run.status, 0, 'el template debía fallar y no falló');
  assert.match(run.stderr, /no tiene `export default`/);
}

// 8 — Las reglas de AWM se añaden después de la configuración del proyecto.
{
  const run = runFixture({
    'package.json': ESM_PKG,
    'eslint.config.js': `export default [{ name: 'proyecto', rules: { eqeqeq: 'error' } }];`,
  });
  assert.equal(run.status, 0, `el template falló:\n${run.stderr}`);
  assert.deepEqual(run.config.rules, ['eqeqeq', 'no-unused-vars', 'no-undef', 'no-unreachable']);
}

// 9 — Las reglas base de AWM no alcanzan a TypeScript. Un bloque sin `files` se
//     aplica al final y pisa lo que el proyecto desactivó a propósito:
//     `no-undef` no ve los tipos ambientales y `no-unused-vars` marca los
//     nombres de parámetro de una firma en una interfaz. Son falsos positivos
//     estructurales — la misma clase de ruido que el `catch {}` vacío producía
//     desde `dist/`, y con el mismo efecto: un informe que nadie puede leer.
{
  const run = runFixture({
    'package.json': ESM_PKG,
    'eslint.config.js': `export default [{ name: 'proyecto' }];`,
  });
  assert.equal(run.status, 0, `el template falló:\n${run.stderr}`);
  const { awmEntry } = run.config;
  assert.ok(Array.isArray(awmEntry.files), 'el bloque de AWM debe acotar `files`');
  assert.deepEqual(awmEntry.files.filter((glob) => /\.tsx?$/.test(glob)), []);
  assert.deepEqual(awmEntry.files, ['**/*.js', '**/*.jsx', '**/*.mjs', '**/*.cjs']);
  assert.deepEqual(Object.keys(awmEntry.rules), ['no-unused-vars', 'no-undef', 'no-unreachable']);
}

// 10 — Mutación: el template viejo debe fallar el caso 1. Si esto pasara, el
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
    run.config.ignores,
    [],
    'el template viejo heredó los `ignores`: la mutación no reproduce el defecto y el caso 1 no prueba nada',
  );
}

for (const dir of workspaces) fs.rmSync(dir, { recursive: true, force: true });

console.log('sensor-pack-eslint: 10 casos OK');
