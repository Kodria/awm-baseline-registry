#!/usr/bin/env node
/**
 * Context budget sensor — keeps feedforward context from growing without anyone deciding to.
 *
 * Files like AGENTS.md and CONSTITUTION.md are injected into EVERY agent session before a
 * single line of code is read, so their size is a per-session tax paid forever. They grow
 * because curing a lesson is an append, and pruning one is a judgement call nobody is forced
 * to make. Prose telling the agent to "merge and prune" does not hold: measured on a real
 * repo, AGENTS.md went 73KB -> 141KB across 45 revisions and never once shrank, while a rule
 * saying "never append raw" was already in force.
 *
 * So this is a gate, not a reminder. It does NOT forbid growth — it makes growth deliberate:
 *
 *   - First run pins the current total as the budget in `.awm/context-budget.json`.
 *   - Any later run over that budget reports a finding, which fails `awm sensors run`.
 *   - The only way to pass is to prune back under, or raise `maxBytes` in a committed diff
 *     that a human reviews.
 *
 * That is the ratchet: context can still grow, but never silently.
 *
 * Portable on purpose (Node, no deps, CommonJS): the AWM CLI is an npm package, so Node is
 * always present, while a POSIX shell one-liner would not run on Windows.
 *
 * Output contract: prints NOTHING when within budget (the `generic` formatter turns any
 * output into a finding, so silence == pass) and always exits 0 — the verdict travels in the
 * findings, not the exit code.
 */

const fs = require('fs');
const path = require('path');

/** Injected into every session by the AWM session hook / context contract. */
const DEFAULT_FILES = ['AGENTS.md', 'CONSTITUTION.md', 'CLAUDE.md'];

const CONFIG = path.join('.awm', 'context-budget.json');

/** Rough but stable: ~4 bytes per token for English/Spanish prose. Only used for reporting. */
function tokens(bytes) {
    return Math.round(bytes / 4 / 1000);
}

function sizeOf(files) {
    let total = 0;
    const present = [];
    for (const f of files) {
        let s;
        try {
            s = fs.statSync(f);
        } catch {
            continue;   // a repo need not have all three
        }
        if (!s.isFile()) continue;
        total += s.size;
        present.push({ file: f, bytes: s.size });
    }
    return { total, present };
}

function readConfig() {
    try {
        const raw = JSON.parse(fs.readFileSync(CONFIG, 'utf-8'));
        // A malformed or partial config must not silently disable the gate.
        if (typeof raw.maxBytes !== 'number' || !Number.isFinite(raw.maxBytes)) return null;
        return {
            files: Array.isArray(raw.files) && raw.files.length ? raw.files : DEFAULT_FILES,
            maxBytes: raw.maxBytes,
        };
    } catch {
        return null;
    }
}

function pin(files, total) {
    fs.mkdirSync('.awm', { recursive: true });
    const config = {
        // Raising this is the sanctioned escape hatch — but it has to happen in a diff someone
        // reviews, which is the whole point. Lower it after a prune to lock the gain in.
        _comment: 'Context budget for files injected into every agent session. Raising maxBytes '
            + 'is allowed but must be a deliberate, reviewed change — see harness-retro step 5.',
        files,
        maxBytes: total,
    };
    fs.writeFileSync(CONFIG, JSON.stringify(config, null, 2) + '\n', 'utf-8');
}

function main() {
    const config = readConfig();

    if (!config) {
        // First run (or unreadable config): pin the status quo and pass. Pinning rather than
        // failing means adopting the sensor never blocks a repo that is already large — it
        // only stops it getting larger. The written file shows up in `git status`, so the
        // pin is visible in the commit that adopts it.
        const { total } = sizeOf(DEFAULT_FILES);
        pin(DEFAULT_FILES, total);
        return;
    }

    const { total, present } = sizeOf(config.files);
    if (total <= config.maxBytes) return;

    const over = total - config.maxBytes;
    const breakdown = present.map(p => `${p.file} ${(p.bytes / 1024).toFixed(0)}KB`).join(', ');

    process.stdout.write(
        `context budget exceeded: ${(total / 1024).toFixed(0)}KB vs budget `
        + `${(config.maxBytes / 1024).toFixed(0)}KB (over by ${(over / 1024).toFixed(0)}KB). `
        + `Breakdown: ${breakdown}. These files are injected into EVERY session — that is `
        + `~${tokens(total)}k tokens spent before any code is read. `
        + `Fix by pruning (harness-retro step 5: merge-and-prune, drop entries that no longer `
        + `apply) or, if the growth is genuinely warranted, raise "maxBytes" in ${CONFIG} so the `
        + `decision is reviewed. Do NOT silence this with \`awm sensors baseline\`: baseline `
        + `fingerprints mask digits, so one baseline suppresses this finding at every future `
        + `size and the budget stops meaning anything.\n`,
    );
}

main();
