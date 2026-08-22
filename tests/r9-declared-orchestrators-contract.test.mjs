import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const root = new URL('..', import.meta.url);
const read = relative => readFileSync(new URL(relative, root), 'utf8');

const USING_AWM = 'skills/using-awm/SKILL.md';

/** Extrae la seccion ## Orchestration completa, sin el resto del skill. */
function orchestrationSection(text) {
  const match = text.match(/^## Orchestration$/m);
  assert.ok(match, 'using-awm must keep an ## Orchestration section');
  const start = match.index;
  const rest = text.slice(start);
  const nextHeading = rest.indexOf('\n## ');
  return nextHeading >= 0 ? rest.slice(0, nextHeading) : rest;
}

test('R2.1: los orquestadores declarados se consideran antes que los dos existentes', () => {
  const section = orchestrationSection(read(USING_AWM));   // verifies R2.1
  assert.match(section, /declared orchestrator/i,
    'the orchestration section must name declared orchestrators as a routing input');
  const declared = section.search(/declared orchestrator/i);
  const builtins = section.indexOf('`development-process`');
  assert.ok(declared >= 0 && builtins > declared,
    'declared orchestrators must be introduced before the built-in pair, matching their precedence');
  assert.match(section, /considered before/i,
    'must explicitly state declared orchestrators are considered before the built-in pair');
});

test('R2.2: la precedencia entre declarados sale de la terminacion, no de un campo del framework', () => {
  const section = orchestrationSection(read(USING_AWM));   // verifies R2.2
  assert.match(section, /ordering among declared orchestrators comes from the termination contract/i,
    'ordering among declared orchestrators must be anchored to the termination contract');
  assert.doesNotMatch(section, /\bprecedence:\s|\bpriority:\s|\border:\s/i,
    'the framework must not introduce a precedence/priority/order field — that is process vocabulary');
});

test('R2.3: sin declarados aplicables, el ruteo es el actual y no se los menciona', () => {
  const section = orchestrationSection(read(USING_AWM));   // verifies R2.3
  assert.match(section, /no declared orchestrator applies/i,
    'the section must state the fallback when nothing declared applies');
  assert.match(section, /\|\s*Ambiguous\s*\|/,
    'the existing two-orchestrator routing table must survive intact');
  assert.match(section, /do not mention that declared orchestrators exist/i,
    'the silence clause must explicitly forbid mentioning declared orchestrators when none apply');
});

test('R2.4: empate sin nombrarse => no aplicar ninguno', () => {
  const section = orchestrationSection(read(USING_AWM));   // verifies R2.4
  assert.match(section, /two or more declared orchestrators[\s\S]{0,240}?none of them/i,
    'the tie case must resolve to applying none, never to an arbitrary pick');
  assert.match(section, /apply none of them/i,
    'the tie case must actually resolve to applying none, not just mention "none of them" in the condition');
});

test('Fail-safe: un declarado que no puede correr degrada, nunca bloquea', () => {
  const section = orchestrationSection(read(USING_AWM));   // verifies fail-safe rule
  assert.match(section, /fail-safe/i,
    'the section must state a fail-safe rule for declared orchestrators');
  assert.match(section, /never block the user/i,
    'the fail-safe rule must state it never blocks the user from working');
});

test('R3.1 y R3.2: terminacion explicita y un solo orquestador activo', () => {
  const section = orchestrationSection(read(USING_AWM));   // verifies R3.1, R3.2
  assert.match(section, /name(s)? (its|the) (successor|termination target|next)/i,
    'a declared orchestrator must name its termination target explicitly');
  assert.match(section, /one orchestrator active at a time/i,
    'the single-active-orchestrator invariant must be stated');
});

test('R3.3: destino no instalado degrada, no aborta', () => {
  const section = orchestrationSection(read(USING_AWM));   // verifies R3.3
  assert.match(section, /not installed[\s\S]{0,200}?(continue|fall back)/i,
    'naming an uninstalled successor must degrade to the current routing, never abort the session');
});

test('R5.3: el contrato de declaracion no admite secretos', () => {
  const section = orchestrationSection(read(USING_AWM));   // verifies R5.3
  assert.match(section, /never (contain|carry|include) (credentials|secrets)/i,
    'the declaration contract must state that it carries no credentials or secrets');
});

test('RED mutation: volver a enumerar solo dos orquestadores es rechazado', () => {
  const original = read(USING_AWM);
  const weakened = original.replace(
    orchestrationSection(original),
    '## Orchestration\n\nAWM has two sibling orchestrators: `development-process` and `product-process`.\n',
  );
  const weakenedSection = orchestrationSection(weakened);
  assert.throws(
    () => assert.match(weakenedSection, /declared orchestrator/i),
    /declared orchestrator/i,
    'reverting to the hardcoded two-orchestrator table must fail R2.1',
  );
  assert.throws(
    () => assert.match(weakenedSection, /\|\s*Ambiguous\s*\|/),
    'reverting to the hardcoded two-orchestrator table must also fail the R2.3 table-survival check',
  );
});
