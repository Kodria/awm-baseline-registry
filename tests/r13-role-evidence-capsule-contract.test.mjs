import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = source => readFileSync(path.join(root, source), 'utf8');
const git = args => execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 5_000_000 });
const sha256 = value => createHash('sha256').update(value).digest('hex');
const byteLength = value => Buffer.byteLength(value, 'utf8');
const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const R1_BASE = '12b08cb133c67889b1a5484c0b791cf510302ed1';
const R1_HEAD = '572d9e533f5498d0b3bd8033638ffea6e68ae0b3';
const CURRENT_INITIAL_BYTES = Object.freeze({
  implementer: 26317, specification: 22230, codeQuality: 3816, trackA: 166580,
  robustness: 166650, logic: 166344, tests: 166294,
});
const CURRENT_AGGREGATE_BYTES = 718231;
const CANDIDATE_MAX_BYTES = 430938;
const CAPSULE_MARKER = '## Evidence Capsule v1';
const CAPSULE_FIELDS = ['role:', 'scope:', 'requirements:', 'surfaces:', 'sources:', 'evidence:', 'retrieval history:', 'fallback:'];
const ROLE_SOURCES = Object.freeze({
  implementer: 'skills/subagent-driven-development/implementer-prompt.md',
  specification: 'skills/subagent-driven-development/spec-reviewer-prompt.md',
  codeQuality: 'skills/subagent-driven-development/code-quality-reviewer-prompt.md',
  trackA: 'skills/post-implementation-qa/deep-review-prompt.md',
  robustness: 'skills/post-implementation-qa/deep-review-prompt.md',
  logic: 'skills/post-implementation-qa/deep-review-prompt.md',
  tests: 'skills/post-implementation-qa/deep-review-prompt.md',
  designFidelity: 'skills/post-implementation-qa/deep-review-prompt.md',
});
const FULL_CONTEXT_TRIGGERS = [
  'ambiguous', 'security-or-robustness', 'root-configuration', 'public-contract',
  'uncertain-cross-cutting-impact', 'second-context-request', 'legacy-metadata',
  'malformed-or-missing-evidence',
];
const ALLOWLISTS = Object.freeze({
  implementer: ['cohesive task/slice', 'exact clauses', 'files', 'dependencies', 'required skills/design', 'verification'],
  specification: ['exact task clauses', 'implementer report', 'task diff', 'requirement IDs'],
  codeQuality: ['task diff', 'tests', 'sensors', 'public/robustness constraints'],
  trackA: ['all requirement IDs/clauses', 'branch diff', 'verification evidence'],
  robustness: ['branch diff/hunks', 'lens-relevant evidence'],
  logic: ['branch diff/hunks', 'lens-relevant evidence'],
  tests: ['branch diff/hunks', 'lens-relevant evidence'],
  designFidelity: ['affected design artifacts', 'implementation evidence', 'relevant diff'],
});
const QUALITY_GATES = Object.freeze([
  ['sensor gate', 'Sensor Gate (AWM)'],
  ['ledger gate', 'Ledger Gate (AWM)'],
  ['design fidelity gate', 'Design Fidelity Propagation Gate (AWM)'],
  ['reconciliation gate', 'Reconciliation Gate (AWM)'],
  ['TDD', 'test-driven-development'],
  ['final QA', 'post-implementation-qa'],
  ['docs handoff', 'post-implementation-docs'],
  ['retro', 'harness-retro'],
  ['completion verification', 'verification-before-completion'],
]);

const QA_ROLE_HEADINGS = Object.freeze({
  trackA: '## Track A — Fidelity subagent',
  robustness: '## Track B — Robustness / Security lens subagent',
  logic: '## Track B — Logic correctness lens subagent',
  tests: '## Track B — Tests lens subagent',
  designFidelity: '## Track B — Design Fidelity lens subagent',
});

