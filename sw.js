// Dispo — Service Worker für Offline-Zugriff
// Cached die App-Shell (index.html), damit die Seite auch ohne Netz öffnet.
// Ticket-/Dispo-Daten selbst liegen bereits lokal in IndexedDB/localStorage —
// dieser Worker sorgt nur dafür, dass die Seite überhaupt startet.

const CACHE = 'dispo-shell-v1';
const SHELL_URLS = ['./', './index.html'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL_URLS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Nur eigene GET-Anfragen auf die App-Shell behandeln.
  // API-Calls (z.B. api.anthropic.com) und alles Cross-Origin bleiben unangetastet.
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((cache) => cache.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req).then((cached) => cached || caches.match('./index.html')))
  );
});
