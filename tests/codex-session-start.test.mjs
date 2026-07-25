// Smoke test for hooks/codex-session-start.
//
// Runs the hook the way AWM installs it — copied out of the registry into a
// separate directory — so the heartbeat contract is exercised against the
// INSTALLED path, not the source path. Everything happens inside a temporary
// workspace; the test never touches the real ~/.awm.

import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const hookSource = path.join(repoRoot, 'hooks/codex-session-start');
const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'awm-codex-hook-'));

function installHook(directory) {
    fs.mkdirSync(directory, { recursive: true });
    const installed = path.join(directory, 'session-start');
    fs.copyFileSync(hookSource, installed);
    fs.chmodSync(installed, 0o755);
    return installed;
}

function runHook(installed, input) {
    return spawnSync(installed, [], { input: JSON.stringify(input), encoding: 'utf8' });
}

function parseContext(result) {
    assert.equal(result.status, 0, result.stderr);
    const output = JSON.parse(result.stdout);
    assert.equal(output.hookSpecificOutput.hookEventName, 'SessionStart');
    return output.hookSpecificOutput.additionalContext;
}

try {
    // --- A project with a constitution and an open plan re-anchors fully. ---
    const project = path.join(workspace, 'project');
    const plans = path.join(project, 'docs/plans');
    fs.mkdirSync(plans, { recursive: true });
    fs.writeFileSync(path.join(project, 'CONSTITUTION.md'), '# Rules\n\nShip verified work.\n');
    fs.writeFileSync(
        path.join(plans, '2026-07-24-demo-plan.md'),
        '# Demo Implementation Plan\n\n**Goal:** prove recovery\n\n- [ ] open item\n',
    );
    // A completed plan must not win over the open one, even when it is newer.
    fs.writeFileSync(
        path.join(plans, '2026-07-25-done-plan.md'),
        '# Done Plan\n\n**Goal:** already finished\n\n- [ ] leftover\n<!-- awm-qa-complete -->\n',
    );

    const hooksDir = path.join(workspace, 'awm-hooks');
    const installed = installHook(hooksDir);

    const context = parseContext(runHook(installed, { source: 'compact', cwd: project }));
    assert.match(context, /Project Constitution/);
    assert.match(context, /Ship verified work\./);
    assert.match(context, /Active plan: 2026-07-24-demo-plan\.md/);
    assert.match(context, /Goal: prove recovery/);
    assert.match(context, /open item/);
    assert.doesNotMatch(context, /already finished/);

    // The heartbeat lands next to the installed script, with the field names
    // the CLI's trust check reads: `hash` = sha256 of that installed script.
    const heartbeat = JSON.parse(fs.readFileSync(path.join(hooksDir, 'heartbeat.json'), 'utf8'));
    assert.equal(heartbeat.event, 'compact');
    assert.match(heartbeat.ts, /^\d{4}-\d{2}-\d{2}T/);
    assert.equal(
        heartbeat.hash,
        crypto.createHash('sha256').update(fs.readFileSync(installed)).digest('hex'),
    );

    // --- A symlinked install writes the heartbeat at the install location. ---
    // Node resolves symlinks for `__filename`, so a hook that derives its
    // heartbeat directory from the module path would write back into the
    // registry instead of ~/.awm/hooks/codex, where `awm hooks status` looks.
    const linkDir = path.join(workspace, 'awm-hooks-linked');
    fs.mkdirSync(linkDir, { recursive: true });
    const linked = path.join(linkDir, 'session-start');
    fs.symlinkSync(hookSource, linked);

    // Snapshot the registry-side heartbeat rather than asserting it is absent:
    // running the hook straight out of the checkout legitimately creates one
    // (it is gitignored), and this test must not depend on that global state.
    const registryHeartbeat = path.join(repoRoot, 'hooks/heartbeat.json');
    const registryHeartbeatBefore = fs.existsSync(registryHeartbeat)
        ? fs.readFileSync(registryHeartbeat, 'utf8')
        : null;

    parseContext(runHook(linked, { source: 'resume', cwd: project }));
    assert.ok(
        fs.existsSync(path.join(linkDir, 'heartbeat.json')),
        'symlinked install must write heartbeat.json beside the link, not beside the registry source',
    );
    const registryHeartbeatAfter = fs.existsSync(registryHeartbeat)
        ? fs.readFileSync(registryHeartbeat, 'utf8')
        : null;
    assert.equal(
        registryHeartbeatAfter,
        registryHeartbeatBefore,
        'a symlinked run must not touch the heartbeat in the registry checkout',
    );

    // --- A bare project still emits valid JSON with the AWM directive. ---
    const bare = path.join(workspace, 'bare');
    fs.mkdirSync(bare, { recursive: true });
    const bareContext = parseContext(runHook(installed, { source: 'startup', cwd: bare }));
    assert.match(bareContext, /AWM is active\./);
    assert.doesNotMatch(bareContext, /Re-anchor/);
    assert.doesNotMatch(bareContext, /Project Constitution/);

    // --- Malformed stdin must degrade, not crash. ---
    const malformed = spawnSync(installed, [], { input: 'not json', encoding: 'utf8' });
    assert.equal(malformed.status, 0, malformed.stderr);
    assert.match(JSON.parse(malformed.stdout).hookSpecificOutput.additionalContext, /AWM is active\./);

    process.stdout.write('codex session hook: ok\n');
} finally {
    fs.rmSync(workspace, { recursive: true, force: true });
}
