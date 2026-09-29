// Smoke test for hooks/session-start, the Claude Code SessionStart hook.
//
// R19 requires the Claude hook's behaviour to survive the Codex work, but
// nothing in the repo read or ran this script — it could have been replaced
// with `exit 1` and every gate would still have gone green.
//
// It also pins the cross-provider invariant the two hooks share: given the same
// project, hooks/session-start and hooks/codex-session-start must re-anchor on
// the SAME plan. They drifted once already (one matched `design` anywhere in
// the absolute path, the other only in the basename), which silently disabled
// recovery for every repo stored under a directory named like a design system.

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bashHook = path.join(repoRoot, 'hooks/session-start');
const codexHook = path.join(repoRoot, 'hooks/codex-session-start');
const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'awm-session-start-'));

// The Codex hook writes heartbeat.json next to the script it runs as. Run from
// the checkout it rewrites the gitignored hooks/heartbeat.json, which the Codex
// and Cursor suites also snapshot, so concurrent runs flaked. This suite must
// leave that file exactly as it found it (or absent).
const checkoutHeartbeat = path.join(repoRoot, 'hooks/heartbeat.json');
function heartbeatSnapshot() {
    try {
        const details = fs.statSync(checkoutHeartbeat);
        return `${details.mtimeMs} ${details.ino} ${fs.readFileSync(checkoutHeartbeat, 'utf8')}`;
    } catch {
        return 'absent';
    }
}
const heartbeatBefore = heartbeatSnapshot();

// `awm` is stubbed to fail rather than removed from PATH: the hooks need
// node on PATH to run at all, and a real `awm` would make the ledger section
// non-deterministic — and would write a compaction entry into the real ledger.
const stubBin = fs.mkdtempSync(path.join(os.tmpdir(), 'awm-stub-bin-'));
fs.writeFileSync(path.join(stubBin, 'awm'), '#!/usr/bin/env bash\nexit 1\n', { mode: 0o755 });
const neutralPath = `${stubBin}${path.delimiter}${process.env.PATH}`;

// Every hook run starts from this env. The suite may itself run inside a
// Cursor session (CURSOR_VERSION set) on a machine with the Cursor hook
// installed under HOME or AWM_HOME, where the R15 guard would silence the
// bash hook. The R15 cases below set these variables deliberately.
const isolatedHome = path.join(workspace, 'isolated-home');
fs.mkdirSync(isolatedHome, { recursive: true });
function isolatedEnv(extra = {}) {
    const env = { ...process.env, HOME: isolatedHome, PATH: neutralPath };
    delete env.CURSOR_VERSION;
    delete env.AWM_HOME;
    return { ...env, ...extra };
}

function runBashHook(cwd, source, hooksRoot) {
    return spawnSync('bash', [bashHook], {
        cwd,
        input: JSON.stringify({ source }),
        encoding: 'utf8',
        env: isolatedEnv({ AWM_HOOKS_ROOT: hooksRoot }),
    });
}

function contextOf(result) {
    assert.equal(result.status, 0, result.stderr);
    const output = JSON.parse(result.stdout);
    assert.equal(output.hookSpecificOutput.hookEventName, 'SessionStart');
    return output.hookSpecificOutput.additionalContext;
}

function activePlanLine(context) {
    return context.split('\n').find((line) => line.startsWith('Active plan:')) || null;
}

