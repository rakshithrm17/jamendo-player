import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Queue } from '../src/queue.js';
import { track } from './helpers.js';

const four = () => ['a', 'b', 'c', 'd'].map((id) => track(id));
const ids = (q) => q.list().map((t) => t.id).join('');

test('empty queue returns null everywhere', () => {
  const q = new Queue();
  assert.equal(q.current(), null);
  assert.equal(q.next(), null);
  assert.equal(q.prev(), null);
});
test('plays in order and stops at the end with repeat off', () => {
  const q = new Queue();
  q.setTracks(four(), 0);
  assert.equal(q.current().id, 'a');
  assert.equal(q.next().id, 'b');
  q.next(); q.next();
  assert.equal(q.next(), null);
  assert.equal(q.current().id, 'd');
});
test('starts from the chosen index', () => {
  const q = new Queue();
  assert.equal(q.setTracks(four(), 2).id, 'c');
});
test('prev stays at the first track with repeat off', () => {
  const q = new Queue();
  q.setTracks(four(), 0);
  assert.equal(q.prev().id, 'a');
});
test('repeat all wraps both directions', () => {
  const q = new Queue();
  q.setTracks(four(), 3);
  q.setRepeat('all');
  assert.equal(q.next().id, 'a');
  assert.equal(q.prev().id, 'd');
});
test('repeat one keeps the same track', () => {
  const q = new Queue();
  q.setTracks(four(), 1);
  q.setRepeat('one');
  assert.equal(q.next().id, 'b');
});
test('rejects invalid repeat mode', () => {
  assert.throws(() => new Queue().setRepeat('forever'), /Invalid repeat mode/);
});
test('shuffle is deterministic with an injected rng and keeps the start track first', () => {
  const q = new Queue({ rng: () => 0 });
  q.toggleShuffle();
  q.setTracks(four(), 0);
  assert.equal(ids(q), 'acdb');
  assert.equal(q.current().id, 'a');
});
test('shuffle plays every track exactly once', () => {
  const q = new Queue({ rng: () => 0.37 });
  q.toggleShuffle();
  q.setTracks(four(), 1);
  const seen = [q.current().id];
  for (let t = q.next(); t; t = q.next()) seen.push(t.id);
  assert.equal(seen.sort().join(''), 'abcd');
});
test('toggling shuffle keeps the current track', () => {
  const q = new Queue({ rng: () => 0.5 });
  q.setTracks(four(), 2);
  q.toggleShuffle();
  assert.equal(q.current().id, 'c');
  q.toggleShuffle();
  assert.equal(q.current().id, 'c');
  assert.equal(ids(q), 'abcd');
});
test('add appends and starts an empty queue', () => {
  const q = new Queue();
  q.add(track('x'));
  assert.equal(q.current().id, 'x');
  q.add(track('y'));
  assert.equal(ids(q), 'xy');
});
test('playNext inserts right after the current track', () => {
  const q = new Queue();
  q.setTracks(four(), 1);
  q.playNext(track('z'));
  assert.equal(ids(q), 'abzcd');
  assert.equal(q.next().id, 'z');
});
test('remove before current keeps the current track', () => {
  const q = new Queue();
  q.setTracks(four(), 2);
  assert.equal(q.remove('a'), true);
  assert.equal(q.current().id, 'c');
});
test('remove the current track moves to the next one', () => {
  const q = new Queue();
  q.setTracks(four(), 1);
  q.remove('b');
  assert.equal(q.current().id, 'c');
});
test('remove the last current track clamps to the new last', () => {
  const q = new Queue();
  q.setTracks(four(), 3);
  q.remove('d');
  assert.equal(q.current().id, 'c');
});
test('remove returns false for unknown ids', () => {
  const q = new Queue();
  q.setTracks(four(), 0);
  assert.equal(q.remove('nope'), false);
});
