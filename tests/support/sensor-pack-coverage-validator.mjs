import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const expected = {
  generic: ['hardcoded-secrets'],
  'js-ts': ['dependency-boundaries', 'dynamic-code-execution', 'formatting', 'hardcoded-secrets', 'lint-errors', 'project-style-conventions', 'regression-tests', 'sql-string-construction', 'static-type-errors'],
  python: ['dynamic-code-execution', 'hardcoded-secrets', 'lint-errors', 'regression-tests', 'sql-string-construction', 'static-type-errors', 'subprocess-shell-injection', 'unsafe-deserialization'],
  shell: ['dynamic-code-execution', 'hardcoded-secrets', 'remote-code-pipe-to-shell', 'shell-lint-errors', 'unquoted-command-substitution'],
};
const id = /^[a-z][a-z0-9-]*$/;

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function assertSafeEvidencePath(packName, classId, packDirectory, evidenceFile) {
  const relativePath = evidenceFile.path;
  assert.ok(nonEmptyString(relativePath) && !path.isAbsolute(relativePath) && !relativePath.split(/[\\/]/).some((part) => ['', '.', '..'].includes(part)), `${packName}.${classId}: path inválido`);
  assert.ok(nonEmptyString(packDirectory), `${packName}.${classId}: directorio de pack requerido`);

  const realPackDirectory = fs.realpathSync(packDirectory);
  const candidate = path.resolve(packDirectory, relativePath);
  const relativeCandidate = path.relative(realPackDirectory, candidate);
  assert.ok(relativeCandidate && !relativeCandidate.startsWith(`..${path.sep}`) && relativeCandidate !== '..' && !path.isAbsolute(relativeCandidate), `${packName}.${classId}: path fuera del pack`);
  return { candidate, realPackDirectory, relativePath };
}

function readEvidenceFile(packName, classId, packDirectory, evidenceFile) {
  const { candidate, realPackDirectory, relativePath } = assertSafeEvidencePath(packName, classId, packDirectory, evidenceFile);
  assert.ok(fs.existsSync(candidate), `${packName}.${classId}: archivo de evidencia '${relativePath}' no existe en el pack`);
  const realCandidate = fs.realpathSync(candidate);
  const relativeRealCandidate = path.relative(realPackDirectory, realCandidate);
  assert.ok(relativeRealCandidate && !relativeRealCandidate.startsWith(`..${path.sep}`) && relativeRealCandidate !== '..' && !path.isAbsolute(relativeRealCandidate), `${packName}.${classId}: archivo de evidencia '${relativePath}' sale del pack`);
  assert.ok(fs.statSync(realCandidate).isFile(), `${packName}.${classId}: evidencia '${relativePath}' debe ser archivo regular`);
  return fs.readFileSync(realCandidate, 'utf8');
}

