import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { compareSemver } from '../scripts/semver.mjs';

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
  return text.replace(from, () => to);
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
  assert.ok(body.includes('Elige un slug que no use ningún'), 'the subsection must forbid reusing an existing record slug');
  assert.ok(body.includes('declara `**Change Record:** ninguno — <razón>`, sin backticks'), 'the subsection must give the opt-out header syntax');
  assert.ok(body.includes('`- ninguno — <razón>`, que se convierte en `manual_validation: {none: <razón>}`'), 'the subsection must map the ninguno criterion to a none item');
  assert.ok(body.includes('cada línea se convierte en un ítem `{step, expected}`'), 'each criterion line must become a step/expected item');
  assert.ok(body.includes('Con un CLI anterior el plan declara igual el slug y los criterios'), 'an old CLI must not change what the plan declares');
  assert.ok(body.includes('informa la limitación al cerrar y continúa sin record, nunca lo inventa'), 'the plan must announce that an old CLI closes without an invented record');
  assert.ok(body.includes('`awm change new` lo rechaza (`record-exists`) aunque la fecha difiera'), 'the slug clash must be explained as record-exists across dates');
  assert.ok(body.includes('y omite `**Criterios de aceptación:**`'), 'the trivial opt-out must omit the acceptance criteria');
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
  assert.throws(() => assertRecordSubsection(mutated(text, 'Elige un slug que no use ningún', 'Usa cualquier slug, aunque lo use un')), /forbid reusing an existing record slug/);
  assert.throws(() => assertRecordSubsection(mutated(text, 'declara `**Change Record:** ninguno — <razón>`, sin backticks', 'declara el opt-out')), /opt-out header syntax/);
  assert.throws(() => assertRecordSubsection(mutated(text, '`- ninguno — <razón>`, que se convierte en `manual_validation: {none: <razón>}`', '`- ninguno`')), /map the ninguno criterion/);
  assert.throws(() => assertRecordSubsection(mutated(text, 'cada línea se convierte en un ítem `{step, expected}`', 'cada línea vale')), /step\/expected item/);
  assert.throws(() => assertRecordSubsection(mutated(text, 'Con un CLI anterior el plan declara igual el slug y los criterios', 'Con un CLI anterior el plan omite el slug')), /must not change what the plan declares/);
  assert.throws(() => assertRecordSubsection(mutated(text, 'informa la limitación al cerrar y continúa sin record, nunca lo inventa', 'escribe el record a mano')), /closes without an invented record/);
  assert.throws(() => assertRecordSubsection(mutated(text, '`awm change new` lo rechaza (`record-exists`) aunque la fecha difiera', 'conviene')), /record-exists across dates/);
  assert.throws(() => assertRecordSubsection(mutated(text, 'y omite `**Criterios de aceptación:**`', 'y lista criterios')), /omit the acceptance criteria/);
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
  assert.ok(step.includes('with no flag other than `--base`'), 'the --refresh run must take no flag other than --base');
  assert.ok(step.includes('this branch added it'), 'refresh must be limited to a record this branch added');
  assert.ok(step.includes('or `git status --porcelain -- docs/changes/` shows it as untracked after an interrupted run'), 'refresh must also cover an untracked record from an interrupted run');
  assert.ok(step.includes('If an earlier change owns that slug, stop and report the collision'), 'a slug owned by an earlier change must stop as a collision');
  assert.ok(step.includes('Pass `--base <base-branch>` (from Step 2) to every `awm change new` and `awm change validate` call of this step'), 'every awm change call must pass the Step 2 base');
  assert.ok(step.includes('replace each run of characters outside `[a-z0-9]` with `-`'), 'the derived slug must normalise non-alphanumeric runs');
  assert.ok(step.includes('never edit `.awm/sensors.json` to obtain a receipt'), 'the agent must never tamper with the sensors manifest for a receipt');
  assert.ok(step.includes('never invent `{none}`'), 'a plan without criteria must not yield an invented none item');
  assert.match(step, /Non-zero → stop/, 'a failing strict validation must stop the integration');
  assert.ok(step.includes(NARRATIVE_SOURCES), 'the narrative must be written from the plan, the QA results and the diff (narrative sources)');
  assert.ok(step.includes('`"mode": "native-gate"`'), 'the native-gate sensors mode must be named');
  assert.ok(step.includes('the only non-pass verdict that does not stop'), 'the declared sensors modes must be the only non-pass verdict that continues');
  assert.match(step, /with the reason in the commit body and the trailer `Change-Record: none` in the final paragraph/, 'trivial changes may use the opt-out trailer with a reason');
  assert.ok(step.includes("git commit --allow-empty -F - <<'EOF'"), 'the opt-out commit must pass its message through a quoted heredoc');
  assert.ok(step.includes('in that same final paragraph, never after it'), 'attribution trailers must share the opt-out final paragraph');
  assert.ok(step.includes('`ninguno — <razón>` → commit any pending work'), 'Step 4.1 must consume the plan opt-out header');
  assert.ok(step.includes('never pass it to a shell'), 'a malformed header slug must never reach a shell');
  assert.ok(step.includes('never commit untracked files that are not part of the change'), 'step 1 must not sweep unrelated untracked files');
  assert.match(step, /Any other `overall` than `pass`[^\n]*stop exactly as for failing tests in Step 1/, 'any other non-pass sensors verdict must stop like failing tests');
  assert.ok(step.includes('Any other non-zero exit → stop and report the diagnostic'), 'any other awm change new failure must stop');
  assert.ok(step.includes('Any other code → stop and report it; do not improvise a fix'), 'an unmapped validation code must stop without improvising');
  const item4 = step.slice(step.search(RECORD_STEPS[3][1]), step.search(RECORD_STEPS[4][1]));
  assert.ok(item4.includes('`title` (at most 120 characters)'), 'the narrative must cap title at 120 characters');
  assert.ok(item4.includes('`summary_short` (one line, at most 280 characters'), 'the narrative must cap summary_short at 280 characters');
  assert.ok(item4.includes('one `{step, expected}` item per acceptance criterion'), 'manual_validation must hold one item per acceptance criterion');
  assert.ok(item4.includes('`risks` (may be `[]`)'), 'the narrative must include risks');
  assert.ok(item4.includes('`rollback` (how to undo the change)'), 'the narrative must include rollback');
  let sectionAt = -1;
  for (const heading of ['## Qué se hizo', '## Qué se probó', '## Qué falta validar', '## Riesgos y rollback']) {
    const at = item4.indexOf(`\`${heading}\``);
    assert.ok(at >= 0, `item 4 must list the body section ${heading}`);
    assert.ok(at > sectionAt, `item 4 lists the body section ${heading} out of order`);
    sectionAt = at;
  }
  assert.ok(item4.includes('Never edit the derived fields by hand'), 'the narrative must forbid editing derived fields');
  assert.ok(step.includes('after Step 4.0 and before the merge/push below. Skip entirely for Options 3 and 4.'), 'Step 4.1 must be skipped for Options 3 and 4');
  assert.ok(step.includes('once you check that it matches `^[a-z0-9]+(-[a-z0-9]+)*$` and has at most 64 characters'), 'the header slug must be checked against the slug rule');
  assert.ok(step.includes('stop and report the malformed header'), 'a malformed header slug must stop');
  assert.ok(step.includes('with a conventional-commit subject (`type(scope): subject`)'), 'step 1 must require a conventional-commit subject');
  assert.ok(step.includes('stage files by name'), 'step 1 must add each file explicitly');
  assert.ok(step.includes('if they keep the tree dirty, stop and report them instead'), 'step 1 must stop on a tree kept dirty by unrelated files');
  assert.ok(step.includes('The working tree must be clean: a dirty tree gets no sensor receipt.'), 'step 1 must leave a clean tree');
  assert.ok(step.includes('`"mode": "opt-out"` or `"mode": "native-gate"`'), 'the opt-out sensors mode must be named');
  assert.ok(step.includes('if the reason is uncommitted changes of this change'), "the receipt retry must commit only this change's work");
  assert.ok(step.includes("(the plan's repo-relative path, only when the plan file lives inside this repository)"), '--plan must be a repo-relative path inside the repository');
  assert.ok(step.includes("never refresh, rename or delete another change's record on your own"), "Step 4.1 must never touch another change's record");
  assert.ok(step.includes(', and never merge or push past a failing strict validation, in either mode'), 'a failing strict validation must block integration in both modes');
  assert.ok(step.includes('`pending-content`, `field-invalid` or `body-section-missing` → step 4'), 'content diagnostics must resume at step 4');
  assert.ok(step.includes('`record-uncommitted` → step 5'), 'record-uncommitted must resume at step 5');
  assert.ok(step.includes('`code-changed-after-verification`, `derived-mismatch`, `receipt-missing` or `verification-mismatch` → step 2, then `--refresh` in step 3'), 'verification-drift diagnostics must resume at step 2 with a refresh');
  assert.ok(step.includes('`verification-not-passing` → fix the sensors and commit, then step 2 and `--refresh` in step 3'), 'verification-not-passing must fix the sensors before re-running step 2');
  const optOutAt = step.indexOf('**Trivial changes (opt-out):**');
  assert.ok(optOutAt >= 0, 'Step 4.1 must describe the trivial opt-out');
  const optOut = step.slice(optOutAt);
  assert.ok(optOut.includes('or, in interactive mode, when the human decides so'), 'only a human in interactive mode may choose the opt-out');
  assert.ok(optOut.includes("Make the opt-out commit the branch's last commit"), 'the opt-out commit must close the branch');
  assert.ok(optOut.includes('so a reason taken from the plan (backticks, `$(…)`) is never run by the shell'), 'the heredoc must keep the plan reason away from the shell');
  assert.ok(optOut.includes('a paragraph added after it (for example a separate attribution block) makes validation report `record-missing`'), 'the skill must explain that a later paragraph voids the trailer');
  assert.ok(optOut.includes('exit 0; anything else → stop and report it'), 'the opt-out validation must stop on anything but the exempt line');
  const block = optOut.match(/```bash\n([\s\S]*?)\n```/);
  assert.ok(block, 'the trivial opt-out must show its commit command');
  const lines = block[1].split('\n');
  const eof = lines.indexOf('EOF');
  assert.ok(eof > 1, 'the opt-out heredoc must close with EOF');
  const message = lines.slice(1, eof);
  assert.ok(message.filter(line => line.trim()).at(-1) === 'Change-Record: none', 'the opt-out heredoc must end with the Change-Record: none trailer');
  assert.ok(!message[0].includes('Change-Record'), 'the opt-out heredoc must keep the trailer out of the subject');
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
  assert.ok(section(text, OPTION_1).includes('git merge --no-ff <feature-branch>'), 'Option 1 must merge with a merge commit');
}

