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
  assert.ok(resolver.includes("grep -q '^- \\[ \\]' \"$plan_file\" 2>/dev/null || continue"),
    'the resolver must require open plan work');
  assert.match(resolver, /grep -qE '<!--\[\[:space:\]\]\*awm-\(plan\|qa\)-complete'/,
    'the resolver must skip stale completed plans');
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
  assert.match(skill, /awm evidence capture --plan "\$active_plan" \|\| \{[\s\S]*?exit 1;?[\s\S]*?\}/,
    'a failed capture must exit before the archive step is reachable');
  assert.match(skill, /must work in unattended mode|modo desatendido[\s\S]*?evidence capture/i,
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
    /awm evidence capture --plan "\$active_plan" \|\| \{[\s\S]*?\n\}/,
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

test('RED mutation: a stale completed plan cannot become the active capture target', () => {
  const weakened = read('skills/harness-retro/SKILL.md').replace(
    "if grep -qE '<!--[[:space:]]*awm-(plan|qa)-complete' \"$plan_file\" 2>/dev/null; then continue; fi",
    '# stale completed plans are not filtered',
  );
  assert.throws(() => assertCanonicalActivePlanResolver(weakened), /skip stale completed plans/i);
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
