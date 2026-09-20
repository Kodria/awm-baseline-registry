import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import * as installedAcceptance from './installed-admission-acceptance.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => readFileSync(path.join(root, file), 'utf8');
test('installed admission custody observation fails when a real journal artifact appears', () => {
  const sandbox = mkdtempSync(path.join(os.tmpdir(), 'awm-custody-observation-'));
  try {
    installedAcceptance.assertNoDispatchCustody(sandbox);
    mkdirSync(path.join(sandbox, '.awm', 'journal'), { recursive: true });
    assert.throws(() => installedAcceptance.assertNoDispatchCustody(sandbox), /journal custody/);
  } finally { rmSync(sandbox, { recursive: true, force: true }); }
});
test('QA ledger templates use supported structural class for test findings', () => {
  const prompt = read('skills/post-implementation-qa/deep-review-prompt.md');
  const check = text => {
    assert.doesNotMatch(text, /--class <[^>]*\btests\b[^>]*>/);
    assert.match(text, /--class <seguridad\|logica\|structural>/);
  };
  check(prompt);
  assert.throws(() => check(prompt.replace('seguridad|logica|structural', 'seguridad|logica|tests')));
});
export function section(text, heading) {
  const start = text.indexOf(`${heading}\n`);
  assert.ok(start >= 0, `missing section ${heading}`);
  const next = text.indexOf('\n## ', start + heading.length);
  return text.slice(start, next < 0 ? text.length : next);
}
export function requireClauses(text, heading, clauses) {
  const body = section(text, heading);
  for (const clause of clauses) assert.ok(body.includes(clause), `missing normative clause: ${clause}`);
}
const producer = [
  'Complete approved requirements and explicit unique ownership produce only supported serial compact plans.',
  'Incomplete requirements, ambiguous ownership, unresolved product/architecture decisions, unsafe slice boundaries, or parallel tracks return `planning-required`; do not write an executable implementation plan.',
  'Preserve canonical requirement IDs such as `RF-1.1`, `RNF-T.1`, and safe hyphenated IDs without translation.',
  'Group adjacent requirements only when behavior, surfaces, dependencies, and verification boundaries justify one cohesive slice; state that rationale and one owner per requirement.',
  'Unmarked historical plans are readable migration inputs, never executable; there is no Task/Tracks or legacy execution option.',
];
const admission = [
  'Run `awm plan admit PLAN_PATH --provider TARGET --cwd . --require-current --verify-sensors --json` before first dispatch, start/resume, and every lifecycle transition.',
  'Only exit 0 with `state: admitted` and the current `planDigest` permits work; every other result blocks with zero dispatch.',
  '`migration-required`, `invalid`, and `unsupported` never select a historical, Task/Tracks, batch, or legacy execution route.',
  'Missing command/strict support, stale or unverifiable consumed CLI/registry contracts, or non-pass sensor evidence blocks; show named components and actionable diagnostics, never bypass.',
  'Interactive execution requires compact admission but not a journal; unattended execution requires a healthy schema-2 journal bound to the current plan identity before dispatch.',
  'A missing, corrupt, or stale unattended journal blocks; initialization is an explicit separately authorized `awm watch --init --plan PLAN_PATH`, only when absent, never an admission side effect.',
  'Before selecting resumed work reconcile current plan, journal, Git HEAD/diff, active jobs, tests, sensors, and independent verdict obligations; durable current evidence wins over chat or checkboxes.',
  'After any plan change revalidate and re-admit under the new CLI-derived plan identity; old-digest verdicts cannot satisfy current obligations.',
  'Full relevant-context fallback for security/robustness, root-configuration, public-contract, or uncertain cross-cutting impact retains the compact state machine and every quality gate.',
  'Completion requires distinct implementer, specification-reviewer, and code-quality-reviewer identities with both current clean verdicts, files, tests, sensors, requirements, and plan identity reconciled.',
  'Local slice completion never replaces TDD, final review, global Track A and Track B QA, documentation, retro, sensors, verification, or finishing gates.',
  'Use the same contract on Antigravity, OpenCode, Claude Code, Codex, Cursor, and Copilot through native capabilities; unsupported or unverified required capability blocks, never inferred parity.',
  'Read the sole normative Evidence Capsule v1 reference before role dispatch; do not fork its shape, retrieval limits, allowlists, or ephemeral retention rules.',
  'Expose fallback, degradation, migration, retry, and invalidation in bounded durable evidence; persist IDs/verdicts/provenance, never prompt/source bodies, secrets, credentials, or unrestricted responses.',
  'Reconcile plan identity, slice, role, command, and verdict before retry to reuse the durable obligation rather than duplicate active work.',
  'Link material plans, checkpoints, commits, and review/acceptance evidence from issue #126; R1 is not available until installed cross-repository acceptance and #148 migration dry run pass.',
];
const migration = [
  'Read historical input without mutation; hash it before and after, and write a separately named compact continuation only after explicit owner acceptance.',
  'Collect bounded read-only facts from the historical plan, Git commits/diff, journal when present, current tests, sensors, independent verdicts, and durable issue evidence; exclude source/prompt bodies and secrets from persisted evidence.',
  'Use `awm plan migration-facts HISTORICAL_PLAN --cwd . --issue https://github.com/Kodria/agentic-workflow/issues/126 --json`; a fact report is evidence, not semantic slice approval or permission to execute.',
  'Carry forward completion only when current files, commit, passing tests/sensors, and required independent specification and quality verdicts support it; a checkbox, commit, test-only result, or summary alone never completes an obligation.',
  'Keep completed behavior as an evidenced source/checkpoint and include only remaining obligations; final branch closure revalidates completed behavior without reimplementing it.',
  'For #148 retain Task 1 as verified antecedent, Task 2 as pending its missing code-quality re-review, and Tasks 3–14 as unstarted unless newer durable evidence proves otherwise.',
  'Ambiguous ownership, conflicting evidence, or unsafe boundaries return `planning-required` or `blocked`, naming unresolved items, affected requirements, and the owner decision; infer neither completion nor a safe slice.',
  'Bound retrieval to declared authoritative sources and the current role; unresolved facts stop migration instead of unbounded scanning or wholesale regeneration.',
];
const consumers = ['writing-plans', 'development-process', 'executing-plans', 'subagent-driven-development',
  'post-implementation-qa', 'post-implementation-docs', 'harness-retro', 'finishing-a-development-branch'];
