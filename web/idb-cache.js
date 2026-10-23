// Browser file cache backed by IndexedDB. Same interface as src/cache.js.
const open = () => new Promise((res, rej) => {
  const r = indexedDB.open('jamendo-player', 1);
  r.onupgradeneeded = () => r.result.createObjectStore('files');
  r.onsuccess = () => res(r.result);
  r.onerror = () => rej(r.error);
});
const run = async (mode, fn) => {
  const db = await open();
  return new Promise((res, rej) => {
    const store = db.transaction('files', mode).objectStore('files');
    const q = fn(store);
    q.onsuccess = () => res(q.result);
    q.onerror = () => rej(q.error);
  });
};
export class IdbCache {
  put(id, blob, meta = {}) { return run('readwrite', (s) => s.put({ blob, meta }, id)); }
  async get(id) { return (await run('readonly', (s) => s.get(id)))?.blob ?? null; }
  async has(id) { return (await run('readonly', (s) => s.count(id))) > 0; }
  delete(id) { return run('readwrite', (s) => s.delete(id)); }
  async list() { const all = await run('readonly', (s) => s.getAll()); return all.map((v) => v.meta); }
}
