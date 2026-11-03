// Pure-function tests for the timeline toolkit and text units (node --test).
import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../frames/timeline.js';
import { units, PRESETS, PRESET_INFO } from '../frames/textfx.js';

test('interpolate clamps and eases', () => {
  assert.equal(T.interpolate(-1, [0, 1], [0, 100]), 0);
  assert.equal(T.interpolate(2, [0, 1], [0, 100]), 100);
  assert.equal(T.interpolate(0.5, [0, 1], [0, 100]), 50);
  assert.ok(T.interpolate(0.5, [0, 1], [0, 100], { ease: 'out' }) > 50);
});

test('spring settles at the target', () => {
  assert.equal(T.spring(0, { from: 0, to: 1, delay: 0.5 }), 0);
  assert.ok(Math.abs(T.spring(5, { to: 1 }) - 1) < 1e-3);
});

test('script runs tweens in order and waits for cues', () => {
  const tl = T.script({ x: 0 }, { go: 2 }).to('x', 10, 1).until('go').to('x', 20, 1);
  assert.equal(tl.get('x', 1), 10);
  assert.equal(tl.get('x', 1.5), 10);
  assert.equal(tl.get('x', 3), 20);
  assert.equal(tl.duration, 3);
  assert.throws(() => T.script({}, {}).until('missing'));
});

test('exposure holds drawings for the given frames', () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5].map((f) => T.exposure(f / 24, 24, [2, 2, 2])), [0, 0, 1, 1, 2, 2]);
  assert.equal(T.onTwos(1 / 24, 24), 0);
});

test('morph keeps the point count and hits both ends', () => {
  const sq = [[0, 0], [1, 0], [1, 1], [0, 1]], tri = [[0, 0], [2, 0], [1, 2]];
  const m0 = T.morph(sq, tri, 0, 40), m1 = T.morph(sq, tri, 1, 40);
  assert.equal(m0.length, 40);
  assert.deepEqual(m0[0], [0, 0]); assert.deepEqual(m1[0], [0, 0]);
});

test('Telugu syllables stay whole when animating letters', () => {
  const parts = units('వర్షం', 'grapheme', 'te');
  assert.ok(parts.length < [...'వర్షం'].length, 'conjuncts are not split into code points');
  assert.equal(parts.join(''), 'వర్షం');
});

test('every text preset is documented', () => {
  for (const k of Object.keys(PRESETS)) assert.ok(PRESET_INFO[k], k);
});
