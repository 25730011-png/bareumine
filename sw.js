/* 바름이네 — 오프라인 캐시 */
const CACHE = 'bareumine-v1';
const FILES = [
  './', 'index.html', 'css/style.css', 'js/store.js', 'js/sound.js', 'js/sensors.js', 'js/app.js', 'manifest.json',
  'assets/icons/icon-192.png', 'assets/icons/icon-512.png',
  ...['house_rooms', 'house_front', 'bareum_face', 'bareum_full', 'bareum_wave', 'sooki_phone', 'sooki_card', 'sooki_living', 'sooki_done',
      'sukdol_card', 'sukdol_front', 'sukdol_chin', 'sukdol_neck', 'sukdol_chest', 'sukdol_phone', 'sukdol_stretch'].map(n => `assets/img/${n}.webp`)
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then(r => {
      const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy));
      return r;
    }).catch(() => caches.match(e.request))
  );
});
