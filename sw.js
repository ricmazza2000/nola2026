// Peccioli Eyes PWA — Service Worker v3            const responseClone = response.clone();
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
