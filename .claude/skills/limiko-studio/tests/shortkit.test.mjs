// Shortkit pure helpers (node --test).
import test from 'node:test';
import assert from 'node:assert/strict';
import { pickShot, punch, drift } from '../frames/shortkit.js';

test('pickShot follows the cue list', () => {
  const cuts = [[0, 'a'], [2, 'b'], [5, 'c']];
  assert.deepEqual(pickShot(1, cuts), { shot: 'a', cutAt: 0, since: 1 });
  assert.equal(pickShot(2.5, cuts).shot, 'b');
  assert.equal(pickShot(9, cuts).since, 4);
});

test('punch only after a real cut, and it settles', () => {
  assert.equal(punch(0, 0), 1);
  assert.ok(punch(0, 3) > 1.06);
  assert.ok(Math.abs(punch(2, 3) - 1) < 1e-3);
});

test('the camera always moves', () => {
  const a = drift(1), b = drift(2);
  assert.notDeepEqual(a, b);
});
