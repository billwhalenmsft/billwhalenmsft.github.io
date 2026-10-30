const CACHE = "tokenomics-v3";
const CHROME = ["/assets/site-theme.js", "/assets/site-chrome.js", "/assets/site-chrome.css"];
const FILES = ["./", "./index.html", "./app.js", "./calculate.js", "./data/rates.json", ...CHROME];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.filter((key) => key.startsWith("tokenomics-") && key !== CACHE).map((key) => caches.delete(key))
  )).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin
    || (!url.pathname.startsWith(new URL("./", self.location).pathname) && !CHROME.includes(url.pathname))) return;
  event.respondWith(fetch(event.request).then((response) => {
    if (response.ok) {
      const copy = response.clone();
      event.waitUntil(caches.open(CACHE).then((cache) => cache.put(event.request, copy)));
    }
    return response;
  }).catch(async () => {
    const cached = await caches.match(event.request, { ignoreSearch: true });
    if (cached) return cached;
    throw new Error("This planner resource has not been cached.");
  }));
});
