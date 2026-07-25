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

function runHook(installed, input, options = {}) {
    return spawnSync(installed, [], { input: JSON.stringify(input), encoding: 'utf8', ...options });
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

    // Selection is mtime-first, so every rival below is written NEWER than the
    // winner and stamped explicitly. Left to the filesystem, all fixtures land
    // in the same millisecond, the alphabetical tiebreak decides, and each
    // exclusion rule below can be deleted without a single assertion noticing.
    const writePlan = (name, body, mtimeSeconds) => {
        const file = path.join(plans, name);
        fs.writeFileSync(file, body);
        fs.utimesSync(file, mtimeSeconds, mtimeSeconds);
    };

    writePlan(
        '2026-07-24-demo-plan.md',
        '# Demo Implementation Plan\n\n> **Goal:** prove recovery\n\n- [ ] open item\n',
        1_000,
    );
    // Newer, but complete: the marker must beat recency.
    writePlan(
        '2026-07-25-done-plan.md',
        '# Done Plan\n\n**Goal:** already finished\n\n- [ ] leftover\n<!-- awm-qa-complete -->\n',
        9_000,
    );
    // Newer, but a design doc: the `-design.md` suffix must beat recency.
    writePlan(
        '2026-07-26-thing-design.md',
        '# Thing Design\n\n**Goal:** design only\n\n- [ ] design item\n',
        9_000,
    );
    // Newer, but fully checked off: no open item means it is not active.
    writePlan(
        '2026-07-27-closed-plan.md',
        '# Closed Plan\n\n**Goal:** nothing open\n\n- [x] done item\n',
        9_000,
    );

    const hooksDir = path.join(workspace, 'awm-hooks');
    const installed = installHook(hooksDir);

    const context = parseContext(runHook(installed, { source: 'compact', cwd: project }));
    assert.match(context, /Project Constitution/);
    assert.match(context, /Ship verified work\./);
    assert.match(context, /Active plan: 2026-07-24-demo-plan\.md/);
    // The goal sits in a blockquote, as `writing-plans` emits it: an anchored
    // regex would fall through to the H1 and re-anchor on the wrong goal.
    assert.match(context, /Goal: prove recovery/);
    assert.match(context, /open item/);
    assert.doesNotMatch(context, /already finished/);
    assert.doesNotMatch(context, /design only/);
    assert.doesNotMatch(context, /nothing open/);

    // A plan whose own steps mention the marker is still active.
    const documenting = path.join(workspace, 'documenting');
    fs.mkdirSync(path.join(documenting, 'docs/plans'), { recursive: true });
    fs.writeFileSync(
        path.join(documenting, 'docs/plans/2026-07-24-marker-plan.md'),
        '# Marker Plan\n\n**Goal:** ship it\n\n- [ ] append the awm-qa-complete comment when done\n',
    );
    assert.match(
        parseContext(runHook(installed, { source: 'startup', cwd: documenting })),
        /Active plan: 2026-07-24-marker-plan\.md/,
    );

    // A redesign plan is a plan, not a design doc.
    const redesign = path.join(workspace, 'redesign');
    fs.mkdirSync(path.join(redesign, 'docs/plans'), { recursive: true });
    fs.writeFileSync(
        path.join(redesign, 'docs/plans/2026-07-24-redesign-checkout-plan.md'),
        '# Redesign Checkout\n\n**Goal:** ship checkout v2\n\n- [ ] step one\n',
    );
    assert.match(
        parseContext(runHook(installed, { source: 'clear', cwd: redesign })),
        /Active plan: 2026-07-24-redesign-checkout-plan\.md/,
    );

    // All four matcher events must re-anchor — not just the one under test.
    for (const source of ['startup', 'resume', 'clear', 'compact']) {
        const perEvent = parseContext(runHook(installed, { source, cwd: project }));
        assert.match(perEvent, /Project Constitution/, `${source} must deliver the constitution`);
        assert.match(perEvent, /Active plan: 2026-07-24-demo-plan\.md/, `${source} must re-anchor`);
    }

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

    // --- R3.1: ledger recovery and the compaction audit entry. ---
    // Nothing else on this branch puts an `awm` on PATH, so without this stub
    // both the ledger section and the audit write can be deleted wholesale
    // without a single assertion failing.
    const stubDir = path.join(workspace, 'stub-bin');
    fs.mkdirSync(stubDir, { recursive: true });
    const ledgerCalls = path.join(workspace, 'awm-calls.log');
    fs.writeFileSync(
        path.join(stubDir, 'awm'),
        '#!/usr/bin/env bash\n'
        + `printf '%s\\n' "$*" >> ${JSON.stringify(ledgerCalls)}\n`
        + 'if [ "$1" = "ledger" ] && [ "$2" = "list" ]; then\n'
        + '  echo "finding: splitBill returns Infinity"\n'
        + '  echo "finding: missing input validation"\n'
        + 'fi\n'
        + 'exit 0\n',
        { mode: 0o755 },
    );
    const withStub = { ...process.env, PATH: `${stubDir}${path.delimiter}${process.env.PATH}` };

    const compacted = spawnSync(installed, [], {
        input: JSON.stringify({ source: 'compact', cwd: project }),
        encoding: 'utf8',
        env: withStub,
    });
    const compactedContext = parseContext(compacted);
    assert.match(compactedContext, /Open ledger items:/);
    assert.match(compactedContext, /splitBill returns Infinity/);

    const calls = fs.readFileSync(ledgerCalls, 'utf8');
    assert.match(calls, /ledger list/, 'the hook must read open ledger items');
    assert.match(
        calls,
        /ledger add .*compaction-recovery/,
        'a compact event must leave the same audit entry the Claude hook writes',
    );

    // A non-compact event reads the ledger but must NOT write an audit entry.
    fs.writeFileSync(ledgerCalls, '');
    parseContext(spawnSync(installed, [], {
        input: JSON.stringify({ source: 'startup', cwd: project }),
        encoding: 'utf8',
        env: withStub,
    }));
    const startupCalls = fs.readFileSync(ledgerCalls, 'utf8');
    assert.match(startupCalls, /ledger list/);
    assert.doesNotMatch(startupCalls, /ledger add/, 'only a compaction boundary is audited');

    // --- An oversized project file must not swallow the context window. ---
    const huge = path.join(workspace, 'huge');
    fs.mkdirSync(path.join(huge, 'docs/plans'), { recursive: true });
    fs.writeFileSync(path.join(huge, 'CONSTITUTION.md'), `# Rules\n\n${'x'.repeat(2_000_000)}\n`);
    const hugeContext = parseContext(runHook(installed, { source: 'startup', cwd: huge }));
    assert.ok(
        hugeContext.length < 200_000,
        `an oversized CONSTITUTION.md must be truncated, got ${hugeContext.length} chars`,
    );
    assert.match(hugeContext, /truncated by AWM/);

    // --- A bare project still emits valid JSON with the AWM directive. ---
    const bare = path.join(workspace, 'bare');
    fs.mkdirSync(bare, { recursive: true });
    const bareContext = parseContext(runHook(installed, { source: 'startup', cwd: bare }));
    assert.match(bareContext, /AWM is active\./);
    assert.doesNotMatch(bareContext, /Re-anchor/);
    assert.doesNotMatch(bareContext, /Project Constitution/);

    // --- Hostile stdin must degrade, not crash. ---
    // `null`, `"text"` and `[]` are all VALID JSON, so parsing succeeds and the
    // result is dereferenced outside any guard unless the shape is checked. A
    // SessionStart hook that throws takes the whole session's context with it.
    for (const payload of ['not json', 'null', '"text"', '[1,2]', '', '{"cwd":123,"source":false}']) {
        const hostile = spawnSync(installed, [], { input: payload, encoding: 'utf8' });
        assert.equal(hostile.status, 0, `payload ${JSON.stringify(payload)}: ${hostile.stderr}`);
        assert.match(
            JSON.parse(hostile.stdout).hookSpecificOutput.additionalContext,
            /AWM is active\./,
            `payload ${JSON.stringify(payload)} must still deliver the directive`,
        );
    }

    // An unusable `cwd` falls back to the process's own directory rather than
    // scanning a bogus path. Spawned inside `bare` so the fallback is
    // observable — falling back into a real project would prove nothing.
    const badCwd = parseContext(runHook(
        installed,
        { source: 'startup', cwd: path.join(workspace, 'does-not-exist') },
        { cwd: bare },
    ));
    assert.match(badCwd, /AWM is active\./);
    assert.doesNotMatch(badCwd, /Re-anchor/);

    // A missing `source` is recorded as `startup`, not as an invented value.
    fs.rmSync(path.join(hooksDir, 'heartbeat.json'), { force: true });
    parseContext(runHook(installed, { cwd: bare }));
    assert.equal(
        JSON.parse(fs.readFileSync(path.join(hooksDir, 'heartbeat.json'), 'utf8')).event,
        'startup',
    );

    process.stdout.write('codex session hook: ok\n');
} finally {
    fs.rmSync(workspace, { recursive: true, force: true });
}