const extractPrefix = (source, role) => {
  if (!QA_ROLE_HEADINGS[role]) {
    const marker = source.indexOf(CAPSULE_MARKER);
    assert.ok(marker > 0, `${CAPSULE_MARKER} must follow a stable role contract`);
    assert.equal(source.indexOf(CAPSULE_MARKER, marker + 1), -1, 'each role template must contain exactly one capsule marker');
    return source.slice(0, marker);
  }
  const firstRole = source.indexOf(QA_ROLE_HEADINGS.trackA);
  const roleStart = source.indexOf(QA_ROLE_HEADINGS[role]);
  const nextRole = Math.min(...Object.values(QA_ROLE_HEADINGS)
    .map(heading => source.indexOf(heading, roleStart + 1)).filter(index => index >= 0), source.length);
  const segment = source.slice(roleStart, nextRole);
  const marker = segment.indexOf(CAPSULE_MARKER);
  assert.ok(firstRole >= 0 && roleStart >= firstRole && marker > 0, `missing exact Evidence Capsule v1 boundary for ${role}`);
  assert.equal(segment.indexOf(CAPSULE_MARKER, marker + 1), -1, `${role} must have exactly one Evidence Capsule v1 boundary`);
  return `${source.slice(0, firstRole)}${segment.slice(0, marker)}`;
};

const validateCapsule = (capsule, role, { fullPlan = '', requestCount = 0, provider = 'codex', metadata = true, requestedSource, requestedReason } = {}) => {
  if (!metadata) return 'full-context: legacy-metadata';
  if (!capsule || !capsule.includes(CAPSULE_MARKER)) return 'full-context: malformed-or-missing-evidence';
  const marker = capsule.indexOf(CAPSULE_MARKER);
  if (capsule.indexOf(CAPSULE_MARKER, marker + 1) >= 0) return 'expected exactly one Evidence Capsule v1 marker';
  const capsuleBody = capsule.slice(marker + CAPSULE_MARKER.length);
  let previous = -1;
  for (const field of CAPSULE_FIELDS) {
    const matches = [...capsuleBody.matchAll(new RegExp(`^${escapeRegExp(field)}[^\\n]*$`, 'gm'))];
    if (matches.length === 0) return `missing capsule field ${field}`;
    if (matches.length > 1) return `duplicate capsule field ${field}`;
    const index = matches[0].index;
    if (index < previous) return `reordered capsule field ${field}`;
    previous = index;
  }
  const roleField = capsuleBody.match(/^role:\s*(.+)$/m)?.[1];
  if (roleField !== role) return `capsule role ${roleField ?? '<missing>'} does not match dispatch role ${role}`;
  if (!ALLOWLISTS[role]) return `removed role ${role}`;
  if (/^trackB-|^(robustness|logic|tests)$/.test(role) && fullPlan && capsule.includes(fullPlan)) return 'Track B initial capsule contains complete plan';
  if (requestCount === 1 && (!capsule.includes(`retrieval history: ${requestedSource} — ${requestedReason}`))) return 'first context request must record exact authoritative source and reason in retrieval history';
  if (requestCount > 1 && !capsule.includes('fallback: full-context: second-context-request')) return 'second context request must use full-context fallback';
  if (!['codex', 'claude-code'].includes(provider)) return `provider divergence: unsupported ${provider}`;
  return null;
};
const validateNeedsContext = response => {
  const lines = response.trimEnd().split('\n');
  if (lines.length !== 3) return 'NEEDS_CONTEXT must contain exactly three lines';
  const [status, source, reason] = lines;
  if (status !== 'status: NEEDS_CONTEXT') return 'NEEDS_CONTEXT status line is invalid';
  if (!/^missing-source:\s*\S/.test(source)) return 'NEEDS_CONTEXT missing-source is invalid';
  if (!/^reason:\s*\S/.test(reason)) return 'NEEDS_CONTEXT reason is invalid';
  return null;
};

