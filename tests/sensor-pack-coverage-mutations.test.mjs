import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { validateRegistryCoverage } from './support/sensor-pack-coverage-validator.mjs';

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

const mutations = [
  ['future schema', (destination) => mutatePack(destination, 'generic', (pack) => { pack.coverage.schemaVersion = 2; })],
  ['unknown field', (destination) => mutatePack(destination, 'generic', (pack) => { pack.coverage.clases = {}; })],
  ['hostile path', (destination) => mutatePack(destination, 'generic', (pack) => { pack.coverage.classes['hardcoded-secrets'].detectors[0].evidence.files[0].path = '../outside'; })],
  ['empty detectors', (destination) => mutatePack(destination, 'generic', (pack) => { pack.coverage.classes['hardcoded-secrets'].detectors = []; })],
  ['project-coupled description', (destination) => mutatePack(destination, 'generic', (pack) => { pack.coverage.classes['hardcoded-secrets'].description = 'Secrets in agentic-workflow'; })],
  ['missing marker', (destination) => mutatePack(destination, 'generic', (pack) => { pack.coverage.classes['hardcoded-secrets'].detectors[0].evidence.files[0].containsAll = ['marker-that-does-not-exist']; })],
];

try {
  const historicalMarkerFixture = path.join(tempRoot, 'historical-missing-marker');
  copyRegistry(historicalMarkerFixture);
  mutations[5][1](historicalMarkerFixture);
  const { validateRegistryCoverage: validateWithoutLiteralMarkerCheck } = await importValidatorWithoutLiteralMarkerCheck(historicalMarkerFixture);
  assert.doesNotThrow(() => validateWithoutLiteralMarkerCheck(historicalMarkerFixture), 'sin la comprobación literal, el marker histórico habría sobrevivido');
  assert.throws(() => validateRegistryCoverage(historicalMarkerFixture), /marker-that-does-not-exist/, 'el gate real debe rechazar el marker histórico');

  for (const [name, mutate] of mutations) {
    const fixture = path.join(tempRoot, name.replaceAll(' ', '-'));
    copyRegistry(fixture);
    mutate(fixture);
    assert.throws(() => validateRegistryCoverage(fixture), undefined, `mutación '${name}' sobrevivió`);
  }
  console.log('sensor-pack-coverage-mutations: 6 mutations rejected');
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
