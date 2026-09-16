import assert from 'node:assert/strict';
import test from 'node:test';

test('npm executes the project-owned test script', () => {
  assert.equal(1 + 1, 2);
});
