/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Subject } from 'rxjs';
import * as websocket from 'rxjs/webSocket';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TicketedWebSocketSubject } from './TicketedWebSocketSubject.js';

describe('TicketedWebSocketSubject', () => {
  let socket: Subject<string>;
  let transport: TicketedWebSocketSubject<string>;

  beforeEach(() => {
    socket = new Subject<string>();
    vi.spyOn(websocket, 'webSocket').mockReturnValue(socket as never);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => Promise.resolve(new Response('a'.repeat(43)))),
    );

    transport = new TicketedWebSocketSubject({ url: 'wss://app.example/api/ws' }, 'https://app.example/api/ws-ticket');
  });

  afterEach(() => {
    transport.unsubscribe();
    socket.unsubscribe();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('obtains a ticket lazily with a non-simple same-origin request and shares the connection', async () => {
    expect(fetch).not.toHaveBeenCalled();
    const first = transport.subscribe();
    const second = transport.subscribe();
    await vi.waitFor(() => expect(socket.observed).toBe(true));

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      'https://app.example/api/ws-ticket',
      expect.objectContaining({
        method: 'POST',
        mode: 'same-origin',
        credentials: 'same-origin',
        redirect: 'error',
        headers: { 'X-CB-WebSocket-Ticket': 'request' },
      }),
    );

    expect(websocket.webSocket).toHaveBeenCalledWith(
      expect.objectContaining({
        url: `wss://app.example/api/ws?ticket=${'a'.repeat(43)}`,
      }),
    );

    first.unsubscribe();
    expect(socket.observed).toBe(true);
    second.unsubscribe();
    expect(socket.observed).toBe(false);
  });

  it('buffers outgoing events until the ticket is obtained', async () => {
    const next = vi.spyOn(socket, 'next');
    transport.subscribe();
    transport.next('pending-event');
    expect(next).not.toHaveBeenCalled();

    await vi.waitFor(() => expect(next).toHaveBeenCalledWith('pending-event'));
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('aborts ticket acquisition when the last subscriber disconnects', async () => {
    let resolve!: (response: Response) => void;
    vi.mocked(fetch).mockImplementation(
      () =>
        new Promise<Response>(done => {
          resolve = done;
        }),
    );

    const subscription = transport.subscribe();
    const options = vi.mocked(fetch).mock.calls[0]![1]!;
    subscription.unsubscribe();

    expect(options.signal?.aborted).toBe(true);
    resolve(new Response('a'.repeat(43)));
    await vi.waitFor(() => expect(websocket.webSocket).not.toHaveBeenCalled());
  });

  it('requests a fresh ticket when reconnected', async () => {
    const first = transport.subscribe();
    await vi.waitFor(() => expect(socket.observed).toBe(true));
    first.unsubscribe();
    vi.mocked(fetch).mockResolvedValue(new Response('b'.repeat(43)));
    transport.subscribe();

    await vi.waitFor(() => expect(websocket.webSocket).toHaveBeenCalledTimes(2));
    expect(websocket.webSocket).toHaveBeenLastCalledWith(
      expect.objectContaining({
        url: `wss://app.example/api/ws?ticket=${'b'.repeat(43)}`,
      }),
    );
  });

  it('does not open a socket with a malformed ticket response', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('<html>login</html>'));
    const error = vi.fn();
    transport.subscribe({ error });

    await vi.waitFor(() => expect(error).toHaveBeenCalled());
    expect(websocket.webSocket).not.toHaveBeenCalled();
  });
});
