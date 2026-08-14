import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const id = /^[a-z][a-z0-9-]*$/;
const probes = new Set(['version', 'eslint-print-config', 'typescript-show-config', 'semgrep-validate', 'package-script-present', 'config-present']);
const resolutions = new Set(['node-modules-bin', 'python-environment', 'path']);
const shells = new Set(['sh', 'bash', 'cmd', 'powershell']);

function object(value, message) {
  assert.ok(value && typeof value === 'object' && !Array.isArray(value), message);
  return value;
}

function exactFields(value, allowed, message) {
  assert.ok(Object.keys(value).every((key) => allowed.includes(key)), message);
}

function text(value, message) {
  assert.ok(typeof value === 'string' && value.trim() && !/[\0\r\n]/.test(value), message);
  return value;
}

function stableId(value, message) {
  assert.match(text(value, message), id, message);
  return value;
}

function nonemptyStrings(value, message) {
  assert.ok(Array.isArray(value) && value.length > 0, message);
  return value.map((item) => text(item, message));
}

function assetPath(value, message) {
  text(value, message);
  assert.ok(!path.isAbsolute(value) && !value.includes('\\') && !value.split('/').some((part) => ['', '.', '..'].includes(part)), `${message}: asset outside pack`);
  return value;
}

function parseRange(value, message) {
  text(value, message);
  const bounds = { lower: null, upper: null };
  for (const comparator of value.trim().split(/\s+/)) {
    const match = comparator.match(/^(>=|>|<=|<|=)?v?(\d+)(?:\.(\d+))?(?:\.(\d+))?$/);
    assert.ok(match, message);
    const version = [Number(match[2]), Number(match[3] ?? 0), Number(match[4] ?? 0)];
    const operator = match[1] ?? '=';
    if (operator === '>' || operator === '>=') bounds.lower = { version, inclusive: operator === '>=' };
    else if (operator === '<' || operator === '<=') bounds.upper = { version, inclusive: operator === '<=' };
    else bounds.lower = bounds.upper = { version, inclusive: true };
  }
  return bounds;
}

function compare(left, right) {
  for (let index = 0; index < 3; index += 1) if (left[index] !== right[index]) return left[index] - right[index];
  return 0;
}

function overlaps(left, right) {
  const lower = !left.lower ? right.lower : !right.lower ? left.lower : compare(left.lower.version, right.lower.version) >= 0 ? left.lower : right.lower;
  const upper = !left.upper ? right.upper : !right.upper ? left.upper : compare(left.upper.version, right.upper.version) <= 0 ? left.upper : right.upper;
  if (!lower || !upper) return true;
  const relation = compare(lower.version, upper.version);
  return relation < 0 || (relation === 0 && lower.inclusive && upper.inclusive);
}

function assertAsset(packRoot, asset, message) {
  const target = path.resolve(packRoot, asset);
  const realRoot = fs.realpathSync(packRoot);
  assert.ok(fs.existsSync(target), `${message}: asset '${asset}' exists`);
  const realTarget = fs.realpathSync(target);
  const relative = path.relative(realRoot, realTarget);
  assert.ok(relative && !relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative), `${message}: asset '${asset}' outside pack`);
  assert.ok(fs.statSync(realTarget).isFile(), `${message}: asset '${asset}' must be a regular file`);
}

function validateCommand(command, where, assets) {
  object(command, `${where}: structured command must be an object`);
  exactFields(command, ['executable', 'resolution', 'args', 'fileInput'], `${where}: structured command has unknown fields`);
  const executable = text(command.executable, `${where}: structured command executable required`);
  assert.match(executable, /^[A-Za-z0-9][A-Za-z0-9._-]*$/, `${where}: structured command executable must be logical`);
  assert.ok(!shells.has(executable.toLowerCase().replace(/\.exe$/, '')), `${where}: structured command must not use a shell`);
  assert.ok(resolutions.has(command.resolution), `${where}: structured command resolution invalid`);
  const args = nonemptyStrings(command.args, `${where}: structured command args required`);
  for (const arg of args) assert.ok(!arg.includes('{files}') || arg === '{files}', `${where}: structured command cannot embed {files}`);
  if (command.fileInput) {
    object(command.fileInput, `${where}: fileInput must be object`);
    exactFields(command.fileInput, ['placeholder', 'extensions'], `${where}: fileInput unknown field`);
    assert.equal(command.fileInput.placeholder, '{files}', `${where}: fileInput placeholder invalid`);
    nonemptyStrings(command.fileInput.extensions, `${where}: fileInput extensions required`).forEach((extension) => assert.match(extension, /^\.[A-Za-z0-9]+$/, `${where}: fileInput extension invalid`));
    assert.equal(args.filter((arg) => arg === '{files}').length, 1, `${where}: fileInput requires exactly one {files}`);
  } else assert.ok(!args.includes('{files}'), `${where}: {files} requires fileInput`);
  for (const arg of args.filter((arg) => /\.awm\.[A-Za-z0-9]+$/.test(arg))) assert.ok(assets.includes(arg), `${where}: command asset '${arg}' must be declared`);
}

