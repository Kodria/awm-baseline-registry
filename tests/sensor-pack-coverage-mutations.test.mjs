import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { validateRegistryCoverage } from './support/sensor-pack-coverage-validator.mjs';
import { validatePackV2 } from './support/sensor-pack-v2-validator.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'awm-sensor-pack-coverage-'));

function copyRegistry(destination) {
  fs.cpSync(root, destination, { recursive: true, filter: (source) => path.basename(source) !== '.git' });
}

function packFile(destination, packName) {
  return path.join(destination, 'sensor-packs', packName, 'pack.json');
}

function mutatePack(destination, packName, mutate) {
  const filename = packFile(destination, packName);
  const pack = JSON.parse(fs.readFileSync(filename, 'utf8'));
  mutate(pack);
  fs.writeFileSync(filename, `${JSON.stringify(pack, null, 2)}\n`);
}

function createExternalEvidenceSymlink(linkPath, externalFile) {
  try {
    fs.symlinkSync(externalFile, linkPath, 'file');
  } catch (error) {
    if (process.platform === 'win32' && ['EACCES', 'EPERM'].includes(error?.code)) {
      assert.fail(`Windows no permitió crear el symlink de mutación (${error.code}); habilitá Developer Mode o ejecutá el runner con privilegio CreateSymbolicLink para no ocultar este gate de seguridad`);
    }
    throw error;
  }
}

async function importValidatorWithoutLiteralMarkerCheck(destination) {
  const sourceFile = path.join(destination, 'tests', 'support', 'sensor-pack-coverage-validator.mjs');
  const source = fs.readFileSync(sourceFile, 'utf8');
  assert.match(source, /contents\.includes\(marker\)/, 'la variante histórica debe partir del check literal actual');
  const weakenedSource = source.replace('contents.includes(marker)', 'true');
  assert.notEqual(weakenedSource, source, 'la variante histórica debe omitir solo el check literal');
  const weakenedFile = path.join(destination, 'tests', 'support', 'sensor-pack-coverage-validator-without-marker-check.mjs');
  fs.writeFileSync(weakenedFile, weakenedSource);
  return import(pathToFileURL(weakenedFile).href);
}

async function importValidatorWithoutRealpathContainmentCheck(destination) {
  const sourceFile = path.join(destination, 'tests', 'support', 'sensor-pack-coverage-validator.mjs');
  const source = fs.readFileSync(sourceFile, 'utf8');
  const realpathCheck = "assert.ok(relativeRealCandidate && !relativeRealCandidate.startsWith(`..${path.sep}`) && relativeRealCandidate !== '..' && !path.isAbsolute(relativeRealCandidate), `${packName}.${classId}: archivo de evidencia '${relativePath}' sale del pack`);";
  assert.ok(source.includes(realpathCheck), 'la variante histórica debe partir del check de realpath actual');
  const weakenedSource = source.replace(realpathCheck, "assert.ok(true, `${packName}.${classId}: archivo de evidencia '${relativePath}' sale del pack`);");
  assert.notEqual(weakenedSource, source, 'la variante histórica debe omitir solo el check de salida real');
  const weakenedFile = path.join(destination, 'tests', 'support', 'sensor-pack-coverage-validator-without-realpath-containment.mjs');
  fs.writeFileSync(weakenedFile, weakenedSource);
  return import(pathToFileURL(weakenedFile).href);
}

const mutations = [
  ['future schema', (destination) => mutatePack(destination, 'generic', (pack) => { pack.coverage.schemaVersion = 2; })],
  ['unknown field', (destination) => mutatePack(destination, 'generic', (pack) => { pack.coverage.clases = {}; })],
  ['hostile path', (destination) => mutatePack(destination, 'generic', (pack) => { pack.coverage.classes['hardcoded-secrets'].detectors[0].evidence.files[0].path = '../outside'; })],
  ['empty detectors', (destination) => mutatePack(destination, 'generic', (pack) => { pack.coverage.classes['hardcoded-secrets'].detectors = []; })],
  ['project-coupled description', (destination) => mutatePack(destination, 'generic', (pack) => { pack.coverage.classes['hardcoded-secrets'].description = 'Secrets in agentic-workflow'; })],
  ['missing marker', (destination) => mutatePack(destination, 'generic', (pack) => { pack.coverage.classes['hardcoded-secrets'].detectors[0].evidence.files[0].containsAll = ['marker-that-does-not-exist']; })],
];

function assertV2CoverageSchemaMutation() {
  const fixtureDirectory = path.join(root, 'tests', 'fixtures', 'sensor-packs', 'valid', 'js-ts');
  const pack = JSON.parse(fs.readFileSync(path.join(fixtureDirectory, 'pack.json'), 'utf8'));
  pack.coverage.schemaVersion = 2;
  assert.throws(() => validatePackV2(pack, fixtureDirectory), /coverage\.schemaVersion/, 'v2 validator must reject a future nested coverage schema');
}

try {
  assertV2CoverageSchemaMutation();
  const historicalMarkerFixture = path.join(tempRoot, 'historical-missing-marker');
  copyRegistry(historicalMarkerFixture);
  mutations[5][1](historicalMarkerFixture);
  const { validateRegistryCoverage: validateWithoutLiteralMarkerCheck } = await importValidatorWithoutLiteralMarkerCheck(historicalMarkerFixture);
  assert.doesNotThrow(() => validateWithoutLiteralMarkerCheck(historicalMarkerFixture), 'sin la comprobación literal, el marker histórico habría sobrevivido');
  assert.throws(() => validateRegistryCoverage(historicalMarkerFixture), /marker-that-does-not-exist/, 'el gate real debe rechazar el marker histórico');

  const symlinkFixture = path.join(tempRoot, 'external-evidence-symlink');
  const externalEvidence = path.join(tempRoot, 'outside-the-pack.txt');
  copyRegistry(symlinkFixture);
  fs.writeFileSync(externalEvidence, 'awm-generic-no-hardcoded-secrets\n');
  const symlinkPath = path.join(symlinkFixture, 'sensor-packs', 'generic', 'outside-the-pack.txt');
  createExternalEvidenceSymlink(symlinkPath, externalEvidence);
  mutatePack(symlinkFixture, 'generic', (pack) => {
    pack.coverage.classes['hardcoded-secrets'].detectors[0].evidence.files[0].path = 'outside-the-pack.txt';
  });
  const { validateRegistryCoverage: validateWithoutRealpathContainmentCheck } = await importValidatorWithoutRealpathContainmentCheck(symlinkFixture);
  assert.doesNotThrow(
    () => validateWithoutRealpathContainmentCheck(symlinkFixture),
    'sin la comprobación de salida real, el symlink externo habría sobrevivido',
  );
  assert.throws(
    () => validateRegistryCoverage(symlinkFixture),
    /generic\.hardcoded-secrets: archivo de evidencia 'outside-the-pack\.txt' sale del pack/,
    'un evidence.file enlazado fuera del pack debe ser rechazado',
  );

  for (const [name, mutate] of mutations) {
    const fixture = path.join(tempRoot, name.replaceAll(' ', '-'));
    copyRegistry(fixture);
    mutate(fixture);
    assert.throws(() => validateRegistryCoverage(fixture), undefined, `mutación '${name}' sobrevivió`);
  }
  console.log('sensor-pack-coverage-mutations: 8 mutations rejected');
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
