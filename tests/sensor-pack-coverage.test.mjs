import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateRegistryCoverage } from './support/sensor-pack-coverage-validator.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
validateRegistryCoverage(root);

console.log('sensor-pack-coverage: 4 packs / contrato v1 OK');
