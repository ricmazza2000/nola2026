// Peccioli Eyes PWA — Service Worker v3
const CACHE_VERSION = 'peccioli-eyes-v3';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

// Risorse statiche da pre-cachare all'installazione
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './peccioli_eyes_logo_white.png',
  './peccioli_eyes_logo_yellow.png',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon-180.png',
  './favicon-32.png',
  './piazza_nola_ponte.png'
];

// INSTALLAZIONE: pre-cache risorse statiche
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
      .catch(err => console.warn('Cache install error:', err))
  );
});

// ATTIVAZIONE: pulisci cache vecchie
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => !k.startsWith(CACHE_VERSION))
          .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// FETCH: strategie diverse per tipo di risorsa
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // Solo GET requests
  if (req.method !== 'GET') return;

  // Portale Streamlit/Render: sempre dalla rete (no cache)
  // Streamlit non funziona bene con cache aggressive
  if (
    url.hostname.includes('onrender.com') ||
    url.hostname.includes('streamlit.app') ||
    url.hostname.includes('streamlit.io')
  ) {
    event.respondWith(
      fetch(req).catch(() => {
        // Se offline, prova a tornare l'index.html
        return caches.match('./index.html');
      })
    );
    return;
  }

  // Risorse statiche locali (icone, manifest, etc.): cache-first
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then(cached => {
        if (cached) return cached;
        return fetch(req).then(response => {
          // Salva in runtime cache per la prossima volta
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE).then(cache => {
              cache.put(req, responseClone);
            });
          }
          return response;
        });
      }).catch(() => {
        // Fallback finale
        if (req.destination === 'document') {
          return caches.match('./index.html');
        }
      })
    );
    return;
  }

  // Altre risorse esterne (font Google, CDN): stale-while-revalidate
  event.respondWith(
    caches.open(RUNTIME_CACHE).then(cache =>
      cache.match(req).then(cached => {
        const fetchPromise = fetch(req).then(response => {
          if (response && response.status === 200) {
            cache.put(req, response.clone());
          }
          return response;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    )
  );
});

// MESSAGGI dall'app (per aggiornamenti manuali)
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
