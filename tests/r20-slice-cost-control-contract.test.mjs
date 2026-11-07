import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { compareSemver } from '../scripts/semver.mjs';
import { validatePackV2 } from './support/sensor-pack-v2-validator.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8').replace(/\r\n/g, '\n');

const DESIGN_POINTER = 'docs/plans/2026-11-07-slice-cost-control-registry-design.md';
const PKG = 'package.json';
const SCRIPT = 'test:slice-cost-control';
const CONTRACT = 'tests/r20-slice-cost-control-contract.test.mjs';
/** Published CLI that ships sliceCommand + evidence run/verify + ledger deferred APIs. */
const FIRST_CLI_WITH_SLICE_COST = '9.23.0';

function sectionAfterHeading(text, heading) {
  const lines = text.split('\n');
  const start = lines.findIndex((line) => line.trim() === heading);
  assert.ok(start >= 0, `missing heading ${heading}`);
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i += 1) {
    if (/^#{1,3} /.test(lines[i])) {
      end = i;
      break;
    }
  }
  return lines.slice(start, end).join('\n');
}

test('RF-R.0: design pointer exists and lists registry-owned RFs', () => {
  assert.equal(existsSync(path.join(root, DESIGN_POINTER)), true, `${DESIGN_POINTER} must exist`);
  const section = sectionAfterHeading(read(DESIGN_POINTER), '## Registry-owned RFs');
  for (const id of ['RF-2.4', 'RF-3.3', 'RF-4.5', 'RF-E.3', 'RF-6.3']) {
    assert.match(section, new RegExp(id.replace('.', '\\.')), `pointer must list ${id} under Registry-owned RFs`);
  }
});

test('RF-R.0: package.json wires test:slice-cost-control to this contract', () => {
  const pkg = JSON.parse(read(PKG));
  const cmd = pkg.scripts?.[SCRIPT];
  assert.equal(typeof cmd, 'string', `scripts.${SCRIPT} must be a string`);
  assert.match(cmd, /node --test/, `scripts.${SCRIPT} must run node --test`);
  assert.ok(cmd.includes('r20-slice-cost-control-contract'), `scripts.${SCRIPT} must point at ${CONTRACT}`);
  assert.equal(existsSync(path.join(root, CONTRACT)), true, `${CONTRACT} must exist`);
});

test('RF-6.3 / RF-1.5: minCliVersion and certifiedCli are at least FIRST_CLI_WITH_SLICE_COST; schema accepts sliceCommand', () => {
  assert.equal(FIRST_CLI_WITH_SLICE_COST, '9.23.0', 'FIRST_CLI_WITH_SLICE_COST must track published N');
  const registry = JSON.parse(read('awm-registry.json'));
  const cert = JSON.parse(read('cli-certification.json'));
  assert.ok(compareSemver(registry.minCliVersion, FIRST_CLI_WITH_SLICE_COST, 'minCliVersion', 'FIRST_CLI_WITH_SLICE_COST') >= 0,
    `minCliVersion ${registry.minCliVersion} must be >= ${FIRST_CLI_WITH_SLICE_COST}`);
  assert.ok(compareSemver(cert.certifiedCli.version, registry.minCliVersion, 'certifiedCli.version', 'minCliVersion') >= 0,
    `certifiedCli.version ${cert.certifiedCli.version} must be >= minCliVersion`);
  assert.equal(cert.certifiedCli.version, '9.23.0', 'certifiedCli must be re-certified to 9.23.0');
  assert.match(cert.certifiedCli.sourceSha, /^[a-f0-9]{40}$/);
  assert.match(cert.certifiedCli.protocolDigest, /^[a-f0-9]{64}$/);

  const schema = JSON.parse(read('sensor-packs/pack.schema.json'));
  assert.ok(schema.$defs.variant.properties.sliceCommand, 'schema must allow variant.sliceCommand');
  const allOf = schema.$defs.variant.allOf || [];
  const sliceGuard = allOf.some((rule) => rule?.if?.required?.includes('sliceCommand')
    && rule?.then?.properties?.sliceCommand?.required?.includes('fileInput'));
  assert.equal(sliceGuard, true, 'schema must require fileInput when sliceCommand is present');
});

test('RF-1.5: mirror validator accepts sliceCommand with fileInput and rejects without', () => {
  const base = JSON.parse(read('sensor-packs/js-ts/pack.json'));
  const packRoot = path.join(root, 'sensor-packs', 'js-ts');
  const variant = base.sensors.lint.variants[0];
  const withSlice = structuredClone(base);
  withSlice.sensors.lint.variants[0] = {
    ...variant,
    sliceCommand: {
      executable: 'eslint',
      resolution: 'node-modules-bin',
      args: ['--format', 'json', '{files}'],
      fileInput: { placeholder: '{files}', extensions: ['.ts'] },
    },
  };
  assert.doesNotThrow(() => validatePackV2(withSlice, packRoot));

  const missingInput = structuredClone(withSlice);
  delete missingInput.sensors.lint.variants[0].sliceCommand.fileInput;
  assert.throws(() => validatePackV2(missingInput, packRoot), /fileInput|sliceCommand/);
});

test('RF-2.4: setup-sensors teaches sliceCommand and --base', () => {
  const section = sectionAfterHeading(read('skills/setup-sensors/SKILL.md'), '## Authoring `inputs` and `closureOnly` (RF-3.2 / RF-3.6)');
  assert.match(section, /sliceCommand/, 'setup-sensors authoring section must name sliceCommand');
  assert.match(section, /--base/, 'setup-sensors must teach --base with sliceCommand');
  assert.match(section, /closureOnly/, 'setup-sensors must still explain closureOnly skip when sliceCommand absent');
});

