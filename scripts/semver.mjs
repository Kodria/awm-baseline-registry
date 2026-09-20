/**
 * Bare `X.Y.Z` comparison, shared by the pieces that consume the registry's CLI
 * floor. Deliberately strict: prereleases and ranges are not a floor, so anything
 * that is not exactly three numeric identifiers fails loudly rather than sorting
 * as a surprise. Digits are compared by length-then-lexicographic order so that
 * `10` > `9` without ever going through Number (which silently yields NaN).
 */
const BARE_SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

export function isBareSemver(value) {
  return typeof value === 'string' && BARE_SEMVER.test(value);
}

function identifiers(value, label) {
  if (!isBareSemver(value)) throw new Error(`${label} must be a bare semantic version (X.Y.Z), got ${JSON.stringify(value)}`);
  return BARE_SEMVER.exec(value).slice(1, 4);
}

function compareIdentifier(a, b) {
  if (a.length !== b.length) return a.length < b.length ? -1 : 1;
  return a < b ? -1 : a > b ? 1 : 0;
}

/** -1 / 0 / 1. Throws on anything that is not a bare semantic version. */
export function compareSemver(a, b, labelA = 'version', labelB = 'version') {
  const left = identifiers(a, labelA);
  const right = identifiers(b, labelB);
  return compareIdentifier(left[0], right[0]) || compareIdentifier(left[1], right[1]) || compareIdentifier(left[2], right[2]);
}

/** True when `version` may consume content declaring `floor` as its minimum. */
export function satisfiesFloor(version, floor) {
  return compareSemver(version, floor, 'CLI version', 'minCliVersion') >= 0;
}
