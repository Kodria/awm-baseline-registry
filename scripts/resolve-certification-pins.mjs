import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'tests/fixtures/certification-pins.json');
const families = [
  ['eslint-8', 'eslint', 8], ['eslint-9', 'eslint', 9], ['eslint-10', 'eslint', 10],
  ['typescript', 'typescript', 5], ['prettier', 'prettier', 3], ['dependency-cruiser', 'dependency-cruiser', 16], ['stryker', '@stryker-mutator/core', 8],
];

function latestPatch(metadata, major) {
  const versions = Object.keys(metadata.versions ?? {}).filter((version) => new RegExp(`^${major}\\.\\d+\\.\\d+$`).test(version));
  assert.ok(versions.length > 0, `registry has no stable ${major}.x version`);
  return versions.sort((left, right) => left.localeCompare(right, undefined, { numeric: true })).at(-1);
}

async function resolve() {
  const pins = {};
  for (const [name, packageName, major] of families) {
    const source = `https://registry.npmjs.org/${encodeURIComponent(packageName)}`;
    const response = await fetch(source, { signal: AbortSignal.timeout(30_000) });
    if (!response.ok) throw new Error(`cannot resolve ${packageName}: registry returned ${response.status}`);
    const version = latestPatch(await response.json(), major);
    pins[name] = { package: packageName, version, source };
  }
  return { resolvedAt: new Date().toISOString(), pins };
}

if (!process.argv.includes('--write')) throw new Error('usage: node scripts/resolve-certification-pins.mjs --write');
const frozen = await resolve();
fs.writeFileSync(output, `${JSON.stringify(frozen, null, 2)}\n`);
console.log(`certification pins written: ${output}`);
