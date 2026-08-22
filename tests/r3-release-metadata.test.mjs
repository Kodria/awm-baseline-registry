import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const readJson = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

// The R3 floor: the first published CLI able to consume, probe, and report the
// v2 sensor-pack contract. Raising it is a normal release decision; lowering it
// would hand a v2 pack to a CLI that cannot parse it.
const R3_CLI_FLOOR = '8.1.0';

const gte = (a, b) => {
    const parse = (v) => {
        const parts = String(v).split('.').map(Number);
        assert.equal(parts.length, 3, `not a semver triple: ${v}`);
        assert.ok(parts.every(Number.isInteger), `not a semver triple: ${v}`);
        return parts;
    };
    const [aMa, aMi, aPa] = parse(a);
    const [bMa, bMi, bPa] = parse(b);
    if (aMa !== bMa) return aMa > bMa;
    if (aMi !== bMi) return aMi > bMi;
    return aPa >= bPa;
};

// Deliberately asserts a FLOOR, not an exact version. The previous form pinned
// `bundles/dev` to the literal `3.0.0`, which protected nothing — every bundle
// bump is a legitimate release, and `catalog.json` ↔ `bundle.json` agreement is
// already enforced for all four bundles by `validateBundleVersions` in
// scripts/validate-portability.mjs. All that pin did was fail on every release
// that had nothing to do with the R3 contract, which trains people to edit the
// assertion instead of reading it. What is worth guarding is the direction:
// the declared CLI floor must never regress below the contract it belongs to.
test('the registry never declares a CLI floor below the R3 contract', () => {
    const registry = readJson('awm-registry.json');

    assert.equal(typeof registry.minCliVersion, 'string');
    assert.ok(
        gte(registry.minCliVersion, R3_CLI_FLOOR),
        `minCliVersion ${registry.minCliVersion} is below the R3 floor ${R3_CLI_FLOOR}: an older CLI cannot consume the v2 pack contract`,
    );
});

function assertCurrentCliCompatibilityMetadata(registry, changelog) {
    assert.equal(registry.minCliVersion, '8.5.0');
    assert.match(changelog, /^## dev 3\.4\.0 — 2026-08-22$/m);
    const currentEntry = changelog.split(/^## dev 3\.4\.0 — 2026-08-22$/m)[1]
        .split(/^## /m)[0];
    assert.match(currentEntry, /`agentic-workflow-manager` `8\.5\.0`/);
    assert.match(currentEntry, /evidence capture/i);
}

function assertCliCompatibilityReleaseGate(workflow) {
    const verificationStart = workflow.indexOf('- name: Verify registry before tagging');
    const tagStart = workflow.indexOf('- name: Compute and push next tag');
    assert.ok(verificationStart >= 0 && tagStart > verificationStart,
        'auto-tag must verify the registry before creating its delivery tag');
    const verification = workflow.slice(verificationStart, tagStart);
    assert.match(verification, /^\s*node tests\/r3-release-metadata\.test\.mjs\s*$/m,
        'the release-producing verification step must enforce the CLI compatibility boundary');
}

// Cycle evidence capture first ships in CLI 8.5.0. This exact current boundary
// remains coordinated with the historical conclusive-execution record above:
// an older CLI cannot interpret every published registry guarantee, so the
// registry must not silently advertise this content to it.
test('records the published CLI boundary for conclusive execution and cycle evidence capture', () => {
    assertCurrentCliCompatibilityMetadata(readJson('awm-registry.json'), read('CHANGELOG.md'));
});

test('RED mutation: downgrading the current CLI boundary is rejected', () => {
    const downgraded = { ...readJson('awm-registry.json'), minCliVersion: '8.1.4' };
    assert.throws(
        () => assertCurrentCliCompatibilityMetadata(downgraded, read('CHANGELOG.md')),
        /8\.5\.0/,
    );
});

test('auto-tag enforces the conclusive CLI boundary before publishing a registry tag', () => {
    assertCliCompatibilityReleaseGate(read('.github/workflows/auto-tag.yml'));
});

test('RED mutation: removing the conclusive CLI gate blocks registry publication', () => {
    const workflow = read('.github/workflows/auto-tag.yml');
    assert.throws(
        () => assertCliCompatibilityReleaseGate(workflow.replace(/^\s*node tests\/r3-release-metadata\.test\.mjs\s*\n/m, '')),
        /CLI compatibility boundary/,
    );
});

// This one IS an exact assertion on purpose: it guards a historical record.
// The R3 entry describes a release that already happened, so it must never
// change — unlike a version number, which must.
test('records the R3 breaking release, migration, retro, and compatibility boundary', () => {
    const changelog = read('CHANGELOG.md');

    assert.match(changelog, /^## dev 3\.0\.0 — 2026-08-15$/m);
    assert.match(changelog, /`agentic-workflow-manager` `8\.1\.0`/);
    assert.match(changelog, /pack\.json.*v2/is);
    assert.match(changelog, /migration/i);
    assert.match(changelog, /retro/i);
    assert.match(changelog, /compatib/i);
});
