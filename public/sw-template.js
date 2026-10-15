/* Hizmet çalışanı şablonu. scripts/build-sw.mjs derleme sonunda dist/sw.js üretir
   (önbellek adı ve dosya listesi sabitlerini doldurur). Bu dosya doğrudan kullanılmaz. */
const CACHE = '__CACHE__';
const PRECACHE = __PRECACHE__;
const OFFLINE_URL = '/offline/';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE.map((u) => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('lepistes-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

async function fromCache(url) {
  const cache = await caches.open(CACHE);
  const u = new URL(url, location.origin);
  const candidates = [u.pathname];
  if (!/\.[a-z0-9]+$/i.test(u.pathname) && !u.pathname.endsWith('/')) candidates.push(u.pathname + '/');
  for (const c of candidates) {
    const hit = await cache.match(c);
    if (hit) return hit;
  }
  return undefined;
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  if (req.mode === 'navigate') {
    // Ağ önce (güncel içerik), 3 sn içinde gelmezse önbellek, o da yoksa çevrimdışı sayfası.
    event.respondWith(
      (async () => {
        try {
          const ctl = new AbortController();
          const timer = setTimeout(() => ctl.abort(), 3000);
          const res = await fetch(req, { signal: ctl.signal });
          clearTimeout(timer);
          if (res.ok) return res;
          return (await fromCache(req.url)) || res;
        } catch {
          return (await fromCache(req.url)) || (await fromCache(OFFLINE_URL)) || Response.error();
        }
      })(),
    );
    return;
  }

  // Diğer dosyalar: önbellek önce, yoksa ağ.
  event.respondWith(
    (async () => {
      const hit = await fromCache(req.url);
      if (hit) return hit;
      return fetch(req);
    })(),
  );
});
