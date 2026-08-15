import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const readJson = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('publishes the R3-compatible pack contract behind the released CLI floor', () => {
  const registry = readJson('awm-registry.json');
  const catalog = readJson('catalog.json');
  const dev = readJson('bundles/dev/bundle.json');

  assert.equal(registry.minCliVersion, '8.1.0');
  assert.equal(dev.version, '3.0.0');
  assert.equal(catalog.bundles.find(({ name }) => name === 'dev')?.version, '3.0.0');
});

test('records the R3 breaking release, migration, retro, and compatibility boundary', () => {
  const changelog = read('CHANGELOG.md');

  assert.match(changelog, /^## dev 3\.0\.0 — 2026-08-15$/m);
  assert.match(changelog, /`agentic-workflow-manager` `8\.1\.0`/);
  assert.match(changelog, /pack\.json.*v2/is);
  assert.match(changelog, /migration/i);
  assert.match(changelog, /retro/i);
  assert.match(changelog, /compatib/i);
});
