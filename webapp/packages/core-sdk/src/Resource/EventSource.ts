/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ISyncExecutor, SyncExecutor } from '@cloudbeaver/core-executor';

import type { CachedResource } from './CachedResource';

export type EventSourceCallback<T> = (event: T) => any;
export interface IEventSource<TEvent> {
  on<T>(
    resource: EventSourceCallback<T>,
    mapTo: (param: TEvent) => T,
    filter?: (param: TEvent) => boolean,
  ): this;
}

const DEFAULT_INTERVAL = 1000;

export abstract class EventSource<TEvent> implements IEventSource<TEvent> {
  onEvent: ISyncExecutor<TEvent>;

  private listening: boolean;
  private readonly interval: number;
  constructor(interval?: number) {
    this.onEvent = new SyncExecutor();
    this.interval = interval ?? DEFAULT_INTERVAL;
    this.listening = false;
  }

  on<T>(
    resource: EventSourceCallback<T>,
    mapTo: (param: TEvent) => T,
    filter?: (param: TEvent) => boolean,
  ): this;
  on<T>(
    resource: CachedResource<any, T, any, any>,
    mapTo: (param: TEvent) => T,
    filter?: (param: TEvent) => boolean,
  ): this;
  on<T>(
    resource: EventSourceCallback<T> | CachedResource<any, T, any, any>,
    mapTo: (param: TEvent) => T,
    filter?: (param: TEvent) => boolean,
  ): this {
    if (typeof resource === 'function') {
      this.onEvent.addHandler(event => {
        if (!filter || filter(event)) {
          resource(mapTo(event));
        }
      });
    } else {
      this.onEvent.addHandler(event => {
        if (!filter || filter(event)) {
          resource.markOutdated(mapTo(event));
        }
      });
    }

    if (!this.listening) {
      this.listen();
    }

    return this;
  }

  listen() {
    if (this.listening) {
      console.warn('Already listening events');
      return;
    }

    this.listening = true;
    let failedRequests = 0;
    let interval = this.interval;

    const iteration = async () => {
      try {
        await this.listener();
        failedRequests = 0;
      } catch (exception: any) {
        console.error(exception);
        failedRequests++;
      }

      interval = this.interval * Math.min((failedRequests || 1), 10);

      if (this.listening) {
        setTimeout(iteration, interval);
      }
    };

    iteration();
  }

  stop() {
    this.listening = false;
  }

  event(event: TEvent) {
    this.onEvent.execute(event);
  }

  protected abstract listener(): Promise<void>;
}