/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { catchError, EMPTY, Observable, shareReplay, Subject, Subscriber, Subscription, take, throwError } from 'rxjs';
import { webSocket } from 'rxjs/webSocket';

import type { EnvironmentService } from '@cloudbeaver/core-sdk';
import { GlobalConstants } from '@cloudbeaver/core-utils';

import { longPolling } from './longPolling.js';

export class TransportSubject<T> extends Subject<T> {
  readonly ready$: Observable<void>;

  private ws: ReturnType<typeof webSocket<T>>;
  private poll: ReturnType<typeof longPolling<T>>;

  private ready: Subject<void>;
  private active: Subject<T>;
  private output: Subject<T>;

  private sub: Subscription | null;

  constructor(environmentService: EnvironmentService) {
    super();

    this.output = new Subject();
    this.ready = new Subject();

    this.ready$ = this.ready.pipe(take(1), shareReplay(1));

    this.sub = null;

    this.ws = webSocket<T>({
      url: environmentService.wsEndpoint,
      openObserver: { next: () => this.ready.next() },
      closeObserver: {
        next: event => {
          console.warn(`Websocket closed (${event.code}): ${event.reason}`);
        },
      },
    });

    this.poll = longPolling<T>({
      url: GlobalConstants.absoluteServiceHTTPUrl('events'),
      startObserver: { next: () => this.ready.next() },
    });

    this.active = window.WebSocket ? this.ws : this.poll;
  }

  override next(value: T): void {
    this.active.next(value);
  }

  protected _subscribe(subscriber: Subscriber<T>): Subscription {
    if (this.output.closed) {
      this.output = new Subject();
    }

    if ((!this.sub || this.sub.closed) && !this.closed) {
      this.connect();
    }

    const subscription = this.output.subscribe(subscriber);
    return subscription;
  }

  private connect() {
    if (this.sub) {
      this.sub.unsubscribe();
    }

    this.sub = this.active
      .pipe(
        catchError(err => {
          if (this.active === this.ws) {
            console.warn('WebSocket failed, switching to polling');

            this.active = this.poll;
            this.connect();
            return EMPTY;
          }

          return throwError(() => err);
        }),
      )
      .subscribe({
        next: value => this.output.next(value),
        error: err => this.output.error(err),
        complete: () => this.output.complete(),
      });
  }

  override unsubscribe(): void {
    if (this.sub) {
      this.sub.unsubscribe();
      this.sub = null;
    }

    this.ready.complete();
    this.output.complete();
    super.unsubscribe();
  }
}
