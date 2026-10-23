import { createClient } from '../src/api.js';
import { Queue } from '../src/queue.js';
import { PlaylistStore } from '../src/playlists.js';
import { Downloader } from '../src/downloads.js';
import { canDownload, attributionText } from '../src/license.js';
import { IdbCache } from './idb-cache.js';

const $ = (s) => document.querySelector(s);
const h = (tag, props = {}, ...kids) => { const e = Object.assign(document.createElement(tag), props); e.append(...kids); return e; };
const queue = new Queue();
const lists = new PlaylistStore(localStorage);
const dl = new Downloader({ cache: new IdbCache() });
const audio = $('#audio');
let client = null, objUrl = null;
const say = (t) => { $('#msg').textContent = t; };

function setupClient() {
  const id = localStorage.getItem('jamendoClientId');
  client = id ? createClient({ clientId: id }) : null;
  $('#setup').hidden = Boolean(client);
}

async function play(track) {
  const src = await dl.playbackSource(track);
  if (objUrl) URL.revokeObjectURL(objUrl);
  audio.src = src.offline ? (objUrl = URL.createObjectURL(src.blob)) : src.url;
  $('#now').textContent = `${track.title}, ${track.artist}`;
  $('#credit').textContent = attributionText(track);
  if ('mediaSession' in navigator) navigator.mediaSession.metadata = new MediaMetadata({ title: track.title, artist: track.artist });
  audio.play().catch(() => say('Tap play to start.'));
}
const advance = (t) => (t ? play(t) : say('End of queue.'));

function likedId() {
  return (lists.list().find((p) => p.name === 'Liked songs') || lists.create('Liked songs')).id;
}

function render(tracks) {
  const box = $('#results');
  box.replaceChildren(...tracks.map((t, i) => {
    const ok = canDownload(t).ok;
    const dlBtn = h('button', { textContent: 'Download', disabled: !ok, title: ok ? '' : 'This track’s licence or provider does not allow downloads' });
    dlBtn.onclick = async () => { try { const r = await dl.download(t); say(r.cached ? 'Already saved.' : 'Saved for offline.'); } catch (e) { say(e.message); } };
    const playBtn = h('button', { className: 'pri', textContent: 'Play' });
    playBtn.onclick = () => { queue.setTracks(tracks, i); play(tracks[i]); };
    const likeBtn = h('button', { textContent: 'Like' });
    likeBtn.onclick = () => say(lists.addTrack(likedId(), t) ? 'Added to Liked songs.' : 'Already liked.');
    const qBtn = h('button', { textContent: 'Add to queue' });
    qBtn.onclick = () => { queue.add(t); say('Added to queue.'); };
    return h('div', { className: 'track' }, h('div', {}, t.title, h('small', {}, `${t.artist}${t.album ? ' - ' + t.album : ''}`)), h('div', { className: 'acts' }, playBtn, likeBtn, qBtn, dlBtn));
  }));
}

async function load(fn) {
  if (!client) return say('Add your Jamendo client ID first.');
  say('Loading...');
  try { const tracks = await fn(); say(tracks.length ? '' : 'No tracks found.'); render(tracks); } catch (e) { say(e.message); }
}

$('#savecid').onclick = () => { localStorage.setItem('jamendoClientId', $('#cid').value.trim()); setupClient(); };
$('#go').onclick = () => load(() => client.searchTracks($('#q').value.trim()));
$('#pop').onclick = () => load(() => client.popularTracks());
$('#q').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('#go').click(); });
$('#next').onclick = () => advance(queue.next());
$('#prev').onclick = () => { const t = queue.prev(); if (t) play(t); };
$('#shuf').onclick = () => { $('#shuf').textContent = `Shuffle: ${queue.toggleShuffle() ? 'on' : 'off'}`; };
$('#rep').onclick = () => { const m = { off: 'all', all: 'one', one: 'off' }[queue.repeat]; queue.setRepeat(m); $('#rep').textContent = `Repeat: ${m}`; };
audio.addEventListener('ended', () => advance(queue.next()));

setupClient();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
