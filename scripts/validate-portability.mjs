#!/usr/bin/env node

import { readdir, readFile, stat } from 'node:fs/promises';
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

async function main() {
  const errors = [];
  const allowlist = await loadAllowlist(errors);
  const directories = await immediateSkillDirectories();

  if (directories.length !== 37) {
    errors.push(`skills: expected exactly 37 immediate skill directories, found ${directories.length}`);
  }

  for (const directory of directories) {
    errors.push(...await validateSkillDirectory(directory));
  }

  // Future vocabulary checks use allowlist.has(rel(file)) in this scope.

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
