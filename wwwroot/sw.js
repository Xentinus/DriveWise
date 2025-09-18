// DriveWise Service Worker
const CACHE_NAME = 'driveWise-v1.0.0';
const OFFLINE_URL = '/offline.html';

// Essential files to cache for offline functionality
const ESSENTIAL_FILES = [
  '/',
  '/css/site.css',
  '/css/modal-manager.css',
  '/css/map.css',
  '/css/weather-widget.css',
  '/js/storage-manager.js',
  '/js/theme-manager.js',
  '/js/map.js',
  '/js/search.js',
  '/js/bottom-nav.js',
  '/js/modal-manager.js',
  '/js/weather-widget.js',
  '/manifest.json',
  '/favicon.ico'
];

// Install event - cache essential files
self.addEventListener('install', event => {
  console.log('[ServiceWorker] Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[ServiceWorker] Caching essential files');
        return cache.addAll(ESSENTIAL_FILES);
      })
      .catch(error => {
        console.error('[ServiceWorker] Failed to cache essential files:', error);
      })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[ServiceWorker] Activate');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Ensure the service worker takes control of all clients immediately
  return self.clients.claim();
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip requests for extensions or chrome-extension
  if (event.request.url.includes('extension') || event.request.url.includes('chrome-extension')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        if (response) {
          console.log('[ServiceWorker] Serving from cache:', event.request.url);
          return response;
        }

        return fetch(event.request)
          .then(response => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response for caching
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                // Cache important resources
                if (shouldCache(event.request.url)) {
                  cache.put(event.request, responseToCache);
                }
              });

            return response;
          })
          .catch(error => {
            console.log('[ServiceWorker] Fetch failed, serving offline page:', error);
            // Return offline page for navigation requests
            if (event.request.destination === 'document') {
              return caches.match(OFFLINE_URL);
            }
            throw error;
          });
      })
  );
});

// Helper function to determine if a URL should be cached
function shouldCache(url) {
  // Cache CSS, JS, images, and HTML files
  return url.includes('.css') || 
         url.includes('.js') || 
         url.includes('.png') || 
         url.includes('.jpg') || 
         url.includes('.jpeg') || 
         url.includes('.gif') || 
         url.includes('.svg') || 
         url.includes('.ico') || 
         url.endsWith('/') ||
         !url.includes('.');
}

// Handle push notifications (for future use)
self.addEventListener('push', event => {
  console.log('[ServiceWorker] Push received');
  
  const options = {
    body: event.data ? event.data.text() : 'DriveWise értesítés',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Megnyitás',
        icon: '/icons/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'Bezárás',
        icon: '/icons/icon-192x192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('DriveWise', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('[ServiceWorker] Notification click received.');

  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});