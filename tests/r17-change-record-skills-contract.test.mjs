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
const STEP_40 = '#### Step 4.0: Retire design artifacts (Options 1 & 2 only)';
const OPTION_1 = '#### Option 1: Merge Locally';
const OPTION_2 = '#### Option 2: Push and Create PR/MR';
const RECORD_LEAD = "**Before step 1, read the plan's `**Change Record:**` header.**";
const NARRATIVE_SOURCES = 'drawing from the plan (goal and `**Criterios de aceptación:**`), the `post-implementation-qa` results and the diff';
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
  const lead = step.indexOf(RECORD_LEAD);
  assert.ok(lead >= 0, 'Step 4.1 must open with the plan-header lead paragraph');
  assert.ok(lead < step.search(RECORD_STEPS[0][1]), 'the plan-header lead paragraph must precede step 1');
  assert.ok(step.includes('commit any pending work (step 1), then go straight to **Trivial changes (opt-out)** below; steps 2–6 do not run'), 'the plan-level opt-out must commit pending work before skipping steps 2–6');
  assert.match(step, /`awm change new <slug> --refresh`/, 'an existing record must be refreshed, never overwritten');
  assert.ok(step.includes('with no other flag'), 'the --refresh run must take no other flag');
  assert.match(step, /Non-zero → stop/, 'a failing strict validation must stop the integration');
  assert.ok(step.includes(NARRATIVE_SOURCES), 'the narrative must be written from the plan, the QA results and the diff (narrative sources)');
  assert.ok(step.includes('`"mode": "native-gate"`'), 'the native-gate sensors mode must be named');
  assert.ok(step.includes('the only non-pass verdict that does not stop'), 'the declared sensors modes must be the only non-pass verdict that continues');
  assert.match(step, /with the reason in the commit body and the trailer `Change-Record: none` as the final paragraph/, 'trivial changes may use the opt-out trailer with a reason');
  assert.match(step, /never add `Change-Record: none` to hide it/, 'a sensors opt-out must not be disguised as an exemption');
  assert.ok(step.includes('Never choose it on your own judgment, and never after any of steps 2–6 failed'), 'the agent must never choose the trivial opt-out on its own or after a failing step');
  assert.ok(step.includes('Change Record validation: exempt (Change-Record: none)'), 'the opt-out must be confirmed by the exempt validation line');
  assert.ok(step.includes('`--allow-empty` is only for when nothing is pending'), 'the opt-out commit must reserve --allow-empty for an empty tree');
}

function assertRecordRunsBeforeIntegration(text) {
  const at = heading => text.indexOf(`\n${heading}\n`);
  const [i40, i41, iOpt1] = [STEP_40, STEP_41, OPTION_1].map(at);
  for (const [heading, i] of [[STEP_40, i40], [STEP_41, i41], [OPTION_1, iOpt1]]) {
    assert.ok(i >= 0, `missing heading ${heading}`);
  }
  assert.ok(i40 < i41 && i41 < iOpt1, 'Step 4.1 must sit after Step 4.0 and before Option 1');
  for (const option of [OPTION_1, OPTION_2]) {
    assert.match(section(text, option), /run Step 4\.0 \(retire design artifacts\), then Step 4\.1 \(Change Record\)/, `${option} must run the Change Record step before integrating`);
  }
}

function assertUnattendedKeepsRecordGate(text) {
  const unattended = section(text, '### Modo desatendido');
  assert.match(unattended, /el Step 4\.1 \(Change Record\)/, 'unattended mode must run the Change Record step');
  assert.match(unattended, /`awm change validate --strict`[^.]*pausa legítima/, 'a failing record step must be a legitimate pause in unattended mode');
  assert.ok(unattended.includes('salvo `record-exists`'), 'unattended mode must exempt record-exists from the pause');
  assert.ok(unattended.includes('nunca lo elijas por criterio propio'), 'unattended mode must forbid choosing the trivial opt-out on its own');
}

