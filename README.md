# Jamendo Player

A personal music player (installable web app) for Jamendo's Creative Commons catalogue.
Search, queue, shuffle, repeat, liked songs and licence-checked offline downloads.

Songs from commercial services (Spotify, YouTube, JioSaavn and similar) are not supported by design.

## Blocks

| File | Job |
|------|-----|
| `src/license.js` | Parse Creative Commons licence URLs and decide whether a track may be saved |
| `src/api.js` | Jamendo API client (fetch injected for tests) |
| `src/queue.js` | Play queue with shuffle and repeat |
| `src/playlists.js` | Playlists stored in localStorage |
| `src/downloads.js`, `src/cache.js` | Licence-gated downloader and file cache |
| `web/` | The app: HTML, UI wiring, IndexedDB cache, service worker |

## Run the tests

Node 18 or newer, no dependencies to install:

```
npm test
```

Unit tests cover every block. `test/integration.test.js` runs search, queue, playlists and downloads together against a fake network.

## Run the app

1. Get a free client ID at https://devportal.jamendo.com (non-commercial use).
2. From the repo root run `npm run serve` and open http://localhost:8080/web/
3. Paste your client ID when asked.
4. On iPhone, host the repo folder on any HTTPS static host (for example GitHub Pages), open it in Safari, then Share > Add to Home Screen.

## Licences

Each track has its own Creative Commons licence. The app shows attribution for the playing track and only enables Download when Jamendo allows it and the licence is recognised. Personal, non-commercial use only. Check a track's licence before sharing or reusing it.

## Known limits

- Offline storage and background audio on iPhone web apps can be limited by iOS. Test on your device.
- Not yet tested against the live Jamendo API from this build environment; the tests use a fake network.
