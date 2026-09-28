// Smoke tests for the Cursor native hooks (hooks/cursor-*).
//
// Each hook runs the way AWM installs it: copied out of the registry into a
// separate install directory under its installed name, so the heartbeat
// contract is exercised against the INSTALLED path. Every case runs in a fresh
// fs.mkdtempSync project and install dir, with `awm` stubbed on PATH and
// HOME/AWM_HOME pointing at tmp dirs. Nothing here touches the real ~/.awm.

import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test, { after } from 'node:test';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const hooksSource = path.join(repoRoot, 'hooks');
const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'awm-cursor-hooks-'));
after(() => fs.rmSync(workspace, { recursive: true, force: true }));

const AWM_DIRECTIVE = 'AWM is active. Load and follow `using-awm` and `development-process` before development work.';
const USING_AWM_BODY = '# Using AWM\n\nINSTALLED-USING-AWM-BODY';

// Installed names are the CLI contract (Plan B adapter): only hooks that exist
// in the registry are copied, so later slices add theirs without editing this.
const INSTALLED_NAMES = {
    'cursor-session-start': 'session-start',
    'cursor-pre-compact': 'pre-compact',
    'cursor-post-tool-use': 'post-tool-use',
};

function tmpDir(label) {
    return fs.mkdtempSync(path.join(workspace, `${label}-`));
}

function installHooks(dir, { usingAwm = USING_AWM_BODY } = {}) {
    fs.mkdirSync(dir, { recursive: true });
    const installed = {};
    for (const [source, name] of Object.entries(INSTALLED_NAMES)) {
        const from = path.join(hooksSource, source);
        if (!fs.existsSync(from)) continue;
        const to = path.join(dir, name);
        fs.copyFileSync(from, to);
        fs.chmodSync(to, 0o755);
        installed[name] = to;
    }
    if (usingAwm !== null) fs.writeFileSync(path.join(dir, 'using-awm.md'), usingAwm);
    return { dir, ...installed, sessionStart: path.join(dir, 'session-start') };
}

function awmStub(script) {
    const dir = tmpDir('stub-bin');
    fs.writeFileSync(path.join(dir, 'awm'), `#!/usr/bin/env bash\n${script}\n`, { mode: 0o755 });
    return dir;
}

// An `awm` whose `ledger list` prints `entries` the way the real CLI does:
// a pretty-printed JSON array of ledger entries.
function ledgerStub(entries) {
    const dir = tmpDir('stub-bin');
    const data = path.join(dir, 'ledger.json');
    fs.writeFileSync(data, `${JSON.stringify(entries, null, 2)}\n`);
    fs.writeFileSync(
        path.join(dir, 'awm'),
        '#!/usr/bin/env bash\n'
        + `if [ "$1" = "ledger" ] && [ "$2" = "list" ]; then cat ${JSON.stringify(data)}; fi\n`
        + 'exit 0\n',
        { mode: 0o755 },
    );
    return dir;
}

// An `awm` whose `ledger list` prints `text` verbatim.
function rawLedgerStub(text) {
    const dir = tmpDir('stub-bin');
    const data = path.join(dir, 'ledger.txt');
    fs.writeFileSync(data, text);
    fs.writeFileSync(
        path.join(dir, 'awm'),
        `#!/usr/bin/env bash\nif [ "$1" = "ledger" ]; then cat ${JSON.stringify(data)}; fi\nexit 0\n`,
        { mode: 0o755 },
    );
    return dir;
}

function ledgerEntry(fields) {
    return {
        ts: '2026-09-28T00:00:00.000Z',
        branch: 'feat/demo',
        phase: 'implementation',
        source_skill: 'post-implementation-qa',
        polarity: 'finding',
        class: 'codigo',
        signature: 'sig',
        severity: 'medium',
        desc: 'desc',
        ...fields,
    };
}

// Default: an `awm` that fails, so the ledger section is deterministic and the
// real CLI (and the real ledger) is never reached.
const failingAwm = awmStub('exit 1');

function baseEnv(stubDir = failingAwm) {
    const env = { ...process.env };
    delete env.CURSOR_PROJECT_DIR;
    return {
        ...env,
        HOME: tmpDir('home'),
        AWM_HOME: tmpDir('awm-home'),
        PATH: `${stubDir}${path.delimiter}${process.env.PATH}`,
    };
}