export function validateCoverage(packName, pack, packDirectory) {
  assert.ok(Object.hasOwn(expected, packName), `${packName}: pack de coverage desconocido`);
  assert.ok(pack && typeof pack === 'object' && !Array.isArray(pack), `${packName}: pack debe ser objeto`);
  const { coverage } = pack;
  assert.ok(coverage && typeof coverage === 'object' && !Array.isArray(coverage), `${packName}: coverage debe ser objeto`);
  assert.deepEqual(Object.keys(coverage).sort(), ['classes', 'schemaVersion'], `${packName}.coverage: campos desconocidos`);
  assert.equal(coverage.schemaVersion, 1, `${packName}.coverage.schemaVersion debe ser 1`);
  assert.ok(coverage.classes && typeof coverage.classes === 'object' && !Array.isArray(coverage.classes), `${packName}.coverage.classes debe ser objeto`);
  assert.deepEqual(Object.keys(coverage.classes).sort(), expected[packName], `${packName}: catálogo de clases inesperado`);

  for (const [classId, value] of Object.entries(coverage.classes)) {
    assert.match(classId, id, `${packName}.${classId}: id inválido`);
    assert.ok(value && typeof value === 'object' && !Array.isArray(value), `${packName}.${classId}: clase debe ser objeto`);
    assert.deepEqual(Object.keys(value).sort(), ['description', 'detectors', 'remedy'], `${packName}.${classId}: campos desconocidos`);
    assert.ok(nonEmptyString(value.description), `${packName}.${classId}: description vacía`);
    assert.ok(Array.isArray(value.detectors) && value.detectors.length > 0, `${packName}.${classId}: detectors debe ser array no vacío`);
    assert.ok(value.remedy && typeof value.remedy === 'object' && !Array.isArray(value.remedy), `${packName}.${classId}: remedy debe ser objeto`);
    assert.deepEqual(Object.keys(value.remedy).sort(), ['command', 'summary'], `${packName}.${classId}.remedy: campos desconocidos`);
    assert.ok(nonEmptyString(value.remedy.summary), `${packName}.${classId}.remedy.summary vacía`);
    assert.ok(nonEmptyString(value.remedy.command), `${packName}.${classId}.remedy.command vacío`);
    assert.doesNotMatch(`${classId} ${value.description} ${value.remedy.summary}`.toLowerCase(), /agentic-workflow|kodria|agent-vps|r2-js-ts-gap/, `${packName}.${classId}: clase acoplada a proyecto`);

    for (const detector of value.detectors) {
      assert.ok(detector && typeof detector === 'object' && !Array.isArray(detector), `${packName}.${classId}: detector debe ser objeto`);
      assert.deepEqual(Object.keys(detector).sort(), detector.evidence ? ['evidence', 'sensor'] : ['sensor'], `${packName}.${classId}: detector con campos desconocidos`);
      assert.ok(nonEmptyString(detector.sensor) && id.test(detector.sensor), `${packName}.${classId}: sensor inválido`);
      const sensor = pack.sensors?.[detector.sensor];
      assert.ok(sensor && typeof sensor === 'object' && !Array.isArray(sensor), `${packName}.${classId}: sensor '${detector.sensor}' no existe en pack.sensors`);
      const commands = nonEmptyString(sensor.defaultCmd)
        ? [sensor.defaultCmd]
        : Array.isArray(sensor.variants)
          ? sensor.variants.map((variant) => `${variant.command?.executable ?? ''} ${(variant.command?.args ?? []).join(' ')}`.trim())
          : [];
      assert.ok(commands.length > 0 && commands.every(nonEmptyString), `${packName}.${classId}: sensor '${detector.sensor}' no tiene comando válido`);
      if (!detector.evidence) continue;

      assert.ok(typeof detector.evidence === 'object' && !Array.isArray(detector.evidence), `${packName}.${classId}: evidence debe ser objeto`);
      assert.ok(Object.keys(detector.evidence).every((key) => ['commandIncludes', 'files'].includes(key)), `${packName}.${classId}: evidence con campos desconocidos`);
      assert.ok(Object.keys(detector.evidence).length > 0, `${packName}.${classId}: evidence no puede estar vacío`);
      if ('commandIncludes' in detector.evidence) {
        assert.ok(Array.isArray(detector.evidence.commandIncludes) && detector.evidence.commandIncludes.length > 0, `${packName}.${classId}: commandIncludes debe ser array no vacío`);
        detector.evidence.commandIncludes.forEach((part) => {
          assert.ok(nonEmptyString(part), `${packName}.${classId}: commandIncludes contiene texto vacío`);
          assert.ok(commands.some((command) => command.includes(part)), `${packName}.${classId}: commandIncludes '${part}' no está en ${detector.sensor}`);
        });
      }
      if ('files' in detector.evidence) {
        assert.ok(Array.isArray(detector.evidence.files) && detector.evidence.files.length > 0, `${packName}.${classId}: files debe ser array no vacío`);
        for (const file of detector.evidence.files) {
          assert.ok(file && typeof file === 'object' && !Array.isArray(file), `${packName}.${classId}: file debe ser objeto`);
          assert.deepEqual(Object.keys(file).sort(), ['containsAll', 'path'], `${packName}.${classId}: file con campos desconocidos`);
          assert.ok(Array.isArray(file.containsAll), `${packName}.${classId}: containsAll debe ser array`);
          file.containsAll.forEach((marker) => assert.ok(nonEmptyString(marker), `${packName}.${classId}: containsAll contiene texto vacío`));
          const isConsumerConfigException = packName === 'js-ts' && classId === 'project-style-conventions' && file.containsAll.length === 0;
          if (isConsumerConfigException) {
            assertSafeEvidencePath(packName, classId, packDirectory, file);
            continue;
          }
          const contents = readEvidenceFile(packName, classId, packDirectory, file);
          file.containsAll.forEach((marker) => assert.ok(contents.includes(marker), `${packName}.${classId}: marker '${marker}' no existe en '${file.path}'`));
        }
      }
    }
  }
}

export function validateRegistryCoverage(root) {
  assert.ok(nonEmptyString(root), 'root debe ser string no vacío');
  for (const packName of Object.keys(expected)) {
    const pack = JSON.parse(fs.readFileSync(path.join(root, 'sensor-packs', packName, 'pack.json'), 'utf8'));
    validateCoverage(packName, pack, path.join(root, 'sensor-packs', packName));
    assert.ok(!('mutation-testing' in pack.coverage.classes), `${packName}: mutation está fuera del baseline mientras enabled:false`);
  }
}

const invokedPath = process.argv[1];
if (nonEmptyString(invokedPath) && import.meta.url === pathToFileURL(path.resolve(invokedPath)).href) {
  validateRegistryCoverage(path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..'));
  console.log('sensor-pack-coverage: 4 packs / contrato v1 OK');
}
