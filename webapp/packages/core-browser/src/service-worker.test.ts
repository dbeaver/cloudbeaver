/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import * as workboxCore from 'workbox-core';
import * as precaching from 'workbox-precaching';
import * as routing from 'workbox-routing';

class TestFetchEvent {
  readonly respondWith = vi.fn<(response: Promise<Response>) => void>();

  constructor(readonly request: Request) {}
}

describe('service worker root requests', () => {
  const fetchMock = vi.fn<typeof fetch>();
  const matchPrecache = vi.spyOn(precaching, 'matchPrecache');
  const addEventListener = vi.fn<(type: string, listener: (event: TestFetchEvent) => void) => void>();
  let handleFetch: (event: TestFetchEvent) => void;

  beforeAll(async () => {
    vi.spyOn(workboxCore, 'clientsClaim').mockImplementation(() => {});
    vi.spyOn(precaching, 'addPlugins').mockImplementation(() => {});
    vi.spyOn(precaching, 'precacheAndRoute').mockImplementation(() => {});
    vi.spyOn(routing, 'registerRoute').mockImplementation(
      () =>
        new routing.Route(
          () => false,
          () => Promise.resolve(Response.error()),
        ),
    );
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('FetchEvent', TestFetchEvent);
    vi.stubGlobal('addEventListener', addEventListener);

    await import('./service-worker.js');
    handleFetch = addEventListener.mock.calls.find(([type]) => type === 'fetch')![1];
  });

  beforeEach(() => {
    fetchMock.mockReset();
    matchPrecache.mockReset();
  });

  afterAll(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function requestRoot() {
    const event = new TestFetchEvent(new Request('https://localhost/'));
    handleFetch(event);
    return event.respondWith.mock.calls[0]![0];
  }

  it('returns a network error response instead of rejecting when offline without a precached page', async () => {
    matchPrecache.mockResolvedValue(undefined);
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(requestRoot()).resolves.toMatchObject({ type: 'error' });
  });

  it('serves the precached page when the network is unavailable', async () => {
    const cached = new Response('cached index');
    matchPrecache.mockResolvedValue(cached);
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(requestRoot()).resolves.toBe(cached);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('handles a failed page fetch even when the HEAD request succeeds', async () => {
    matchPrecache.mockResolvedValue(undefined);
    fetchMock.mockResolvedValueOnce(new Response(null)).mockRejectedValueOnce(new TypeError('Failed to fetch'));

    await expect(requestRoot()).resolves.toMatchObject({ type: 'error' });
  });

  it('serves the network page when only the HEAD request fails', async () => {
    const response = new Response('network index');
    matchPrecache.mockResolvedValue(undefined);
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch')).mockResolvedValueOnce(response);

    await expect(requestRoot()).resolves.toBe(response);
  });

  it('preserves authentication redirects instead of serving the precached page', async () => {
    const redirect = new Response(null);
    Object.defineProperty(redirect, 'type', { value: 'opaqueredirect' });
    matchPrecache.mockResolvedValue(new Response('cached index'));
    fetchMock.mockResolvedValue(redirect);

    await expect(requestRoot()).resolves.toBe(redirect);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('fetches the page when it is not precached', async () => {
    const response = new Response('network index');
    matchPrecache.mockResolvedValue(undefined);
    fetchMock.mockResolvedValueOnce(new Response(null)).mockResolvedValueOnce(response);

    await expect(requestRoot()).resolves.toBe(response);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('preserves HTTP error responses from the server', async () => {
    const response = new Response('Unavailable', { status: 503 });
    matchPrecache.mockResolvedValue(undefined);
    fetchMock.mockResolvedValueOnce(new Response(null)).mockResolvedValueOnce(response);

    await expect(requestRoot()).resolves.toBe(response);
  });
});
