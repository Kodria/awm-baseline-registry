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

function runHook(installed, input, { env = {}, args = [], cwd, stub, timeout } = {}) {
    return spawnSync(process.execPath, [installed, ...args], {
        input: typeof input === 'string' ? input : JSON.stringify(input),
        encoding: 'utf8',
        cwd,
        env: { ...baseEnv(stub), ...env },
        timeout,
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
    // Newest first (A7): the CLI lists oldest first.
    assert.deepEqual(lines.slice(start + 1), [
        '- [low] input-validation: missing input validation',
        '- [high] split-infinity: splitBill returns Infinity',
    ]);
    assert.ok(!context.includes('WIN-DESC-MUST-NOT-APPEAR'), 'wins are not open items');
    for (const line of lines) {
        assert.ok(!/^\s*[[\]{}],?\s*$/.test(line), `bare JSON fragment line: ${JSON.stringify(line)}`);
    }
});

test('R14.1: at most 8 ledger findings are rendered, newest first', () => {
    const project = makeProject('ledger-many');
    const hooks = installHooks(tmpDir('install'));
    const many = ledgerStub(Array.from({ length: 12 }, (_, i) => ledgerEntry({ signature: `f${i}`, desc: `d${i}` })));
    const context = contextOf(runHook(hooks.sessionStart, {}, { env: { CURSOR_PROJECT_DIR: project }, stub: many }));
    const rendered = context.split('\n').filter((line) => /^- \[medium\] f\d+: d\d+$/.test(line));
    // The CLI lists oldest first; the newest 8 (f11..f4) are the open items.
    assert.deepEqual(rendered, [11, 10, 9, 8, 7, 6, 5, 4].map((i) => `- [medium] f${i}: d${i}`));
});

test('R14.1 (A7): compaction-reanchor audit entries never crowd out a real finding', () => {
    const project = makeProject('ledger-audit');
    const hooks = installHooks(tmpDir('install'));
    // What 8 compactions leave behind, followed by one real blocker.
    const stub = ledgerStub([
        ...Array.from({ length: 8 }, () => ledgerEntry({
            phase: 'compaction-recovery',
            source_skill: 'context-compaction-recovery',
            class: 'proceso',
            signature: 'compaction-reanchor',
            severity: 'info',
            desc: 're-anchored active plan + open items after compaction',
        })),
        ledgerEntry({ severity: 'blocker', signature: 'real-blocker', desc: 'payments double-charge' }),
    ]);
    for (const args of [[], ['--reanchor']]) {
        const result = runHook(hooks.sessionStart, {}, { args, env: { CURSOR_PROJECT_DIR: project }, stub });
        assert.equal(result.status, 0, result.stderr);
        const text = args.length ? result.stdout : contextOf(result);
        const lines = text.split('\n');
        const start = lines.indexOf('Open ledger items:');
        assert.ok(start !== -1, `${args.join(' ') || 'sessionStart'}: ledger section missing`);
        assert.deepEqual(lines.slice(start + 1), ['- [blocker] real-blocker: payments double-charge']);
        assert.ok(!text.includes('compaction-reanchor'), `${args.join(' ') || 'sessionStart'}: audit entries leaked`);
    }
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

test('R17: a read-only install dir still answers with valid JSON', { skip: process.getuid?.() === 0 || process.platform === 'win32' }, () => {
    const project = makeProject('readonly');
    const hooks = installHooks(tmpDir('install'));
    fs.chmodSync(hooks.dir, 0o555);
    try {
        const context = contextOf(runHook(hooks.sessionStart, {}, { env: { CURSOR_PROJECT_DIR: project } }));
        assert.ok(context.includes('INSTALLED-USING-AWM-BODY'));
        assert.ok(!fs.existsSync(path.join(hooks.dir, 'heartbeat.json')));
    } finally {
        fs.chmodSync(hooks.dir, 0o755);
    }
});

test('R17: a failing heartbeat rename leaves no .tmp behind', () => {
    // heartbeat.json as a directory: the .tmp write succeeds and the rename
    // over it fails, so only the cleanup can keep the install dir clean. (A
    // read-only dir fails the .tmp write itself and proves nothing.)
    const project = makeProject('rename-fails');
    const hooks = installHooks(tmpDir('install'));
    fs.mkdirSync(path.join(hooks.dir, 'heartbeat.json'));
    const context = contextOf(runHook(hooks.sessionStart, {}, { env: { CURSOR_PROJECT_DIR: project } }));
    assert.ok(context.includes('INSTALLED-USING-AWM-BODY'));
    assert.ok(fs.statSync(path.join(hooks.dir, 'heartbeat.json')).isDirectory());
    assert.deepEqual(fs.readdirSync(hooks.dir).filter((name) => name.endsWith('.tmp')), []);
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

// Node's fs.readdirSync goes through libuv's scandir, which sorts entries with
// strcmp: on macOS and Linux the hooks ALWAYS receive plans in byte order, so
// on an equal mtime the stable sort alone already yields byte order and a
// deleted tie-breaker is invisible (the raw APFS order is not byte order; the
// sorting is libuv's). This preload reverses readdirSync, standing in for a
// platform whose readdir is unsorted, so the tie-breaker is the ONLY thing
// that can still produce the byte-order answer.
function reversedReaddirPreload() {
    // The directory name contains a space on purpose: NODE_OPTIONS must quote it.
    const file = path.join(tmpDir('pre load'), 'reverse-readdir.cjs');
    fs.writeFileSync(file, [
        "const fs = require('node:fs');",
        'const readdirSync = fs.readdirSync;',
        'fs.readdirSync = function reversed(...args) {',
        '    const entries = readdirSync.apply(this, args);',
        '    return Array.isArray(entries) ? entries.slice().reverse() : entries;',
        '};',
        '',
    ].join('\n'));
    return file;
}

// UTF-8 byte order, the order of `LC_ALL=C ls`. JS `<` and Array#sort compare
// UTF-16 code units, which disagree once an astral character (U+1F600, a
// surrogate pair starting at 0xD83D) meets one in U+E000–U+FFFF (U+FF01).
function byteOrderFirst(names) {
    return [...names].sort((a, b) => Buffer.compare(Buffer.from(a), Buffer.from(b)))[0];
}

const TIE_LOCALE = 'en_US.UTF-8';

function writeTiePlans(pair) {
    const project = tmpDir('tie-break');
    const plans = path.join(project, 'docs/plans');
    fs.mkdirSync(plans, { recursive: true });
    for (const name of pair) {
        const file = path.join(plans, name);
        fs.writeFileSync(file, `# ${name}\n\n- [ ] open item\n`);
        fs.utimesSync(file, 5_000, 5_000);
    }
    const [first, second] = pair.map((name) => fs.statSync(path.join(plans, name)).mtimeMs);
    assert.equal(first, second, `${pair}: mtimes must tie`);
    return { project, plans };
}

// First name `ls -t` prints for an equal-mtime fixture, under `env`.
function lsFirst(plans, env) {
    const result = spawnSync('bash', ['-c', 'ls -t "$1"/*.md', 'ls-first', plans], { encoding: 'utf8', env });
    assert.equal(result.status, 0, result.stderr);
    return path.basename(result.stdout.split('\n')[0]);
}

test('parity (A7/A8/A9): equal-mtime plans tie-break in byte order in all three hooks', async (t) => {
    // Byte order and collation/UTF-16 order disagree on every pair below:
    // `B` (0x42) < `a` (0x61); `f` (0x66) < `é` (0xC3 0xA9); and
    // `！` U+FF01 (0xEF…) < `😀` U+1F600 (0xF0…) in bytes, but not in UTF-16.
    const pairs = [
        ['a-plan.md', 'B-plan.md'],
        ['plan-é.md', 'plan-f.md'],
        ['plan-\u{1F600}.md', 'plan-\u{FF01}.md'],
    ];
    const fixtures = pairs.map((pair) => ({ pair, byteFirst: byteOrderFirst(pair), ...writeTiePlans(pair) }));
    assert.equal(fixtures[2].byteFirst, 'plan-\u{FF01}.md');
    assert.notEqual([...pairs[2]].sort()[0], fixtures[2].byteFirst, 'the astral pair must separate UTF-16 from UTF-8 order');

    const checkout = () => listTree(hooksSource).map((name) => [name, fs.readFileSync(path.join(hooksSource, name), 'utf8')]);
    const checkoutBefore = checkout();

    await t.test('Node hooks (cursor, codex) with real and reversed readdir', () => {
        const preload = reversedReaddirPreload();
        assert.ok(preload.includes(' '), 'the preload path must contain a space');
        const reversed = { NODE_OPTIONS: `--require "${preload}"` };
        const hooks = installHooks(tmpDir('install'));
        const codex = path.join(tmpDir('install-codex'), 'session-start');
        fs.copyFileSync(path.join(hooksSource, 'codex-session-start'), codex);

        for (const { pair, byteFirst, project, plans } of fixtures) {
            // Self-test of the fixture: under the preload the hooks see the
            // byte-LATER plan first, so only the tie-breaker can pick byteFirst.
            const seen = spawnSync(process.execPath, ['-e', 'console.log(require("node:fs").readdirSync(process.argv[1])[0])', plans], {
                encoding: 'utf8', env: { ...process.env, ...reversed },
            });
            assert.equal(seen.status, 0, seen.stderr);
            assert.equal(seen.stdout.trim(), pair.find((name) => name !== byteFirst), `${pair}: preload must reverse readdir`);

            for (const [mode, env] of [['readdir', {}], ['reversed-readdir', reversed]]) {
                const cursorLine = activePlanLine(contextOf(runHook(hooks.sessionStart, {}, {
                    env: { CURSOR_PROJECT_DIR: project, ...env },
                })));
                assert.equal(cursorLine, `Active plan: ${byteFirst}`, `${pair.join(' vs ')}: cursor/${mode} picked ${cursorLine}`);
                const codexResult = runHook(codex, { cwd: project }, { env });
                assert.equal(codexResult.status, 0, codexResult.stderr);
                const codexLine = activePlanLine(JSON.parse(codexResult.stdout).hookSpecificOutput.additionalContext);
                assert.equal(codexLine, `Active plan: ${byteFirst}`, `${pair.join(' vs ')}: codex/${mode} picked ${codexLine}`);
            }
        }
    });

    // Precondition (A9): without the locale installed, `ls` silently falls
    // back to C and the bash half would pass whether or not the hook pins
    // LC_ALL=C. Require plain `ls -t` under the locale to disagree with byte
    // order on the a/B fixture; otherwise fail in CI, skip visibly elsewhere.
    const localeEnv = { ...baseEnv(), LANG: TIE_LOCALE, LC_ALL: TIE_LOCALE };
    delete localeEnv.CURSOR_VERSION;
    const localeFirst = lsFirst(fixtures[0].plans, localeEnv);
    const localeMissing = localeFirst === fixtures[0].byteFirst
        ? `${TIE_LOCALE} collation is unavailable on this host (plain \`ls -t\` printed ${localeFirst}, the byte-order file first)`
        : false;
    if (localeMissing && process.env.CI) assert.fail(`locale precondition failed in CI: ${localeMissing}`);

    await t.test(`bash hooks/session-start under ${TIE_LOCALE}`, { skip: localeMissing ? `SKIP: ${localeMissing}` : false }, () => {
        // The bash hook runs from a tmp copy, so nothing executes out of the checkout.
        const bashRoot = tmpDir('install-claude');
        const bashHook = path.join(bashRoot, 'session-start');
        fs.copyFileSync(path.join(hooksSource, 'session-start'), bashHook);
        fs.writeFileSync(path.join(bashRoot, 'using-awm.md'), USING_AWM_BODY);

        for (const { pair, byteFirst, project, plans } of fixtures) {
            // `LC_ALL=C ls -t` itself must pick the byte-first file.
            assert.equal(lsFirst(plans, { ...localeEnv, LC_ALL: 'C' }), byteFirst, `${pair}: LC_ALL=C ls -t order`);
            const bash = spawnSync('bash', [bashHook], {
                cwd: project,
                input: JSON.stringify({ source: 'compact' }),
                encoding: 'utf8',
                env: { ...localeEnv, AWM_HOOKS_ROOT: bashRoot },
            });
            assert.equal(bash.status, 0, bash.stderr);
            const bashLine = activePlanLine(JSON.parse(bash.stdout).hookSpecificOutput.additionalContext);
            assert.equal(bashLine, `Active plan: ${byteFirst}`, `${pair.join(' vs ')}: bash/${TIE_LOCALE} picked ${bashLine}`);
        }
    });

    assert.deepEqual(checkout(), checkoutBefore, 'the parity run must not write into the checkout hooks/');
});

// --- A10 (G1): the plan scan ---

// Writes plans into a fresh project. Each entry is [name, body, mtimeSeconds];
// mtimes are stamped explicitly so a rule under test, not the clock, decides.
function planProject(label, entries) {
    const project = tmpDir(label);
    const plans = path.join(project, 'docs/plans');
    fs.mkdirSync(plans, { recursive: true });
    for (const [name, body, mtime] of entries) {
        const file = path.join(plans, name);
        fs.writeFileSync(file, body);
        if (mtime !== undefined) fs.utimesSync(file, mtime, mtime);
    }
    return { project, plans };
}

function scanReanchor(hooks, project, options = {}) {
    const result = runHook(hooks.sessionStart, {}, { args: ['--reanchor'], env: { CURSOR_PROJECT_DIR: project }, ...options });
    assert.equal(result.status, 0, result.stderr || `signal ${result.signal}`);
    return result.stdout;
}

// All three session hooks, installed from tmp copies (nothing runs out of the checkout).
function installAllSessionHooks() {
    const hooks = installHooks(tmpDir('install'));
    const codex = path.join(tmpDir('install-codex'), 'session-start');
    fs.copyFileSync(path.join(hooksSource, 'codex-session-start'), codex);
    const bashRoot = tmpDir('install-claude');
    const bash = path.join(bashRoot, 'session-start');
    fs.copyFileSync(path.join(hooksSource, 'session-start'), bash);
    fs.writeFileSync(path.join(bashRoot, 'using-awm.md'), USING_AWM_BODY);

    return {
        cursor: (project) => activePlanLine(scanReanchor(hooks, project)),
        codex: (project) => {
            const result = runHook(codex, { cwd: project });
            assert.equal(result.status, 0, result.stderr);
            return activePlanLine(JSON.parse(result.stdout).hookSpecificOutput.additionalContext);
        },
        bash: (project) => {
            const env = { ...baseEnv(), AWM_HOOKS_ROOT: bashRoot };
            delete env.CURSOR_VERSION;
            const result = spawnSync('bash', [bash], { cwd: project, input: JSON.stringify({ source: 'compact' }), encoding: 'utf8', env });
            assert.equal(result.status, 0, result.stderr);
            return activePlanLine(JSON.parse(result.stdout).hookSpecificOutput.additionalContext);
        },
    };
}

const OPEN_PLAN = '# Open Plan\n\n> **Goal:** the real one\n\n- [ ] open item\n';

test('A10: a device, FIFO or oversize plan is skipped, never read', { skip: process.platform === 'win32' }, () => {
    const { project, plans } = planProject('plan-types', [['2026-01-01-open-plan.md', OPEN_PLAN, 1_000]]);
    fs.symlinkSync('/dev/zero', path.join(plans, 'zzz-zero-plan.md'));
    spawnSync('mkfifo', [path.join(plans, 'zzz-fifo-plan.md')]);
    assert.ok(fs.statSync(path.join(plans, 'zzz-fifo-plan.md')).isFIFO(), 'mkfifo must create the FIFO');
    // Newer and over 1 MiB, with an open item: must lose to the small plan.
    const big = path.join(plans, 'zzz-big-plan.md');
    fs.writeFileSync(big, `# Big\n\n- [ ] big item\n${'x'.repeat(1024 * 1024)}`);
    fs.utimesSync(big, 9_000, 9_000);

    const hooks = installHooks(tmpDir('install'));
    const started = Date.now();
    const out = scanReanchor(hooks, project, { timeout: 8_000 });
    assert.ok(Date.now() - started < 4_000, `the scan took ${Date.now() - started} ms`);
    assert.equal(activePlanLine(out), 'Active plan: 2026-01-01-open-plan.md');
});

test('A10: a plan of exactly 1 MiB is still read', () => {
    const body = '# Limit Plan\n\n> **Goal:** at the limit\n\n- [ ] limit item\n';
    const { project, plans } = planProject('plan-limit', [
        ['2026-01-01-open-plan.md', OPEN_PLAN, 1_000],
        ['2026-01-02-limit-plan.md', `${body}${'y'.repeat(1024 * 1024 - Buffer.byteLength(body))}`, 9_000],
    ]);
    assert.equal(fs.statSync(path.join(plans, '2026-01-02-limit-plan.md')).size, 1024 * 1024);
    const hooks = installHooks(tmpDir('install'));
    assert.equal(activePlanLine(scanReanchor(hooks, project)), 'Active plan: 2026-01-02-limit-plan.md');
});

test('A10: dot-prefixed plans are skipped by all three hooks, like the bash glob', () => {
    const { project } = planProject('plan-dot', [
        ['2026-01-01-open-plan.md', OPEN_PLAN, 1_000],
        ['.2026-01-02-hidden-plan.md', '# Hidden\n\n- [ ] hidden item\n', 9_000],
    ]);
    const all = installAllSessionHooks();
    for (const hook of ['cursor', 'codex', 'bash']) {
        assert.equal(all[hook](project), 'Active plan: 2026-01-01-open-plan.md', `${hook} must skip the dotfile plan`);
    }
});

test('A10: mtimes closer than float mtimeMs can tell apart order like ls -t in all three hooks', (t) => {
    // Byte-FIRST name is the older one, so a merged mtimeMs plus the byte
    // tie-break would pick it: only a nanosecond comparison picks the newer.
    const { project, plans } = planProject('plan-ns', [
        ['a-older-plan.md', '# Older\n\n- [ ] older item\n'],
        ['b-newer-plan.md', '# Newer\n\n- [ ] newer item\n'],
    ]);
    const older = path.join(plans, 'a-older-plan.md');
    const newer = path.join(plans, 'b-newer-plan.md');
    // fs.utimesSync takes double seconds and cannot express 100 ns at this
    // epoch; `touch -d` with a fractional second can, where the fs stores it.
    spawnSync('touch', ['-d', '2026-09-28T12:00:00.000000000', older]);
    spawnSync('touch', ['-d', '2026-09-28T12:00:00.000000100', newer]);
    const olderNs = fs.statSync(older, { bigint: true }).mtimeNs;
    const newerNs = fs.statSync(newer, { bigint: true }).mtimeNs;
    if (!(newerNs > olderNs) || fs.statSync(older).mtimeMs !== fs.statSync(newer).mtimeMs) {
        t.skip(`SKIP: this filesystem/touch cannot store a sub-240 ns mtime split (older ${olderNs}, newer ${newerNs})`);
        return;
    }
    const all = installAllSessionHooks();
    for (const hook of ['cursor', 'codex', 'bash']) {
        assert.equal(all[hook](project), 'Active plan: b-newer-plan.md', `${hook} must order by nanoseconds`);
    }
});

test('A10: a plan with no open checkbox is not active', () => {
    const { project } = planProject('plan-closed', [
        ['2026-01-01-open-plan.md', OPEN_PLAN, 1_000],
        ['2026-01-02-closed-plan.md', '# Closed\n\n> **Goal:** nothing open\n\n- [x] done item\n', 9_000],
    ]);
    const hooks = installHooks(tmpDir('install'));
    assert.equal(activePlanLine(scanReanchor(hooks, project)), 'Active plan: 2026-01-01-open-plan.md');
});

test('A10: only the HTML-comment complete marker retires a plan', () => {
    const hooks = installHooks(tmpDir('install'));
    for (const marker of ['<!-- awm-qa-complete -->', '<!--awm-plan-complete-->']) {
        const { project } = planProject('plan-done', [
            ['2026-01-01-open-plan.md', OPEN_PLAN, 1_000],
            ['2026-01-02-done-plan.md', `# Done\n\n- [ ] leftover\n${marker}\n`, 9_000],
        ]);
        assert.equal(activePlanLine(scanReanchor(hooks, project)), 'Active plan: 2026-01-01-open-plan.md', `${marker} must retire the plan`);
    }
    // A plan whose own steps mention the marker, not as a comment, stays active.
    const { project } = planProject('plan-mentions', [
        ['2026-01-01-open-plan.md', OPEN_PLAN, 1_000],
        ['2026-01-02-marker-plan.md', '# Marker\n\n- [ ] append the awm-qa-complete comment when done\n', 9_000],
    ]);
    assert.equal(activePlanLine(scanReanchor(hooks, project)), 'Active plan: 2026-01-02-marker-plan.md');
});

test('A10: Goal falls back to the H1, then to the file name; an empty Goal line never captures the next line', () => {
    const hooks = installHooks(tmpDir('install'));
    const goalOf = (body) => {
        const { project } = planProject('plan-goal', [['2026-01-01-goal-plan.md', body, 1_000]]);
        return scanReanchor(hooks, project).split('\n').find((line) => line.startsWith('Goal: '));
    };
    assert.equal(goalOf('# H1 Title\n\n> **Goal:** stated goal\n\n- [ ] item\n'), 'Goal: stated goal');
    assert.equal(goalOf('# H1 Title\n\n- [ ] item\n'), 'Goal: H1 Title');
    assert.equal(goalOf('# H1 Title\n\n**Goal:**\n- [ ] first item\n'), 'Goal: H1 Title');
    assert.equal(goalOf('# H1 Title\n\n> **Goal:**   \n\n- [ ] first item\n'), 'Goal: H1 Title');
    assert.equal(goalOf('no heading\n\n- [ ] item\n'), 'Goal: 2026-01-01-goal-plan.md');
});

test('A10: open plan items are capped at 500 chars each and 8 in total, below the 4 KiB cap', () => {
    const hooks = installHooks(tmpDir('install'));

    const long = `- [ ] ${'L'.repeat(600)}`;
    const { project: longProject } = planProject('plan-long-line', [['2026-01-01-long-plan.md', `# Long\n\n${long}\n`, 1_000]]);
    const longOut = scanReanchor(hooks, longProject);
    assert.ok(Buffer.byteLength(longOut) < 4096 && !longOut.includes('[truncated by AWM'), 'the 4 KiB cap must not be what cuts the line');
    const lines = longOut.split('\n');
    const at = lines.findIndex((line) => line.startsWith('- [ ] L'));
    assert.equal(lines[at], long.slice(0, 500));
    assert.equal(lines[at + 1], '[truncated]');

    const items = Array.from({ length: 12 }, (_, i) => `- [ ] item ${i}`);
    const { project: manyProject } = planProject('plan-many-items', [['2026-01-01-many-plan.md', `# Many\n\n${items.join('\n')}\n`, 1_000]]);
    const manyOut = scanReanchor(hooks, manyProject);
    assert.ok(Buffer.byteLength(manyOut) < 4096 && !manyOut.includes('[truncated by AWM'), 'the 4 KiB cap must not be what drops items');
    assert.deepEqual(manyOut.split('\n').filter((line) => line.startsWith('- [ ] item ')), items.slice(0, 8));
});

// --- S2: deferred compaction re-anchor (R16, R16.1) ---
//
// pre-compact writes state/compact-<conversation_id>; the next post-tool-use
// for the SAME conversation consumes it and injects `session-start --reanchor`.

const DAY_MS = 24 * 60 * 60 * 1000;

function hookOf(hooks, name) {
    assert.ok(hooks[name], `hooks/cursor-${name} is missing from the registry`);
    return hooks[name];
}

function stateDir(hooks) {
    return path.join(hooks.dir, 'state');
}

function writeMarker(hooks, name, mtimeMs = Date.now()) {
    fs.mkdirSync(stateDir(hooks), { recursive: true });
    const file = path.join(stateDir(hooks), name);
    fs.writeFileSync(file, `${new Date(mtimeMs).toISOString()}\n`);
    const seconds = mtimeMs / 1000;
    fs.utimesSync(file, seconds, seconds);
    return file;
}

// An `awm` that records every invocation (physical cwd, then one argv entry
// per line) to a file the test reads back, and exits with `code`.
function recordingStub(code = 0) {
    const dir = tmpDir('stub-bin');
    const log = path.join(dir, 'calls.log');
    fs.writeFileSync(
        path.join(dir, 'awm'),
        '#!/usr/bin/env bash\n'
        + `{ echo "CWD $(pwd -P)"; printf 'ARG %s\\n' "$@"; echo END; } >> ${JSON.stringify(log)}\n`
        + `exit ${code}\n`,
        { mode: 0o755 },
    );
    return { dir, calls: () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8') : '') };
}

// Replace the installed session-start sibling with a stand-in Node script.
function fakeSessionStart(hooks, body) {
    fs.writeFileSync(hooks.sessionStart, `'use strict';\n${body}\n`, { mode: 0o755 });
}

function reanchorOf(result) {
    return contextOf(result);
}

test('R16.1: post-tool-use hot path is silent and touches nothing without a marker', () => {
    const cwd = tmpDir('bare');
    const hooks = installHooks(tmpDir('install'));
    const postToolUse = hookOf(hooks, 'post-tool-use');

    // No state/ dir at all: silent, and it is not created.
    let result = runHook(postToolUse, { conversation_id: 'c1' }, { cwd });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, '');
    assert.ok(!fs.existsSync(stateDir(hooks)), 'the hot path must not create state/');

    // Empty state/.
    fs.mkdirSync(stateDir(hooks));
    result = runHook(postToolUse, { conversation_id: 'c1' }, { cwd });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, '');

    // Only non-marker files, one of them old: silent, and never deleted —
    // stale cleanup applies to compact-* markers only.
    const other = path.join(stateDir(hooks), 'notes');
    fs.writeFileSync(other, 'x');
    const old = (Date.now() - 2 * DAY_MS) / 1000;
    fs.utimesSync(other, old, old);
    for (const input of [{ conversation_id: 'c1' }, {}]) {
        result = runHook(postToolUse, input, { cwd });
        assert.equal(result.status, 0, result.stderr);
        assert.equal(result.stdout, '');
    }
    assert.ok(fs.existsSync(other), 'a non-marker file in state/ must survive');
});

// spawnSync always closes stdin, so it cannot tell a hook that skips stdin
// from one that reads it, and timing cannot either: readInput() touches
// process.stdin, which makes fd 0 non-blocking, so an open-but-silent stdin
// costs readStdin ~20 EAGAIN retries (under a second) and then reads as ''.
// What does tell them apart is CONSUMPTION: stdin is a FIFO the test keeps
// open (never at EOF) holding a sentinel; after the hook exits, the sentinel
// must still be unread in the FIFO.
test('R16.1: the hot path never reads stdin (stdin left open)', { skip: process.platform === 'win32' }, async () => {
    const { spawn } = await import('node:child_process');
    const DEADLINE_MS = 2000;
    const SENTINEL = '{"conversation_id":"c1"'; // partial JSON, never ended
    const runWithOpenStdin = (installed) => new Promise((resolve) => {
        const fifo = path.join(tmpDir('fifo'), 'stdin');
        const made = spawnSync('mkfifo', [fifo]);
        assert.equal(made.status, 0, String(made.stderr));
        const writer = fs.openSync(fifo, 'r+'); // keeps a writer open: no EOF
        fs.writeSync(writer, SENTINEL);
        const child = spawn(process.execPath, [installed], { env: baseEnv(), cwd: workspace, stdio: [writer, 'pipe', 'pipe'] });
        let stdout = '';
        let timedOut = false;
        const timer = setTimeout(() => { timedOut = true; child.kill('SIGKILL'); }, DEADLINE_MS);
        child.stdout.on('data', (chunk) => { stdout += chunk; });
        child.on('close', (status) => {
            clearTimeout(timer);
            // Non-blocking reader: EAGAIN means the hook drained the FIFO.
            const reader = fs.openSync(fifo, fs.constants.O_RDONLY | fs.constants.O_NONBLOCK);
            let unread = '';
            try {
                const buffer = Buffer.alloc(1024);
                unread = buffer.subarray(0, fs.readSync(reader, buffer)).toString('utf8');
            } catch (error) {
                if (error.code !== 'EAGAIN') throw error;
            } finally {
                fs.closeSync(reader);
                fs.closeSync(writer);
            }
            resolve({ status, stdout, timedOut, unread });
        });
    });

    const cases = {
        'no state/': () => {},
        'empty state/': (hooks) => fs.mkdirSync(stateDir(hooks)),
        'only a fresh claim file': (hooks) => writeMarker(hooks, 'compact-c1.claim-123-deadbeef'),
        // The sweep runs before the hot-path return: a stale claim is removed
        // even when no marker would take the call off the hot path.
        'only a stale claim file': (hooks) => {
            const claim = writeMarker(hooks, 'compact-c1.claim-789-0badf00d', Date.now() - 2 * DAY_MS);
            return () => assert.ok(!fs.existsSync(claim), 'only a stale claim file: the claim must be swept');
        },
    };
    for (const [label, setup] of Object.entries(cases)) {
        const hooks = installHooks(tmpDir('install'));
        const check = setup(hooks);
        const result = await runWithOpenStdin(hookOf(hooks, 'post-tool-use'));
        assert.equal(result.timedOut, false, `${label}: post-tool-use did not exit within ${DEADLINE_MS} ms`);
        assert.equal(result.status, 0, label);
        assert.equal(result.stdout, '', label);
        assert.equal(result.unread, SENTINEL, `${label}: the hot path must not read stdin`);
        if (typeof check === 'function') check();
    }
});

test('R16: pre-compact queues a marker that the next post-tool-use consumes once', () => {
    const project = makeProject('compact');
    const hooks = installHooks(tmpDir('install'));
    const preCompact = hookOf(hooks, 'pre-compact');
    const postToolUse = hookOf(hooks, 'post-tool-use');
    const awm = recordingStub(0);
    const baseline = baseEnv();
    const env = { CURSOR_PROJECT_DIR: project, HOME: baseline.HOME, AWM_HOME: baseline.AWM_HOME };
    const cwd = tmpDir('launch');
    const projectBefore = listTree(project);

    const pre = runHook(preCompact, { conversation_id: 'c1', hook_event_name: 'preCompact' }, { env, cwd, stub: awm.dir });
    assert.equal(pre.status, 0, pre.stderr);
    assert.equal(pre.stdout, '{}\n');
    const marker = path.join(stateDir(hooks), 'compact-c1');
    assert.ok(fs.existsSync(marker), 'state/compact-c1 must exist');

    // The audit trail: one `awm ledger add ... --signature compaction-reanchor`, run in the project.
    const calls = awm.calls().split('END\n').filter(Boolean);
    assert.equal(calls.length, 1, awm.calls());
    const lines = calls[0].trim().split('\n');
    assert.equal(lines[0], `CWD ${fs.realpathSync(project)}`);
    const argv = lines.slice(1).map((line) => line.replace(/^ARG /, ''));
    assert.deepEqual(argv.slice(0, 2), ['ledger', 'add']);
    assert.equal(argv[argv.indexOf('--signature') + 1], 'compaction-reanchor');

    // The pre-compact hook writes nowhere but its own state/.
    assert.deepEqual(listTree(project), projectBefore, 'pre-compact must not write into the project');
    assert.deepEqual(fs.readdirSync(baseline.HOME), [], 'pre-compact must not write into HOME');
    assert.deepEqual(fs.readdirSync(baseline.AWM_HOME), [], 'pre-compact must not write into AWM_HOME');

    const first = reanchorOf(runHook(postToolUse, { conversation_id: 'c1', hook_event_name: 'postToolUse' }, { env, cwd }));
    assert.ok(first.includes('Re-anchor (post-compaction)'));
    assert.equal(activePlanLine(first), 'Active plan: 2026-07-24-demo-plan.md');
    assert.ok(!fs.existsSync(marker), 'the marker is consumed');

    const second = runHook(postToolUse, { conversation_id: 'c1' }, { env, cwd });
    assert.equal(second.status, 0, second.stderr);
    assert.equal(second.stdout, '', 'a consumed marker re-anchors only once');
});

test('R16: post-tool-use forwards its input so session-start resolves workspace_roots', () => {
    const project = makeProject('roots-forward', { plan: 'forwarded' });
    const hooks = installHooks(tmpDir('install'));
    writeMarker(hooks, 'compact-c1');
    const context = reanchorOf(runHook(hookOf(hooks, 'post-tool-use'), {
        conversation_id: 'c1', workspace_roots: [project],
    }, { cwd: tmpDir('launch') }));
    assert.equal(activePlanLine(context), 'Active plan: 2026-07-24-forwarded-plan.md');
});

test('R16: markers are isolated per conversation', () => {
    const project = makeProject('isolation');
    const hooks = installHooks(tmpDir('install'));
    const postToolUse = hookOf(hooks, 'post-tool-use');
    const env = { CURSOR_PROJECT_DIR: project };
    const cwd = tmpDir('launch');
    const marker = writeMarker(hooks, 'compact-c1');

    const other = runHook(postToolUse, { conversation_id: 'c2' }, { env, cwd });
    assert.equal(other.status, 0, other.stderr);
    assert.equal(other.stdout, '', 'c2 must not consume the c1 re-anchor');
    assert.ok(fs.existsSync(marker), 'compact-c1 must survive a c2 tool call');
    // No conversation id is its own conversation too.
    const anonymous = runHook(postToolUse, {}, { env, cwd });
    assert.equal(anonymous.stdout, '');
    assert.ok(fs.existsSync(marker));

    // Control: the owning conversation still gets it.
    assert.ok(reanchorOf(runHook(postToolUse, { conversation_id: 'c1' }, { env, cwd })).includes('Re-anchor (post-compaction)'));
});

test('R16 security: conversation_id is sanitised into a single state/ file name', () => {
    const project = makeProject('sanitise');
    const cwd = tmpDir('launch');
    const env = { CURSOR_PROJECT_DIR: project };
    const cases = [
        ['../../x', 'compact-x'],
        ['a/b\\c d', 'compact-abcd'],
        ['../..', 'compact-default'],
        [42, 'compact-default'],
        [undefined, 'compact-default'],
        ['k'.repeat(300), `compact-${'k'.repeat(128)}`],
    ];
    for (const [id, expected] of cases) {
        const root = tmpDir('sandbox');
        const hooks = installHooks(path.join(root, 'install'));
        const input = id === undefined ? {} : { conversation_id: id };
        const pre = runHook(hookOf(hooks, 'pre-compact'), input, { env, cwd });
        assert.equal(pre.status, 0, pre.stderr);
        assert.deepEqual(fs.readdirSync(stateDir(hooks)), [expected], `conversation_id ${JSON.stringify(id)}`);
        assert.deepEqual(fs.readdirSync(root), ['install'], `nothing may be written beside the install dir for ${JSON.stringify(id)}`);

        // post-tool-use applies the same name, so the marker it wrote is the one consumed.
        const context = reanchorOf(runHook(hookOf(hooks, 'post-tool-use'), input, { env, cwd }));
        assert.ok(context.includes('Re-anchor (post-compaction)'), `conversation_id ${JSON.stringify(id)}`);
        assert.deepEqual(fs.readdirSync(stateDir(hooks)), []);
    }
});

test('R16: a marker older than 24 h is deleted and never re-anchors', () => {
    const project = makeProject('stale');
    const hooks = installHooks(tmpDir('install'));
    const env = { CURSOR_PROJECT_DIR: project };
    const stale = writeMarker(hooks, 'compact-c1', Date.now() - 2 * DAY_MS);
    const staleOther = writeMarker(hooks, 'compact-c9', Date.now() - 2 * DAY_MS);
    const fresh = writeMarker(hooks, 'compact-c2', Date.now() - 60 * 1000);

    const result = runHook(hookOf(hooks, 'post-tool-use'), { conversation_id: 'c1' }, { env, cwd: tmpDir('launch') });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, '', 'a stale marker must not re-anchor');
    assert.ok(!fs.existsSync(stale));
    assert.ok(!fs.existsSync(staleOther), 'stale markers of other conversations are swept too');
    assert.ok(fs.existsSync(fresh), 'a fresh marker of another conversation survives');
});

test('R16: the marker is claimed, and the claim removed, BEFORE the re-anchor is computed', () => {
    const hooks = installHooks(tmpDir('install'));
    writeMarker(hooks, 'compact-c1');
    // Stand-in sibling reports what is left in state/ while it runs (neither
    // the marker nor the claim file may remain), and echoes the conversation
    // it was handed on stdin.
    fakeSessionStart(hooks, [
        "const fs = require('node:fs');",
        "const path = require('node:path');",
        "const state = path.join(path.dirname(process.argv[1]), 'state');",
        "const input = JSON.parse(fs.readFileSync(0, 'utf8'));",
        "process.stdout.write(`STATE=${JSON.stringify(fs.readdirSync(state))} ${process.argv.slice(2).join(' ')} ${input.conversation_id}`);",
    ].join('\n'));
    const context = reanchorOf(runHook(hookOf(hooks, 'post-tool-use'), { conversation_id: 'c1' }, { cwd: tmpDir('launch') }));
    assert.equal(context, 'STATE=[] --reanchor c1');
});

// Amendment A2: concurrent unlink() of one path can succeed in several
// processes at once on macOS APFS, so the claim must be an exclusive rename.
// One round rarely exposes the race; many rounds make an unlink claim fail
// this reliably.
test('R16: concurrent tool calls re-anchor exactly once', async () => {
    const { spawn } = await import('node:child_process');
    const ROUNDS = 25;
    const CALLS = 4;
    const run = (hooks) => new Promise((resolve) => {
        const child = spawn(process.execPath, [hooks['post-tool-use']], { env: baseEnv(), cwd: workspace });
        let stdout = '';
        child.stdout.on('data', (chunk) => { stdout += chunk; });
        child.on('close', (status) => resolve({ status, stdout }));
        child.stdin.end(JSON.stringify({ conversation_id: 'c1' }));
    });
    const doubled = [];
    for (let round = 0; round < ROUNDS; round += 1) {
        const hooks = installHooks(tmpDir('install'));
        hookOf(hooks, 'post-tool-use');
        writeMarker(hooks, 'compact-c1');
        // A slow sibling keeps every call in flight at once.
        fakeSessionStart(hooks, "const t = Date.now(); while (Date.now() - t < 100) {} process.stdout.write('REANCHOR');");
        const results = await Promise.all(Array.from({ length: CALLS }, () => run(hooks)));
        for (const result of results) assert.equal(result.status, 0);
        const reanchored = results.filter((result) => result.stdout.includes('REANCHOR')).length;
        if (reanchored !== 1) doubled.push({ round, reanchored });
        assert.deepEqual(fs.readdirSync(stateDir(hooks)), [], `round ${round}: no marker or claim may be left behind`);
    }
    assert.deepEqual(doubled, [], `rounds that did not re-anchor exactly once: ${JSON.stringify(doubled)}`);
});

test('R16: claim files are never consumed as markers and are swept after 24 h', () => {
    const project = makeProject('claims');
    const hooks = installHooks(tmpDir('install'));
    const env = { CURSOR_PROJECT_DIR: project };
    const staleClaim = writeMarker(hooks, 'compact-c1.claim-123-deadbeef', Date.now() - 2 * DAY_MS);
    const freshClaim = writeMarker(hooks, 'compact-c2.claim-456-cafef00d', Date.now() - 60 * 1000);
    // A pending marker of another conversation takes every call off the hot
    // path, so the marker lookup itself runs against the claim files.
    const pending = writeMarker(hooks, 'compact-c3');

    for (const id of ['c1', 'c2']) {
        const result = runHook(hookOf(hooks, 'post-tool-use'), { conversation_id: id }, { env, cwd: tmpDir('launch') });
        assert.equal(result.status, 0, result.stderr);
        assert.equal(result.stdout, '', `a claim file must not re-anchor ${id}`);
    }
    assert.ok(!fs.existsSync(staleClaim), 'a claim file older than 24 h is swept');
    assert.ok(fs.existsSync(freshClaim), 'a fresh claim file is left alone');
    assert.ok(fs.existsSync(pending), 'the c3 marker belongs to another conversation');
});

test('R16 fail-open: a failing awm still exits 0, prints {} and writes the marker', () => {
    const project = makeProject('awm-fails');
    const hooks = installHooks(tmpDir('install'));
    const failing = recordingStub(1);
    const result = runHook(hookOf(hooks, 'pre-compact'), { conversation_id: 'c1' }, {
        env: { CURSOR_PROJECT_DIR: project }, cwd: tmpDir('launch'), stub: failing.dir,
    });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, '{}\n');
    assert.ok(failing.calls().includes('ARG compaction-reanchor'), 'the stub must actually have been called');
    assert.ok(fs.existsSync(path.join(stateDir(hooks), 'compact-c1')));
});

test('R16 fail-open: a hung awm is cut off and the marker is still written', () => {
    const project = makeProject('awm-hung');
    const hooks = installHooks(tmpDir('install'));
    const started = Date.now();
    const result = runHook(hookOf(hooks, 'pre-compact'), { conversation_id: 'c1' }, {
        env: { CURSOR_PROJECT_DIR: project }, cwd: tmpDir('launch'), stub: awmStub('exec sleep 5'),
    });
    const elapsed = Date.now() - started;
    assert.equal(result.status, 0, result.stderr);
    assert.ok(elapsed < 4000, `pre-compact took ${elapsed} ms`);
    assert.equal(result.stdout, '{}\n');
    assert.ok(fs.existsSync(path.join(stateDir(hooks), 'compact-c1')));
});

test('R16 fail-open: a missing or hung session-start sibling leaves post-tool-use silent', () => {
    const project = makeProject('no-sibling');
    const env = { CURSOR_PROJECT_DIR: project };

    const missing = installHooks(tmpDir('install'));
    writeMarker(missing, 'compact-c1');
    fs.unlinkSync(missing.sessionStart);
    let result = runHook(hookOf(missing, 'post-tool-use'), { conversation_id: 'c1' }, { env, cwd: tmpDir('launch') });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, '');

    const hung = installHooks(tmpDir('install'));
    writeMarker(hung, 'compact-c1');
    fakeSessionStart(hung, 'setTimeout(() => {}, 10000);');
    const started = Date.now();
    result = runHook(hookOf(hung, 'post-tool-use'), { conversation_id: 'c1' }, { env, cwd: tmpDir('launch') });
    const elapsed = Date.now() - started;
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, '');
    assert.ok(elapsed < 6000, `post-tool-use took ${elapsed} ms`);
});

