var cached = [
    "/",
    "/index.html",
    "/geohry.webmanifest.json",
    "/favicon.ico",
    "/icon.png",
    "/main.css",
    "/main.js",
    "/texts.js",
    "/ui/cz.svg",
    "/ui/earth.svg",
    "/ui/forms.css",
    "/ui/gfx.woff",
    "/ui/maps.js",
    "/ui/mapsimg.js",
    "/ui/multiplier.js",
    "/ui/nunito.woff",
    "/ui/play.js",
    "/ui/player.png",
    "/ui/qrcode.min.js",
    "/ui/sort.js",
    "/ui/sprite.js",
    "/ui/table.css",
    "/pages/qForm/CHOICE.html",
    "/pages/qForm/NUMBER.html",
    "/pages/qForm/QRCODE.html",
    "/pages/qForm/TEXT.html",
    "/pages/results/table.html",
    "/pages/capture.html",
    "/pages/dialog.html",
    "/pages/explorer.html",
    "/pages/gameAnswers.html",
    "/pages/home.html",
    "/pages/homeGame.html",
    "/pages/homeUser.html",
    "/pages/install.html",
    "/pages/loginGame.html",
    "/pages/loginUser.html",
    "/pages/offlineData.html",
    "/pages/playDemo.html",
    "/pages/playEnd.html",
    "/pages/playGame.html",
    "/pages/playHome.html",
    "/pages/playIntro.html",
    "/pages/playQuestion.html",
    "/pages/playResults.html",
    "/pages/playStart.html",
    "/pages/qrcode.html",
    "/pages/question.html",
    "/pages/questions.html",
    "/pages/registerGame.html",
    "/pages/registerUser.html",
    "/pages/userAnswers.html"
];

cached = [];

self.addEventListener('install', event => {
    const preCache = async () => {
        const cache = await caches.open('store');
        return cache.addAll(cached.map(i => new Request(i, {cache: "reload"})));
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
