/* Built by scripts/build-pwa.mjs, never shipped with placeholders. */
const CACHE = 'leaf-shell-54ea02f5a734cf7c';
const SHELL = ["/","/manifest.webmanifest","/icons/icon-192.png","/icons/icon-512.png","/icons/apple-touch-icon.png","/icons/maskable-512.png","/assets/index-d2qry3iO.js","/assets/index-vytfETMk.css"];
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const responses = await Promise.all(SHELL.map(async url => {
      const response = await fetch(new Request(url, { cache: 'reload', credentials: 'same-origin' }));
      // Do not store a login page, redirect, error page, or partial shell as the app.
      if (!response.ok || response.redirected) throw new Error('App shell unavailable');
      if ((url === '/' || url === '/index.html') && !(await response.clone().text()).includes('data-app="leaf-reader"')) throw new Error('Unexpected HTML');
      return [url,response];
    }));
    const cache = await caches.open(CACHE);
    await Promise.all(responses.map(([url,response])=>cache.put(url,response)));
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key=>key.startsWith('leaf-shell-') && key !== CACHE).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});
// New versions wait. Only an explicit update action at the bookshelf activates one.
self.addEventListener('message', event => {
  if (event.data?.type === 'ACTIVATE_UPDATE') self.skipWaiting();
  if (event.data?.type === 'SHELL_STATUS') event.waitUntil((async()=> {
    const cache = await caches.open(CACHE);
    const ready = (await Promise.all(SHELL.map(url=>cache.match(url)))).every(Boolean);
    event.ports[0]?.postMessage({ ready, version:CACHE });
  })());
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  const isShellPage = event.request.mode === 'navigate' && (url.pathname === '/' || url.pathname === '/index.html');
  if (!isShellPage && !SHELL.includes(url.pathname)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const key = isShellPage ? '/' : url.pathname;
    const cached = await cache.match(key);
    if (cached) return cached;
    return fetch(event.request);
  })());
});
