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

// `awm` is stubbed to fail rather than removed from PATH: the hooks need
// node on PATH to run at all, and a real `awm` would make the ledger section
// non-deterministic — and would write a compaction entry into the real ledger.
const stubBin = fs.mkdtempSync(path.join(os.tmpdir(), 'awm-stub-bin-'));
fs.writeFileSync(path.join(stubBin, 'awm'), '#!/usr/bin/env bash\nexit 1\n', { mode: 0o755 });
const neutralPath = `${stubBin}${path.delimiter}${process.env.PATH}`;

function runBashHook(cwd, source, hooksRoot) {
    return spawnSync('bash', [bashHook], {
        cwd,
        input: JSON.stringify({ source }),
        encoding: 'utf8',
        env: { ...process.env, AWM_HOOKS_ROOT: hooksRoot, PATH: neutralPath },
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
    const codex = spawnSync(codexHook, [], {
        input: JSON.stringify({ source: 'compact', cwd: project }),
        encoding: 'utf8',
        env: { ...process.env, PATH: neutralPath },
    });
    assert.equal(
        activePlanLine(contextOf(codex)),
        activePlanLine(context),
        'the Claude and Codex hooks must re-anchor on the same plan',
    );

    process.stdout.write('claude session hook: ok\n');
} finally {
    fs.rmSync(workspace, { recursive: true, force: true });
    fs.rmSync(stubBin, { recursive: true, force: true });
}
