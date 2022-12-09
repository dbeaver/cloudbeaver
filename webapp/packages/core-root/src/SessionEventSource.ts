/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { filter, map, merge, Observable, retry, RetryConfig, Subject } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';

import { injectable } from '@cloudbeaver/core-di';
import { ISyncExecutor, SyncExecutor } from '@cloudbeaver/core-executor';
import {
  GraphQLService,
  CbEvent,
  CbEventType as SessionEventType,
  EnvironmentService,
} from '@cloudbeaver/core-sdk';

import type { IServerEventCallback, IServerEventEmitter, Subscription } from './ServerEventEmitter/IServerEventEmitter';

export { SessionEventType };

export interface ISessionEvent {
  type: string;
  topic?: string;
  [key: string]: any;
}

export interface ITopicSubEvent extends ISessionEvent {
  type: 'topic:subscribe' | 'topic:unsubscribe';
  topic: string;
}

const retryInterval = 5000;

const retryConfig: RetryConfig = {
  delay: 3000,
};

@injectable()
export class SessionEventSource implements IServerEventEmitter<ISessionEvent> {
  readonly eventsSubject: Observable<ISessionEvent>;
  readonly onInit: ISyncExecutor;

  private readonly closeSubject: Subject<CloseEvent>;
  private readonly openSubject: Subject<Event>;
  private readonly subject: WebSocketSubject<ISessionEvent>;
  private readonly oldEventsSubject: Subject<ISessionEvent>;
  private listening: boolean;

  constructor(
    private readonly environmentService: EnvironmentService,
    private readonly graphQLService: GraphQLService
  ) {
    this.onInit = new SyncExecutor();
    this.oldEventsSubject = new Subject();
    this.closeSubject = new Subject();
    this.openSubject = new Subject();
    this.listening = false;
    this.subject = webSocket({
      url: environmentService.wsEndpoint,
      closeObserver: this.closeSubject,
      openObserver: this.openSubject,
    });

    this.closeSubject.subscribe(() => {
      this.listen();
    });

    this.openSubject.subscribe(() => {
      this.listening = false;
      this.onInit.execute();
    });

    this.eventsSubject = merge(this.oldEventsSubject, this.subject);
  }

  on<T = ISessionEvent>(
    callback: IServerEventCallback<T>,
    mapTo: (event: ISessionEvent) => T = e => e as T,
    filterFn: (event: ISessionEvent) => boolean = () => true,
  ): Subscription {
    const sub = this.eventsSubject
      .pipe(filter(filterFn), map(mapTo))
      .subscribe(callback);

    return () => {
      sub.unsubscribe();
    };
  }

  multiplex<T = ISessionEvent>(
    topic: string,
    mapTo: ((event: ISessionEvent) => T)  = e => e as T
  ): Observable<T> {
    return merge(
      this.subject.multiplex(
        () => ({ type: 'topic:subscribe', topic } as ITopicSubEvent),
        () => ({ type: 'topic:unsubscribe', topic } as ITopicSubEvent),
        event => event.topic === topic
      ),
      this.oldEventsSubject,
    ).pipe(map(mapTo));
  }

  emit(event: ISessionEvent): this {
    this.subject.next(event);
    return this;
  }

  protected async listener(): Promise<void> {
    const { events } = await this.graphQLService.sdk.getSessionEvents({
      maxEntries: 1000,
    });

    for (const { eventType: type, ...rest } of events) {
      this.oldEventsSubject.next({ type, ...rest });
    }
  }

  private listen() {
    if (this.listening) {
      console.warn('Already listening events');
      return;
    }

    this.listening = true;
    let failedRequests = 0;
    let interval = retryInterval;

    const iteration = async () => {
      try {
        await this.listener();
        failedRequests = 0;
      } catch (exception: any) {
        console.error(exception);
        failedRequests++;
      }

      interval = retryInterval * Math.min((failedRequests || 1), 10);

      if (this.listening) {
        setTimeout(iteration, interval);
      }
    };

    iteration();
  }
}
