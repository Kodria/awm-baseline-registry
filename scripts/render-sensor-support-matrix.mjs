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

function certificationEvidenceFor(tool) {
  if (['mypy', 'ruff', 'pytest'].includes(tool)) return 'Ubuntu: 3.9 + 3.12 real; macOS/Windows: 3.12 smoke';
  if (['semgrep', 'shellcheck'].includes(tool)) return 'Ubuntu: real tool; macOS/Windows: contract';
  return 'Ubuntu/macOS/Windows: contract';
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
    return { pack: pack.name, sensor, variant: variant.id, tool, range, osEvidence: certificationEvidenceFor(tool), status, evidence };
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
  const variants = stableRows(packs, pinsDocument.pins);
  const rows = variants.map(({ pack, sensor, variant, tool, range, osEvidence, status, evidence }) =>
    `| \`${pack}\` | \`${sensor}\` | \`${variant}\` | \`${tool}\` | \`${range}\` | ${operatingSystems} | ${osEvidence} | ${status} | ${evidence} |`,
  );
  const statusSummary = ['certified', 'compatible-unverified', 'not-applicable'].map((status) => {
    const count = variants.filter((variant) => variant.status === status).length;
    const meaning = {
      certified: 'Matching frozen tool pin',
      'compatible-unverified': 'No matching frozen tool pin',
      'not-applicable': 'Variant has no tool contract',
    }[status];
    return `| ${status} | ${count} | ${meaning} |`;
  });
  return [
    '# Sensor pack support',
    '',
    '<!-- BEGIN GENERATED: sensor-pack-support -->',
    `Generated from pack manifests and certification pins resolved at \`${pinsDocument.resolvedAt}\`.`,
    '',
    'Status: `certified` has a matching frozen tool pin; `compatible-unverified` has no matching frozen pin; `not-applicable` is reserved for variants without a tool contract.',
    '',
    '| Pack | Sensor | Variant | Tool | Certified range | Supported OS | OS certification evidence | Status | Evidence |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
    ...rows,
    '',
    '| Certification status | Derived variant count | Meaning |',
    '| --- | --- | --- |',
    ...statusSummary,
    '<!-- END GENERATED: sensor-pack-support -->',
    '',
  ].join('\n');
}

export function assertSensorSupportFresh(support, packs, pinsDocument) {
  assert.equal(typeof support, 'string', 'support matrix must be text');
  // Git can check out this generated document with CRLF on Windows. The
  // renderer's contract is LF, so compare normalized text rather than making
  // checkout EOL policy a false freshness failure.
  assert.equal(support.replace(/\r\n/g, '\n'), renderSensorSupport(packs, pinsDocument),
    'sensor-packs/SUPPORT.md is stale; run node scripts/render-sensor-support-matrix.mjs --write');
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
    assertSensorSupportFresh(fs.readFileSync(supportPath, 'utf8'), packs, pins);
    console.log('sensor support matrix is current');
  }
}