function assertPrBodyFromRecord(text) {
  const option = section(text, OPTION_2);
  const body = option.match(/gh pr create[\s\S]*?\nEOF\n/);
  assert.ok(body, 'Option 2 must show the gh pr create body');
  for (const source of ['<summary_short>', '## Qué se hizo', '## Qué se probó', 'manual_validation']) {
    assert.ok(body[0].includes(source), `the PR body must draw from ${source}`);
  }
  assert.match(body[0], /^Change Record: \[`docs\/changes\/<file>`\]\(/m, 'the PR body must link the record file');
  assert.match(option, /not from memory/, 'the skill must say the body comes from the record');
  assert.ok(option.includes('`git log -1 --format=%H -- docs/changes/<file>`'), 'the record link must pin the last commit that changed the record');
  assert.ok(option.includes('`Change Record: no generado — <motivo>`'), 'the PR body must state a Step 4.1 limitation line');
}

test('R7.2: Step 4.1 runs the six record steps in order and stops on a failing strict validation', () => {
  const text = read(FINISHING);                               // verifies R7.2
  assertRecordSequence(text);
  const fails = (from, to, expected) => assert.throws(() => assertRecordSequence(mutated(text, from, to)), expected);
  fails('1. **Commit.**', '1. **Save.**', /include the commit step/);
  fails('2. **Run the sensors:**', '2. **Sensors:**', /include the sensors step/);
  fails('3. **Create the skeleton:**', '3. **Skeleton:**', /include the skeleton step/);
  fails('4. **Write the narrative.**', '4. **Narrative.**', /include the narrative step/);
  fails('5. **Commit the record**', '5. **Save the record**', /include the record commit step/);
  fails('6. **Validate:** `awm change validate --strict`', '6. **Validate:** `awm change validate`', /include the strict validation step/);
  fails('1. **Commit.**', '6. **Validate:** `awm change validate --strict` first\n1. **Commit.**', /strict validation step out of order/);
  fails(RECORD_LEAD, '**Read the header.**', /open with the plan-header lead paragraph/);
  assert.throws(() => assertRecordSequence(mutated(mutated(text, RECORD_LEAD, '**Read the header.**'), '1. **Commit.** ', `1. **Commit.** ${RECORD_LEAD} `)), /lead paragraph must precede step 1/);
  fails('`awm change new <slug> --refresh`', '`awm change new <slug>` again', /refreshed, never overwritten/);
  fails('with no other flag', 'with any flag', /--refresh run must take/);
  fails('Non-zero → stop', 'Non-zero → continue', /must stop the integration/);
  fails(NARRATIVE_SOURCES, 'drawing from the `post-implementation-qa` results and the diff', /narrative sources/);
  fails(NARRATIVE_SOURCES, 'drawing from the plan (goal and `**Criterios de aceptación:**`) and the diff', /narrative sources/);
  fails(NARRATIVE_SOURCES, 'drawing from the plan (goal and `**Criterios de aceptación:**`) and the `post-implementation-qa` results', /narrative sources/);
  fails('`"mode": "native-gate"`', '`"mode": "gate"`', /native-gate sensors mode/);
  fails('the only non-pass verdict that does not stop', 'a non-pass verdict', /only non-pass verdict that continues/);
  fails('with the reason in the commit body and the trailer `Change-Record: none` as the final paragraph', 'with the trailer `Change-Record: none`', /opt-out trailer/);
  fails('never add `Change-Record: none` to hide it', 'add `Change-Record: none`', /disguised/);
  fails('Never choose it on your own judgment, and never after any of steps 2–6 failed', 'Choose it freely', /on its own or after a failing step/);
  fails('Change Record validation: exempt (Change-Record: none)', 'Change Record validation: ok', /exempt validation line/);
  fails('commit any pending work (step 1), then go straight to **Trivial changes (opt-out)** below; steps 2–6 do not run', 'go straight to **Trivial changes (opt-out)** below; steps 1–6 do not run', /commit pending work before skipping steps 2–6/);
  fails('`--allow-empty` is only for when nothing is pending', '`--allow-empty` always', /reserve --allow-empty for an empty tree/);
});

test('R7.2: Options 1 and 2 run the record after Step 4.0 and before integrating, in both modes', () => {
  const text = read(FINISHING);                               // verifies R7.2
  assertRecordRunsBeforeIntegration(text);
  assertUnattendedKeepsRecordGate(text);
  const integration = (from, to, expected) => assert.throws(() => assertRecordRunsBeforeIntegration(mutated(text, from, to)), expected);
  integration(STEP_40, '#### Step 4.0: Retire artifacts', /missing heading #### Step 4\.0/);
  integration('Then continue with Step 4.1 (Change Record).\n', `Then continue with Step 4.1 (Change Record).\n${OPTION_1}\n`, /after Step 4\.0 and before Option 1/);
  integration('run Step 4.0 (retire design artifacts), then Step 4.1 (Change Record)', 'run Step 4.0 (retire design artifacts)', /Option 1: Merge Locally must run the Change Record step/);
  integration(`${OPTION_2}\n\n**First, run Step 4.0 (retire design artifacts), then Step 4.1 (Change Record).**`, `${OPTION_2}\n\n**First, run Step 4.0 (retire design artifacts).**`, /Option 2: Push and Create PR\/MR must run the Change Record step/);
  const unattended = (from, to, expected) => assert.throws(() => assertUnattendedKeepsRecordGate(mutated(text, from, to)), expected);
  unattended('y el Step 4.1 (Change Record) automáticamente', 'automáticamente', /must run the Change Record step/);
  unattended('pausa legítima como los tests rojos', 'advertencia', /legitimate pause/);
  unattended('salvo `record-exists`', 'sin excepción', /exempt record-exists from the pause/);
  unattended('nunca lo elijas por criterio propio', 'elígelo libremente', /forbid choosing the trivial opt-out/);
});

test('R7.3: the Option 2 PR body is built from the record and links it', () => {
  const text = read(FINISHING);                               // verifies R7.3
  assertPrBodyFromRecord(text);
  const fails = (from, to, expected) => assert.throws(() => assertPrBodyFromRecord(mutated(text, from, to)), expected);
  fails('<summary_short>\n', '<2-3 bullets of what changed>\n', /draw from <summary_short>/);
  fails('<bullets from ## Qué se hizo>', '<bullets of what changed>', /draw from ## Qué se hizo/);
  fails('<each check from ## Qué se probó>', '<each check>', /draw from ## Qué se probó/);
  fails('<each manual_validation step>', '<each manual step>', /draw from manual_validation/);
  fails('Change Record: [`docs/changes/<file>`](', 'Record: (', /link the record file/);
  fails('not from memory', 'from the record', /comes from the record/);
  fails('`git log -1 --format=%H -- docs/changes/<file>`', '`git rev-parse HEAD`', /pin the last commit that changed the record/);
  fails('`Change Record: no generado — <motivo>`', '`Change Record: ausente`', /state a Step 4\.1 limitation line/);
});
