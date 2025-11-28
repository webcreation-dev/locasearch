/**
 * Locapay - Service Worker
 * PWA implementation for offline functionality
 * Version: 1.0.0
 */

const CACHE_VERSION = 'v1.0.0';
const CACHE_NAMES = {
  static: `ekka-static-${CACHE_VERSION}`,
  pages: `ekka-pages-${CACHE_VERSION}`,
  images: `ekka-images-${CACHE_VERSION}`,
  fonts: `ekka-fonts-${CACHE_VERSION}`,
};

// App Shell - Critical files to pre-cache
const APP_SHELL = [
  './',
  './index.html',
  './offline.html',
  './manifest.json',
  './assets/css/vendor/ecicons.min.css',
  './assets/css/plugins/bootstrap.css',
  './assets/css/demo1.css',
  './assets/css/responsive.css',
  './assets/js/vendor/jquery-3.5.1.min.js',
  './assets/js/vendor/popper.min.js',
  './assets/js/vendor/bootstrap.min.js',
  './assets/js/main.js',
  './assets/js/pwa.js',
  './assets/js/wishlist-manager.js',
  './assets/images/logo/logo.png',
  './assets/images/pwa-icons/icon-192x192.png',
  './assets/images/pwa-icons/icon-512x512.png',
];

// Maximum number of images to cache (LRU eviction)
const MAX_IMAGE_CACHE = 200;

// Install event - Pre-cache app shell
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing...');

  event.waitUntil(
    caches
      .open(CACHE_NAMES.static)
      .then(cache => {
        console.log('[Service Worker] Pre-caching app shell');
        return cache.addAll(APP_SHELL);
      })
      .then(() => {
        console.log('[Service Worker] App shell cached successfully');
        return self.skipWaiting(); // Activate immediately
      })
      .catch(error => {
        console.error('[Service Worker] Pre-caching failed:', error);
      })
  );
});

// Activate event - Clean up old caches
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating...');

  event.waitUntil(
    caches
      .keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => {
              // Delete caches that don't match current version
              return Object.values(CACHE_NAMES).indexOf(cacheName) === -1;
            })
            .map(cacheName => {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[Service Worker] Activated');
        return self.clients.claim(); // Take control immediately
      })
  );
});

// Fetch event - Handle requests with caching strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Choose caching strategy based on request type
  if (request.destination === 'image') {
    event.respondWith(handleImageRequest(request));
  } else if (
    request.destination === 'document' ||
    request.url.endsWith('.html')
  ) {
    event.respondWith(handlePageRequest(request));
  } else if (request.destination === 'font') {
    event.respondWith(handleFontRequest(request));
  } else {
    event.respondWith(handleAssetRequest(request));
  }
});

/**
 * Handle image requests - Cache-first with LRU eviction
 */
async function handleImageRequest(request) {
  const cache = await caches.open(CACHE_NAMES.images);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);

    if (response.ok) {
      // Check cache size and implement LRU eviction
      const keys = await cache.keys();
      if (keys.length >= MAX_IMAGE_CACHE) {
        // Delete oldest cached image
        await cache.delete(keys[0]);
      }

      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.log('[Service Worker] Image fetch failed:', error);
    // Return a placeholder or cached version
    return cached || new Response('Image unavailable', { status: 404 });
  }
}

/**
 * Handle page requests - Network-first with cache fallback
 */
async function handlePageRequest(request) {
  try {
    const response = await fetch(request);

    if (response.ok) {
      // Cache successful page responses
      const cache = await caches.open(CACHE_NAMES.pages);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.log('[Service Worker] Page fetch failed, trying cache:', error);

    // Try cache
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    // Last resort: offline page
    const offlineCache = await caches.match('./offline.html');
    return offlineCache || new Response('Offline', { status: 503 });
  }
}

/**
 * Handle font requests - Cache-first (fonts rarely change)
 */
async function handleFontRequest(request) {
  const cache = await caches.open(CACHE_NAMES.fonts);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[Service Worker] Font fetch failed:', error);
    return new Response('Font unavailable', { status: 404 });
  }
}

/**
 * Handle CSS/JS asset requests - Cache-first with network fallback
 */
async function handleAssetRequest(request) {
  const cache = await caches.open(CACHE_NAMES.static);
  const cached = await cache.match(request);

  if (cached) {
    // Return cached version and update in background
    fetch(request)
      .then(response => {
        if (response.ok) {
          cache.put(request, response.clone());
        }
      })
      .catch(() => {}); // Silently fail background update

    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[Service Worker] Asset fetch failed:', error);
    return new Response('Asset unavailable', { status: 404 });
  }
}

/**
 * Push notification event handler
 */
self.addEventListener('push', event => {
  console.log('[Service Worker] Push notification received');

  const options = {
    body: event.data ? event.data.text() : "Nouvelle notification d'Locapay",
    icon: './assets/images/pwa-icons/icon-192x192.png',
    badge: './assets/images/pwa-icons/icon-96x96.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: 'view',
        title: 'Voir',
        icon: './assets/images/pwa-icons/icon-72x72.png',
      },
      {
        action: 'close',
        title: 'Fermer',
        icon: './assets/images/pwa-icons/icon-72x72.png',
      },
    ],
  };

  event.waitUntil(self.registration.showNotification('Locapay', options));
});

/**
 * Notification click event handler
 */
self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] Notification clicked');

  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(clients.openWindow('./'));
  }
});

/**
 * Check storage quota and warn if low
 */
async function checkStorageQuota() {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    const percentUsed = (estimate.usage / estimate.quota) * 100;

    console.log(
      `[Service Worker] Storage: ${(estimate.usage / 1024 / 1024).toFixed(
        2
      )} MB / ${(estimate.quota / 1024 / 1024).toFixed(
        2
      )} MB (${percentUsed.toFixed(1)}%)`
    );

    if (percentUsed > 80) {
      console.warn(
        '[Service Worker] Storage quota above 80%, consider clearing old caches'
      );
    }
  }
}

// Check storage on activation
self.addEventListener('activate', () => {
  checkStorageQuota();
});

// Message event - Handle messages from clients
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches
        .open(CACHE_NAMES.pages)
        .then(cache => cache.addAll(event.data.urls))
    );
  }

  if (event.data && event.data.type === 'CHECK_STORAGE') {
    checkStorageQuota();
  }
});
