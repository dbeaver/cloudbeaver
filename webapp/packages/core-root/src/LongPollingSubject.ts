/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { Subscription, Subscriber, NextObserver } from 'rxjs';
import { Subject } from 'rxjs/internal/Subject';

import type { ISessionEvent } from './SessionEventSource.js';

export interface ILongPollingOptions {
  url: string;
  startObserver?: NextObserver<void>;
  stopObserver?: NextObserver<void>;
}

interface IPollResponse {
  events: ISessionEvent[];
}

export class LongPollingSubject<T> extends Subject<T> {
  readonly options: ILongPollingOptions;

  private output: Subject<T>;
  private refCount = 0;
  private isPolling: boolean;
  private abortController: AbortController | null;

  constructor(options: ILongPollingOptions) {
    super();

    this.options = options;
    this.isPolling = false;
    this.abortController = null;

    this.output = new Subject();
  }

  override next(value: T): void {
    this.send(value).catch(exception => {
      this.output.error(exception);
    });
  }

  private async send(data: T): Promise<void> {
    const response = await fetch(this.options.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to send event, status: ${response.status}`);
    }
  }

  protected _subscribe(subscriber: Subscriber<T>): Subscription {
    this.refCount++;

    if (this.output.closed) {
      this.output = new Subject();
    }

    if (!this.isPolling) {
      this.startPolling();
    }

    const subscription = this.output.subscribe(subscriber);

    subscriber.add(() => {
      this.refCount--;

      if (this.refCount === 0) {
        this.stopPolling();
      }
    });

    return subscription;
  }

  private startPolling() {
    if (this.isPolling) {
      return;
    }

    this.isPolling = true;
    this.poll();

    if (this.options.startObserver) {
      this.options.startObserver.next();
    }
  }

  private stopPolling() {
    if (!this.isPolling) {
      return;
    }

    this.isPolling = false;

    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    if (this.options.stopObserver) {
      this.options.stopObserver.next();
    }
  }

  /** 25s long poll */
  private async poll() {
    if (!this.isPolling) {
      return;
    }

    this.abortController = new AbortController();

    try {
      const response = await fetch(this.options.url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        credentials: 'include',
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`Failed to poll events, status: ${response.status}`);
      }

      const data: IPollResponse | null = await response.json().catch(() => null);

      if (Array.isArray(data?.events)) {
        for (const event of data.events) {
          this.output.next(event as T);
        }
      }

      this.poll();
    } catch (exception) {
      if (exception instanceof Error && exception.name === 'AbortError') {
        return;
      }

      this.output.error(exception);
    }
  }
}
