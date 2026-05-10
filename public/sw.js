self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheKeys = await caches.keys();
      await Promise.allSettled(cacheKeys.map((cacheKey) => caches.delete(cacheKey)));
      await self.registration.unregister();

      const clients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      });

      await Promise.allSettled(clients.map((client) => client.navigate(client.url)));
    })()
  );
});
