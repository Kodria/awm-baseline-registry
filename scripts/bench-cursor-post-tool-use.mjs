#!/usr/bin/env node
// Latency evidence for the Cursor postToolUse hook's hot path (R16.2 input).
//
// post-tool-use runs on EVERY tool call, so its no-marker path must stay
// cheap. This installs the three Cursor hooks into a throwaway directory (no
// state/), runs post-tool-use 100 times the way Cursor would, and prints
// {"runs","p50Ms","p95Ms","budgetMs","withinBudget"} as JSON.
//
// Evidence only, never a CI gate: it always exits 0. A p95 over budget is
// recorded for the Plan B R16.2 decision, not fixed here with a shell fast
// path (that would break Windows parity).

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const RUNS = 100;
const BUDGET_MS = 50;
const INSTALLED_NAMES = {
    'cursor-session-start': 'session-start',
    'cursor-pre-compact': 'pre-compact',
    'cursor-post-tool-use': 'post-tool-use',
};

const hooksSource = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'hooks');
const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'awm-cursor-bench-'));

function percentile(sorted, q) {
    return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(q * sorted.length) - 1))];
}

const round = (ms) => Math.round(ms * 100) / 100;

try {
    const dir = path.join(workspace, 'install');
    fs.mkdirSync(dir);
    for (const [source, name] of Object.entries(INSTALLED_NAMES)) {
        const to = path.join(dir, name);
        fs.copyFileSync(path.join(hooksSource, source), to);
        fs.chmodSync(to, 0o755);
    }
    const installed = path.join(dir, 'post-tool-use');
    // HOME/AWM_HOME point into the workspace: the bench never touches the real ~/.awm.
    const env = { ...process.env, HOME: workspace, AWM_HOME: workspace };

    const samples = [];
    for (let run = 0; run < RUNS; run += 1) {
        const started = process.hrtime.bigint();
        spawnSync(process.execPath, [installed], { input: '{}', env, cwd: workspace });
        const elapsed = Number(process.hrtime.bigint() - started) / 1e6;
        samples.push(elapsed);
    }
    samples.sort((a, b) => a - b);
    const p95Ms = round(percentile(samples, 0.95));
    process.stdout.write(`${JSON.stringify({
        runs: RUNS,
        p50Ms: round(percentile(samples, 0.5)),
        p95Ms,
        budgetMs: BUDGET_MS,
        withinBudget: p95Ms <= BUDGET_MS,
    })}\n`);
} finally {
    fs.rmSync(workspace, { recursive: true, force: true });
}
