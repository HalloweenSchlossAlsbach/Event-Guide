// Service Worker für den Event-Guide.
// Bei Änderungen an Dateien VERSION erhöhen (und die ?v= in index.html anpassen) –
// dann wird der alte Cache beim nächsten Besuch automatisch ersetzt.
const VERSION = '2026.3';
const CACHE = `event-guide-${VERSION}`;

const ASSETS = [
    './',
    './index.html',
    `./style.css?v=${VERSION}`,
    `./script.js?v=${VERSION}`,
    './manifest.json',
    './HalloweenSchrift.otf',
    './img/lageplan-2026.jpg',
    './img/logo.png',
    './img/icon-192.png',
    './img/icon-512.png',
];

self.addEventListener('install', (event) => {
    event.waitUntil((async () => {
        const cache = await caches.open(CACHE);
        await Promise.allSettled(ASSETS.map((url) => cache.add(url)));
        await self.skipWaiting();
    })());
});

self.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
        const keys = await caches.keys();
        await Promise.all(keys.filter((key) => key.startsWith('event-guide-') && key !== CACHE).map((key) => caches.delete(key)));
        await self.clients.claim();
    })());
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (request.method !== 'GET' || new URL(request.url).origin !== location.origin) return;

    // Seite selbst: zuerst Netz (damit Änderungen sofort ankommen), offline aus dem Cache.
    if (request.mode === 'navigate') {
        event.respondWith((async () => {
            try {
                const response = await fetch(request);
                const cache = await caches.open(CACHE);
                cache.put('./index.html', response.clone());
                return response;
            } catch {
                return (await caches.match('./index.html')) || Response.error();
            }
        })());
        return;
    }

    // Bilder, Schrift, CSS, JS: aus dem Cache, im Hintergrund aktualisieren.
    event.respondWith((async () => {
        const cache = await caches.open(CACHE);
        const cached = await cache.match(request);
        const network = fetch(request).then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
        }).catch(() => cached);
        return cached || network;
    })());
});
