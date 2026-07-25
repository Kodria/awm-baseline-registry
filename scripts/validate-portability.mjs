#!/usr/bin/env node

import { lstat, readdir, readFile, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const skillsRoot = path.join(repoRoot, 'skills');
const allowlistPath = path.join(repoRoot, 'tests', 'portability-allowlist.json');
const expectedAllowlistEntries = [
  {
    path: 'skills/systematic-debugging/CREATION-LOG.md',
    reason: 'historical provenance, not runtime instructions',
  },
  {
    path: 'skills/writing-skills/anthropic-best-practices.md',
    reason: 'upstream provider documentation retained as a named reference',
  },
];
const requiredDevelopmentProcessConcepts = [
  'name: development-process',
  'description:',
  'Invoke the `development-process` skill.',
  'You do NOT write code directly.',
  'NEVER invoke a downstream skill without user approval',
];
const requiredCodexCapabilities = [
  'spawn_agent',
  'send_message',
  'followup_task',
  'wait_agent',
  'interrupt_agent',
  'list_agents',
  'update_plan',
  'Request user approval or input',
];
const requiredUsingAwmConcepts = [
  'Use the active platform’s native skill-loading mechanism',
  'read a visible `SKILL.md`',
  'create or update a task plan',
  'dispatch, steer, wait for, or stop a subagent',
  'request user approval',
  'inspect files, read files, or edit files',
  'run shell commands',
];
// Runtime instructions must name capabilities, never one provider's tool
// surface. Each pattern is a vendor API a non-Claude runtime cannot honour.
const prohibitedRuntimeVocabulary = [
  { label: 'provider-coupled Skill tool reference', pattern: /\bthe `?Skill`? tool\b/i },
  { label: 'provider-coupled Read tool reference', pattern: /\bthe `?Read`? tool\b/i },
  { label: 'TodoWrite runtime API', pattern: /\bTodoWrite\b/ },
  { label: 'AskUserQuestion runtime API', pattern: /\bAskUserQuestion\b/ },
  { label: 'Claude Task tool call', pattern: /\bTask\(\s*["'`]/ },
  { label: 'superpowers plugin namespace', pattern: /\bsuperpowers:/ },
];
// `CONSTITUTION.md` reaches an agent through a different channel per provider;
// the skill that authors it must name all three, or a provider silently loses it.
const requiredConstitutionDeliveryConcepts = [
  'Claude Code',
  'OpenCode',
  'Codex',
  'AGENTS.md',
  'CONSTITUTION.md',
];
// The Codex SessionStart adapter is what `awm init --agent codex` installs; the
// CLI reads the heartbeat it writes to decide whether the hook is trusted.
const requiredCodexHookConcepts = [
  'startup',
  'resume',
  'clear',
  'compact',
  'CONSTITUTION.md',
  'docs/plans',
  'awm ledger',
  'heartbeat.json',
  'additionalContext',
];
// Every skill that resolves another skill on disk must search the shared global
// root too — Claude-only roots make the lookup fail under OpenCode and Codex.
const skillDiscoveryFiles = [
  'skills/development-process/SKILL.md',
  'skills/product-process/SKILL.md',
  'skills/ui-design/SKILL.md',
  'skills/ui-ux-pro-max/SKILL.md',
];
// The port must not quietly drop a lifecycle phase or the interactive gate.
const requiredDevelopmentProcessLifecycle = [
  'brainstorming',
  'writing-plans',
  'subagent-driven-development',
  'post-implementation-qa',
  'harness-retro',
  'finishing-a-development-branch',
  'Never invoke the next skill without user confirmation.',
];
// Shared global root first (OpenCode/Codex), then Claude's roots — every
// skill-discovery loop in the registry searches the same four locations.
const requiredSkillLocations = [
  '"$HOME/.agents/skills/',
  '".agents/skills/',
  '"$HOME/.claude/skills/',
  '".claude/skills/',
];

function parseFrontmatter(source, skillPath) {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const errors = [];

  if (lines[0] !== '---') {
    return { errors: [`${skillPath}: missing opening frontmatter delimiter`] };
  }

  const closingIndex = lines.findIndex((line, index) => index > 0 && line === '---');
  if (closingIndex === -1) {
    return { errors: [`${skillPath}: missing closing frontmatter delimiter`] };
  }

  const values = new Map();
  let activeBlockKey;
  let activeBlockLines = [];

  const flushBlock = () => {
    if (!activeBlockKey) return;
    values.set(activeBlockKey, activeBlockLines.join('\n').trim());
    activeBlockKey = undefined;
    activeBlockLines = [];
  };

  for (const line of lines.slice(1, closingIndex)) {
    if (line.trim() === '' || line.trimStart().startsWith('#')) continue;

    if (/^\s/.test(line)) {
      if (activeBlockKey) {
        activeBlockLines.push(line.trim());
      } else if (values.size === 0) {
        errors.push(`${skillPath}: invalid frontmatter entry ${JSON.stringify(line)}`);
      }
      continue;
    }

    flushBlock();
    const match = line.match(/^([A-Za-z][A-Za-z0-9_-]*):(?:\s+(.*))?$/);
    if (!match) {
      errors.push(`${skillPath}: invalid frontmatter entry ${JSON.stringify(line)}`);
      continue;
    }

    const [, key, rawValue = ''] = match;
    if (values.has(key)) {
      errors.push(`${skillPath}: duplicate frontmatter key ${key}`);
      continue;
    }

    const value = rawValue.trim();
    if (/^[>|][+-]?$/.test(value)) {
      activeBlockKey = key;
      continue;
    }
    values.set(key, value);
  }
  flushBlock();

  return { errors, values };
}

async function immediateSkillDirectories() {
  const entries = await readdir(skillsRoot, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
}

async function loadAllowlist(errors) {
  let entries;
  try {
    entries = JSON.parse(await readFile(allowlistPath, 'utf8'));
  } catch (error) {
    errors.push(`tests/portability-allowlist.json: ${error.message}`);
    return new Set();
  }

  if (!Array.isArray(entries)) {
    errors.push('tests/portability-allowlist.json: expected an array');
    return new Set();
  }

  const expectedReasons = new Map(expectedAllowlistEntries.map((entry) => [entry.path, entry.reason]));
  const actualReasons = new Map();
  for (const entry of entries) {
    if (!entry || typeof entry.path !== 'string' || typeof entry.reason !== 'string') {
      errors.push('tests/portability-allowlist.json: entries require string path and reason');
      continue;
    }
    if (actualReasons.has(entry.path)) {
      errors.push(`tests/portability-allowlist.json: duplicate path ${entry.path}`);
      continue;
    }
    actualReasons.set(entry.path, entry.reason);
  }

  for (const { path: allowedPath, reason } of expectedAllowlistEntries) {
    if (actualReasons.get(allowedPath) !== reason) {
      errors.push(`tests/portability-allowlist.json: missing exact entry ${allowedPath}`);
    }
  }
  for (const [actualPath, actualReason] of actualReasons) {
    if (expectedReasons.get(actualPath) !== actualReason) {
      errors.push(`tests/portability-allowlist.json: unexpected entry ${actualPath}`);
    }
  }

  return new Set(expectedAllowlistEntries
    .filter(({ path: allowedPath, reason }) => actualReasons.get(allowedPath) === reason)
    .map(({ path: allowedPath }) => allowedPath));
}

async function validateAllowlistedFiles(allowlist, errors) {
  const resolvedRepoRoot = await realpath(repoRoot);
  const resolvedRepoPrefix = `${resolvedRepoRoot}${path.sep}`;

  for (const allowedPath of allowlist) {
    const allowedFile = path.resolve(repoRoot, allowedPath);
    if (!allowedFile.startsWith(`${repoRoot}${path.sep}`)) {
      errors.push(`tests/portability-allowlist.json: path escapes repository ${allowedPath}`);
      continue;
    }

    try {
      const details = await lstat(allowedFile);
      if (details.isSymbolicLink()) {
        errors.push(`tests/portability-allowlist.json: symbolic links are not allowed ${allowedPath}`);
        continue;
      }
      if (!details.isFile()) {
        errors.push(`tests/portability-allowlist.json: path is not a file ${allowedPath}`);
        continue;
      }

      const resolvedAllowedFile = await realpath(allowedFile);
      if (!resolvedAllowedFile.startsWith(resolvedRepoPrefix)) {
        errors.push(`tests/portability-allowlist.json: resolved path escapes repository ${allowedPath}`);
      }
    } catch {
      errors.push(`tests/portability-allowlist.json: missing file ${allowedPath}`);
    }
  }
}

async function validateSkillDirectory(directory) {
  const skillPath = path.join(skillsRoot, directory, 'SKILL.md');
  const errors = [];

  try {
    const details = await stat(skillPath);
    if (!details.isFile()) errors.push(`${path.relative(repoRoot, skillPath)}: SKILL.md is not a file`);
  } catch {
    errors.push(`${path.relative(repoRoot, skillPath)}: missing SKILL.md`);
    return errors;
  }

  const source = await readFile(skillPath, 'utf8');
  const relativeSkillPath = path.relative(repoRoot, skillPath);
  const { errors: frontmatterErrors, values } = parseFrontmatter(source, relativeSkillPath);
  errors.push(...frontmatterErrors);
  if (!values) return errors;

  const name = values.get('name');
  if (name !== directory) {
    errors.push(`${relativeSkillPath}: name must exactly match directory ${JSON.stringify(directory)}`);
  }

  const description = values.get('description');
  if (!description || description.replace(/^['"]|['"]$/g, '').trim() === '') {
    errors.push(`${relativeSkillPath}: description must be non-empty`);
  }

  return errors;
}

async function validateRuntimeVocabulary(relativePaths, errors) {
  for (const relativePath of relativePaths) {
    let source;
    try {
      source = await readFile(path.join(repoRoot, relativePath), 'utf8');
    } catch {
      errors.push(`${relativePath}: missing runtime instruction file`);
      continue;
    }
    for (const { label, pattern } of prohibitedRuntimeVocabulary) {
      if (pattern.test(source)) errors.push(`${relativePath}: ${label}`);
    }
  }
}

async function runtimeMarkdownFiles(allowlist) {
  const found = [];
  const walk = async (directory) => {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        await walk(absolute);
        continue;
      }
      if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
      const relativePath = path.relative(repoRoot, absolute).split(path.sep).join('/');
      if (!allowlist.has(relativePath)) found.push(relativePath);
    }
  };
  await walk(skillsRoot);
  return found;
}

async function validateConstitutionDelivery(errors) {
  const relativePath = 'skills/project-constitution/SKILL.md';
  let source;
  try {
    source = await readFile(path.join(repoRoot, relativePath), 'utf8');
  } catch {
    errors.push(`${relativePath}: missing constitution authoring skill`);
    return;
  }
  for (const concept of requiredConstitutionDeliveryConcepts) {
    if (!source.includes(concept)) {
      errors.push(`${relativePath}: missing provider delivery contract ${JSON.stringify(concept)}`);
    }
  }
}

async function validateSkillDiscoveryRoots(errors) {
  for (const relativePath of skillDiscoveryFiles) {
    let source;
    try {
      source = await readFile(path.join(repoRoot, relativePath), 'utf8');
    } catch {
      errors.push(`${relativePath}: missing skill-discovery consumer`);
      continue;
    }
    if (!source.includes('$HOME/.agents/skills/')) {
      errors.push(`${relativePath}: does not search the shared global skill root`);
    }
  }
}

async function validateCodexSessionHook(errors) {
  const relativePath = 'hooks/codex-session-start';
  const hookPath = path.join(repoRoot, relativePath);

  let details;
  try {
    details = await stat(hookPath);
  } catch {
    errors.push(`${relativePath}: missing Codex session recovery adapter`);
    return;
  }
  if (!details.isFile()) {
    errors.push(`${relativePath}: is not a file`);
    return;
  }
  if ((details.mode & 0o111) === 0) {
    errors.push(`${relativePath}: is not executable`);
  }

  const source = await readFile(hookPath, 'utf8');
  for (const concept of requiredCodexHookConcepts) {
    if (!source.includes(concept)) {
      errors.push(`${relativePath}: missing required concept ${JSON.stringify(concept)}`);
    }
  }
}

// `catalog.json` and each `bundles/<name>/bundle.json` duplicate the bundle
// version and must agree — CONSTITUTION.md, "Release de contenido". A bump
// applied to only one of the two ships metadata that contradicts itself.
async function validateBundleVersions(errors) {
  let catalog;
  try {
    catalog = JSON.parse(await readFile(path.join(repoRoot, 'catalog.json'), 'utf8'));
  } catch (error) {
    errors.push(`catalog.json: ${error.message}`);
    return;
  }

  if (!Array.isArray(catalog.bundles)) {
    errors.push('catalog.json: bundles must be an array');
    return;
  }

  for (const entry of catalog.bundles) {
    if (!entry || typeof entry.name !== 'string' || typeof entry.version !== 'string') {
      errors.push('catalog.json: every bundle entry requires string name and version');
      continue;
    }

    const bundlePath = `bundles/${entry.name}/bundle.json`;
    let bundle;
    try {
      bundle = JSON.parse(await readFile(path.join(repoRoot, bundlePath), 'utf8'));
    } catch (error) {
      errors.push(`${bundlePath}: ${error.message}`);
      continue;
    }

    if (bundle.version !== entry.version) {
      errors.push(`${bundlePath}: version ${JSON.stringify(bundle.version)} != catalog.json ${JSON.stringify(entry.version)}`);
    }
  }
}

async function validateExecutionSpine(errors) {
  const relativePath = 'skills/development-process/SKILL.md';
  let source;
  try {
    source = await readFile(path.join(repoRoot, relativePath), 'utf8');
  } catch {
    errors.push(`${relativePath}: missing lifecycle orchestrator`);
    return;
  }

  for (const invariant of requiredDevelopmentProcessLifecycle) {
    if (!source.includes(invariant)) {
      errors.push(`${relativePath}: lifecycle invariant lost ${JSON.stringify(invariant)}`);
    }
  }
  for (const location of requiredSkillLocations) {
    if (!source.includes(location)) {
      errors.push(`${relativePath}: missing skill location ${JSON.stringify(location)}`);
    }
  }
}

async function main() {
  const errors = [];
  const allowlist = await loadAllowlist(errors);
  await validateAllowlistedFiles(allowlist, errors);
  const directories = await immediateSkillDirectories();

  if (directories.length !== 37) {
    errors.push(`skills: expected exactly 37 immediate skill directories, found ${directories.length}`);
  }

  for (const directory of directories) {
    errors.push(...await validateSkillDirectory(directory));
  }

  await validateRuntimeVocabulary(await runtimeMarkdownFiles(allowlist), errors);
  await validateExecutionSpine(errors);
  await validateConstitutionDelivery(errors);
  await validateSkillDiscoveryRoots(errors);
  await validateCodexSessionHook(errors);
  await validateBundleVersions(errors);

  const developmentProcessPath = path.join(repoRoot, 'agents', 'development-process.md');
  let developmentProcessSource = '';
  try {
    developmentProcessSource = await readFile(developmentProcessPath, 'utf8');
  } catch {
    errors.push('agents/development-process.md: missing required orchestrator profile');
  }

  for (const concept of requiredDevelopmentProcessConcepts) {
    if (!developmentProcessSource.includes(concept)) {
      errors.push(`agents/development-process.md: missing required concept ${JSON.stringify(concept)}`);
    }
  }

  const codexReferencePath = path.join(repoRoot, 'references', 'codex-tools.md');
  let codexReferenceSource = '';
  try {
    codexReferenceSource = await readFile(codexReferencePath, 'utf8');
  } catch {
    errors.push('references/codex-tools.md: missing required Codex capability reference');
  }

  if (codexReferenceSource.includes('close_agent')) {
    errors.push('references/codex-tools.md: obsolete close_agent capability is not portable');
  }
  if (/^\s*multi_agent\s*=\s*true\s*(?:#.*)?$/m.test(codexReferenceSource)) {
    errors.push('references/codex-tools.md: obsolete multi-agent feature flag is not portable');
  }
  for (const capability of requiredCodexCapabilities) {
    if (!codexReferenceSource.includes(capability)) {
      errors.push(`references/codex-tools.md: missing required capability ${JSON.stringify(capability)}`);
    }
  }

  const usingAwmPath = path.join(repoRoot, 'skills', 'using-awm', 'SKILL.md');
  let usingAwmSource = '';
  try {
    usingAwmSource = await readFile(usingAwmPath, 'utf8');
  } catch {
    errors.push('skills/using-awm/SKILL.md: missing required runtime contract');
  }

  for (const concept of requiredUsingAwmConcepts) {
    if (!usingAwmSource.includes(concept)) {
      errors.push(`skills/using-awm/SKILL.md: missing required concept ${JSON.stringify(concept)}`);
    }
  }

  if (errors.length > 0) {
    process.stderr.write(`${errors.join('\n')}\n`);
    process.exitCode = 1;
    return;
  }

  process.stdout.write(`portable: ${directories.length} skills validated\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
