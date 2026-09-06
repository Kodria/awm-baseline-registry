import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const root = new URL('..', import.meta.url);
const read = relative => readFileSync(new URL(relative, root), 'utf8');
const USING_AWM = 'skills/using-awm/SKILL.md';
const DECLARED = 'skills/using-awm/references/declared-orchestrators.md';

function orchestrationSection(text) {
  const match = text.match(/^## Orchestration$/m);
  assert.ok(match, 'using-awm must keep an ## Orchestration section');
  const rest = text.slice(match.index);
  const nextHeading = rest.indexOf('\n## ', 1);
  return nextHeading >= 0 ? rest.slice(0, nextHeading) : rest;
}

function assertBuiltInSkillReferencesResolve(text) {
  const references = [...orchestrationSection(text).matchAll(/`([^`\n]+)`/g)]
    .map(([, value]) => value)
    .filter(value => !value.includes('/') && !value.includes('.'));
  const missing = [...new Set(references)]
    .filter(name => !existsSync(new URL(`skills/${name}/SKILL.md`, root)));

  assert.deepEqual(
    missing,
    [],
    `using-awm built-in orchestration references non-local skills: ${missing.join(', ')}`,
  );
}

const declaredContract = () => read(DECLARED);

test('using-awm reaches the declared-orchestrator contract', () => {
  const core = orchestrationSection(read(USING_AWM));
  assert.match(core, /references\/declared-orchestrators\.md/);
  assert.match(core, /installed declared orchestrators may apply/i);
});

test('built-in orchestration references only local baseline skills', () => {
  assertBuiltInSkillReferencesResolve(read(USING_AWM)); // verifies R2.1, R2.2
});

test('RED mutation: a hardcoded external skill is rejected', () => {
  const mutated = read(USING_AWM).replace(
    '### The built-in pair',
    'External routing uses `missing-external-orchestrator`.\n\n### The built-in pair',
  );
  assert.throws(
    () => assertBuiltInSkillReferencesResolve(mutated),
    /missing-external-orchestrator/,
  ); // verifies R2.3
});

test('R2.1: declared orchestrators precede the built-in pair', () => {
  const contract = declaredContract();
  assert.match(contract, /considered before `development-process` and `product-process`/i);
});

test('R2.2: declared ordering comes from termination, not framework fields', () => {
  const contract = declaredContract();
  assert.match(contract, /ordering among declared orchestrators comes from the termination contract/i);
  assert.match(contract, /not a framework precedence, priority, or order field/i);
});

test('R2.3-R2.4: absence is silent and ties apply none', () => {
  const contract = declaredContract();
  assert.match(contract, /no declared orchestrator applies[\s\S]{0,120}do not mention/i);
  assert.match(contract, /two or more declared orchestrators apply[\s\S]{0,120}apply none of them/i);
});

test('R3.1-R3.3 and R5.3: declared contract names safe termination', () => {
  const contract = declaredContract();
  assert.match(contract, /names its successor/i);
  assert.match(contract, /one orchestrator is active at a time/i);
  assert.match(contract, /successor is not installed[\s\S]{0,120}continue/i);
  assert.match(contract, /never carries[\s\S]{0,80}credentials,? or secrets/i);
  assert.match(contract, /Fail safe[\s\S]{0,160}Never block the user/i);
});

test('RED mutations: a missing directive and weakened tie rule each fail', () => {
  const core = read(USING_AWM);
  const withoutDirective = core.replace(/IF one or more installed declared orchestrators may apply,[\s\S]*?never invent the missing contract\.\n\n/, '');
  assert.throws(() => assert.match(orchestrationSection(withoutDirective), /references\/declared-orchestrators\.md/), /declared-orchestrators/);
  const weakenedTie = declaredContract().replace(/apply none of them and continue with the built-in table/, 'choose one');
  assert.throws(() => assert.match(weakenedTie, /apply none of them and continue with the built-in table/), /apply none/);
});
