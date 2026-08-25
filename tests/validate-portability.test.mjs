// Self-test for scripts/validate-portability.mjs.
//
// The validator is the only gate standing between a provider-coupled edit and
// a published registry tag. A gate nobody tests is a gate that can silently
// stop failing: an over-narrow regex or a walk that misses a directory still
// prints "portable: 37 skills validated" and CI stays green.
//
// Each case below MUTATES a throwaway copy of the repo and asserts the
// validator rejects it. The real checkout is never touched.

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'awm-validator-'));
const copy = path.join(workspace, 'registry');

function runValidator() {
    return spawnSync(process.execPath, [path.join(copy, 'scripts/validate-portability.mjs')], {
        encoding: 'utf8',
    });
}

function readJson(relativePath) {
    return JSON.parse(fs.readFileSync(path.join(copy, relativePath), 'utf8'));
}

function writeJson(relativePath, value) {
    fs.writeFileSync(path.join(copy, relativePath), `${JSON.stringify(value, null, 2)}\n`);
}

// Every mutation is applied to a pristine copy and reverted afterwards, so a
// failure in one case cannot mask or cause another.
function mutation(name, expected, apply) {
    return { name, expected, apply };
}

const mutations = [
    mutation(
        'provider-coupled tool name in a skill',
        /provider-coupled tool name/,
        () => {
            const file = path.join(copy, 'skills/executing-plans/SKILL.md');
            fs.appendFileSync(file, '\nDispatch it with the Task tool.\n');
            return () => fs.truncateSync(file, fs.statSync(file).size - 33);
        },
    ),
    mutation(
        'TodoWrite reintroduced in a skill',
        /TodoWrite runtime API/,
        () => {
            const file = path.join(copy, 'skills/executing-plans/SKILL.md');
            const before = fs.readFileSync(file);
            fs.appendFileSync(file, '\nTrack it with TodoWrite.\n');
            return () => fs.writeFileSync(file, before);
        },
    ),
    // The gate used to walk skills/ only, so the orchestrator profile and the
    // provider mapping tables could carry anything at all.
    mutation(
        'coupled vocabulary in agents/',
        /agents\/development-process\.md: provider-coupled tool name/,
        () => {
            const file = path.join(copy, 'agents/development-process.md');
            const before = fs.readFileSync(file);
            fs.appendFileSync(file, '\nUse the Read tool first.\n');
            return () => fs.writeFileSync(file, before);
        },
    ),
    mutation(
        'coupled vocabulary in references/',
        /references\/codex-tools\.md: superpowers plugin namespace/,
        () => {
            const file = path.join(copy, 'references/codex-tools.md');
            const before = fs.readFileSync(file);
            fs.appendFileSync(file, '\nSee superpowers:executing-plans.\n');
            return () => fs.writeFileSync(file, before);
        },
    ),
    // isFile() is false for a symlink, so an unguarded walk skips it entirely.
    mutation(
        'symlinked runtime markdown bypassing the scan',
        /symbolic links are not allowed/,
        () => {
            const target = path.join(workspace, 'evil.md');
            const link = path.join(copy, 'skills/using-awm/evil-runtime.md');
            fs.writeFileSync(target, 'Track it with TodoWrite and the Skill tool.\n');
            fs.symlinkSync(target, link);
            return () => fs.rmSync(link, { force: true });
        },
    ),
    mutation(
        'provider fork as a sibling skill directory',
        /provider-specific skill fork/,
        () => {
            const fork = path.join(copy, 'skills/using-awm-codex');
            fs.mkdirSync(fork);
            fs.writeFileSync(path.join(fork, 'SKILL.md'), '---\nname: using-awm-codex\ndescription: fork\n---\n');
            // Hold the directory count steady, the way a real fork would.
            const retired = path.join(copy, 'skills/mermaid-diagrams');
            const stash = path.join(workspace, 'mermaid-diagrams');
            fs.renameSync(retired, stash);
            return () => {
                fs.rmSync(fork, { recursive: true, force: true });
                fs.renameSync(stash, retired);
            };
        },
    ),
    mutation(
        'provider fork hidden inside a skill directory',
        /provider-specific SKILL fork/,
        () => {
            const file = path.join(copy, 'skills/using-awm/SKILL.codex.md');
            fs.writeFileSync(file, '---\nname: using-awm\ndescription: fork\n---\n');
            return () => fs.rmSync(file, { force: true });
        },
    ),
    mutation(
        'catalog and bundle versions diverging',
        /!= catalog\.json/,
        () => {
            const before = readJson('bundles/dev/bundle.json');
            writeJson('bundles/dev/bundle.json', { ...before, version: '9.9.9' });
            return () => writeJson('bundles/dev/bundle.json', before);
        },
    ),
    mutation(
        'bundle dropped from the catalog',
        /bundles\/frontend: not listed in catalog\.json/,
        () => {
            const before = readJson('catalog.json');
            writeJson('catalog.json', {
                ...before,
                bundles: before.bundles.filter((entry) => entry.name !== 'frontend'),
            });
            return () => writeJson('catalog.json', before);
        },
    ),
    mutation(
        'bundle listing a skill that does not exist',
        /has no skills\/ directory/,
        () => {
            const before = readJson('bundles/dev/bundle.json');
            writeJson('bundles/dev/bundle.json', { ...before, skills: [...before.skills, 'does-not-exist'] });
            return () => writeJson('bundles/dev/bundle.json', before);
        },
    ),
    mutation(
        'lifecycle phase dropped from development-process',
        /lifecycle invariant lost "harness-retro"/,
        () => {
            const file = path.join(copy, 'skills/development-process/SKILL.md');
            const before = fs.readFileSync(file, 'utf8');
            fs.writeFileSync(file, before.replaceAll('harness-retro', 'some-other-phase'));
            return () => fs.writeFileSync(file, before);
        },
    ),
    mutation(
        'shared global skill root removed from a discovery loop',
        /does not search the shared global skill root/,
        () => {
            const file = path.join(copy, 'skills/ui-design/SKILL.md');
            const before = fs.readFileSync(file, 'utf8');
            fs.writeFileSync(file, before.replaceAll('$HOME/.agents/skills/', '$HOME/.claude/skills/'));
            return () => fs.writeFileSync(file, before);
        },
    ),
    mutation(
        'shared global skill root removed from the lazy frontend handoff',
        /references\/frontend-handoff\.md: does not search the shared global skill root/,
        () => {
            const file = path.join(copy, 'skills/development-process/references/frontend-handoff.md');
            const before = fs.readFileSync(file, 'utf8');
            fs.writeFileSync(file, before.replaceAll('$HOME/.agents/skills/', '$HOME/.claude/skills/'));
            return () => fs.writeFileSync(file, before);
        },
    ),
    mutation(
        'a provider dropped from the constitution delivery contract',
        /missing provider delivery contract "OpenCode: /,
        () => {
            const file = path.join(copy, 'skills/project-constitution/SKILL.md');
            const before = fs.readFileSync(file, 'utf8');
            fs.writeFileSync(file, before.replaceAll('OpenCode', 'SomeAgent'));
            return () => fs.writeFileSync(file, before);
        },
    ),
    mutation(
        'the Codex hook losing its executable bit',
        /is not executable/,
        () => {
            const file = path.join(copy, 'hooks/codex-session-start');
            fs.chmodSync(file, 0o644);
            return () => fs.chmodSync(file, 0o755);
        },
    ),
    mutation(
        'the Codex hook deleted entirely',
        /missing Codex session recovery adapter/,
        () => {
            const file = path.join(copy, 'hooks/codex-session-start');
            const before = fs.readFileSync(file);
            fs.rmSync(file);
            return () => fs.writeFileSync(file, before, { mode: 0o755 });
        },
    ),
    // Provenance is the field that survives `awm export`, where the repository
    // LICENSE does not travel. A skill added without it ships terms-less.
    mutation(
        'a skill shipped without its license field',
        /skills\/using-awm\/SKILL\.md: license must be "Apache-2\.0" \(declared: missing\)/,
        () => {
            const file = path.join(copy, 'skills/using-awm/SKILL.md');
            const before = fs.readFileSync(file, 'utf8');
            fs.writeFileSync(file, before.replace(/^license: .*\n/m, ''));
            return () => fs.writeFileSync(file, before);
        },
    ),
    mutation(
        'a skill relicensed away from the registry license',
        /skills\/writing-plans\/SKILL\.md: license must be "Apache-2\.0" \(declared: "MIT"\)/,
        () => {
            const file = path.join(copy, 'skills/writing-plans/SKILL.md');
            const before = fs.readFileSync(file, 'utf8');
            fs.writeFileSync(file, before.replace(/^license: .*$/m, 'license: MIT'));
            return () => fs.writeFileSync(file, before);
        },
    ),
];

try {
    fs.cpSync(repoRoot, copy, {
        recursive: true,
        dereference: false,
        filter: (source) => !source.includes(`${path.sep}.git${path.sep}`) && !source.endsWith(`${path.sep}.git`),
    });

    // A gate that rejects everything proves nothing: establish green first.
    const baseline = runValidator();
    assert.equal(baseline.status, 0, `pristine copy must pass:\n${baseline.stderr}`);
    assert.match(baseline.stdout, /portable: \d+ skills validated/);

    for (const { name, expected, apply } of mutations) {
        const revert = apply();
        try {
            const result = runValidator();
            assert.equal(result.status, 1, `MUTANT SURVIVED — ${name}\n${result.stdout}`);
            assert.match(result.stderr, expected, `wrong error for ${name}:\n${result.stderr}`);
        } finally {
            revert();
        }

        const restored = runValidator();
        assert.equal(restored.status, 0, `revert failed after ${name}:\n${restored.stderr}`);
    }

    process.stdout.write(`portability validator: ${mutations.length} mutations caught\n`);
} finally {
    fs.rmSync(workspace, { recursive: true, force: true });
}