try {
    // AWM installs using-awm.md next to the hook; the envelope is its payload.
    const hooksRoot = path.join(workspace, 'awm-hooks');
    fs.mkdirSync(hooksRoot, { recursive: true });
    fs.writeFileSync(path.join(hooksRoot, 'using-awm.md'), '# using-awm\n\nSkill policy body.\n');

    // Stored under a directory whose name contains "design" — the exact shape
    // that used to make the bash hook drop every plan it found.
    const project = path.join(workspace, 'design-system', 'app');
    const plans = path.join(project, 'docs/plans');
    fs.mkdirSync(plans, { recursive: true });
    fs.writeFileSync(path.join(project, 'CONSTITUTION.md'), '# Rules\n\nShip verified work.\n');

    const writePlan = (name, body, mtimeSeconds) => {
        const file = path.join(plans, name);
        fs.writeFileSync(file, body);
        fs.utimesSync(file, mtimeSeconds, mtimeSeconds);
    };

    writePlan(
        '2026-07-24-redesign-checkout-plan.md',
        '# Redesign Checkout\n\n> **Goal:** ship checkout v2\n\n'
        + '- [ ] step one\n- [ ] append the awm-qa-complete comment when done\n',
        1_000,
    );
    // Newer rivals that must lose: a real design doc and a completed plan.
    writePlan('2026-07-26-thing-design.md', '# Thing Design\n\n- [ ] design item\n', 9_000);
    writePlan('2026-07-27-done-plan.md', '# Done\n\n- [ ] leftover\n<!-- awm-qa-complete -->\n', 9_000);

    // --- The envelope, the constitution and the re-anchor all arrive. ---
    const context = contextOf(runBashHook(project, 'compact', hooksRoot));
    assert.match(context, /You have AWM\./);
    assert.match(context, /Skill policy body\./);
    assert.match(context, /## Project Constitution/);
    assert.match(context, /Ship verified work\./);
    assert.match(context, /Active plan: 2026-07-24-redesign-checkout-plan\.md/);
    assert.match(context, /\*\*Goal:\*\* ship checkout v2/);
    assert.doesNotMatch(context, /design item/);
    assert.doesNotMatch(context, /leftover/);

    // --- Silent in absence: no constitution, no plans, still valid JSON. ---
    const bare = path.join(workspace, 'bare');
    fs.mkdirSync(bare, { recursive: true });
    const bareContext = contextOf(runBashHook(bare, 'startup', hooksRoot));
    assert.match(bareContext, /You have AWM\./);
    assert.doesNotMatch(bareContext, /## Project Constitution/);
    assert.doesNotMatch(bareContext, /Re-anchor/);

    // --- A missing using-awm.md must not crash the session. ---
    const emptyRoot = path.join(workspace, 'empty-hooks');
    fs.mkdirSync(emptyRoot, { recursive: true });
    assert.match(contextOf(runBashHook(bare, 'startup', emptyRoot)), /You have AWM\./);

    // --- Cross-provider parity: same project, same plan. ---
    const codexInstall = path.join(workspace, 'codex-install');
    fs.mkdirSync(codexInstall, { recursive: true });
    const installedCodexHook = path.join(codexInstall, 'codex-session-start');
    fs.copyFileSync(codexHook, installedCodexHook);
    fs.chmodSync(installedCodexHook, 0o755);
    const codex = spawnSync(installedCodexHook, [], {
        input: JSON.stringify({ source: 'compact', cwd: project }),
        encoding: 'utf8',
        env: isolatedEnv(),
    });
    assert.equal(
        activePlanLine(contextOf(codex)),
        activePlanLine(context),
        'the Claude and Codex hooks must re-anchor on the same plan',
    );

    // --- R15: inside Cursor, the native Cursor hook is the only carrier. ---
    // Cursor also runs ~/.claude/settings.json hooks, so with AWM's Cursor hook
    // installed this hook must stay silent; everywhere else its output must be
    // byte-identical to a run with no Cursor environment at all.
    const cursorHome = path.join(workspace, 'cursor-home');
    const cursorAwm = path.join(workspace, 'cursor-awm');
    const cursorHookDir = path.join(cursorAwm, 'hooks/cursor');
    fs.mkdirSync(path.join(cursorHome, '.awm/hooks/cursor'), { recursive: true });
    fs.mkdirSync(cursorHookDir, { recursive: true });

    const runInCursorEnv = (overrides, hookPath = bashHook, args = []) => {
        const env = isolatedEnv({ AWM_HOOKS_ROOT: hooksRoot });
        for (const [key, value] of Object.entries(overrides)) {
            if (value === undefined) delete env[key];
            else env[key] = value;
        }
        return spawnSync('bash', [hookPath, ...args], {
            cwd: bare,
            input: JSON.stringify({ source: 'startup' }),
            encoding: 'utf8',
            env,
        });
    };
    const cursorEnv = { HOME: cursorHome, AWM_HOME: cursorAwm };

    // Reference output: no Cursor variable, no Cursor hook installed.
    const reference = runInCursorEnv(cursorEnv);
    assert.match(contextOf(reference), /You have AWM\./);

    // Cursor running and its native hook installed: silent, successful exit.
    fs.writeFileSync(path.join(cursorHookDir, 'session-start'), '#!/usr/bin/env bash\n', { mode: 0o755 });
    const suppressed = runInCursorEnv({ ...cursorEnv, CURSOR_VERSION: '2026.09.26' });
    assert.equal(suppressed.status, 0, suppressed.stderr);
    assert.equal(suppressed.stdout, '', 'the Claude hook must not duplicate the Cursor hook context');

    // Hook installed but not running inside Cursor: byte-identical output.
    const outsideCursor = runInCursorEnv(cursorEnv);
    assert.equal(outsideCursor.status, 0, outsideCursor.stderr);
    assert.equal(outsideCursor.stdout, reference.stdout);

    // Inside Cursor but its hook not installed: byte-identical output.
    fs.rmSync(path.join(cursorHookDir, 'session-start'));
    const notInstalled = runInCursorEnv({ ...cursorEnv, CURSOR_VERSION: '2026.09.26' });
    assert.equal(notInstalled.status, 0, notInstalled.stderr);
    assert.equal(notInstalled.stdout, reference.stdout);

    // AWM_HOME unset falls back to $HOME/.awm, where the hook is installed.
    fs.writeFileSync(path.join(cursorHome, '.awm/hooks/cursor/session-start'), '#!/usr/bin/env bash\n', { mode: 0o755 });
    const fallback = runInCursorEnv({ HOME: cursorHome, CURSOR_VERSION: '2026.09.26' });
    assert.equal(fallback.status, 0, fallback.stderr);
    assert.equal(fallback.stdout, '', 'AWM_HOME unset must fall back to $HOME/.awm');

    // A dangling symlink at the Cursor hook path is not an installed hook:
    // losing the context would be worse than paying for it twice.
    const danglingAwm = path.join(workspace, 'dangling-awm');
    fs.mkdirSync(path.join(danglingAwm, 'hooks/cursor'), { recursive: true });
    fs.symlinkSync(
        path.join(workspace, 'no-such-cursor-hook'),
        path.join(danglingAwm, 'hooks/cursor/session-start'),
    );
    const dangling = runInCursorEnv({ HOME: cursorHome, AWM_HOME: danglingAwm, CURSOR_VERSION: '2026.09.26' });
    assert.equal(dangling.status, 0, dangling.stderr);
    assert.equal(dangling.stdout, reference.stdout, 'a dangling symlink must not suppress the context');

    // Installed layout: the Claude hook lives in <AWM_HOME>/hooks/, the parent of
    // hooks/cursor/. Under a custom AWM_HOME that Cursor does not export, the
    // sibling is the only way to see the Cursor hook is installed.
    const siblingAwm = path.join(workspace, 'sibling-awm');
    const elsewhereHome = path.join(workspace, 'elsewhere-home');
    fs.mkdirSync(path.join(siblingAwm, 'hooks/cursor'), { recursive: true });
    fs.mkdirSync(elsewhereHome, { recursive: true });
    const installedClaudeHook = path.join(siblingAwm, 'hooks/session-start');
    fs.copyFileSync(bashHook, installedClaudeHook);
    fs.chmodSync(installedClaudeHook, 0o755);
    const siblingCursorHook = path.join(siblingAwm, 'hooks/cursor/session-start');

    // A dangling sibling symlink is not an installed hook either.
    fs.symlinkSync(path.join(workspace, 'no-such-sibling-hook'), siblingCursorHook);
    const siblingDangling = runInCursorEnv({ HOME: elsewhereHome, CURSOR_VERSION: '2026.09.26' }, installedClaudeHook);
    assert.equal(siblingDangling.status, 0, siblingDangling.stderr);
    assert.equal(siblingDangling.stdout, reference.stdout, 'a dangling sibling symlink must not suppress the context');

    fs.rmSync(siblingCursorHook);
    fs.writeFileSync(siblingCursorHook, '#!/usr/bin/env bash\n', { mode: 0o755 });
    const sibling = runInCursorEnv({ HOME: elsewhereHome, CURSOR_VERSION: '2026.09.26' }, installedClaudeHook);
    assert.equal(sibling.status, 0, sibling.stderr);
    assert.equal(sibling.stdout, '', 'a Cursor hook installed next to this hook must suppress it');

    // The default install is a symlink into the registry, usually run through
    // run-hook.cmd. It works only because $0 stays the symlink path: resolving
    // it would look for hooks/cursor/ inside the registry instead.
    const linkedAwm = path.join(workspace, 'linked-awm');
    fs.mkdirSync(path.join(linkedAwm, 'hooks/cursor'), { recursive: true });
    const linkedClaudeHook = path.join(linkedAwm, 'hooks/session-start');
    const linkedRunHook = path.join(linkedAwm, 'hooks/run-hook.cmd');
    fs.symlinkSync(bashHook, linkedClaudeHook);
    fs.symlinkSync(path.join(repoRoot, 'hooks/run-hook.cmd'), linkedRunHook);
    fs.writeFileSync(path.join(linkedAwm, 'hooks/cursor/session-start'), '#!/usr/bin/env bash\n', { mode: 0o755 });
    const linkedEnv = { HOME: elsewhereHome, CURSOR_VERSION: '2026.09.26' };

    const linkedDirect = runInCursorEnv(linkedEnv, linkedClaudeHook);
    assert.equal(linkedDirect.status, 0, linkedDirect.stderr);
    assert.equal(linkedDirect.stdout, '', 'a symlinked Claude hook must see the Cursor hook next to its link');

    const linkedWrapped = runInCursorEnv(linkedEnv, linkedRunHook, ['session-start']);
    assert.equal(linkedWrapped.status, 0, linkedWrapped.stderr);
    assert.equal(linkedWrapped.stdout, '', 'run-hook.cmd through symlinks must keep the link directory');

    // No HOME and no AWM_HOME under `set -u`: the guard must not abort the hook.
    // The env is built from scratch (env -i style) so nothing leaks in from the
    // suite's own HOME; the guard then probes /.awm, which must not exist here.
    assert.equal(fs.existsSync('/.awm'), false, 'precondition: /.awm must not exist on this machine');
    const homeless = spawnSync('bash', [bashHook], {
        cwd: bare,
        input: JSON.stringify({ source: 'startup' }),
        encoding: 'utf8',
        env: { PATH: neutralPath, AWM_HOOKS_ROOT: hooksRoot, CURSOR_VERSION: '2026.09.26' },
    });
    assert.equal(homeless.status, 0, homeless.stderr);
    assert.equal(homeless.stdout, reference.stdout, 'no HOME must still emit the normal context');

    // --- Equal-mtime plans tie-break in byte order under any locale. ---
    // Under en_US.UTF-8, `ls -t` collates `a-plan.md` before `B-plan.md`; the
    // Node hooks use byte order, where `B` (0x42) sorts before `a` (0x61).
    const tieProject = path.join(workspace, 'tie-break');
    const tiePlans = path.join(tieProject, 'docs/plans');
    fs.mkdirSync(tiePlans, { recursive: true });
    for (const name of ['a-plan.md', 'B-plan.md']) {
        const file = path.join(tiePlans, name);
        fs.writeFileSync(file, `# ${name}\n\n- [ ] open step\n`);
        fs.utimesSync(file, 5_000, 5_000);
    }
    const tieLocale = 'en_US.UTF-8';
    const localeEnv = isolatedEnv({ LANG: tieLocale, LC_ALL: tieLocale });
    const byteFirst = ['a-plan.md', 'B-plan.md']
        .sort((a, b) => Buffer.compare(Buffer.from(a), Buffer.from(b)))[0];
    const lsFirst = (env) => {
        const listed = spawnSync('bash', ['-c', 'ls -t "$1"/*.md', 'ls-first', tiePlans], { encoding: 'utf8', env });
        assert.equal(listed.status, 0, listed.stderr);
        return path.basename(listed.stdout.split('\n')[0]);
    };
    assert.equal(lsFirst({ ...localeEnv, LC_ALL: 'C' }), byteFirst, 'LC_ALL=C ls -t must list the byte-order file first');

    // Precondition (A9): without the locale installed, `ls` silently falls back
    // to C and the assertion below would pass even with LC_ALL=C removed from
    // the hook. Require plain `ls -t` under the locale to disagree with byte
    // order; otherwise fail in CI and skip visibly elsewhere.
    const localeFirst = lsFirst(localeEnv);
    const localeMissing = localeFirst === byteFirst
        ? `${tieLocale} collation is unavailable on this host (plain \`ls -t\` printed ${localeFirst}, the byte-order file, first)`
        : null;
    if (localeMissing && process.env.CI) assert.fail(`locale precondition failed in CI: ${localeMissing}`);
    if (localeMissing) {
        process.stdout.write(`SKIP: bash plan tie-break under ${tieLocale}: ${localeMissing}\n`);
    } else {
        const tie = spawnSync('bash', [bashHook], {
            cwd: tieProject,
            input: JSON.stringify({ source: 'compact' }),
            encoding: 'utf8',
            env: { ...localeEnv, AWM_HOOKS_ROOT: hooksRoot },
        });
        assert.equal(activePlanLine(contextOf(tie)), `Active plan: ${byteFirst}`);
    }

    // --- Isolation: the suite passes inside a Cursor session with the Cursor
    // hook installed under HOME. Re-run it as a child in exactly that setting
    // (the child skips this step, so it does not recurse).
    if (!process.env.AWM_SESSION_START_ISOLATION_CHILD) {
        const hostileHome = path.join(workspace, 'hostile-home');
        fs.mkdirSync(path.join(hostileHome, '.awm/hooks/cursor'), { recursive: true });
        fs.writeFileSync(path.join(hostileHome, '.awm/hooks/cursor/session-start'), '#!/usr/bin/env bash\n', { mode: 0o755 });
        const hostileAwm = path.join(workspace, 'hostile-awm');
        fs.mkdirSync(path.join(hostileAwm, 'hooks/cursor'), { recursive: true });
        fs.writeFileSync(path.join(hostileAwm, 'hooks/cursor/session-start'), '#!/usr/bin/env bash\n', { mode: 0o755 });
        for (const [label, extra] of [
            ['HOME', {}],
            ['AWM_HOME', { AWM_HOME: hostileAwm }],
        ]) {
            const child = spawnSync(process.execPath, [fileURLToPath(import.meta.url)], {
                encoding: 'utf8',
                env: {
                    ...process.env,
                    AWM_SESSION_START_ISOLATION_CHILD: '1',
                    CURSOR_VERSION: '2026.09.26',
                    HOME: hostileHome,
                    ...extra,
                },
            });
            assert.equal(
                child.status,
                0,
                `suite must pass inside Cursor with the hook installed via ${label}:\n${child.stdout}${child.stderr}`,
            );
        }
    }

    assert.equal(heartbeatSnapshot(), heartbeatBefore, 'the suite must not rewrite hooks/heartbeat.json in the checkout');

    process.stdout.write('claude session hook: ok\n');
} finally {
    fs.rmSync(workspace, { recursive: true, force: true });
    fs.rmSync(stubBin, { recursive: true, force: true });
}
