// Offline support: app files are cached; pages try the network first so updates arrive.
// Only this app's own old caches are removed (other apps share the hafiz123cm.github.io origin).
const PREFIX = "jurnal-rm-v";
const CACHE = PREFIX + "3";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icons/cat-180.png", "icons/cat-192.png", "icons/cat-512.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.indexOf(PREFIX) === 0 && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then(res => {
      const copy = res.clone(); caches.open(CACHE).then(c => c.put("index.html", copy)); return res;
    }).catch(() => caches.match("index.html")));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    if (res.ok || res.type === "opaque") { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  })));
});
// Tapping a reminder opens the app on the Jadual tab.
self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({type: "window", includeUncontrolled: true}).then(list => {
    for (const c of list) { if ("focus" in c) { c.navigate && c.url.indexOf("#jadual") < 0 && c.navigate("./#jadual").catch(() => {}); return c.focus(); } }
    return self.clients.openWindow("./#jadual");
  }));
});
