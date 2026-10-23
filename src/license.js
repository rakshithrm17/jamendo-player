// Block 1: Creative Commons licence parsing and the download gate.
const RE = /creativecommons\.org\/(licenses|publicdomain)\/([a-z0-9-]+)\/([\d.]+)/i;
const PARTS = new Set(['by', 'nc', 'sa', 'nd']);

export function parseLicense(url) {
  if (typeof url !== 'string') return null;
  const m = url.match(RE);
  if (!m) return null;
  const kind = m[1].toLowerCase();
  const code = m[2].toLowerCase();
  if (kind === 'publicdomain') {
    if (code !== 'zero' && code !== 'mark') return null;
    return { code: code === 'zero' ? 'cc0' : 'pdm', attribution: false, commercial: true, shareAlike: false, noDerivs: false, url };
  }
  const parts = code.split('-');
  if (parts[0] !== 'by' || !parts.every((p) => PARTS.has(p))) return null;
  return {
    code: `cc-${code}`,
    attribution: true,
    commercial: !parts.includes('nc'),
    shareAlike: parts.includes('sa'),
    noDerivs: parts.includes('nd'),
    url,
  };
}

// A track may be saved only if the provider offers a download AND the licence is recognised.
export function canDownload(track) {
  if (!track || !track.downloadAllowed || !track.downloadUrl) return { ok: false, reason: 'download-not-offered' };
  const license = parseLicense(track.licenseUrl);
  if (!license) return { ok: false, reason: 'unknown-license' };
  return { ok: true, license };
}

export function attributionText(track) {
  const base = `"${track.title}" by ${track.artist}`;
  const lic = parseLicense(track.licenseUrl);
  return lic ? `${base}, licensed ${lic.code.toUpperCase().replace('CC-', 'CC ')} (${lic.url})` : base;
}