test('RF-3.3 / RF-4 / RF-5: review-cycle-v1 encodes verify, defer ceiling, blocking map, duration warn', () => {
  const text = read('skills/subagent-driven-development/references/review-cycle-v1.md');
  const mechanical = sectionAfterHeading(text, '## Mechanical evidence');
  assert.match(mechanical, /awm evidence verify/, 'Mechanical evidence must name awm evidence verify');
  assert.match(mechanical, /match/, 'Mechanical evidence must require verify match');
  assert.match(mechanical, /CycleEvidenceV1|cycle evidence/i, 'must contrast MechanicalRunEvidence vs CycleEvidenceV1');

  const cut = sectionAfterHeading(text, '## Review cut and deferred findings');
  assert.match(cut, /first review|first round/i, 'RF-4.1 first round');
  assert.match(cut, /blocking/, 'RF-4.2/4.4 blocking language');
  assert.match(cut, /round-ceiling|three total rounds|3 rounds/i, 'RF-4.3 ceiling');
  assert.match(cut, /class\s*=\s*`?seguridad`?|class.*seguridad/i, 'RF-4.6 seguridad mapping');
  assert.match(cut, /severity\s*=\s*`?blocker`?|severity.*blocker/i, 'RF-4.6 blocker mapping');
  assert.match(cut, /Ambiguous or missing[\s\S]{0,80}class[\s\S]{0,40}severity[\s\S]{0,160}blocking until[\s\S]{0,20}clarified/i,
    'RF-4.6 fail-closed on ambiguous/missing class/severity');
  assert.match(cut, /never silent drop/i, 'RF-4.6 never silent drop');

  const bounded = sectionAfterHeading(text, '## Bounded measurement');
  assert.match(bounded, /durationMs|ledger/, 'RF-5.1 durable clocks');
  assert.match(bounded, /30\s*%|30%/, 'RF-5.2 30% threshold');
  assert.match(bounded, /20\s*min/i, 'RF-5.2 20 minute threshold');
});

test('RF-4.5 / RF-E.3: QA fails closed on deferred-open before awm-qa-complete', () => {
  const text = read('skills/post-implementation-qa/SKILL.md');
  assert.match(text, /ledger list --deferred-open/, 'QA must list deferred-open');
  assert.match(text, /ledger resolve --id <id> --how fixed/, 'QA must resolve with --how fixed');
  assert.match(text, /ledger resolve --id <id> --how accepted/, 'QA must resolve with --how accepted');
  assert.match(text, /QA report|findings disposition/i, 'accepted rationale must live outside ledger (no --note)');
  const markerIdx = text.indexOf('awm-qa-complete');
  assert.ok(markerIdx > 0, 'QA marker must exist');
  const beforeMarker = text.slice(Math.max(0, markerIdx - 2500), markerIdx);
  assert.match(beforeMarker, /deferred-open/, 'deferred-open gate must appear before awm-qa-complete discussion');
  assert.match(text, /fail closed|fails closed|no `?awm-qa-complete`?/i, 'RF-E.3 fail-closed language');
});

test('RF-2.4 / slice-start-sha: controller captures SHA before dispatch and injects it', () => {
  const sensorGate = sectionAfterHeading(read('skills/subagent-driven-development/SKILL.md'), '## Sensor Gate (AWM)');
  assert.match(sensorGate, /git rev-parse HEAD/, 'SDD controller must capture via git rev-parse HEAD');
  assert.match(sensorGate, /before the first implementer dispatch/i, 'capture must be before first dispatch');
  assert.match(sensorGate, /Keep the same SHA across fix/i, 'SHA must persist across fix rounds');
  assert.match(sensorGate, /never substitute[\s\S]{0,40}HEAD~1[\s\S]{0,40}origin\/main/i, 'must forbid invented bases');

  const implementer = read('skills/subagent-driven-development/implementer-prompt.md');
  assert.match(implementer, /controller-injected/, 'implementer must require controller-injected SHA');
  assert.match(implementer, /NEEDS_CONTEXT|BLOCKED/, 'implementer must escalate when SHA missing');

  const exec = read('skills/executing-plans/SKILL.md');
  assert.match(exec, /git rev-parse HEAD/, 'executing-plans must capture slice-start-sha');
  assert.match(exec, /Reuse that SHA|same SHA/i, 'executing-plans must reuse SHA across rounds');
});

test('RF-6.1: QA/docs/finish keep full gate; cached allowed; no --slice/--no-cache closure', () => {
  const qa = read('skills/post-implementation-qa/SKILL.md');
  assert.match(qa, /Full gate[\s\S]{0,400}?awm sensors run/, 'QA must require full gate sensors run');
  assert.match(qa, /[Cc]ache hits|cached: true|passes en caché|reutilizar passes en caché/, 'QA must allow cache hits');
  assert.doesNotMatch(qa, /awm sensors run[^\n]*--no-cache/, 'QA must not run sensors with --no-cache');

  const docs = read('skills/post-implementation-docs/SKILL.md');
  assert.match(docs, /sin.*--slice|no-flag|full gate|RF-5\.4/i, 'docs full gate');
  assert.match(docs, /cach[eé]/i, 'docs allow cache reuse');

  const finish = read('skills/finishing-a-development-branch/SKILL.md');
  assert.match(finish, /full gate[\s\S]{0,80}?--slice/i, 'finish forbids --slice as closure');
});
