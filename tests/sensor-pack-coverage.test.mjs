import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { validateRegistryCoverage } from './support/sensor-pack-coverage-validator.mjs';
import { validatePackV2 } from './support/sensor-pack-v2-validator.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
validateRegistryCoverage(root);

const fixtureRoot = path.join(root, 'tests', 'fixtures', 'sensor-packs', 'valid', 'js-ts');
const fixture = JSON.parse(fs.readFileSync(path.join(fixtureRoot, 'pack.json'), 'utf8'));
if (fixture.schemaVersion !== 2 || fixture.coverage?.schemaVersion !== 1) {
  throw new Error('pack v2 must retain coverage.schemaVersion 1');
}
validatePackV2(fixture, fixtureRoot);

console.log('sensor-pack-coverage: 4 legacy packs + v2 fixture / contract v1 OK');
