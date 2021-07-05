var cached = [
    "/",
    "/geohry.webmanifest.json",
    "/favicon.ico",
    "/icon.png",
    "/ui/earth.svg",
    "/ui/nunito.woff"
];

self.addEventListener('install', event => {
    const preCache = async () => {
        const cache = await caches.open('store');
        return cache.addAll(cached);
    };
    event.waitUntil(preCache());
    self.cacheReady = true;
    console.log("Cache was updated");
});


self.addEventListener('fetch', e => {
    e.respondWith(
        caches.match(e.request).then(response => response || fetch(e.request))
    );
});