function runHook(installed, input, { env = {}, args = [], cwd, stub } = {}) {
    return spawnSync(process.execPath, [installed, ...args], {
        input: typeof input === 'string' ? input : JSON.stringify(input),
        encoding: 'utf8',
        cwd,
        env: { ...baseEnv(stub), ...env },
    });
}

function contextOf(result) {
    assert.equal(result.status, 0, result.stderr);
    const output = JSON.parse(result.stdout);
    assert.deepEqual(Object.keys(output), ['additional_context']);
    assert.equal(typeof output.additional_context, 'string');
    return output.additional_context;
}

function activePlanLine(text) {
    return text.split('\n').find((line) => line.startsWith('Active plan:')) || null;
}

function makeProject(label, { plan = 'demo', constitution = '# Rules\n\nShip verified work.\n', planBody } = {}) {
    const project = tmpDir(label);
    fs.mkdirSync(path.join(project, 'docs/plans'), { recursive: true });
    if (constitution !== null) fs.writeFileSync(path.join(project, 'CONSTITUTION.md'), constitution);
    if (plan !== null) {
        fs.writeFileSync(
            path.join(project, `docs/plans/2026-07-24-${plan}-plan.md`),
            planBody ?? `# ${plan} Plan\n\n> **Goal:** prove recovery\n\n- [ ] open item\n`,
        );
    }
    return project;
}

function listTree(dir) {
    const out = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true, recursive: true })) {
        out.push(path.relative(dir, path.join(entry.parentPath ?? entry.path, entry.name)));
    }
    return out.sort();
}

// --- Full payload (R14, R14.1) ---

test('R14/R14.1: full payload carries using-awm, constitution and plan snapshot', () => {
    const project = makeProject('full');
    const hooks = installHooks(tmpDir('install'));
    const env = { CURSOR_PROJECT_DIR: project };
    const baseline = baseEnv();
    const projectBefore = listTree(project);

    const context = contextOf(runHook(hooks.sessionStart, { hook_event_name: 'sessionStart' }, {
        env: { ...env, HOME: baseline.HOME, AWM_HOME: baseline.AWM_HOME },
    }));
    assert.ok(context.includes('# Using AWM'));
    assert.ok(context.includes('INSTALLED-USING-AWM-BODY'));
    assert.ok(context.includes('## Project Constitution'));
    assert.ok(context.includes('Ship verified work.'));
    assert.ok(context.includes('Plan snapshot (taken at session start)'));
    assert.ok(context.includes('re-read the plan file'));
    assert.equal(activePlanLine(context), 'Active plan: 2026-07-24-demo-plan.md');
    assert.ok(context.split('\n').includes('Goal: prove recovery'));
    assert.ok(context.includes('- [ ] open item'));

    // Security: no writes outside the install dir.
    assert.deepEqual(listTree(project), projectBefore, 'the hook must not write into the project');
    assert.deepEqual(fs.readdirSync(baseline.HOME), [], 'the hook must not write into HOME');
    assert.deepEqual(fs.readdirSync(baseline.AWM_HOME), [], 'the hook must not write into AWM_HOME');
});

// --- Project root resolution ---

test('project root: CURSOR_PROJECT_DIR beats workspace_roots[0] and the process cwd', () => {
    const fromEnv = makeProject('env', { plan: 'from-env' });
    const fromRoots = makeProject('roots', { plan: 'from-roots' });
    const fromCwd = makeProject('cwd', { plan: 'from-cwd' });
    const hooks = installHooks(tmpDir('install'));

    const both = contextOf(runHook(hooks.sessionStart, { workspace_roots: [fromRoots] }, {
        env: { CURSOR_PROJECT_DIR: fromEnv }, cwd: fromCwd,
    }));
    assert.equal(activePlanLine(both), 'Active plan: 2026-07-24-from-env-plan.md');

    const rootsOnly = contextOf(runHook(hooks.sessionStart, { workspace_roots: [fromRoots] }, { cwd: fromCwd }));
    assert.equal(activePlanLine(rootsOnly), 'Active plan: 2026-07-24-from-roots-plan.md');

    const missingEnv = contextOf(runHook(hooks.sessionStart, { workspace_roots: [fromRoots] }, {
        env: { CURSOR_PROJECT_DIR: path.join(workspace, 'does-not-exist') }, cwd: fromCwd,
    }));
    assert.equal(activePlanLine(missingEnv), 'Active plan: 2026-07-24-from-roots-plan.md');

    const neither = contextOf(runHook(hooks.sessionStart, {}, { cwd: fromCwd }));
    assert.equal(activePlanLine(neither), 'Active plan: 2026-07-24-from-cwd-plan.md');
});

