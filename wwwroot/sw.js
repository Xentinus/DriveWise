// DriveWise Service Worker
const CACHE_NAME = 'driveWise-v1.0.1';
const OFFLINE_URL = '/offline.html';

// Essential files to cache for offline functionality
const ESSENTIAL_FILES = [
  '/',
  '/css/site.css',
  '/css/modal-manager.css',
  '/css/map.css',
  '/css/weather-widget.css',
  '/css/pwa.css',
  '/js/storage-manager.js',
  '/js/theme-manager.js',
  '/js/map.js',
  '/js/search.js',
  '/js/bottom-nav.js',
  '/js/modal-manager.js',
  '/js/weather-widget.js',
  '/js/pwa.js',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon.svg'
];

// Install event - cache essential files with error handling
self.addEventListener('install', event => {
  console.log('[ServiceWorker] Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[ServiceWorker] Caching essential files');
        // Cache files individually to handle failures better
        return Promise.allSettled(
          ESSENTIAL_FILES.map(url => {
            return fetch(url, {
              cache: 'no-cache',
              headers: {
                'Cache-Control': 'no-cache'
              }
            }).then(response => {
              if (response.ok) {
                return cache.put(url, response);
              } else {
                console.warn('[ServiceWorker] Failed to fetch for cache:', url, response.status);
              }
            }).catch(error => {
              console.warn('[ServiceWorker] Error caching:', url, error);
            });
          })
        );
      })
      .then(results => {
        const failed = results.filter(r => r.status === 'rejected');
        if (failed.length > 0) {
          console.warn('[ServiceWorker] Some files failed to cache:', failed.length);
        }
        console.log('[ServiceWorker] Cache initialization completed');
      })
      .catch(error => {
        console.error('[ServiceWorker] Failed to open cache:', error);
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

// Handle messages from the main thread
self.addEventListener('message', event => {
  console.log('[ServiceWorker] Message received:', event.data);
  
  if (event.data && event.data.action === 'clearCache') {
    console.log('[ServiceWorker] Clearing all caches...');
    
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            console.log('[ServiceWorker] Deleting cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      }).then(() => {
        console.log('[ServiceWorker] All caches cleared successfully');
        // Notify the main thread that cache clearing is complete
        event.ports[0]?.postMessage({ success: true, message: 'Cache cleared' });
      }).catch(error => {
        console.error('[ServiceWorker] Cache clearing failed:', error);
        event.ports[0]?.postMessage({ success: false, error: error.message });
      })
    );
  }
  
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});

// Fetch event - serve from cache when offline with network-first strategy
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip requests for extensions or chrome-extension
  if (event.request.url.includes('extension') || event.request.url.includes('chrome-extension')) {
    return;
  }

  // Skip requests with cache-busting parameters for fresh content
  const url = new URL(event.request.url);
  const hasCacheBusting = url.searchParams.has('v') || url.searchParams.has('_t') || url.searchParams.has('_reset');

  event.respondWith(
    // Try network first for fresh content
    fetch(event.request)
      .then(response => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone the response for caching
        const responseToCache = response.clone();

        // Only cache if it's a cacheable resource and doesn't have cache-busting params
        if (shouldCache(event.request.url) && !hasCacheBusting) {
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            })
            .catch(error => {
              console.warn('[ServiceWorker] Failed to cache response:', error);
            });
        }

        return response;
      })
      .catch(error => {
        console.log('[ServiceWorker] Network failed, trying cache:', error);
        
        // Try to serve from cache
        return caches.match(event.request)
          .then(response => {
            if (response) {
              console.log('[ServiceWorker] Serving from cache:', event.request.url);
              return response;
            }
            
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
  // Cache CSS, JS, images, and essential HTML files
  return url.includes('.css') || 
         url.includes('.js') || 
         url.includes('.png') || 
         url.includes('.jpg') || 
         url.includes('.jpeg') || 
         url.includes('.gif') || 
         url.includes('.svg') || 
         url.includes('.ico') || 
         url.includes('manifest.json') ||
         url.includes('offline.html') ||
         url.endsWith('/');
}

// Handle push notifications (for future use)
self.addEventListener('push', event => {
  console.log('[ServiceWorker] Push received');
  
  const options = {
    body: event.data ? event.data.text() : 'DriveWise értesítés',
    icon: '/icons/icon.svg',
    badge: '/icons/icon.svg',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Megnyitás',
        icon: '/icons/icon.svg'
      },
      {
        action: 'close',
        title: 'Bezárás',
        icon: '/icons/icon.svg'
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