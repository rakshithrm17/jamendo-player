// Block 3: play queue with shuffle and repeat (random source is injected for tests).
export class Queue {
  #tracks = [];
  #order = [];
  #pos = -1;
  #shuffle = false;
  #repeat = 'off';
  #rng;

  constructor({ rng = Math.random } = {}) { this.#rng = rng; }

  get size() { return this.#tracks.length; }
  get repeat() { return this.#repeat; }
  get shuffle() { return this.#shuffle; }
  list() { return this.#order.map((i) => this.#tracks[i]); }
  current() { return this.#pos >= 0 ? this.#tracks[this.#order[this.#pos]] : null; }

  #rebuild(start) {
    const n = this.#tracks.length;
    const idx = this.#tracks.map((_, i) => i);
    const s = n ? Math.min(Math.max(start, 0), n - 1) : -1;
    if (this.#shuffle) {
      for (let i = n - 1; i > 0; i--) {
        const j = Math.floor(this.#rng() * (i + 1));
        [idx[i], idx[j]] = [idx[j], idx[i]];
      }
      const k = idx.indexOf(s);
      if (k > 0) [idx[0], idx[k]] = [idx[k], idx[0]];
    }
    this.#order = idx;
    this.#pos = n ? idx.indexOf(s) : -1;
  }

  setTracks(tracks, start = 0) { this.#tracks = [...tracks]; this.#rebuild(start); return this.current(); }

  next() {
    const n = this.#order.length;
    if (!n) return null;
    if (this.#repeat === 'one') return this.current();
    if (this.#pos + 1 < n) this.#pos++;
    else if (this.#repeat === 'all') this.#pos = 0;
    else return null;
    return this.current();
  }

  prev() {
    const n = this.#order.length;
    if (!n) return null;
    if (this.#pos > 0) this.#pos--;
    else if (this.#repeat === 'all') this.#pos = n - 1;
    return this.current();
  }

  add(track) {
    this.#tracks.push(track);
    this.#order.push(this.#tracks.length - 1);
    if (this.#pos === -1) this.#pos = 0;
  }

  playNext(track) {
    if (this.#pos === -1) return this.add(track);
    this.#tracks.push(track);
    this.#order.splice(this.#pos + 1, 0, this.#tracks.length - 1);
  }

  remove(id) {
    const idx = this.#tracks.findIndex((t) => t.id === id);
    if (idx < 0) return false;
    const removedAt = this.#order.indexOf(idx);
    this.#tracks.splice(idx, 1);
    this.#order = this.#order.filter((i) => i !== idx).map((i) => (i > idx ? i - 1 : i));
    if (removedAt < this.#pos) this.#pos--;
    if (this.#pos >= this.#order.length) this.#pos = this.#order.length - 1;
    return true;
  }

  toggleShuffle() {
    const currentIdx = this.#pos >= 0 ? this.#order[this.#pos] : 0;
    this.#shuffle = !this.#shuffle;
    this.#rebuild(currentIdx);
    return this.#shuffle;
  }

  setRepeat(mode) {
    if (!['off', 'all', 'one'].includes(mode)) throw new Error(`Invalid repeat mode: ${mode}`);
    this.#repeat = mode;
  }
}
