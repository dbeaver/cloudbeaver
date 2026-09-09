/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Subject } from 'rxjs';
import { webSocket, type WebSocketSubjectConfig } from 'rxjs/webSocket';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { EnvironmentService } from '@cloudbeaver/core-sdk';

import { longPolling } from './longPolling.js';
import { TransportSubject } from './TransportSubject.js';

vi.mock('rxjs/webSocket', () => ({
  webSocket: vi.fn(),
}));

vi.mock('./longPolling.js', () => ({
  longPolling: vi.fn(),
}));

interface TestEvent {
  id: string;
}

describe('TransportSubject', () => {
  let websocketSubject: Subject<TestEvent>;
  let pollingSubject: Subject<TestEvent>;
  let websocketConfig: WebSocketSubjectConfig<TestEvent>;
  let startPolling: () => void;

  beforeEach(() => {
    (globalThis as any)._ROOT_URI_ = '{ROOT_URI}';
    websocketSubject = new Subject();
    pollingSubject = new Subject();

    vi.mocked(webSocket).mockImplementation(config => {
      websocketConfig = config as WebSocketSubjectConfig<TestEvent>;
      return websocketSubject as never;
    });

    vi.mocked(longPolling).mockImplementation(options => {
      startPolling = () => options.startObserver?.next();
      return pollingSubject as never;
    });

    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('switches to polling when the WebSocket closes cleanly', () => {
    const transport = createTransport();
    const next = vi.fn();
    const complete = vi.fn();

    transport.subscribe({ next, complete });
    websocketSubject.complete();

    const event = { id: 'event' };
    pollingSubject.next(event);

    expect(next).toHaveBeenCalledWith(event);
    expect(complete).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledWith('WebSocket closed, switching to polling');
  });

  it('keeps switching to polling when the WebSocket errors', () => {
    const transport = createTransport();
    const next = vi.fn();

    transport.subscribe(next);
    websocketSubject.error(new Error('WebSocket failed'));

    const event = { id: 'event' };
    pollingSubject.next(event);

    expect(next).toHaveBeenCalledWith(event);
    expect(console.warn).toHaveBeenCalledWith('WebSocket failed, switching to polling');
  });

  it('sends events through polling after switching transports', () => {
    const transport = createTransport();
    const pollingNext = vi.spyOn(pollingSubject, 'next');

    transport.subscribe();
    websocketSubject.complete();

    const event = { id: 'event' };
    transport.next(event);

    expect(pollingNext).toHaveBeenCalledWith(event);
  });

  it('reports readiness for each activated transport', () => {
    const transport = createTransport();
    const ready = vi.fn();

    transport.ready$.subscribe(ready);
    transport.subscribe();

    websocketConfig.openObserver?.next(new Event('open'));
    websocketSubject.complete();
    startPolling();

    expect(ready).toHaveBeenCalledTimes(2);
  });

  it('does not activate polling during explicit teardown', () => {
    const transport = createTransport();

    transport.subscribe();
    transport.unsubscribe();

    expect(pollingSubject.observed).toBe(false);
  });

  it('propagates polling errors instead of switching again', () => {
    const transport = createTransport();
    const error = vi.fn();
    const pollingError = new Error('Polling failed');

    transport.subscribe({ error });
    websocketSubject.complete();
    pollingSubject.error(pollingError);

    expect(error).toHaveBeenCalledWith(pollingError);
  });
});

function createTransport(): TransportSubject<TestEvent> {
  return new TransportSubject<TestEvent>({ wsEndpoint: 'ws://localhost/api/ws' } as EnvironmentService);
}
