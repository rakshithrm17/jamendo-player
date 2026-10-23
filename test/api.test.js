import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createClient, mapTrack, JamendoError } from '../src/api.js';

const RAW = { id: 42, name: 'Rain', artist_name: 'Ana', album_name: 'Weather', duration: '95', image: 'i.jpg', audio: 'https://s/42.mp3', audiodownload: 'https://d/42.mp3', audiodownload_allowed: true, license_ccurl: 'http://creativecommons.org/licenses/by/3.0/' };
const ok = (results) => async () => ({ ok: true, status: 200, json: async () => ({ headers: { status: 'success' }, results }) });

test('mapTrack normalises fields', () => {
  assert.deepEqual(mapTrack(RAW), {
    id: '42', title: 'Rain', artist: 'Ana', album: 'Weather', duration: 95, image: 'i.jpg',
    streamUrl: 'https://s/42.mp3', downloadUrl: 'https://d/42.mp3', downloadAllowed: true,
    licenseUrl: 'http://creativecommons.org/licenses/by/3.0/',
  });
});
test('mapTrack handles missing optional fields', () => {
  const t = mapTrack({ id: 1, name: 'x', artist_name: 'y' });
  assert.equal(t.album, '');
  assert.equal(t.downloadAllowed, false);
  assert.equal(t.duration, 0);
});
test('requires a client id', () => {
  assert.throws(() => createClient({}), /clientId is required/);
});
test('searchTracks sends the right request and maps results', async () => {
  let seen;
  const client = createClient({ clientId: 'abc', fetchFn: async (u) => { seen = new URL(u); return ok([RAW])(); }, base: 'https://api.test/v3.0' });
  const out = await client.searchTracks('rain', { limit: 5, offset: 10 });
  assert.equal(seen.pathname, '/v3.0/tracks/');
  assert.equal(seen.searchParams.get('client_id'), 'abc');
  assert.equal(seen.searchParams.get('search'), 'rain');
  assert.equal(seen.searchParams.get('limit'), '5');
  assert.equal(seen.searchParams.get('offset'), '10');
  assert.equal(out[0].id, '42');
});
test('popularTracks orders by monthly popularity', async () => {
  let seen;
  const client = createClient({ clientId: 'abc', fetchFn: async (u) => { seen = new URL(u); return ok([])(); } });
  await client.popularTracks();
  assert.equal(seen.searchParams.get('order'), 'popularity_month');
});
test('throws JamendoError on HTTP failure', async () => {
  const client = createClient({ clientId: 'abc', fetchFn: async () => ({ ok: false, status: 503 }) });
  await assert.rejects(client.searchTracks('x'), (e) => e instanceof JamendoError && /503/.test(e.message));
});
test('throws JamendoError with the API message on failure status', async () => {
  const client = createClient({ clientId: 'abc', fetchFn: async () => ({ ok: true, status: 200, json: async () => ({ headers: { status: 'failed', error_message: 'Invalid client_id' } }) }) });
  await assert.rejects(client.searchTracks('x'), /Invalid client_id/);
});
test('returns an empty list when there are no results', async () => {
  const client = createClient({ clientId: 'abc', fetchFn: ok(undefined) });
  assert.deepEqual(await client.searchTracks('zzz'), []);
});
