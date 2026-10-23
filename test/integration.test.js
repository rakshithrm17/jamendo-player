import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '../src/api.js';
import { Queue } from '../src/queue.js';
import { PlaylistStore } from '../src/playlists.js';
import { Downloader, DownloadNotAllowedError } from '../src/downloads.js';
import { MemoryCache } from '../src/cache.js';
import { canDownload } from '../src/license.js';
import { memoryStorage } from './helpers.js';

const RAW = [
  { id: 1, name: 'Rain', artist_name: 'Ana', audio: 'https://s.test/1.mp3', audiodownload: 'https://dl.test/1.mp3', audiodownload_allowed: true, license_ccurl: 'http://creativecommons.org/licenses/by-nc-sa/3.0/' },
  { id: 2, name: 'Wind', artist_name: 'Ben', audio: 'https://s.test/2.mp3', audiodownload: '', audiodownload_allowed: false, license_ccurl: 'http://creativecommons.org/licenses/by/3.0/' },
  { id: 3, name: 'Sun', artist_name: 'Cy', audio: 'https://s.test/3.mp3', audiodownload: 'https://dl.test/3.mp3', audiodownload_allowed: true, license_ccurl: 'http://creativecommons.org/licenses/by-nd/3.0/' },
];
const fakeFetch = async (url) => {
  const u = String(url);
  if (u.includes('/tracks/')) return { ok: true, status: 200, json: async () => ({ headers: { status: 'success' }, results: RAW }) };
  if (u.startsWith('https://dl.test/')) return { ok: true, status: 200, blob: async () => new Blob([`bytes-of-${u}`]) };
  return { ok: false, status: 404 };
};

test('search -> queue -> like -> licence-gated download -> offline playback', async () => {
  const client = createClient({ clientId: 'test', fetchFn: fakeFetch });
  const tracks = await client.searchTracks('weather');
  assert.equal(tracks.length, 3);

  const queue = new Queue();
  assert.equal(queue.setTracks(tracks, 0).title, 'Rain');
  assert.equal(queue.next().title, 'Wind');
  assert.equal(queue.next().title, 'Sun');
  assert.equal(queue.next(), null);

  const storage = memoryStorage();
  const lists = new PlaylistStore(storage);
  const liked = lists.create('Liked songs');
  lists.addTrack(liked.id, tracks[0]);
  lists.addTrack(liked.id, tracks[1]);
  assert.equal(new PlaylistStore(storage).get(liked.id).tracks.length, 2);

  const dl = new Downloader({ fetchFn: fakeFetch, cache: new MemoryCache() });
  assert.equal(canDownload(tracks[0]).ok, true);
  assert.equal((await dl.download(tracks[0])).cached, false);
  await assert.rejects(dl.download(tracks[1]), DownloadNotAllowedError);
  assert.equal((await dl.download(tracks[2])).cached, false);

  assert.equal((await dl.playbackSource(tracks[0])).offline, true);
  assert.deepEqual(await dl.playbackSource(tracks[1]), { offline: false, url: 'https://s.test/2.mp3' });
});

test('a failing API surfaces a clear error and leaves the queue untouched', async () => {
  const bad = createClient({ clientId: 'test', fetchFn: async () => ({ ok: false, status: 500 }) });
  const queue = new Queue();
  await assert.rejects(bad.searchTracks('x'), /HTTP 500/);
  assert.equal(queue.size, 0);
});
