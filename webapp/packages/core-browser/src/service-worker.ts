/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { cacheNames, clientsClaim, WorkboxPlugin } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import { addPlugins, matchPrecache, precacheAndRoute } from 'workbox-precaching';
import { getOrCreatePrecacheController } from 'workbox-precaching/utils/getOrCreatePrecacheController';
import { registerRoute } from 'workbox-routing';
import { CacheFirst } from 'workbox-strategies';

/// <reference lib="WebWorker" />

declare const self: ServiceWorkerGlobalScope;
const manifest = self.__WB_MANIFEST;

async function broadcastMessage(message: Record<string, any>) {
  const clients = await self.clients.matchAll({ includeUncontrolled: true });
  clients.forEach(client => {
    client.postMessage(message);
  });
}

addEventListener('fetch', async event => {
  if (!(event instanceof FetchEvent)) {
    return;
  }

  const { request } = event;
  const url = new URL(request.url);

  if (url.pathname == '/') {
    event.respondWith(
      (async () => {
        const preCachedResponsePromise = matchPrecache('/index.html');
        const networkResponsePromise = fetch(request, { cache: 'no-cache', method: 'HEAD' });
        try {
          // Try to fetch the request from the network.
          // If it's redirect then return it.
          const response = await networkResponsePromise;

          if (response.type == 'opaqueredirect') {
            return response;
          }
        } catch {}

        const preCachedResponse = await preCachedResponsePromise;

        return preCachedResponse ?? (await fetch(request));
      })(),
    );
  }
});

self.addEventListener('install', () => {
  self.skipWaiting();
});

function createUpdateProgressPlugin(): WorkboxPlugin {
  const precacheController = getOrCreatePrecacheController();
  let updated = 0;
  let hasPreviousCache = null as boolean | null;

  return {
    handlerWillStart: async ({ request, state }) => {
      if (state) {
        state.originalRequest = request;
      }
      if (hasPreviousCache === null) {
        hasPreviousCache = await caches.has(cacheNames.precache);

        await broadcastMessage({
          type: 'mode',
          isUpdate: hasPreviousCache,
        });
      }
    },
    cachedResponseWillBeUsed: async ({ event, cachedResponse, cacheName }) => {
      if (event.type === 'install' && cacheName === cacheNames.precache) {
        const size = Math.max(precacheController.getURLsToCacheKeys().size, 1);
        updated++;

        await broadcastMessage({
          type: 'progress',
          progress: updated / size,
        });
      }

      return cachedResponse;
    },
  };
}

addPlugins([createUpdateProgressPlugin()]);

clientsClaim();
precacheAndRoute(manifest);

registerRoute(
  ({ request }) => request.destination === 'font',
  new CacheFirst({
    cacheName: 'fonts',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 1000,
        maxAgeSeconds: 7 * 24 * 60 * 60,
      }),
    ],
  }),
);

registerRoute(
  ({ request, url }) => url.origin === self.location.origin && request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 1000,
        maxAgeSeconds: 7 * 24 * 60 * 60,
        purgeOnQuotaError: true,
      }),
    ],
  }),
);
