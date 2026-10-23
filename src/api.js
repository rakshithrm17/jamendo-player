// Block 2: Jamendo API client (fetch is injected so it can be tested without a network).
const BASE = 'https://api.jamendo.com/v3.0';

export class JamendoError extends Error {}

export function mapTrack(r) {
  return {
    id: String(r.id),
    title: r.name,
    artist: r.artist_name,
    album: r.album_name || '',
    duration: Number(r.duration) || 0,
    image: r.image || '',
    streamUrl: r.audio || '',
    downloadUrl: r.audiodownload || '',
    downloadAllowed: Boolean(r.audiodownload_allowed),
    licenseUrl: r.license_ccurl || '',
  };
}

export function createClient({ clientId, fetchFn = globalThis.fetch, base = BASE } = {}) {
  if (!clientId) throw new Error('clientId is required');

  async function call(path, params = {}) {
    const query = new URLSearchParams({ client_id: clientId, format: 'json', ...params });
    const res = await fetchFn(`${base}/${path}/?${query}`);
    if (!res.ok) throw new JamendoError(`HTTP ${res.status}`);
    const body = await res.json();
    if (body?.headers?.status !== 'success') {
      throw new JamendoError(body?.headers?.error_message || 'Jamendo request failed');
    }
    return (body.results || []).map(mapTrack);
  }

  return {
    searchTracks: (text, { limit = 20, offset = 0 } = {}) => call('tracks', { search: text, limit, offset }),
    popularTracks: ({ limit = 20, offset = 0 } = {}) => call('tracks', { order: 'popularity_month', limit, offset }),
  };
}