test('security: non-string workspace_roots entries are never followed', () => {
    const fromCwd = makeProject('cwd', { plan: 'from-cwd' });
    const hooks = installHooks(tmpDir('install'));
    for (const roots of [[42], [{ path: fromCwd }], [null], `${fromCwd}`]) {
        const context = contextOf(runHook(hooks.sessionStart, { workspace_roots: roots }, { cwd: fromCwd }));
        assert.equal(
            activePlanLine(context),
            'Active plan: 2026-07-24-from-cwd-plan.md',
            `workspace_roots ${JSON.stringify(roots)} must fall through to the process cwd`,
        );
    }
});

// --- R14.2: using-awm delivery and dedup ---

test('R14.2: using-awm inside the managed AGENTS.md block is not delivered twice', () => {
    const project = makeProject('agents-in');
    fs.writeFileSync(
        path.join(project, 'AGENTS.md'),
        '# Project\n\n<!-- AWM:START -->\n# Using AWM\n\nprovider copy\n<!-- AWM:END -->\n',
    );
    const hooks = installHooks(tmpDir('install'));
    const context = contextOf(runHook(hooks.sessionStart, {}, { env: { CURSOR_PROJECT_DIR: project } }));
    assert.ok(!context.includes('INSTALLED-USING-AWM-BODY'), 'using-awm body must not be delivered twice');
    assert.ok(context.includes('## Project Constitution'));
    assert.ok(context.includes('Ship verified work.'));
});

test('R14.2: "# Using AWM" outside the managed markers still delivers the body', () => {
    const project = makeProject('agents-out');
    fs.writeFileSync(
        path.join(project, 'AGENTS.md'),
        '# Using AWM\n\nhand-written\n\n<!-- AWM:START -->\n# Something else\n<!-- AWM:END -->\n',
    );
    const hooks = installHooks(tmpDir('install'));
    const context = contextOf(runHook(hooks.sessionStart, {}, { env: { CURSOR_PROJECT_DIR: project } }));
    assert.ok(context.includes('INSTALLED-USING-AWM-BODY'));
});

test('R14.2: without an installed using-awm.md the AWM directive is delivered', () => {
    const project = makeProject('no-guide');
    const hooks = installHooks(tmpDir('install'), { usingAwm: null });
    const context = contextOf(runHook(hooks.sessionStart, {}, { env: { CURSOR_PROJECT_DIR: project } }));
    assert.ok(context.includes(AWM_DIRECTIVE));
    assert.ok(!context.includes('INSTALLED-USING-AWM-BODY'));
});

// --- R5: byte budgets ---

test('R5: session-start payload is at most 24 KiB with a visible marker', () => {
    // Two-byte characters: a character-based cap would let ~48 KiB through.
    const project = makeProject('huge', { constitution: `# Rules\n\n${'ñ'.repeat(50 * 1024)}\n` });
    assert.ok(fs.statSync(path.join(project, 'CONSTITUTION.md')).size >= 100 * 1024);
    const hooks = installHooks(tmpDir('install'), { usingAwm: `# Using AWM\n\n${'g'.repeat(16 * 1024 - 13)}` });
    assert.equal(fs.statSync(path.join(hooks.dir, 'using-awm.md')).size, 16 * 1024);

    const context = contextOf(runHook(hooks.sessionStart, {}, { env: { CURSOR_PROJECT_DIR: project } }));
    assert.ok(Buffer.byteLength(context, 'utf8') <= 24 * 1024, `got ${Buffer.byteLength(context, 'utf8')} bytes`);
    assert.ok(context.includes('[truncated by AWM'));
    assert.ok(!context.includes('\uFFFD'), 'truncation must not split a UTF-8 character');
    // The budget is spent on the constitution last: the plan snapshot survives.
    assert.ok(context.includes('## Project Constitution'));
    assert.ok(context.includes('Plan snapshot (taken at session start)'));
    assert.equal(activePlanLine(context), 'Active plan: 2026-07-24-demo-plan.md');
});

