import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

// Kodria/agentic-workflow#217 R7: the two skills that produce the Change Record.
// Every assert* helper runs on the shipped text and on a mutation of it, so a
// gate that cannot go red fails here (CONSTITUTION.md, "Gates ejecutables").
const read = relative => readFileSync(new URL(`../${relative}`, import.meta.url), 'utf8');
const WRITING = 'skills/writing-plans/SKILL.md';
const FINISHING = 'skills/finishing-a-development-branch/SKILL.md';

// The lines under `heading` up to the next heading of the same or a higher
// level. Lines inside ``` fences never end a section: the skills quote
// `# Title` and `## Summary` inside templates.
function section(text, heading) {
  const lines = text.split('\n');
  const start = lines.indexOf(heading);
  assert.ok(start >= 0, `missing section ${heading}`);
  const level = heading.match(/^#+/)[0].length;
  let fenced = false;
  const body = [];
  for (const line of lines.slice(start + 1)) {
    if (line.startsWith('```')) fenced = !fenced;
    if (!fenced && /^#+ /.test(line) && line.match(/^#+/)[0].length <= level) break;
    body.push(line);
  }
  return body.join('\n');
}

function mutated(text, from, to) {
  assert.ok(text.includes(from), `mutation anchor not found: ${from}`);
  return text.replace(from, to);
}

function headerTemplate(text) {
  const match = section(text, '## Plan Document Header').match(/```markdown\n([\s\S]*?)\n```/);
  assert.ok(match, 'the plan header template block is missing');
  return match[1];
}

function assertPlanHeaderDeclaresRecord(text) {
  const template = headerTemplate(text);
  assert.match(template, /^\*\*Change Record:\*\* `<slug>`$/m, 'the header template must declare the planned Change Record slug');
  assert.match(template, /^\*\*Criterios de aceptación:\*\*$/m, 'the header template must declare the acceptance criteria');
  assert.match(template, /^- <paso> → <resultado esperado>$/m, 'each acceptance criterion must pair a step with its expected result');
}

function assertRecordSubsection(text) {
  const body = section(text, '### Change Record');
  assert.ok(body.includes('`^[a-z0-9]+(-[a-z0-9]+)*$`'), 'the subsection must state the slug rule');
  assert.match(body, /fuente de `manual_validation`/, 'the acceptance criteria must be named as the source of manual_validation');
  assert.ok(body.includes('`type`, `scope` y `semver` **no se declaran**'), 'the skill must state that type, scope and semver are not declared');
  assert.match(body, /deriva[^.]*commits/, 'the skill must state that they are derived from the commits');
}

test('R7.1: the plan header template declares the planned Change Record and its acceptance criteria', () => {
  const text = read(WRITING);                                 // verifies R7.1
  assertPlanHeaderDeclaresRecord(text);
  assert.throws(() => assertPlanHeaderDeclaresRecord(mutated(text, '**Change Record:** `<slug>`', '**Record:** `<slug>`')), /planned Change Record slug/);
  assert.throws(() => assertPlanHeaderDeclaresRecord(mutated(text, '**Criterios de aceptación:**\n', '**Criterios:**\n')), /acceptance criteria/);
  assert.throws(() => assertPlanHeaderDeclaresRecord(mutated(text, '- <paso> → <resultado esperado>', '- <paso>')), /expected result/);
});

test('R7.1: writing-plans states that type, scope and semver are derived, never declared', () => {
  const text = read(WRITING);                                 // verifies R7.1
  assertRecordSubsection(text);
  assert.throws(() => assertRecordSubsection(mutated(text, '`type`, `scope` y `semver` **no se declaran**', '`type`, `scope` y `semver` se declaran')), /not declared/);
  assert.throws(() => assertRecordSubsection(mutated(text, 'fuente de `manual_validation`', 'fuente de la validación')), /source of manual_validation/);
  assert.throws(() => assertRecordSubsection(mutated(text, '### Change Record\n', '### Registro\n')), /missing section ### Change Record/);
});
