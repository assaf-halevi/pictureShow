// Cache name can stay the same unless you want to force a full refresh
const CACHE_NAME = 'heart-popper-v1';

// Files to pre-cache (for offline support)
const FILES_TO_CACHE = [
  'index.html',
  'icon.png',
  'icon-512.png'
];

// Install event: Cache initial files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching initial files');
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  // Activate the new service worker immediately
  self.skipWaiting();
});

// Activate event: Optional cleanup of old caches (if you change CACHE_NAME later)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('Deleting old cache:', name);
            return caches.delete(name);
          }
        })
      );
    })
  );
  // Take control of the page immediately
  self.clients.claim();
});

// Fetch event: Network-first strategy
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Update the cache with the fresh response
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      })
      .catch(() => {
        // If network fails (e.g., offline), fall back to cache
        return caches.match(event.request).then((cachedResponse) => {
          return cachedResponse || new Response('Offline and no cache available', { status: 503 });
        });
      })
  );
});