test('R5: a multibyte using-awm.md over 16 KiB cannot push the plan snapshot out', () => {
    const project = makeProject('guide-multibyte');
    // 9000 three-byte characters: under the 16 Ki character cap, ~26 KiB of bytes.
    const hooks = installHooks(tmpDir('install'), { usingAwm: `# Using AWM\n\n${'—'.repeat(9000)}` });
    assert.ok(fs.statSync(path.join(hooks.dir, 'using-awm.md')).size > 16 * 1024);

    const context = contextOf(runHook(hooks.sessionStart, {}, { env: { CURSOR_PROJECT_DIR: project } }));
    assert.ok(Buffer.byteLength(context, 'utf8') <= 24 * 1024, `got ${Buffer.byteLength(context, 'utf8')} bytes`);
    assert.ok(context.includes('# Using AWM'));
    assert.ok(context.includes('[truncated by AWM'));
    assert.ok(context.includes('Plan snapshot (taken at session start)'));
    assert.equal(activePlanLine(context), 'Active plan: 2026-07-24-demo-plan.md');
});

test('R5: --reanchor output is at most 4096 bytes with a visible marker', () => {
    const items = Array.from({ length: 8 }, (_, i) => `- [ ] item ${i} ${'é'.repeat(500)}`).join('\n');
    const project = makeProject('reanchor-big', {
        planBody: `# Big Plan\n\n> **Goal:** stay small\n\n${items}\n`,
    });
    const ledger = ledgerStub(Array.from({ length: 50 }, (_, i) => ledgerEntry({
        signature: `finding-${i}`, desc: 'x'.repeat(400),
    })));
    const hooks = installHooks(tmpDir('install'));
    const result = runHook(hooks.sessionStart, {}, {
        args: ['--reanchor'], env: { CURSOR_PROJECT_DIR: project }, stub: ledger,
    });
    assert.equal(result.status, 0, result.stderr);
    assert.ok(Buffer.byteLength(result.stdout, 'utf8') <= 4096, `got ${Buffer.byteLength(result.stdout, 'utf8')} bytes`);
    assert.ok(result.stdout.includes('Re-anchor (post-compaction)'));
    assert.ok(result.stdout.includes('[truncated by AWM'));
});

// --- R14.3: fail-open ---

test('R14.3: hostile stdin exits 0 with parseable JSON', () => {
    const hooks = installHooks(tmpDir('install'));
    const cwd = tmpDir('bare');
    for (const payload of ['null', '"text"', '[]', 'not json', '', '{"workspace_roots":"x","cursor_version":1}']) {
        const result = runHook(hooks.sessionStart, payload, { cwd });
        assert.equal(result.status, 0, `payload ${JSON.stringify(payload)}: ${result.stderr}`);
        const context = contextOf(result);
        assert.ok(context.includes('INSTALLED-USING-AWM-BODY'), `payload ${JSON.stringify(payload)}`);
    }
});

test('R14.3: CONSTITUTION.md as a directory drops only that section', () => {
    const project = makeProject('const-dir', { constitution: null });
    fs.mkdirSync(path.join(project, 'CONSTITUTION.md'));
    fs.writeFileSync(path.join(project, 'CONSTITUTION.md', 'x'), 'x');
    const hooks = installHooks(tmpDir('install'));
    const context = contextOf(runHook(hooks.sessionStart, {}, { env: { CURSOR_PROJECT_DIR: project } }));
    assert.ok(!context.includes('## Project Constitution'));
    assert.ok(context.includes('INSTALLED-USING-AWM-BODY'));
    assert.equal(activePlanLine(context), 'Active plan: 2026-07-24-demo-plan.md');
});

test('R14.1: ledger JSON renders open findings only, one line each', () => {
    const project = makeProject('ledger');
    const hooks = installHooks(tmpDir('install'));
    const working = ledgerStub([
        ledgerEntry({ severity: 'high', signature: 'split-infinity', desc: 'splitBill returns Infinity' }),
        ledgerEntry({ polarity: 'win', signature: 'tdd-caught', desc: 'WIN-DESC-MUST-NOT-APPEAR' }),
        ledgerEntry({ severity: 'low', signature: 'input-validation', desc: 'missing input validation', ref: 'src/a.ts:1' }),
    ]);

    const context = contextOf(runHook(hooks.sessionStart, {}, { env: { CURSOR_PROJECT_DIR: project }, stub: working }));
    const lines = context.split('\n');
    const start = lines.indexOf('Open ledger items:');
    assert.ok(start !== -1, 'ledger section missing');
    assert.deepEqual(lines.slice(start + 1), [
        '- [high] split-infinity: splitBill returns Infinity',
        '- [low] input-validation: missing input validation',
    ]);
    assert.ok(!context.includes('WIN-DESC-MUST-NOT-APPEAR'), 'wins are not open items');
    for (const line of lines) {
        assert.ok(!/^\s*[[\]{}],?\s*$/.test(line), `bare JSON fragment line: ${JSON.stringify(line)}`);
    }
});