const admissionPath = 'skills/writing-plans/references/compact-admission-v1.md';
const migrationPath = 'skills/writing-plans/references/compact-migration-v1.md';

const retroMarkerClauses = [
  'Only after all retro gates, terminal capture or evidenced no-journal skip, and verified ledger archive pass, use the authorized native filesystem editor to add the standalone `awm-retro-complete` marker to the explicitly assigned active_plan only.',
  'There is no CLI marker-edit command; never invent a lifecycle command, fabricate COMPLETE, or change an unrelated plan.',
  'Validate the updated bytes with `awm plan validate "$active_plan" --cwd . --json` and retain the new CLI-derived identity.',
  'If a real current branch binding exists, use the existing `awm watch rebind --plan "$active_plan"` only when its actual binding/proof preconditions permit; otherwise block for reviewed recovery.',
  'The pre-edit capture remains historical: rerun genuine affected verification when its fingerprint or current-evidence proof includes the changed plan; never relabel or re-fingerprint old PASS evidence.',
  'Re-admit the exact updated plan identity with all required currentness, sensor, journal and custody gates before the next lifecycle phase; a marker alone authorizes nothing.',
];
function assertRetroMarker(text) {
  const start = text.indexOf('### 11. Capture and close the retro');
  const body = text.slice(start, text.indexOf('## Anti-patterns', start));
  for (const clause of retroMarkerClauses) assert.ok(body.includes(clause), `missing closure amendment clause: ${clause}`);
  assert.doesNotMatch(body, /current CLI-supported lifecycle transition/);
  assert.doesNotMatch(body, /awm watch archive-unused[^`\n]*--json/, 'archive-unused returns JSON without a --json option');
  assert.ok(body.includes('awm watch archive-unused --plan "$active_plan"'), 'unused archive names the assigned plan');
  assert.ok(body.indexOf('awm evidence capture --plan') < body.indexOf(retroMarkerClauses[0]), 'terminal capture precedes marker edit');
}
test('RNF-T.3/5 authorized native marker edit retains identity and genuine proof gates', () => {
  const text = read('skills/harness-retro/SKILL.md'); assertRetroMarker(text);
  for (const clause of retroMarkerClauses) assert.throws(() => assertRetroMarker(text.replace(clause, '')), /missing closure amendment clause/);
  assert.throws(() => assertRetroMarker(text.replace(retroMarkerClauses[0], 'Use the current CLI-supported lifecycle transition.')), /missing closure amendment clause/);
  assert.throws(() => assertRetroMarker(text.replace('awm watch archive-unused --plan "$active_plan"', 'awm watch archive-unused --plan "$active_plan" --json')), /archive-unused returns JSON/);
});
function assertSerialRecipes(files) {
  const rules = [
    ['writing-plans', '**2. Inline Execution** - Execute one admitted serial compact slice at a time in this session using executing-plans, with independent specification and quality review checkpoints', /batch execution|Batch execution/],
    ['executing-plans', 'When the admitted serial slice is complete:', /When batch complete|mid-batch|Between batches|per batch/],
    ['subagent-driven-development', '**vs. Executing Plans (separate serial session):**', /parallel session/],
    ['finishing-a-development-branch', 'After all admitted serial slices and global closure gates complete', /After all batches complete/],
  ];
  for (const [name, positive, forbidden] of rules) { assert.ok(files[name].includes(positive), `${name}: missing serial recipe`); assert.doesNotMatch(files[name], forbidden); }
}
test('RF-1.2/5.1 positive sibling handoffs remain serial without banning independent QA lenses', () => {
  const names = ['writing-plans', 'executing-plans', 'subagent-driven-development', 'finishing-a-development-branch'];
  const files = Object.fromEntries(names.map(name => [name, read(`skills/${name}/SKILL.md`)]));
  assertSerialRecipes(files);
  for (const name of names) assert.throws(() => assertSerialRecipes({ ...files, [name]: `${files[name]}\n${name === 'subagent-driven-development' ? 'parallel session' : name === 'finishing-a-development-branch' ? 'After all batches complete' : name === 'executing-plans' ? 'When batch complete' : 'Batch execution'}` }));
  assert.ok(read('skills/post-implementation-qa/SKILL.md').includes('Dispatch them in parallel.'), 'independent isolated quality lenses stay intact');
});

test('RF-2.5 installed acceptance wires genuine matched provenance and incompatible component negatives', () => {
  const acceptance = read('tests/r16-compact-only-cli-acceptance.mjs');
  assert.match(acceptance, /runInstalledAdmissionAcceptance/);
  const gate = read('tests/installed-admission-acceptance.mjs');
  for (const clause of ['ADMISSION_REGISTRY_CLI_INCOMPATIBLE', 'registry:baseline', '99.0.0', 'require-current', 'verify-sensors', 'published-remote', 'local-git-fixture', 'assertNoDispatchCustody']) assert.ok(gate.includes(clause), clause);
  assert.doesNotMatch(gate, /dispatchCount/, 'a fixed local counter is not observed dispatch evidence');
  for (const workflow of ['validate.yml', 'auto-tag.yml']) assert.match(read(`.github/workflows/${workflow}`), /AWM_R16_INSTALLED_ACCEPTANCE: "1"/);
});

test('RF-1.1/1.2/1.3/5.1 compact-only semantic authoring is fail-closed', () => {
  requireClauses(read('skills/writing-plans/SKILL.md'), '## Compact-only authoring', producer);
  assert.doesNotMatch(read('skills/writing-plans/SKILL.md'), /awm plan analyze|### Task N:|## Parallel track declaration/);
});
test('RF-2.2/2.3 every lifecycle consumer loads admission before work', () => {
  for (const name of consumers) {
    const body = section(read(`skills/${name}/SKILL.md`), '## Compact admission — BLOCKING');
    const link = name === 'writing-plans' ? 'references/compact-admission-v1.md' : '../writing-plans/references/compact-admission-v1.md';
    assert.ok(body.includes(`Read \`${link}\` before any plan execution, role dispatch, resume, or lifecycle transition.`), name);
    assert.ok(body.includes('Apply it exactly; only `admitted` for the current plan identity may continue.'), name);
  }
});
test('RF-1.6/2.4/2.5/3.1/3.2/5.4/5.5/6.1 RNF-T.2/3/5/6/7 shared admission retains all boundaries', () => {
  requireClauses(read(admissionPath), '## Normative admission protocol', admission);
});
test('RF-3.3/3.4/3.5 RNF-T.4 migration is bounded and checkpoint-preserving', () => {
  requireClauses(read(migrationPath), '## Normative migration protocol', migration);
  assert.ok(section(read('skills/writing-plans/SKILL.md'), '## Historical migration — BLOCKING').includes('references/compact-migration-v1.md'));
});
test('RF-3.1/3.2 session custody is mandatory and initialized empty journals cannot dispatch', () => {
  const text = read('skills/subagent-driven-development/SKILL.md');
  const clauses = [
    'Journal initialization binds the plan only; an empty bootstrap journal is not an execution bridge or permission to dispatch.',
    'Before unattended dispatch require the actual supervisor-issued generation token, observable session custody, registered cycle-plan/tasks/ReviewObligations, and durable verification requests using the existing public job commands.',
    'If that native session bridge or generation/custody evidence is unavailable, return BLOCKED before dispatch; provider capability declarations alone never establish session custody.',
  ];
  requireClauses(text, '## Modo journal-first (obligatorio desatendido; opcional interactivo)', clauses);
  for (const clause of clauses) assert.throws(() => requireClauses(text.replace(clause, ''), '## Modo journal-first (obligatorio desatendido; opcional interactivo)', clauses), /missing normative clause/);
});
test('RF-1.4 canonical standalone example has exact v1 headings and real verification commands', () => {
  const reference = read('skills/writing-plans/references/compact-slices-v1.md');
  const example = reference.match(/```markdown\n([\s\S]*?)\n```/)[1];
  assert.equal(example.trim(), read('tests/fixtures/compact-slices-v1/reference-example.md').trim());
  assert.deepEqual([...example.matchAll(/^#### (.+)$/gm)].map(match => match[1]), ['Surfaces', 'Implementation', 'Edge cases', 'Evidence', 'Fallback']);
  const manifest = JSON.parse(example.match(/START v1 -->\n([\s\S]*?)\n<!-- AWM:COMPACT-SLICES:END/)[1]);
  assert.deepEqual(manifest.requirements, ['RF-1.4']);
  assert.deepEqual(manifest.closureCommands, ['CMD-TEST']);
  assert.equal(manifest.commands[0].program, 'npm');
  assert.deepEqual(manifest.commands[0].args, ['run', 'test:compact-only']);
  assert.doesNotMatch(reference, /awm plan analyze|stays on the legacy|No marker or schema signal is legacy/);
});
test('RF-2.5 release metadata and actual tag-producing job require compatible CLI and contract gates', () => {
  assert.equal(JSON.parse(read('awm-registry.json')).minCliVersion, '9.10.2');
  const bundle = JSON.parse(read('bundles/dev/bundle.json'));
  assert.equal(bundle.version, '4.2.0');
  assert.equal(JSON.parse(read('catalog.json')).bundles.find(entry => entry.name === 'dev').version, bundle.version);
  for (const file of ['.github/workflows/validate.yml', '.github/workflows/auto-tag.yml']) {
    const body = read(file); const install = body.indexOf('Install Context Kernel compatible CLI');
    for (const command of ['node tests/r16-compact-only-contract.test.mjs', 'node tests/r16-compact-only-cli-acceptance.mjs']) {
      assert.ok(body.indexOf(command) > install, `${file}: ${command}`);
      if (file.includes('auto-tag')) assert.ok(body.indexOf(command) < body.indexOf('Compute and push next tag'));
    }
  }
});
test('RED semantic mutations remove each exact normative rule and every consumer independently', () => {
  for (const [file, heading, clauses] of [
    ['skills/writing-plans/SKILL.md', '## Compact-only authoring', producer],
    [admissionPath, '## Normative admission protocol', admission],
    [migrationPath, '## Normative migration protocol', migration],
  ]) {
    const text = read(file);
    requireClauses(text, heading, clauses);
    for (const clause of clauses) assert.throws(() => requireClauses(text.replace(clause, ''), heading, clauses), /missing normative clause/, `${file}: ${clause}`);
  }
  for (const name of consumers) {
    const text = read(`skills/${name}/SKILL.md`);
    const rule = 'Apply it exactly; only `admitted` for the current plan identity may continue.';
    assert.throws(() => requireClauses(text.replace(rule, ''), '## Compact admission — BLOCKING', [rule]), /missing normative clause/, name);
  }
});
