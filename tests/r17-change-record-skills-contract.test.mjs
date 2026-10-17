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

const STEP_41 = '#### Step 4.1: Change Record (Options 1 & 2 only)';
const RECORD_STEPS = [
  ['commit', /^1\. \*\*Commit\.\*\*/m],
  ['sensors', /^2\. \*\*Run the sensors:\*\* `awm sensors run`/m],
  ['skeleton', /^3\. \*\*Create the skeleton:\*\* `awm change new <slug>`/m],
  ['narrative', /^4\. \*\*Write the narrative\.\*\*/m],
  ['record commit', /^5\. \*\*Commit the record\*\*/m],
  ['strict validation', /^6\. \*\*Validate:\*\* `awm change validate --strict`/m],
];

function assertRecordSequence(text) {
  const step = section(text, STEP_41);
  let last = -1;
  for (const [name, pattern] of RECORD_STEPS) {
    const at = step.search(pattern);
    assert.ok(at >= 0, `Step 4.1 must include the ${name} step`);
    assert.ok(at > last, `Step 4.1 lists the ${name} step out of order`);
    last = at;
  }
  assert.match(step, /`awm change new <slug> --refresh`/, 'an existing record must be refreshed, never overwritten');
  assert.match(step, /Non-zero → stop/, 'a failing strict validation must stop the integration');
  for (const source of ['the plan', '`post-implementation-qa` results', 'the diff']) {
    assert.ok(step.includes(source), `the narrative must be written from ${source}`);
  }
  assert.match(step, /`Change-Record: none`, with the reason in the commit body/, 'trivial changes may use the opt-out trailer with a reason');
  assert.match(step, /never add `Change-Record: none` to hide it/, 'a sensors opt-out must not be disguised as an exemption');
}

function assertRecordRunsBeforeIntegration(text) {
  for (const option of ['#### Option 1: Merge Locally', '#### Option 2: Push and Create PR/MR']) {
    assert.match(section(text, option), /run Step 4\.0 \(retire design artifacts\), then Step 4\.1 \(Change Record\)/, `${option} must run the Change Record step before integrating`);
  }
  const at = heading => text.indexOf(`\n${heading}\n`);
  assert.ok(at('#### Step 4.0: Retire design artifacts (Options 1 & 2 only)') < at(STEP_41) && at(STEP_41) < at('#### Option 1: Merge Locally'),
    'Step 4.1 must sit after Step 4.0 and before Option 1');
}

function assertUnattendedKeepsRecordGate(text) {
  const unattended = section(text, '### Modo desatendido');
  assert.match(unattended, /el Step 4\.1 \(Change Record\)/, 'unattended mode must run the Change Record step');
  assert.match(unattended, /`awm change validate --strict`[^.]*pausa legítima/, 'a failing record step must be a legitimate pause in unattended mode');
}

function assertPrBodyFromRecord(text) {
  const option = section(text, '#### Option 2: Push and Create PR/MR');
  const body = option.match(/gh pr create[\s\S]*?\nEOF\n/);
  assert.ok(body, 'Option 2 must show the gh pr create body');
  for (const source of ['<summary_short>', '## Qué se hizo', '## Qué se probó', 'manual_validation']) {
    assert.ok(body[0].includes(source), `the PR body must draw from ${source}`);
  }
  assert.match(body[0], /^Change Record: \[`docs\/changes\/<file>`\]\(/m, 'the PR body must link the record file');
  assert.match(option, /not from memory/, 'the skill must say the body comes from the record');
}

test('R7.2: Step 4.1 runs the six record steps in order and stops on a failing strict validation', () => {
  const text = read(FINISHING);                               // verifies R7.2
  assertRecordSequence(text);
  assert.throws(() => assertRecordSequence(mutated(text, '6. **Validate:** `awm change validate --strict`', '6. **Validate:** `awm change validate`')), /strict validation step/);
  assert.throws(() => assertRecordSequence(mutated(text, 'Non-zero → stop', 'Non-zero → continue')), /must stop the integration/);
  assert.throws(() => assertRecordSequence(mutated(text, '`Change-Record: none`, with the reason in the commit body', '`Change-Record: none`')), /opt-out trailer/);
  assert.throws(() => assertRecordSequence(mutated(text, 'never add `Change-Record: none` to hide it', 'add `Change-Record: none`')), /disguised/);
  const early = mutated(text, '1. **Commit.**', '6. **Validate:** `awm change validate --strict` first\n1. **Commit.**');
  assert.throws(() => assertRecordSequence(early), /strict validation step out of order/);
});

test('R7.2: Options 1 and 2 run the record after Step 4.0 and before integrating, in both modes', () => {
  const text = read(FINISHING);                               // verifies R7.2
  assertRecordRunsBeforeIntegration(text);
  assertUnattendedKeepsRecordGate(text);
  assert.throws(() => assertRecordRunsBeforeIntegration(mutated(text, 'run Step 4.0 (retire design artifacts), then Step 4.1 (Change Record)', 'run Step 4.0 (retire design artifacts)')), /must run the Change Record step/);
  assert.throws(() => assertUnattendedKeepsRecordGate(mutated(text, 'pausa legítima como los tests rojos', 'advertencia')), /legitimate pause/);
});

test('R7.3: the Option 2 PR body is built from the record and links it', () => {
  const text = read(FINISHING);                               // verifies R7.3
  assertPrBodyFromRecord(text);
  assert.throws(() => assertPrBodyFromRecord(mutated(text, '<summary_short>\n', '<2-3 bullets of what changed>\n')), /draw from <summary_short>/);
  assert.throws(() => assertPrBodyFromRecord(mutated(text, 'Change Record: [`docs/changes/<file>`](', 'Record: (')), /link the record file/);
  assert.throws(() => assertPrBodyFromRecord(mutated(text, '<each manual_validation step>', '<each manual step>')), /draw from manual_validation/);
});
