/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Connectable, connectable, filter, map, merge, Observable, Subject } from 'rxjs';

import { ISyncExecutor, SyncExecutor } from '@cloudbeaver/core-executor';
import type { CachedResource } from '@cloudbeaver/core-sdk';
import { compose } from '@cloudbeaver/core-utils';

import type { IBaseServerEvent, IServerEventCallback, IServerEventEmitter, Subscription } from './IServerEventEmitter';

interface ISubscribedResourceInfo {
  listeners: number;
  subscription: Subscription;
}

export abstract class TopicEventHandler<
  TEvent extends IBaseServerEvent<TEventID, TTopic>,
  SourceEvent extends IBaseServerEvent<TEventID, TTopic>,
  TEventID extends string = string,
  TTopic extends string = string
>
implements IServerEventEmitter<TEvent, SourceEvent, TEventID, TTopic> {
  readonly onInit: ISyncExecutor;
  readonly eventsSubject: Connectable<TEvent>;

  private subscription: Subscription | null;
  private readonly activeResources: Array<CachedResource<any, any, any, any, any>>;
  private readonly subscribedResources: Map<CachedResource<any, any, any, any, any>, ISubscribedResourceInfo>;
  private readonly serverSubject?: Observable<TEvent>;
  private readonly subject: Subject<TEvent>;
  constructor(
    private readonly topic: string,
    private readonly emitter: IServerEventEmitter<SourceEvent>
  ) {
    this.onInit = new SyncExecutor();
    this.subject = new Subject();
    this.activeResources = [];
    this.subscribedResources = new Map();
    this.subscription = null;
    this.serverSubject = this.emitter.multiplex(topic, this.map);
    this.eventsSubject = connectable(
      merge(this.subject, this.serverSubject),
      {
        connector: () => new Subject(),
        resetOnDisconnect: false, // used because subscribers won't receive events after reconnect otherwise
      }
    );

    this.emitter.onInit.next(this.onInit);
  }

  multiplex<T = TEvent>(
    topicId: TTopic,
    mapTo: ((event: TEvent) => T) = event => event as unknown as T,
  ): Observable<T> {
    return this.emitter.multiplex(
      topicId,
      compose(mapTo, this.map) as unknown as (event: SourceEvent) => T
    );
  }

  onEvent<T = TEvent>(
    id: TEventID,
    callback: IServerEventCallback<T>,
    mapTo: (event: TEvent) => T = event => event as unknown as T,
    resource?: CachedResource<any, any, any, any, any>,
  ): Subscription {
    if (resource) {
      this.registerResource(resource);
    }

    const sub = this.eventsSubject
      .pipe(filter(e => e.id === id), map(mapTo))
      .subscribe(callback);

    return () => {
      sub.unsubscribe();

      if (resource) {
        this.removeResource(resource);
      }
    };
  }

  on<T = TEvent>(
    callback: IServerEventCallback<T>,
    mapTo: (param: TEvent) => T = event => event as unknown as T,
    filterFn: (param: TEvent) => boolean = () => true,
    resource?: CachedResource<any, any, any, any, any>,
  ): Subscription {

    if (resource) {
      this.registerResource(resource);
    }

    const sub = this.eventsSubject
      .pipe(filter(filterFn), map(mapTo))
      .subscribe(callback);

    return () => {
      sub.unsubscribe();

      if (resource) {
        this.removeResource(resource);
      }
    };
  }

  emit<T extends SourceEvent>(event: T): this {
    this.emitter.emit(event);
    return this;
  }

  private resourceUseHandler(resource: CachedResource<any, any, any, any, any>) {
    const index = this.activeResources.indexOf(resource);

    if (index !== -1) {
      if (!resource.isResourceInUse) {
        this.removeActiveResource(resource);
      }
    } else {
      if (resource.isResourceInUse) {
        this.activeResources.push(resource);

        if (!this.subscription) {
          // console.log('Subscribe: ', resource.getName());
          const sub = this.eventsSubject.connect();
          this.subscription = () => sub.unsubscribe();
        }
      }
    }
  }

  private removeActiveResource(resource: CachedResource<any, any, any, any, any>) {
    this.activeResources.splice(this.activeResources.indexOf(resource), 1);

    if (this.activeResources.length === 0) {
      // console.log('Unsubscribe: ', resource.getName());
      this.subscription?.();
      this.subscription = null;
    }
  }

  private registerResource(resource: CachedResource<any, any, any, any, any>): void {
    let info = this.subscribedResources.get(resource);

    if (!info) {
      info = {
        listeners: 0,
        subscription: this.resourceUseHandler.bind(this, resource),
      };
      this.subscribedResources.set(resource, info);
      resource.onUse.addHandler(info.subscription);
      // console.log('Register: ', resource.getName());
    }

    info.listeners++;
  }

  private removeResource(resource: CachedResource<any, any, any, any, any>): void {
    const info = this.subscribedResources.get(resource);

    if (info) {
      info.listeners--;

      if (info.listeners === 0) {
        this.removeActiveResource(resource);
        resource.onUse.removeHandler(info.subscription);
        this.subscribedResources.delete(resource);
        // console.log('Unregister: ', resource.getName());
      }
    }
  }

  protected abstract map(event: SourceEvent): TEvent;
}