const CACHE_NAME = 'lap-docs-cache-v3';
const ASSETS = [
  '/icons/favicon-32x32.png',
  '/icons/favicon-16x16.png',
  '/icons/android-chrome-192x192.png',
  '/icons/android-chrome-512x512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS).catch((err) => {
        console.warn('Error pre-caching assets:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const requestedUrl = event.notification.data?.url || '/';
  const destination = new URL(requestedUrl, self.location.origin);
  const safeUrl = destination.origin === self.location.origin ? destination.href : self.location.origin;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      for (const client of windows) {
        if ('navigate' in client && 'focus' in client) {
          return client.navigate(safeUrl).then(() => client.focus());
        }
      }
      return self.clients.openWindow(safeUrl);
    })
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // Never cache HTML/documents — Next.js chunk hashes change every deploy.
  // Cache-first HTML is what caused ChunkLoadError / MIME text/html 404s.
  const isDocument =
    event.request.mode === 'navigate' ||
    event.request.destination === 'document' ||
    (event.request.headers.get('accept') || '').includes('text/html');

  if (isDocument || url.pathname.startsWith('/_next/') || url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    })
  );
});