test('R16 fail-open: a read-only install dir still lets pre-compact exit 0', { skip: process.getuid?.() === 0 || process.platform === 'win32' }, () => {
    const project = makeProject('readonly-compact');
    const hooks = installHooks(tmpDir('install'));
    fs.chmodSync(hooks.dir, 0o555);
    try {
        const result = runHook(hookOf(hooks, 'pre-compact'), { conversation_id: 'c1' }, {
            env: { CURSOR_PROJECT_DIR: project }, cwd: tmpDir('launch'),
        });
        assert.equal(result.status, 0, result.stderr);
        assert.equal(result.stdout, '{}\n');
        assert.ok(!fs.existsSync(stateDir(hooks)));
    } finally {
        fs.chmodSync(hooks.dir, 0o755);
    }
});

test('R16 fail-open: hostile stdin still queues and consumes the default marker', () => {
    const project = makeProject('hostile-compact');
    const env = { CURSOR_PROJECT_DIR: project };
    for (const payload of ['null', '"text"', '[]', 'not json', '', '{"conversation_id":{"a":1},"workspace_roots":"x"}']) {
        const hooks = installHooks(tmpDir('install'));
        const pre = runHook(hookOf(hooks, 'pre-compact'), payload, { env, cwd: tmpDir('launch') });
        assert.equal(pre.status, 0, `payload ${JSON.stringify(payload)}: ${pre.stderr}`);
        assert.equal(pre.stdout, '{}\n', `payload ${JSON.stringify(payload)}`);
        assert.deepEqual(fs.readdirSync(stateDir(hooks)), ['compact-default'], `payload ${JSON.stringify(payload)}`);
        const context = reanchorOf(runHook(hookOf(hooks, 'post-tool-use'), payload, { env, cwd: tmpDir('launch') }));
        assert.equal(activePlanLine(context), 'Active plan: 2026-07-24-demo-plan.md', `payload ${JSON.stringify(payload)}`);
    }
});

test('R5/R16: the injected re-anchor is at most 4096 bytes end-to-end', () => {
    const items = Array.from({ length: 8 }, (_, i) => `- [ ] item ${i} ${'é'.repeat(500)}`).join('\n');
    const project = makeProject('reanchor-budget', { planBody: `# Big Plan\n\n> **Goal:** stay small\n\n${items}\n` });
    const ledger = ledgerStub(Array.from({ length: 50 }, (_, i) => ledgerEntry({ signature: `finding-${i}`, desc: 'x'.repeat(400) })));
    const hooks = installHooks(tmpDir('install'));
    writeMarker(hooks, 'compact-c1');
    const context = reanchorOf(runHook(hookOf(hooks, 'post-tool-use'), { conversation_id: 'c1' }, {
        env: { CURSOR_PROJECT_DIR: project }, cwd: tmpDir('launch'), stub: ledger,
    }));
    assert.ok(Buffer.byteLength(context, 'utf8') <= 4096, `got ${Buffer.byteLength(context, 'utf8')} bytes`);
    assert.ok(context.includes('Re-anchor (post-compaction)'));
    assert.ok(context.includes('[truncated by AWM'));
});
