import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const supportPath = path.join(root, 'sensor-packs', 'SUPPORT.md');
const operatingSystems = 'Ubuntu, macOS, Windows';
const semgrepPolicy = { tool: 'semgrep', toolRange: '>=1.0.0', runtime: 'python', runtimeRange: '>=3.9.0' };

function parseVersion(value) {
  const match = String(value).match(/^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/);
  assert.ok(match, `version '${value}' must be a release semantic version`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function compareVersions(left, right) {
  for (let index = 0; index < 3; index += 1) if (left[index] !== right[index]) return left[index] < right[index] ? -1 : 1;
  return 0;
}

function satisfies(version, range) {
  const parsed = parseVersion(version);
  const comparators = String(range).trim().split(/\s+/).map((comparator) => {
    const match = comparator.match(/^(>=|>|<=|<|=)?v?(0|[1-9]\d*)(?:\.(0|[1-9]\d*))?(?:\.(0|[1-9]\d*))?$/);
    assert.ok(match, `unsupported semver comparator '${comparator}' in '${range}'`);
    return { operator: match[1] ?? '=', boundary: [Number(match[2]), Number(match[3] ?? 0), Number(match[4] ?? 0)] };
  });
  return comparators.every(({ operator, boundary }) => {
    const comparison = compareVersions(parsed, boundary);
    return ({ '>': comparison > 0, '>=': comparison >= 0, '<': comparison < 0, '<=': comparison <= 0, '=': comparison === 0 })[operator];
  });
}

function requirementsFor(variant) {
  return variant.requirements ?? (variant.policyRef === 'shared/semgrep-policy.json' ? semgrepPolicy : null);
}

export function classifyCertification(variant, pins) {
  assert.ok(variant && typeof variant === 'object' && !Array.isArray(variant), 'variant must be an object');
  assert.ok(pins && typeof pins === 'object' && !Array.isArray(pins), 'pins must be an object');
  const requirements = requirementsFor(variant);
  if (!requirements) return 'not-applicable';
  assert.equal(typeof requirements.tool, 'string', 'variant requirements.tool must be a string');
  assert.equal(typeof requirements.toolRange, 'string', 'variant requirements.toolRange must be a string');
  assert.equal(typeof variant.certifiedRange, 'string', 'variant certifiedRange must be a string');
  const matchingPins = Object.values(pins).filter((pin) => pin && pin.package === requirements.tool);
  return matchingPins.some((pin) => satisfies(pin.version, requirements.toolRange) && satisfies(pin.version, variant.certifiedRange))
    ? 'certified'
    : 'compatible-unverified';
}

function stableRows(packs, pins) {
  return packs.flatMap((pack) => Object.entries(pack.sensors).flatMap(([sensor, definition]) => definition.variants.map((variant) => {
    const requirements = requirementsFor(variant);
    const matchingPin = requirements && Object.values(pins).find((pin) => pin && pin.package === requirements.tool && satisfies(pin.version, requirements.toolRange) && satisfies(pin.version, variant.certifiedRange));
    const tool = requirements?.tool ?? '—';
    const range = variant.certifiedRange;
    const status = classifyCertification(variant, pins);
    const evidence = matchingPin ? `pin: \`${matchingPin.package}@${matchingPin.version}\`` : 'no matching pinned tool';
    return { pack: pack.name, sensor, variant: variant.id, tool, range, status, evidence };
  }))).sort((left, right) => [left.pack, left.sensor, left.variant].join('\0').localeCompare([right.pack, right.sensor, right.variant].join('\0')));
}

function validateInputs(packs, pinsDocument) {
  assert.ok(Array.isArray(packs) && packs.length > 0, 'packs must be a non-empty array');
  assert.ok(pinsDocument && typeof pinsDocument === 'object' && !Array.isArray(pinsDocument), 'pins document must be an object');
  assert.equal(typeof pinsDocument.resolvedAt, 'string', 'pins document resolvedAt must be a string');
  assert.ok(pinsDocument.resolvedAt.trim(), 'pins document resolvedAt must not be empty');
  assert.ok(pinsDocument.pins && typeof pinsDocument.pins === 'object' && !Array.isArray(pinsDocument.pins), 'pins document pins must be an object');
  for (const pack of packs) {
    assert.ok(pack && typeof pack === 'object' && !Array.isArray(pack), 'each pack must be an object');
    assert.equal(typeof pack.name, 'string', 'pack name must be a string');
    assert.ok(pack.sensors && typeof pack.sensors === 'object' && !Array.isArray(pack.sensors), `${pack.name} sensors must be an object`);
  }
}

export function renderSensorSupport(packs, pinsDocument) {
  validateInputs(packs, pinsDocument);
  const rows = stableRows(packs, pinsDocument.pins).map(({ pack, sensor, variant, tool, range, status, evidence }) =>
    `| \`${pack}\` | \`${sensor}\` | \`${variant}\` | \`${tool}\` | \`${range}\` | ${operatingSystems} | ${status} | ${evidence} |`,
  );
  return [
    '# Sensor pack support',
    '',
    '<!-- BEGIN GENERATED: sensor-pack-support -->',
    `Generated from pack manifests and certification pins resolved at \`${pinsDocument.resolvedAt}\`.`,
    '',
    'Status: `certified` has a matching frozen tool pin; `compatible-unverified` has no matching frozen pin; `not-applicable` is reserved for variants without a tool contract.',
    '',
    '| Pack | Sensor | Variant | Tool | Certified range | OS | Status | Evidence |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |',
    ...rows,
    '<!-- END GENERATED: sensor-pack-support -->',
    '',
  ].join('\n');
}

function loadProductionInputs() {
  const names = ['generic', 'js-ts', 'python', 'shell'];
  const packs = names.map((name) => JSON.parse(fs.readFileSync(path.join(root, 'sensor-packs', name, 'pack.json'), 'utf8')));
  const pins = JSON.parse(fs.readFileSync(path.join(root, 'tests', 'fixtures', 'certification-pins.json'), 'utf8'));
  return { packs, pins };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const mode = process.argv[2] ?? '--check';
  assert.ok(['--check', '--write'].includes(mode), 'usage: node scripts/render-sensor-support-matrix.mjs [--check|--write]');
  const { packs, pins } = loadProductionInputs();
  const rendered = renderSensorSupport(packs, pins);
  if (mode === '--write') {
    fs.writeFileSync(supportPath, rendered);
    console.log(`sensor support matrix written: ${path.relative(root, supportPath)}`);
  } else {
    assert.equal(fs.readFileSync(supportPath, 'utf8'), rendered, 'sensor-packs/SUPPORT.md is stale; run node scripts/render-sensor-support-matrix.mjs --write');
    console.log('sensor support matrix is current');
  }
}