const splitDiffByFile = diff => diff.split(/^diff --git /m).filter(Boolean).map(part => `diff --git ${part}`);
const frozenCorpus = () => {
  const plan = git(['show', `${R1_HEAD}:docs/plans/2026-08-25-r1-context-footprint-plan.md`]);
  const taskStart = plan.indexOf('### Task 1:');
  assert.ok(taskStart >= 0, 'frozen R1 plan must contain Task 1');
  const task = plan.slice(taskStart);
  const taskRequirements = task.match(/^_Requirements: (.+)_$/m)?.[1];
  assert.ok(taskRequirements, 'frozen R1 task must declare exact requirements');
  const diff = git(['diff', '--binary', '--no-ext-diff', '--unified=3', R1_BASE, R1_HEAD]);
  const diffFiles = splitDiffByFile(diff);
  assert.ok(diffFiles.length >= 3, 'frozen R1 diff must provide lens evidence');
  return Object.freeze({ plan, task, taskRequirements, diff, diffFiles });
};
const frozenRoleFixtures = corpus => {
  const sources = `git show ${R1_HEAD}:docs/plans/2026-08-25-r1-context-footprint-plan.md; git diff ${R1_BASE} ${R1_HEAD}`;
  const common = { scope: `R1 Task 1 @ ${R1_HEAD}`, surfaces: corpus.diffFiles.map(part => part.match(/^diff --git a\/(.+?) b\//m)?.[1]).filter(Boolean).join(', '), sources, retrievalHistory: 'none', fallback: 'selective' };
  return Object.freeze({
    implementer: { ...common, requirements: corpus.taskRequirements, evidence: corpus.task },
    specification: { ...common, requirements: corpus.taskRequirements, evidence: corpus.task },
    codeQuality: { ...common, requirements: corpus.taskRequirements, evidence: corpus.diff },
    trackA: { ...common, requirements: corpus.taskRequirements, evidence: `${corpus.plan}\n${corpus.diff}` },
    robustness: { ...common, requirements: 'n/a', evidence: corpus.diffFiles[0] },
    logic: { ...common, requirements: 'n/a', evidence: corpus.diffFiles[1] },
    tests: { ...common, requirements: 'n/a', evidence: corpus.diffFiles[2] },
    designFidelity: { ...common, requirements: 'n/a', evidence: corpus.diffFiles[0] },
  });
};
const capsuleWith = (role = 'implementer', overrides = {}) => `${CAPSULE_MARKER}\n${CAPSULE_FIELDS.map(field => `${field} ${overrides[field] ?? (field === 'role:' ? role : 'value')}`).join('\n')}`;
const assembleRole = (template, role, fixture, provider = 'codex') => {
  const prefix = extractPrefix(template, role);
  const fallback = fixture.fallback ?? 'selective';
  return `${prefix}${CAPSULE_MARKER}\nrole: ${role}\nscope: ${fixture.scope}\nrequirements: ${fixture.requirements}\nsurfaces: ${fixture.surfaces}\nsources: ${fixture.sources}\nevidence: ${fixture.evidence}\nretrieval history: ${fixture.retrievalHistory ?? 'none'}\nfallback: ${fallback}\n`;
};

const validateContract = ({ sources, reference, plan, fixture, fixtures, aggregateOverride, provider = 'codex', runtimeOverride, providerOutputs }) => {
  const errors = [];
  if (!reference.includes('sole normative capsule definition')) errors.push('missing canonical shared reference');
  for (const role of Object.keys(ROLE_SOURCES)) if (!sources[role]) errors.push(`removed role ${role}`);
  if (providerOutputs && providerOutputs.codex !== providerOutputs['claude-code']) errors.push('provider divergence');
  for (const trigger of FULL_CONTEXT_TRIGGERS) if (!reference.includes(trigger)) errors.push(`missing fallback trigger ${trigger}`);
  for (const [role, entries] of Object.entries(ALLOWLISTS)) {
    const tableRole = role === 'trackA' ? 'Track A fidelity' : role === 'designFidelity' ? 'Design fidelity lens' : role === 'codeQuality' ? 'Code-quality reviewer' : role === 'specification' ? 'Specification reviewer' : role === 'implementer' ? 'Implementer' : 'Track B lens';
    if (!reference.includes(`| ${tableRole} |`)) errors.push(`missing allowlist ${role}`);
    for (const entry of entries) if (!reference.toLowerCase().includes(entry.toLowerCase())) errors.push(`missing allowlist evidence ${role}: ${entry}`);
  }
  for (const [role, source] of Object.entries(sources)) {
    try {
      const prefix = extractPrefix(source, role);
      if (/\[(FULL TEXT|task name|plan-file|directory|commit before task|current commit)\]/.test(prefix)) errors.push(`dynamic evidence appears before marker for ${role}`);
    } catch (error) { errors.push(`${role}: ${error.message}`); }
  }
  for (const role of ['robustness', 'logic', 'tests', 'designFidelity']) {
    if (sources[role]?.includes('COMPLETE FROZEN PLAN BODY')) errors.push('Track B initial capsule contains complete plan');
  }
  const runtime = runtimeOverride ?? `${Object.values(sources).join('\n')}\n${read('skills/subagent-driven-development/SKILL.md')}\n${read('skills/post-implementation-qa/SKILL.md')}`;
  for (const [name, anchor] of QUALITY_GATES) if (!runtime.includes(anchor)) errors.push(`missing preserved gate ${name}`);
  if (!plan.includes('issue #126') || !/\| T[0-4] \|/.test(plan)) errors.push('missing T0-T4 or issue trace');
  const candidate = aggregateOverride ?? Object.entries(sources).filter(([role]) => role !== 'designFidelity').reduce((sum, [role, source]) => {
    try { return sum + byteLength(assembleRole(source, role, fixtures?.[role] ?? fixture, provider)); }
    catch { return sum; }
  }, 0);
  if (candidate > CANDIDATE_MAX_BYTES) errors.push(`candidate aggregate ${candidate} exceeds ${CANDIDATE_MAX_BYTES}`);
  return errors;
};

test('R2.9: frozen R1 corpus and T0 values are exact', () => {
  const frozenPlan = git(['show', `${R1_HEAD}:docs/plans/2026-08-25-r1-context-footprint-plan.md`]);
  const frozenDiff = git(['diff', '--binary', '--no-ext-diff', '--unified=3', R1_BASE, R1_HEAD]);
  assert.equal(byteLength(frozenPlan), 34425); assert.equal(sha256(frozenPlan), 'bdce0b0cdfb01b9788a432b0c024d20515abbae16fe0abcb3dec7bb729780de2');
  assert.equal(byteLength(frozenDiff), 127390); assert.equal(sha256(frozenDiff), 'd40d55e47950039d852599425c0c517b5dbafa7e9abc4c8e7c1ffa14a0694648');
  assert.equal(Object.values(CURRENT_INITIAL_BYTES).reduce((sum, value) => sum + value, 0), CURRENT_AGGREGATE_BYTES);
  assert.ok(splitDiffByFile(frozenDiff).length > 1);
});

test('R2.4/R2.9: candidate assembly derives from the frozen corpus', () => {
  const corpus = frozenCorpus();
  const fixtures = frozenRoleFixtures(corpus);
  assert.equal(fixtures.implementer.requirements, corpus.taskRequirements);
  assert.equal(fixtures.specification.requirements, corpus.taskRequirements);
  assert.ok(fixtures.trackA.evidence.includes(corpus.diff));
  for (const role of ['robustness', 'logic', 'tests']) {
    assert.ok(fixtures[role].evidence.length > 0, `${role} needs a real diff hunk`);
    assert.ok(!fixtures[role].evidence.includes(corpus.plan), `${role} must not receive the complete plan`);
    assert.equal(validateCapsule(`${assembleRole(read(ROLE_SOURCES[role]), role, fixtures[role])}\n${corpus.plan}`, role, { fullPlan: corpus.plan }), 'Track B initial capsule contains complete plan');
  }
});

test('R2 contract: canonical capsule, role parity, safe retrieval, and byte ledger hold', () => {
  const reference = read('skills/subagent-driven-development/references/evidence-capsule-v1.md');
  const plan = read('docs/plans/2026-08-25-r2-role-evidence-capsules-plan.md');
  const sources = Object.fromEntries(Object.entries(ROLE_SOURCES).map(([role, source]) => [role, read(source)]));
  const fixtures = frozenRoleFixtures(frozenCorpus());
  assert.deepEqual(validateContract({ sources, reference, plan, fixture: fixtures.implementer }), []);
  for (const [role, source] of Object.entries(sources)) {
    const fixture = fixtures[role];
    const first = assembleRole(source, role, fixture, 'codex');
    const second = assembleRole(source, role, { ...fixture, scope: `${fixture.scope} re-dispatch` }, 'claude-code');
    assert.equal(extractPrefix(first), extractPrefix(second), `stable prefix changed for ${role}`);
    assert.equal((first.match(/## Evidence Capsule v1/g) ?? []).length, 1);
    assert.equal(validateCapsule(first, role, { fullPlan: 'COMPLETE FROZEN PLAN BODY' }), null);
  }
  assert.notEqual(extractPrefix(sources.trackA, 'trackA'), extractPrefix(sources.robustness, 'robustness'), 'Track A and robustness must dispatch distinct stable prefixes');
  for (const trigger of FULL_CONTEXT_TRIGGERS) assert.equal(validateCapsule(capsuleWith('implementer', { 'fallback:': `full-context: ${trigger}` }), 'implementer'), null);
  const needsContext = 'status: NEEDS_CONTEXT\nmissing-source: git show abc\nreason: exact clause is absent\n';
  assert.equal(validateNeedsContext(needsContext), null);
  assert.equal(validateNeedsContext(`${needsContext}extra: forbidden\n`), 'NEEDS_CONTEXT must contain exactly three lines');
  const firstRedispatch = `${CAPSULE_MARKER}\nrole: implementer\nscope: R2.1\nrequirements: exact clause\nsurfaces: skills/example.md\nsources: git show abc\nevidence: tests: pass\nretrieval history: git show abc — exact clause is absent\nfallback: selective\n`;
  assert.equal(validateCapsule(firstRedispatch, 'implementer', { requestCount: 1, requestedSource: 'git show abc', requestedReason: 'exact clause is absent' }), null);
  assert.equal(validateCapsule(firstRedispatch, 'implementer', { requestCount: 1, requestedSource: 'git show wrong', requestedReason: 'exact clause is absent' }), 'first context request must record exact authoritative source and reason in retrieval history');
  assert.equal(validateCapsule(firstRedispatch, 'implementer', { requestCount: 2 }), 'second context request must use full-context fallback');
  assert.equal(validateCapsule('', 'implementer'), 'full-context: malformed-or-missing-evidence');
  assert.equal(validateCapsule('', 'implementer', { metadata: false }), 'full-context: legacy-metadata');
  const codex = assembleRole(sources.implementer, 'implementer', fixtures.implementer, 'codex');
  const claude = assembleRole(sources.implementer, 'implementer', fixtures.implementer, 'claude-code');
  assert.equal(codex, claude, 'provider labels must not alter the contract');
  const ledger = Object.fromEntries(Object.entries(sources).filter(([role]) => role !== 'designFidelity').map(([role, source]) => {
    const prefix = extractPrefix(source, role);
    return [role, { prefix: byteLength(prefix), capsule: byteLength(assembleRole(source, role, fixtures[role])) - byteLength(prefix), retrieval: 0, fallback: 0, dispatches: 1, providerUsage: 'unobservable' }];
  }));
  const aggregate = Object.values(ledger).reduce((sum, entry) => sum + entry.prefix + entry.capsule, 0);
  console.log(JSON.stringify({ candidate: ledger, aggregate, reduction: `${((1 - aggregate / CURRENT_AGGREGATE_BYTES) * 100).toFixed(2)}%`, retrieval: 0, fallback: 0, dispatches: 7, providerUsage: 'unobservable' }));
  assert.ok(aggregate <= CANDIDATE_MAX_BYTES, `candidate aggregate ${aggregate} exceeds ${CANDIDATE_MAX_BYTES}`);
});

test('R2.7: stable prefixes retain the pre-existing quality contracts', () => {
  const implementer = read(ROLE_SOURCES.implementer);
  const specification = read(ROLE_SOURCES.specification);
  const quality = read(ROLE_SOURCES.codeQuality);
  const qa = read(ROLE_SOURCES.trackA);
  for (const anchor of ['## Required Skills', '## Design Artifacts', 'Run sensors if this repo has them', '## Before Reporting Back: Self-Review', 'status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT']) assert.match(implementer, new RegExp(anchor.replace(/[|]/g, '\\|')));
  for (const anchor of ['## CRITICAL: Do Not Trust the Report', '## Anti-bias guard', '## Report Contract', 'Verify by reading code, not by trusting report.']) assert.match(specification, new RegExp(anchor.replace(/[|.]/g, '\\$&')));
  for (const anchor of ['requesting-code-review/code-reviewer.md', 'Systemic patterns', 'Code reviewer returns', 'One `-` line per issue']) assert.match(quality, new RegExp(anchor.replace(/[./`-]/g, '\\$&')));
  for (const anchor of ['## Track A — Fidelity subagent', '## Track B — Robustness / Security lens subagent', '## Track B — Logic correctness lens subagent', '## Track B — Tests lens subagent', '## Track B — Design Fidelity lens subagent', '## Output Format', '"findings"']) assert.match(qa, new RegExp(anchor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  for (const role of ['Track A — Fidelity', 'Track B — Robustness / Security', 'Track B — Logic correctness', 'Track B — Tests', 'Track B — Design Fidelity']) assert.match(qa, new RegExp(`## ${escapeRegExp(role)}[\\s\\S]*?## Evidence Capsule v1`));
});

test('R2.10-R2.14: ledger, privacy, legacy fallback, and trace remain explicit', () => {
  const reference = read('skills/subagent-driven-development/references/evidence-capsule-v1.md');
  const plan = read('docs/plans/2026-08-25-r2-role-evidence-capsules-plan.md');
  const fixtures = frozenRoleFixtures(frozenCorpus());
  const ledgerEntry = { prefix: byteLength('stable'), capsule: byteLength(assembleRole(read(ROLE_SOURCES.logic), 'logic', fixtures.logic)) - byteLength(extractPrefix(read(ROLE_SOURCES.logic), 'logic')), retrieval: 0, fallback: 0, dispatches: 1, providerUsage: 'unobservable' };
  assert.deepEqual(Object.keys(ledgerEntry).sort(), ['capsule', 'dispatches', 'fallback', 'prefix', 'providerUsage', 'retrieval']);
  assert.match(reference, /do not create telemetry stores or persist prompt\/source bodies/i);
  assert.match(reference, /unrestricted worker responses/i);
  assert.equal(validateCapsule('', 'implementer', { metadata: false }), 'full-context: legacy-metadata');
  assert.equal(validateCapsule('', 'implementer'), 'full-context: malformed-or-missing-evidence');
  for (const checkpoint of ['T0', 'T1', 'T2', 'T3', 'T4']) assert.match(plan, new RegExp(`\\| ${checkpoint} \\|`));
  assert.match(plan, /https:\/\/github\.com\/Kodria\/agentic-workflow\/issues\/126/);
});

test('R2 mutation proofs reject broken contracts with actionable messages', () => {
  const reference = read('skills/subagent-driven-development/references/evidence-capsule-v1.md');
  const plan = read('docs/plans/2026-08-25-r2-role-evidence-capsules-plan.md');
  const sources = Object.fromEntries(Object.entries(ROLE_SOURCES).map(([role, source]) => [role, read(source)]));
  const fixture = { scope: 'R2', requirements: 'R2', surfaces: 'file', sources: 'git show', evidence: 'pass' };
  assert.ok(validateContract({ sources: { ...sources, implementer: `${CAPSULE_MARKER}\n${sources.implementer}` }, reference, plan, fixture }).some(error => error.includes('must follow a stable role contract')));
  const withoutLogic = { ...sources };
  delete withoutLogic.logic;
  assert.ok(validateContract({ sources: withoutLogic, reference, plan, fixture }).includes('removed role logic'));
  assert.ok(validateContract({ sources, reference, plan, fixture, providerOutputs: { codex: 'same capsule', 'claude-code': 'different capsule' } }).includes('provider divergence'));
  assert.equal(validateCapsule(`${CAPSULE_MARKER}\nrole: x\nscope: x\nsurfaces: x\nrequirements: x\nsources: x\nevidence: x\nretrieval history: none\nfallback: selective`, 'implementer'), 'reordered capsule field surfaces:');
  assert.equal(validateCapsule(capsuleWith('logic', { 'role:': 'robustness' }), 'logic'), 'capsule role robustness does not match dispatch role logic');
  assert.equal(validateCapsule(`${CAPSULE_MARKER}\nrole: x\nscope: x\nrequirements: x\nrequirements: forged\nsurfaces: x\nsources: x\nevidence: x\nretrieval history: none\nfallback: selective`, 'implementer'), 'duplicate capsule field requirements:');
  assert.equal(validateCapsule(`${capsuleWith('robustness')}\nCOMPLETE FROZEN PLAN BODY`, 'robustness', { fullPlan: 'COMPLETE FROZEN PLAN BODY' }), 'Track B initial capsule contains complete plan');
  assert.equal(validateCapsule(capsuleWith('implementer', { 'fallback:': 'selective' }), 'implementer', { requestCount: 2 }), 'second context request must use full-context fallback');
  const runtime = `${Object.values(sources).join('\n')}\n${read('skills/subagent-driven-development/SKILL.md')}\n${read('skills/post-implementation-qa/SKILL.md')}`;
  const withoutSensorGate = runtime.replace('Sensor Gate (AWM)', 'Sensor gate removed');
  assert.ok(validateContract({ sources, reference, plan, fixture, runtimeOverride: withoutSensorGate }).includes('missing preserved gate sensor gate'));
  assert.ok(validateContract({ sources, reference, plan, fixture, aggregateOverride: CANDIDATE_MAX_BYTES + 1 }).includes(`candidate aggregate ${CANDIDATE_MAX_BYTES + 1} exceeds ${CANDIDATE_MAX_BYTES}`));
  const corpusFixtures = frozenRoleFixtures(frozenCorpus());
  const oversizedRoleEvidence = {
    ...corpusFixtures,
    logic: { ...corpusFixtures.logic, evidence: 'x'.repeat(CANDIDATE_MAX_BYTES) },
  };
  assert.ok(validateContract({ sources, reference, plan, fixture: corpusFixtures.implementer, fixtures: oversizedRoleEvidence }).some(error => error.startsWith('candidate aggregate ')));
});
