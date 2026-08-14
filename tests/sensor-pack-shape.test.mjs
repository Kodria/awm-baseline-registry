// Validación estructural de `sensor-packs/<name>/pack.json`.
//
// No existía ningún chequeo — ni de forma, ni de JSON válido — sobre pack.json
// en todo el repo antes de este archivo: `validate-portability.mjs` solo mira
// markdown en skills/agents/references, y `sensor-pack-eslint.test.mjs` prueba
// el comportamiento en runtime de un único template (`eslint.config.awm.mjs`),
// no la forma del manifiesto. Un `pack.json` malformado rompe en silencio a
// cualquier proyecto que adopte ese pack vía `awm sensors init`
// (`readPackDefaults()` en el CLI lo lee tal cual, sin validar).
//
// Este test corre en el `validate.yml`/`auto-tag.yml` de este repo, que son
// solo-Node — no instalan semgrep/mypy/ruff/shellcheck — así que se limita a
// forma y invariantes estáticas (JSON válido, campos requeridos, `{files}`
// presente en todo `changedCmd`, `configFile` apunta a un archivo que existe
// al lado del pack.json). La corrección semántica de las reglas de cada
// `.semgrep.awm.yml` y de los comandos de cada sensor se verificó a mano con
// los binarios reales (semgrep/mypy/ruff/shellcheck) al escribir los packs
// `python` y `shell` — ver el reporte de esa sesión.

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validatePackV2 } from './support/sensor-pack-v2-validator.mjs';
import './sensor-pack-schema-equivalence.test.mjs';
import './sensor-pack-js-ts-variants.test.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packsDir = path.join(repoRoot, 'sensor-packs');
const schemaPath = path.join(packsDir, 'pack.schema.json');
assert.ok(fs.existsSync(schemaPath), 'sensor-packs/pack.schema.json is required for pack v2 authors');
assert.doesNotThrow(() => JSON.parse(fs.readFileSync(schemaPath, 'utf8')), 'pack.schema.json must be valid JSON');
const readme = fs.readFileSync(path.join(packsDir, 'README.md'), 'utf8');
const readmeExample = readme.match(/```json\n(\{[\s\S]*?\n\})\n```/);
assert.ok(readmeExample, 'sensor-packs README must contain a JSON v2 example');
const documentedPack = JSON.parse(readmeExample[1]);
assert.ok(Object.keys(documentedPack.coverage.classes).length > 0, 'sensor-packs README v2 example must declare a coverage class');
const documentedCoverage = documentedPack.coverage.classes[Object.keys(documentedPack.coverage.classes)[0]];
assert.equal(typeof documentedCoverage.description, 'string');
assert.ok(Array.isArray(documentedCoverage.detectors) && documentedCoverage.detectors.length > 0);
assert.ok(documentedCoverage.remedy && typeof documentedCoverage.remedy === 'object');

