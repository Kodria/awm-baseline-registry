import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

// Kodria/agentic-workflow#217 R7: the two skills that produce the Change Record.
// Every assert* helper runs on the shipped text and on a mutation of it, so a
// gate that cannot go red fails here (CONSTITUTION.md, "Gates ejecutables").
const read = relative => readFileSync(new URL(`../${relative}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const WRITING = 'skills/writing-plans/SKILL.md';
const FINISHING = 'skills/finishing-a-development-branch/SKILL.md';

// The lines under `heading` up to the next heading of the same or a higher
// level. Lines inside fences never end a section: the skills quote `# Title`
// and `## Summary` inside templates. Fences follow CommonMark: an opening
// fence is 3+ backticks or 3+ tildes indented at most 3 spaces; while open,
// only a line of the same character, at least as long as the opening run and
// followed by nothing but spaces, closes it.
function section(text, heading) {
  const lines = text.split('\n');
  const start = lines.indexOf(heading);
  assert.ok(start >= 0, `missing section ${heading}`);
  const level = heading.match(/^#+/)[0].length;
  let fence = null;
  const body = [];
  for (const line of lines.slice(start + 1)) {
    if (fence) {
      const close = line.match(/^ {0,3}(`{3,}|~{3,}) *$/);
      if (close && close[1][0] === fence[0] && close[1].length >= fence.length) fence = null;
    } else {
      const open = line.match(/^ {0,3}(`{3,}|~{3,})/);
      if (open) fence = open[1];
      else if (/^#+ /.test(line) && line.match(/^#+/)[0].length <= level) break;
    }
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
  assert.ok(body.includes('como máximo 64 caracteres'), 'the subsection must state the 64-character slug limit');
  assert.ok(body.includes('`ninguno` está reservado'), 'the subsection must reserve ninguno for the opt-out');
  assert.ok(body.includes('`Change-Record: none`'), 'the trivial opt-out must map to the Change-Record: none trailer');
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
  assert.throws(() => assertRecordSubsection(mutated(text, '`^[a-z0-9]+(-[a-z0-9]+)*$`', '`^[a-z]+$`')), /slug rule/);
  assert.throws(() => assertRecordSubsection(mutated(text, 'deriva de los commits', 'toma de la rama')), /derived from the commits/);
  assert.throws(() => assertRecordSubsection(mutated(text, 'como máximo 64 caracteres', 'sin límite')), /64-character/);
  assert.throws(() => assertRecordSubsection(mutated(text, '`ninguno` está reservado', '`ninguno` es libre')), /reserve ninguno/);
  assert.throws(() => assertRecordSubsection(mutated(text, 'el trailer `Change-Record: none`', 'otra cosa')), /Change-Record: none trailer/);
});

test('section() keeps fenced headings inside the section', () => {
  const text = ['## A', '~~~~markdown', '# not a heading', '```', '## still fenced', '~~~~', 'tail', '## B', 'other'].join('\n');
  const body = section(text, '## A');
  assert.ok(body.includes('tail'), 'the section must continue after the closing fence');
  assert.ok(body.includes('## still fenced'), 'a heading inside the fence must not end the section');
  assert.ok(!body.includes('other'), 'the next same-level heading must end the section');
  // A closing run shorter than the opening one does not close the fence, so
  // the section never ends: this proves the length rule is live.
  const unclosed = section(mutated(text, '\n~~~~\ntail', '\n~~~\ntail'), '## A');
  assert.ok(unclosed.includes('other'), 'a shorter closing run must not close the fence');
});
