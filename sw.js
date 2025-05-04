// Service Worker for Pixabay Image Search App
const CACHE_NAME = 'pixabay-image-search-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/icon.png',
  '/icon-512.png',
  '/manifest.json'
];

// Install event - cache the essential files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('Cache opening failed:', err);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch event - serve from cache if available, otherwise fetch from network
self.addEventListener('fetch', event => {
  // Skip Pixabay API requests - we don't want to cache these
  if (event.request.url.includes('pixabay.com/api')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return the response from the cached version
        if (response) {
          return response;
        }
        
        // Not in cache - fetch and cache the response
        return fetch(event.request)
          .then(response => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(err => {
            console.error('Fetch failed:', err);
            // You might want to return a custom offline page here
            if (event.request.mode === 'navigate') {
              return caches.match('index.html');
            }
          });
      })
  );
});

// Handle messages from the main thread
self.addEventListener('message', event => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
