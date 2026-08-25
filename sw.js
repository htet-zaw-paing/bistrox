const BISTROX_CACHE = 'bistrox-assets-v1';
const BISTROX_SHELL_CACHE = 'bistrox-shell-v1';

self.addEventListener('install', event => {
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('message', event => {
    if (!event.data || event.data.type !== 'CACHE_SHELL' || !event.data.url) return;
    event.waitUntil((async () => {
        try {
            const response = await fetch(event.data.url, { cache: 'reload' });
            if (response.ok) {
                const cache = await caches.open(BISTROX_SHELL_CACHE);
                await cache.put(event.data.url, response);
            }
        } catch (error) {}
    })());
});

self.addEventListener('fetch', event => {
    const request = event.request;
    if (request.method !== 'GET') return;
    const requestUrl = new URL(request.url);
    if (requestUrl.origin !== self.location.origin) return;
    event.respondWith((async () => {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) return cachedResponse;
        try {
            const networkResponse = await fetch(request);
            if (networkResponse.ok && (request.mode === 'navigate' || requestUrl.pathname.startsWith('/imgs/') || requestUrl.pathname.startsWith('/mp3/'))) {
                const cacheName = request.mode === 'navigate' ? BISTROX_SHELL_CACHE : BISTROX_CACHE;
                const cache = await caches.open(cacheName);
                await cache.put(request, networkResponse.clone());
            }
            return networkResponse;
        } catch (error) {
            if (request.mode === 'navigate') {
                const shellResponse = await caches.match('/index.html');
                if (shellResponse) return shellResponse;
            }
            return new Response('Offline resource unavailable', { status: 503, headers: { 'Content-Type': 'text/plain' } });
        }
    })());
});
