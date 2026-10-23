// Block 4: playlists persisted through any storage with getItem/setItem (localStorage in the browser).
export class PlaylistStore {
  #storage;
  #key;
  #idGen;
  #data;

  constructor(storage, { key = 'playlists', idGen } = {}) {
    this.#storage = storage;
    this.#key = key;
    this.#idGen = idGen || (() => `pl_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`);
    try { this.#data = JSON.parse(storage.getItem(key) || '{}'); } catch { this.#data = {}; }
  }

  #save() { this.#storage.setItem(this.#key, JSON.stringify(this.#data)); }
  #need(id) {
    const p = this.#data[id];
    if (!p) throw new Error('Playlist not found');
    return p;
  }

  list() { return Object.values(this.#data).map((p) => structuredClone(p)); }
  get(id) { return structuredClone(this.#need(id)); }

  create(name) {
    const n = String(name ?? '').trim();
    if (!n) throw new Error('Playlist name is required');
    const id = this.#idGen();
    this.#data[id] = { id, name: n, tracks: [] };
    this.#save();
    return structuredClone(this.#data[id]);
  }

  rename(id, name) {
    const n = String(name ?? '').trim();
    if (!n) throw new Error('Playlist name is required');
    this.#need(id).name = n;
    this.#save();
  }

  delete(id) { this.#need(id); delete this.#data[id]; this.#save(); }

  addTrack(id, track) {
    const p = this.#need(id);
    if (p.tracks.some((t) => t.id === track.id)) return false;
    p.tracks.push(structuredClone(track));
    this.#save();
    return true;
  }

  removeTrack(id, trackId) {
    const p = this.#need(id);
    const before = p.tracks.length;
    p.tracks = p.tracks.filter((t) => t.id !== trackId);
    this.#save();
    return p.tracks.length < before;
  }
}
