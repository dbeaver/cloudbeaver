/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { clientsClaim } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import { cleanupOutdatedCaches, matchPrecache, precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst } from 'workbox-strategies';

/// <reference lib="WebWorker" />

declare const self: ServiceWorkerGlobalScope;
const manifest = self.__WB_MANIFEST;

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

clientsClaim();
cleanupOutdatedCaches();
precacheAndRoute(manifest);

const cacheName = 'images';
const maxAgeSeconds = 30 * 24 * 60 * 60;
const maxEntries = 60;

registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries,
        maxAgeSeconds,
      }),
    ],
  }),
);