export function validatePackV2(pack, packRoot) {
  object(pack, 'pack must be an object');
  assert.ok(typeof packRoot === 'string' && packRoot, 'pack root required');
  exactFields(pack, ['schemaVersion', 'name', 'description', 'detects', 'sensors', 'coverage'], 'pack has unknown fields');
  assert.equal(pack.schemaVersion, 2, 'unsupported schemaVersion; supported: 2');
  stableId(pack.name, 'pack name must be a stable id');
  text(pack.description, 'pack description required');
  nonemptyStrings(pack.detects, 'pack detects must be a nonempty array');
  const sensors = object(pack.sensors, 'pack sensors required');
  assert.ok(Object.keys(sensors).length > 0, 'pack sensors must be nonempty');
  const allVariantIds = new Set();

  for (const [sensorId, sensor] of Object.entries(sensors)) {
    stableId(sensorId, 'sensor id must be stable');
    object(sensor, `${sensorId}: sensor must be object`);
    exactFields(sensor, ['applicability', 'variants', 'fast'], `${sensorId}: sensor has unknown fields`);
    const applicability = object(sensor.applicability, `${sensorId}: applicability required`);
    exactFields(applicability, ['allFiles', 'anyFiles', 'kind'], `${sensorId}: applicability has unknown fields`);
    assert.ok(Object.keys(applicability).length > 0, `${sensorId}: applicability requires a condition`);
    for (const key of ['allFiles', 'anyFiles']) if (key in applicability) nonemptyStrings(applicability[key], `${sensorId}: ${key} required`).forEach((file) => assetPath(file, `${sensorId}: applicability path invalid`));
    if ('kind' in applicability) text(applicability.kind, `${sensorId}: applicability kind invalid`);
    if ('fast' in sensor) assert.equal(typeof sensor.fast, 'boolean', `${sensorId}: fast must be boolean`);
    assert.ok(Array.isArray(sensor.variants) && sensor.variants.length > 0, `${sensorId}: variants must be nonempty`);
    const seen = [];
    for (const variant of sensor.variants) {
      object(variant, `${sensorId}: variant must be object`);
      exactFields(variant, ['id', 'priority', 'requirements', 'certifiedRange', 'command', 'assets', 'formatter', 'probe'], `${sensorId}: variant has unknown fields`);
      const variantId = stableId(variant.id, `${sensorId}: variant id must be stable`);
      assert.ok(!allVariantIds.has(variantId), `${sensorId}: variant id '${variantId}' must be globally unique`);
      allVariantIds.add(variantId);
      assert.ok(Number.isSafeInteger(variant.priority), `${sensorId}: variant priority must be an integer`);
      const requirements = object(variant.requirements, `${sensorId}: requirements required`);
      exactFields(requirements, ['tool', 'toolRange', 'runtime', 'runtimeRange', 'configFiles'], `${sensorId}: requirements has unknown fields`);
      text(requirements.tool, `${sensorId}: tool required`); text(requirements.runtime, `${sensorId}: runtime required`);
      const toolRange = parseRange(requirements.toolRange, `${sensorId}: toolRange invalid`);
      const runtimeRange = parseRange(requirements.runtimeRange, `${sensorId}: runtimeRange invalid`);
      parseRange(variant.certifiedRange, `${sensorId}: certifiedRange invalid`);
      const assets = nonemptyStrings(variant.assets, `${sensorId}: assets must be nonempty`).map((asset) => assetPath(asset, `${sensorId}: asset path invalid`));
      assert.equal(new Set(assets).size, assets.length, `${sensorId}: duplicate assets`);
      assets.forEach((asset) => assertAsset(packRoot, asset, `${sensorId}: asset`));
      if ('configFiles' in requirements) nonemptyStrings(requirements.configFiles, `${sensorId}: configFiles required`).forEach((asset) => assert.ok(assets.includes(assetPath(asset, `${sensorId}: configFile invalid`)), `${sensorId}: configFile must be an asset`));
      validateCommand(variant.command, `${sensorId}: variant`, assets);
      text(variant.formatter, `${sensorId}: formatter required`);
      object(variant.probe, `${sensorId}: probe required`); exactFields(variant.probe, ['kind'], `${sensorId}: probe has unknown fields`);
      assert.ok(probes.has(variant.probe.kind), `${sensorId}: probe must be a closed supported kind`);
      seen.push({ id: variantId, priority: variant.priority, toolRange, runtimeRange });
    }
    for (let left = 0; left < seen.length; left += 1) for (let right = left + 1; right < seen.length; right += 1) {
      const a = seen[left]; const b = seen[right];
      assert.ok(a.priority !== b.priority || !overlaps(a.toolRange, b.toolRange) || !overlaps(a.runtimeRange, b.runtimeRange), `${sensorId}: equal-priority overlap between '${a.id}' and '${b.id}'`);
    }
  }

  const coverage = object(pack.coverage, 'coverage required');
  exactFields(coverage, ['schemaVersion', 'classes'], 'coverage has unknown fields');
  assert.equal(coverage.schemaVersion, 1, 'coverage.schemaVersion must remain 1');
  const classes = object(coverage.classes, 'coverage classes required');
  for (const [classId, definition] of Object.entries(classes)) {
    stableId(classId, 'coverage class id must be stable');
    object(definition, `${classId}: coverage class must be object`);
    assert.ok(Array.isArray(definition.detectors) && definition.detectors.length > 0, `${classId}: coverage detectors required`);
    assert.doesNotMatch(`${classId} ${definition.description ?? ''}`.toLowerCase(), /agentic-workflow|kodria/, `${classId}: coverage class must be generic`);
    for (const detector of definition.detectors) {
      object(detector, `${classId}: detector must be object`);
      stableId(detector.sensor, `${classId}: detector sensor invalid`);
      assert.ok(Object.hasOwn(sensors, detector.sensor), `${classId}: detector references undeclared sensor '${detector.sensor}'`);
    }
  }
}
