import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import test from 'node:test';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const bytes = path => statSync(new URL(`../${path}`, import.meta.url)).size;
const plan = read('docs/plans/2026-08-25-r1-context-footprint-plan.md');
const usingAwm = read('skills/using-awm/SKILL.md');
const development = read('skills/development-process/SKILL.md');
const brainstorming = read('skills/brainstorming/SKILL.md');
const BASELINE_BYTES = 48103;
const MAX_OBSERVED_BYTES = Math.floor(BASELINE_BYTES * 0.60);
const observedClosure = [
  'skills/using-awm/SKILL.md',
  'skills/development-process/SKILL.md',
  'skills/brainstorming/SKILL.md',
  'skills/brainstorming/references/brief-preload.md',
  'skills/brainstorming/references/spec-contract.md',
  'skills/brainstorming/references/specialist-gate.md',
];

test('R1.1-R1.4, R1.9, R1.13: the embedded zero-model ledger is durable and honest', () => {
  assert.match(plan, /^## Embedded R0 Measurement Ledger$/m);
  assert.match(plan, /T0 \| Captured[\s\S]*12b08cb133c67889b1a5484c0b791cf510302ed1/);
  assert.match(plan, /total `67481`[\s\S]*total `27325`/);
  assert.match(plan, /total `48103` bytes \/ `699` lines/);
  for (const classification of ['`exact`', '`provider-reported`', '`estimated`', '`unobservable`']) assert.ok(plan.includes(classification), `missing metric classification ${classification}`);
  for (const checkpoint of ['T1', 'T2', 'T3', 'T4']) assert.match(plan, new RegExp(`\\| ${checkpoint} \\| (Scheduled|Captured) \\|`));
  assert.match(plan, /After Task 1's spec and code-quality reviewers approve, change T2 to `Captured`/);
  assert.match(plan, /After the normal final reviewer and post-implementation QA finish, change T3 to `Captured`/);
  assert.match(plan, /zero model invocations and zero model tokens added/i);
  assert.match(plan, /must never dispatch a measurement-only worker or invoke a model/i);
  assert.match(plan, /unobservable[\s\S]{0,240}never replace with zero/i);
});

test('R1.5-R1.6: branch-only instructions are reachable and core routing stays self-contained', () => {
  const references = [
    'skills/using-awm/references/declared-orchestrators.md', 'skills/using-awm/references/subagent-policy.md',
    'skills/development-process/references/execution-mode.md', 'skills/development-process/references/frontend-handoff.md', 'skills/development-process/references/business-gap.md',
    'skills/brainstorming/references/brief-preload.md', 'skills/brainstorming/references/spec-contract.md', 'skills/brainstorming/references/specialist-gate.md', 'skills/brainstorming/references/ui-screen-detection.md',
  ];
  for (const path of references) {
    assert.equal(existsSync(new URL(`../${path}`, import.meta.url)), true, `missing ${path}`);
    const relative = path.split('/').slice(2).join('/');
    const owner = path.includes('/using-awm/') ? usingAwm : path.includes('/development-process/') ? development : brainstorming;
    assert.ok(owner.includes(relative), `${path} is unreachable from its entry skill`);
  }
  assert.match(usingAwm, /Ambiguous[\s\S]{0,220}(ask|ASK)/i);
  assert.match(development, /\|\s*Executing\s*\|[\s\S]{0,160}(executing-plans|subagent-driven-development)/i);
  assert.match(brainstorming, /Do NOT[\s\S]{0,120}implementation[\s\S]{0,120}approved/i);
});

test('R1.7: quality, approval, security, and completion invariants survive', () => {
  const runtime = [usingAwm, development, brainstorming, read('skills/using-awm/references/subagent-policy.md'), read('skills/development-process/references/execution-mode.md'), read('skills/brainstorming/references/spec-contract.md')].join('\n');
  for (const contract of [/user instructions[\s\S]{0,100}(precedence|priority|win)/i, /test-driven-development|TDD/, /systematic-debugging/, /post-implementation-qa/, /verification-before-completion/, /security\/robustness|security and robustness/i, /explicit approval|user approval/i, /BLOCKED[\s\S]{0,120}(never|must not)[\s\S]{0,80}(skip|ignore)/i]) assert.match(runtime, contract);
});

test('R1.8: non-executable research/docs use proportional verification', () => {
  const runtime = `${development}\n${brainstorming}`;
  assert.match(runtime, /research|documentation/i);
  assert.match(runtime, /proportional structural verification/i);
  assert.match(runtime, /full tests[\s\S]{0,120}sensors[\s\S]{0,120}(CI|PR)/i);
});

test('R1.10: the observed mandatory closure is at least 40 percent smaller', () => {
  const actual = observedClosure.reduce((sum, path) => sum + bytes(path), 0);
  assert.ok(actual <= MAX_OBSERVED_BYTES, `observed closure ${actual} bytes exceeds ${MAX_OBSERVED_BYTES}`);

  const target = 'skills/development-process/SKILL.md';
  const targetUrl = new URL(`../${target}`, import.meta.url);
  const original = readFileSync(targetUrl, 'utf8');
  const excess = MAX_OBSERVED_BYTES + 1 - actual;

  try {
    writeFileSync(targetUrl, `${original}${'x'.repeat(excess)}`);
    assert.throws(
      () => assert.ok(
        observedClosure.reduce((sum, path) => sum + bytes(path), 0) <= MAX_OBSERVED_BYTES,
        'observed closure must reject an oversized included source file',
      ),
      /observed closure must reject an oversized included source file/,
      'the closure check must reject an oversized included source file',
    );
  } finally {
    writeFileSync(targetUrl, original);
  }
});

test('R1.11-R1.12: net savings wait for a real T4 cycle', () => {
  assert.match(plan, /^### Net-savings rule$/m);
  assert.match(plan, /retrieval, assembly, retry, cache-write, cache-read, and extra invocation cost/i);
  assert.match(plan, /Only T4 may support an end-to-end savings claim/i);
  assert.match(plan, /first normal development cycle after the released registry is installed/i);
  assert.match(plan, /Do not create a synthetic benchmark/i);
});

test('R1.14: Codex and Claude Code remain one provider-neutral contract', () => {
  const runtime = `${usingAwm}\n${development}`;
  assert.match(runtime, /Codex/); assert.match(runtime, /Claude Code/);
  assert.match(runtime, /native (skill-loading|runtime|capabilit)/i);
  assert.match(runtime, /unavailable[\s\S]{0,160}(state|report|say)[\s\S]{0,120}(limitation|degradation)/i);
  assert.doesNotMatch(runtime, /SKILL\.codex\.md|SKILL\.claude\.md/);
});

test('R1 recovery: compact owners retain their complete behavioral contracts', () => {
  const brief = read('skills/brainstorming/references/brief-preload.md');
  const spec = read('skills/brainstorming/references/spec-contract.md');
  const ui = read('skills/brainstorming/references/ui-screen-detection.md');
  const mode = read('skills/development-process/references/execution-mode.md');

  assert.match(brief, /mode:\s*brief[\s\S]{0,240}readiness-gate[\s\S]{0,400}N#[\s\S]{0,240}RF-x\.y[\s\S]{0,240}RNF-x\.y[\s\S]{0,240}Out of scope[\s\S]{0,240}DA-#/i);
  assert.match(brief, /Before asking any clarifying question[\s\S]{0,240}do NOT ask/i);
  assert.match(brief, /never exempts[\s\S]{0,240}technical validation[\s\S]{0,240}design approval[\s\S]{0,240}spec self-review/i);

  assert.match(spec, /Prioritize[\s\S]{0,100}IF\s*<trigger>,\s*THEN[\s\S]{0,240}(edge cases|invalid inputs|error paths)/i);
  for (const check of ['Placeholder scan', 'Internal consistency', 'Scope check', 'Ambiguity check', 'EARS/ID check']) assert.match(spec, new RegExp(check));

  assert.match(ui, /\| Screen \| Description \| Device \| Status \|[\s\S]{0,160}\| \[name\] \| \[description\] \| \[MOBILE\/DESKTOP\/TABLET\] \| pending \|/);
  assert.match(ui, /at least one row where `?Status`? is exactly `?pending`?/i);

  assert.match(mode, /BLOCKED[\s\S]{0,300}(escalat|user|controller)[\s\S]{0,300}(never|must not)[\s\S]{0,120}(skip|ignore)/i);
  assert.match(usingAwm, /one-off advisory[\s\S]{0,240}architecture-advisor[\s\S]{0,160}directly/i);

  assert.match(development, /Harness Preflight[\s\S]{0,240}advisory[\s\S]{0,240}(continue|non-blocking)/i);
  const frontendHandoff = read('skills/development-process/references/frontend-handoff.md');
  assert.match(frontendHandoff, /ui-design frontend-craft/);
  assert.match(frontendHandoff, /`frontend` bundle[\s\S]{0,200}awm update && awm init/i);

  assert.match(brainstorming, /Every behavior change[\s\S]{0,160}scaled design/i);
  assert.match(brainstorming, /Design for isolation and clarity[\s\S]{0,360}one clear purpose[\s\S]{0,360}well-defined interfaces/i);
  assert.match(brainstorming, /YAGNI ruthlessly[\s\S]{0,160}unnecessary features/i);
  assert.match(brainstorming, /Do not\s+propose unrelated refactoring/i);
});

test('R1 follow-up: compact ownership preserves review-critical gates', () => {
  const specialist = read('skills/brainstorming/references/specialist-gate.md');
  const frontend = read('skills/development-process/references/frontend-handoff.md');
  const frontendDirective = 'WHEN UI is pending or a plan declares `**Design artifacts:**`, read `references/frontend-handoff.md` and apply its blocking bundle gate.';

  assert.match(brainstorming, /Write and save the committed design artifact/i);
  assert.match(development, /Never create an ad-hoc plan while classifying/i);
  assert.match(specialist, /Every approach message MUST open with all three visible verdicts/i);
  assert.ok(development.includes(frontendDirective), 'core must retain the exact lazy frontend handoff directive');
  assert.match(frontend, /\$HOME\/\.agents\/skills\/\$skill[\s\S]{0,180}"\.agents\/skills\/\$skill"[\s\S]{0,180}\$HOME\/\.claude\/skills\/\$skill[\s\S]{0,180}"\.claude\/skills\/\$skill"/);
  assert.match(frontend, /This work needs the `frontend` bundle[\s\S]{0,200}awm update && awm init/);
  assert.doesNotMatch(development, /\$HOME\/\.agents\/skills|\.agents\/skills|\$HOME\/\.claude\/skills|\.claude\/skills/, 'frontend discovery locations belong only in frontend-handoff.md');
  assert.doesNotMatch(development, /For frontend discovery, verify both `ui-design` and `frontend-craft`/);
});
