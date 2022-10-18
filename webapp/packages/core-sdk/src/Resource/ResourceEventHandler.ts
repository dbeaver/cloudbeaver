/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ISyncExecutor, SyncExecutor } from '@cloudbeaver/core-executor';

import type { CachedResource } from './CachedResource';
import type { IEventSource, EventSourceCallback } from './EventSource';

export abstract class ResourceEventHandler<TEvent, SourceEvent = void> implements IEventSource<TEvent> {
  onEvent: ISyncExecutor<TEvent>;

  private subscribed: boolean;
  constructor(private readonly source?: IEventSource<SourceEvent>) {
    this.onEvent = new SyncExecutor();
    this.subscribed = false;
  }

  on<T>(
    resource: EventSourceCallback<T>,
    mapTo: (param: TEvent) => T,
    filter?: (param: TEvent) => boolean,
  ): void;
  on<T>(
    resource: CachedResource<any, T, any, any>,
    mapTo: (param: TEvent) => T,
    filter?: (param: TEvent) => boolean,
  ): void;
  on<T>(
    resource: CachedResource<any, T, any, any> | EventSourceCallback<T>,
    mapTo: (param: TEvent) => T,
    filter?: (param: TEvent) => boolean,
  ): void {
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

    if (!this.subscribed) {
      this.subscribed = true;
      this.source?.on(this.event.bind(this), this.map.bind(this), this.filter.bind(this));
    }
  }

  event(event: TEvent) {
    this.onEvent.execute(event);
  }

  abstract map(event: SourceEvent): TEvent;
  abstract filter(event: SourceEvent): boolean;
}