test('R14.1: at most 8 ledger findings are rendered', () => {
    const project = makeProject('ledger-many');
    const hooks = installHooks(tmpDir('install'));
    const many = ledgerStub(Array.from({ length: 12 }, (_, i) => ledgerEntry({ signature: `f${i}`, desc: `d${i}` })));
    const context = contextOf(runHook(hooks.sessionStart, {}, { env: { CURSOR_PROJECT_DIR: project }, stub: many }));
    const rendered = context.split('\n').filter((line) => /^- \[medium\] f\d+: d\d+$/.test(line));
    assert.equal(rendered.length, 8);
    assert.equal(rendered[0], '- [medium] f0: d0');
});

test('R14.1: non-JSON or non-array ledger output yields no ledger section', () => {
    const project = makeProject('ledger-bad');
    const hooks = installHooks(tmpDir('install'));
    for (const output of ['finding: plain text line\n', '{\n  "polarity": "finding",\n  "desc": "obj"\n}\n']) {
        const context = contextOf(runHook(hooks.sessionStart, {}, {
            env: { CURSOR_PROJECT_DIR: project }, stub: rawLedgerStub(output),
        }));
        assert.ok(!context.includes('Open ledger items:'), `output ${JSON.stringify(output)} must not render a section`);
        assert.equal(activePlanLine(context), 'Active plan: 2026-07-24-demo-plan.md');
    }
});

test('R14.3: ledger section absent when awm exits 1', () => {
    const project = makeProject('ledger-fail');
    const hooks = installHooks(tmpDir('install'));

    const failing = contextOf(runHook(hooks.sessionStart, {}, { env: { CURSOR_PROJECT_DIR: project } }));
    assert.ok(!failing.includes('Open ledger items:'));
    assert.equal(activePlanLine(failing), 'Active plan: 2026-07-24-demo-plan.md');
});

test('R14.3: a hung awm is cut off by the timeout', () => {
    const project = makeProject('hung');
    const hooks = installHooks(tmpDir('install'));
    // `exec` so the timeout's SIGTERM lands on the sleeping process itself.
    const hung = awmStub('exec sleep 5');
    const started = Date.now();
    const context = contextOf(runHook(hooks.sessionStart, {}, { env: { CURSOR_PROJECT_DIR: project }, stub: hung }));
    const elapsed = Date.now() - started;
    assert.ok(elapsed < 4000, `hook took ${elapsed} ms`);
    assert.ok(!context.includes('Open ledger items:'));
    assert.equal(activePlanLine(context), 'Active plan: 2026-07-24-demo-plan.md');
});

// --- R17: heartbeat ---

test('R17: heartbeat lands next to the installed path with the CLI contract fields', () => {
    const project = makeProject('heartbeat');
    const hooks = installHooks(tmpDir('install'));
    contextOf(runHook(hooks.sessionStart, {}, { env: { CURSOR_PROJECT_DIR: project } }));
    const heartbeat = JSON.parse(fs.readFileSync(path.join(hooks.dir, 'heartbeat.json'), 'utf8'));
    assert.equal(heartbeat.hash, crypto.createHash('sha256').update(fs.readFileSync(hooks.sessionStart)).digest('hex'));
    assert.ok(!Number.isNaN(Date.parse(heartbeat.ts)), `ts ${heartbeat.ts}`);
    assert.equal(heartbeat.event, 'sessionStart');
    assert.equal(heartbeat.version, 1);
});

test('R17: a symlinked install writes the heartbeat beside the link, not the registry source', () => {
    const project = makeProject('symlink');
    const linkDir = tmpDir('install-linked');
    const link = path.join(linkDir, 'session-start');
    fs.symlinkSync(path.join(hooksSource, 'cursor-session-start'), link);

    const registryHeartbeat = path.join(hooksSource, 'heartbeat.json');
    const read = () => (fs.existsSync(registryHeartbeat) ? fs.readFileSync(registryHeartbeat, 'utf8') : null);
    const before = read();
    contextOf(runHook(link, {}, { env: { CURSOR_PROJECT_DIR: project } }));
    assert.ok(fs.existsSync(path.join(linkDir, 'heartbeat.json')));
    assert.equal(read(), before, 'the registry checkout heartbeat must not change');
});

