import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');

const EXPECTED_MIN_CLI_VERSION = '8.5.0';
const EXPECTED_UPGRADE_COMMAND = `npm i -g "agentic-workflow-manager@>=${EXPECTED_MIN_CLI_VERSION}"`;

function assertCanonicalActivePlanResolver(skill) {
  const resolverStart = skill.indexOf('PLANS_DIR="$PWD/docs/plans"');
  const capture = skill.indexOf('awm evidence capture --plan "$active_plan"');
  assert.ok(resolverStart >= 0 && capture > resolverStart,
    'capture must use the canonical resolver before invoking the CLI');
  const resolver = skill.slice(resolverStart, capture);

  assert.match(resolver, /while IFS= read -r plan_file;/,
    'the resolver must inspect candidates in deterministic modification order');
  assert.match(resolver, /case "\$\(basename "\$plan_file"\)" in \*-design\.md\) continue;; esac/,
    'the resolver must not select a design document');
  // The plan a retro closes is, by this skill's own precondition, already
  // qa-complete with every checkbox done — NOT "open work". A resolver that
  // requires open checkboxes (the SessionStart re-anchor criterion, for what
  // to work on NEXT) silently picks a different, unrelated plan whenever more
  // than one exists in docs/plans/. See docs/harness-retros.md 2026-08-24.
  assert.match(resolver, /grep -qE '<!--\[\[:space:\]\]\*awm-qa-complete' "\$plan_file" 2>\/dev\/null \|\| continue/,
    'the resolver must require awm-qa-complete before considering a plan');
  assert.match(resolver, /grep -qE '<!--\[\[:space:\]\]\*awm-retro-complete' "\$plan_file" 2>\/dev\/null && continue/,
    'the resolver must skip a plan that already has awm-retro-complete');
  assert.match(resolver, /done < <\(ls -t "\$PLANS_DIR"\/\*\.md 2>\/dev\/null \|\| true\)/,
    'the resolver must consider newer plans before older plans');
}

function assertCycleEvidenceCapture(skill, registry) {
  assert.equal(registry.minCliVersion, EXPECTED_MIN_CLI_VERSION,
    'the registry must require the first published CLI that supports evidence capture');
  assert.doesNotMatch(skill, /npm i -g agentic-workflow-manager@>=8\.5\.0/,
    'retro must not present an unquoted upgrade package spec');
  assert.match(skill, new RegExp(EXPECTED_UPGRADE_COMMAND.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    'retro must give the exact compatible-CLI upgrade command');
  assert.match(skill, /installed_cli_version="\$\(awm --version\)"/,
    'retro must read the installed CLI version');
  assert.match(skill, /min_cli_version=.*awm-registry\.json/,
    'retro must read the minimum CLI version from the registry');
  assert.match(skill, /process\.exit\(meets \? 0 : 1\)/,
    'retro must execute a semver comparison that rejects an old CLI');
  assert.match(skill, /printf 'npm i -g %q\\n' "agentic-workflow-manager@>=\$\{min_cli_version\}"/,
    'the executable upgrade command must quote the package spec');

  const versionCheck = skill.indexOf('awm --version');
  const capture = skill.indexOf('awm evidence capture --plan "$active_plan"');
  const archive = skill.lastIndexOf('awm ledger archive');

  assert.ok(versionCheck >= 0, 'retro must check the installed CLI version before archiving');
  assert.ok(capture >= 0, 'retro must capture cycle evidence for the active plan');
  assert.ok(versionCheck < capture, 'compatibility must be checked before evidence capture');
  assert.ok(capture < archive, 'evidence capture must happen before the ledger is archived');
  assert.match(skill, /require exit 0/i, 'retro must fail loudly when evidence capture fails');
  // The capture call may legitimately be nested inside a conditional (e.g. a
  // journal-availability check), so the closing brace can carry leading
  // indentation — match structure, not exact column position.
  assert.match(skill, /awm evidence capture --plan "\$active_plan" \|\| \{[\s\S]*?exit 1;?[\s\S]*?\n\s*\}/,
    'a failed capture must exit before the archive step is reachable');
  assert.match(skill, /must work in unattended mode|modo desatendido[\s\S]*?evidence capture|mandatory in modo desatendido/i,
    'evidence capture must remain mandatory in unattended mode');
  assertCanonicalActivePlanResolver(skill);
}

test('harness retro captures compatible cycle evidence before archive', () => {
  assertCycleEvidenceCapture(
    read('skills/harness-retro/SKILL.md'),
    JSON.parse(read('awm-registry.json')),
  );
});

test('RED mutation: archive without preceding capture is rejected', () => {
  const skill = read('skills/harness-retro/SKILL.md').replace(
    'awm evidence capture --plan "$active_plan"',
    'awm evidence skipped --plan "$active_plan"',
  );
  assert.throws(
    () => assertCycleEvidenceCapture(skill, { minCliVersion: EXPECTED_MIN_CLI_VERSION }),
    /must capture cycle evidence/i,
  );
});

test('RED mutation: capture failure cannot fall through to archive', () => {
  const weakened = read('skills/harness-retro/SKILL.md').replace(
    /awm evidence capture --plan "\$active_plan" \|\| \{[\s\S]*?\n\s*\}/,
    'awm evidence capture --plan "$active_plan"',
  );
  assert.throws(
    () => assertCycleEvidenceCapture(weakened, JSON.parse(read('awm-registry.json'))),
    /exit before the archive step is reachable/i,
  );
});

test('RED mutation: an unquoted displayed upgrade command is rejected', () => {
  const weakened = read('skills/harness-retro/SKILL.md').replace(
    EXPECTED_UPGRADE_COMMAND,
    'npm i -g agentic-workflow-manager@>=8.5.0',
  );
  assert.throws(
    () => assertCycleEvidenceCapture(weakened, JSON.parse(read('awm-registry.json'))),
    /unquoted upgrade package spec/i,
  );
});

test('RED mutation: a plan without awm-qa-complete cannot become the active capture target', () => {
  const weakened = read('skills/harness-retro/SKILL.md').replace(
    "grep -qE '<!--[[:space:]]*awm-qa-complete' \"$plan_file\" 2>/dev/null || continue",
    '# any plan qualifies, qa-complete not required',
  );
  assert.throws(() => assertCanonicalActivePlanResolver(weakened), /require awm-qa-complete/i);
});

test('RED mutation: a plan already carrying awm-retro-complete cannot be re-selected', () => {
  const weakened = read('skills/harness-retro/SKILL.md').replace(
    "grep -qE '<!--[[:space:]]*awm-retro-complete' \"$plan_file\" 2>/dev/null && continue",
    '# retro-complete plans are not filtered',
  );
  assert.throws(() => assertCanonicalActivePlanResolver(weakened), /skip a plan that already has awm-retro-complete/i);
});

test('RED mutation: an older plan cannot be preferred over a newer active plan', () => {
  const weakened = read('skills/harness-retro/SKILL.md').replace(
    'done < <(ls -t "$PLANS_DIR"/*.md 2>/dev/null || true)',
    'done < <(ls "$PLANS_DIR"/*.md 2>/dev/null || true)',
  );
  assert.throws(() => assertCanonicalActivePlanResolver(weakened), /newer plans before older plans/i);
});

test('validation and release gates execute the cycle evidence capture contract', () => {
  for (const workflow of ['validate.yml', 'auto-tag.yml']) {
    assert.match(read(`.github/workflows/${workflow}`), /node tests\/cycle-evidence-capture-contract\.test\.mjs/,
      `${workflow} must run the cycle evidence capture contract`);
  }
});
