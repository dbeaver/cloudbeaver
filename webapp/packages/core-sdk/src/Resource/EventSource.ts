/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { IExecutorHandler, ISyncExecutor, SyncExecutor } from '@cloudbeaver/core-executor';
import { flat, uuid } from '@cloudbeaver/core-utils';

import type { CachedResource } from './CachedResource';

export interface IEventData<T> {
  name: string;
  data: T;
}

interface IListenerInfo {
  id: string;
  names: string[];
  handler: IExecutorHandler<IEventData<any>>;
}

export type EventSourceCallback<T> = (name: string, data: T) => any;
export interface IEventSource<TEvent, TEmit = void> {
  on<T>(
    name: string | string[],
    callback: EventSourceCallback<T>,
    mapTo: (param: IEventData<TEvent>) => IEventData<T>,
    filter?: (param: IEventData<TEvent>) => boolean,
  ): string;
  off(id: string): void;
  emit(name: string, data: TEmit): this;
}

const DEFAULT_INTERVAL = 1000;

export abstract class EventSource<TEvent, TEmit = void> implements IEventSource<TEvent, TEmit> {
  onSubscribe: ISyncExecutor;
  onEvent: ISyncExecutor<IEventData<TEvent>>;
  onEmit: ISyncExecutor<IEventData<TEmit>>;
  onStop: ISyncExecutor;

  get listeningNames(): string[] {
    return Array.from(
      new Set(
        flat(Array.from(
          this.listeners.values())
          .map(info => info.names)
        )
      )
    );
  }

  private readonly listeners: Map<string, IListenerInfo>;
  private listening: boolean;
  private readonly interval: number;
  constructor(interval?: number) {
    this.onSubscribe = new SyncExecutor();
    this.onEvent = new SyncExecutor();
    this.onEmit = new SyncExecutor();
    this.onStop = new SyncExecutor();
    this.listeners = new Map();
    this.interval = interval ?? DEFAULT_INTERVAL;
    this.listening = false;
  }

  on<T>(
    name: string | string[],
    callback: EventSourceCallback<T>,
    mapTo: (param: IEventData<TEvent>) => IEventData<T>,
    filter?: (param: IEventData<TEvent>) => boolean,
  ): string;
  on<T>(
    name: string | string[],
    resource: CachedResource<any, T, any, any>,
    mapTo: (param: IEventData<TEvent>) => T,
    filter?: (param: IEventData<TEvent>) => boolean,
  ): string;
  on<T>(
    name: string | string[],
    resource: EventSourceCallback<T> | CachedResource<any, T, any, any>,
    mapTo: (param: IEventData<TEvent>) => T | IEventData<T>,
    filter?: (param: IEventData<TEvent>) => boolean,
  ): string {
    name = Array.isArray(name) ? name : [name];
    let handler: IExecutorHandler<IEventData<TEvent>>;

    if (typeof resource === 'function') {
      handler = event => {
        if (!filter || filter(event)) {
          const mapped = (mapTo as (param: IEventData<TEvent>) => IEventData<T>)(event);
          resource(mapped.name, mapped.data);
        }
      };
    } else {
      handler = event => {
        if (!filter || filter(event)) {
          resource.markOutdated((mapTo as (param: IEventData<TEvent>) => T)(event));
        }
      };
    }

    const id = this.addListener(name, handler);

    if (!this.listening) {
      this.listen();
    }

    return id;
  }

  off(id: string) {
    const info = this.listeners.get(id);

    if (info) {
      this.onEvent.removeHandler(info.handler);
      this.listeners.delete(id);
    }

    if (this.listeners.size === 0) {
      this.stop();
    }
  }

  emit(name: string, data: TEmit): this {
    if (!this.listening) {
      this.listen();
    }

    this.sender(name, data);
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
    this.onStop.execute();
    this.idle();
  }

  event(name: string, data: TEvent) {
    this.onEvent.execute({ name, data });
  }

  updateNames(id: string, name: string | string[]) {
    const info = this.listeners.get(id);

    if (info) {
      info.names = Array.isArray(name) ? name : [name];
      this.onSubscribe.execute();
    }
  }

  private addListener(names: string[], handler: IExecutorHandler<IEventData<TEvent>>): string {
    const id = uuid();

    const info: IListenerInfo = {
      id,
      names,
      handler(data, contexts) {
        if (this.names.includes(data.name)) {
          return handler(data, contexts);
        }
      },
    };
    info.handler = info.handler.bind(info);

    this.listeners.set(id, info);
    this.onEvent.addHandler(info.handler);
    this.onSubscribe.execute();
    return id;
  }

  protected abstract listener(): Promise<void>;
  protected abstract sender(event: string, data: TEmit): Promise<void>;
  protected abstract idle(): void;
}