test('R17: a read-only install dir still answers with valid JSON and leaves no .tmp', { skip: process.getuid?.() === 0 || process.platform === 'win32' }, () => {
    const project = makeProject('readonly');
    const hooks = installHooks(tmpDir('install'));
    fs.chmodSync(hooks.dir, 0o555);
    try {
        const context = contextOf(runHook(hooks.sessionStart, {}, { env: { CURSOR_PROJECT_DIR: project } }));
        assert.ok(context.includes('INSTALLED-USING-AWM-BODY'));
        assert.deepEqual(fs.readdirSync(hooks.dir).filter((name) => name.endsWith('.tmp')), []);
        assert.ok(!fs.existsSync(path.join(hooks.dir, 'heartbeat.json')));
    } finally {
        fs.chmodSync(hooks.dir, 0o755);
    }
});

test('R17: --reanchor prints plain text and writes no heartbeat', () => {
    const project = makeProject('reanchor');
    const hooks = installHooks(tmpDir('install'));
    const result = runHook(hooks.sessionStart, {}, { args: ['--reanchor'], env: { CURSOR_PROJECT_DIR: project } });
    assert.equal(result.status, 0, result.stderr);
    assert.ok(result.stdout.startsWith('## Re-anchor (post-compaction)'));
    assert.equal(activePlanLine(result.stdout), 'Active plan: 2026-07-24-demo-plan.md');
    assert.ok(result.stdout.split('\n').includes('Goal: prove recovery'));
    assert.ok(!fs.existsSync(path.join(hooks.dir, 'heartbeat.json')), '--reanchor must not write a heartbeat');

    // Control: the same install writes one without the flag.
    contextOf(runHook(hooks.sessionStart, {}, { env: { CURSOR_PROJECT_DIR: project } }));
    assert.ok(fs.existsSync(path.join(hooks.dir, 'heartbeat.json')));

    // No active plan: the re-anchor section is empty.
    const bare = makeProject('reanchor-bare', { plan: null });
    const empty = runHook(hooks.sessionStart, {}, { args: ['--reanchor'], env: { CURSOR_PROJECT_DIR: bare } });
    assert.equal(empty.status, 0, empty.stderr);
    assert.equal(empty.stdout, '');
});

// --- Parity with the Codex hook ---

test('parity: the Active plan line matches hooks/codex-session-start', () => {
    // Adversarial fixture: newer rivals (complete, design doc, redesign-named
    // plan older) under a directory whose name contains "design".
    const project = path.join(tmpDir('design-system'), 'app');
    const plans = path.join(project, 'docs/plans');
    fs.mkdirSync(plans, { recursive: true });
    const writePlan = (name, body, mtime) => {
        const file = path.join(plans, name);
        fs.writeFileSync(file, body);
        fs.utimesSync(file, mtime, mtime);
    };
    writePlan('2026-07-24-redesign-checkout-plan.md', '# Redesign\n\n> **Goal:** ship v2\n\n- [ ] step\n', 1_000);
    writePlan('2026-07-26-thing-design.md', '# Thing Design\n\n- [ ] design item\n', 9_000);
    writePlan('2026-07-27-done-plan.md', '# Done\n\n- [ ] leftover\n<!-- awm-qa-complete -->\n', 9_000);

    const hooks = installHooks(tmpDir('install'));
    const cursorLine = activePlanLine(contextOf(runHook(hooks.sessionStart, {}, { env: { CURSOR_PROJECT_DIR: project } })));

    const codexDir = tmpDir('install-codex');
    const codex = path.join(codexDir, 'session-start');
    fs.copyFileSync(path.join(hooksSource, 'codex-session-start'), codex);
    const codexResult = runHook(codex, { cwd: project });
    assert.equal(codexResult.status, 0, codexResult.stderr);
    const codexLine = activePlanLine(JSON.parse(codexResult.stdout).hookSpecificOutput.additionalContext);

    assert.equal(cursorLine, 'Active plan: 2026-07-24-redesign-checkout-plan.md');
    assert.equal(cursorLine, codexLine);
});
