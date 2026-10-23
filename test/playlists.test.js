import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PlaylistStore } from '../src/playlists.js';
import { track, memoryStorage } from './helpers.js';

const make = (storage = memoryStorage()) => {
  let n = 0;
  return { storage, store: new PlaylistStore(storage, { idGen: () => `p${++n}` }) };
};

test('creates a playlist with a trimmed name', () => {
  const { store } = make();
  const p = store.create('  Physics  ');
  assert.deepEqual(p, { id: 'p1', name: 'Physics', tracks: [] });
});
test('rejects empty names', () => {
  const { store } = make();
  assert.throws(() => store.create('   '), /name is required/);
  assert.throws(() => store.create(), /name is required/);
});
test('adds tracks once and ignores duplicates', () => {
  const { store } = make();
  const { id } = store.create('Focus');
  assert.equal(store.addTrack(id, track(1)), true);
  assert.equal(store.addTrack(id, track(1)), false);
  assert.equal(store.get(id).tracks.length, 1);
});
test('removes tracks', () => {
  const { store } = make();
  const { id } = store.create('Focus');
  store.addTrack(id, track(1));
  assert.equal(store.removeTrack(id, '1'), true);
  assert.equal(store.removeTrack(id, '1'), false);
});
test('renames and deletes', () => {
  const { store } = make();
  const { id } = store.create('Old');
  store.rename(id, 'New');
  assert.equal(store.get(id).name, 'New');
  store.delete(id);
  assert.deepEqual(store.list(), []);
  assert.throws(() => store.get(id), /not found/);
});
test('unknown playlist ids throw', () => {
  const { store } = make();
  assert.throws(() => store.addTrack('missing', track(1)), /not found/);
  assert.throws(() => store.delete('missing'), /not found/);
});
test('persists across instances', () => {
  const a = make();
  const { id } = a.store.create('Saved');
  a.store.addTrack(id, track(9));
  const b = new PlaylistStore(a.storage);
  assert.equal(b.get(id).tracks[0].id, '9');
});
test('survives corrupted storage', () => {
  const s = memoryStorage();
  s.setItem('playlists', '{not json');
  assert.deepEqual(new PlaylistStore(s).list(), []);
});
test('returned objects are copies, not live references', () => {
  const { store } = make();
  const { id } = store.create('A');
  store.get(id).tracks.push(track(1));
  assert.equal(store.get(id).tracks.length, 0);
});
