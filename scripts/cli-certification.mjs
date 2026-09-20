#!/usr/bin/env node
/**
 * The registry declares THREE different CLI facts, and conflating any two of
 * them is what Kodria/agentic-workflow#164 is about:
 *
 *  - `minCliVersion` (awm-registry.json) is the compatibility FLOOR: the oldest
 *    CLI that can consume this content. It moves only when the content starts
 *    requiring something an older CLI cannot do.
 *  - `certifiedCli` (this file) is the IMMUTABLE PAIR the routing/protocol
 *    evidence rests on: an exact published version, the exact public commit it
 *    was built from, and the protocol digest observed on it. Declared, never
 *    derived at run time. It moves only on re-certification.
 *  - The version CI actually installs for consumer-facing acceptance is
 *    resolved from npm at run time. It is not declared anywhere, because it is
 *    not a claim — it is "whatever a user installing today would get".
 *
 * Before this split, `minCliVersion` carried all three meanings at once, so
 * every CLI patch release forced two hand edits here and turned registry CI red
 * in the meantime.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { isBareSemver, compareSemver } from './semver.mjs';

const SHA = /^[a-f0-9]{40}$/;
const DIGEST = /^[a-f0-9]{64}$/;
const MAX_BYTES = 8 * 1024;

function object(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be a JSON object`);
  return value;
}

function readBoundedJson(file, label) {
  const bytes = readFileSync(file);
  if (bytes.byteLength > MAX_BYTES) throw new Error(`${label} exceeds ${MAX_BYTES} bytes`);
  return object(JSON.parse(bytes.toString('utf8')), label);
}

/**
 * Reads and validates the declared certification, and proves it against the
 * floor. A certified CLI that does not itself satisfy `minCliVersion` is a
 * contradiction, not a warning, so it fails closed here rather than producing a
 * green CI run over an incoherent pair.
 */
export function readCliCertification(root = process.cwd()) {
  const resolved = path.resolve(root);
  const certification = readBoundedJson(path.join(resolved, 'cli-certification.json'), 'cli-certification.json');
  if (certification.schema !== 'cli-certification/v1') throw new Error(`cli-certification.json schema must be "cli-certification/v1", got ${JSON.stringify(certification.schema)}`);
  const certified = object(certification.certifiedCli, 'cli-certification.json certifiedCli');
  const controls = object(certification.negativeControls, 'cli-certification.json negativeControls');
  if (!isBareSemver(certified.version)) throw new Error(`certifiedCli.version must be a bare semantic version, got ${JSON.stringify(certified.version)}`);
  if (typeof certified.sourceSha !== 'string' || !SHA.test(certified.sourceSha)) throw new Error('certifiedCli.sourceSha must be a 40-character lowercase commit SHA');
  if (typeof certified.protocolDigest !== 'string' || !DIGEST.test(certified.protocolDigest)) throw new Error('certifiedCli.protocolDigest must be a 64-character lowercase sha256 digest');
  for (const name of ['routingCli', 'admissionCli']) {
    if (!isBareSemver(controls[name])) throw new Error(`negativeControls.${name} must be a bare semantic version, got ${JSON.stringify(controls[name])}`);
  }

  const manifest = readBoundedJson(path.join(resolved, 'awm-registry.json'), 'awm-registry.json');
  const floor = manifest.minCliVersion;
  if (!isBareSemver(floor)) throw new Error(`awm-registry.json minCliVersion must be a bare semantic version, got ${JSON.stringify(floor)}`);
  if (compareSemver(certified.version, floor, 'certifiedCli.version', 'minCliVersion') < 0) {
    throw new Error(`certifiedCli.version ${certified.version} is below the registry floor ${floor}: the certified CLI cannot be one this registry declares too old to consume it`);
  }
  for (const name of ['routingCli', 'admissionCli']) {
    if (compareSemver(controls[name], floor, `negativeControls.${name}`, 'minCliVersion') >= 0) {
      throw new Error(`negativeControls.${name} ${controls[name]} satisfies the registry floor ${floor}: a negative control must actually be below the floor it is meant to be rejected by`);
    }
  }
  return { floor, certified: { ...certified }, negativeControls: { ...controls } };
}

/** Rejects a floor the published CLI under test cannot satisfy, with the reason. */
export function assertFloorSatisfied(version, floor) {
  if (compareSemver(version, floor, 'published CLI version', 'minCliVersion') < 0) {
    throw new Error(`published CLI ${version} is below the registry floor ${floor}: raise the CLI or lower minCliVersion`);
  }
  return true;
}

/**
 * `KEY=value` lines for `>> "$GITHUB_ENV"`. Every value has already been proved
 * to be a bare semver or a lowercase hex string, so none of them can carry a
 * newline and forge an extra environment entry.
 */
export function environmentLines(certification) {
  return [
    `AWM_REGISTRY_MIN_CLI_VERSION=${certification.floor}`,
    `AWM_CERTIFIED_CLI_VERSION=${certification.certified.version}`,
    `AWM_CERTIFIED_CLI_SHA=${certification.certified.sourceSha}`,
    `AWM_CERTIFIED_CLI_PROTOCOL_DIGEST=${certification.certified.protocolDigest}`,
    `AWM_R2B_OLD_CLI_VERSION=${certification.negativeControls.routingCli}`,
    `AWM_R16_OLD_CLI_VERSION=${certification.negativeControls.admissionCli}`,
  ];
}

function main(argv) {
  const root = process.env.AWM_REGISTRY_ROOT || process.cwd();
  const certification = readCliCertification(root);
  const floorIndex = argv.indexOf('--assert-floor');
  if (floorIndex >= 0) {
    const version = argv[floorIndex + 1];
    if (!isBareSemver(version)) throw new Error(`--assert-floor needs a bare semantic version, got ${JSON.stringify(version)}`);
    assertFloorSatisfied(version, certification.floor);
    process.stdout.write(`${version} satisfies the registry floor ${certification.floor}\n`);
    return;
  }
  if (argv.includes('--env')) {
    process.stdout.write(`${environmentLines(certification).join('\n')}\n`);
    return;
  }
  process.stdout.write(`${JSON.stringify(certification)}\n`);
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  try { main(process.argv.slice(2)); }
  catch (error) { process.stderr.write(`${error instanceof Error ? error.message : 'cli certification failed'}\n`); process.exitCode = 1; }
}
