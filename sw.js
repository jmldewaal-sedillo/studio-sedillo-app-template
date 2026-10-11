// ============================================================
// SERVICE WORKER – {{APP_NAAM}}
// Only in the build target web (and the test version): the Android app and the portal
// builds have all files on board and no service worker (tools/bouw.mjs leaves this file out).
// Keeps the files of the app on the device, so it works without internet.
// Paths are relative, so the same file works on the live and the test address.
//
// Raise CACHE_VERSION with every change to the app (Apps/CLAUDE.md, section 7),
// otherwise users keep the old files.
// ============================================================
const CACHE_VERSION = '{{SLUG}}-v1';

// Filled in by the deploy of the test copy (commit id), so every push to the
// test address is a new version without touching CACHE_VERSION.
const BUILD = '';
const CACHE_FAMILY = '{{SLUG}}-';
const CACHE_NAME = CACHE_VERSION + (BUILD ? '-' + BUILD : '');

// Every file the app needs. tests/offline.spec.js fails if one is missing.
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './config.js',
  './platform/web.js',
  './storage.js',
  './i18n/nl.js',
  './i18n/en.js',
  './common.js',
  './app.js',
  './pages.js',
  './redirect.js',
  './manifest.webmanifest',
  './privacy.html',
  './delete.html',
  './verwijderen.html',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
];

// Install: fetch every file fresh from the server (never from the browser's
// HTTP cache, or a new version could be built from old files).
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS.map(url => new Request(url, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

// Activate: remove our own older caches.
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith(CACHE_FAMILY) && k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// /privacy and /delete are served by GitHub Pages from privacy.html and delete.html.
function cacheKey(request) {
  const url = new URL(request.url);
  if (request.mode === 'navigate' && !/\.[a-z0-9]+$/i.test(url.pathname) && !url.pathname.endsWith('/')) return url.origin + url.pathname + '.html';
  return request;
}

// Cache-first for our own files; offline fallback to the start page.
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.match(cacheKey(request), { ignoreSearch: request.mode === 'navigate' }).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        }
        return response;
      }).catch(() => {
        if (request.mode === 'navigate') return caches.match('./index.html');
        return Response.error();
      });
    })
  );
});
