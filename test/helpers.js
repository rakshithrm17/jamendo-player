export const track = (id, extra = {}) => ({
  id: String(id), title: `Song ${id}`, artist: 'Artist', album: '', duration: 120, image: '',
  streamUrl: `https://stream.example/${id}.mp3`, downloadUrl: `https://dl.example/${id}.mp3`,
  downloadAllowed: true, licenseUrl: 'http://creativecommons.org/licenses/by-nc-sa/3.0/', ...extra,
});
export const memoryStorage = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) };
};
