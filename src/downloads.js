// Block 5b: licence-gated downloader. Never fetches a track unless canDownload() says yes.
import { canDownload } from './license.js';

export class DownloadNotAllowedError extends Error {
  constructor(reason) {
    super(`Download not allowed: ${reason}`);
    this.name = 'DownloadNotAllowedError';
    this.reason = reason;
  }
}

export class Downloader {
  constructor({ fetchFn = globalThis.fetch, cache, now = () => Date.now() } = {}) {
    if (!cache) throw new Error('cache is required');
    this.fetchFn = fetchFn;
    this.cache = cache;
    this.now = now;
  }

  async download(track) {
    const check = canDownload(track);
    if (!check.ok) throw new DownloadNotAllowedError(check.reason);
    if (await this.cache.has(track.id)) return { id: track.id, cached: true };
    const res = await this.fetchFn(track.downloadUrl);
    if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`);
    const blob = await res.blob();
    await this.cache.put(track.id, blob, { track, license: check.license, savedAt: this.now() });
    return { id: track.id, cached: false, size: blob.size };
  }

  // Offline copy if we have one, otherwise the stream URL.
  async playbackSource(track) {
    const blob = await this.cache.get(track.id);
    return blob ? { offline: true, blob } : { offline: false, url: track.streamUrl };
  }
}