function assertCommonMistakesQualifyRefresh(text) {
  const mistakes = section(text, '## Common Mistakes');
  assert.ok(mistakes.includes('`record-exists` for a record this branch added (refresh; a slug owned by an earlier change stops as a collision)'), 'Common Mistakes must limit the record-exists exception to a record this branch added');
}

function assertRedFlagsGuardRecord(text) {
  const flags = section(text, '## Red Flags');
  assert.ok(flags.includes('- Merge or push after `awm change validate --strict` failed'), 'Red Flags must forbid integrating after a failed strict validation');
  assert.ok(flags.includes('- Invent a Change Record or edit its derived fields by hand'), 'Red Flags must forbid inventing a record or hand-editing derived fields');
  assert.ok(flags.includes('- Run Step 4.1 (Change Record) after Step 4.0 and before the merge/push of Options 1 & 2'), 'Red Flags must always run Step 4.1 before integrating');
}

function assertUnattendedKeepsRecordGate(text) {
  const unattended = section(text, '### Modo desatendido');
  assert.match(unattended, /el Step 4\.1 \(Change Record\)/, 'unattended mode must run the Change Record step');
  assert.match(unattended, /`awm change validate --strict`[^.]*pausa legítima/, 'a failing record step must be a legitimate pause in unattended mode');
  assert.ok(unattended.includes('salvo `record-exists`'), 'unattended mode must exempt record-exists from the pause');
  assert.ok(unattended.includes('nunca lo elijas por criterio propio'), 'unattended mode must forbid choosing the trivial opt-out on its own');
  assert.ok(unattended.includes('si `awm sensors run` no da `pass`'), 'unattended mode must pause on a non-pass sensors run');
  assert.ok(unattended.includes('un intento por diagnóstico que el paso 6 mapea'), 'unattended mode must bound the step 6 fix loop');
  assert.ok(unattended.includes('un código no mapeado, o el mismo diagnóstico repetido tras su corrección, no se reintenta'), 'unattended mode must not retry unmapped or repeated diagnostics');
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
  assert.ok(option.includes('`Change Record: docs/changes/<file> @ <record-commit-sha>`'), 'other hosts must get a plain record reference with its commit');
  assert.ok(option.includes('`Sin validación manual: <razón>`'), 'a none manual_validation must become the Sin validación manual line');
  assert.ok(body[0].includes('/blob/<record-commit-sha>/docs/changes/<file>'), 'the gh link must pin the record commit');
  assert.ok(option.includes('with any credentials removed'), 'the web URL must drop credentials');
  assert.ok(option.includes('Never copy userinfo, tokens or query strings'), 'the PR body must never carry remote secrets');
  assert.ok(section(text, STEP_41).includes('for Option 2 also end the PR/MR description with a `Change-Record: none` paragraph'), 'the opt-out must also close the PR/MR description');
  assert.ok(section(text, STEP_41).includes('also end the PR/MR description with a `Change-Record: none` paragraph, placed after any footer (attribution, links)'), 'the squash trailer paragraph must follow any description footer');
  assert.ok(option.includes('; for the trivial opt-out, with `Change Record: ninguno — <razón>`, and end the body with a `Change-Record: none` paragraph'), 'the opt-out PR body must use the ninguno line and the closing trailer');
  assert.ok(option.includes('any footer the body carries (attribution, links) goes before that paragraph, never after it'), 'PR body footers must precede the closing trailer paragraph');
  assert.ok(option.includes('`<web-url>/-/blob/<record-commit-sha>/docs/changes/<file>` on GitLab'), 'the GitLab link must pin the record commit');
  assert.ok(option.includes('Give the operator the PR/MR body built above, ready to paste.'), 'the degraded path must hand over the built body');
  assert.ok(option.includes('built exactly like the `gh` body above'), 'the glab description must match the gh body');
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
  fails('with no flag other than `--base`', 'with any flag', /--refresh run must take/);
  fails('this branch added it', 'it exists', /limited to a record this branch added/);
  fails('`git status --porcelain -- docs/changes/` shows it as untracked', 'it is tracked', /untracked record from an interrupted run/);
  fails('If an earlier change owns that slug, stop and report the collision', 'If an earlier change owns that slug, refresh it', /stop as a collision/);
  fails('Pass `--base <base-branch>` (from Step 2) to every `awm change new` and `awm change validate` call of this step', 'Pass nothing extra', /must pass the Step 2 base/);
  fails('replace each run of characters outside `[a-z0-9]` with `-`', 'keep other characters', /normalise non-alphanumeric runs/);
  fails('never edit `.awm/sensors.json` to obtain a receipt', 'edit the manifest if needed', /never tamper with the sensors manifest/);
  fails('never invent `{none}`', 'use `{none}`', /invented none item/);
  fails('Non-zero → stop', 'Non-zero → continue', /must stop the integration/);
  fails(NARRATIVE_SOURCES, 'drawing from the `post-implementation-qa` results and the diff', /narrative sources/);
  fails(NARRATIVE_SOURCES, 'drawing from the plan (goal and `**Criterios de aceptación:**`) and the diff', /narrative sources/);
  fails(NARRATIVE_SOURCES, 'drawing from the plan (goal and `**Criterios de aceptación:**`) and the `post-implementation-qa` results', /narrative sources/);
  fails('`"mode": "native-gate"`', '`"mode": "gate"`', /native-gate sensors mode/);
  fails('the only non-pass verdict that does not stop', 'a non-pass verdict', /only non-pass verdict that continues/);
  fails('with the reason in the commit body and the trailer `Change-Record: none` in the final paragraph', 'with the trailer `Change-Record: none`', /opt-out trailer/);
  fails("git commit --allow-empty -F - <<'EOF'", 'git commit --allow-empty -m "<message>"', /quoted heredoc/);
  fails('in that same final paragraph, never after it', 'after it', /share the opt-out final paragraph/);
  fails('`ninguno — <razón>` → commit any pending work', '`ninguno` → commit any pending work', /consume the plan opt-out header/);
  fails('never pass it to a shell', 'pass it on', /never reach a shell/);
  fails('never commit untracked files that are not part of the change', 'commit everything', /sweep unrelated untracked files/);
  fails('stop exactly as for failing tests in Step 1', 'continue', /non-pass sensors verdict must stop/);
  fails('Any other non-zero exit → stop and report the diagnostic', 'Any other non-zero exit → retry', /awm change new failure must stop/);
  fails('Any other code → stop and report it; do not improvise a fix', 'Any other code → improvise a fix', /unmapped validation code/);
  fails('`title` (at most 120 characters)', '`title`', /cap title at 120/);
  fails('`summary_short` (one line, at most 280 characters', '`summary_short` (one line', /cap summary_short at 280/);
  fails('one `{step, expected}` item per acceptance criterion', 'some items', /one item per acceptance criterion/);
  fails('`risks` (may be `[]`)', '`hazards` (may be `[]`)', /include risks/);
  fails('`rollback` (how to undo the change)', '`undo`', /include rollback/);
  fails('`## Qué se hizo`, `## Qué se probó` (only', '`## Qué se probó` (only', /list the body section ## Qué se hizo/);
  fails('`## Qué se probó` (only checks', '(only checks', /list the body section ## Qué se probó/);
  fails('`## Qué falta validar`, `## Riesgos y rollback`', '`## Riesgos y rollback`', /list the body section ## Qué falta validar/);
  fails('`## Qué falta validar`, `## Riesgos y rollback`', '`## Qué falta validar`', /list the body section ## Riesgos y rollback/);
  fails('`## Qué se hizo`, `## Qué se probó` (only checks that actually ran, with their result)', '`## Qué se probó` (only checks that actually ran, with their result), `## Qué se hizo`', /body section ## Qué se probó out of order/);
  fails('Never edit the derived fields by hand', 'Edit the derived fields freely', /forbid editing derived fields/);
  fails('after Step 4.0 and before the merge/push below. Skip entirely for Options 3 and 4.', 'after Step 4.0 and before the merge/push below.', /skipped for Options 3 and 4/);
  fails('once you check that it matches `^[a-z0-9]+(-[a-z0-9]+)*$` and has at most 64 characters', 'once you read it', /checked against the slug rule/);
  fails('stop and report the malformed header', 'use it anyway', /malformed header slug must stop/);
  fails('with a conventional-commit subject (`type(scope): subject`)', 'with any subject', /require a conventional-commit subject/);
  fails('stage files by name', 'stage everything', /add each file explicitly/);
  fails('if they keep the tree dirty, stop and report them instead', 'if they keep the tree dirty, ignore them', /tree kept dirty by unrelated files/);
  fails('The working tree must be clean: a dirty tree gets no sensor receipt.', '', /leave a clean tree/);
  fails('`"mode": "opt-out"` or `"mode": "native-gate"`', '`"mode": "native-gate"`', /opt-out sensors mode must be named/);
  fails('if the reason is uncommitted changes of this change', 'if the reason is uncommitted changes', /commit only this change's work/);
  fails("(the plan's repo-relative path, only when the plan file lives inside this repository)", '(any path)', /repo-relative path inside the repository/);
  fails("never refresh, rename or delete another change's record on your own", 'delete it if needed', /never touch another change's record/);
  fails(', and never merge or push past a failing strict validation, in either mode', '', /block integration in both modes/);
  fails('`pending-content`, `field-invalid` or `body-section-missing` → step 4', '`pending-content`, `field-invalid` or `body-section-missing` → step 6', /content diagnostics must resume at step 4/);
  fails('`record-uncommitted` → step 5', '`record-uncommitted` → step 4', /record-uncommitted must resume at step 5/);
  fails('`code-changed-after-verification`, `derived-mismatch`, `receipt-missing` or `verification-mismatch` → step 2, then `--refresh` in step 3', '`code-changed-after-verification`, `derived-mismatch`, `receipt-missing` or `verification-mismatch` → step 4', /verification-drift diagnostics/);
  fails('`verification-not-passing` → fix the sensors and commit, then step 2 and `--refresh` in step 3', '`verification-not-passing` → step 6', /fix the sensors before re-running step 2/);
  fails('**Trivial changes (opt-out):**', '**Trivial changes:**', /describe the trivial opt-out/);
  fails('or, in interactive mode, when the human decides so', 'or when the agent decides so', /only a human in interactive mode/);
  fails("Make the opt-out commit the branch's last commit", 'Add the opt-out commit', /opt-out commit must close the branch/);
  fails('so a reason taken from the plan (backticks, `$(…)`) is never run by the shell', 'for style', /keep the plan reason away from the shell/);
  fails('a paragraph added after it (for example a separate attribution block) makes validation report `record-missing`', 'that is all', /later paragraph voids the trailer/);
  fails('exit 0; anything else → stop and report it', 'exit 0; otherwise continue', /stop on anything but the exempt line/);
  fails('Change-Record: none\nEOF\n```', 'Change-Record: none\n```', /close with EOF/);
  fails('chore: <subject>\n\n<razón>\n\nChange-Record: none\nEOF', 'chore: <subject> Change-Record: none\n\n<razón>\nEOF', /end with the Change-Record: none trailer/);
  fails('chore: <subject>\n', 'chore: <subject> Change-Record: none\n', /trailer out of the subject/);
  fails('never add `Change-Record: none` to hide it', 'add `Change-Record: none`', /disguised/);
  fails('Never choose it on your own judgment, and never after any of steps 2–6 failed', 'Choose it freely', /on its own or after a failing step/);
  fails('Change Record validation: exempt (Change-Record: none)', 'Change Record validation: ok', /exempt validation line/);
  fails('commit any pending work (step 1), then go straight to **Trivial changes (opt-out)** below; steps 2–6 do not run', 'go straight to **Trivial changes (opt-out)** below; steps 1–6 do not run', /commit pending work before skipping steps 2–6/);
  fails('`--allow-empty` is only for when nothing is pending', '`--allow-empty` always', /reserve --allow-empty for an empty tree/);
  assertCommonMistakesQualifyRefresh(text);
  assertRedFlagsGuardRecord(text);
  assert.throws(() => assertRedFlagsGuardRecord(mutated(text, '- Merge or push after `awm change validate --strict` failed\n', '')), /integrating after a failed strict validation/);
  assert.throws(() => assertRedFlagsGuardRecord(mutated(text, '- Invent a Change Record or edit its derived fields by hand\n', '')), /inventing a record or hand-editing/);
  assert.throws(() => assertRedFlagsGuardRecord(mutated(text, '- Run Step 4.1 (Change Record) after Step 4.0 and before the merge/push of Options 1 & 2\n', '')), /always run Step 4\.1 before integrating/);
  assert.throws(() => assertCommonMistakesQualifyRefresh(mutated(text, '`record-exists` for a record this branch added (refresh; a slug owned by an earlier change stops as a collision)', '`record-exists` (refresh)')), /limit the record-exists exception/);
});

test('R7.2: Options 1 and 2 run the record after Step 4.0 and before integrating, in both modes', () => {
  const text = read(FINISHING);                               // verifies R7.2
  assertRecordRunsBeforeIntegration(text);
  assertUnattendedKeepsRecordGate(text);
  const integration = (from, to, expected) => assert.throws(() => assertRecordRunsBeforeIntegration(mutated(text, from, to)), expected);
  integration(STEP_40, '#### Step 4.0: Retire artifacts', /missing heading #### Step 4\.0/);
  integration('Then continue with Step 4.1 (Change Record).\n', `Then continue with Step 4.1 (Change Record).\n${OPTION_1}\n`, /after Step 4\.0 and before Option 1/);
  integration('run Step 4.0 (retire design artifacts), then Step 4.1 (Change Record)', 'run Step 4.0 (retire design artifacts)', /Option 1: Merge Locally must run the Change Record step/);
  integration('git merge --no-ff <feature-branch>', 'git merge <feature-branch>', /merge with a merge commit/);
  integration(`${OPTION_2}\n\n**First, run Step 4.0 (retire design artifacts), then Step 4.1 (Change Record).**`, `${OPTION_2}\n\n**First, run Step 4.0 (retire design artifacts).**`, /Option 2: Push and Create PR\/MR must run the Change Record step/);
  const unattended = (from, to, expected) => assert.throws(() => assertUnattendedKeepsRecordGate(mutated(text, from, to)), expected);
  unattended('y el Step 4.1 (Change Record) automáticamente', 'automáticamente', /must run the Change Record step/);
  unattended('pausa legítima como los tests rojos', 'advertencia', /legitimate pause/);
  unattended('salvo `record-exists`', 'sin excepción', /exempt record-exists from the pause/);
  unattended('nunca lo elijas por criterio propio', 'elígelo libremente', /forbid choosing the trivial opt-out/);
  unattended('si `awm sensors run` no da `pass`', 'si `awm sensors run` falla', /pause on a non-pass sensors run/);
  unattended('un intento por diagnóstico que el paso 6 mapea', 'reintentos libres', /bound the step 6 fix loop/);
  unattended('; un código no mapeado, o el mismo diagnóstico repetido tras su corrección, no se reintenta', '', /not retry unmapped or repeated diagnostics/);
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
  fails('`Change Record: docs/changes/<file> @ <record-commit-sha>`', '`Change Record: docs/changes/<file>`', /plain record reference/);
  fails('`Sin validación manual: <razón>`', 'nothing', /Sin validación manual line/);
  fails('](<web-url>/blob/<record-commit-sha>/docs/changes/<file>)', '](<web-url>/blob/<feature-branch>/docs/changes/<file>)', /gh link must pin the record commit/);
  fails('with any credentials removed', 'as is', /drop credentials/);
  fails('Never copy userinfo, tokens or query strings', 'Copy the remote verbatim', /never carry remote secrets/);
  fails('for Option 2 also end the PR/MR description with a `Change-Record: none` paragraph', 'for Option 2 do nothing more', /also close the PR\/MR description/);
  fails(', placed after any footer (attribution, links)', '', /follow any description footer/);
  fails('; for the trivial opt-out, with `Change Record: ninguno — <razón>`, and end the body with a `Change-Record: none` paragraph', '', /ninguno line and the closing trailer/);
  fails('any footer the body carries (attribution, links) goes before that paragraph, never after it', 'footers go anywhere', /footers must precede the closing trailer/);
  fails('`<web-url>/-/blob/<record-commit-sha>/docs/changes/<file>` on GitLab', '`<web-url>/-/blob/main/docs/changes/<file>` on GitLab', /GitLab link must pin the record commit/);
  fails('Give the operator the PR/MR body built above, ready to paste.', '', /hand over the built body/);
  fails('built exactly like the `gh` body above', 'covering the summary and test plan', /glab description must match the gh body/);
});

const MIN_CLI = '9.20.0';

function assertDeclaresMinimumCli(text, name) {
  assert.ok(text.includes(`\`agentic-workflow-manager\` ≥ ${MIN_CLI}`), `${name} must declare the minimum CLI version ${MIN_CLI}`);
}

function assertGracefulDegradation(text) {
  const step = section(text, STEP_41);
  assert.match(step, /^0\. \*\*Version gate\.\*\*/m, 'Step 4.1 must start with the version gate');
  assert.ok(step.indexOf('0. **Version gate.**') < step.indexOf('1. **Commit.**'), 'the version gate must run before the record steps');
  const lead = step.indexOf(RECORD_LEAD);
  assert.ok(lead >= 0 && step.indexOf('0. **Version gate.**') < lead, 'the version gate must precede the plan-level opt-out decision');
  assert.match(step, /`awm --version`/, 'the gate must read the installed CLI version');
  assert.match(step, /compare major, minor and patch as integers/, 'the gate must compare semver numerically');
  assert.ok(step.includes('is not found, exits non-zero, or prints a version below 9.20.0'), 'the gate must define a missing CLI');
  assert.match(step, /do not probe with `--help`/, 'the gate must not trust --help, which older CLIs answer with exit 0');
  assert.match(step, /state the limitation once/, 'an old CLI must be reported, not hidden');
  assert.match(step, /continue to the merge\/push without a record — never write a record by hand or invent its fields/, 'an old CLI must neither block integration nor be papered over');
  assert.ok(section(text, '### Modo desatendido').includes('CLI ausente o anterior a 9.20.0'), 'unattended mode must also continue without a record on a CLI older than the minimum');
  assert.ok(step.includes('still make the opt-out commit'), 'an old CLI must still make a declared opt-out commit');
  assert.ok(step.includes('In Option 2, build the body as for the trivial opt-out (`Change Record: ninguno — <razón>` and the closing `Change-Record: none` paragraph), not with the limitation line'), 'an old CLI with a declared opt-out must build the trivial opt-out PR body');
}

test('R7.4: both changed skills declare the minimum CLI version that ships the Change Record', () => {
  for (const name of [WRITING, FINISHING]) {                  // verifies R7.4
    const text = read(name);
    assertDeclaresMinimumCli(text, name);
    assert.throws(() => assertDeclaresMinimumCli(mutated(text, `\`agentic-workflow-manager\` ≥ ${MIN_CLI}`, '`agentic-workflow-manager` ≥ 9.19.0'), name), /must declare the minimum CLI version/);
  }
});

test('R7.4: finishing states the limitation and continues without inventing a record on an older CLI', () => {
  const text = read(FINISHING);                               // verifies R7.4
  assertGracefulDegradation(text);
  assert.throws(() => assertGracefulDegradation(mutated(text, ' — never write a record by hand or invent its fields', '')), /papered over/);
  assert.throws(() => assertGracefulDegradation(mutated(text, 'do not probe with `--help`', 'probe with `--help`')), /must not trust --help/);
  assert.throws(() => assertGracefulDegradation(mutated(text, '0. **Version gate.**', '7. **Version gate.**')), /start with the version gate/);
  assert.throws(() => assertGracefulDegradation(mutated(mutated(text, RECORD_LEAD, '**Read the header.**'), 'Every integrated change leaves one Change Record', `${RECORD_LEAD} Every integrated change leaves one Change Record`)), /precede the plan-level opt-out decision/);
  assert.throws(() => assertGracefulDegradation(mutated(text, 'CLI ausente o anterior a 9.20.0', 'CLI antiguo')), /unattended mode must also continue/);
  assert.throws(() => assertGracefulDegradation(mutated(text, 'compare major, minor and patch as integers', 'compare the versions')), /compare semver numerically/);
  assert.throws(() => assertGracefulDegradation(mutated(text, 'is not found, exits non-zero, or prints a version below 9.20.0', 'is older')), /define a missing CLI/);
  assert.throws(() => assertGracefulDegradation(mutated(text, 'with `awm --version`', 'with `awm version`')), /read the installed CLI version/);
  assert.throws(() => assertGracefulDegradation(mutated(text, 'state the limitation once', 'note it')), /reported, not hidden/);
  assert.throws(() => assertGracefulDegradation(mutated(text, 'still make the opt-out commit', 'skip the opt-out commit')), /still make a declared opt-out commit/);
  assert.throws(() => assertGracefulDegradation(mutated(text, 'build the body as for the trivial opt-out', 'build the body with the limitation line')), /build the trivial opt-out PR body/);
});

function assertFloorBelowMinimum(floor) {
  assert.ok(compareSemver(floor, MIN_CLI) < 0, `the registry floor ${floor} must stay below the per-skill minimum ${MIN_CLI}: older CLIs degrade, they are not refused`);
}

test('R7.4: the per-skill minimum never raises the registry compatibility floor', () => {
  assertFloorBelowMinimum(JSON.parse(read('awm-registry.json')).minCliVersion); // verifies R7.4
  assert.throws(() => assertFloorBelowMinimum('9.20.0'), /must stay below/);
  assert.throws(() => assertFloorBelowMinimum('10.0.0'), /must stay below/);
});
