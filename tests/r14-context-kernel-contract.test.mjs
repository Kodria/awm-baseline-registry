import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const legacyRoot = path.join(root, 'tests/fixtures/context-kernel-v1/legacy');
const candidateRoot = path.join(root, 'tests/fixtures/context-kernel-v1/candidate');
const legacyFiles = Object.freeze(['AGENTS.md', 'CONSTITUTION.md', 'CLAUDE.md']);
const expectedCorpus = Object.freeze({
  'AGENTS.md': [32778, '967d70c83cdbb69af36f1dcd313ac1b83f32ec5a2bff203706ada284597131d4'],
  'CONSTITUTION.md': [30164, 'db8751796453223e27357bf0593d84e83c0bc00d2700d05bff531e9c030723b7'],
  'CLAUDE.md': [4539, '444f00ac58d96acf8d7cdbff909388279a1a46238ad83ba8fd2b63af6d5e6d22'],
});
const expectedManifest = Object.freeze({ minCliVersion: '9.3.0', projectContextSchema: 1 });
const fullContextTriggers = Object.freeze([
  'second-context-request', 'missing-or-invalid-indexed-source', 'selection-uncertain',
  'security-or-robustness', 'root-configuration', 'public-contract',
  'uncertain-cross-cutting-impact', 'legacy-metadata', 'malformed-or-missing-evidence',
]);

const readBytes = source => readFileSync(source);
const read = source => readFileSync(path.join(root, source), 'utf8');
const sha256 = value => createHash('sha256').update(value).digest('hex');
const normalizeLf = value => value.replace(/\r\n?/g, '\n');
const fileToken = file => file.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').toUpperCase();
const lineCount = value => value === '' ? 0 : value.split('\n').length;

function deriveBlocksFromText(file, contents) {
  const lines = normalizeLf(contents).split('\n');
  const blocks = [];
  let start = null;
  for (let index = 0; index <= lines.length; index += 1) {
    const nonEmpty = index < lines.length && lines[index].trim() !== '';
    if (nonEmpty && start === null) start = index;
    if (!nonEmpty && start !== null) {
      const end = index - 1;
      const body = lines.slice(start, end + 1).join('\n');
      blocks.push({
        id: `LEGACY-${fileToken(file)}-${String(blocks.length + 1).padStart(3, '0')}`,
        file,
        startLine: start + 1,
        endLine: end + 1,
        sha256: sha256(body),
      });
      start = null;
    }
  }
  return blocks;
}

function deriveBlocksFromLegacy(base = legacyRoot) {
  return legacyFiles.flatMap(file => deriveBlocksFromText(file, readFileSync(path.join(base, file), 'utf8')));
}

function assertFrozenCorpus(base = legacyRoot) {
  const actual = {};
  for (const file of legacyFiles) {
    const bytes = readBytes(path.join(base, file));
    assert.ok(!bytes.includes(0x0d), `${file} must be normalized to LF`);
    actual[file] = [bytes.length, sha256(bytes)];
  }
  assert.deepEqual(actual, expectedCorpus);
  assert.equal(Object.values(actual).reduce((total, [bytes]) => total + bytes, 0), 67481);
}

function assertManifest(manifest) {
  assert.deepEqual(manifest, expectedManifest, 'registry manifest must be the exact published Context Kernel declaration');
}

function readInventory() {
  return JSON.parse(readFileSync(path.join(legacyRoot, 'block-inventory.json'), 'utf8'));
}

function listMarkdownFiles(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const candidate = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...listMarkdownFiles(candidate));
    else if (entry.isFile() && entry.name.endsWith('.md')) files.push(candidate);
  }
  return files;
}

function findDuplicateContractTables() {
  const canonical = path.join(root, 'skills/project-context-init/references/context-kernel-v1.md');
  const prohibitedHeadings = ['## Protected Region', '## First Migration', '## Selection and Retrieval', '## Full-context Triggers'];
  return listMarkdownFiles(path.join(root, 'skills'))
    .filter(file => file !== canonical)
    .filter(file => prohibitedHeadings.some(heading => readFileSync(file, 'utf8').includes(heading)))
    .map(file => path.relative(root, file));
}