for (const workflow of ['validate.yml', 'auto-tag.yml']) {
  const contents = fs.readFileSync(path.join(repoRoot, '.github', 'workflows', workflow), 'utf8');
  assert.match(contents, /node tests\/sensor-pack-shape\.test\.mjs/, `${workflow} must execute schema equivalence through the shape gate`);
}
const packNames = fs
  .readdirSync(packsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

// Al menos los packs que este repo sabe que debe tener — una futura
// eliminación accidental de un directorio no pasa desapercibida.
for (const expected of ['generic', 'js-ts', 'python', 'shell']) {
  assert.ok(packNames.includes(expected), `falta el pack esperado '${expected}'`);
}

let sensorsChecked = 0;

for (const name of packNames) {
  const packDir = path.join(packsDir, name);
  const packJsonPath = path.join(packDir, 'pack.json');
  assert.ok(fs.existsSync(packJsonPath), `${name}: no tiene pack.json`);

  const raw = fs.readFileSync(packJsonPath, 'utf8');
  let pack;
  try {
    pack = JSON.parse(raw);
  } catch (error) {
    assert.fail(`${name}/pack.json no es JSON válido: ${error.message}`);
  }

  if (Object.hasOwn(pack, 'schemaVersion')) {
    validatePackV2(pack, packDir);
    continue;
  }

  assert.equal(typeof pack.name, 'string', `${name}: 'name' debe ser string`);
  assert.equal(pack.name, name, `${name}: 'name' (${pack.name}) debe coincidir con el directorio`);
  assert.equal(typeof pack.description, 'string', `${name}: falta 'description'`);
  assert.ok(pack.description.length > 0, `${name}: 'description' vacía`);
  assert.ok(Array.isArray(pack.detects), `${name}: 'detects' debe ser array (puede ser vacío)`);
  assert.ok(
    pack.sensors && typeof pack.sensors === 'object' && !Array.isArray(pack.sensors),
    `${name}: falta 'sensors' (objeto)`,
  );
  assert.ok(Object.keys(pack.sensors).length > 0, `${name}: 'sensors' no puede estar vacío`);

  for (const [sensorName, sensor] of Object.entries(pack.sensors)) {
    sensorsChecked += 1;
    const where = `${name}.sensors.${sensorName}`;

    assert.equal(typeof sensor.defaultCmd, 'string', `${where}: falta 'defaultCmd' (string)`);
    assert.ok(sensor.defaultCmd.trim().length > 0, `${where}: 'defaultCmd' vacío`);

    if ('fast' in sensor) {
      assert.equal(typeof sensor.fast, 'boolean', `${where}: 'fast' debe ser boolean`);
    }
    if ('enabled' in sensor) {
      assert.equal(typeof sensor.enabled, 'boolean', `${where}: 'enabled' debe ser boolean`);
    }
    assert.equal(typeof sensor.formatter, 'string', `${where}: falta 'formatter' (string)`);
    assert.ok(sensor.formatter.trim().length > 0, `${where}: 'formatter' vacío`);

    // changedCmd es opt-in: solo tiene sentido cuando un hallazgo es propiedad
    // del archivo en que vive (lint/security), nunca en un chequeo
    // whole-program (typecheck/mypy) — mismo criterio que js-ts.typecheck.
    if ('changedCmd' in sensor) {
      assert.equal(typeof sensor.changedCmd, 'string', `${where}: 'changedCmd' debe ser string`);
      assert.ok(
        sensor.changedCmd.includes('{files}'),
        `${where}: 'changedCmd' no tiene el placeholder literal '{files}'`,
      );
      // changedExtensions es a su vez opt-in dentro de changedCmd: ausente
      // significa "acepta cualquier archivo cambiado" (SensorConfig, tipos del
      // CLI) — así vienen hoy generic.security y js-ts.security (semgrep sobre
      // cualquier extensión). Cuando SÍ está presente, debe tener forma válida.
      if ('changedExtensions' in sensor) {
        assert.ok(
          Array.isArray(sensor.changedExtensions) && sensor.changedExtensions.length > 0,
          `${where}: 'changedExtensions' presente pero vacía`,
        );
        for (const ext of sensor.changedExtensions) {
          assert.ok(
            typeof ext === 'string' && ext.startsWith('.'),
            `${where}: changedExtensions '${ext}' debe empezar con '.'`,
          );
        }
      }
    }

    // configFile: el archivo debe existir junto al pack.json (es lo que
    // `awm sensors init` copia a la raíz del proyecto).
    if ('configFile' in sensor) {
      const configPath = path.join(packDir, sensor.configFile);
      assert.ok(
        fs.existsSync(configPath),
        `${where}: configFile '${sensor.configFile}' no existe en ${packDir}`,
      );
    }
    if ('configFileFallback' in sensor) {
      const fallbackPath = path.join(packDir, sensor.configFileFallback);
      assert.ok(
        fs.existsSync(fallbackPath),
        `${where}: configFileFallback '${sensor.configFileFallback}' no existe en ${packDir}`,
      );
    }
  }
}

// Mutación: el schema exige `enabled: false` en placeholders no cableados —
// que "mutation" en python/shell no aparezca prendido por accidente.
{
  const pythonPack = JSON.parse(
    fs.readFileSync(path.join(packsDir, 'python', 'pack.json'), 'utf8'),
  );
  assert.equal(
    pythonPack.sensors.mutation?.enabled,
    false,
    "python.sensors.mutation debe ser 'enabled: false' (placeholder, no cableado)",
  );
}

// python.typecheck (mypy) es whole-program, igual que js-ts.typecheck (tsc):
// no debe tener changedCmd.
{
  const pythonPack = JSON.parse(
    fs.readFileSync(path.join(packsDir, 'python', 'pack.json'), 'utf8'),
  );
  assert.ok(
    !('changedCmd' in pythonPack.sensors.typecheck),
    'python.sensors.typecheck (mypy) no debe tener changedCmd — es whole-program, no se acota',
  );
}

// El pack `shell` no debe describirse con formatters de otro lenguaje — el
// gap conocido es que el CLI aún despacha el parser por NOMBRE de sensor
// (Task 3.3), no por este campo; lo que este repo controla es que el campo
// diga la verdad.
{
  const shellPack = JSON.parse(fs.readFileSync(path.join(packsDir, 'shell', 'pack.json'), 'utf8'));
  assert.notEqual(shellPack.sensors.lint.formatter, 'eslint-llm');
  assert.notEqual(shellPack.sensors.security.formatter, 'tsc');
}

console.log(`sensor-pack-shape: ${packNames.length} packs / ${sensorsChecked} sensores OK`);
