import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Downloader, DownloadNotAllowedError } from '../src/downloads.js';
import { MemoryCache } from '../src/cache.js';
import { track } from './helpers.js';

const okFetch = (calls = []) => async (u) => { calls.push(u); return { ok: true, status: 200, blob: async () => new Blob(['audio-bytes']) }; };

test('requires a cache', () => {
  assert.throws(() => new Downloader({}), /cache is required/);
});
test('downloads an allowed track and stores it with metadata', async () => {
  const cache = new MemoryCache();
  const calls = [];
  const d = new Downloader({ fetchFn: okFetch(calls), cache, now: () => 1000 });
  const r = await d.download(track(1));
  assert.deepEqual(r, { id: '1', cached: false, size: 11 });
  assert.deepEqual(calls, ['https://dl.example/1.mp3']);
  const [meta] = await cache.list();
  assert.equal(meta.savedAt, 1000);
  assert.equal(meta.license.code, 'cc-by-nc-sa');
});
test('never fetches when the track is not downloadable', async () => {
  const calls = [];
  const d = new Downloader({ fetchFn: okFetch(calls), cache: new MemoryCache() });
  await assert.rejects(d.download(track(2, { downloadAllowed: false })), (e) => e instanceof DownloadNotAllowedError && e.reason === 'download-not-offered');
  await assert.rejects(d.download(track(3, { licenseUrl: '' })), (e) => e.reason === 'unknown-license');
  assert.equal(calls.length, 0);
});
test('does not download twice', async () => {
  const calls = [];
  const d = new Downloader({ fetchFn: okFetch(calls), cache: new MemoryCache() });
  await d.download(track(1));
  const again = await d.download(track(1));
  assert.deepEqual(again, { id: '1', cached: true });
  assert.equal(calls.length, 1);
});
test('throws on HTTP failure and stores nothing', async () => {
  const cache = new MemoryCache();
  const d = new Downloader({ fetchFn: async () => ({ ok: false, status: 404 }), cache });
  await assert.rejects(d.download(track(1)), /HTTP 404/);
  assert.equal(await cache.has('1'), false);
});
test('playbackSource prefers the offline copy, else streams', async () => {
  const d = new Downloader({ fetchFn: okFetch(), cache: new MemoryCache() });
  const t = track(1);
  assert.deepEqual(await d.playbackSource(t), { offline: false, url: t.streamUrl });
  await d.download(t);
  const src = await d.playbackSource(t);
  assert.equal(src.offline, true);
  assert.equal(src.blob.size, 11);
});