function assertNoDuplicateContractOwnership(sources) {
  const ownershipPatterns = [
    /(?:sole|canonical|normative)[\s\S]{0,120}context kernel[\s\S]{0,120}(?:definition|contract|owner)/i,
    /schema[\s\S]{0,80}exactly\s*1[\s\S]{0,320}(?:kernelFiles|maxFixedBytes|entries)/i,
    /one native file-read batch/i,
    /No automated maintenance edits or deletes this (?:region|kernel)/i,
  ];
  for (const { file, text } of sources) {
    for (const pattern of ownershipPatterns) {
      assert.doesNotMatch(text, pattern, `${file} duplicates Context Kernel v1 ownership`);
    }
  }
}

function assertNoAutomaticContextRemoval(sources) {
  const prohibitedPhrases = [
    /\bprune now\b/i,
    /\bmerge(?:-|\s+)and(?:-|\s+)prune\b/i,
    /\bdrop entries? that no longer apply\b/i,
  ];
  const automaticRemoval = /\b(?:automatically|automatic)\b[\s\S]{0,100}\b(?:prun(?:e|ing)|delet(?:e|ing|ion)|drop(?:ping)?|remov(?:e|es|ing|al))\b/i;
  for (const { file, text } of sources) {
    for (const phrase of prohibitedPhrases) {
      assert.doesNotMatch(text, phrase, `${file} authorizes automatic context removal`);
    }
    assert.doesNotMatch(text, automaticRemoval, `${file} authorizes automatic context removal`);
  }
}

function readCandidateIndex() {
  return JSON.parse(readFileSync(path.join(candidateRoot, '.awm/context/index.json'), 'utf8'));
}

function candidate(file) {
  return path.join(candidateRoot, file);
}

function countOccurrences(text, value) {
  return text.split(value).length - 1;
}

function readMigrationTable() {
  const migration = readFileSync(candidate('docs/awm/context/migration-v1.md'), 'utf8');
  const rows = migration.split('\n').filter(line => line.startsWith('| LEGACY-'));
  return rows.map(line => {
    const [, legacyBlock, source, contextId, destination, rationale] = line.split('|').map(cell => cell.trim());
    return { legacyBlock, source, contextId, destination, rationale };
  });
}

function assertProtectedRegions(index) {
  for (const file of index.kernelFiles) {
    const text = readFileSync(candidate(file), 'utf8');
    const start = '<!-- AWM:CONTEXT-KERNEL:START v1 -->';
    const end = '<!-- AWM:CONTEXT-KERNEL:END v1 -->';
    assert.equal(countOccurrences(text, start), 1, `${file} must have one protected start marker`);
    assert.equal(countOccurrences(text, end), 1, `${file} must have one protected end marker`);
    assert.ok(text.indexOf(start) < text.indexOf(end), `${file} protected markers must be ordered`);
  }
  for (const entry of index.entries) {
    const text = readFileSync(candidate(entry.path), 'utf8');
    const anchor = `<!-- ${entry.anchor} -->`;
    assert.equal(countOccurrences(text, anchor), 1, `${entry.id} anchor must occur exactly once`);
    if (entry.tier === 'kernel') {
      const start = text.indexOf('<!-- AWM:CONTEXT-KERNEL:START v1 -->');
      const end = text.indexOf('<!-- AWM:CONTEXT-KERNEL:END v1 -->');
      const offset = text.indexOf(anchor);
      assert.ok(start < offset && offset < end, `${entry.id} must remain protected`);
    }
  }
}

function contextIdsFromTrace() {
  return new Set(readMigrationTable().map(row => row.contextId));
}

function assertCandidateLayout(index) {
  assert.deepEqual(Object.keys(index).sort(), ['entries', 'kernelFiles', 'maxFixedBytes', 'schema']);
  assert.equal(index.schema, 1);
  assert.ok(Array.isArray(index.kernelFiles) && index.kernelFiles.length > 0);
  assert.ok(Number.isSafeInteger(index.maxFixedBytes) && index.maxFixedBytes > 0);
  assert.ok(Array.isArray(index.entries) && index.entries.length > 0);
  for (const entry of index.entries) {
    assert.deepEqual(Object.keys(entry).sort(), ['anchor', 'id', 'path', 'tier', 'when']);
    assert.match(entry.id, /^CTX-[A-Z0-9]+(?:-[A-Z0-9]+)*$/);
    assert.ok(['kernel', 'selective'].includes(entry.tier));
    assert.match(entry.path, /^(?!\/)(?!.*(?:^|\/)\.{1,2}(?:\/|$))(?!.*\/\/)[^\\]+$/);
    assert.ok(entry.anchor.length > 0 && entry.when.length > 0);
  }
}

