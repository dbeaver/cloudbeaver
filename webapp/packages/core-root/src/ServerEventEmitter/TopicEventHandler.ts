/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { filter, map, merge, Observable, Subject } from 'rxjs';

import { ISyncExecutor, SyncExecutor } from '@cloudbeaver/core-executor';
import type { CachedResource } from '@cloudbeaver/core-sdk';
import { compose } from '@cloudbeaver/core-utils';

import type { IServerEventCallback, IServerEventEmitter, Subscription } from './IServerEventEmitter';

export abstract class TopicEventHandler<TEvent, SourceEvent = void>
implements IServerEventEmitter<TEvent, SourceEvent> {
  readonly onInit: ISyncExecutor;
  readonly eventsSubject: Observable<TEvent>;

  private readonly serverSubject?: Observable<TEvent>;
  private readonly subject: Subject<TEvent>;
  constructor(
    private readonly topic: string,
    private readonly emitter: IServerEventEmitter<SourceEvent>
  ) {
    this.onInit = new SyncExecutor();
    this.subject = new Subject();
    this.serverSubject = this.emitter.multiplex(topic, this.map);
    this.eventsSubject = merge(this.subject, this.serverSubject);

    this.emitter.onInit.next(this.onInit);
  }

  multiplex<T = TEvent>(
    topic: string,
    mapTo: ((event: TEvent) => T) = event => event as unknown as T,
  ): Observable<T> {
    return this.emitter.multiplex(
      topic,
      compose(mapTo, this.map) as unknown as (event: SourceEvent) => T
    );
  }

  on<T = TEvent>(
    callback: IServerEventCallback<T>,
    mapTo?: (param: TEvent) => T,
    filter?: (param: TEvent) => boolean,
  ): Subscription;
  on<T = TEvent>(
    resource: CachedResource<any, T, any, any>,
    mapTo?: (param: TEvent) => T,
    filter?: (param: TEvent) => boolean,
  ): Subscription;
  on<T = TEvent>(
    resource: CachedResource<any, T, any, any> | IServerEventCallback<T>,
    mapTo: (param: TEvent) => T = event => event as unknown as T,
    filterFn: (param: TEvent) => boolean = () => true,
  ): Subscription {
    let handler: IServerEventCallback<T>;

    if (typeof resource === 'function') {
      handler = resource;
    } else {
      handler = event => {
        resource.markOutdated(event);
      };
    }

    const sub = this.eventsSubject
      .pipe(filter(filterFn), map(mapTo))
      .subscribe(handler);

    return () => {
      sub.unsubscribe();
    };
  }

  emit(event: SourceEvent): this {
    this.emitter.emit(event);
    return this;
  }

  protected abstract map(event: SourceEvent): TEvent;
}