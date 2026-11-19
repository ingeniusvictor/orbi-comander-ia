/**
 * ORBI — MÓDULO 17A Fase 3: service worker para abrir la app sin señal.
 *
 * - Nunca guarda respuestas de la API (/api/*): los datos van por la cola de sincronización.
 * - Páginas: primero la red (con límite de 4 s, para no quedar esperando con señal débil);
 *   sin señal o si tarda, la última versión buena guardada de la app.
 * - Archivos de la app (/assets/*, con nombre versionado): se guardan al descargarlos y se
 *   eliminan los que ya no usa la versión vigente.
 */
const CACHE = 'orbi-shell-v2';
const SHELL = ['/', '/manifest.webmanifest', '/icon.svg'];
const NAV_TIMEOUT_MS = 4000;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/** Guarda la página nueva y borra los archivos /assets/ que ya no referencia. */
async function storeShell(res) {
  const html = await res.clone().text();
  const cache = await caches.open(CACHE);
  await cache.put('/', res);
  for (const req of await cache.keys()) {
    const path = new URL(req.url).pathname;
    if (path.startsWith('/assets/') && !html.includes(path)) await cache.delete(req);
  }
}

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  if (req.mode === 'navigate') {
    const network = fetch(req);
    // Si la red responde bien (aunque sea después del límite), se actualiza la copia guardada
    event.waitUntil(network.then((res) => (res.ok ? storeShell(res.clone()) : null)).catch(() => null));
    event.respondWith(
      withTimeout(network, NAV_TIMEOUT_MS)
        .then((res) => (res.ok ? res : caches.match('/').then((cached) => cached || res)))
        .catch(() => caches.match('/').then((cached) => cached || Response.error()))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res.ok && (url.pathname.startsWith('/assets/') || SHELL.includes(url.pathname))) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      });
    })
  );
});