test('R3.1: registry manifest declares only the published Context Kernel v1 contract', () => {
  const manifest = JSON.parse(readFileSync(path.join(root, 'awm-registry.json'), 'utf8'));
  assertManifest(manifest);
  assert.throws(() => assertManifest({ ...expectedManifest, projectContextSchema: 2 }), /exact published Context Kernel declaration/);
});

test('R3.5/R3.14: frozen corpus is exact and inventory covers every non-empty block', () => {
  assertFrozenCorpus();
  assert.deepEqual(readInventory(), deriveBlocksFromLegacy());
  const inventory = readInventory();
  assert.equal(new Set(inventory.map(block => block.id)).size, inventory.length);
  for (const block of inventory) {
    assert.match(block.id, /^LEGACY-[A-Z0-9-]+-\d{3}$/);
    assert.ok(legacyFiles.includes(block.file));
    assert.ok(Number.isInteger(block.startLine) && block.startLine >= 1);
    assert.ok(Number.isInteger(block.endLine) && block.endLine >= block.startLine);
    assert.match(block.sha256, /^[a-f0-9]{64}$/);
  }
  const agentText = readFileSync(path.join(legacyRoot, 'AGENTS.md'), 'utf8');
  assert.throws(() => assert.deepEqual(deriveBlocksFromText('AGENTS.md', `${agentText}\nchanged`), readInventory()), /Expected values to be strictly deep-equal/);
  assert.ok(lineCount(agentText) > 0);
});

test('R3.15: the canonical reference is the sole owner and forbids infrastructure expansion', () => {
  const reference = readFileSync(path.join(root, 'skills/project-context-init/references/context-kernel-v1.md'), 'utf8');
  assert.match(reference, /sole normative Context Kernel v1 definition/);
  for (const trigger of fullContextTriggers) assert.match(reference, new RegExp(trigger));
  assert.match(reference, /schema exactly 1/);
  assert.match(reference, /exactly `?schema`?,\s*\n?`?kernelFiles`?,\s*`?maxFixedBytes`?, and `?entries`?/);
  assert.match(reference, /exactly `?id`?, `?tier`?,\s*\n?`?path`?, `?anchor`?, and `?when`?/);
  for (const clause of ['one native file-read batch', 'No automated maintenance edits or deletes this region']) {
    assert.match(reference, new RegExp(clause));
  }
  assert.doesNotMatch(reference, /embedding|vector database|retrieval service|model-only invocation/i);
  assert.deepEqual(findDuplicateContractTables(), []);
  const canonical = path.join(root, 'skills/project-context-init/references/context-kernel-v1.md');
  const nonCanonicalSkills = listMarkdownFiles(path.join(root, 'skills'))
    .filter(file => file !== canonical)
    .map(file => ({ file: path.relative(root, file), text: readFileSync(file, 'utf8') }));
  assertNoDuplicateContractOwnership(nonCanonicalSkills);
  assert.throws(() => assertNoDuplicateContractOwnership([{
    file: 'skills/example/SKILL.md',
    text: '## Alternate wording\nThe canonical context kernel contract says schema exactly 1 and lists kernelFiles, maxFixedBytes, and entries.',
  }]), /duplicates Context Kernel v1 ownership/);
});

test('R3.3/R3.14: a candidate must satisfy the published parser layout before it can reduce fixed context', () => {
  assert.ok(existsSync(candidateRoot), 'Task 2 must add the reviewed candidate fixture');
  const index = readCandidateIndex();
  assertCandidateLayout(index);
  const malformed = { ...index, schema: 2 };
  assert.throws(() => assertCandidateLayout(malformed), /Expected values to be strictly equal/);
  const fixedBytes = legacyFiles.reduce((total, file) => total + readBytes(path.join(candidateRoot, file)).length, 0);
  assert.ok(fixedBytes <= 33740, `candidate fixed bytes ${fixedBytes} exceed 33740`);
  assert.ok(1 - fixedBytes / 67481 >= 0.5);
});

