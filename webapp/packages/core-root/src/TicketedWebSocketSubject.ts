/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Subject, type Subscriber, type Subscription } from 'rxjs';
import { webSocket, type WebSocketSubject, type WebSocketSubjectConfig } from 'rxjs/webSocket';

/**
 * Obtains a one-use, session-bound ticket before opening a browser WebSocket.
 * The ticket endpoint deliberately has no CORS support.
 */
export class TicketedWebSocketSubject<T> extends Subject<T> {
  private readonly output = new Subject<T>();
  private readonly pending: T[] = [];
  private socket: WebSocketSubject<T> | null = null;
  private connection: Subscription | null = null;
  private controller: AbortController | null = null;
  private subscribers = 0;

  constructor(
    private readonly config: WebSocketSubjectConfig<T>,
    private readonly ticketUrl: string,
  ) {
    super();
  }

  override next(value: T): void {
    if (this.socket) {
      this.socket.next(value);
    } else {
      this.pending.push(value);
    }
  }

  protected _subscribe(subscriber: Subscriber<T>): Subscription {
    this.subscribers++;
    const subscription = this.output.subscribe(subscriber);
    subscription.add(() => {
      if (--this.subscribers === 0) {
        this.stop();
      }
    });

    if (this.subscribers === 1 && !subscription.closed) {
      const controller = new AbortController();
      this.controller = controller;
      void this.connect(controller);
    }

    return subscription;
  }

  override unsubscribe(): void {
    this.stop();
    this.output.unsubscribe();
    super.unsubscribe();
  }

  private async connect(controller: AbortController): Promise<void> {
    try {
      const response = await fetch(this.ticketUrl, {
        method: 'POST',
        mode: 'same-origin',
        credentials: 'same-origin',
        redirect: 'error',
        cache: 'no-store',
        headers: { 'X-CB-WebSocket-Ticket': 'request' },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Failed to obtain WebSocket ticket, status: ${response.status}`);
      }

      const ticket = await response.text();

      if (!/^[A-Za-z0-9_-]{43}$/.test(ticket)) {
        throw new Error('Invalid WebSocket ticket response');
      }

      if (controller.signal.aborted) {
        return;
      }

      const url = new URL(this.config.url);
      url.searchParams.set('ticket', ticket);
      const socket = webSocket<T>({ ...this.config, url: url.toString() });
      this.socket = socket;
      this.connection = socket.subscribe({
        next: value => this.output.next(value),
        error: error => this.output.error(error),
        complete: () => this.output.complete(),
      });

      for (const value of this.pending.splice(0)) {
        socket.next(value);
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        this.output.error(error);
      }
    }
  }

  private stop(): void {
    this.controller?.abort();
    this.controller = null;
    this.connection?.unsubscribe();
    this.connection = null;
    this.socket = null;
    this.pending.length = 0;
  }
}
