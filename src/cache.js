// Block 5a: in-memory file cache (used in tests and as a fallback). Same interface as web/idb-cache.js.
export class MemoryCache {
  #m = new Map();
  async put(id, blob, meta = {}) { this.#m.set(id, { blob, meta }); }
  async get(id) { return this.#m.get(id)?.blob ?? null; }
  async has(id) { return this.#m.has(id); }
  async delete(id) { return this.#m.delete(id); }
  async list() { return [...this.#m.entries()].map(([id, v]) => ({ id, ...v.meta })); }
}
