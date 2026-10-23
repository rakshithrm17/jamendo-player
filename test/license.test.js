import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseLicense, canDownload, attributionText } from '../src/license.js';
import { track } from './helpers.js';

test('parses by-nc-sa', () => {
  const l = parseLicense('http://creativecommons.org/licenses/by-nc-sa/3.0/');
  assert.equal(l.code, 'cc-by-nc-sa');
  assert.equal(l.commercial, false);
  assert.equal(l.shareAlike, true);
  assert.equal(l.noDerivs, false);
  assert.equal(l.attribution, true);
});
test('parses plain by as commercial-friendly', () => {
  const l = parseLicense('https://creativecommons.org/licenses/by/4.0/');
  assert.equal(l.code, 'cc-by');
  assert.equal(l.commercial, true);
});
test('parses cc0 public domain dedication', () => {
  const l = parseLicense('https://creativecommons.org/publicdomain/zero/1.0/');
  assert.equal(l.code, 'cc0');
  assert.equal(l.attribution, false);
});
test('rejects unknown, malformed and non-string input', () => {
  assert.equal(parseLicense('https://example.com/all-rights-reserved'), null);
  assert.equal(parseLicense('https://creativecommons.org/licenses/xx-nc/3.0/'), null);
  assert.equal(parseLicense(undefined), null);
});
test('canDownload: allowed with offered download and known licence', () => {
  const r = canDownload(track(1));
  assert.equal(r.ok, true);
  assert.equal(r.license.code, 'cc-by-nc-sa');
});
test('canDownload: blocked when provider does not offer download', () => {
  assert.deepEqual(canDownload(track(1, { downloadAllowed: false })), { ok: false, reason: 'download-not-offered' });
  assert.deepEqual(canDownload(track(1, { downloadUrl: '' })), { ok: false, reason: 'download-not-offered' });
});
test('canDownload: blocked for unknown licence', () => {
  assert.deepEqual(canDownload(track(1, { licenseUrl: '' })), { ok: false, reason: 'unknown-license' });
});
test('attribution text includes title, artist and licence', () => {
  const t = attributionText(track(7));
  assert.match(t, /Song 7/);
  assert.match(t, /Artist/);
  assert.match(t, /CC BY-NC-SA/);
});
test('attribution text works without a licence', () => {
  assert.equal(attributionText(track(7, { licenseUrl: '' })), '"Song 7" by Artist');
});
