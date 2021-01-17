
const cacheName = 'sswapp-v1.0.1';
const staticAssets = [
    '/',
    '/index.html',
    '/js/main.js',
    '/js/plotly-latest.min.js',
    '/js/tweenMax.min.js',
    '/css/main.css',
    '/images/commets.svg',
    '/images/deimosgiff.gif',
    '/images/icon_compass.svg',
    '/images/icon_earth.svg',
    '/images/icon_jupiter.svg',
    '/images/icon_location.svg',
    '/images/icon_mars.svg',
    '/images/icon_mercury.svg',
    '/images/icon_neptune.svg',
    '/images/icon_preferences.svg',
    '/images/icon_pressure.svg',
    '/images/icon_saturn.svg',
    '/images/icon_solarsystem.svg',
    '/images/icon_temperature.svg',
    '/images/icon_uranus.svg',
    '/images/icon_venus.svg',
    '/images/icon_wind.svg',
    '/images/moon_first_quarter.svg',
    '/images/moon_full.svg',
    '/images/moon_last_quarter.svg',
    '/images/moon_new.svg',
    '/images/moon_waning_crescent.svg',
    '/images/moon_waning_gibbous.svg',
    '/images/moon_waxing_crescent.svg',
    '/images/moon_waxing_gibbous.svg',
    '/images/phobosgiff.gif',
    '/images/planet_earth.svg',
    '/images/planet_jupiter.svg',
    '/images/planet_mars.svg',
    '/images/planet_mercury.svg',
    '/images/planet_neptune.svg',
    '/images/planet_saturn.svg',
    '/images/planet_uranus.svg',
    '/images/planet_venus.svg',
    '/images/profile_astro.svg',
    '/images/stars.svg',
    '/images/sun.svg',
    'favicon.ico',
    '/images/android-icon-192x192.png',
    'manifest.webmanifest'
];

self.addEventListener('install', async (e) => {
    const cache = await caches.open(cacheName);
    await cache.addAll(staticAssets);
    return self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    self.clients.claim();
    e.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(keys
                .filter(key => key !== cacheName)
                .map(key => caches.delete(key)))
        })
    );
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request)
        .then(cacheRes => {
            return cacheRes || fetch(e.request);
        })
    )
} );