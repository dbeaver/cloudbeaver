/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { IExecutorHandler, ISyncExecutor, SyncExecutor } from '@cloudbeaver/core-executor';
import { uuid } from '@cloudbeaver/core-utils';

import type { CachedResource } from './CachedResource';
import type { IEventSource, EventSourceCallback, IEventData } from './EventSource';

interface ISubscriberInfo {
  id: string;
  handler: IExecutorHandler<IEventData<any>>;
}

export abstract class ResourceEventHandler<TEvent, SourceEvent = void> {
  onSubscribe: ISyncExecutor;
  onEvent: ISyncExecutor<IEventData<TEvent>>;

  private readonly listeners: Map<string, ISubscriberInfo>;
  private subscriptionId: string | null;
  constructor(
    private readonly names: string[],
    private readonly source?: IEventSource<SourceEvent>
  ) {
    this.onSubscribe = new SyncExecutor();
    this.onEvent = new SyncExecutor();
    this.subscriptionId = null;
    this.listeners = new Map();
  }

  on<T>(
    callback: EventSourceCallback<T>,
    mapTo: (param: IEventData<TEvent>) => T,
    filter?: (param: IEventData<TEvent>) => boolean,
  ): string;
  on<T>(
    resource: CachedResource<any, T, any, any>,
    mapTo: (param: IEventData<TEvent>) => T,
    filter?: (param: IEventData<TEvent>) => boolean,
  ): string;
  on<T>(
    resource: CachedResource<any, T, any, any> | EventSourceCallback<T>,
    mapTo: (param: IEventData<TEvent>) => T,
    filter?: (param: IEventData<TEvent>) => boolean,
  ): string {
    let handler: IExecutorHandler<IEventData<TEvent>>;

    if (typeof resource === 'function') {
      handler = event => {
        if (!filter || filter(event)) {
          resource(event.name, mapTo(event));
        }
      };
    } else {
      handler = event => {
        if (!filter || filter(event)) {
          resource.markOutdated(mapTo(event));
        }
      };
    }

    const id = this.addListener(handler);

    if (this.subscriptionId === null && this.source) {
      this.subscriptionId = this.source.on(
        this.names,
        this.event.bind(this),
        this.map.bind(this),
        this.filter.bind(this)
      );
    }

    return id;
  }

  off(id: string): void {
    const info = this.listeners.get(id);

    if (info) {
      this.onEvent.removeHandler(info.handler);
      this.listeners.delete(id);
    }

    if (this.listeners.size === 0) {
      this.stop();
    }
  }

  event(name: string, data: TEvent) {
    this.onEvent.execute({ name, data });
  }

  private stop() {
    if (this.source && this.subscriptionId !== null) {
      this.source.off(this.subscriptionId);
      this.subscriptionId = null;
    }
  }

  private addListener(handler: IExecutorHandler<IEventData<TEvent>>): string {
    const id = uuid();

    const info: ISubscriberInfo = { id, handler };
    info.handler = info.handler.bind(info);

    this.listeners.set(id, info);
    this.onEvent.addHandler(info.handler);
    this.onSubscribe.execute();
    return id;
  }

  abstract map(event: IEventData<SourceEvent>): IEventData<TEvent>;
  abstract filter(event: IEventData<SourceEvent>): boolean;
}