import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, realpathSync } from 'node:fs';
import path from 'node:path';
import { satisfiesFloor } from '../scripts/semver.mjs';

// Source verification is explicitly prerelease evidence, never installed/released acceptance.
export function requireCompatibleRuntime(bin, root) {
  const floor = JSON.parse(readFileSync(path.join(root, 'awm-registry.json'), 'utf8')).minCliVersion;
  const actual = execFileSync(bin, ['--version'], { encoding: 'utf8', timeout: 15_000, maxBuffer: 10_000 }).trim();
  // `minCliVersion` is a FLOOR, not the exact version under test: a CLI newer
  // than the floor is precisely what a user installing today gets, and demanding
  // equality here is one of the couplings Kodria/agentic-workflow#164 describes.
  if (satisfiesFloor(actual, floor)) return { kind: 'published-version', actual, floor };
  const sourceCommit = process.env.AWM_R1_PRERELEASE_SOURCE_COMMIT;
  assert.ok(sourceCommit && /^[a-f0-9]{40}$/.test(sourceCommit), `runtime ${actual} is below the registry floor ${floor}; explicit source evidence required`);
  const realBin = realpathSync(bin);
  assert.ok(realBin.endsWith(`${path.sep}cli${path.sep}dist${path.sep}src${path.sep}index.js`), 'prerelease must execute the actual compiled CLI');
  const source = path.resolve(path.dirname(realBin), '../../..');
  const observedCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: source, encoding: 'utf8', timeout: 5000, maxBuffer: 1000 }).trim();
  assert.equal(observedCommit, sourceCommit, 'prerelease source identity must match the explicit commit');
  process.stderr.write(`PRERELEASE source=${sourceCommit} runtime=${actual} registry-floor=${floor}; installed acceptance remains pending\n`);
  return { kind: 'prerelease-source', actual, sourceCommit, floor };
}
