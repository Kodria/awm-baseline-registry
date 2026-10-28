import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { compareSemver } from '../scripts/semver.mjs';

// R5 (S1) smoke + R1–R4 (S2) content asserts for #80.

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8').replace(/\r\n/g, '\n');

const DESIGN = 'docs/plans/2026-10-28-systematic-debugging-data-over-time-design.md';
const PKG = 'package.json';
const SCRIPT = 'test:systematic-debugging-data-over-time';
const CONTRACT = 'tests/r19-systematic-debugging-data-over-time-contract.test.mjs';
const SKILL = 'skills/systematic-debugging/SKILL.md';
const PHASE1 = '### Phase 1: Root Cause Investigation';
const CHECKLIST = '## Before Concluding "Not a Code Defect"';
const NO_ROOT = '## When Process Reveals "No Root Cause"';

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

function frontmatterVersion(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---/);
  assert.ok(match, 'skill frontmatter missing');
  const ver = match[1].match(/^version:\s*"?([^"\n]+)"?\s*$/m);
  assert.ok(ver, 'frontmatter version missing');
  return ver[1].trim();
}

test('R5: design pointer exists and names R1', () => {
  assert.equal(existsSync(path.join(root, DESIGN)), true, `${DESIGN} must exist`);
  assert.match(read(DESIGN), /\bR1\b/, 'design must mention R1');
});

test('R5: package.json wires test:systematic-debugging-data-over-time to this contract', () => {
  const pkg = JSON.parse(read(PKG));
  assert.ok(pkg.scripts && typeof pkg.scripts === 'object', 'package.json must declare scripts');
  const cmd = pkg.scripts[SCRIPT];
  assert.equal(typeof cmd, 'string', `scripts.${SCRIPT} must be a string`);
  assert.match(cmd, /node --test/, `scripts.${SCRIPT} must run node --test`);
  assert.ok(cmd.includes(CONTRACT) || cmd.includes('r19-systematic-debugging-data-over-time-contract'),
    `scripts.${SCRIPT} must point at ${CONTRACT}`);
  assert.equal(existsSync(path.join(root, CONTRACT)), true, `${CONTRACT} must exist`);
});

test('R1: Phase 1 includes step 6 data-over-time after Trace Data Flow', () => {
  const text = read(SKILL);
  const phase1 = section(text, PHASE1);
  const step5 = phase1.indexOf('5. **Trace Data Flow**');
  const step6 = phase1.indexOf('6. **Investigate Data-Dependent Behavior Over Time**');
  assert.ok(step5 >= 0, 'Phase 1 must keep Trace Data Flow');
  assert.ok(step6 >= 0, 'Phase 1 must include step 6 Investigate Data-Dependent Behavior Over Time');
  assert.ok(step6 > step5, 'step 6 must follow step 5');
  for (const needle of [
    'Reconstruct the timeline',
    'Separate snapshots from live reads',
    'Recompute the outcome',
    'stable identifiers',
    'Look at sibling records',
  ]) {
    assert.ok(phase1.includes(needle), `step 6 must include: ${needle}`);
  }
  const gone = mutated(text, '6. **Investigate Data-Dependent Behavior Over Time**', '6. **REMOVED**');
  assert.throws(
    () => {
      const body = section(gone, PHASE1);
      assert.ok(
        body.includes('6. **Investigate Data-Dependent Behavior Over Time**'),
        'Phase 1 must include step 6 Investigate Data-Dependent Behavior Over Time',
      );
    },
    /Investigate Data-Dependent/,
  );
});

test('R2: Before Concluding checklist precedes No Root Cause and has four boxes', () => {
  const text = read(SKILL);
  const checklistAt = text.indexOf(CHECKLIST);
  const noRootAt = text.indexOf(NO_ROOT);
  assert.ok(checklistAt >= 0, `missing ${CHECKLIST}`);
  assert.ok(noRootAt >= 0, `missing ${NO_ROOT}`);
  assert.ok(checklistAt < noRootAt, 'checklist must appear before No Root Cause');
  const body = section(text, CHECKLIST);
  const boxes = body.match(/^- \[ \]/gm) || [];
  assert.equal(boxes.length, 4, 'checklist must have exactly four unchecked boxes');
  assert.ok(/timeline/i.test(body), 'checkbox must cover timeline');
  assert.ok(/snapshot/i.test(body) && /live read/i.test(body), 'checkbox must cover snapshot vs live');
  assert.ok(/recomputed the outcome|recomputed outcome/i.test(body), 'checkbox must cover recompute');
  assert.ok(/stable identifiers/i.test(body), 'checkbox must cover stable identifiers');
  // Mutation: swap checklist and No Root Cause headings — order assert must fail.
  const swapped = text
    .replace(CHECKLIST, '## __CHECKLIST_TMP__')
    .replace(NO_ROOT, CHECKLIST)
    .replace('## __CHECKLIST_TMP__', NO_ROOT);
  assert.throws(
    () => {
      const c = swapped.indexOf(CHECKLIST);
      const n = swapped.indexOf(NO_ROOT);
      assert.ok(c >= 0 && n >= 0 && c < n, 'checklist must appear before No Root Cause');
    },
    /checklist must appear before No Root Cause/,
  );
});

test('R3: differing recomputed outcome is a code defect candidate', () => {
  const body = section(read(SKILL), CHECKLIST);
  assert.match(body, /recomputed outcome differs|differs from what the\s+system produced/i);
  assert.match(body, /code defect candidate/i);
  assert.throws(
    () => {
      const weak = mutated(body, 'code defect candidate', 'maybe a data issue');
      assert.match(weak, /code defect candidate/i);
    },
    /code defect candidate/,
  );
});

test('R4: systematic-debugging frontmatter version is at least 1.2.0', () => {
  const ver = frontmatterVersion(read(SKILL));
  assert.ok(compareSemver(ver, '1.2.0') >= 0, `version ${ver} must be >= 1.2.0`);
});
