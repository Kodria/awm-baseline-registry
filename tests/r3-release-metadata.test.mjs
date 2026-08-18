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
