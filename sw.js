const CACHE_NAME = 'peccioli-eyes-v2';

// All'installazione, metti in cache le risorse base
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll([
        './',
        './index.html',
        './manifest.json',
        './icon-192.png',
        './icon-512.png',
        './apple-touch-icon.png',
        './favicon-32.png',
        './piazza_nola_ponte.png',
        './peccioli_eyes_logo_white.png'
      ]);
    })
  );
  self.skipWaiting();
});

// Attivazione: rimuovi cache vecchie (anche la v1 precedente)
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: servi dalla cache se disponibile, altrimenti rete
self.addEventListener('fetch', event => {
  // Per le richieste all'app Streamlit o Render, vai sempre in rete
  const url = event.request.url;
  if (url.includes('streamlit.app') || url.includes('onrender.com') || url.includes('render.com')) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request);
    })
  );
});
