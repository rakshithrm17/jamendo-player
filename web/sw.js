const SHELL = ['./index.html', './app.js', './idb-cache.js', '../src/api.js', '../src/queue.js', '../src/playlists.js', '../src/downloads.js', '../src/license.js'];
self.addEventListener('install', (e) => e.waitUntil(caches.open('shell-v1').then((c) => c.addAll(SHELL))));
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return; // never cache audio or API calls
  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request)));
});