test('R3.4-R3.6: migration is complete, unique, and protected', () => {
  const index = readCandidateIndex();
  assertCandidateLayout(index);
  assert.equal(new Set(index.entries.map(entry => entry.id)).size, index.entries.length);
  assert.equal(new Set(index.entries.map(entry => entry.anchor)).size, index.entries.length);
  assertProtectedRegions(index);
  const mapping = readMigrationTable();
  const inventory = readInventory();
  assert.deepEqual(mapping.map(row => row.legacyBlock).sort(), inventory.map(block => block.id).sort());
  for (const block of inventory) {
    assert.equal(mapping.filter(row => row.legacyBlock === block.id).length, 1, `${block.id} needs one migration row`);
  }
  for (const row of mapping) {
    assert.ok(row.source.length > 0 && row.destination.length > 0 && row.rationale.length > 0);
    assert.ok(index.entries.some(entry => entry.id === row.contextId), `${row.contextId} is not indexed`);
  }
  assert.deepEqual([...contextIdsFromTrace()].sort(), index.entries.map(entry => entry.id).sort());
  assert.throws(() => {
    const duplicate = { ...index, entries: [...index.entries, { ...index.entries[0] }] };
    assert.equal(new Set(duplicate.entries.map(entry => entry.id)).size, duplicate.entries.length);
  }, /Expected values to be strictly equal/);
  assert.throws(() => {
    const missingProtection = readFileSync(candidate('AGENTS.md'), 'utf8').replace('<!-- AWM:CONTEXT-KERNEL:END v1 -->', '');
    assert.equal(countOccurrences(missingProtection, '<!-- AWM:CONTEXT-KERNEL:END v1 -->'), 1);
  }, /Expected values to be strictly equal/);
});

test('R3.14: fixed bytes fall by at least half without losing trace', () => {
  const fixedBytes = legacyFiles.reduce((total, file) => total + readBytes(candidate(file)).length, 0);
  assert.ok(fixedBytes <= 33740, `candidate fixed bytes ${fixedBytes} exceed 33740`);
  assert.ok(1 - fixedBytes / 67481 >= 0.5);
  assert.deepEqual(readBytes(candidate('CLAUDE.md')), readBytes(path.join(legacyRoot, 'CLAUDE.md')));
  assert.throws(() => {
    const inflated = fixedBytes + 33741;
    assert.ok(inflated <= 33740, `candidate fixed bytes ${inflated} exceed 33740`);
  }, /candidate fixed bytes/);
});

test('R3.6-R3.8: maintenance cannot prune kernel or infer deletion authority', () => {
  const retro = read('skills/harness-retro/SKILL.md');
  const plans = read('skills/writing-plans/SKILL.md');
  assert.match(retro, /MUST NOT automatically edit.*protected kernel/s);
  assert.match(retro, /card and index entry/s);
  assert.match(retro, /before.*after.*ID.*equal/s);
  assert.match(retro, /owner-approved removal.*explicit.*approval.*reason.*recorded/s);
  assert.match(plans, /legacy full context.*advisory/s);
  assert.match(plans, /partial.*invalid.*blocking/s);
  assert.match(plans, /threshold.*does not authorize.*prun|budget.*never authorizes.*delet/s);
  assert.match(plans, /controlled card maintenance.*reviewed budget increase.*continuation.*recorded/s);
  assert.match(retro, /legacy.*retain.*full context.*without removing.*content/s);
  assert.match(retro, /owner-approved removal.*explicit.*reason.*recorded/s);
  assertNoAutomaticContextRemoval([
    { file: 'skills/writing-plans/SKILL.md', text: plans },
    { file: 'skills/harness-retro/SKILL.md', text: retro },
  ]);
  assert.throws(() => assert.match(
    retro.replace('MUST NOT automatically edit', 'MUST automatically edit'),
    /MUST NOT automatically edit.*protected kernel/s,
  ), /did not match/);
  assert.throws(() => assertNoAutomaticContextRemoval([{
    file: 'skills/example/SKILL.md',
    text: '1. **Prune now.** Remove lessons from context before unattended execution.',
  }]), /authorizes automatic context removal/);
  assert.throws(() => assertNoAutomaticContextRemoval([{
    file: 'skills/example/SKILL.md',
    text: 'Retro automatically removes stale context entries.',
  }]), /authorizes automatic context removal/);
});
