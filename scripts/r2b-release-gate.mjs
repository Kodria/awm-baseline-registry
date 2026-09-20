#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { compareSemver } from './semver.mjs';

const semver = /^\d+\.\d+\.\d+$/;
const sha = /^[a-f0-9]{40}$/;
const digest = /^[a-f0-9]{64}$/;

function output(bin, args, cwd, env) {
  return execFileSync(bin, args, { cwd, encoding: 'utf8', env: { ...env, AWM_NO_UPDATE_CHECK: '1' } }).trim();
}

function requiredContract(value, expectedDigest) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('model-policy contract --json must return an object');
  if (value.schema !== 'routing-protocol/v1') throw new Error('candidate must report routing-protocol/v1');
  if (value.protocolDigest !== expectedDigest) throw new Error('candidate protocolDigest does not match immutable provenance');
  const schemas = value.supportedPlanSchemas;
  if (!Array.isArray(schemas) || schemas.length !== 2 || schemas[0] !== 'compact-slices/v1' || schemas[1] !== 'compact-slices/v2') throw new Error('candidate must advertise exactly compact-slices/v1 and compact-slices/v2');
  const profiles = value.implementerProfiles;
  if (!Array.isArray(profiles) || profiles.length !== 3 || profiles.join(',') !== 'mechanical,integration,judgment') throw new Error('candidate must advertise exactly the semantic implementer profiles');
  if (!Array.isArray(value.roles) || !value.roles.includes('implementer')) throw new Error('candidate must advertise routing roles');
}

export function verifyR2bReleaseGate({ mode, env = process.env, cwd = process.cwd() }) {
  if (mode !== 'prepublication' && mode !== 'published') throw new Error('--mode must be prepublication or published');
  const bin = env.AWM_R2B_CLI_BIN;
  const source = env.AWM_R2B_CLI_SOURCE;
  const sourceSha = env.AWM_R2B_CLI_SHA;
  const cliVersion = env.AWM_R2B_CLI_VERSION;
  const protocolDigest = env.AWM_R2B_PROTOCOL_DIGEST;
  for (const [name, value, pattern] of [
    ['AWM_R2B_CLI_BIN', bin], ['AWM_R2B_CLI_SOURCE', source], ['AWM_R2B_CLI_SHA', sourceSha, sha],
    ['AWM_R2B_CLI_VERSION', cliVersion, semver], ['AWM_R2B_PROTOCOL_DIGEST', protocolDigest, digest],
  ]) {
    if (!value || (pattern && !pattern.test(value))) throw new Error(`${name} must be supplied with a valid value`);
  }
  if (!existsSync(bin)) throw new Error('AWM_R2B_CLI_BIN must name the paired compiled or installed executable');
  if (!existsSync(source)) throw new Error('AWM_R2B_CLI_SOURCE must name the paired CLI source checkout');
  if (output('git', ['-C', source, 'rev-parse', 'HEAD'], cwd, env) !== sourceSha) throw new Error('candidate source SHA does not match immutable provenance');
  if (output(bin, ['--version'], cwd, env) !== cliVersion) throw new Error('candidate --version does not match immutable provenance');
  requiredContract(JSON.parse(output(bin, ['model-policy', 'contract', '--json'], cwd, env)), protocolDigest);
  const registryRoot = path.resolve(env.AWM_R2B_REGISTRY_ROOT || cwd);
  const manifestPath = path.join(registryRoot, 'awm-registry.json');
  if (!existsSync(manifestPath)) throw new Error('AWM_R2B_REGISTRY_ROOT must contain awm-registry.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest) || !semver.test(manifest.minCliVersion ?? '')) throw new Error('registry minCliVersion must be a semantic version');
  if (mode === 'published') {
    const tag = env.AWM_R2B_CLI_TAG;
    if (!tag || tag !== `v${cliVersion}`) throw new Error('AWM_R2B_CLI_TAG must exactly match the observed published CLI version');
    if (output('git', ['-C', source, 'rev-parse', `${tag}^{commit}`], cwd, env) !== sourceSha) throw new Error('observed CLI tag must resolve to the immutable source SHA');
    // `minCliVersion` is a compatibility FLOOR, not the exact version observed.
    // Demanding equality here is what forced a hand edit of the floor on every
    // CLI patch release and turned registry CI red in between — see
    // Kodria/agentic-workflow#164. What must hold is that the observed
    // published CLI is not one this registry declares too old to consume it.
    if (compareSemver(cliVersion, manifest.minCliVersion, 'AWM_R2B_CLI_VERSION', 'minCliVersion') < 0) {
      throw new Error(`observed published CLI ${cliVersion} is below the registry floor ${manifest.minCliVersion}: the candidate cannot be one this registry declares too old to consume it`);
    }
  }
  return {
    mode,
    cliVersion,
    sourceSha,
    protocolDigest,
    registryFloor: manifest.minCliVersion,
    floorSatisfied: compareSemver(cliVersion, manifest.minCliVersion, 'AWM_R2B_CLI_VERSION', 'minCliVersion') >= 0,
  };
}

function main() {
  const modeIndex = process.argv.indexOf('--mode');
  const mode = modeIndex >= 0 ? process.argv[modeIndex + 1] : undefined;
  const result = verifyR2bReleaseGate({ mode });
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  try { main(); } catch (error) { process.stderr.write(`${error instanceof Error ? error.message : 'R2B release gate failed'}\n`); process.exitCode = 1; }
}
