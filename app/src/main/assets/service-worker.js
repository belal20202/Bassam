/**
 * بسام (Bassam Runner) - Offline Service Worker
 * Ensures 100% offline functionality on mobile and desktop browsers.
 */

const CACHE_NAME = "bassam-runner-v1.0.0";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./style.css",
  "./config.js",
  "./utils.js",
  "./save.js",
  "./audio.js",
  "./powerups.js",
  "./obstacles.js",
  "./world.js",
  "./player.js",
  "./enemy.js",
  "./missions.js",
  "./shop.js",
  "./rewards.js",
  "./leaderboard.js",
  "./ui.js",
  "./game.js",
  "./manifest.json",
  "./app/src/main/res/drawable/bassam_icon.jpg",
  "./app/src/main/res/drawable/bassam_poster.jpg"
];

// Install Event: pre-cache assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: purge outdated cache versions
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Cache first, fallback to network
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== "basic") {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        // Fallback for offline if not cached
        return caches.match("./index.html");
      });
    })
  );
});
