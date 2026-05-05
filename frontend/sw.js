const CACHE_NAME = 'poshan-abhiyan-v16';
const ASSETS = [
  '/',
  '/intro.html',
  '/login.html',
  '/home.html',
  '/student.html',
  '/pregnant_women.html',
  '/child.html',
  '/attendance.html',
  '/ration.html',
  '/static/fonts.css',
  '/static/fonts/outfit-300.ttf',
  '/static/fonts/outfit-400.ttf',
  '/static/fonts/outfit-600.ttf',
  '/static/fonts/outfit-700.ttf',
  '/static/fonts/outfit-800.ttf',
  '/static/fonts/nunito-300.ttf',
  '/static/fonts/nunito-400.ttf',
  '/static/fonts/nunito-500.ttf',
  '/static/fonts/nunito-600.ttf',
  '/static/fonts/nunito-700.ttf',
  '/static/fonts/nunito-800.ttf',
  '/static/fonts/playfair-700.ttf',
  '/static/fonts/playfair-900.ttf',
  '/static/PA.jpeg',
  '/static/mom.jpeg',
  '/static/PW.jpeg',
  '/static/attend.jpeg',
  '/static/baby.jpeg',
  '/static/stock.jpeg',
  '/static/stud.jpeg',
  '/js/shared/serverGuard.js',
  '/js/config.js'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  // We only cache GET requests for our static assets
  if (event.request.method !== 'GET') return;
  
  // Don't cache API calls - they need live data
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
