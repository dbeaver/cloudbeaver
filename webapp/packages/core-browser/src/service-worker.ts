import { clientsClaim } from 'workbox-core';
import { cleanupOutdatedCaches, matchPrecache, precacheAndRoute } from 'workbox-precaching';

/// <reference lib="WebWorker" />

declare const self: ServiceWorkerGlobalScope;
const manifest = self.__WB_MANIFEST;

addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

addEventListener('fetch', async event => {
  if (!(event instanceof FetchEvent)) {
    return;
  }

  const { request } = event;
  const url = new URL(request.url);

  if (url.pathname == '/') {
    event.respondWith(
      (async () => {
        try {
          // Try to fetch the request from the network.
          // If it's redirect then return it.
          const response = await fetch(request, { cache: 'no-cache', method: 'HEAD' });

          if (response.type == 'opaqueredirect') {
            return response;
          }
        } catch {}

        const preCachedResponse = await matchPrecache('/index.html');

        return preCachedResponse ?? (await fetch(request));
      })(),
    );
  }
});

clientsClaim();
cleanupOutdatedCaches();
precacheAndRoute(manifest);
